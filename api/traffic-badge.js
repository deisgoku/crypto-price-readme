const fetch = require('node-fetch');
const { redis } = require('../lib/redis');

const repoOwner = 'deisgoku';
const repoName = 'crypto-price-readme';

module.exports = async (req, res) => {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (!GITHUB_TOKEN) {
    console.error('[USER BADGE] Missing GITHUB_TOKEN');
    return sendErrorBadge(res, 'No Token');
  }

  const mode = req.query.t === 'day' ? 'day' : 'default';
  const key = `user:count:${mode}`;

  try {
    let cached = await redis.get(key);
    let userCount;

    if (cached) {
      const parsed = JSON.parse(cached);
      userCount = parsed.userCount;
      console.log(`[USER BADGE] Cache hit (${mode}): ${userCount}`);
    } else {
      console.log(`[USER BADGE] Cache miss, fetching from GitHub (${mode})...`);

      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/traffic/clones`, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'User-Agent': 'traffic-badge'
        }
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`[USER BADGE] GitHub API error: ${response.status} - ${text}`);
        return sendErrorBadge(res, `API ${response.status}`);
      }

      const data = await response.json();
      userCount = mode === 'day' ? data.uniques || 0 : data.count || 0;

      await redis.set(key, JSON.stringify({ userCount }), 'EX', mode === 'day' ? 300 : 3600);
      console.log(`[USER BADGE] Saved ${userCount} to Redis`);
    }

    return generateBadge(res, userCount);
  } catch (err) {
    console.error('[USER BADGE] Unexpected error:', err);
    return sendErrorBadge(res, 'Internal');
  }
};

function generateBadge(res, userCount) {
  const badge = `
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="35" viewBox="0 0 220 35">
      <rect x="0.5" y="0.5" width="219" height="34" rx="10" fill="none" stroke="#4A90E2" stroke-width="1" />
      <rect x="1" y="1" width="218" height="33" rx="9" fill="#1E1E1E" />
      <text x="15" y="23" fill="#4A90E2" font-size="16" font-weight="bold" font-family="Arial, sans-serif">
        ${userCount} users interested
      </text>
    </svg>
  `;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache');
  return res.status(200).send(badge);
}

function sendErrorBadge(res, label = 'Error') {
  const badge = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="35" viewBox="0 0 160 35">
      <rect x="0" y="0" width="160" height="35" rx="10" fill="#222" />
      <text x="10" y="23" fill="#FF5555" font-size="14" font-family="Arial, sans-serif">Badge ${label}</text>
    </svg>
  `;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache');
  return res.status(200).send(badge);
}
