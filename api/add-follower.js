// api/add-follower.js
import { redis } from '../lib/redis'

export default async function handler(req, res) {
  const { userId } = req.body
  if (!userId) {
    return res.status(400).json({ error: 'UserId is required' })
  }

  try {
    await redis.set(`follower:${userId}`, true)
    res.status(200).json({ message: 'Follower added' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add follower' })
  }
}
