const { redis } = require('../lib/redis');

const SESSION_PREFIX = 'tg:session:'; // tetap
const USER_SET = 'tg:users';

function getSessionKey(userId) {
  return `${SESSION_PREFIX}${userId}`;
}

// Ambil seluruh sesi (dari JSON string)
async function getSession(userId) {
  const json = await redis.get(getSessionKey(userId));
  return json ? JSON.parse(json) : {};
}

// Simpan seluruh objek sesi (overwrite total)
async function setSession(userId, data) {
  if (!data || typeof data !== 'object') return;
  await redis.set(getSessionKey(userId), JSON.stringify(data));
  await redis.sadd(USER_SET, userId);
}

// Update sebagian data (merge manual)
async function updateSession(userId, newData) {
  if (!newData || typeof newData !== 'object') return;
  const current = await getSession(userId);
  const merged = { ...current, ...newData };

  if (!merged.username) {
    const linked = await redis.get(`tg:link:${userId}`);
    merged.username = linked || `tg-${userId}`;
  }

  await redis.set(getSessionKey(userId), JSON.stringify(merged));
  await redis.sadd(USER_SET, userId);
}

// Ambil 1 field
async function getField(userId, field) {
  const session = await getSession(userId);
  return session[field];
}

// Set 1 field (manual merge juga)
async function setField(userId, field, value) {
  const session = await getSession(userId);
  session[field] = value;
  await redis.set(getSessionKey(userId), JSON.stringify(session));
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
