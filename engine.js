const uuidv4 = require('uuid/v4');
const zlib = require('zlib');
var redis = null;
var conf = null;

Object.defineProperty(Array.prototype, 'chunk', {
  value(n) {
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
/*
function compress(json) {
  return zlib.deflateSync(JSON.stringify(json)).toString('binary');
}

function decompress(s) {
  return JSON.parse(zlib.inflateSync(new Buffer(s, 'binary')).toString());
}
*/
function compress(json) {
  return JSON.stringify(json);
}

function decompress(s) {
  return JSON.parse(s);
}

async function enqueue(topic, messages, params) {
  var messages = Array.isArray(messages) ? messages : [messages];
  var metadata_field = conf.metadata.field_name;
  var metadata_list = conf.metadata.list;
  var scheduled_at = params.scheduled_at ? new Date(params.scheduled_at).getTime() : new Date().getTime();
  var messages_with_meta = messages
    .map(m => {
      m[metadata_field] = meta(metadata_list, params);
      return m
    });
  try {
    await Promise.all(messages_with_meta
      .map(m => compress(m))
      .chunk(1000)
      .map(list => redis.enqueue(topic, JSON.stringify(list), scheduled_at))
    );
    return messages_with_meta;
  } catch (e) {
    console.error(e);
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

async function dequeue(queue, consumer, n) {
  if (!n) n = 1;
  if (typeof n == "string") n = parseInt(n);
  if (!n) n = 1;
  for (var i = 0; i < conf.long_polling.retry; i++) {
    let messages = await redis.dequeue(queue, consumer, n);
    if (!messages) {
      await sleep(conf.long_polling.interval);
      continue;
    }
    let result = messages.reduce((r, e) => { r.push(decompress(e)); return r; }, []);
    if (n == 1) return result[0];
    return result;
  }
  return null;
}

module.exports = function(the_redis, the_conf) {
  redis = the_redis;
  conf = the_conf;
  return {
    enqueue: enqueue,
    dequeue: dequeue
  }
}