import { redis } from './redis'

const redis = new Redis(process.env.REDIS_URL, {
  tls: {} // penting untuk rediss:// Upstash
});

const redisKey = "verified_followers";

export async function isFollowing(username) {
  const normalized = username.trim().toLowerCase();
  const exists = await redis.sismember(redisKey, normalized);
  return exists === 1;
}

export async function addFollower(username) {
  const normalized = username.trim().toLowerCase();

  const alreadyExists = await isFollowing(normalized);
  if (alreadyExists) {
    return { status: "already_verified" };
  }

  const added = await redis.sadd(redisKey, normalized);
  if (added === 1) {
    return { status: "newly_verified" };
  } else {
    return { status: "error" };
  }
}
