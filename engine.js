const uuidv4 = require('uuid/v4');

Object.defineProperty(Array.prototype, 'chunk', {
  value: function(n) {
    return Array.from(Array(Math.ceil(this.length / n)), (_, i) => this.slice(i * n, i * n + n));
  }
});

const functions = {
  uuid() {
    return uuidv4();
  },
  timestamp() {
    return new Date().getTime();
  },
  timestamp_iso8061() {
    return new Date().toISOString();
  },
  headers(params) {
    return params;
  },
  scheduled_at(params) {
    return params.scheduled_at;
  },
  header(params, param) {
    var k = Object.keys(params)
      .filter(e => e.toLowerCase() == param.toLowerCase())[0];
    return params[k];
  }
};

function meta(metadata_list, params) {
  return metadata_list
    .split(",")
    .map(f => f.trim())
    .map(f => {
      return {
        method: f.indexOf('[') != -1 ? f.substring(0, f.indexOf('[')) : f,
        param: f.indexOf('[') != -1 ? f.substring(1 + f.indexOf('['), f.indexOf(']')) : f,
      }
    })
    .reduce((result, f) => {
      result[f.param] = functions[f.method](params, f.param);
      return result
    }, {});
}

async function enqueue(topic, messages, params) {
  var messages = Array.isArray(messages) ? messages : [messages];
  var metadata_field = this.conf.metadata.field_name;
  var metadata_list = this.conf.metadata.list;
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
  for (var i = 0; i < this.conf.long_polling.retry; i++) {
    var result = JSON.parse(await this.redis.dequeue(queue, consumer));
    if (result) return result;
    await sleep(this.conf.long_polling.interval);
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