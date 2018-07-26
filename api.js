const express = require('express');
const bodyParser = require('body-parser')
const app = express();
var engine = null;
app.use(bodyParser.json({
  limit: "10mb"
}));

app.post("/api/v1/topics/:topic", async function(req, res) {
  var params = Object.assign({}, req.query, req.headers)
  var messages_with_meta = await engine.enqueue(req.params.topic, req.body, params);
  var result = {
    "added": messages_with_meta.length
  }
  if (req.query.list != "false") result["messages_with_meta"] = messages_with_meta;

  res.status(200).json(result);
});

app.get("/api/v1/queues/:queue/:consumer", async function(req, res) {
  var result = await engine.dequeue(req.params.queue, req.params.consumer);
  res.status(result ? 200 : 204).json(result);
});

module.exports = function(redis, conf) {
  engine = require("./engine")(redis, conf);
  app.listen(conf.port, function() {
    console.log("mb started at", new Date(), "on port", conf.port);
  });
}