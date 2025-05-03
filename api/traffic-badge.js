const fetch = require('node-fetch');
const { redis } = require('../lib/redis');

const repoOwner = 'deisgoku';
const repoName = 'crypto-price-readme';

module.exports = async (req, res) => {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (!GITHUB_TOKEN) {
    console.error('[USER BADGE] Missing GITHUB_TOKEN');
    return res.status(500).send('Missing GitHub token');
  }

  const mode = req.query.t === 'day' ? 'day' : 'default';
  const key = `user:count:${mode}`;

  try {
    let cached = await redis.get(key);
    let userCount;
    let timestamp;

    if (cached) {
      const parsed = JSON.parse(cached);
      userCount = parsed.userCount;
      timestamp = parsed.timestamp;
      console.log(`[USER BADGE] Cache hit (${mode}): ${userCount} (at ${timestamp})`);
    } else {
      console.log(`[USER BADGE] Cache miss, fetching from GitHub (${mode})...`);

      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/traffic/clones`, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` }
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`[USER BADGE] GitHub API error: ${response.status} - ${text}`);
        return res.status(500).send('Error fetching GitHub data');
      }

      const data = await response.json();
      userCount = mode === 'day' ? data.uniques || 0 : data.count || 0;
      timestamp = new Date().toISOString();

      await redis.set(key, JSON.stringify({ userCount, timestamp }), 'EX', mode === 'day' ? 300 : 3600);
      console.log(`[USER BADGE] Saved ${userCount} at ${timestamp} to Redis with key "${key}"`);
    }

    return generateBadge(res, userCount, timestamp);

  } catch (err) {
    console.error('[USER BADGE] Unexpected error:', err);
    return res.status(500).send('Failed to update and generate badge');
  }
};

function generateBadge(res, userCount, timestamp) {
  const badge = `
    <svg xmlns="http://www.w3.org/2000/svg" width="370" height="35" viewBox="0 0 370 35">
      <rect x="0.5" y="0.5" width="369" height="34" rx="10" fill="none" stroke="#4A90E2" stroke-width="1" />
      <rect x="1" y="1" width="368" height="33" rx="9" fill="#1E1E1E" />
      <text x="15" y="23" fill="#4A90E2" font-size="16" font-weight="bold" font-family="Arial, sans-serif">${userCount}</text>
      <text x="55" y="23" fill="#FFFFFF" font-size="14" font-family="Arial, sans-serif">
        users since release (as of ${timestamp.slice(0, 10)})
      </text>
    </svg>
  `;
  res.setHeader('Content-Type', 'image/svg+xml');
  return res.send(badge);
}
