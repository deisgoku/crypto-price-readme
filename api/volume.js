const volumeCache = {};
const CACHE_DURATION = 60 * 1000; // 1 menit

module.exports = async (req, res) => {
  const { coin = "bitcoin", label = "Vol" } = req.query;
  const now = Date.now();
  const cacheKey = `volume-${coin}`;

  if (volumeCache[cacheKey] && now - volumeCache[cacheKey].timestamp < CACHE_DURATION) {
    return res.status(200).json(volumeCache[cacheKey].badge);
  }

  const providers = [
    { name: "CoinGecko", fn: () => getVolumeFromCoinGecko(coin) },
    { name: "CoinMarketCap", fn: () => getVolumeFromCMC(coin) },
    { name: "Binance", fn: () => getVolumeFromBinance(coin) }
  ];

  let volume = null;

  for (let attempt = 0; attempt < providers.length; attempt++) {
    const provider = providers[attempt];
    try {
      volume = await provider.fn();
      if (volume !== null) {
        console.log(`Volume data from ${provider.name}`);
        break;
      }
    } catch (err) {
      console.error(`[${provider.name}] error:`, err.message || err);
    }
  }

  if (volume !== null) {
    const formatted = formatVolume(volume);

    const badge = {
      schemaVersion: 1,
      label,
      message: `$${formatted}`,
      color: "blue",
      cacheSeconds: 60
    };

    volumeCache[cacheKey] = {
      badge,
      timestamp: now
    };

    return res.status(200).json(badge);
  }

  return res.status(500).json({
    schemaVersion: 1,
    label,
    message: "Error",
    color: "red"
  });
};

// === Provider Functions ===

async function getVolumeFromCoinGecko(coin) {
  const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coin}`);
  const data = await res.json();
  return data?.market_data?.total_volume?.usd || null;
}

async function getVolumeFromCMC(coin) {
  const symbol = coin.toUpperCase();
  const res = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}`, {
    headers: {
      'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY
    }
  });
  const data = await res.json();
  return data?.data?.[symbol]?.quote?.USD?.volume_24h || null;
}

async function getVolumeFromBinance(coin) {
  const symbol = `${coin.toUpperCase()}USDT`;
  const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
  const data = await res.json();
  return parseFloat(data?.quoteVolume) || null;
}

function formatVolume(value) {
  if (value >= 1e9) return (value / 1e9).toFixed(1) + "B";
  if (value >= 1e6) return (value / 1e6).toFixed(1) + "M";
  return value.toFixed(0);
}
