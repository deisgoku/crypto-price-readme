const fetch = require('node-fetch');
const { redis } = require('../lib/redis'); 

const repoOwner = 'deisgoku';
const repoName = 'crypto-price-readme';
const key = 'clone:count';

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).send('Method not allowed');
  }

  // Handle PUT request (update clone count)
  if (req.method === 'PUT') {
    const authHeader = req.headers.authorization;
    const expectedToken = `token ${process.env.GITHUB_TOKEN}`;
    
    if (!authHeader || authHeader !== expectedToken) {
      return res.status(401).send('Unauthorized');
    }

    try {
      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/traffic/clones`, {
        headers: { Authorization: expectedToken },
      });

      if (!response.ok) {
        return res.status(500).send('Error fetching GitHub data');
      }

      const data = await response.json();
      const cloneCount = data.count || 0;

      await redis.set(key, cloneCount);
      return res.status(200).send(`Clone count updated: ${cloneCount}`);
    } catch (err) {
      return res.status(500).send('Failed to update traffic count');
    }
  }

  // Handle GET request (serve badge)
  const cloneCount = await redis.get(key) || 0;
  const badge = `
    <svg xmlns="http://www.w3.org/2000/svg" width="270" height="35" viewBox="0 0 270 35">
      <rect x="0.5" y="0.5" width="269" height="34" rx="10" fill="none" stroke="#4A90E2" stroke-width="1" />
      <rect x="1" y="1" width="268" height="33" rx="9" fill="#1E1E1E" />
      <text x="15" y="23" fill="#4A90E2" font-size="16" font-weight="bold" font-family="Arial, sans-serif">${cloneCount}</text>
      <text x="55" y="23" fill="#FFFFFF" font-size="14" font-family="Arial, sans-serif">
        users interested since release
      </text>
    </svg>
  `;

  res.setHeader('Content-Type', 'image/svg+xml');
  return res.send(badge);
};
