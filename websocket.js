const url = require('url')
const WebSocket = require('ws');
const wss = new WebSocket.Server({
  port: 8082
});



wss.on('listening', function() {
  console.info('ws server listening')
});

wss.on('connection', function connection(ws) {
  ws.isAlive = true;
  ws.on('pong', () => this.isAlive = true);
});

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

module.exports = function(redis, conf) {
  const engine = require("./engine")(redis, conf);
  wss.on('connection', function(ws, req) {
    var info = url.parse(req.url, true);
    console.log("connection detected!", info.query)
    setTimeout(() => {
      dequeue(ws, info.query.queue, info.query.consumer)
    }, 0);

    ws.on('message', function(message) {
      console.log(message);
    });
  });

  async function dequeue(ws, queue, consumer) {
    var message = null;
    while (message = await engine.dequeue(queue, consumer)) {
      try {
        await ws.send(JSON.stringify(message))
      } catch (e) {
        console.error(e);
      }
    }
    setTimeout(() => dequeue(ws, queue, consumer), conf.retry);
  }
}