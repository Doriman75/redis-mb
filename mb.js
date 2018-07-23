const commander = require('commander')
  .version("0.0.1")
  .usage('[options]')
  .option("-c, --conf <configuration>", "configuration file, default: ./conf.json")
  .option("-s, --setup <script>", "lua script to prepare the database.")
  .option("-p, --port <port number>", "port number", parseInt)
  .parse(process.argv);

const conf = JSON.parse(require('fs').readFileSync(commander.conf || "./conf.json", "utf-8"));
conf.port = process.env.app_port || commander.port || conf.port || 8080;

console.log(JSON.stringify(conf, null, 4));
const redis = new require('ioredis')(conf.redis || {});
require("./configure-redis")(redis);
if (commander.setup) require("./setup")(redis, commander.setup);
require("./api")(redis, conf);