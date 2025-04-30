// lib/data/middleware.js
const { redis } = require('../redis');

async function cacheFetch(key, ttl, fetchFn) {
  try {
    const cached = await redis.get(key);
    if (cached) {
      console.log('[CACHE] HIT:', key);
      return JSON.parse(cached);
    }

    console.log('[CACHE] MISS:', key);
    const data = await fetchFn();
    await redis.set(key, JSON.stringify(data), { ex: ttl });
    return data;
  } catch (err) {
    console.error('[CACHE] Redis Error:', err);
    return fetchFn(); // fallback jika Redis gagal
  }
}

module.exports = cacheFetch;
