const fetch = require('node-fetch');
const { redis } = require('../lib/redis');

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CMC_API = 'https://pro-api.coinmarketcap.com/v1';
const BINANCE_API = 'https://api.binance.com/api/v3/ticker/24hr';
const CMC_KEY = process.env.CMC_API_KEY;

// === UTILS ===
function formatVolume(value) {
  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
  return value.toFixed(0);
}

function formatTrend(value) {
  const trend = parseFloat((value || 0).toFixed(2));
  return (trend >= 0 ? '+' : '') + trend + '%';
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

// === REDIS CACHE ===
async function cacheData(key, data, ttl = 300) {
  try {
    const value = typeof data === 'string' ? data : JSON.stringify(data);
    await redis.set(key, value, 'EX', ttl);
  } catch (err) {
    console.error(`[Redis SET] ${key} —`, err.message);
  }
}

async function getCache(key) {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (err) {
      console.warn(`[Redis PARSE] ${key} —`, err.message);
      return null;
    }
  } catch (err) {
    console.error(`[Redis GET] ${key} —`, err.message);
    return null;
  }
}


// ####  Cat Index 
async function buildCategoryIndex(limit = 250) {
  const catListRes = await fetch(`${COINGECKO_API}/coins/categories/list`);
  const catList = await catListRes.json();

  const index = {};
  for (const cat of catList) {
    const marketRes = await fetch(`${COINGECKO_API}/coins/markets?vs_currency=usd&category=${encodeURIComponent(cat.category_id)}&per_page=${limit}&page=1`);
    const data = await marketRes.json();
    if (!Array.isArray(data)) continue;

    for (const coin of data) {
      const { price, micin } = formatPrice(coin.current_price);
      const entry = {
        symbol: coin.symbol.toUpperCase(),
        price,
        micin,
        volume: formatVolume(coin.total_volume),
        trend: formatTrend(coin.price_change_percentage_24h),
        sparkline: [],
        fromCategory: cat.name,
      };

      index[coin.symbol.toLowerCase()] = entry;
    }
  }

  return index;
}


// === FETCHERS ===
async function fetchGeckoSymbols(symbols = [], limit = 5, categoryIndex = null) {
  const coinListRes = await fetch(`${COINGECKO_API}/coins/list`);
  const coinList = await coinListRes.json();

  const matchedIds = symbols.map(sym => {
    const lowerSym = sym.toLowerCase();
    const candidates = coinList.filter(c => c.symbol.toLowerCase() === lowerSym);
    const bestMatch = candidates.find(c => c.id.includes(lowerSym)) || candidates[0];
    return bestMatch ? bestMatch.id : null;
  }).filter(Boolean).slice(0, limit);

  if (!matchedIds.length) throw new Error('Symbol tidak ditemukan di CoinGecko');

  const [priceRes, marketRes] = await Promise.all([
    fetch(`${COINGECKO_API}/simple/price?ids=${matchedIds.join(',')}&vs_currencies=usd`),
    fetch(`${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${matchedIds.join(',')}`),
  ]);
  if (!priceRes.ok || !marketRes.ok) throw new Error('Gagal ambil data harga/market dari CoinGecko');

  const [priceData, marketData] = await Promise.all([priceRes.json(), marketRes.json()]);

  const results = [];

  for (const id of matchedIds) {
    try {
      const coin = marketData.find(c => c.id === id);
      const price = priceData[id]?.usd || 0;
      const { price: formattedPrice, micin } = formatPrice(price);

      let contract_address = {};
      let symbol = coin?.symbol?.toUpperCase() || id.toUpperCase();

      // Ambil detail buat contract address & fallback kategori
      const detailRes = await fetch(`${COINGECKO_API}/coins/${id}`);
      const detail = await detailRes.json();

      if (detail.platforms && typeof detail.platforms === 'object') {
        for (const [platform, address] of Object.entries(detail.platforms)) {
          if (address && typeof address === 'string' && address.trim().length > 0) {
            contract_address[platform] = address.trim();
          }
        }
      }

      // Kalau data kosong atau harga 0, coba fallback via kategori
      if ((!coin || price === 0) && categoryIndex && detail.categories?.length) {
        const fallbackSym = detail.symbol.toLowerCase();
        const fallback = categoryIndex[fallbackSym];
        if (fallback) {
          results.push({
            symbol: fallback.symbol,
            price: fallback.price,
            micin: fallback.micin,
            volume: fallback.volume,
            trend: fallback.trend,
            contract_address,
            sparkline: [],
          });
          console.warn(`[Fallback via Category] Gunakan ${detail.categories[0]} untuk ${fallbackSym}`);
          continue;
        }
      }

      results.push({
        symbol,
        price: formattedPrice,
        micin,
        volume: formatVolume(coin?.total_volume || 0),
        trend: formatTrend(coin?.price_change_percentage_24h || 0),
        contract_address,
        sparkline: [],
      });
    } catch (err) {
      console.warn(`[Lewati ${id}] ${err.message}`);
      continue;
    }
  }

  if (!results.length) throw new Error('Semua simbol gagal diambil dari CoinGecko');
  return results;
}


async function fetchGeckoCategory(category, limit) {
  const url = `${COINGECKO_API}/coins/markets?vs_currency=usd&category=${encodeURIComponent(category)}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || !Array.isArray(data) || data.length === 0) throw new Error('Gecko category fetch failed');
  return data.map(coin => {
    const { price, micin } = formatPrice(coin.current_price);
    return {
      symbol: coin.symbol.toUpperCase(),
      price,
      micin,
      volume: formatVolume(coin.total_volume),
      trend: formatTrend(coin.price_change_percentage_24h),
      sparkline: [],
    };
  });
}

async function fetchCMC(categoryOrIds, isCategory, limit) {
  if (!CMC_KEY) throw new Error('Missing CMC API Key');

  if (isCategory) {
    const slugRes = await fetch(`${CMC_API}/cryptocurrency/category`, {
      headers: { 'X-CMC_PRO_API_KEY': CMC_KEY }
    });
    const json = await slugRes.json();
    const match = json.data.find(c => c.name.toLowerCase().includes(categoryOrIds.toLowerCase()));
    if (!match) throw new Error('CMC category not found');
    const ids = match.coins.slice(0, limit).map(c => c.id).join(',');
    const dataRes = await fetch(`${CMC_API}/cryptocurrency/quotes/latest?id=${ids}`, {
      headers: { 'X-CMC_PRO_API_KEY': CMC_KEY }
    });
    const data = await dataRes.json();
    return Object.values(data.data).map(coin => {
      const { price, micin } = formatPrice(coin.quote.USD.price);
      return {
        symbol: coin.symbol,
        price,
        micin,
        volume: formatVolume(coin.quote.USD.volume_24h),
        trend: formatTrend(coin.quote.USD.percent_change_24h),
        sparkline: [],
      };
    });
  } else {
    const symbols = categoryOrIds.join(',');
    const dataRes = await fetch(`${CMC_API}/cryptocurrency/quotes/latest?symbol=${symbols}`, {
      headers: { 'X-CMC_PRO_API_KEY': CMC_KEY }
    });
    const data = await dataRes.json();
    return Object.values(data.data).map(coin => {
      const { price, micin } = formatPrice(coin.quote.USD.price);
      return {
        symbol: coin.symbol,
        price,
        micin,
        volume: formatVolume(coin.quote.USD.volume_24h),
        trend: formatTrend(coin.quote.USD.percent_change_24h),
        sparkline: [],
      };
    });
  }
}

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
        trend: formatTrend(parseFloat(d.priceChangePercent)),
        sparkline: [],
      };
    });
}

// === MAIN HANDLER ===
module.exports = async (req, res) => {
  const { coin, category, count = 5 } = req.query;

  if (!coin && !category) {
    return res.status(400).json({ error: 'Butuh query coin atau category' });
  }

  try {
    let result = [];

    const rawLimit = parseInt(count);
    const limit = isNaN(rawLimit) ? 5 : Math.min(rawLimit, 20);

    if (coin) {
      const coins = coin
        .split(',')
        .map(c => c.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, limit);

      const cacheKey = `crypto:symbol:${coins.join(',')}`;
      const cached = await getCache(cacheKey);
      if (cached) result = result.concat(cached);
      else {
        try {
          const r = await fetchGeckoSymbols(coins, limit);
          result = result.concat(r);
          await cacheData(cacheKey, r, 300);
        } catch {
          try {
            const r = await fetchCMC(coins.map(c => c.toUpperCase()), false, limit);
            result = result.concat(r);
            await cacheData(cacheKey, r, 300);
          } catch {
            const r = await fetchBinance(limit);
            result = result.concat(r);
            await cacheData(cacheKey, r, 300);
          }
        }
      }
    }

    if (category) {
      const cacheKey = `crypto:category:${category}:${limit}`;
      const cached = await getCache(cacheKey);
      if (cached) result = result.concat(cached);
      else {
        try {
          const r = await fetchGeckoCategory(category, limit);
          result = result.concat(r);
          await cacheData(cacheKey, r, 300);
        } catch {
          try {
            const r = await fetchCMC(category, true, limit);
            result = result.concat(r);
            await cacheData(cacheKey, r, 300);
          } catch {
            const r = await fetchBinance(limit);
            result = result.concat(r);
            await cacheData(cacheKey, r, 300);
          }
        }
      }
    }

    if (!result.length) return res.status(404).json({ error: 'Data tidak ditemukan' });
    return res.json({ data: result });

  } catch (err) {
    console.error('[API ERROR]', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
