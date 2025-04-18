const cache = new Map();

export default async function handler(req, res) {
  const { coin } = req.query;
  if (!coin) return res.status(400).send("Missing coin parameter");

  const now = Date.now();
  const cacheKey = `${coin}`;
  const cacheTTL = 5 * 60 * 1000; // 5 menit

  // Cek cache terlebih dahulu
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (now - cached.timestamp < cacheTTL) {
      return renderSparkline(res, cached.data);
    }
  }

  let prices = null;
  const providers = [
    { name: "CoinGecko", fn: () => getChartFromCoinGecko(coin) },
    { name: "CoinMarketCap", fn: () => getChartFromCMC(coin) },
    { name: "Binance", fn: () => getChartFromBinance(coin) },
  ];

  // Coba mendapatkan data dari API yang tersedia
  for (let attempt = 0; attempt < providers.length; attempt++) {
    const provider = providers[attempt];
    try {
      prices = await provider.fn();
      if (prices) {
        console.log(`Data fetched from ${provider.name}`);
        break;
      }
    } catch (err) {
      console.error(`[${provider.name}] error:`, err.message || err);
    }
  }

  if (prices) {
    cache.set(cacheKey, { data: prices, timestamp: now });
    return renderSparkline(res, prices);
  }

  return res.status(500).send("Failed to fetch chart data from all providers");
}

// Render Sparkline (SVG)
function renderSparkline(res, data) {
  const width = 100;
  const height = 30;

  const sliced = data.slice(-30); // Ambil 30 titik terakhir
  const max = Math.max(...sliced);
  const min = Math.min(...sliced);
  const range = max - min || 1;
  const stepX = width / (sliced.length - 1);

  const points = sliced.map((val, i) => {
    const x = (i * stepX).toFixed(2);
    const y = (height - ((val - min) / range) * height).toFixed(2);
    return `${x},${y}`;
  }).join(" ");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <polyline fill="none" stroke="#00bcd4" stroke-width="2" points="${points}" />
    </svg>
  `;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Content-Disposition', 'inline'); 
  res.status(200).send(svg);
}

// === Provider Functions ===

// CoinGecko API
async function getChartFromCoinGecko(coin) {
  const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=1`);
  const data = await res.json();
  return data?.prices?.map(p => p[1]) || null;
}

// CoinMarketCap API
async function getChartFromCMC(coin) {
  const res = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/market-pairs/latest?symbol=${coin.toUpperCase()}`, {
    headers: {
      'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY
    }
  });
  const data = await res.json();
  return data?.data?.[coin.toUpperCase()]?.quote?.USD?.price || null;
}

// Binance API
async function getChartFromBinance(coin) {
  const symbol = `${coin.toUpperCase()}USDT`;
  const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=30`);
  const data = await res.json();
  return data?.map(d => parseFloat(d[4])) || null; // Extract closing prices
}
