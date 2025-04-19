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
  const lineColor = theme === "light" ? "#cccccc" : "#444444";

  const rowHeight = 40;
  const headerHeight = 50;
  const footerHeight = 30;
  const svgHeight = headerHeight + data.length * rowHeight + footerHeight;

  const svg = `
    <svg width="700" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .header { font: 600 15px sans-serif; fill: ${textColor}; }
        .label { font: 500 14px sans-serif; fill: ${textColor}; }
        .value { font: 400 13px monospace; fill: ${textColor}; }
        .footer { font: 12px sans-serif; fill: gray; }
      </style>
      <rect width="100%" height="100%" fill="${bgColor}" rx="10" />
      
      <!-- Header -->
      <g transform="translate(20, 30)">
        <text class="header" x="0">Coin</text>
        <text class="header" x="100">Price</text>
        <text class="header" x="220">Volume</text>
        <text class="header" x="370">24h</text>
        <text class="header" x="480">Chart</text>
      </g>

      <!-- Rows -->
      ${data
        .map((coin, i) => {
          const y = headerHeight + i * rowHeight;
          return `
            <line x1="20" y1="${y - 10}" x2="680" y2="${y - 10}" stroke="${lineColor}" stroke-width="1"/>
            <g transform="translate(20, ${y})">
              <text class="label" x="0" y="0">${coin.coin.toUpperCase()}</text>
              <text class="value" x="100" y="0">$${coin.price}</text>
              <text class="value" x="220" y="0">$${coin.volume}</text>
              <text class="value" x="370" y="0">${coin.trend}</text>
              <image href="${coin.chart}" x="480" y="-15" width="100" height="30" />
            </g>
          `;
        })
        .join("")}

      <!-- Footer -->
      <text class="footer" x="20" y="${svgHeight - 10}">
        Data from CoinGecko / Binance | Card by @deisgoku
      </text>
    </svg>
  `;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "s-maxage=3600");
  res.status(200).send(svg);
};
