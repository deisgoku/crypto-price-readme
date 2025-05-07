//    telegram/session.js
//    author : Deisgoku

const sessions = new Map();

function getSession(userId) {
  return sessions.get(userId) || { step: 'start', username: `tg-${userId}` };
}

function setSession(userId, data) {
  sessions.set(userId, data);
}

module.exports = { getSession, setSession };


const { redis } = require('../lib/redis');

const SESSION_PREFIX = 'tg:session:';

async function getSession(userId) {
  const key = SESSION_PREFIX + userId;
  const data = await redis.get(key);
  return data || { step: 'start', username: `tg-${userId}` };
}

async function setSession(userId, data) {
  const key = SESSION_PREFIX + userId;
  await redis.set(key, data, { ex: 3600 }); // expired 1 jam
}

module.exports = { getSession, setSession };
