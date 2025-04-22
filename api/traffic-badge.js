// /api/traffic-badge.js

const fetch = require('node-fetch');

module.exports = async (req, res) => {

  const repoOwner = 'deisgoku';
  const repoName = 'crypto-price-readme';

  const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/traffic/clones`, {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`
    }
  });

  if (!response.ok) {
    return res.status(500).send('Error fetching GitHub data');
  }

  const data = await response.json();
  const cloneCount = data.count || 0;

  // Format badge sebagai SVG
  const badge = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="20">
      <rect width="200" height="20" fill="#555"/>
      <text x="10" y="14" fill="#fff" font-size="12">Cloned: ${cloneCount}x</text>
    </svg>
  `;

  // Kirim badge sebagai SVG
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(badge);
};
