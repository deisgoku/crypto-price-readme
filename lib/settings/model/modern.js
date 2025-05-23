// lib/settings/model/modern.js
const { themes } = require('./theme');

const renderModern = (data, theme = 'dark', limit = 10) => {
  const {
    bgColor, textColor, borderColor, rowBorder,
    trendUp, trendDown, trendUpBg, trendDownBg,
    headBg, headText, shadowColor,
  } = themes[theme] || themes.dark;

  // Font settings
  const fontHeader     = `font-family="DejaVu Sans Mono" font-size="16px" font-weight="bold"`;
  const fontSubHeader  = `font-family="DejaVu Sans Mono" font-size="14px" font-weight="bold"`;
  const fontTableHead  = `font-family="DejaVu Sans Mono" font-size="13px" font-weight="bold"`;
  const fontRow        = `font-family="DejaVu Sans Mono" font-size="13px"`;
  const fontFooter1    = `font-family="DejaVu Sans Mono" font-size="13px" font-weight="bold"`;
  const fontFooter2    = `font-family="DejaVu Sans Mono" font-size="13px"`;

  // Layout constants
  const rowHeight      = 60;
  const headerHeight   = 30;
  const borderRadius   = 6;
  const rowStartY      = 135;
  const svgWidth       = 680;
  const chartWidth     = 80;

  // X positions
  const xName          = 80;
  const xPrice         = 190;
  const xVol           = 340;
  const xTrend         = 480;
  const xChart         = 580;

  const categoryText   = data[0]?.category || 'General';

  // Header
  const header = `
    <g transform="translate(0, 40)">
      <text x="${svgWidth / 2}" text-anchor="middle" y="0" ${fontHeader} fill="${textColor}">
        ☍ Top ${limit} Popular MarketCap
      </text>
      <text x="${svgWidth / 2}" text-anchor="middle" y="20" ${fontSubHeader} fill="${textColor}">
        (Category: ${categoryText})
      </text>
    </g>
  `;

  // Table Head
  const tableHead = `
    <g transform="translate(20, 90)">
      <rect x="0" y="0" width="${svgWidth - 40}" height="${headerHeight}" rx="${borderRadius}" fill="${headBg}" stroke="${rowBorder}" />
      <text x="${xName}"  y="15" ${fontTableHead} fill="${headText}" text-anchor="middle">NAME</text>
      <text x="${xPrice}" y="15" ${fontTableHead} fill="${headText}" text-anchor="middle">PRICE</text>
      <text x="${xVol}"   y="15" ${fontTableHead} fill="${headText}" text-anchor="middle">VOL</text>
      <text x="${xTrend}" y="15" ${fontTableHead} fill="${headText}" text-anchor="middle">%24h</text>
      <text x="${xChart}" y="15" ${fontTableHead} fill="${headText}" text-anchor="middle">CHART</text>
    </g>
  `;

  // Data Rows
  const rows = data.slice(0, limit).map((coin, i) => {
    const y = rowStartY + i * rowHeight;
    const trendColor = coin.trend > 0 ? trendUp : coin.trend < 0 ? trendDown : textColor;
    const trendIcon = coin.trend > 0 ? '▲' : coin.trend < 0 ? '▼' : '•';
    const rowBg = coin.trend > 0 ? trendUpBg : coin.trend < 0 ? trendDownBg : 'transparent';
    const chartPath = coin.chart || '';

    return `
      <g transform="translate(20, ${y})">
        <rect width="${svgWidth - 40}" height="50" rx="${borderRadius}" fill="${rowBg}" stroke="${rowBorder}" />
        <text x="${xName - 35}"  y="25" ${fontRow} fill="${textColor}" text-anchor="start">${coin.symbol}</text>
        <text x="${xPrice - 30}" y="25" ${fontRow} fill="${textColor}" text-anchor="start">$${coin.price}</text>
        <text x="${xVol + 30}"   y="25" ${fontRow} fill="${textColor}" text-anchor="end">${coin.volume}</text>
        <text x="${xTrend + 30}" y="25" ${fontRow} fill="${trendColor}" text-anchor="end">${coin.trend.toFixed(2)}% ${trendIcon}</text>
        <g transform="translate(${xChart - chartWidth / 2}, 12)">
          ${chartPath}
        </g>
      </g>
    `;
  }).join('');

  // Footer
  const footerY = rowStartY + limit * rowHeight + 10;
  const currentYear = new Date().getFullYear();

  const footer = `
    <text x="${svgWidth / 2}" y="${footerY}" text-anchor="middle" ${fontFooter1} fill="${textColor}" opacity="0.7">
      Github Crypto Market Card v1.5.9 • MODERN
    </text>
    <text x="${svgWidth / 2}" y="${footerY + 18}" text-anchor="middle" ${fontFooter2} fill="${textColor}" opacity="0.6">
      ${currentYear} © DeisGoku All rights reserved
    </text>
  `;

  const height = footerY + 40;

  // SVG Output
  return `
    <svg width="${svgWidth}" height="${height}" viewBox="0 0 ${svgWidth} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>*{dominant-baseline:middle}</style>
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="${shadowColor}" flood-opacity="0.5" />
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
