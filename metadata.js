const uuidv4 = require('uuid/v4');

function addMeta(field_name, body, key, value) {
  if (!body[field_name]) body[field_name] = {};
  body[field_name][key] = value;
  return body;
}

module.exports = {
  "fixed": ,
  "params": {
    "header": function(field_name, body, headers, query, param) {
      return addMeta(field_name, body, param, headers[param]);
    }
  },
  "add": function(message, metadata, headers, field_name) {
    var metadatas = metadata != "all" ? metadata.split(",").map(e => e.trim()) : Object.keys(this.fixed);

    metadatas
      .filter(e => e.indexOf("[") == -1)
      .filter(k => this.fixed[k])
      .forEach(k => message = this.fixed[k](field_name, message, headers));

    metadatas
      .filter(e => e.indexOf("[") != -1)
      .map(k => {
        return {
          method: k.substring(0, k.indexOf('[')),
          param: k.substring(1 + k.indexOf('['), k.indexOf(']'))
        }
      })
      .filter(k => this.params[k.method])
      .forEach(k => message = this.params[k.method](field_name, message, headers, k.param));
    return message;
  }
};