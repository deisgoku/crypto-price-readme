const fetch = require('node-fetch');
const { renderModern } = require('../lib/settings/model/modern');
const { renderFuturistic } = require('../lib/settings/model/futuristic');
const renderLocked = require('../lib/settings/data/locked');
const { isRegistered } = require('../lib/follow-check');
const cacheFetch = require('../lib/data/middleware');

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CMC_API = 'https://pro-api.coinmarketcap.com/v1';
const BINANCE_API = 'https://api.binance.com/api/v3/ticker/24hr';
const CMC_KEY = process.env.CMC_API_KEY;

let categoryMap = null;

function formatVolume(value) {
  if (value >= 1e9) return (value / 1e9).toFixed(1) + "B";
  if (value >= 1e6) return (value / 1e6).toFixed(1) + "M";
  if (value >= 1e3) return (value / 1e3).toFixed(1) + "K";
  return value.toFixed(0);
}

function formatPrice(value) {
  if (value >= 0.01) {
    const str = value.toFixed(8);
    return { price: parseFloat(str).toString(), micin: false };
  }
  const str = value.toFixed(18);
  const match = str.match(/^0\.0+(?=\d)/);
  const zeroCount = match ? match[0].length - 2 : 0;
  const rest = str.slice(match ? match[0].length : 2).replace(/0+$/, '').slice(0, 4);
  return { price: `0.0{${zeroCount}}${rest}`, micin: true };
}

async function fetchCategoryMap() {
  if (categoryMap) return categoryMap;
  const res = await fetch(`${COINGECKO_API}/coins/categories/list`);
  if (!res.ok) throw new Error('Failed to fetch category list');
  const list = await res.json();
  categoryMap = new Map(list.map(c => [c.category_id, c.name]));
  return categoryMap;
}

async function fetchGecko(category, limit) {
  console.log('[FETCH] from Gecko');
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
      sparkline: Array.isArray(coin.sparkline_in_7d?.price) ? coin.sparkline_in_7d.price : [],
    };
  });
}

async function fetchCMC(category, limit) {
  console.log('[FETCH] from CMC');
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
  console.log('[FETCH] from Binance');
  const res = await fetch(BINANCE_API);
  if (!res.ok) throw new Error('Binance failed');
  const data = await res.json();
  return data
    .filter(d => d.symbol.endsWith('USDT') && d.symbol.length <= 10)
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
    })
    .slice(0, limit);
}

function generateSparklinePath(values, width = 70, height = 30) {
  if (!Array.isArray(values) || values.length < 2) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  return values.map((v, i) => {
    const x = (i * step).toFixed(2);
    const y = (height - ((v - min) / range) * height).toFixed(2);
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
}

const renderers = {
  modern: renderModern,
  futuristic: renderFuturistic,
};

module.exports = async (req, res) => {
  const { user, model = 'modern', theme = 'dark', coin = '6', category = 'layer1' } = req.query;
  const limit = Math.min(Math.max(parseInt(coin), 1), 20);
  const cacheKey = `${category}_${limit}_${theme}_${model}`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (!user || typeof user !== 'string') {
      console.log('[CARD] Guest access, showing locked card.');
      return res.status(200).send(renderLocked('Guest'));
    }

    const verified = await isRegistered(user.toLowerCase());
    console.log(`[CARD] User: ${user}, Registered: ${verified}`);
    if (!verified) {
      return res.status(200).send(renderLocked(user));
    }

    const data = await cacheFetch(cacheKey, 60, async () => {
      console.log(`[CACHE] MISS for: ${cacheKey}`);
      let data;
      let categoryName = 'General';

      try {
        data = await fetchGecko(category, limit);
        const catMap = await fetchCategoryMap();
        categoryName = catMap.get(category) || category;
        console.log('[CARD] Data from Gecko, category:', categoryName);
      } catch (err1) {
        console.warn('[CARD] Gecko failed:', err1.message);
        try {
          data = await fetchCMC(category, limit);
          categoryName = category;
          console.log('[CARD] Data from CMC, category:', categoryName);
        } catch (err2) {
          console.warn('[CARD] CMC failed:', err2.message);
          data = await fetchBinance(limit);
          console.log('[CARD] Data from Binance fallback');
        }
      }

      if (data[0]) data[0].category = categoryName;

      for (const item of data) {
        try {
          item.chart = Array.isArray(item.sparkline) && item.sparkline.length > 1
            ? generateSparklinePath(item.sparkline)
            : '';
        } catch (e) {
          console.warn('[CHART] Chart generation failed:', item.symbol, e.message);
          item.chart = '';
        }
      }

      return data;
    });

    const renderer = renderers[model] || renderModern;
    const svg = renderer(data, theme, limit);
    return res.status(200).send(svg);
  } catch (err) {
    console.error('[CARD] Unexpected error:', err);
    return res.status(500).send(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="100">
        <text x="50%" y="50%" font-size="16" text-anchor="middle" fill="red">
          Error: ${err.message}
        </text>
      </svg>
    `);
  }
};
