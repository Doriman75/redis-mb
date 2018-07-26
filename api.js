const express = require('express');
const bodyParser = require('body-parser')
const md = require("./metadata");

Object.defineProperty(Array.prototype, 'chunk', {
  value: function(n) {
    return Array.from(Array(Math.ceil(this.length / n)), (_, i) => this.slice(i * n, i * n + n));
  }
});


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
    var messages = Array.isArray(req.body) ? req.body : [req.body];
    var metadata = req.query.metadata || (conf.metadata && conf.metadata.list) || "";
    var metadata_field = (conf.metadata && conf.metadata.field_name) || "metadata";
    var scheduled_at = req.query.scheduled_at ? new Date(req.query.scheduled_at).getTime() : new Date().getTime();

    var list = messages.map(m => md.add(m, metadata, req, res, metadata_field))
    var result = {};
    result["added"] =
      (await Promise.all(list
        .map(e => JSON.stringify(e))
        .chunk(1000)
        .map(list => redis.enqueue(req.params.topic, JSON.stringify(list), scheduled_at))
      )).reduce((n, l) => n + l, 0);
    if (req.query.list != "false") result["list"] = list;
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