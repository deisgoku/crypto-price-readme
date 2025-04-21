// lib/follow-check.js
import { redis } from './redis'

export async function checkFollower(userId) {
  const follower = await redis.get(`follower:${userId}`)
  if (follower) {
    return true
  }
  return false
}
