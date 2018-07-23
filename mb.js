const conf = require('./conf.json');
const metadata_functions = require("./metadata-functions")
const express = require('express');
const redis = new require('ioredis')(conf.redis || {});
const bodyParser = require('body-parser')
const fs = require('fs');

redis.defineCommand("enqueue", {
  numberOfKeys: 0,
  lua: fs.readFileSync("lua/enqueue.lua", "utf-8")
});

redis.defineCommand("dequeue", {
  numberOfKeys: 0,
  lua: fs.readFileSync("lua/dequeue.lua", "utf-8")
});

if (conf.setup) {
  redis.defineCommand("setup", {
    numberOfKeys: 0,
    lua: fs.readFileSync(conf.setup, "utf-8")
  });
  redis.setup();
}

const app_port = process.env.app_port || 8080;
const app_host = process.env.app_host || '127.0.0.1';

const retry = conf.long_polling && conf.long_polling.retry || 10;
const interval = conf.long_polling && conf.long_polling.interval || 500;

console.log(JSON.stringify(conf, null, 4));

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

var app = express();
app.use(bodyParser.json(conf.body_parser || {
  limit: "10mb"
}));

function addMetaData(message, metadata, req, res) {
  Object.keys(metadata_functions)
    .filter(e => (metadata == "all" || metadata.indexOf(e) != -1))
    .reduce((message, k) => {
      return metadata_functions[k](message, req, res)
    }, message);
  return message;
}

app.post("/topics/:topic", async function(req, res) {
  var body = JSON.parse(JSON.stringify(req.body));
  var messages = Array.isArray(body) ? body : [body];
  var metadata = req.query.metadata || conf.metadata || "";
  messages
    .map(m => addMetaData(m, metadata, req, res))
    .map(m => JSON.stringify(m))
    .map(m => redis.enqueue(req.params.topic, m));
  res.status(200).send(await Promise.all(messages));
});

app.get("/queues/:queue/:consumer", async function(req, res) {
  var result = null;
  for (var i = 0; i < retry; i++) {
    result = JSON.parse(await redis.dequeue(req.params.queue, req.params.consumer));
    if (result) break;
    await sleep(interval);
  }
  if (result) res.status(200).json(result);
  else res.status(204).send("no data");
});

app.listen(app_port, function() {
  console.log("mb started at", new Date());
});