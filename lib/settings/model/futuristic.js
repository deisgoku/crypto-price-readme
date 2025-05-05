// lib/settings/model/futuristic.js
// Author : DeisGoku

const { themes } = require('./theme');

// Convert array to Catmull-Rom spline path
function catmullRomPath(points, width = 80, height = 30) {
  const slice = points.slice(-30);
  const max = Math.max(...slice);
  const min = Math.min(...slice);
  const range = max - min || 1;
  const stepX = width / (slice.length - 1);

  const scaled = slice.map((val, i) => {
    const x = i * stepX;
    const y = height - ((val - min) / range) * height;
    return [x, y];
  });

  if (scaled.length < 2) return '';
  let d = `M${scaled[0][0]},${scaled[0][1]}`;

  for (let i = 0; i < scaled.length - 1; i++) {
    const p0 = scaled[i - 1] || scaled[i];
    const p1 = scaled[i];
    const p2 = scaled[i + 1];
    const p3 = scaled[i + 2] || p2;

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }

  return d;
}

const renderFuturistic = (data, theme = 'dark', limit = 10) => {
  const {
    bgColor, textColor, borderColor, rowBorder,
    trendUp, trendDown, trendUpBg, trendDownBg,
    headBg, headText, shadowColor,
  } = themes[theme] || themes.dark;

  const fontHeader = `font-family="Verdana" font-size="16px" font-weight="bold"`;
  const fontSubHeader = `font-family="Verdana" font-size="14px" font-weight="bold"`;
  const fontTableHead = `font-family="Arial" font-size="13px"`;
  const fontRow = `font-family="monospace" font-size="13px"`;
  const fontFooter = `font-family="monospace" font-size="13px"`;

  const rowHeight = 60;
  const headerHeight = 30;
  const borderRadius = 6;
  const xName = 80;
  const xPrice = 190;
  const xVol = 340;
  const xTrend = 480;
  const xChart = 580;
  const svgWidth = 680;
  const rowStartY = 135;
  const chartWidth = 80;
  const categoryText = data[0]?.category || 'General';

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

  const tableHead = `
    <g transform="translate(20, 90)">
      <rect x="0" y="0" width="${svgWidth - 40}" height="${headerHeight}" rx="${borderRadius}" fill="${headBg}" stroke="${rowBorder}" />
      <text x="${xName}" y="15" ${fontTableHead} fill="${headText}" text-anchor="middle">NAME</text>
      <text x="${xPrice}" y="15" ${fontTableHead} fill="${headText}" text-anchor="middle">PRICE</text>
      <text x="${xVol}" y="15" ${fontTableHead} fill="${headText}" text-anchor="middle">VOL</text>
      <text x="${xTrend}" y="15" ${fontTableHead} fill="${headText}" text-anchor="middle">%24h</text>
      <text x="${xChart}" y="15" ${fontTableHead} fill="${headText}" text-anchor="middle">CHART</text>
    </g>
  `;

  const rows = data.slice(0, limit).map((coin, i) => {
    const y = rowStartY + i * rowHeight;
    const trendColor = coin.trend > 0 ? trendUp : coin.trend < 0 ? trendDown : textColor;
    const trendIcon = coin.trend > 0 ? '▲' : coin.trend < 0 ? '▼' : '•';
    const rowBg = coin.trend > 0 ? trendUpBg : coin.trend < 0 ? trendDownBg : 'transparent';
    const spark = catmullRomPath(coin.sparkline || []);

    return `
      <g transform="translate(20, ${y})">
        <rect width="${svgWidth - 40}" height="50" rx="${borderRadius}" fill="${rowBg}" stroke="${rowBorder}" />
        <text x="${xName - 35}" y="25" ${fontRow} fill="${textColor}" text-anchor="start">${coin.symbol}</text>
        <text x="${xPrice - 30}" y="25" ${fontRow} fill="${textColor}" text-anchor="start">$${coin.price}</text>
        <text x="${xVol + 30}" y="25" ${fontRow} fill="${textColor}" text-anchor="end">${coin.volume}</text>
        <text x="${xTrend + 30}" y="25" ${fontRow} fill="${trendColor}" text-anchor="end">${coin.trend.toFixed(2)}% ${trendIcon}</text>
        <g transform="translate(${xChart - chartWidth / 2}, 12)">
          <path d="${spark}" fill="none" stroke="#00f5c4" stroke-width="2" />
        </g>
      </g>
    `;
  }).join('');

  const footerY = rowStartY + limit * rowHeight + 10;
  const currentYear = new Date().getFullYear();

  const footer = `
    <text x="${svgWidth / 2}" y="${footerY}" text-anchor="middle" ${fontFooter} fill="${textColor}" opacity="0.7">
    Github Crypto Market Card • FUTURISTIC
    </text>
    <text x="${svgWidth / 2}" y="${footerY + 18}" text-anchor="middle" ${fontFooter} fill="${textColor}" opacity="0.6">
    ${currentYear} © DeisGoku All rights reserved
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

module.exports = { renderFuturistic };
