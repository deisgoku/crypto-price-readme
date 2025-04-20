const fetch = require('node-fetch');
const { createCanvas } = require('canvas');
const buildCoinIdMap = require('./coin-id-map');

// Failover logic for each type of data
async function fetchPrice(ids) {
  try {
    if (ids.gecko) return await getPriceFromGecko(ids.gecko);
    if (ids.cmc) return await getPriceFromCMC(ids.cmc);
    if (ids.binance) return await getPriceFromBinance(ids.binance);
  } catch (err) {
    return null;
  }
}

async function fetchVolume(ids) {
  try {
    if (ids.gecko) return await getVolumeFromGecko(ids.gecko);
    if (ids.cmc) return await getVolumeFromCMC(ids.cmc);
    if (ids.binance) return await getVolumeFromBinance(ids.binance);
  } catch (err) {
    return null;
  }
}

async function fetchTrend(ids) {
  try {
    if (ids.gecko) return await getTrendFromGecko(ids.gecko);
    if (ids.cmc) return await getTrendFromCMC(ids.cmc);
    if (ids.binance) return await getTrendFromBinance(ids.binance);
  } catch (err) {
    return null;
  }
}

async function fetchChart(ids) {
  try {
    if (ids.gecko) return await getChartFromGecko(ids.gecko);
    if (ids.cmc) return await getChartFromCMC(ids.cmc);
    if (ids.binance) return await getChartFromBinance(ids.binance);
  } catch (err) {
    return null;
  }
}

// Mocked fetchers (implementasi asli harus ganti dengan fetch dari API sebenarnya)
async function getPriceFromGecko(id) { return 123.45; }
async function getPriceFromCMC(id) { return 123.45; }
async function getPriceFromBinance(id) { return 123.45; }

async function getVolumeFromGecko(id) { return 987654321; }
async function getVolumeFromCMC(id) { return 987654321; }
async function getVolumeFromBinance(id) { return 987654321; }

async function getTrendFromGecko(id) { return '+3.21%'; }
async function getTrendFromCMC(id) { return '+3.21%'; }
async function getTrendFromBinance(id) { return '+3.21%'; }

async function getChartFromGecko(id) { return 'chart-data'; }
async function getChartFromCMC(id) { return 'chart-data'; }
async function getChartFromBinance(id) { return 'chart-data'; }

module.exports = async (req, res) => {
  try {
    const coinList = await buildCoinIdMap();

    const data = await Promise.all(coinList.map(async ({ symbol, ids }) => {
      const [price, volume, trend, chart] = await Promise.all([
        fetchPrice(ids),
        fetchVolume(ids),
        fetchTrend(ids),
        fetchChart(ids)
      ]);

      return { symbol, price, volume, trend, chart };
    }));

    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    // ==== UI Tetap: Card Tabel Mini ==== //
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Crypto Market Top 6', 30, 40);

    let y = 80;
    ctx.font = '16px monospace';
    for (const coin of data) {
      ctx.fillText(
        `${coin.symbol} | Price: $${coin.price} | Vol: ${coin.volume} | Trend: ${coin.trend}`,
        30, y
      );
      y += 40;
    }

    res.setHeader('Content-Type', 'image/png');
    res.send(canvas.toBuffer());
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Error');
  }
};
