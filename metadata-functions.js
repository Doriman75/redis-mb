const uuidv4 = require('uuid/v4');
module.exports = {
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
};