const { redis } = require('./redis');
const crypto = require('crypto');

const KEYS = {
  VERIFIED_FOLLOWERS: 'verified_followers', // 
  USER_PASSWORDS: 'user_passwords',         //
};

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function isFollowing(username) {
  const normalized = username.trim().toLowerCase();
  const exists = await redis.sismember(KEYS.VERIFIED_FOLLOWERS, normalized);
  return exists === 1;
}

async function addFollower(username) {
  const normalized = username.trim().toLowerCase();
  const alreadyExists = await isFollowing(normalized);

  if (alreadyExists) {
    return { status: 'already_verified' };
  }

  const added = await redis.sadd(KEYS.VERIFIED_FOLLOWERS, normalized);
  if (added === 1) {
    return { status: 'newly_verified' };
  } else {
    return { status: 'error' };
  }
}

async function registerUser(username, password) {
  const normalized = username.trim().toLowerCase();
  const userExists = await redis.hexists(KEYS.USER_PASSWORDS, normalized);

  if (userExists) {
    return { status: 'error', error: 'Username already registered.' };
  }

  const hashedPassword = hashPassword(password);
  await redis.hset(KEYS.USER_PASSWORDS, normalized, hashedPassword);
  return { status: 'success' };
}

async function loginUser(username, password) {
  const normalized = username.trim().toLowerCase();
  const storedHashedPassword = await redis.hget(KEYS.USER_PASSWORDS, normalized);

  if (!storedHashedPassword) {
    return { status: 'error', error: 'User not found. Please register first.' };
  }

  const inputHashedPassword = hashPassword(password);
  if (storedHashedPassword === inputHashedPassword) {
    return { status: 'success' };
  } else {
    return { status: 'error', error: 'Invalid password.' };
  }
}

module.exports = {
  isFollowing,
  addFollower,
  registerUser,
  loginUser
};
