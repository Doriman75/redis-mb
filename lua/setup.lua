redis.call("sadd", "topics:sms", "log1")
redis.call("sadd", "topics:email", "log1", "log2")
