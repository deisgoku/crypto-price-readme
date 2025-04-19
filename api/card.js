const fetch = require('node-fetch');

const BASE = 'https://crypto-price-on.vercel.app/api';
const COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA'];

async function fetchData(endpoint, symbol) {
  try {
    const res = await fetch(`${BASE}/${endpoint}?coin=${symbol}`);
    return endpoint === 'chart' ? await res.text() : (await res.json())?.data || 'N/A';
  } catch {
    return endpoint === 'chart' ? '<text>Chart N/A</text>' : 'N/A';
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache');

  const theme = req.query.theme === 'light' ? 'light' : 'dark';
  const bg = theme === 'light' ? '#ffffff' : '#0d1117';
  const text = theme === 'light' ? '#000000' : '#ffffff';

  const rows = await Promise.all(
    COINS.map(async (symbol) => {
      const price = await fetchData('prices', symbol);
      const volume = await fetchData('volume', symbol);
      const trend = await fetchData('trend', symbol);
      const chart = await fetchData('chart', symbol);
      return { symbol, price, volume, trend, chart };
    })
  );

  const rowHeight = 44;
  const width = 600;
  const height = rows.length * rowHeight + 70;

  const svgRows = rows.map((coin, i) => {
    const y = 60 + i * rowHeight;
    const trendColor = coin.trend.includes('-') ? '#f85149' : '#3fb950';

    return `
      <text x="20" y="${y}" fill="${text}" font-size="14" font-weight="bold">${coin.symbol}</text>
      <text x="80" y="${y}" fill="${text}" font-size="14">${coin.price}</text>
      <text x="180" y="${y}" fill="#58a6ff" font-size="14">${coin.volume}</text>
      <text x="290" y="${y}" fill="${trendColor}" font-size="14">${coin.trend}</text>
      <g transform="translate(360, ${y - 20})">
        ${coin.chart}
      </g>
    `;
  }).join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <style> text { font-family: 'Segoe UI', sans-serif; } </style>
      <rect width="100%" height="100%" fill="${bg}" rx="16" />
      <text x="20" y="35" font-size="18" font-weight="bold" fill="${text}">Top 6 Crypto Prices</text>
      ${svgRows}
    </svg>
  `;

  res.send(svg);
};
