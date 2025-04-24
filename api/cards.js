const fetch = require('node-fetch'); // Jangan lupa import node-fetch
const { renderModern } = require('../lib/settings/model/modern');

const cache = new Map();

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CMC_API = 'https://pro-api.coinmarketcap.com/api/v1';
const BINANCE_API = 'https://api.binance.com/api/v3/ticker/24hr';

const CMC_KEY = process.env.CMC_API_KEY;

const delay = ms => new Promise(res => setTimeout(res, ms));

// Cache kategori
let categoryMap = null;

const fetchCategoryMap = async () => {
  if (categoryMap) return categoryMap;
  const res = await fetch(`${COINGECKO_API}/coins/categories/list`);
  if (!res.ok) throw new Error('Failed to fetch category list');
  const list = await res.json();
  categoryMap = new Map(list.map(c => [c.category_id, c.name]));
  return categoryMap;
};

// Fetch data dari API CoinGecko berdasarkan category_id
const fetchGeckoCategory = async (category, limit) => {
  const url = `${COINGECKO_API}/coins/markets?vs_currency=usd&category=${category}&order=market_cap_desc&per_page=${limit}&sparkline=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gecko failed');
  const coins = await res.json();
  return coins.map(coin => ({
    symbol: coin.symbol.toUpperCase(),
    price: coin.current_price < 0.01
      ? coin.current_price.toFixed(8)
      : coin.current_price.toFixed(2),
    volume: `$${(coin.total_volume / 1e6).toFixed(1)}M`,
    trend: coin.price_change_percentage_24h,
    chart: coin.sparkline_in_7d?.price
      ? genChartPath(coin.sparkline_in_7d.price)
      : ''
  }));
};

// Fetch CoinMarketCap
const fetchCMC = async (category, limit) => {
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
  return Object.values(data.data).map(coin => ({
    symbol: coin.symbol,
    price: coin.quote.USD.price < 0.01
      ? coin.quote.USD.price.toFixed(8)
      : coin.quote.USD.price.toFixed(2),
    volume: `$${(coin.quote.USD.volume_24h / 1e6).toFixed(1)}M`,
    trend: coin.quote.USD.percent_change_24h,
    chart: '' // Optional
  }));
};

// Fetch data dari Binance
const fetchBinanceTop = async (limit) => {
  try {
    const res = await fetch(BINANCE_API);
    if (!res.ok) throw new Error('Binance failed');
    const data = await res.json();
    return data
      .filter(d => d.symbol.endsWith('USDT') && d.symbol.length <= 10)
      .map(d => ({
        symbol: d.symbol.replace('USDT', ''),
        price: parseFloat(d.lastPrice) < 0.01
          ? parseFloat(d.lastPrice).toFixed(8)
          : parseFloat(d.lastPrice).toFixed(2),
        volume: `$${(parseFloat(d.quoteVolume || 0) / 1e6).toFixed(1)}M`,
        trend: parseFloat(d.priceChangePercent || 0),
        chart: ''
      }))
      .slice(0, limit);
  } catch (err) {
    console.log('Binance fetch error:', err.message);
    throw new Error('Binance failed');
  }
};

// Function to generate the chart path (sparkline)
function genChartPath(data) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const norm = data.map((p, i) => {
    const x = (i / (data.length - 1)) * 80;
    const y = 30 - ((p - min) / (max - min)) * 30;
    return [x, y];
  });
  return 'M' + norm.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L');
}

module.exports = async (req, res) => {
  const { model = 'modern', theme = 'dark', coin = '6', category = 'layer1' } = req.query;
  const limit = Math.min(Math.max(parseInt(coin), 1), 20);
  const cacheKey = `${category}_${limit}`;

  try {
    if (!cache.has(cacheKey)) {
      let data;
      let categoryName = category.replace(/-/g, ' '); // Default fallback if no category name found
      try {
        // Fetch category name dynamically
        const categoryMap = await fetchCategoryMap();
        categoryName = categoryMap.get(category) || categoryName;
        
        data = await fetchGeckoCategory(category, limit);
      } catch (err1) {
        console.log(`Gecko failed for category "${category}", fallback to CMC`);
        try {
          data = await fetchCMC(category, limit);
        } catch (err2) {
          console.log(`CMC failed for category "${category}", fallback to Binance`);
          data = await fetchBinanceTop(limit);
        }
      }
      cache.set(cacheKey, { data, categoryName });
      setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000); // cache 5 menit
    }

    const { data: coinData, categoryName } = cache.get(cacheKey);

    if (model === 'modern') {
      const svg = renderModern(coinData, theme, limit, categoryName); // Pass categoryName to render
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(200).send(svg);
    }
    if (model === 'legacy') {
      const svg = renderLegacy(coinData, theme, limit, categoryName); // Pass categoryName to render
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(200).send(svg);
    }

    res.status(400).send('Model not supported.');
  } catch (e) {
    console.error('Fatal error:', e);
    res.status(500).send('Internal error');
  }
};
