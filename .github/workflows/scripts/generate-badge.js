const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const generateBadge = async () => {
  const repoOwner = 'deisgoku';
  const repoName = 'crypto-price-readme';

  // Mengambil view count dari GitHub API
  const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/traffic/views`, {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error('Error fetching GitHub data');
  }

  const data = await response.json();
  const viewCount = data.count || 0; // Mendapatkan jumlah view dari GitHub API

  // Membuat SVG dari badge
  const badgeSvg = `
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

  // Membuka puppeteer dan render SVG sebagai GIF
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(`<body><div id="badge">${badgeSvg}</div></body>`);

  // Mengambil screenshot dari SVG
  const screenshotBuffer = await page.screenshot({ fullPage: true });

  // Menyimpan screenshot ke dalam file GIF
  const outputPath = path.resolve(__dirname, '../../public/badge.gif');
  fs.writeFileSync(outputPath, screenshotBuffer);

  await browser.close();
};

generateBadge()
  .then(() => console.log('Badge GIF generated successfully!'))
  .catch((error) => console.error('Error generating badge:', error));
