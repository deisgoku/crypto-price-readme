import fetch from "node-fetch";

// Konstanta cache
let cachedTopCoins = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // Cache 1 menit

// Ambil top coin dari CoinGecko (utama)
async function fetchTopCoinsFromCoinGecko(limit = 6) {
  const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1`);
  const data = await res.json();
  return data.map((coin) => ({
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
  }));
}

// Ambil top coin dari CoinMarketCap sebagai cadangan
async function fetchTopCoinsFromCMC(geckoSymbols, limit = 6) {
  const res = await fetch("https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=100", {
    headers: { "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY },
  });
  const data = await res.json();
  return data.data
    .filter((coin) => geckoSymbols.includes(coin.symbol))
    .slice(0, limit)
    .map((coin) => ({ id: coin.slug, symbol: coin.symbol }));
}

// Ambil top coin dari Binance sebagai alternatif
async function fetchTopCoinsFromBinance(geckoSymbols, limit = 6) {
  const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  const data = await res.json();
  return data
    .filter((coin) => coin.symbol.endsWith("USDT"))
    .map((coin) => coin.symbol.replace("USDT", ""))
    .filter((symbol) => geckoSymbols.includes(symbol))
    .slice(0, limit)
    .map((symbol) => ({ id: symbol.toLowerCase(), symbol }));
}

// Mapping symbol → id (dari CoinGecko)
async function getCoinGeckoMap() {
  const res = await fetch("https://api.coingecko.com/api/v3/coins/list");
  const data = await res.json();
  const map = {};
  for (const coin of data) {
    map[coin.symbol.toUpperCase()] = coin.id;
  }
  return map;
}

// Fungsi utama untuk ambil top coin dengan fallback ke CMC dan Binance
async function fetchTopCoins(limit = 6) {
  const now = Date.now();
  if (cachedTopCoins && now - lastFetchTime < CACHE_DURATION && cachedTopCoins.length >= limit)
    return cachedTopCoins.slice(0, limit);

  try {
    const primary = await fetchTopCoinsFromCoinGecko(limit);
    const withCorrectId = primary.map(({ symbol, id }) => ({ symbol, id }));
    cachedTopCoins = withCorrectId;
    lastFetchTime = now;
    console.log("Top coins diambil dari: fetchTopCoinsFromCoinGecko");
    return withCorrectId;
  } catch (err) {
    console.error("Gagal dari CoinGecko:", err.message);
  }

  try {
    const geckoMap = await getCoinGeckoMap();
    const geckoSymbols = Object.keys(geckoMap).slice(0, limit);
    const cmc = await fetchTopCoinsFromCMC(geckoSymbols, limit);
    const withCorrectId = cmc.map(({ symbol }) => ({
      symbol,
      id: geckoMap[symbol] || symbol.toLowerCase(),
    }));
    cachedTopCoins = withCorrectId;
    lastFetchTime = now;
    console.log("Top coins diambil dari: fetchTopCoinsFromCMC");
    return withCorrectId;
  } catch (err) {
    console.error("Gagal dari CMC:", err.message);
  }

  try {
    const geckoMap = await getCoinGeckoMap();
    const geckoSymbols = Object.keys(geckoMap).slice(0, limit);
    const binance = await fetchTopCoinsFromBinance(geckoSymbols, limit);
    const withCorrectId = binance.map(({ symbol }) => ({
      symbol,
      id: geckoMap[symbol] || symbol.toLowerCase(),
    }));
    cachedTopCoins = withCorrectId;
    lastFetchTime = now;
    console.log("Top coins diambil dari: fetchTopCoinsFromBinance");
    return withCorrectId;
  } catch (err) {
    console.error("Gagal dari Binance:", err.message);
  }

  return [];
}

// Handler utama untuk endpoint /card
export default async function handler(req, res) {
  const { theme = "light", coin = "6" } = req.query;

  // Validasi & batasi jumlah coin ditampilkan (maks 20)
  const limit = Math.min(parseInt(coin, 10) || 6, 20);

  const coins = await fetchTopCoins(limit);
  const baseUrl = `${req.headers.host.includes("localhost") ? "http" : "https"}://${req.headers.host}`;

  // Ambil data harga, volume, trend, dan chart secara paralel
  const data = await Promise.all(
    coins.map(async ({ id, symbol }) => {
      try {
        const [priceRes, volumeRes, trendRes, chartRes] = await Promise.all([
          fetch(`${baseUrl}/api/prices?coin=${id}`),
          fetch(`${baseUrl}/api/volume?coin=${id}`),
          fetch(`${baseUrl}/api/trend?coin=${id}`),
          fetch(`${baseUrl}/api/chart?coin=${id}`),
        ]);

        const price = await priceRes.json();
        const volume = await volumeRes.json();
        const trend = await trendRes.json();
        const chart = await chartRes.text();

        return {
          id,
          symbol,
          price: price.message,
          volume: volume.message,
          trend: trend.message,
          trendChange: parseFloat(trend.message),
          chart,
        };
      } catch (err) {
        console.error(`Error fetching data for ${id} (${symbol}):`, err);
        return null;
      }
    })
  );

  // Konfigurasi warna berdasarkan tema
  const isDark = theme === "dark";
  const bg = isDark ? "#0d1117" : "#ffffff";
  const text = isDark ? "#c9d1d9" : "#ffffff";
  const titleColor = isDark ? "#c9d1d9" : "#000000";
  const headerText = isDark ? "#000000" : "#ffffff";
  const border = isDark ? "#ffffff" : "#000000";
  const shadow = isDark ? "#00000088" : "#cccccc88";

  // Header SVG
  const header = `
    <g transform="translate(0, 40)">
      <text x="300" text-anchor="middle" y="0" font-size="16" fill="${titleColor}" font-family="monospace" font-weight="bold">
        ☍ Top ${limit} Popular Prices
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

  // Baris per coin
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

  // Footer
  const footerY = 100 + data.length * 60 + 20;
  const footer = `<text x="300" y="${footerY}" text-anchor="middle" font-size="11" fill="${titleColor}" font-family="monospace">© crypto-price-readme v1.4.1 by github.com/deisgoku</text>`;
  const cardHeight = footerY + 20;

  // Final SVG output
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
