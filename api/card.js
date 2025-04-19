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

  const isDark = theme === "dark";
  const bg = isDark ? "#0d1117" : "#ffffff";
  const text = isDark ? "#c9d1d9" : "#333333";
  const border = isDark ? "#444c56" : "#cccccc";

  const colWidths = [100, 100, 100, 100, 200]; // total 600
  const colX = colWidths.reduce((acc, w, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + colWidths[i - 1]);
    return acc;
  }, []);

  const rowHeight = 60;

  const header = `
    <g transform="translate(0, 40)">
      <text x="300" y="0" font-size="18" fill="${text}" font-family="monospace" text-anchor="middle">
        Top 6 Popular Prices
      </text>
    </g>
    <g transform="translate(0, 60)">
      <rect x="0" y="0" width="600" height="${rowHeight}" fill="${border}" />
      ${['NAME', 'PRICE', 'VOL', 'TREND', 'CHART'].map((label, i) => `
        <text x="${colX[i] + colWidths[i]/2}" y="30" font-size="14" fill="${bg}" font-family="monospace" text-anchor="middle">
          ${label}
        </text>
      `).join("")}
    </g>
  `;

  const coinRows = data.filter(Boolean).map((item, i) => {
    const y = 60 + rowHeight + i * rowHeight;
    const rowBg =
      item.trendChange > 0 ? "#103c2d" :
      item.trendChange < 0 ? "#3c1010" :
      (isDark ? "#161b22" : "#f6f8fa");

    const logoUrl = `https://cryptologos.cc/logos/${item.id}-logo.svg?v=025`;

    const cells = `
      <image href="${logoUrl}" x="${colX[0] + 10}" y="${y + 10}" width="20" height="20"
        onerror="this.setAttribute('href', 'https://cryptologos.cc/logos/generic-coin-logo.svg?v=025')" />
      <text x="${colX[0] + 40}" y="${y + 30}" font-size="14" fill="${text}" font-family="monospace">${item.symbol}</text>

      <text x="${colX[1] + colWidths[1]/2}" y="${y + 30}" font-size="14" fill="${text}" font-family="monospace" text-anchor="middle">${item.price}</text>
      <text x="${colX[2] + colWidths[2]/2}" y="${y + 30}" font-size="14" fill="${text}" font-family="monospace" text-anchor="middle">${item.volume}</text>
      <text x="${colX[3] + colWidths[3]/2}" y="${y + 30}" font-size="14" fill="${text}" font-family="monospace" text-anchor="middle">${item.trend}</text>

      <g transform="translate(${colX[4] + 10}, ${y + 5})">
        ${item.chart.replace(/<\/?svg[^>]*>/g, "")}
      </g>
    `;

    // Grid lines
    const lines = colX.map(x => `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + rowHeight}" stroke="${border}" stroke-width="1"/>`).join("");

    return `
      <g>
        <rect x="0" y="${y}" width="600" height="${rowHeight}" fill="${rowBg}" />
        ${cells}
        <line x1="0" y1="${y + rowHeight}" x2="600" y2="${y + rowHeight}" stroke="${border}" stroke-width="1"/>
        ${lines}
      </g>
    `;
  }).join("");

  const footer = `
    <text x="10" y="${data.length * rowHeight + 60 + 30}" font-size="12" fill="${text}" font-family="monospace">
      crypto-price-readme v1.4.1 — github.com/deisgoku/crypto-price-readme
    </text>
  `;

  const svgHeight = data.length * rowHeight + 60 + 60;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="${svgHeight}" viewBox="0 0 600 ${svgHeight}">
      <style>
        text { dominant-baseline: middle; }
        image { shape-rendering: crispEdges; }
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
