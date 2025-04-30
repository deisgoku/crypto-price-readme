// lib/settings/model/modern.js
const { themes } = require('./theme');

// Approximate pixel width of a string for monospace font at 13px
const approxTextWidth = (text) => text.length * 8;

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

  // Kolom posisi fix dengan jarak rapi antar kolom
  const xName = 40;
  const xPrice = 160;
  const xVol = 300;
  const xTrend = 440;
  const xChart = 550;

  const svgWidth = 650;
  const rowStartY = 135;
  const chartPathOffsetX = 0; // chart line relative X in its box
  const chartWidth = 80;

  const categoryText = data[0]?.category || 'General';

  const header = `
    <g transform="translate(0, 40)">
      <text x="${svgWidth / 2}" text-anchor="middle" y="0" font-size="16" fill="${textColor}" font-family="monospace" font-weight="bold">
        ☍ Top ${limit} Popular MarketCap
      </text>
      <text x="${svgWidth / 2}" text-anchor="middle" y="20" font-size="13" fill="${textColor}" font-family="monospace">
        (Category: ${categoryText})
      </text>
    </g>
  `;

  const tableHead = `
    <g transform="translate(20, 90)">
      <rect x="0" y="0" width="${svgWidth - 40}" height="${headerHeight}" rx="${borderRadius}" fill="${headBg}" stroke="${rowBorder}" />
      <text x="${xName}" y="15" ${font} fill="${headText}" text-anchor="middle" font-weight="bold">NAME</text>
      <text x="${xPrice}" y="15" ${font} fill="${headText}" text-anchor="middle" font-weight="bold">PRICE</text>
      <text x="${xVol}" y="15" ${font} fill="${headText}" text-anchor="middle" font-weight="bold">VOL</text>
      <text x="${xTrend}" y="15" ${font} fill="${headText}" text-anchor="middle" font-weight="bold">%24h</text>
      <text x="${xChart}" y="15" ${font} fill="${headText}" text-anchor="middle" font-weight="bold">CHART</text>
    </g>
  `;

  const rows = data.slice(0, limit).map((coin, i) => {
    const y = rowStartY + i * rowHeight;
    const trendColor = coin.trend > 0 ? trendUp : coin.trend < 0 ? trendDown : textColor;
    const trendIcon = coin.trend > 0 ? '▲' : coin.trend < 0 ? '▼' : '•';
    const rowBg = coin.trend > 0 ? trendUpBg : coin.trend < 0 ? trendDownBg : 'transparent';

    return `
      <g transform="translate(20, ${y})">
        <rect width="${svgWidth - 40}" height="50" rx="${borderRadius}" fill="${rowBg}" stroke="${rowBorder}" />
        <text x="${xName - 50}" y="25" ${font} fill="${textColor}" text-anchor="start">${coin.symbol}</text>
        <text x="${xPrice - 30}" y="25" ${font} fill="${textColor}" text-anchor="start">$${coin.price}</text>
        <text x="${xVol + 30}" y="25" ${font} fill="${textColor}" text-anchor="end">${coin.volume}</text>
        <text x="${xTrend + 30}" y="25" ${font} fill="${trendColor}" text-anchor="end">${coin.trend.toFixed(2)}% ${trendIcon}</text>
        <g transform="translate(${xChart - chartWidth / 2}, 12)">
          <path d="${coin.chart}" fill="none" stroke="#0ff" stroke-width="2" transform="scale(0.9,0.85)" />
        </g>
      </g>
    `;
  }).join('');

  const footerY = rowStartY + limit * rowHeight + 10;
  const currentYear = new Date().getFullYear();

  const footer = `
    <text x="${svgWidth / 2}" y="${footerY}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.7">
      ${currentYear} © Crypto-Price-Readme v1.5.9 (PRO)
    </text>
    <text x="${svgWidth / 2}" y="${footerY + 18}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.6">
      by X.com/deisgoku
    </text>
  `;

  const height = footerY + 40;

  return `
    <svg width="${svgWidth}" height="${height}" viewBox="0 0 ${svgWidth} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>*{dominant-baseline:middle}</style>
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="${shadowColor}" flood-opacity="0.5"/>
        </filter>
      </defs>
      <rect x="10" y="5" width="${svgWidth - 20}" height="${height - 10}" rx="14" fill="${bgColor}" filter="url(#shadow)" />
      ${header}
      ${tableHead}
      ${rows}
      ${footer}
    </svg>
  `;
};

module.exports = { renderModern };
