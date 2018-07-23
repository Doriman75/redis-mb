const uuidv4 = require('uuid/v4');
module.exports = {
  "functions": {
    "id": function(body, req, res) {
      body.id = uuidv4();
      return body;
    },
    "timestamp": function(body) {
      body.timestamp = new Date().getTime();
      return body;
    },
    "headers": function(body, req) {
      body.headers = req.headers;
      return body;
    }
  },
  "add": function(message, metadata, req, res) {
    Object.keys(this.functions)
      .filter(e => (metadata == "all" || metadata.indexOf(e) != -1))
      .reduce((message, k) => {
        return this.functions[k](message, req, res)
      }, message);
    return message;
  }
};