// lib/redis.js
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL, // Pastikan URL dari Upstash
  token: process.env.UPSTASH_REDIS_REST_TOKEN // Pastikan token dari Upstash
})
