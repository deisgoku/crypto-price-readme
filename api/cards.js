const fetch = require('node-fetch');
const { redis } = require('../lib/redis');
const renderers = require('../lib/settings/model/list');
const renderLocked = require('../lib/settings/data/locked');
const { isRegistered } = require('../lib/follow-check');
const cacheFetch = require('../lib/data/middleware');

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CMC_API = 'https://pro-api.coinmarketcap.com/v1';
const BINANCE_API = 'https://api.binance.com/api/v3/ticker/24hr';
const CMC_KEY = process.env.CMC_API_KEY;

let categoryMap = null;


function generateModelList() {
  return Object.keys(renderers).map(key => ({
    label: key[0].toUpperCase() + key.slice(1),
    value: key
  }));
}

async function handleModelList(req, res) {
  if (req.method === 'GET') {
    try {
      const raw = await redis.get("model:list");
      if (raw) {
        const parsed = JSON.parse(raw);
        return res.status(200).json(parsed);
      }
    } catch (e) {
      console.warn('[modelList] Failed to parse model:list from Redis:', e.message);
      // fallback lanjut di bawah
    }

    const models = generateModelList();
    await redis.set("model:list", JSON.stringify(models), 'EX', 86400);
    return res.status(200).json(models);
  }

  if (req.method === 'POST') {
  const models = generateModelList();
  console.log('[POST] generated models:', models); // Tambahkan ini
  await redis.set("model:list", JSON.stringify(models), 'EX', 86400);
  return res.status(200).json({ ok: true, models });
 }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Utilities
function formatVolume(value) {
  if (value >= 1e9) return (value / 1e9).toFixed(1) + "B";
  if (value >= 1e6) return (value / 1e6).toFixed(1) + "M";
  if (value >= 1e3) return (value / 1e3).toFixed(1) + "K";
  return value.toFixed(0);
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '\'': '&apos;', '"': '&quot;'
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

async function fetchCategoryMap() {
  if (categoryMap) return categoryMap;
  const res = await fetch(`${COINGECKO_API}/coins/categories/list`);
  const list = await res.json();
  categoryMap = new Map(list.map(c => [c.category_id, c.name]));
  return categoryMap;
}

async function fetchGecko(category, limit) {
  const url = `${COINGECKO_API}/coins/markets?vs_currency=usd&category=${category}&order=market_cap_desc&per_page=${limit}&sparkline=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gecko failed');

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

async function fetchCMC(category, limit) {
  const slugRes = await fetch(`${CMC_API}/cryptocurrency/category`, {
    headers: { 'X-CMC_PRO_API_KEY': CMC_KEY }
  });
  const json = await slugRes.json();
  const match = json.data.find(c => c.name.toLowerCase().includes(category.toLowerCase()));
  if (!match) throw new Error('CMC category not found');

  const coins = match.coins.slice(0, limit);
  const ids = coins.map(c => c.id).join(',');
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
      trend: coin.quote.USD.percent_change_24h,
      sparkline: [],
    };
  });
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
        trend: parseFloat(d.priceChangePercent),
        sparkline: [],
      };
    });
}

// Handler utama
module.exports = async (req, res) => {
  // Route tambahan: model:list
  if (req.query.handler === 'modelList') {
    return handleModelList(req, res);
  }

  const { user, model = 'modern', theme = 'dark', coin = '6', category = 'layer1' } = req.query;
  const limit = Math.min(Math.max(parseInt(coin), 1), 20);
  const cacheKey = `${category}_${limit}_${theme}_${model}`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (!user || typeof user !== 'string') {
      return res.status(200).send(renderLocked('Guest'));
    }

    const verified = await isRegistered(user.toLowerCase());
    if (!verified) {
      return res.status(200).send(renderLocked(user));
    }

    const data = await cacheFetch(cacheKey, 60, async () => {
      let result;
      let categoryName = 'General';

      try {
        result = await fetchGecko(category, limit);
        const catMap = await fetchCategoryMap();
        categoryName = catMap.get(category) || category;
      } catch (err1) {
        console.warn('[FALLBACK] Gecko failed:', err1.message);
        try {
          result = await fetchCMC(category, limit);
          categoryName = category;
        } catch (err2) {
          console.warn('[FALLBACK] CMC failed:', err2.message);
          result = await fetchBinance(limit);
        }
      }

      if (result[0]) result[0].category = categoryName;

      if (model === 'modern' || model === 'classic') {
        const { generateColoredChart } = require('../lib/settings/chart/colored');
        for (const item of result) {
          try {
            item.chart = item.sparkline.length > 1
              ? generateColoredChart(item.sparkline)
              : '';
          } catch (e) {
            console.warn(`[CHART] Failed generating chart for ${item.symbol}:`, e.message);
            item.chart = '';
          }
        }
      }

      return result;
    });

    const renderer = renderers[model] || renderers.modern;
    const svg = renderer(data, theme, limit);
    return res.status(200).send(svg);

  } catch (err) {
    console.error('[ERROR] Unhandled exception:', err);
    return res.status(500).send(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="100">
        <text x="50%" y="50%" font-size="16" text-anchor="middle" fill="red">
          Error: ${escapeXml(err.message)}
        </text>
      </svg>
    `);
  }
};
