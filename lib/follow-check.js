// /lib/follow-check.js
const { redis } = require('./redis');
const redisKey = "verified_followers";

async function isFollowing(username) {
  const normalized = username.trim().toLowerCase();
  const exists = await redis.sismember(redisKey, normalized);
  return exists === 1;
}

async function addFollower(username) {
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

module.exports = { isFollowing, addFollower };
