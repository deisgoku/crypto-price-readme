const trendCache = {};
const CACHE_DURATION = 60 * 1000; // 1 menit

module.exports = async (req, res) => {
  const { coin = "bitcoin", label = "7d Trend" } = req.query;
  const now = Date.now();
  const cacheKey = `trend-${coin}`;

  if (trendCache[cacheKey] && now - trendCache[cacheKey].timestamp < CACHE_DURATION) {
    return res.status(200).json(trendCache[cacheKey].badge);
  }

  const providers = [
    { name: "CoinGecko", fn: () => getTrendFromCoinGecko(coin) },
    { name: "CoinMarketCap", fn: () => getTrendFromCMC(coin) },
    { name: "Binance", fn: () => getTrendFromBinance(coin) }
  ];

  let change = null;

  for (let attempt = 0; attempt < providers.length; attempt++) {
    const provider = providers[attempt];
    try {
      change = await provider.fn();
      if (change !== null) {
        console.log(`Trend data from ${provider.name}`);
        break;
      }
    } catch (err) {
      console.error(`[${provider.name}] error:`, err.message || err);
    }
  }

  if (change !== null) {
    const trendArrow = change > 0 ? "🔼" : change < 0 ? "🔽" : "";
    const trendColor = change > 0 ? "green" : change < 0 ? "red" : "gray";

    const badge = {
      schemaVersion: 1,
      label,
      message: `${change.toFixed(2)}% ${trendArrow}`,
      color: trendColor,
      cacheSeconds: 60
    };

    trendCache[cacheKey] = {
      badge,
      timestamp: now
    };

    return res.status(200).json(badge);
  }

  // Semua provider gagal
  return res.status(500).json({
    schemaVersion: 1,
    label,
    message: "Error",
    color: "red"
  });
};

// === Provider Functions ===

async function getTrendFromCoinGecko(coin) {
  const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=7`);
  const data = await res.json();
  const prices = data?.prices;
  if (!prices || prices.length < 2) return null;
  return ((prices[prices.length - 1][1] - prices[0][1]) / prices[0][1]) * 100;
}

async function getTrendFromCMC(coin) {
  const symbol = coin.toUpperCase();
  const res = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical?symbol=${symbol}&interval=daily&count=7`, {
    headers: {
      'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY
    }
  });
  const data = await res.json();
  const quotes = data?.data?.quotes;
  if (!quotes || quotes.length < 2) return null;
  return ((quotes[quotes.length - 1].quote.USD.price - quotes[0].quote.USD.price) / quotes[0].quote.USD.price) * 100;
}

async function getTrendFromBinance(coin) {
  const symbol = `${coin.toUpperCase()}USDT`;
  const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=7`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length < 2) return null;
  const first = parseFloat(data[0][4]);
  const last = parseFloat(data[data.length - 1][4]);
  return ((last - first) / first) * 100;
}
