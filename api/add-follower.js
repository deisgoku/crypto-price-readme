// api/add-follower.js
import { addFollower } from '../lib/follow-check';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username } = req.body;
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const result = await addFollower(username);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in add-follower:', error);
    res.status(500).json({ status: 'error' });
  }
}
