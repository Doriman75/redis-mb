local topic = ARGV[1];
local consumers = redis.call("SMEMBERS", "topics:" .. topic);
local messages = cjson.decode(ARGV[2]);
for i, c in ipairs(consumers)
do
  redis.call("RPUSH", "queues:" .. topic .. ":" .. c, unpack(messages));
end
return messages;
