const uuidv4 = require('uuid/v4');

Object.defineProperty(Array.prototype, 'chunk', {
  value: function(n) {
    return Array.from(Array(Math.ceil(this.length / n)), (_, i) => this.slice(i * n, i * n + n));
  }
});

const functions = {
  "uuid": function() {
    return uuidv4();
  },
  "timestamp": function() {
    return new Date().getTime();
  },
  "timestamp_iso8061": function() {
    return new Date().toISOString();
  },
  "headers": function(params) {
    return params;
  },
  "scheduled_at": function(params) {
    return params.scheduled_at;
  },
  "header": function(params, param) {
    var k = Object.keys(params)
      .filter(e => e.toLowerCase() == param.toLowerCase())[0];

    return params[k];
  }
};

function meta(metadata_list, params) {
  var result = {};
  var list = metadata_list.split(",").map(e => e.trim());
  list
    .map(f => {
      return {
        method: f.indexOf('[') != -1 ? f.substring(0, f.indexOf('[')) : f,
        param: f.indexOf('[') != -1 ? f.substring(1 + f.indexOf('['), f.indexOf(']')) : f,
      }
    })
    .forEach(f => result[f.param] = functions[f.method](params, f.param));
  return result;
}

async function enqueue(topic, messages, params) {
  var messages = Array.isArray(messages) ? messages : [messages];
  var metadata_field = (this.conf.metadata && this.conf.metadata.field_name) || "metadata";
  var metadata_list = params.metadata || (this.conf.metadata && this.conf.metadata.list) || "uuid";
  var scheduled_at = params.scheduled_at ? new Date(params.scheduled_at).getTime() : new Date().getTime();
  var messages_with_meta = messages
    .map(m => {
      m[metadata_field] = meta(metadata_list, params);
      return m
    });

  await Promise.all(messages_with_meta
    .map(m => JSON.stringify(m))
    .chunk(1000)
    .map(list => this.redis.enqueue(topic, JSON.stringify(list), scheduled_at))
  );
  return messages_with_meta;
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

async function dequeue(queue, consumer) {
  const retry = this.conf.long_polling && this.conf.long_polling.retry || 10;
  const interval = this.conf.long_polling && this.conf.long_polling.interval || 500;

  for (var i = 0; i < retry; i++) {
    var result = JSON.parse(await this.redis.dequeue(queue, consumer));
    if (result) return result;
    await sleep(interval);
  }
  return null;
}

module.exports = function(redis, conf) {
  return {
    redis: redis,
    conf: conf,
    enqueue: enqueue,
    dequeue: dequeue
  }
}