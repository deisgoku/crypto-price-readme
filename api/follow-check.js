// /api/follow-check.js
const { redis } = require('../lib/redis'); // 
const sha256 = require('crypto-js/sha256');
const { addFollower } = require('../lib/follow-check');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password || typeof username !== 'string') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const uname = username.trim().toLowerCase();

  try {
    const storedHash = await redis.hget('user_passwords', uname);

    if (!storedHash) {
      return res.status(404).json({ status: 'user_not_found' });
    }

    if (storedHash !== sha256(password).toString()) {
      return res.status(401).json({ status: 'wrong_password' });
    }

    const result = await addFollower(uname);
    res.status(200).json({ status: 'success', ...result });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
