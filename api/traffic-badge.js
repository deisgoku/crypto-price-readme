const fetch = require('node-fetch');
const { redis } = require('../lib/redis');

const repoOwner = 'deisgoku';
const repoName = 'crypto-price-readme';
const key = 'user:count'; // Ganti key

module.exports = async (req, res) => {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!GITHUB_TOKEN) {
    console.error('[USER BADGE] Missing GITHUB_TOKEN');
    return res.status(500).send('Missing GitHub token');
  }

  try {
    console.log(`[USER BADGE] Fetching user traffic for ${repoOwner}/${repoName}...`);

    // Cek data dari Redis
    let userCount = await redis.get(key);

    if (!userCount) {
      console.log(`[USER BADGE] No data in Redis, fetching from GitHub API...`);

      // Ambil data dari GitHub API jika tidak ada di Redis
      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/traffic/clones`, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`
        }
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`[USER BADGE] GitHub API error: ${response.status} - ${text}`);
        return res.status(500).send('Error fetching GitHub data');
      }

      const data = await response.json();
      userCount = data.count || 0;

      // Simpan ke Redis jika data berhasil diambil
      await redis.set(key, userCount);
      console.log(`[USER BADGE] Saved to Redis with key "${key}"`);
    } else {
      console.log(`[USER BADGE] Retrieved user count from Redis: ${userCount}`);
    }

    // Pastikan userCount adalah angka
    userCount = parseInt(userCount, 10);

    // Membuat badge SVG
    const badge = `
      <svg xmlns="http://www.w3.org/2000/svg" width="270" height="35" viewBox="0 0 270 35">
        <rect x="0.5" y="0.5" width="269" height="34" rx="10" fill="none" stroke="#4A90E2" stroke-width="1" />
        <rect x="1" y="1" width="268" height="33" rx="9" fill="#1E1E1E" />
        <text x="15" y="23" fill="#4A90E2" font-size="16" font-weight="bold" font-family="Arial, sans-serif">${userCount}</text>
        <text x="55" y="23" fill="#FFFFFF" font-size="14" font-family="Arial, sans-serif">
          users interested since release
        </text>
      </svg>
    `;

    // Kirim badge sebagai respons
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(badge);

  } catch (err) {
    console.error('[USER BADGE] Unexpected error:', err);
    return res.status(500).send('Failed to update and generate badge');
  }
};
