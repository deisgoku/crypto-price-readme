  const renderModern = (data, theme = 'dark', limit = 6) => {
  const bgColor = theme === 'light' ? '#fff' : theme === 'dracula' ? '#282a36' : '#0d0d0d';
  const textColor = theme === 'light' ? '#111' : theme === 'dracula' ? '#f8f8f2' : '#fff';
  const tableHeadBg = theme === 'light' ? '#f1f1f1' : theme === 'dracula' ? '#44475a' : '#ffffff10';
  const font = `font-family="monospace" font-size="12px"`;
  const charWidth = 7; // rata-rata lebar karakter monospace 12px

  const maxPriceLength = Math.max(...data.slice(0, limit).map(d => `$${d.price}`.length));
  const maxVolLength = Math.max(...data.slice(0, limit).map(d => `${d.volume}`.length));
  const maxTrendLength = Math.max(...data.slice(0, limit).map(d => `${d.trend.toFixed(2)}%`.length)) + 2;

  const xName = 20;
  const xPrice = xName + 60;
  const xVol = xPrice + (maxPriceLength * charWidth) + 30;
  const xTrend = xVol + (maxVolLength * charWidth) + 30;
  const xChart = xTrend + (maxTrendLength * charWidth) + 30;
  const chartWidth = 80;
  const svgWidth = xChart + chartWidth + 40;

  const header = `
    <text x="${svgWidth / 2}" y="30" text-anchor="middle" fill="${textColor}" font-size="15" font-weight="bold" font-family="monospace">
      ⛓ Top ${limit} Popular Prices
    </text>`;

  const tableHead = `
    <rect x="0" y="50" width="${svgWidth}" height="25" fill="${tableHeadBg}" />
    <text x="${xName}" y="66" ${font} fill="${textColor}" text-anchor="start">Name</text>
    <text x="${xPrice}" y="66" ${font} fill="${textColor}" text-anchor="start">Price</text>
    <text x="${xVol + (maxVolLength * charWidth)}" y="66" ${font} fill="${textColor}" text-anchor="end">Vol</text>
    <text x="${xTrend + (maxTrendLength * charWidth)}" y="66" ${font} fill="${textColor}" text-anchor="end">Trend</text>
    <text x="${xChart + chartWidth / 2}" y="66" ${font} fill="${textColor}" text-anchor="middle">Chart</text>`;

  const rows = data.slice(0, limit).map((coin, i) => {
    const y = 90 + i * 45;
    const trendColor = coin.trend > 0 ? '#1aff1a' : coin.trend < 0 ? '#ff4d4d' : '#fff';
    const trendIcon = coin.trend > 0 ? '▲' : coin.trend < 0 ? '▼' : '•';

    return `
      <rect x="20" y="${y - 18}" width="${svgWidth - 40}" height="38" fill="transparent" stroke="#444" rx="8" />
      <text x="${xName}" y="${y}" ${font} fill="${textColor}" text-anchor="start">${coin.symbol}</text>
      <text x="${xPrice}" y="${y}" ${font} fill="${textColor}" text-anchor="start">$${coin.price}</text>
      <text x="${xVol + (maxVolLength * charWidth)}" y="${y}" ${font} fill="${textColor}" text-anchor="end">${coin.volume}</text>
      <text x="${xTrend + (maxTrendLength * charWidth)}" y="${y}" ${font} fill="${trendColor}" text-anchor="end">${coin.trend.toFixed(2)}% ${trendIcon}</text>
      <path d="${coin.chart}" fill="none" stroke="#0ff" stroke-width="2"
        transform="translate(${xChart},${y - 15}) scale(0.5,0.6)" />
    `;
  }).join('');

  const footerY = 90 + limit * 45;
  const footer = `
    <text x="${svgWidth / 2}" y="${footerY}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.6">
      © crypto-price-readme v1.4.1 by github.com/deisgoku
    </text>`;

  const height = footerY + 20;

  return `
    <svg width="${svgWidth}" height="${height}" viewBox="0 0 ${svgWidth} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>*{dominant-baseline:middle}</style>
      <filter id="shadow"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/></filter>
      <rect width="100%" height="100%" fill="${bgColor}" rx="14" filter="url(#shadow)" />
      ${header}
      ${tableHead}
      ${rows}
      ${footer}
    </svg>`;
};

module.exports = { renderModern };
