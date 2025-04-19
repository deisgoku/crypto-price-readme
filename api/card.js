import fetch from "node-fetch";

export default async function handler(req, res) { const { theme = "light" } = req.query;

const coins = [ { id: "bitcoin", symbol: "BTC" }, { id: "ethereum", symbol: "ETH" }, { id: "binancecoin", symbol: "BNB" }, { id: "solana", symbol: "SOL" }, { id: "ripple", symbol: "XRP" }, { id: "dogecoin", symbol: "DOGE" }, ];

const baseUrl = ${req.headers.host.includes('localhost') ? 'http' : 'https'}://${req.headers.host};

const data = await Promise.all( coins.map(async ({ id, symbol }) => { try { const [priceRes, volumeRes, trendRes, chartRes] = await Promise.all([ fetch(${baseUrl}/api/prices?coin=${id}), fetch(${baseUrl}/api/volume?coin=${id}), fetch(${baseUrl}/api/trend?coin=${id}), fetch(${baseUrl}/api/chart?coin=${id}), ]);

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

const bg = theme === "dark" ? "#0d1117" : "#ffffff"; const text = theme === "dark" ? "#c9d1d9" : "#333333"; const border = theme === "dark" ? "#ffffff" : "#000000"; const shadow = theme === "dark" ? "#00000088" : "#cccccc88";

const header = <g transform="translate(0, 40)"> <text x="300" text-anchor="middle" y="0" font-size="16" fill="${text}" font-family="monospace"> ☍ Top 6 Popular Prices </text> </g> <g transform="translate(0, 60)"> <rect x="10" y="0" width="580" height="30" rx="6" ry="6" fill="${border}" /> <text x="70" y="15" text-anchor="middle" font-size="13" fill="${bg}" font-family="monospace">NAME</text> <text x="190" y="15" text-anchor="middle" font-size="13" fill="${bg}" font-family="monospace">PRICE</text> <text x="300" y="15" text-anchor="middle" font-size="13" fill="${bg}" font-family="monospace">VOL</text> <text x="410" y="15" text-anchor="middle" font-size="13" fill="${bg}" font-family="monospace">TREND</text> <text x="520" y="15" text-anchor="middle" font-size="13" fill="${bg}" font-family="monospace">CHART</text> </g>;

const coinRows = data.filter(Boolean).map((item, i) => { const y = 100 + i * 60; const rowBg = item.trendChange > 0 ? "#103c2d" : item.trendChange < 0 ? "#3c1010" : (theme === "dark" ? "#161b22" : "#f6f8fa");

return `
  <g transform="translate(10, ${y})">
    <rect width="580" height="50" rx="6" ry="6" fill="${rowBg}" />
    <text x="70" y="25" text-anchor="end" font-size="13" fill="${text}" font-family="monospace">${item.symbol}</text>
    <text x="190" y="25" text-anchor="end" font-size="13" fill="${text}" font-family="monospace">${item.price}</text>
    <text x="300" y="25" text-anchor="end" font-size="13" fill="${text}" font-family="monospace">${item.volume}</text>
    <text x="410" y="25" text-anchor="end" font-size="13" fill="${text}" font-family="monospace">${item.trend}</text>
    <g transform="translate(470, 5)">
      ${item.chart.replace(/<\/?svg[^>]*>/g, "")}
    </g>
    <rect width="580" height="50" fill="none" stroke="${border}" stroke-width="0.5" rx="6" ry="6" />
  </g>
`;

}).join("");

const footerY = 100 + data.length * 60 + 20;

const footer = <text x="300" y="${footerY}" text-anchor="middle" font-size="11" fill="${text}" font-family="monospace"> © crypto-price-readme v1.4.1 by github.com/deisgoku </text>;

const cardHeight = footerY + 20;

const svg = <svg xmlns="http://www.w3.org/2000/svg" width="600" height="${cardHeight}" viewBox="0 0 600 ${cardHeight}"> <style> text { dominant-baseline: middle; } </style> <filter id="card-shadow"> <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="${shadow}" /> </filter> <g filter="url(#card-shadow)"> <rect x="5" y="5" width="590" height="${cardHeight - 10}" rx="12" ry="12" fill="${bg}" /> </g> ${header} ${coinRows} ${footer} </svg>;

res.setHeader("Content-Type", "image/svg+xml"); res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate"); res.status(200).send(svg); }

