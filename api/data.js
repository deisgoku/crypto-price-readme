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
async function cacheData(key, data, ttl = 60) {
  try {
    // TTL dalam detik
    await redis.set(key, JSON.stringify(data), { ex: ttl }); 
  } catch (err) {
    console.error('Redis set error:', err);
  }
}

async function getCache(key) {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Redis get error:', err);
    return null;
  }
}


// === FETCHERS ===


function isValidCA(addr) {
  return typeof addr === 'string' && addr.startsWith('0x') && addr.length === 42;
}

async function getContractAddress(symbol, geckoDetail) {
  const ca = {};

  try {
    const platformId = geckoDetail.asset_platform_id;

    // 1. Prioritaskan dari Ethereum
    const ethCA = geckoDetail?.detail_platforms?.ethereum?.contract_address;
    if (isValidCA(ethCA)) {
      ca['ethereum'] = ethCA.trim();
    }

    // 2. Ambil dari asset_platform_id jika valid dan belum ada
    const primaryCA = geckoDetail?.detail_platforms?.[platformId]?.contract_address;
    if (platformId && isValidCA(primaryCA) && !ca[platformId]) {
      ca[platformId] = primaryCA.trim();
    }

    // 3. Lengkapi dari detail_platforms
    if (geckoDetail.detail_platforms && typeof geckoDetail.detail_platforms === 'object') {
      for (const [chain, info] of Object.entries(geckoDetail.detail_platforms)) {
        const addr = info?.contract_address;
        if (isValidCA(addr) && !ca[chain.toLowerCase()]) {
          ca[chain.toLowerCase()] = addr.trim();
        }
      }
    }

    // 4. Lengkapi dari platforms
    if (geckoDetail.platforms && typeof geckoDetail.platforms === 'object') {
      for (const [chain, addr] of Object.entries(geckoDetail.platforms)) {
        if (isValidCA(addr) && !ca[chain.toLowerCase()]) {
          ca[chain.toLowerCase()] = addr.trim();
        }
      }
    }

    if (Object.keys(ca).length > 0) return ca;

  } catch (e) {
    console.warn('Error parsing CoinGecko:', e.message);
  }

  // 5. Fallback ke CoinMarketCap
  try {
    if (!CMC_KEY) throw new Error('CMC API key tidak tersedia');

    const res = await fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?symbol=${symbol.toUpperCase()}`,
      {
        headers: { 'X-CMC_PRO_API_KEY': CMC_KEY },
      }
    );

    if (res.ok) {
      const json = await res.json();
      const cmcData = json.data?.[symbol.toUpperCase()];
      if (cmcData?.platform) {
        const { name, token_address } = cmcData.platform;
        if (name && isValidCA(token_address)) {
          ca[name.toLowerCase()] = token_address;
          return ca;
        }
      }
    }
  } catch (e) {
    console.warn('Error ambil CA dari CoinMarketCap:', e.message);
  }

  return ca; // tetap return meskipun kosong
}


async function fetchGeckoSymbols(symbols = [], limit = 5) {
  // Ambil semua coin list dari CoinGecko
  const coinListRes = await fetch(`${COINGECKO_API}/coins/list`);
  const coinList = await coinListRes.json();

  // Cocokkan symbol ke ID
  const matchedIds = symbols
    .map((sym) => {
      const lowerSym = sym.toLowerCase();
      const candidates = coinList.filter(
        (c) => c.symbol.toLowerCase() === lowerSym
      );
      const bestMatch =
        candidates.find((c) => c.id.includes(lowerSym)) || candidates[0];
      return bestMatch ? bestMatch.id : null;
    })
    .filter(Boolean)
    .slice(0, limit);

  if (!matchedIds.length) throw new Error('Symbol tidak ditemukan di CoinGecko');

  // Fetch detail coin
  const detailPromises = matchedIds.map((id) =>
    fetch(`${COINGECKO_API}/coins/${id}`).then((res) => res.json())
  );
  const detailData = await Promise.all(detailPromises);

  const results = [];

  for (let i = 0; i < matchedIds.length; i++) {
    const id = matchedIds[i];
    const detail = detailData[i];

    // Ambil kategori (slug)
    let categorySlug = null;
    if (detail.categories && detail.categories.length > 0) {
      categorySlug = detail.categories[0]
        .toLowerCase()
        .replace(/\s+/g, '-');
    }

    if (!categorySlug) {
      throw new Error(`Kategori tidak ditemukan untuk coin id ${id}`);
    }

    // Ambil market data kategori
    const marketRes = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&category=${categorySlug}&order=market_cap_desc&per_page=250&page=1&sparkline=false`
    );
    if (!marketRes.ok)
      throw new Error(`Gagal fetch market data kategori ${categorySlug}`);
    const marketData = await marketRes.json();

    const coinSymbol = detail.symbol.toLowerCase();
    const coinMarketData = marketData.find(
      (c) => c.symbol.toLowerCase() === coinSymbol
    );

    if (!coinMarketData) {
      throw new Error(
        `Coin ${coinSymbol} tidak ditemukan dalam kategori ${categorySlug}`
      );
    }

    const price = coinMarketData.current_price || 'N/A';
    const { price: formattedPrice, micin } = formatPrice(price);

    // Panggil getContractAddress untuk ambil CA dengan fallback
    const contract_address = await getContractAddress(detail.symbol, detail);

    results.push({
      symbol: coinMarketData.symbol.toUpperCase(),
      price: formattedPrice,
      micin,
      volume: formatVolume(coinMarketData.total_volume || 'N/A'),
      trend: formatTrend(coinMarketData.price_change_percentage_24h || 'N/A'),
      sparkline: [],
      contract_address,
    });
  }

  return results;
}


// Area Category
async function fetchGeckoCategory(category, limit) {
  const url = `${COINGECKO_API}/coins/markets?vs_currency=usd&category=${encodeURIComponent(category)}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || !Array.isArray(data) || data.length === 0) throw new Error('CoinGecko category fetch failed');
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

// === FINAL HANDLER ===
module.exports = async (req, res) => {
  const { coin, category, count = 5 } = req.query;

  if (!coin && !category) {
    return res.status(400).json({ error: 'Butuh query coin atau category' });
  }

  try {
    let result = [];

    // Maksimal user cuma bisa request sampai 20 item aja
    const rawLimit = parseInt(count);
    const limit = isNaN(rawLimit) ? 5 : Math.min(rawLimit, 20);  // Pastikan limit nggak lebih dari 20

    if (coin) {
      const coins = coin
        .split(',')
        .map(c => c.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, limit);  // Batasi sesuai limit yang diatur

      const cacheKey = `crypto:symbols:${coins.join(',')}`;
      const cached = await getCache(cacheKey);
      if (cached) return res.json({ data: cached });

      try {
        result = await fetchGeckoSymbols(coins, limit);
      } catch {
        try {
          result = await fetchCMC(coins.map(c => c.toUpperCase()), false, limit);
        } catch {
          result = await fetchBinance(limit);
        }
      }

      await cacheData(cacheKey, result, 300);
    }

    if (category) {
      const cacheKey = `crypto:category:${category}:${limit}`;
      const cached = await getCache(cacheKey);
      if (cached) return res.json({ data: cached });

      try {
        result = await fetchGeckoCategory(category, limit);
      } catch {
        try {
          result = await fetchCMC(category, true, limit);
        } catch {
          result = await fetchBinance(limit);
        }
      }

      await cacheData(cacheKey, result, 300);
    }

    if (!result.length) return res.status(404).json({ error: 'Data tidak ditemukan' });
    return res.json({ data: result });

  } catch (err) {
    console.error('ERROR API:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
