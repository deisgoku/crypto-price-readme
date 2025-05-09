// telegram/session.js
const { redis } = require('../lib/redis');

const SESSION_PREFIX = 'tg:session:'; // berubah, bukan 1 key global
const USER_SET = 'tg:users';

function getSessionKey(userId) {
  return `${SESSION_PREFIX}${userId}`;
}

// Ambil semua field dari hash sebagai objek
async function getSession(userId) {
  const data = await redis.hgetall(getSessionKey(userId));
  return data || {};
}

// Simpan semua field dari objek
async function setSession(userId, data) {
  if (!data || typeof data !== 'object') return;
  await redis.hset(getSessionKey(userId), data);
  await redis.sadd(USER_SET, userId);
}

// Ubah sebagian field (tanpa hapus yang lain)
async function updateSession(userId, newData) {
  if (!newData || typeof newData !== 'object') return;
  if (!newData.username) {
    const linked = await redis.get(`tg:link:${userId}`);
    newData.username = linked || `tg-${userId}`;
  }
  await redis.hset(getSessionKey(userId), newData);
  await redis.sadd(USER_SET, userId);
}

// Ambil field tertentu
async function getField(userId, field) {
  return await redis.hget(getSessionKey(userId), field);
}

// Set field tunggal
async function setField(userId, field, value) {
  await redis.hset(getSessionKey(userId), field, value);
  await redis.sadd(USER_SET, userId);
}

module.exports = {
  getSession,
  setSession,
  updateSession,
  getField,
  setField,
  USER_SET,
};
