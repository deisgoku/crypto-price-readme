const fetch = require('node-fetch');
const { renderModern } = require('../lib/settings/model/modern');

const cache = new Map();

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CMC_API = 'https://pro-api.coinmarketcap.com';
const BINANCE_API = 'https://api.binance.com/api/v3/ticker/24hr';

const CMC_KEY = process.env.CMC_API_KEY; // Pastikan sudah ada

// Utils
const delay = ms => new Promise(res => setTimeout(res, ms));

const fetchGeckoCategory = async (category, limit) => {
  const url = `${COINGECKO_API}/coins/markets?vs_currency=usd&category=${category}&order=market_cap_desc&per_page=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gecko failed');
  const coins = await res.json();
  return coins.map(coin => ({
    symbol: coin.symbol.toUpperCase(),
    price: coin.current_price.toFixed(2),
    volume: `$${(coin.total_volume / 1e6).toFixed(1)}M`,
    trend: coin.price_change_percentage_24h,
    chart: coin.sparkline_in_7d?.price
      ? genChartPath(coin.sparkline_in_7d.price)
      : ''
  }));
};

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
    price: coin.quote.USD.price.toFixed(2),
    volume: `$${(coin.quote.USD.volume_24h / 1e6).toFixed(1)}M`,
    trend: coin.quote.USD.percent_change_24h,
    chart: '' // Optional: add sparkline if needed
  }));
};

const fetchBinanceTop = async (limit) => {
  try {
    const res = await fetch(BINANCE_API);
    if (!res.ok) {
      const text = await res.text();
      console.log('Binance response:', text);
      throw new Error('Binance failed');
    }
    const data = await res.json();
    return data
      .filter(d => d.symbol.endsWith('USDT') && d.symbol.length <= 10)
      .map(d => ({
        symbol: d.symbol.replace('USDT', ''),
        price: parseFloat(d.lastPrice || 0).toFixed(2),
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

// Generate SVG path for sparkline
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

// API handler
module.exports = async (req, res) => {
  const { model = 'modern', theme = 'dark', coin = '6', category = 'layer1' } = req.query;
  const limit = Math.min(Math.max(parseInt(coin), 1), 20);
  const cacheKey = `${category}_${limit}`;

  try {
    if (!cache.has(cacheKey)) {
      let data;
      try {
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
      cache.set(cacheKey, data);
      setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000); // cache 5 menit
    }

    const coinData = cache.get(cacheKey);

    if (model === 'modern') {
      const svg = renderModern(coinData, theme, limit);
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(200).send(svg);
    }

    res.status(400).send('Model not supported.');
  } catch (e) {
    console.error('Fatal error:', e);
    res.status(500).send('Internal error');
  }
};
