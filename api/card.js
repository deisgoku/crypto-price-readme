const fetch = require('node-fetch');
const buildCoinIdMap = require('./coin-id-map');

// Failover logic for each type of data
async function fetchPrice(ids) {
  try {
    if (ids.gecko) return await getPriceFromGecko(ids.gecko);
    if (ids.cmc) return await getPriceFromCMC(ids.cmc);
    if (ids.binance) return await getPriceFromBinance(ids.binance);
  } catch (err) {
    return null;
  }
}

async function fetchVolume(ids) {
  try {
    if (ids.gecko) return await getVolumeFromGecko(ids.gecko);
    if (ids.cmc) return await getVolumeFromCMC(ids.cmc);
    if (ids.binance) return await getVolumeFromBinance(ids.binance);
  } catch (err) {
    return null;
  }
}

async function fetchTrend(ids) {
  try {
    if (ids.gecko) return await getTrendFromGecko(ids.gecko);
    if (ids.cmc) return await getTrendFromCMC(ids.cmc);
    if (ids.binance) return await getTrendFromBinance(ids.binance);
  } catch (err) {
    return null;
  }
}

async function fetchChart(ids) {
  try {
    if (ids.gecko) return await getChartFromGecko(ids.gecko);
    if (ids.cmc) return await getChartFromCMC(ids.cmc);
    if (ids.binance) return await getChartFromBinance(ids.binance);
  } catch (err) {
    return null;
  }
}

// Mocked fetchers (implementasi asli harus ganti dengan fetch dari API sebenarnya)
async function getPriceFromGecko(id) { return 123.45; }
async function getPriceFromCMC(id) { return 123.45; }
async function getPriceFromBinance(id) { return 123.45; }

async function getVolumeFromGecko(id) { return 987654321; }
async function getVolumeFromCMC(id) { return 987654321; }
async function getVolumeFromBinance(id) { return 987654321; }

async function getTrendFromGecko(id) { return '+3.21%'; }
async function getTrendFromCMC(id) { return '+3.21%'; }
async function getTrendFromBinance(id) { return '+3.21%'; }

async function getChartFromGecko(id) { return 'chart-data'; }
async function getChartFromCMC(id) { return 'chart-data'; }
async function getChartFromBinance(id) { return 'chart-data'; }

module.exports = async (req, res) => {
  try {
    const coinList = await buildCoinIdMap();

    const data = await Promise.all(coinList.map(async ({ symbol, ids }) => {
      const [price, volume, trend, chart] = await Promise.all([
        fetchPrice(ids),
        fetchVolume(ids),
        fetchTrend(ids),
        fetchChart(ids)
      ]);

      return { symbol, price, volume, trend, chart };
    }));

    const isDark = theme === "dark";
  const bg = isDark ? "#0d1117" : "#ffffff";
  const text = isDark ? "#c9d1d9" : "#ffffff";
  const titleColor = isDark ? "#c9d1d9" : "#000000";
  const headerText = "#ffffff";
  const border = isDark ? "#ffffff" : "#000000";
  const shadow = isDark ? "#00000088" : "#cccccc88";

  const header = `
    <g transform="translate(0, 40)">
      <text x="300" text-anchor="middle" y="0" font-size="16" fill="${titleColor}" font-family="monospace" font-weight="bold">
        ☍ Top 6 Popular Prices
      </text>
    </g>
    <g transform="translate(0, 60)">
      <rect x="10" y="0" width="580" height="30" rx="6" ry="6" fill="${border}" />
      <text x="70" y="15" text-anchor="middle" font-size="13" fill="${headerText}" font-family="monospace" font-weight="bold">NAME</text>
      <text x="190" y="15" text-anchor="middle" font-size="13" fill="${headerText}" font-family="monospace" font-weight="bold">PRICE</text>
      <text x="300" y="15" text-anchor="middle" font-size="13" fill="${headerText}" font-family="monospace" font-weight="bold">VOL</text>
      <text x="410" y="15" text-anchor="middle" font-size="13" fill="${headerText}" font-family="monospace" font-weight="bold">TREND</text>
      <text x="520" y="15" text-anchor="middle" font-size="13" fill="${headerText}" font-family="monospace" font-weight="bold">CHART</text>
    </g>
  `;

  const coinRows = data.filter(Boolean).map((item, i) => {
    const y = 100 + i * 60;
    const rowBg = item.trendChange > 0 ? "#103c2d" : item.trendChange < 0 ? "#3c1010" : isDark ? "#161b22" : "#d6d6d6";
    return `
      <g transform="translate(10, ${y})">
        <rect width="580" height="50" rx="6" ry="6" fill="${rowBg}" />
        <text x="70" y="25" text-anchor="end" font-size="13" fill="${text}" font-family="monospace">${item.symbol}</text>
        <text x="190" y="25" text-anchor="end" font-size="13" fill="${text}" font-family="monospace">${item.price}</text>
        <text x="300" y="25" text-anchor="end" font-size="13" fill="${text}" font-family="monospace">${item.volume}</text>
        <text x="410" y="25" text-anchor="end" font-size="13" fill="${text}" font-family="monospace">${item.trend}</text>
        <g transform="translate(470, 5)">${item.chart.replace(/<\/?svg[^>]*>/g, "")}</g>
        <rect width="580" height="50" fill="none" stroke="${border}" stroke-width="0.5" rx="6" ry="6" />
      </g>
    `;
  }).join("");

  const footerY = 100 + data.length * 60 + 20;
  const footer = `<text x="300" y="${footerY}" text-anchor="middle" font-size="11" fill="${titleColor}" font-family="monospace">© crypto-price-readme v1.4.1 by github.com/deisgoku</text>`;
  const cardHeight = footerY + 20;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="${cardHeight}" viewBox="0 0 600 ${cardHeight}">
      <style> text { dominant-baseline: middle; } </style>
      <filter id="card-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="${shadow}" />
      </filter>
      <g filter="url(#card-shadow)">
        <rect x="5" y="5" width="590" height="${cardHeight - 10}" rx="12" ry="12" fill="${bg}" />
      </g>
      ${header}
      ${coinRows}
      ${footer}
    </svg>
  `;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
  res.status(200).send(svg);
}
  
