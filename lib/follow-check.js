// lib/follow-check
// AUTHOR : Deisgoku


const bcrypt = require('bcrypt');
const { redis } = require('./redis');

const KEYS = {
  VERIFIED_FOLLOWERS: 'verified_followers',
  USER_PASSWORDS: 'user_passwords',
};


const GARAM = parseInt(process.env.GARAM || '10', 10);

async function isFollowing(username) {
  const normalized = username.trim().toLowerCase();
  const exists = await redis.sismember(KEYS.VERIFIED_FOLLOWERS, normalized);
  return exists === 1;
}

async function addFollower(username) {
  const normalized = username.trim().toLowerCase();
  const alreadyExists = await isFollowing(normalized);
  if (alreadyExists) return { status: 'already_verified' };

  const added = await redis.sadd(KEYS.VERIFIED_FOLLOWERS, normalized);
  return added === 1 ? { status: 'newly_verified' } : { status: 'error' };
}

async function registerUser(username, password) {
  const normalized = username.trim().toLowerCase();
  const userExists = await redis.hexists(KEYS.USER_PASSWORDS, normalized);
  if (userExists) {
    return { status: 'error', error: 'Username already registered.' };
  }

  const hashedPassword = await bcrypt.hash(password, GARAM);
  await redis.hset(KEYS.USER_PASSWORDS, { [normalized]: hashedPassword });
  return { status: 'success' };
}

async function loginUser(username, password) {
  const normalized = username.trim().toLowerCase();
  const storedHashedPassword = await redis.hget(KEYS.USER_PASSWORDS, normalized);
  if (!storedHashedPassword) {
    return { status: 'error', error: 'User not found. Please register first.' };
  }

  const passwordMatch = await bcrypt.compare(password, storedHashedPassword);
  return passwordMatch
    ? { status: 'success' }
    : { status: 'error', error: 'Invalid password.' };
}

async function isRegistered(username) {
  const normalized = username.trim().toLowerCase();
  const exists = await redis.hexists(KEYS.USER_PASSWORDS, normalized);
  return exists === 1;
}

module.exports = {
  isFollowing,
  addFollower,
  registerUser,
  loginUser,
  isRegistered,
};
