
// lib/data/middleware.js
const { redis } = require('../redis');

async function cacheFetch(key, ttl, fetchFn) {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    const data = await fetchFn();
    await redis.set(key, JSON.stringify(data), { ex: ttl });
    return data;
  } catch (err) {
    console.error('Redis Cache Error:', err);
    return fetchFn(); // fallback jika Redis gagal
  }
}

module.exports = cacheFetch;

async function cacheFetch(key, ttl, fetchFn) {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    const data = await fetchFn();
    await redis.set(key, JSON.stringify(data), { ex: ttl });
    return data;
  } catch (err) {
    console.error('Redis Cache Error:', err);
    return fetchFn(); // fallback jika Redis gagal
  }
}

module.exports = cacheFetch;
