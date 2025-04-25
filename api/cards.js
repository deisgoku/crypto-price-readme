const fetch = require('node-fetch');
const { renderModern } = require('../lib/settings/model/modern');

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CMC_API = 'https://pro-api.coinmarketcap.com/v1';
const BINANCE_API = 'https://api.binance.com/api/v3/ticker/24hr';
const CMC_KEY = process.env.CMC_API_KEY;

const cache = new Map();
let categoryMap = null;

// Delay helper
const delay = ms => new Promise(res => setTimeout(res, ms));

// Format Volume (M, B, K)
function formatVolume(value) {
  if (value >= 1e9) return (value / 1e9).toFixed(1) + "B";
  if (value >= 1e6) return (value / 1e6).toFixed(1) + "M";
  if (value >= 1e3) return (value / 1e3).toFixed(1) + "K";
  return value.toFixed(0);
}

// Format Price (Smart for micin coin)
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

// Fetch category name map from CoinGecko
const fetchCategoryMap = async () => {
  if (categoryMap) return categoryMap;
  const res = await fetch(`${COINGECKO_API}/coins/categories/list`);
  if (!res.ok) throw new Error('Failed to fetch category list');
  const list = await res.json();
  categoryMap = new Map(list.map(c => [c.category_id, c.name]));
  return categoryMap;
};

// Generate SVG path for sparkline chart
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

// CoinGecko source
const fetchGecko = async (category, limit) => {
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
      chart: genChartPath(coin.sparkline_in_7d?.price || [])
    };
  });
};

// CoinMarketCap source
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
  return Object.values(data.data).map(coin => {
    const { price, micin } = formatPrice(coin.quote.USD.price);
    return {
      symbol: coin.symbol,
      price,
      micin,
      volume: formatVolume(coin.quote.USD.volume_24h),
      trend: coin.quote.USD.percent_change_24h,
      chart: ''
    };
  });
};

// Binance source
const fetchBinance = async (limit) => {
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
        chart: ''
      };
    })
    .slice(0, limit);
};

// MAIN HANDLER
module.exports = async (req, res) => {
  const { model = 'modern', theme = 'dark', coin = '6', category = 'layer1' } = req.query;
  const limit = Math.min(Math.max(parseInt(coin), 1), 20);
  const cacheKey = `${category}_${limit}_${theme}`;

  try {
    if (!cache.has(cacheKey)) {
      let data;
      let categoryName = 'General';

      try {
        data = await fetchGecko(category, limit);
        const catMap = await fetchCategoryMap();
        categoryName = catMap.get(category) || category;
      } catch (err1) {
        try {
          data = await fetchCMC(category, limit);
          categoryName = category;
        } catch (err2) {
          data = await fetchBinance(limit);
        }
      }

      if (data[0]) data[0].category = categoryName;
      cache.set(cacheKey, data);
    }

    const data = cache.get(cacheKey);
    const svg = renderModern(data, theme, limit);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).send(svg);
  } catch (err) {
    return res.status(500).send(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="100"><text x="50%" y="50%" font-size="16" text-anchor="middle" fill="red">Error: ${err.message}</text></svg>`);
  }
};
