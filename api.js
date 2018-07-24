const express = require('express');
const bodyParser = require('body-parser')
const md = require("./metadata");

module.exports = function(redis, conf) {
  const retry = conf.long_polling && conf.long_polling.retry || 10;
  const interval = conf.long_polling && conf.long_polling.interval || 500;

  function sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  }

  var app = express();
  app.use(bodyParser.json({
    limit: "10mb"
  }));

  app.post("/api/v1/topics/:topic", async function(req, res) {
    var body = JSON.parse(JSON.stringify(req.body));
    var messages = Array.isArray(body) ? body : [body];
    var metadata = req.query.metadata || (conf.metadata && conf.metadata.list) || "";
    var metadata_field = (conf.metadata && conf.metadata.field_name) || "metadata";
    messages
      .map(m => md.add(m, metadata, req, res, metadata_field))
      .map(m => JSON.stringify(m))
      .map(m => redis.enqueue(req.params.topic, m));
    var result = await Promise.all(messages);
    if (result.length == 1) result = result[0];
    res.status(200).json(result);
  });


  app.get("/api/v1/queues/:queue/:consumer", async function(req, res) {
    var result = null;
    for (var i = 0; i < retry; i++) {
      result = JSON.parse(await redis.dequeue(req.params.queue, req.params.consumer));
      if (result) break;
      await sleep(interval);
    }
    res.status(result ? 200 : 204).json(result);
  });

  app.listen(conf.port, function() {
    console.log("mb started at", new Date(), "on port", conf.port);
  });
}