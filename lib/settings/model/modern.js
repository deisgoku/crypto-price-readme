const renderModern = (data, theme = 'dark', limit = 6) => {
  const bgColor = theme === 'light' ? '#fff' :
                  theme === 'dracula' ? '#282a36' : '#0d0d0d';
  const textColor = theme === 'light' ? '#111' :
                    theme === 'dracula' ? '#f8f8f2' : '#fff';
  const tableHeadBg = theme === 'light' ? '#f1f1f1' :
                      theme === 'dracula' ? '#44475a' : '#ffffff10';
  const font = `font-family="monospace" font-size="12px"`;

  const charWidth = 7; // rata-rata lebar karakter monospace 12px

  // ambil lebar max untuk tiap kolom
  const maxPriceLength = Math.max(...data.slice(0, limit).map(d => `$${d.price}`.length));
  const maxVolLength = Math.max(...data.slice(0, limit).map(d => `${d.volume}`.length));
  const maxTrendLength = Math.max(...data.slice(0, limit).map(d => `${d.trend.toFixed(2)}%`.length)) + 2; // +2 utk ikon

  // hitung posisi dinamis
  const xName = 20;
  const xPrice = xName + 60;
  const xVol = xPrice + (maxPriceLength * charWidth) + 10;
  const xTrend = xVol + (maxVolLength * charWidth) + 10;
  const xChart = xTrend + (maxTrendLength * charWidth) + 10;
  const svgWidth = xChart + 80;

  const header = `
    <text x="${svgWidth / 2}" y="28" text-anchor="middle" fill="${textColor}" font-size="15" font-weight="bold" font-family="monospace">
      ⛓ Top ${limit} Popular Prices
    </text>`;

  const tableHead = `
    <rect x="0" y="40" width="100%" height="20" fill="${tableHeadBg}" />
    <text x="${xName}" y="55" ${font} fill="${textColor}">NAME</text>
    <text x="${xPrice}" y="55" ${font} fill="${textColor}">PRICE</text>
    <text x="${xVol}" y="55" ${font} fill="${textColor}">VOL</text>
    <text x="${xTrend}" y="55" ${font} fill="${textColor}">TREND</text>
  `;

  const rows = data
    .slice(0, limit)
    .map((coin, i) => {
      const y = 70 + i * 40;
      const rowColor = coin.trend >= 0 ? '#104020' : '#401010';
      const trendColor = coin.trend > 0 ? '#1aff1a' : coin.trend < 0 ? '#ff4d4d' : '#fff';
      const trendIcon = coin.trend > 0 ? '▲' : coin.trend < 0 ? '▼' : '•';

      return `
        <rect x="0" y="${y - 15}" width="100%" height="35" fill="${rowColor}" rx="6" />
        <text x="${xName}" y="${y}" ${font} fill="${textColor}">${coin.symbol}</text>
        <text x="${xPrice}" y="${y}" ${font} fill="${textColor}">$${coin.price}</text>
        <text x="${xVol}" y="${y}" ${font} fill="${textColor}">${coin.volume}</text>
        <text x="${xTrend}" y="${y}" ${font} fill="${trendColor}">${coin.trend.toFixed(2)}% ${trendIcon}</text>
        <path d="${coin.chart}" fill="none" stroke="#0ff" stroke-width="2"
          transform="translate(${xChart},${y - 15}) scale(0.35)" />
      `;
    })
    .join('');

  const footerY = 70 + limit * 40;
  const footer = `
    <text x="${svgWidth / 2}" y="${footerY}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.6">
      © crypto-price-readme v1.4.1 by github.com/deisgoku
    </text>`;

  const height = footerY + 20;

  return `
    <svg width="${svgWidth}" height="${height}" viewBox="0 0 ${svgWidth} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>*{dominant-baseline:middle}</style>
      <rect width="100%" height="100%" fill="${bgColor}" rx="14" />
      ${header}
      ${tableHead}
      ${rows}
      ${footer}
    </svg>`;
};

module.exports = { renderModern };
