const fs = require("fs");
module.exports = function(redis, filename) {
  console.log("loading script", filename, "...")
  redis.defineCommand("setup", {
    numberOfKeys: 0,
    lua: fs.readFileSync(filename, "utf-8")
  });
  redis.setup().then(() => {
    console.log("setup complete");
    process.exit(0);
  }).catch(e => {
    console.log(e);
    process.exit(1);
  })
}