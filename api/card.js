import fetch from "node-fetch";

export default async function handler(req, res) {
  const { theme = "light" } = req.query;

  const coins = [
    { id: "bitcoin", symbol: "BTC" },
    { id: "ethereum", symbol: "ETH" },
    { id: "binancecoin", symbol: "BNB" },
    { id: "solana", symbol: "SOL" },
    { id: "ripple", symbol: "XRP" },
    { id: "dogecoin", symbol: "DOGE" },
  ];

  const baseUrl = `${req.headers.host.includes("localhost") ? "http" : "https"}://${req.headers.host}`;

  const data = await Promise.all(
    coins.map(async ({ id, symbol }) => {
      try {
        const [priceRes, volumeRes, trendRes, chartRes] = await Promise.all([
          fetch(`${baseUrl}/api/prices?coin=${id}`),
          fetch(`${baseUrl}/api/volume?coin=${id}`),
          fetch(`${baseUrl}/api/trend?coin=${id}`),
          fetch(`${baseUrl}/api/chart?coin=${id}`),
        ]);

        const price = await priceRes.json();
        const volume = await volumeRes.json();
        const trend = await trendRes.json();
        const chart = await chartRes.text();

        return {
          id,
          symbol,
          price: price.message,
          volume: volume.message,
          trend: trend.message,
          trendChange: parseFloat(trend.message),
          chart,
        };
      } catch (err) {
        console.error(`Error fetching data for ${id}:`, err);
        return null;
      }
    })
  );

  const bg = theme === "dark" ? "#0d1117" : "#ffffff";
  const text = theme === "dark" ? "#c9d1d9" : "#333333";
  const border = theme === "dark" ? "#ffffff" : "#000000";
  const headerBg = theme === "dark" ? "#30363d" : "#e1e4e8";

  const header = `
    <g transform="translate(0, 40)">
      <text x="10" y="0" font-size="16" fill="${text}" font-family="monospace">Top 6 Popular Prices</text>
    </g>
    <g transform="translate(0, 60)">
      <rect width="600" height="30" fill="${headerBg}" />
      <text x="10" y="15" font-size="14" fill="${border}" font-family="monospace">NAME</text>
      <text x="120" y="15" font-size="14" fill="${border}" font-family="monospace">PRICE</text>
      <text x="240" y="15" font-size="14" fill="${border}" font-family="monospace">VOL</text>
      <text x="340" y="15" font-size="14" fill="${border}" font-family="monospace">TREND</text>
      <text x="440" y="15" font-size="14" fill="${border}" font-family="monospace">CHART</text>
    </g>
  `;

  const coinRows = data.filter(Boolean).map((item, i) => {
    const y = 90 + i * 60;
    const rowBg =
      item.trendChange > 0 ? "#103c2d" :
      item.trendChange < 0 ? "#3c1010" :
      (theme === "dark" ? "#161b22" : "#f6f8fa");

    const logoUrl = `https://cryptologos.cc/logos/${item.id}-logo.svg?v=025`;
    const fallbackText = `<text x="10" y="30" font-size="10" fill="${text}" font-family="monospace">No Logo</text>`;

    return `
      <g transform="translate(0, ${y})">
        <rect x="0" y="0" width="600" height="60" fill="${rowBg}" />
        <image href="${logoUrl}" x="10" y="10" width="20" height="20" onerror="this.href=''" />
        <text x="40" y="20" font-size="14" fill="${text}" font-family="monospace">${item.symbol}</text>
        <text x="120" y="20" font-size="14" fill="${text}" font-family="monospace">${item.price}</text>
        <text x="240" y="20" font-size="14" fill="${text}" font-family="monospace">${item.volume}</text>
        <text x="340" y="20" font-size="14" fill="${text}" font-family="monospace">${item.trend}</text>
        <g transform="translate(440, 5)">
          ${item.chart.replace(/<\/?svg[^>]*>/g, "")}
        </g>
        <line x1="0" y1="59" x2="600" y2="59" stroke="${border}" stroke-width="1" />
      </g>
    `;
  }).join("");

  const footer = `
    <text x="10" y="${data.length * 60 + 110}" font-size="12" fill="${text}" font-family="monospace">
      crypto-price-readme v1.4.1 - github.com/deisgoku
    </text>
  `;

  const svgHeight = data.length * 60 + 130;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="${svgHeight}" viewBox="0 0 600 ${svgHeight}">
      <style>
        text { dominant-baseline: middle; }
        image:invalid { display: none; }
      </style>
      <rect width="100%" height="100%" fill="${bg}" />
      ${header}
      ${coinRows}
      ${footer}
    </svg>
  `;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
  res.status(200).send(svg);
}
