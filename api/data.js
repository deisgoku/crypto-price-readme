const fetch = require('node-fetch');
const { redis } = require('../lib/redis');
const { isRegistered } = require('../lib/follow-check');

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const BINANCE_API = 'https://api.binance.com/api/v3/ticker/24hr';

let categoryMap = null;

// Utilities
function formatVolume(value) {
  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
  return value.toFixed(0);
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '\'': '&apos;', '"': '&quot;',
  }[c]));
}

function formatPrice(value) {
  if (value >= 0.01) {
    const str = value.toFixed(8);
    return { price: escapeXml(parseFloat(str).toString()), micin: false };
  }
  const str = value.toFixed(18);
  const match = str.match(/^0\.0+(?=\d)/);
  const zeroCount = match ? match[0].length - 2 : 0;
  const rest = str.slice(match ? match[0].length : 2).replace(/0+$/, '').slice(0, 4);
  const smart = `0.0{${zeroCount}}${rest}`;
  return { price: escapeXml(smart), micin: true };
}

// CoinGecko - Individual Symbols
async function fetchGecko(symbols = [], limit = 5) {
  const symbolsQuery = symbols.length ? `&ids=${symbols.join(',')}` : '';
  const url = `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&sparkline=false${symbolsQuery}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gecko API failed');
  const coins = await res.json();
  return coins.map(coin => {
    const { price, micin } = formatPrice(coin.current_price);
    return {
      symbol: coin.symbol.toUpperCase(),
      price,
      micin,
      volume: formatVolume(coin.total_volume),
      trend: coin.price_change_percentage_24h,
      sparkline: coin.sparkline_in_7d?.price || [],
    };
  });
}

// CoinGecko - Category Support
async function fetchGeckoCategory(category, limit) {
  const url = `${COINGECKO_API}/coins/markets?vs_currency=usd&category=${encodeURIComponent(category)}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gecko category fetch failed');
  const coins = await res.json();
  return coins.map(coin => {
    const { price, micin } = formatPrice(coin.current_price);
    return {
      symbol: coin.symbol.toUpperCase(),
      price,
      micin,
      volume: formatVolume(coin.total_volume),
      trend: coin.price_change_percentage_24h,
      sparkline: [],
    };
  });
}

// Binance fallback
async function fetchBinance(limit) {
  const res = await fetch(BINANCE_API);
  const data = await res.json();
  return data
    .filter(d => d.symbol.endsWith('USDT') && d.symbol.length <= 10)
    .slice(0, limit)
    .map(d => {
      const { price, micin } = formatPrice(parseFloat(d.lastPrice));
      return {
        symbol: d.symbol.replace('USDT', ''),
        price,
        micin,
        volume: formatVolume(parseFloat(d.quoteVolume)),
        trend: parseFloat(d.priceChangePercent),
        sparkline: [],
      };
    });
}

// Caching
async function cacheData(key, data, ttl = 60) {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (error) {
    console.error('Gagal menyimpan ke Redis:', error);
  }
}

async function getCache(key) {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Gagal mengambil data dari Redis:', error);
    return null;
  }
}

// Symbol handler
async function fetchSymbolData(symbols) {
  const cacheKey = `crypto:symbols:${symbols.join(',')}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) return cachedData;

  try {
    let coins = await fetchGecko(symbols, symbols.length);
    if (!coins.length) coins = await fetchBinance(symbols.length);
    await cacheData(cacheKey, coins, 300);
    return coins;
  } catch (err) {
    throw new Error('Gagal ambil data symbol');
  }
}

// Category handler
async function fetchCategoryData(category, limit) {
  const cacheKey = `crypto:category:${category}:${limit}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) return cachedData;

  try {
    const coins = await fetchGeckoCategory(category, limit);
    await cacheData(cacheKey, coins, 300);
    return coins;
  } catch (err) {
    throw new Error('Gagal ambil data kategori');
  }
}

// API Endpoint
module.exports = async (req, res) => {
  const { user, coin, category, count = 5, format = 'json' } = req.query;

  if (format !== 'json') return res.status(400).json({ error: 'Only format=json supported' });
  if (!user) return res.status(403).json({ error: 'Follow dulu GitHub gue buat akses API ini', follow: 'https://github.com/deisgoku' });

  const isValid = await isRegistered(user);
  if (!isValid) return res.status(403).json({ error: `Akun ${user} belum follow`, follow: 'https://github.com/deisgoku' });

  if (coin && category) return res.status(400).json({ error: 'Query coin dan category tidak boleh bersamaan' });
  if (!coin && !category) return res.status(400).json({ error: 'Minimal butuh query coin atau category' });

  try {
    let result = [];

    if (coin) {
      const coins = coin
        .split(',')
        .map(c => c.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 20);
      if (coins.length) result = await fetchSymbolData(coins);
    } else if (category) {
      result = await fetchCategoryData(category.toLowerCase(), parseInt(count));
    }

    if (!result.length) return res.status(404).json({ error: 'Tidak ada data ditemukan' });
    return res.json({ data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memproses data' });
  }
};
