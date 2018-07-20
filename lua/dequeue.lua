local queue = ARGV[1];
local consumer = ARGV[2];
return redis.call("LPOP", "queues:" .. queue .. ":" .. consumer);
