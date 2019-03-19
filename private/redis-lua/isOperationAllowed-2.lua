--[[
  KEYS[1] - Operation
  KEYS[2] - Unique Token

  ARGV[1] - Current timestamp in milliseconds
  ARGV[2] - Interval in milliseconds
  ARGV[3] - Requests in interval
]]

local rcall = redis.call

local timestamp = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

local expireTime = timestamp - ttl;

local key = KEYS[1] .. ":" .. KEYS[2]


rcall("ZREMRANGEBYSCORE", key, "-inf", expireTime)

local bucketLength = rcall("ZCOUNT", key, expireTime, "inf")

if bucketLength > limit then
  -- Rate limit exceeded
  return 'false'
else
  -- Rate within limit. Add to bucket
  rcall("ZADD", key, timestamp, ARGV[1])

  return 'true'
end
