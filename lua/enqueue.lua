local topic = ARGV[1];
local message = ARGV[2];

local consumers = redis.call("SMEMBERS", "topics:" .. topic);

for i, c in ipairs(consumers)
do
  redis.call("RPUSH", "queues:" .. topic .. ":" .. c, message);
end

return "OK";
