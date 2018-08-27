const fs = require('fs');
const conf = require("./config")(process.argv[2]);
console.log(JSON.stringify(conf, null, 4));

const redis = new require('ioredis')(conf.redis || {});
redis.defineCommand("enqueue", {
  numberOfKeys: 0,
  lua: fs.readFileSync("lua/enqueue.lua", "utf-8")
});
redis.defineCommand("dequeue", {
  numberOfKeys: 0,
  lua: fs.readFileSync("lua/dequeue.lua", "utf-8")
});

require("./api")(redis, conf);