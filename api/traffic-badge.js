const fetch = require('node-fetch');

module.exports = async (req, res) => {
 
  const repoOwner = 'deisgoku';
  const repoName = 'crypto-price-readme';

  const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/traffic/views`, {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`
    }
  });

  if (!response.ok) {
    return res.status(500).send('Error fetching GitHub data');
  }

  const data = await response.json();
  const viewCount = data.count || 0; // Mendapatkan jumlah view dari GitHub API

  // Format hasil badge sebagai SVG dengan animasi, bayangan, tanpa efek blink
  const badge = `
    <svg xmlns="http://www.w3.org/2000/svg" width="350" height="60">
      <style>
        .text-blue { fill: #1E90FF; font-size: 20px; font-weight: bold; }
        .text-white { fill: #fff; font-size: 16px; font-weight: normal; }
        .shadow { filter: url(#f1); }
        .color-change { animation: colorChange 3s infinite; }

        @keyframes colorChange {
          0% { fill: #1E90FF; }
          50% { fill: #FFD700; }
          100% { fill: #1E90FF; }
        }
      </style>
      
      <defs>
        <filter id="f1" x="0" y="0" width="200%" height="200%">
          <feOffset result="offOut" in="SourceAlpha" dx="5" dy="5" />
          <feGaussianBlur result="blurOut" in="offOut" stdDeviation="4" />
          <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
        </filter>
      </defs>

      <rect width="350" height="60" fill="#333" rx="10" ry="10" class="color-change"/>
      
      <text x="20" y="35" class="text-blue shadow">${viewCount}</text>
      <text x="70" y="35" class="text-white">users interested since release</text>
    </svg>
  `;

  // Kirim badge sebagai SVG
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(badge);
};
