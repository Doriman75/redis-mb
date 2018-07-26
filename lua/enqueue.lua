redis.replicate_commands();
local topic = ARGV[1];
local strings = cjson.decode(ARGV[2]);
local scheduled_at = ARGV[3];
local messages = {};
for i, e in ipairs(strings)
do
  table.insert(messages, scheduled_at);
  table.insert(messages, e);
end


for i, c in ipairs(redis.call("SMEMBERS", "topics:" .. topic))
do
    redis.call("ZADD", "queues:" .. topic .. ":" .. c, unpack(messages));
end

return table.getn(strings);
