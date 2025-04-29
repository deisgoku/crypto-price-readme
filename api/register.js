const { registerUser } = require('../lib/follow-check');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const result = await registerUser(username, password);
    if (result.status === 'success') {
      res.status(200).json({ status: 'success' });
    } else {
      res.status(400).json({ error: result.error || 'Registration failed' });
    }
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
