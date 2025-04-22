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

  // Create a sleek SVG badge
  const badge = `
    <svg xmlns="http://www.w3.org/2000/svg" width="270" height="35" viewBox="0 0 270 35">
      <!-- Background with rounded corners -->
      <rect width="270" height="35" rx="10" fill="#333" />
      
      <!-- Visitor number in blue, bold and slightly larger font -->
      <text x="15" y="22" fill="#4A90E2" font-size="16" font-weight="bold">${cloneCount}</text>
      
      <!-- Description text in light gray, smaller font -->
      <text x="55" y="22" fill="#B0B0B0" font-size="14" font-family="Arial, sans-serif">Visitor interested since release</text>
    </svg>
  `;

  // Send the SVG badge as a response
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(badge);
};
