import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Mengecek apakah username sudah pernah follow (disimpan di Redis set "followers")
export async function isFollower(username) {
  if (!username) return false;
  try {
    return await redis.sismember("followers", username.toLowerCase());
  } catch (error) {
    console.error("Redis isFollower error:", error);
    return false;
  }
}

// Menambahkan username ke Redis set "followers"
export async function addFollower(username) {
  if (!username) return false;
  try {
    return await redis.sadd("followers", username.toLowerCase());
  } catch (error) {
    console.error("Redis addFollower error:", error);
    return false;
  }
}
