var conf = {
  "long_polling": {
    "interval": 500,
    "retry": 10
  },
  "metadata": {
    "list": "uuid, timestamp_iso8061",
    "field_name": "metadata"
  },
  "port": 8080,
  "redis": {}
}

module.exports = function(filename) {
  if (!filename) return conf;
  var config = JSON.parse(require('fs').readFileSync(filename, "utf-8"));
  var result = Object.assign({}, conf, config);
  console.log(JSON.stringify(result, null, 4));
}