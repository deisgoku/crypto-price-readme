const fetch = require("node-fetch");

async function getPrice(coin) {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`);
    const json = await res.json();
    return json[coin]?.usd?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "N/A";
  } catch (e) {
    return "N/A";
  }
}

async function getVolume(coin) {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coin}`);
    const json = await res.json();
    return json.market_data?.total_volume?.usd?.toLocaleString("en-US") || "N/A";
  } catch (e) {
    return "N/A";
  }
}

async function getTrend(coin) {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coin}`);
    const json = await res.json();
    const trend = json.market_data?.price_change_percentage_24h;
    return trend !== undefined ? `${trend.toFixed(2)}%` : "N/A";
  } catch (e) {
    return "N/A";
  }
}

function getChartUrl(coin) {
  return `https://crypto-price-on.vercel.app/api/chart?coin=${coin}`;
}

module.exports = {
  getPrice,
  getVolume,
  getTrend,
  getChartUrl,
};
