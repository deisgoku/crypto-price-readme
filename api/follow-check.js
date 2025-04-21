const { checkOrAddUser } = require('../lib/follow-check')

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { username } = req.body

  if (!username) {
    return res.status(400).json({ error: 'Username is required' })
  }

  try {
    const result = await checkOrAddUser(username)
    res.status(200).json(result)
  } catch (err) {
    console.error('Redis error:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

                  
