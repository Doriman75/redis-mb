const express = require('express');
const bodyParser = require('body-parser')
const app = express();
var engine = null;
app.use(bodyParser.json({ limit: "100mb" }));

app.post("/api/v1/topics/:topic", async function(req, res) {
  var params = Object.assign({}, req.query, req.headers)
  var messages_with_meta = await engine.enqueue(req.params.topic, req.body, params);
  if (!messages_with_meta) return res.status(500).send("internal server error");
  var result = {
    "added": messages_with_meta.length
  }
  if (req.query.list != "false") result["messages_with_meta"] = messages_with_meta;

  res.status(200).json(result);
});

app.get("/api/v1/queues/:queue/:consumer", async function(req, res) {
  var result = await engine.dequeue(req.params.queue, req.params.consumer, req.query.n);
  res.status(result ? 200 : 204).json(result);
});

module.exports = function(the_engine, conf) {
  app.listen(conf.port, function() {
    engine = the_engine;
    console.log("mb started at", new Date(), "on port", conf.port);
  });
}