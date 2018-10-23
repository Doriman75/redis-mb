redis.replicate_commands();
local queue = ARGV[1];
local consumer = ARGV[2];
local n = tonumber(ARGV[3]);
local ts = redis.call("time");
local timestamp = ts[1] * 1000 + math.floor(ts[2] / 1000);
local queue_name = "queues:" .. queue .. ":" .. consumer;
local messages = redis.call("ZRANGEBYSCORE", queue_name, "-inf", timestamp, "limit", 0, n);

if(messages[1])
then
  for i,m in ipairs(messages)
  do
    redis.call("ZREM", queue_name, m);
  end
  --redis.call("ZREM", queue_name, unpack(messages));
  return messages;
end
return nil;
