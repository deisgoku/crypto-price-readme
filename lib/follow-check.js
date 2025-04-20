

import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function isFollower(username) {
  if (!username) return false;
  return await redis.sismember("followers", username.toLowerCase());
}

export async function addFollower(username) {
  if (!username) return false;
  return await redis.sadd("followers", username.toLowerCase());
}
