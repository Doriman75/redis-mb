const fs = require('fs');
module.exports = function(redis) {
  redis.defineCommand("enqueue", {
    numberOfKeys: 0,
    lua: fs.readFileSync("lua/enqueue.lua", "utf-8")
  });

  redis.defineCommand("dequeue", {
    numberOfKeys: 0,
    lua: fs.readFileSync("lua/dequeue.lua", "utf-8")
  });

}