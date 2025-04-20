const fetch = require('node-fetch');

async function getTop6FromCMC() {
  const res = await fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=6', {
    headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY }
  });
  const data = await res.json();
  return data.data.map(coin => ({
    symbol: coin.symbol.toUpperCase(),
    cmcId: String(coin.id),
    name: coin.name,
  }));
}

async function getGeckoMap() {
  const res = await fetch('https://api.coingecko.com/api/v3/coins/list');
  const data = await res.json(); // [{ id, symbol, name }]
  const map = {};
  for (const coin of data) {
    map[coin.symbol.toUpperCase()] = coin.id;
  }
  return map;
}

async function getBinanceSymbols() {
  const res = await fetch('https://api.binance.com/api/v3/exchangeInfo');
  const data = await res.json();
  const map = {};
  for (const item of data.symbols) {
    if (item.quoteAsset === 'USDT') {
      map[item.baseAsset.toUpperCase()] = item.symbol; // BTC => BTCUSDT
    }
  }
  return map;
}

async function buildCoinIdMap() {
  const topCoins = await getTop6FromCMC();
  const geckoMap = await getGeckoMap();
  const binanceMap = await getBinanceSymbols();

  return topCoins.map(({ symbol, cmcId }) => ({
    symbol,
    ids: {
      cmc: cmcId,
      gecko: geckoMap[symbol] || null,
      binance: binanceMap[symbol] || null,
    }
  })).filter(coin => coin.ids.gecko || coin.ids.binance); // minimal 1 selain cmc
}

module.exports = buildCoinIdMap;
