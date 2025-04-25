// lib/settings/model/modern.js
const { themes } = require('./theme');

// Approximate pixel width of a string for monospace font at 13px
const approxTextWidth = (text) => text.length * 8; // Monospace, font-size 13px

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

  // Posisi dinamis kolom berdasarkan lebar teks menggunakan approxTextWidth
  const xNameStart = 20;
  const xNameMiddle = xNameStart + approxTextWidth("NAME") / 2;
  const xNameEnd = xNameStart + approxTextWidth("NAME");

  const xPriceStart = 160;
  const xPriceMiddle = xPriceStart + approxTextWidth("PRICE") / 2;
  const xPriceEnd = xPriceStart + approxTextWidth("PRICE");

  const xVolStart = 270;
  const xVolMiddle = xVolStart + approxTextWidth("VOL") / 2;
  const xVolEnd = xVolStart + approxTextWidth("VOL");

  const xTrendStart = 380;
  const xTrendMiddle = xTrendStart + approxTextWidth("%24h") / 2;
  const xTrendEnd = xTrendStart + approxTextWidth("%24h");

  const xChartStart = 490;
  const xChartMiddle = xChartStart + approxTextWidth("CHART") / 2;
  const xChartEnd = xChartStart + approxTextWidth("CHART");

  const svgWidth = 600;

  const categoryText = data[0]?.category || 'General';

  const header = `
    <g transform="translate(0, 50)">
      <text x="${svgWidth / 2}" text-anchor="middle" y="0" font-size="16" fill="${textColor}" font-family="monospace" font-weight="bold">
        ⛓ Top ${limit} Popular Prices (Category: ${categoryText})
      </text>
    </g>
  `;

  const tableHead = `
    <g transform="translate(20, 80)">
      <rect x="0" y="0" width="560" height="${headerHeight}" rx="${borderRadius}" fill="${headBg}" stroke="${rowBorder}" />
      <text x="${xNameEnd}" y="15" ${font} fill="${headText}" text-anchor="end" font-weight="bold">NAME</text>
      <text x="${xPriceStart}" y="15" ${font} fill="${headText}" text-anchor="start" font-weight="bold">PRICE</text>
      <text x="${xVolStart}" y="15" ${font} fill="${headText}" text-anchor="start" font-weight="bold">VOL</text>
      <text x="${xTrendStart}" y="15" ${font} fill="${headText}" text-anchor="start" font-weight="bold">%24h</text>
      <text x="${xChartStart}" y="15" ${font} fill="${headText}" text-anchor="start" font-weight="bold">CHART</text>
    </g>
  `;

  const rows = data.slice(0, limit).map((coin, i) => {
    const y = 120 + i * rowHeight;
    const trendColor = coin.trend > 0 ? trendUp : coin.trend < 0 ? trendDown : textColor;
    const trendIcon = coin.trend > 0 ? '▲' : coin.trend < 0 ? '▼' : '•';
    const rowBg = coin.trend > 0 ? trendUpBg : coin.trend < 0 ? trendDownBg : 'transparent';

    return `
      <g transform="translate(20, ${y})">
        <rect width="560" height="50" rx="${borderRadius}" fill="${rowBg}" stroke="${rowBorder}" />
        <text x="${xNameStart}" y="25" ${font} fill="${textColor}" text-anchor="start">${coin.symbol}</text>
        <text x="${xPriceStart}" y="25" ${font} fill="${textColor}" text-anchor="start">$${coin.price}</text>
        <text x="${xVolStart}" y="25" ${font} fill="${textColor}" text-anchor="start">${coin.volume}</text>
        <text x="${xTrendStart}" y="25" ${font} fill="${trendColor}" text-anchor="start">${coin.trend.toFixed(2)}% ${trendIcon}</text>
        <path d="${coin.chart}" fill="none" stroke="#0ff" stroke-width="2" transform="translate(${xChartStart},10) scale(0.75,0.8)" />
      </g>
    `;
  }).join('');

  const footerY = 120 + limit * rowHeight + 10;
  const currentYear = new Date().getFullYear();

  const footer = `
    <text x="${svgWidth / 2}" y="${footerY}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.7">
      ${currentYear} © Crypto-Price-Readme v1.5.6 (PRO)
    </text>
    <text x="${svgWidth / 2}" y="${footerY + 18}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.6">
      by github.com/deisgoku
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
