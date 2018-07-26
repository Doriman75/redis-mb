const uuidv4 = require('uuid/v4');

function addMeta(field_name, body, key, value) {
  if (!body[field_name]) body[field_name] = {};
  body[field_name][key] = value;
  return body;
}

module.exports = {
  "fixed": {
    "uuid": function(field_name, body, req, res) {
      return addMeta(field_name, body, 'uuid', uuidv4());
    },
    "timestamp": function(field_name, body) {
      return addMeta(field_name, body, 'timestamp', new Date().getTime());
    },
    "timestamp_iso8061": function(field_name, body) {
      return addMeta(field_name, body, 'timestamp_iso8061', new Date().toISOString());
    },
    "headers": function(field_name, body, req) {
      return addMeta(field_name, body, 'headers', req.headers);
    },
    "scheduled_at": function(field_name, body, req) {
      return addMeta(field_name, body, 'scheduled_at', req.query.scheduled_at);
    }
  },
  "params": {
    "header": function(field_name, body, req, res, param) {
      return addMeta(field_name, body, param, req.get(param));
    }
  },
  "add": function(message, metadata, req, res, field_name) {
    var metadatas = metadata != "all" ? metadata.split(",").map(e => e.trim()) : Object.keys(this.fixed);

    metadatas
      .filter(e => e.indexOf("[") == -1)
      .filter(k => this.fixed[k])
      .forEach(k => message = this.fixed[k](field_name, message, req, res));

    metadatas
      .filter(e => e.indexOf("[") != -1)
      .map(k => {
        return {
          method: k.substring(0, k.indexOf('[')),
          param: k.substring(1 + k.indexOf('['), k.indexOf(']'))
        }
      })
      .filter(k => this.params[k.method])
      .forEach(k => message = this.params[k.method](field_name, message, req, res, k.param));

    return message;
  }
};