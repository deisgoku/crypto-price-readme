import fetch from "node-fetch";

export default async function handler(req, res) {
  const { theme = "light" } = req.query;

  const coins = [
    "bitcoin", "ethereum", "binancecoin", "solana", "ripple", "dogecoin"
  ];

  try {
    const data = await Promise.all(
      coins.map(async (coin) => {
        try {
          const [priceRes, volumeRes, trendRes, chartRes] = await Promise.all([
            fetch(`${getBaseUrl(req)}/api/prices?coin=${coin}`),
            fetch(`${getBaseUrl(req)}/api/volume?coin=${coin}`),
            fetch(`${getBaseUrl(req)}/api/trend?coin=${coin}`),
            fetch(`${getBaseUrl(req)}/api/chart?coin=${coin}`)
          ]);

          const price = await priceRes.json();
          const volume = await volumeRes.json();
          const trend = await trendRes.json();
          const chart = await chartRes.text();

          return {
            coin,
            price: price.message,
            volume: volume.message,
            trend: trend.message,
            chart
          };
        } catch (err) {
          console.error(`Error fetching data for ${coin}:`, err);
          return null;
        }
      })
    );

    const svg = generateSvg(data.filter(Boolean), theme);

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    res.status(200).send(svg);
  } catch (err) {
    console.error("Error processing data:", err);
    res.status(500).send("Internal Server Error");
  }
}

function getBaseUrl(req) {
  return req.headers.host.includes("localhost") ? "http" : "https";
}

function generateSvg(data, theme) {
  const bg = theme === "dark" ? "#0d1117" : "#ffffff";
  const text = theme === "dark" ? "#c9d1d9" : "#333333";
  const border = theme === "dark" ? "#30363d" : "#e1e4e8";

  const coinRows = data.map((item, i) => {
    return `
      <g transform="translate(0, ${i * 70})">
        <rect x="0" y="0" width="600" height="70" fill="${i % 2 === 0 ? bg : (theme === 'dark' ? '#161b22' : '#f6f8fa')}" />
        <text x="10" y="25" font-size="14" fill="${text}" font-family="monospace">${item.coin.toUpperCase()}</text>
        <text x="150" y="25" font-size="14" fill="${text}" font-family="monospace">${item.price}</text>
        <text x="300" y="25" font-size="14" fill="${text}" font-family="monospace">${item.volume}</text>
        <text x="450" y="25" font-size="14" fill="${text}" font-family="monospace">${item.trend}</text>
        <g transform="translate(10, 35)">
          ${item.chart.replace(/<\/?svg[^>]*>/g, "")}
        </g>
        <line x1="0" y1="69" x2="600" y2="69" stroke="${border}" stroke-width="1" />
      </g>
    `;
  }).join("");

  const footerText = "crypto-price-readme v1.4.1";
  const footer = `
    <text x="10" y="${data.length * 70 + 20}" font-size="12" fill="${text}" font-family="monospace">${footerText}</text>
  `;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="${data.length * 70 + 40}" viewBox="0 0 600 ${data.length * 70 + 40}">
      <style> text { dominant-baseline: middle; } </style>
      <rect width="100%" height="100%" fill="${bg}" />
      ${coinRows}
      ${footer}
    </svg>
  `;
}
