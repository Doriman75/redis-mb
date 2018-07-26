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

const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });

} else require("./api")(redis, conf);