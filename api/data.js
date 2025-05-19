const fetch = require('node-fetch');
const randomUseragent = require('random-useragent');
const chalk = require('chalk');
const { redis } = require('../lib/redis');



const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CMC_API = 'https://pro-api.coinmarketcap.com/v1';
const BINANCE_API = 'https://api.binance.com/api/v3/ticker/24hr';
const CMC_KEY = process.env.CMC_API_KEY;



// === UTILS ===

async function fetchWithUA(url, options = {}) {
  const ua = randomUseragent.getRandom();
  const headers = {
    ...options.headers,
    'User-Agent': ua || 'Mozilla/5.0',
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res;
}

async function fetchWithRetry(url, options = {}, retries = 3, delayMs = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetchWithUA(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // cek apakah json valid dan lengkap sesuai kebutuhan
      if (!json || Object.keys(json).length === 0) throw new Error('Data kosong');
      return json;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, delayMs)); // delay sebelum retry
    }
  }
}


async function fetchInBatches(urls, batchSize = 5, delayMs = 1500) {
  const results = [];
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(url => fetchWithRetry(url)));
    results.push(...batchResults);
    if (i + batchSize < urls.length) await new Promise(r => setTimeout(r, delayMs));
  }
  return results;
}


// ==== Format Volume M ,B ,K =====
function formatVolume(value) {
  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
  return value.toFixed(0);
}

// ===== Format Trend / 24h ========
function formatTrend(value) {
  const trend = parseFloat((value || 0).toFixed(2));
  return (trend >= 0 ? '+' : '') + trend + '%';
}



function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '\'': '&apos;', '"': '&quot;',
  }[c]));
}

// ====== Smart Decimal Price ======
function formatPrice(value) {
  if (value >= 1000) {
    return { price: value.toFixed(2), micin: false };
  }
  if (value >= 1) {
    return { price: value.toFixed(4), micin: false };
  }
  if (value >= 0.01) {
    return { price: value.toFixed(6), micin: false };
  }
  // micin style untuk harga di bawah 0.01
  const str = value.toFixed(18);
  const match = str.match(/^0\.0+(?=\d)/);
  const zeroCount = match ? match[0].length - 2 : 0;
  const rest = str.slice(match ? match[0].length : 2).replace(/0+$/, '').slice(0, 4);
  return { price: `0.0{${zeroCount}}${rest}`, micin: true };
}

// === REDIS CACHE DENGAN LOG WARNA & TIMESTAMP ===

function timestamp() {
  return chalk.gray(`[${new Date().toISOString().replace('T', ' ').slice(0, 19)}]`);
}

async function cacheData(key, data, ttl = 300) {
  try {
    const size = JSON.stringify(data).length;
    await redis.set(key, JSON.stringify(data), { ex: ttl });
    console.log(`${timestamp()} ${chalk.greenBright('[CACHE SET]')} Key: ${chalk.yellow(key)} | TTL: ${chalk.cyan(ttl + 's')} | Size: ${chalk.magenta(size + ' bytes')}`);
  } catch (err) {
    console.error(`${timestamp()} ${chalk.red('[CACHE ERROR]')} Gagal set key: ${chalk.yellow(key)}`, err);
  }
}

async function getCache(key) {
  try {
    const data = await redis.get(key);
    if (data) {
      console.log(`${timestamp()} ${chalk.blueBright('[CACHE HIT]')} Key: ${chalk.yellow(key)}`);
      return JSON.parse(data);
    } else {
      console.log(`${timestamp()} ${chalk.dim('[CACHE MISS]')} Key: ${chalk.yellow(key)}`);
      return null;
    }
  } catch (err) {
    console.error(`${timestamp()} ${chalk.red('[CACHE ERROR]')} Gagal get key: ${chalk.yellow(key)}`, err);
    return null;
  }
}


// ===  METADATA ( CA , BLOCKCHAIN SITE , LINK SOSMED )===

async function getContractAddress(symbol, geckoDetail) {
  const cacheKey = `crypto:metadata:ca:${symbol.toLowerCase()}`;
  // coba ambil dari cache dulu
  const cached = await redis.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // kalau parse error, lanjut fetch ulang
    }
  }

  const ca = {};

  try {
    if (geckoDetail.detail_platforms && typeof geckoDetail.detail_platforms === 'object') {
      for (const [chain, info] of Object.entries(geckoDetail.detail_platforms)) {
        const addr = info?.contract_address;
        if (addr && typeof addr === 'string' && addr.trim()) {
          ca[chain] = addr.trim();
        }
      }
    }

    if (geckoDetail.platforms && typeof geckoDetail.platforms === 'object') {
      for (const [chain, addr] of Object.entries(geckoDetail.platforms)) {
        if (!ca[chain] && addr && typeof addr === 'string' && addr.trim()) {
          ca[chain] = addr.trim();
        }
      }
    }

    if (
      geckoDetail.asset_platform_id &&
      geckoDetail.detail_platforms?.[geckoDetail.asset_platform_id]?.contract_address &&
      !ca[geckoDetail.asset_platform_id]
    ) {
      const fallbackAddr = geckoDetail.detail_platforms[geckoDetail.asset_platform_id].contract_address;
      if (fallbackAddr && typeof fallbackAddr === 'string') {
        ca[geckoDetail.asset_platform_id] = fallbackAddr.trim();
      }
    }

    if (Object.keys(ca).length > 0) {
      // simpan cache 7 hari (atau permanen)
      await redis.set(cacheKey, JSON.stringify(ca), { ex: 7 * 24 * 3600 });
      return ca;
    }
  } catch (e) {
    console.warn('Error parsing CoinGecko:', e.message);
  }

  // fallback CoinMarketCap tetap seperti biasa, tapi cache juga kalau dapat
  try {
    if (!CMC_KEY) throw new Error('CMC API key tidak tersedia');

    const res = await fetchWithUA(
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
        if (name && token_address) {
          const cmcCa = { [name.toLowerCase()]: token_address };
          await redis.set(cacheKey, JSON.stringify(cmcCa), { ex: 7 * 24 * 3600 });
          return cmcCa;
        }
      }
    }
  } catch (e) {
    console.warn('Error ambil CA CoinMarketCap:', e.message);
  }

  // kalau tetap kosong, cache juga supaya gak coba terus
  await redis.set(cacheKey, JSON.stringify({}), { ex: 24 * 3600 }); // cache kosong 1 hari
  return {};
}

async function getBlockchainSites(symbol, geckoDetail) {
  const cacheKey = `crypto:metadata:blockchain_sites:${symbol.toLowerCase()}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  const sites = Array.isArray(geckoDetail.links?.blockchain_site)
    ? geckoDetail.links.blockchain_site.filter(site => site && site.startsWith('http'))
    : [];

  await redis.set(cacheKey, JSON.stringify(sites), { ex: 7 * 24 * 3600 });
  return sites;
}

async function getSocialLinks(symbol, geckoDetail) {
  const cacheKey = `crypto:metadata:social_links:${symbol.toLowerCase()}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // parse error, lanjut fetch ulang
    }
  }

  const social = {};

  const links = geckoDetail.links || {};

  if (typeof links.twitter_screen_name === 'string' && links.twitter_screen_name.trim()) {
    social.twitter = `https://twitter.com/${links.twitter_screen_name}`;
  }

  if (typeof links.facebook_username === 'string' && links.facebook_username.trim()) {
    social.facebook = `https://facebook.com/${links.facebook_username}`;
  }

  if (typeof links.subreddit_url === 'string' && links.subreddit_url.startsWith('http')) {
    social.reddit = links.subreddit_url;
  }

  if (typeof links.telegram_channel_identifier === 'string' && links.telegram_channel_identifier.trim()) {
    social.telegram = `https://t.me/${links.telegram_channel_identifier}`;
  }

  if (Array.isArray(links.chat_url)) {
    const discord = links.chat_url.find(url => typeof url === 'string' && url.includes('discord'));
    if (discord) {
      social.discord = discord;
    }
  }

  if (Array.isArray(links.repos_url?.github)) {
    const github = links.repos_url.github.find(url => typeof url === 'string' && url.includes('github.com'));
    if (github) {
      social.github = github;
    }
  }

  // Simpan cache selama 7 hari
  await redis.set(cacheKey, JSON.stringify(social), { ex: 7 * 24 * 3600 });

  return social;
}

// ============={==FETCHER =======

async function fetchGeckoSymbols(symbols = [], limit = 5) {
  const coinList = await fetchWithRetry(`${COINGECKO_API}/coins/list`);

  const matchedIds = symbols
    .map(sym => {
      const lowerSym = sym.toLowerCase();
      const candidates = coinList.filter(c => c.symbol.toLowerCase() === lowerSym);
      return (candidates.find(c => c.id.includes(lowerSym)) || candidates[0])?.id || null;
    })
    .filter(Boolean)
    .slice(0, limit);

  if (!matchedIds.length) throw new Error('Symbol tidak ditemukan di CoinGecko');

  // Ambil detail coin pakai retry & batch
  const detailUrls = matchedIds.map(id => `${COINGECKO_API}/coins/${id}`);
  const detailData = await fetchInBatches(detailUrls, 3, 1500); // batch size bisa disesuaikan

  const results = [];

  for (let i = 0; i < matchedIds.length; i++) {
    const detail = detailData[i];
    const id = matchedIds[i];
    const symbol = detail.symbol.toLowerCase();

    const categorySlug = detail.categories?.[0]?.toLowerCase().replace(/\s+/g, '-');
    if (!categorySlug) {
      console.warn(`Kategori tidak ditemukan untuk ${id}`);
      continue;
    }

    const marketUrl = `${COINGECKO_API}/coins/markets?vs_currency=usd&category=${categorySlug}&order=market_cap_desc&per_page=250&page=1&sparkline=false`;
    const marketData = await fetchWithRetry(marketUrl);

    const coinMarket = marketData.find(c => c.symbol.toLowerCase() === symbol);
    if (!coinMarket) {
      console.warn(`Coin ${symbol} tidak ditemukan dalam kategori ${categorySlug}`);
      continue;
    }

    const { price, micin } = formatPrice(coinMarket.current_price || 0);
    const volume = formatVolume(coinMarket.total_volume || 0);
    const trend = formatTrend(coinMarket.price_change_percentage_24h || 0);

    const contractAddress = await getContractAddress(symbol, detail);
    const blockchainSites = await getBlockchainSites(symbol, detail);
    const social = await getSocialLinks(symbol, detail);

    results.push({
      name: detail.name,
      symbol: coinMarket.symbol.toUpperCase(),
      price,
      micin,
      volume,
      trend,
      sparkline: [],
      contract_address: contractAddress,
      blockchain_sites: blockchainSites,
      social,
    });
  }

  return results;
}


// Area Category
async function fetchGeckoCategory(category, limit) {
  const url = `${COINGECKO_API}/coins/markets?vs_currency=usd&category=${encodeURIComponent(category)}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`;
  const res = await fetchWithUA(url);
  const data = await res.json();

  if (!res.ok || !Array.isArray(data) || data.length === 0) {
    throw new Error('CoinGecko category fetch failed');
  }

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
    const slugRes = await fetchWithUA(`${CMC_API}/cryptocurrency/category`, {
      headers: { 'X-CMC_PRO_API_KEY': CMC_KEY }
    });
    const json = await slugRes.json();

    const match = json.data.find(c => c.name.toLowerCase().includes(categoryOrIds.toLowerCase()));
    if (!match) throw new Error('CMC category not found');

    const ids = match.coins.slice(0, limit).map(c => c.id).join(',');

    const dataRes = await fetchWithUA(`${CMC_API}/cryptocurrency/quotes/latest?id=${ids}`, {
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
    const dataRes = await fetchWithUA(`${CMC_API}/cryptocurrency/quotes/latest?symbol=${symbols}`, {
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
  const res = await fetchWithUA(BINANCE_API);
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
