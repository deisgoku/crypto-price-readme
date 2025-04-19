const { getPrice, getVolume, getTrend, getChartUrl } = require("../lib/data");

module.exports = async (req, res) => {
  const coins = ["bitcoin", "ethereum", "bnb", "solana", "xrp", "dogecoin"];
  const theme = req.query.theme === "light" ? "light" : "dark";

  const data = await Promise.all(
    coins.map(async (coin) => {
      const [price, volume, trend] = await Promise.all([
        getPrice(coin),
        getVolume(coin),
        getTrend(coin),
      ]);
      const chart = getChartUrl(coin);
      return { coin, price, volume, trend, chart };
    })
  );

  const bgColor = theme === "light" ? "#ffffff" : "#0d1117";
  const textColor = theme === "light" ? "#000000" : "#ffffff";

  const svg = `
    <svg width="700" height="300" xmlns="http://www.w3.org/2000/svg">
      <style>
        .title { font: 600 18px sans-serif; fill: ${textColor}; }
        .label { font: 500 14px sans-serif; fill: ${textColor}; }
        .value { font: 400 13px monospace; fill: ${textColor}; }
        .small { font: 12px sans-serif; fill: gray; }
      </style>
      <rect width="100%" height="100%" fill="${bgColor}" rx="10" />
      ${data
        .map((coin, i) => {
          const y = 20 + i * 45;
          return `
            <g transform="translate(20, ${y})">
              <text class="label" x="0" y="0">${coin.coin.toUpperCase()}</text>
              <text class="value" x="100" y="0">Price: $${coin.price}</text>
              <text class="value" x="250" y="0">Vol: $${coin.volume}</text>
              <text class="value" x="400" y="0">24h: ${coin.trend}</text>
              <image href="${coin.chart}" x="500" y="-12" width="100" height="25" />
            </g>
          `;
        })
        .join("")}
    </svg>
  `;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "s-maxage=3600");
  res.status(200).send(svg);
};
