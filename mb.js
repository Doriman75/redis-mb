const fs = require('fs');

const commander = require('commander')
  .version("0.0.1")
  .usage('[options]')
  .option("-c, --conf <configuration>", "configuration file, default: ./conf.json")
  .parse(process.argv);

const conf = require("./config")(commander.conf);

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