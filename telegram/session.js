//    telegram/session.js
//    author : Deisgoku

const { redis } = require('../lib/redis');
const SESSION_PREFIX = 'tg:session:';


const sessionCache = new Map();


async function setSession(userId, data) {
  const key = SESSION_PREFIX + userId;

  
  sessionCache.set(userId, data);

  try {
    await redis.set(key, JSON.stringify(data), { ex: 3600 }); // session expired setelah 1 jam
  } catch (err) {
    console.error('Gagal menyimpan session:', err);
  }
}


async function getSession(userId) {
  
  if (sessionCache.has(userId)) {
    return sessionCache.get(userId);
  }

  const key = SESSION_PREFIX + userId;
  try {
    
    const data = await redis.get(key);
    const sessionData = data ? JSON.parse(data) : { step: 'start', username: `tg-${userId}` };

    
    sessionCache.set(userId, sessionData);

    return sessionData;
  } catch (err) {
    console.error('Gagal mengambil session:', err);
    return { step: 'start', username: `tg-${userId}` };
  }
}

module.exports = { getSession, setSession };
