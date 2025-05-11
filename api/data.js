const fetch = require('node-fetch');
const { redis } = require('../lib/redis');
const { isRegistered } = require('../lib/follow-check');
const cacheFetch = require('../lib/data/middleware');

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CMC_API = 'https://pro-api.coinmarketcap.com/v1';
const BINANCE_API = 'https://api.binance.com/api/v3/ticker/24hr';
const CMC_KEY = process.env.CMC_API_KEY;

let categoryMap = null;


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


// ====={ Desimal smart prices )====

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

async function fetchSymbolData(symbols) {
  try {
    // Pertama coba ambil data dari CoinGecko
    let coins = await fetchGeckoBySymbols(symbols);
    
    // Cek jika data kosong atau gagal
    if (!coins || coins.length === 0) {
      console.log('Gecko API gagal, fallback ke CMC');
      // Jika gagal, coba ambil data dari CoinMarketCap
      coins = await fetchCMC('', symbols.length); // Kosongkan kategori karena kita mengirim simbol langsung
    }
    
    // Jika CMC juga gagal, coba fallback ke Binance
    if (!coins || coins.length === 0) {
      console.log('CMC API gagal, fallback ke Binance');
      coins = await fetchBinance(symbols.length);
    }

    return coins;
  } catch (err) {
    console.error('Semua API gagal, error:', err.message);
    throw new Error('Semua API gagal');  // rungkad semua... 
  }
}


module.exports = async (req, res) => {
  const { user, category, coin, count = 5, format = 'json' } = req.query;

  if (format !== 'json') return res.status(400).json({ error: 'Only format=json supported' });
  if (!user) {
    return res.status(403).json({ error: 'Follow dulu GitHub gue buat akses API ini', follow: 'https://github.com/deisgoku' });
  }

  const isValid = await isRegistered(user);
  if (!isValid) {
    return res.status(403).json({ error: `Akun ${user} belum follow`, follow: 'https://github.com/deisgoku' });
  }

  try {
    let result = [];
    if (coin) {
      const symbols = coin.split(',').map(s => s.trim().toUpperCase()).slice(0, 20);
      result = await fetchSymbolData(symbols);
    } else if (category) {
      result = await fetchGeckoByCategory(category, Math.min(parseInt(count), 20));
    } else {
      return res.status(400).json({ error: 'Harus ada parameter category atau coin' });
    }

    return res.status(200).json({ ok: true, data: result });
  } catch (e) {
    return res.status(500).json({ error: 'Fetch failed', message: e.message });
  }
};
