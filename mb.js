const commander = require('commander')
  .version("0.0.1")
  .usage('[options]')
  .option("-c, --conf <configuration>", "configuration file, default: ./conf.json")
  .option("-p, --port <port number>", "port number, default: 8080", parseInt)
  .parse(process.argv);

const conf = JSON.parse(require('fs').readFileSync(commander.conf || "./conf.json", "utf-8"));
conf.port = process.env.app_port || commander.port || conf.port || 8080;

console.log(JSON.stringify(conf, null, 4));
const redis = new require('ioredis')(conf.redis || {});
require("./configure-redis")(redis);
require("./api")(redis, conf);
//require("./websocket")(redis, conf);