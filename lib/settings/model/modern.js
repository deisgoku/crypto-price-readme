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

  // Font presets
  const fonts = {
    title: 'font-family="Verdana" font-size="16px" font-weight="bold"',
    subtitle: 'font-family="Verdana" font-size="13px"',
    header: 'font-family="monospace" font-size="13px" font-weight="bold"',
    row: 'font-family="Courier New" font-size="13px"',
  };

  const rowHeight = 60;
  const headerHeight = 30;
  const borderRadius = 6;
  const chartWidth = 100;

  // Column positions
  const xNameStart = 30;
  const xPriceStart = 180;
  const xVolStart = 300;
  const xTrendStart = 420;
  const xChartStart = 520;

  const svgWidth = 640;
  const rowStartY = 135; // offset row agar tidak mepet ke table head

  const categoryText = data[0]?.category || 'General';

  const header = `
    <g transform="translate(0, 40)">
      <text x="${svgWidth / 2}" text-anchor="middle" y="0" ${fonts.title} fill="${textColor}">
        ☍ Top ${limit} Popular MarketCap
      </text>
      <text x="${svgWidth / 2}" text-anchor="middle" y="20" ${fonts.subtitle} fill="${textColor}">
        (Category: ${categoryText})
      </text>
    </g>
  `;

  const tableHead = `
    <g transform="translate(20, 90)">
      <rect x="0" y="0" width="600" height="${headerHeight}" rx="${borderRadius}" fill="${headBg}" stroke="${rowBorder}" />
      <text x="${xNameStart + 45}" y="15" ${fonts.header} fill="${headText}" text-anchor="middle">NAME</text>
      <text x="${xPriceStart + 45}" y="15" ${fonts.header} fill="${headText}" text-anchor="middle">PRICE</text>
      <text x="${xVolStart + 45}" y="15" ${fonts.header} fill="${headText}" text-anchor="middle">VOL</text>
      <text x="${xTrendStart + 45}" y="15" ${fonts.header} fill="${headText}" text-anchor="middle">%24h</text>
      <text x="${xChartStart + chartWidth / 2}" y="15" ${fonts.header} fill="${headText}" text-anchor="middle">CHART</text>
    </g>
  `;

  const rows = data.slice(0, limit).map((coin, i) => {
    const y = rowStartY + i * rowHeight;
    const trendColor = coin.trend > 0 ? trendUp : coin.trend < 0 ? trendDown : textColor;
    const trendIcon = coin.trend > 0 ? '▲' : coin.trend < 0 ? '▼' : '•';
    const rowBg = coin.trend > 0 ? trendUpBg : coin.trend < 0 ? trendDownBg : 'transparent';

    return `
      <g transform="translate(20, ${y})">
        <rect width="600" height="50" rx="${borderRadius}" fill="${rowBg}" stroke="${rowBorder}" />
        <text x="${xNameStart}" y="25" ${fonts.row} fill="${textColor}" text-anchor="start">${coin.symbol}</text>
        <text x="${xPriceStart}" y="25" ${fonts.row} fill="${textColor}" text-anchor="start">$${coin.price}</text>
        <text x="${xVolStart + 90}" y="25" ${fonts.row} fill="${textColor}" text-anchor="end">${coin.volume}</text>
        <text x="${xTrendStart + 90}" y="25" ${fonts.row} fill="${trendColor}" text-anchor="end">${coin.trend.toFixed(2)}% ${trendIcon}</text>
        <path d="${coin.chart}" fill="none" stroke="#0ff" stroke-width="2" transform="translate(${xChartStart},10) scale(1.0,0.8)" />
      </g>
    `;
  }).join('');

  const footerY = rowStartY + limit * rowHeight + 10;
  const currentYear = new Date().getFullYear();

  const footer = `
    <text x="${svgWidth / 2}" y="${footerY}" text-anchor="middle" ${fonts.row} fill="${textColor}" opacity="0.7">
      ${currentYear} © Crypto-Price-Readme v1.5.9 (PRO)
    </text>
    <text x="${svgWidth / 2}" y="${footerY + 18}" text-anchor="middle" ${fonts.row} fill="${textColor}" opacity="0.6">
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
