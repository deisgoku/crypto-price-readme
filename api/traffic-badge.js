const fetch = require('node-fetch');
const { Redis } = require('../lib/redis');

const redis = new Redis(process.env.REDIS_URL);

const repoOwner = 'deisgoku';
const repoName = 'crypto-price-readme';

module.exports = async (req, res) => {
  const key = 'clone:count';

  
  if (req.method === 'PUT') {
    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/traffic/clones`, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
    });

    if (!response.ok) {
      return res.status(500).send('Error fetching GitHub data');
    }

    const data = await response.json();
    const cloneCount = data.count || 0;
    await redis.set(key, cloneCount);
    return res.status(200).send(`Clone count updated: ${cloneCount}`);
  }

  // GET = ambil dari Redis, render badge
  if (req.method === 'GET') {
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
  }

  res.status(405).send('Method not allowed');
};
