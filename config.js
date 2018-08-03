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
  "redis": {
    "showFriendlyErrorStack": true
  }
}

module.exports = function(filename) {
  var config = filename ? JSON.parse(require('fs').readFileSync(filename, "utf-8")) : {};
  return Object.assign({}, conf, config);
}