const cache = {};

module.exports = async (req, res) => {
  const { coin = "bitcoin", label = "Price", decimals = 2 } = req.query;
  const cacheKey = coin.toLowerCase();
  const now = Date.now();
  const cacheDuration = 30 * 1000;

  const safeDecimals = Math.min(Math.max(parseInt(decimals), 0), 8);

  if (cache[cacheKey] && now - cache[cacheKey].timestamp < cacheDuration) {
    const { price, prevPrice } = cache[cacheKey];
    return respond(price, prevPrice, label, safeDecimals, res);
  }

  const providers = [
    { name: "Binance", fn: () => getFromBinance(coin) },
    { name: "CoinGecko", fn: () => getFromCoinGecko(coin) },
    { name: "CoinMarketCap", fn: () => getFromCMC(coin) }
  ];

  let price = null;

  for (let attempt = 0; attempt < providers.length; attempt++) {
    const provider = providers[attempt];
    try {
      price = await provider.fn();
      if (price) {
        console.log(`[${coin}] Data fetched from ${provider.name}`);
        break;
      }
    } catch (err) {
      console.error(`[${provider.name}] error:`, err.message || err);
    }
  }

  if (price) {
    return handleCacheAndRespond(price, cacheKey, label, safeDecimals, res);
  }

  return res.status(500).json({
    schemaVersion: 1,
    label,
    message: "Error",
    color: "red"
  });
};

function handleCacheAndRespond(price, key, label, decimals, res) {
  const prevPrice = cache[key]?.price || price;
  cache[key] = { price, prevPrice, timestamp: Date.now() };
  return respond(price, prevPrice, label, decimals, res);
}

function respond(price, prevPrice, label, decimals, res) {
  if (isNaN(price)) {
    return res.status(500).json({
      schemaVersion: 1,
      label,
      message: "Invalid",
      color: "lightgrey"
    });
  }

  const trendArrow = price > prevPrice ? "🔼" : price < prevPrice ? "🔽" : "";
  const trendColor = price > prevPrice ? "green" : price < prevPrice ? "red" : "gray";
  const formatted = `$${price.toFixed(decimals)}`;

  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate");

  return res.status(200).json({
    schemaVersion: 1,
    label,
    message: `${formatted} ${trendArrow}`,
    color: trendColor,
    cacheSeconds: 30
  });
}

// === Provider Functions ===

async function getFromCoinGecko(coin) {
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`);
  const data = await res.json();
  return data[coin]?.usd || null;
}

async function getFromCMC(coin) {
  const res = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${coin.toUpperCase()}`, {
    headers: {
      'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY
    }
  });
  const data = await res.json();
  return data.data?.[coin.toUpperCase()]?.quote?.USD?.price || null;
}

async function getFromBinance(coin) {
  const symbol = `${coin.toUpperCase()}USDT`;
  const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
  const data = await res.json();
  return parseFloat(data.price) || null;
}
