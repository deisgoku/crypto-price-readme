//    telegram/session.js
//    author : Deisgoku

const { redis } = require('../lib/redis');
const SESSION_PREFIX = 'tg:session:';


async function setSession(userId, data) {
  const key = SESSION_PREFIX + userId;
  try {
    await redis.set(key, JSON.stringify(data), { ex: 3600 }); // session expired setelah 1 jam
  } catch (err) {
    console.error('Gagal menyimpan session:', err);
  }
}


async function getSession(userId) {
  const key = SESSION_PREFIX + userId;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : { step: 'start', username: `tg-${userId}` };
  } catch (err) {
    console.error('Gagal mengambil session:', err);
    return { step: 'start', username: `tg-${userId}` };
  }
}

module.exports = { getSession, setSession };
