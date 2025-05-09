const { redis } = require('../lib/redis');

const SESSION_PREFIX = 'tg:session:';
const USER_SET = 'tg:users';

// Fungsi untuk mendapatkan key session berdasarkan userId
function getSessionKey(userId) {
  return `${SESSION_PREFIX}${userId}`;
}

// Validasi untuk memastikan data yang disimpan adalah objek dengan struktur yang benar
function validateSessionData(data) {
  
  return data && typeof data === 'object' && Object.keys(data).length > 0;
}

// Ambil semua field dari hash sebagai objek
async function getSession(userId) {
  try {
    const data = await redis.hgetall(getSessionKey(userId));
    return data || {}; 
  } catch (error) {
    console.error('Error getting session:', error);
    return {}; 
  }
}

// Simpan semua field dari objek
async function setSession(userId, data) {
  if (!validateSessionData(data)) {
    console.warn('Invalid session data:', data);
    return; 
  }

  try {
    await redis.hset(getSessionKey(userId), data);
    await redis.sadd(USER_SET, userId); 
  } catch (error) {
    console.error('Error setting session:', error);
  }
}

// Update sebagian field tanpa menghapus data lainnya
async function updateSession(userId, newData) {
  if (!validateSessionData(newData)) {
    console.warn('Invalid session data:', newData);
    return; 
  }

  try {
    if (!newData.username) {
      const linked = await redis.get(`tg:link:${userId}`);
      newData.username = linked || `tg-${userId}`;
    }

    await redis.hset(getSessionKey(userId), newData);
    await redis.sadd(USER_SET, userId); 
  } catch (error) {
    console.error('Error updating session:', error);
  }
}

// Ambil field tertentu dari session
async function getField(userId, field) {
  try {
    return await redis.hget(getSessionKey(userId), field);
  } catch (error) {
    console.error('Error getting field from session:', error);
    return null; 
  }
}

// Set field tunggal dalam session
async function setField(userId, field, value) {
  try {
    if (typeof value !== 'string' || value.trim() === '') {
      console.warn('Invalid field value:', value);
      return; 
    }
    await redis.hset(getSessionKey(userId), field, value);
    await redis.sadd(USER_SET, userId); 
  } catch (error) {
    console.error('Error setting field in session:', error);
  }
}

module.exports = {
  getSession,
  setSession,
  updateSession,
  getField,
  setField,
  USER_SET,
};
