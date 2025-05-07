//    telegram/admin.js
//    author: Deisgoku

const { redis } = require('../lib/redis');

const ADMIN_SET = 'tg:admins';

async function addAdmin(userId) {
  await redis.sadd(ADMIN_SET, userId);
}

async function removeAdmin(userId) {
  await redis.srem(ADMIN_SET, userId);
}

async function isAdmin(userId) {
  return await redis.sismember(ADMIN_SET, userId) === 1;
}

async function listAdmins() {
  return await redis.smembers(ADMIN_SET);
}

module.exports = { addAdmin, removeAdmin, isAdmin, listAdmins };
