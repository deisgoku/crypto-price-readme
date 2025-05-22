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

// contract address
async function getContractAddress(geckoDetail, symbol) {
  console.log('[CA] Memulai getContractAddress:', { symbol, hasGeckoDetail: !!geckoDetail });

  if (geckoDetail && geckoDetail.id) {
    const geckoId = geckoDetail.id.toLowerCase();
    const cacheKey = `crypto:metadata:ca:${geckoId}`;

    // Cek dari cache dulu
    const cached = await redis.get(cacheKey);
    if (cached) {
      try {
        console.log('[CA] Dapat dari Redis cache:', cacheKey);
        return JSON.parse(cached);
      } catch (e) {
        console.warn('[CA] Gagal parse Redis cache:', cacheKey, e.message);
      }
    }

    const ca = {};

    try {
      const detailPlatforms = geckoDetail.detail_platforms || {};
      console.log('[CA] detail_platforms:', Object.keys(detailPlatforms));

      for (const [chain, info] of Object.entries(detailPlatforms)) {
        const addr = info?.contract_address;
        if (typeof addr === 'string' && addr.trim()) {
          ca[chain.toLowerCase()] = addr.trim();
        }
      }

      const platforms = geckoDetail.platforms || {};
      console.log('[CA] platforms:', Object.keys(platforms));

      for (const [chain, addr] of Object.entries(platforms)) {
        const key = chain.toLowerCase();
        if (!ca[key] && typeof addr === 'string' && addr.trim()) {
          ca[key] = addr.trim();
        }
      }

      const assetChain = geckoDetail.asset_platform_id;
      const fallbackAddr = geckoDetail.detail_platforms?.[assetChain]?.contract_address;
      console.log('[CA] asset_platform_id:', assetChain, '=>', fallbackAddr);

      if (assetChain && fallbackAddr && typeof fallbackAddr === 'string') {
        const key = assetChain.toLowerCase();
        if (!ca[key]) {
          ca[key] = fallbackAddr.trim();
        }
      }

      if (Object.keys(ca).length > 0) {
        console.log('[CA] Hasil akhir dari Gecko:', ca);
        await redis.set(cacheKey, JSON.stringify(ca), { ex: 7 * 24 * 3600 });
        return ca;
      } else {
        console.log('[CA] GeckoDetail tidak mengandung contract address.');
      }

    } catch (e) {
      console.warn('[CA] Error parsing CoinGecko CA:', e.message);
    }
  } else {
    console.log('[CA] geckoDetail kosong atau tidak valid:', geckoDetail);
  }

  // === Fallback ke CMC ===
  if (!symbol) return {};

  const cacheKeyFallback = `crypto:metadata:ca:symbol:${symbol.toLowerCase()}`;
  const cachedFallback = await redis.get(cacheKeyFallback);
  if (cachedFallback) {
    try {
      console.log('[CA] Fallback: Dapat dari Redis cache:', cacheKeyFallback);
      return JSON.parse(cachedFallback);
    } catch {
      console.warn('[CA] Fallback: Gagal parse Redis cache:', cacheKeyFallback);
    }
  }

  try {
    if (!CMC_KEY) throw new Error('CMC API key tidak tersedia');
    const upperSymbol = symbol.toUpperCase();

    const res = await fetchWithUA(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?symbol=${upperSymbol}`,
      {
        headers: { 'X-CMC_PRO_API_KEY': CMC_KEY },
      }
    );

    if (res.ok) {
      const json = await res.json();
      const cmcData = json.data?.[upperSymbol];
      const name = cmcData?.platform?.name;
      const token_address = cmcData?.platform?.token_address;

      console.log('[CA] Fallback CMC result:', { name, token_address });

      if (name && token_address) {
        const cmcCa = { [name.toLowerCase()]: token_address };
        await redis.set(cacheKeyFallback, JSON.stringify(cmcCa), { ex: 7 * 24 * 3600 });
        return cmcCa;
      }
    } else {
      console.warn('[CA] Fallback CMC response error:', res.status);
    }
  } catch (e) {
    console.warn('[CA] Error ambil CA dari CoinMarketCap (fallback):', e.message);
  }

  // Cache kosong untuk hindari spam
  await redis.set(cacheKeyFallback, JSON.stringify({}), { ex: 24 * 3600 });
  return {};
}

// blockchain_site
async function getBlockchainSites(geckoDetail, symbol) {
  // Kalau ada geckoDetail dan valid, coba ambil dari cache & parsing
  if (geckoDetail && geckoDetail.id) {
    const geckoId = geckoDetail.id.toLowerCase();
    const cacheKey = `crypto:metadata:blockchain_sites:${geckoId}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        console.log(`Blockchain sites dari cache CoinGecko (${geckoId})`);
        return parsed;
      } catch (e) {
        console.warn(`Gagal parse cache CoinGecko blockchain sites untuk ${geckoId}:`, e.message);
        // lanjut ke bawah
      }
    }

    const sites = Array.isArray(geckoDetail.links?.blockchain_site)
      ? geckoDetail.links.blockchain_site.filter(site => typeof site === 'string' && site.startsWith('http'))
      : [];

    if (sites.length > 0) {
      await redis.set(cacheKey, JSON.stringify(sites), { ex: 7 * 24 * 3600 });
      console.log(`Blockchain sites dari geckoDetail dan disimpan ke cache (${geckoId})`);
      return sites;
    } else {
      console.warn(`Blockchain sites kosong di geckoDetail untuk ${geckoId}`);
    }
  } else {
    console.warn('geckoDetail tidak valid atau tidak tersedia');
  }

  // Fallback ke CoinMarketCap pakai symbol jika geckoDetail tidak valid
  if (!symbol) {
    console.warn('Symbol tidak tersedia, tidak bisa ambil blockchain sites fallback');
    return [];
  }

  const cacheKeyFallback = `crypto:metadata:blockchain_sites:symbol:${symbol.toLowerCase()}`;

  const cachedFallback = await redis.get(cacheKeyFallback);
  if (cachedFallback) {
    try {
      const parsed = JSON.parse(cachedFallback);
      console.log(`Blockchain sites dari cache CMC (${symbol})`);
      return parsed;
    } catch (e) {
      console.warn(`Gagal parse cache fallback CMC untuk ${symbol}:`, e.message);
    }
  }

  try {
    if (!CMC_KEY) throw new Error('CMC API key tidak tersedia');

    const upperSymbol = symbol.toUpperCase();

    const res = await fetchWithUA(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?symbol=${upperSymbol}`,
      {
        headers: { 'X-CMC_PRO_API_KEY': CMC_KEY },
      }
    );

    if (res.ok) {
      const json = await res.json();
      const cmcData = json.data?.[upperSymbol];
      const urls = cmcData?.urls?.blockchain_site;

      const filteredSites = Array.isArray(urls)
        ? urls.filter(site => typeof site === 'string' && site.startsWith('http'))
        : [];

      if (filteredSites.length > 0) {
        await redis.set(cacheKeyFallback, JSON.stringify(filteredSites), { ex: 7 * 24 * 3600 });
        console.log(`Blockchain sites dari CMC (${symbol}) berhasil diambil dan disimpan`);
        return filteredSites;
      } else {
        console.warn(`Blockchain sites kosong dari CMC untuk ${symbol}`);
      }
    } else {
      console.warn(`Request CMC gagal untuk ${symbol}:`, res.status);
    }
  } catch (e) {
    console.warn('Error ambil blockchain sites dari CoinMarketCap (fallback symbol):', e.message);
  }

  // Cache empty array supaya gak terus coba
  await redis.set(cacheKeyFallback, JSON.stringify([]), { ex: 24 * 3600 });
  console.warn(`Blockchain sites kosong dan disimpan sebagai [] di cache fallback (${symbol})`);
  return [];
}

// sosmed links
async function getSocialLinks(geckoDetail, symbol) {
  if (geckoDetail && geckoDetail.id) {
    const geckoId = geckoDetail.id.toLowerCase();
    const cacheKey = `crypto:metadata:social_links:${geckoId}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        console.log(`[cache-hit] Sosial links dari cache Gecko ID: ${geckoId}`);
        return parsed;
      } catch (err) {
        console.warn(`[cache-error] Gagal parsing cache Gecko ID: ${geckoId}`, err.message);
      }
    }

    const social = {};
    const links = geckoDetail.links || {};

    if (typeof links.twitter_screen_name === 'string' && links.twitter_screen_name.trim()) {
      social.twitter = `https://twitter.com/${links.twitter_screen_name.trim()}`;
    }

    if (typeof links.facebook_username === 'string' && links.facebook_username.trim()) {
      social.facebook = `https://facebook.com/${links.facebook_username.trim()}`;
    }

    if (typeof links.subreddit_url === 'string' && links.subreddit_url.startsWith('http')) {
      social.reddit = links.subreddit_url;
    }

    if (typeof links.telegram_channel_identifier === 'string' && links.telegram_channel_identifier.trim()) {
      social.telegram = `https://t.me/${links.telegram_channel_identifier.trim()}`;
    }

    if (Array.isArray(links.chat_url)) {
      const discord = links.chat_url.find(url => typeof url === 'string' && url.includes('discord'));
      if (discord) social.discord = discord;
    }

    if (Array.isArray(links.repos_url?.github)) {
      const github = links.repos_url.github.find(url => typeof url === 'string' && url.includes('github.com'));
      if (github) social.github = github;
    }

    await redis.set(cacheKey, JSON.stringify(social), { ex: 7 * 24 * 3600 });
    console.log(`[cache-set] Sosial links disimpan untuk Gecko ID: ${geckoId}`);
    return social;
  }

  // fallback ke symbol via CMC
  if (!symbol) {
    console.warn('[fallback-abort] Symbol tidak tersedia untuk ambil social links');
    return {};
  }

  const cacheKeyFallback = `crypto:metadata:social_links:symbol:${symbol.toLowerCase()}`;
  const cachedFallback = await redis.get(cacheKeyFallback);

  if (cachedFallback) {
    try {
      const parsed = JSON.parse(cachedFallback);
      console.log(`[cache-hit] Sosial links dari fallback cache Symbol: ${symbol}`);
      return parsed;
    } catch (err) {
      console.warn(`[cache-error] Gagal parsing fallback cache Symbol: ${symbol}`, err.message);
    }
  }

  try {
    if (!CMC_KEY) throw new Error('CMC API key tidak tersedia');
    const upperSymbol = symbol.toUpperCase();

    const res = await fetchWithUA(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?symbol=${upperSymbol}`,
      { headers: { 'X-CMC_PRO_API_KEY': CMC_KEY } }
    );

    if (res.ok) {
      const json = await res.json();
      const cmcData = json.data?.[upperSymbol];
      const urls = cmcData?.urls || {};

      const social = {};

      if (Array.isArray(urls.twitter) && urls.twitter.length > 0) {
        social.twitter = urls.twitter[0];
      }
      if (Array.isArray(urls.facebook) && urls.facebook.length > 0) {
        social.facebook = urls.facebook[0];
      }
      if (Array.isArray(urls.reddit) && urls.reddit.length > 0) {
        social.reddit = urls.reddit[0];
      }
      if (Array.isArray(urls.telegram) && urls.telegram.length > 0) {
        social.telegram = urls.telegram[0];
      }
      if (Array.isArray(urls.discord) && urls.discord.length > 0) {
        social.discord = urls.discord[0];
      }
      if (Array.isArray(urls.github) && urls.github.length > 0) {
        social.github = urls.github[0];
      }

      if (Object.keys(social).length > 0) {
        await redis.set(cacheKeyFallback, JSON.stringify(social), { ex: 7 * 24 * 3600 });
        console.log(`[cache-set] Sosial links dari CMC disimpan untuk Symbol: ${symbol}`);
        return social;
      }
    } else {
      console.warn(`[http-error] Gagal ambil data dari CMC untuk Symbol: ${symbol}, Status: ${res.status}`);
    }
  } catch (e) {
    console.warn(`[fallback-error] Error ambil social links dari CMC untuk Symbol: ${symbol}`, e.message);
  }

  await redis.set(cacheKeyFallback, JSON.stringify({}), { ex: 24 * 3600 });
  console.log(`[cache-set] Kosongkan cache sosial links untuk Symbol: ${symbol}`);
  return {};
}

// ============={==FETCHER =======

async function fetchGeckoSymbols(symbols = []) {
  const coinList = await fetchWithRetry(`${COINGECKO_API}/coins/list`);

  // Cari ID CoinGecko berdasarkan symbol
  const matchedIds = symbols
    .map(sym => {
      const lowerSym = sym.toLowerCase();
      const candidates = coinList.filter(c => c.symbol.toLowerCase() === lowerSym);
      return (candidates.find(c => c.id.includes(lowerSym)) || candidates[0])?.id || null;
    })
    .filter(Boolean);

  if (!matchedIds.length) throw new Error('Symbol tidak ditemukan di CoinGecko');

  const detailUrls = matchedIds.map(id => `${COINGECKO_API}/coins/${id}`);
  const detailData = await fetchInBatches(detailUrls, 3, 1500);

  const results = [];

  for (let i = 0; i < matchedIds.length; i++) {
    const detail = detailData[i];
    if (!detail) {
      console.warn(`Detail coin untuk ID ${matchedIds[i]} kosong`);
      continue;
    }

    const id = matchedIds[i];
    const symbol = detail.symbol.toLowerCase();
    const name = detail.name;

    const categorySlug = detail.categories?.[0]?.toLowerCase().replace(/\s+/g, '-');

    let coinMarket = null;

    // Coba ambil dari data kategori market
    if (categorySlug) {
      try {
        const marketUrl = `${COINGECKO_API}/coins/markets?vs_currency=usd&category=${categorySlug}&order=market_cap_desc&per_page=250&page=1&sparkline=false`;
        const marketData = await fetchWithRetry(marketUrl);
        coinMarket = marketData.find(c => c.symbol.toLowerCase() === symbol);
        if (!coinMarket) {
          console.warn(`Coin ${symbol} tidak ditemukan dalam kategori ${categorySlug}, fallback ke data detail`);
        }
      } catch (err) {
        console.warn(`Gagal ambil market kategori ${categorySlug}:`, err.message);
      }
    } else {
      console.warn(`Kategori tidak ditemukan untuk ${id}, langsung pakai data detail`);
    }

    // Fallback jika coinMarket null
    if (!coinMarket) {
      coinMarket = {
        id,
        name,
        symbol,
        current_price: detail.market_data?.current_price?.usd ?? null,
        total_volume: detail.market_data?.total_volume?.usd ?? null,
        price_change_percentage_24h: detail.market_data?.price_change_percentage_24h ?? null,
        sparkline_in_7d: {
          price: detail.market_data?.sparkline_7d?.price || [],
        }
      };
    }

    const { price, micin } = formatPrice(coinMarket.current_price || 0);
    const volume = formatVolume(coinMarket.total_volume || 0);
    const trend = formatTrend(coinMarket.price_change_percentage_24h || 0);

    const contractAddress = await getContractAddress(detail, symbol);
    const blockchainSites = await getBlockchainSites(detail, symbol);
    const social = await getSocialLinks(detail, symbol);

    console.log(`Nama coin: ${coinMarket.name} (Symbol: ${coinMarket.symbol})`);

    results.push({
      name: coinMarket.name,
      symbol: coinMarket.symbol.toUpperCase(),
      price,
      micin,
      volume,
      trend,
      sparkline: coinMarket.sparkline_in_7d?.price || [],
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
        .

      const cacheKey = `crypto:symbols:${coins.join(',')}`;
      const cached = await getCache(cacheKey);
      if (cached) return res.json({ data: cached });

      try {
        result = await fetchGeckoSymbols(coins);
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
