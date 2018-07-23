const uuidv4 = require('uuid/v4');
module.exports = {
  "fixed": {
    "id": function(body, req, res) {
      body.id = uuidv4();
      return body;
    },
    "timestamp": function(body) {
      body.timestamp = new Date().getTime();
      return body;
    },
    "timestamp_iso8061": function(body) {
      body.timestamp_iso8061 = new Date().toISOString();
      return body;
    },
    "headers": function(body, req) {
      body.headers = req.headers;
      return body;
    }
  },
  "params": {
    "header": function(body, req, res, param) {
      body[param] = req.get(param);
      return body;
    }
  },
  "add": function(message, metadata, req, res) {
    var metadatas = metadata != "all" ? metadata.split(",").map(e => e.trim()) : Object.keys(this.fixed);

    metadatas
      .filter(e => e.indexOf("[") == -1)
      .filter(k => this.fixed[k])
      .forEach(k => message = this.fixed[k](message, req, res));

    metadatas
      .filter(e => e.indexOf("[") != -1)
      .map(k => {
        return {
          method: k.substring(0, k.indexOf('[')),
          param: k.substring(1 + k.indexOf('['), k.indexOf(']'))
        }
      })
      .filter(k => this.params[k.method])
      .forEach(k => message = this.params[k.method](message, req, res, k.param));

    return message;
  }
};