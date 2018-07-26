redis.replicate_commands();
local queue = ARGV[1];
local consumer = ARGV[2];
local ts = redis.call("time");
local timestamp = ts[1] * 1000 + math.floor(ts[2] / 1000);
local queue_name = "queues:" .. queue .. ":" .. consumer;
local messages = redis.call("ZRANGEBYSCORE", queue_name, "-inf", timestamp, "limit", 0, 1);
if(messages[1])
then
  redis.call("ZREM", queue_name, messages[1]);
  return messages[1];
end
return nil;
