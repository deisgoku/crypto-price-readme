// lib/settings/model/modern.js

const { themes } = require('./theme');

const renderModern = (data, theme = 'dark', limit = 6) => {
  const {
    bgColor, textColor, borderColor, rowBorder,
    trendUp, trendDown, trendUpBg, trendDownBg,
    headBg, headText, shadowColor,
  } = themes[theme] || themes.dark;

  const font = `font-family="monospace" font-size="13px"`;
  const rowHeight = 60;
  const headerHeight = 30;
  const borderRadius = 6;
  const chartWidth = 80;

  // Posisi kolom (x axis) - DISESUAIKAN agar sejajar
  const xName = 40;
  const xPrice = 160;
  const xVol = 270;
  const xTrend = 380;
  const xChart = 490;
  const svgWidth = 600;

  const categoryText = data[0]?.category || 'General';

  const header = `
    <g transform="translate(0, 50)">
      <text x="${svgWidth / 2}" text-anchor="middle" y="0" font-size="16" fill="${textColor}" font-family="monospace" font-weight="bold">
        ⛓ Top ${limit} Popular Prices (Category: ${categoryText})
      </text>
    </g>`;

  const tableHead = `
    <g transform="translate(20, 80)">
      <rect x="0" y="0" width="560" height="${headerHeight}" rx="${borderRadius}" fill="${headBg}" stroke="${rowBorder}" />
      <text x="${xName}" y="15" ${font} fill="${headText}" text-anchor="start" font-weight="bold">NAME</text>
      <text x="${xPrice}" y="15" ${font} fill="${headText}" text-anchor="start" font-weight="bold">PRICE</text>
      <text x="${xVol}" y="15" ${font} fill="${headText}" text-anchor="start" font-weight="bold">VOL</text>
      <text x="${xTrend}" y="15" ${font} fill="${headText}" text-anchor="start" font-weight="bold">%24h</text>
      <text x="${xChart}" y="15" ${font} fill="${headText}" text-anchor="start" font-weight="bold">CHART</text>
    </g>`;

  const rows = data.slice(0, limit).map((coin, i) => {
    const y = 120 + i * rowHeight;
    const trendColor = coin.trend > 0 ? trendUp : coin.trend < 0 ? trendDown : textColor;
    const trendIcon = coin.trend > 0 ? '▲' : coin.trend < 0 ? '▼' : '•';
    const rowBg = coin.trend > 0 ? trendUpBg : coin.trend < 0 ? trendDownBg : 'transparent';

    return `
      <g transform="translate(20, ${y})">
        <rect width="560" height="50" rx="${borderRadius}" fill="${rowBg}" stroke="${rowBorder}" />
        <text x="${xName}" y="25" ${font} fill="${textColor}" text-anchor="start">${coin.symbol}</text>
        <text x="${xPrice}" y="25" ${font} fill="${textColor}" text-anchor="start">$${coin.price}</text>
        <text x="${xVol}" y="25" ${font} fill="${textColor}" text-anchor="start">${coin.volume}</text>
        <text x="${xTrend}" y="25" ${font} fill="${trendColor}" text-anchor="start">${coin.trend.toFixed(2)}% ${trendIcon}</text>
        <path d="${coin.chart}" fill="none" stroke="#0ff" stroke-width="2" transform="translate(${xChart},10) scale(0.75,0.8)" />
      </g>`;
  }).join('');

  const footerY = 120 + limit * rowHeight + 10;
  const currentYear = new Date().getFullYear();

  const footer = `
    <text x="${svgWidth / 2}" y="${footerY}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.7">
      ${currentYear} © Crypto-Price-Readme v1.5.6 (PRO)
    </text>
    <text x="${svgWidth / 2}" y="${footerY + 18}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.6">
      by github.com/deisgoku
    </text>`;

  const height = footerY + 30;

  return `
    <svg width="${svgWidth}" height="${height}" viewBox="0 0 ${svgWidth} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>*{dominant-baseline:middle}</style>
      <defs>
        <filter id="shadow"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="${shadowColor}" flood-opacity="0.5"/></filter>
      </defs>
      <rect x="10" y="5" width="${svgWidth - 20}" height="${height - 10}" rx="14" fill="${bgColor}" filter="url(#shadow)" />
      ${header}
      ${tableHead}
      ${rows}
      ${footer}
    </svg>`;
};

module.exports = { renderModern };
