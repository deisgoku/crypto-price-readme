const fetch = require("node-fetch");
const { getPrice } = require('../api/price');
const { getVolume } = require('../api/volume');
const { getTrend } = require('../api/trend');
const { getChart } = require('../api/chart');
const { renderModern } = require('../lib/settings/modern');
const { renderClassicCMC } = require('../lib/settings/ClassicCMC');

const CACHE_DURATION = 60 * 1000;
let cache = {};

// --- Coin Fetchers ---
async function fetchGeckoCategory(category, coin) {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=${encodeURIComponent(category)}&order=market_cap_desc&per_page=${coin}&page=1`;
  const res = await fetch(url);
  const data = await res.json();
  return data.map((coin) => ({
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
  }));
}

async function getGeckoSymbolMap() {
  const res = await fetch("https://api.coingecko.com/api/v3/coins/list");
  const data = await res.json();
  const map = {};
  for (const coin of data) {
    map[coin.symbol.toUpperCase()] = coin.id;
  }
  return map;
}

async function fetchCMC(geckoSymbols, coin) {
  const res = await fetch("https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=100", {
    headers: {
      "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY,
    },
  });
  const data = await res.json();
  return data.data
    .filter((coin) => geckoSymbols.includes(coin.symbol))
    .slice(0, coin)
    .map((coin) => ({ id: coin.slug, symbol: coin.symbol }));
}

async function fetchBinance(geckoSymbols, coin) {
  const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  const data = await res.json();
  return data
    .filter((coin) => coin.symbol.endsWith("USDT"))
    .map((coin) => coin.symbol.replace("USDT", ""))
    .filter((symbol) => geckoSymbols.includes(symbol))
    .slice(0, coin)
    .map((symbol) => ({ id: symbol.toLowerCase(), symbol }));
}

async function fetchCoinByCategory(category, coin = 6) {
  const now = Date.now();
  if (
    cache[category] &&
    now - cache[category].timestamp < CACHE_DURATION &&
    cache[category].data.length >= coin
  ) {
    return cache[category].data.slice(0, coin);
  }

  try {
    const primary = await fetchGeckoCategory(category, coin);
    cache[category] = { data: primary, timestamp: now };
    console.log(`[Category:${category}] Source: CoinGecko`);
    return primary;
  } catch (err) {
    console.error(`[CoinGecko] Category "${category}" failed:`, err.message);
  }

  try {
    const geckoMap = await getGeckoSymbolMap();
    const symbols = Object.keys(geckoMap);
    const cmc = await fetchCMC(symbols, coin);
    const withIds = cmc.map(({ symbol }) => ({
      symbol,
      id: geckoMap[symbol] || symbol.toLowerCase(),
    }));
    cache[category] = { data: withIds, timestamp: now };
    console.log(`[Category:${category}] Source: CMC`);
    return withIds;
  } catch (err) {
    console.error(`[CMC] fallback for category "${category}" failed:`, err.message);
  }

  try {
    const geckoMap = await getGeckoSymbolMap();
    const symbols = Object.keys(geckoMap);
    const binance = await fetchBinance(symbols, coin);
    const withIds = binance.map(({ symbol }) => ({
      symbol,
      id: geckoMap[symbol] || symbol.toLowerCase(),
    }));
    cache[category] = { data: withIds, timestamp: now };
    console.log(`[Category:${category}] Source: Binance`);
    return withIds;
  } catch (err) {
    console.error(`[Binance] fallback for category "${category}" failed:`, err.message);
  }

  return [];
}

// --- Data Aggregator ---
async function getCoinData(coin = 6, category = "layer-1") {
  const coinList = await fetchCoinByCategory(category, coin);

  const result = await Promise.all(
    coinList.map(async ({ id, symbol }) => {
      try {
        const [price, volume, trend, chart] = await Promise.all([
          getPrice(id),
          getVolume(id),
          getTrend(id),
          getChart(id),
        ]);

        return { id, symbol, price, volume, trend, chart };
      } catch {
        return null;
      }
    })
  );

  return result.filter(Boolean);
}

// --- Main Handler ---
module.exports = async (req, res) => {
  const {
    theme = 'dark',         // Default theme 'dark', bisa diubah lewat query
    coin: rawCoin = 6,      // Default coin = 6, bisa diubah lewat query
    model = 'modern',       // Default model 'modern', bisa diubah lewat query
    category = 'layer-1'    // Default category 'layer-1', bisa diubah lewat query
  } = req.query;

  const coin = Math.min(Math.max(parseInt(rawCoin) || 6, 1), 20); // Mengatur jumlah coin antara 1 dan 20

  // Models yang tersedia
  const models = { 
    modern: renderModern,  // Render untuk model modern
    classic: renderClassicCMC // Render untuk model classic
  };

  // Cek apakah model yang diminta ada dalam objek models
  if (!models[model]) return res.status(400).send("Invalid model");

  // Mengambil data coin
  const data = await getCoinData(coin, category);
  
  // Jika data kosong, kirim pesan error
  if (!data || data.length === 0) return res.send("No data found");

  // Render SVG berdasarkan model yang dipilih
  const svg = models[model](data, theme, coin);

  // Set header untuk response dan kirimkan hasil SVG
  res.setHeader('Content-Type', 'image/svg+xml');
  return res.send(svg);
};
