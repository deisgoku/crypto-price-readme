import fetch from "node-fetch";

// ======================== CACHE ========================
let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000;

// ======================== SOURCES ========================

// 1. CoinMarketCap
async function fetchFromCMC() {
  const apiKey = process.env.CMC_API_KEY;
  const res = await fetch("https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=6", {
    headers: { "X-CMC_PRO_API_KEY": apiKey },
  });
  const json = await res.json();
  return json.data.map((coin) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol,
    price: coin.quote.USD.price.toFixed(2),
    volume: coin.quote.USD.volume_24h.toFixed(0),
    trendChange: coin.quote.USD.percent_change_24h.toFixed(2),
  }));
}

// 2. CoinGecko
async function fetchFromCoingecko() {
  const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=6&page=1");
  const json = await res.json();
  return json.map((coin) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
    price: coin.current_price.toFixed(2),
    volume: coin.total_volume.toFixed(0),
    trendChange: coin.price_change_percentage_24h.toFixed(2),
  }));
}

// 3. Binance (fallback 2)
async function fetchFromBinance() {
  const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=6&page=1");
  const topCoins = await res.json();
  const symbols = topCoins.map((coin) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
    binanceSymbol: `${coin.symbol.toUpperCase()}USDT`,
  }));

  const data = await Promise.all(
    symbols.map(async (coin) => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${coin.binanceSymbol}`);
        const json = await res.json();
        if (json.code) throw new Error(json.msg);
        return {
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          price: parseFloat(json.lastPrice).toFixed(2),
          volume: parseFloat(json.quoteVolume).toFixed(0),
          trendChange: parseFloat(json.priceChangePercent).toFixed(2),
        };
      } catch {
        return null;
      }
    })
  );

  return data.filter((coin) => coin !== null);
}

// ======================== COMBINE & CACHE ========================
async function getCoinData() {
  const now = Date.now();
  if (cachedData && now - lastFetchTime < CACHE_DURATION) return cachedData;
  try {
    cachedData = await fetchFromCMC();
  } catch {
    try {
      cachedData = await fetchFromCoingecko();
    } catch {
      cachedData = await fetchFromBinance();
    }
  }
  lastFetchTime = now;
  return cachedData;
}

async function getChartSvg(symbol, theme) {
  try {
    const res = await fetch(`https://crypto-price-on.vercel.app/api/chart?symbol=${symbol.toLowerCase()}&theme=${theme}`);
    const chartSvg = await res.text();
    return chartSvg.includes("<svg") ? chartSvg : "no chart";
  } catch {
    return "no chart";
  }
}

// ======================== MAIN HANDLER ========================
export default async function handler(req, res) {
  const { theme = "light" } = req.query;
  const data = await getCoinData();

  const isDark = theme === "dark";
  const bg = isDark ? "#0d1117" : "#ffffff";
  const text = isDark ? "#c9d1d9" : "#000000";
  const titleColor = isDark ? "#c9d1d9" : "#000000";
  const headerText = "#ffffff";
  const border = isDark ? "#ffffff" : "#000000";
  const shadow = isDark ? "#00000088" : "#cccccc88";

  const header = `
    <g transform="translate(0, 40)">
      <text x="300" text-anchor="middle" y="0" font-size="16" fill="${titleColor}" font-family="monospace" font-weight="bold">
        ☍ Top 6 Crypto Prices
      </text>
    </g>
    <g transform="translate(0, 60)">
      <rect x="10" y="0" width="580" height="30" rx="6" ry="6" fill="${border}" />
      <text x="70" y="15" text-anchor="middle" font-size="13" fill="${headerText}" font-family="monospace" font-weight="bold">NAME</text>
      <text x="190" y="15" text-anchor="end" font-size="13" fill="${headerText}" font-family="monospace" font-weight="bold">PRICE</text>
      <text x="300" y="15" text-anchor="end" font-size="13" fill="${headerText}" font-family="monospace" font-weight="bold">VOL</text>
      <text x="410" y="15" text-anchor="end" font-size="13" fill="${headerText}" font-family="monospace" font-weight="bold">TREND</text>
      <text x="520" y="15" text-anchor="middle" font-size="13" fill="${headerText}" font-family="monospace" font-weight="bold">CHART</text>
    </g>
  `;

  const coinRows = await Promise.all(data.map(async (item, i) => {
    const y = 100 + i * 60;
    const rowBg =
      item.trendChange > 0
        ? "#103c2d"
        : item.trendChange < 0
        ? "#3c1010"
        : isDark
        ? "#161b22"
        : "#d6d6d6";

    const chart = await getChartSvg(item.symbol, theme);
    const chartOnly = chart.replace(/<\/?svg[^>]*>/g, "");

    return `
      <g transform="translate(10, ${y})">
        <rect width="580" height="50" rx="6" ry="6" fill="${rowBg}" />
        <text x="70" y="25" text-anchor="end" font-size="13" fill="${text}" font-family="monospace">${item.symbol}</text>
        <text x="190" y="25" text-anchor="end" font-size="13" fill="${text}" font-family="monospace">${item.price}</text>
        <text x="300" y="25" text-anchor="end" font-size="13" fill="${text}" font-family="monospace">${item.volume}</text>
        <text x="410" y="25" text-anchor="end" font-size="13" fill="${text}" font-family="monospace">${item.trendChange}%</text>
        <g transform="translate(470, 5)">${chartOnly}</g>
        <rect width="580" height="50" fill="none" stroke="${border}" stroke-width="0.5" rx="6" ry="6" />
      </g>
    `;
  }));

  const footerY = 100 + data.length * 60 + 20;
  const footer = `
    <text x="300" y="${footerY}" text-anchor="middle" font-size="11" fill="${titleColor}" font-family="monospace">
      © crypto-price-readme v1.4.1 by github.com/deisgoku
    </text>
  `;

  const cardHeight = footerY + 20;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="${cardHeight}" viewBox="0 0 600 ${cardHeight}">
      <style> text { dominant-baseline: middle; } </style>
      <filter id="card-shadow"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="${shadow}" /></filter>
      <g filter="url(#card-shadow)">
        <rect x="5" y="5" width="590" height="${cardHeight - 10}" rx="12" ry="12" fill="${bg}" />
      </g>
      ${header}
      ${coinRows.join("")}
      ${footer}
    </svg>
  `;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
  res.status(200).send(svg);
}
