// classic.js

const { themes } = require('./theme');
const { generateColoredChart } = require('../chart/colored');

const escapeXml = (str) =>
  String(str).replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  }[c]));

const renderClassic = (data, theme = 'dark', limit = 10) => {
  const {
    bgColor, textColor, borderColor, rowBorder,
    trendUp, trendDown, headBg, headText,
  } = themes[theme] || themes.dark;

  const font = `font-family='monospace' font-size='13px'`;
  const rowHeight = 40;
  const headerHeight = 30;

  const xCols = [20, 150, 280, 410, 540];
  const labels = ['NAME', 'PRICE', 'VOL', '%24h', 'CHART'];

  const svgWidth = 700;
  const startY = 90;
  const categoryText = escapeXml(data[0]?.category || 'General');

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
    <g transform="translate(0, ${startY})">
      ${xCols.map((x, i) => `
        <rect x="${x}" y="0" width="130" height="${headerHeight}" fill="${headBg}" stroke="${rowBorder}" />
        ${i === xCols.length - 1 ? `<line x1="${x + 130}" y1="0" x2="${x + 130}" y2="${headerHeight}" stroke="${rowBorder}" />` : ''}
        <text x="${x + 65}" y="15" ${font} fill="${headText}" text-anchor="middle" font-weight="bold">${labels[i]}</text>
      `).join('')}
    </g>
  `;

  const rows = data.slice(0, limit).map((coin, i) => {
    const y = startY + headerHeight + i * rowHeight;
    const trendColor = coin.trend > 0 ? trendUp : coin.trend < 0 ? trendDown : textColor;
    const trendIcon = coin.trend > 0 ? '▲' : coin.trend < 0 ? '▼' : '•';
    const rowFill = i % 2 === 0 ? '#ffffff22' : '#00bfff22';
    const lastColRightEdge = xCols[xCols.length - 1] + 130;

    // Chart generation (if values available)
    const chartSvg = Array.isArray(coin.sparkline) && coin.sparkline.length >= 4
      ? generateColoredChart(coin.sparkline)
      : '';

    return `
      <g transform="translate(0, ${y})">
        <rect x="${xCols[0]}" y="0" width="${lastColRightEdge - xCols[0]}" height="${rowHeight}" fill="${rowFill}" />
        ${xCols.map((x, j) => `
          <rect x="${x}" y="0" width="130" height="${rowHeight}" fill="transparent" stroke="${borderColor}" />
          ${j === xCols.length - 1 ? `<line x1="${x + 130}" y1="0" x2="${x + 130}" y2="${rowHeight}" stroke="${borderColor}" />` : ''}
        `).join('')}
        <text x="${xCols[0] + 5}" y="20" ${font} fill="${textColor}" text-anchor="start">${escapeXml(coin.symbol)}</text>
        <text x="${xCols[1] + 5}" y="20" ${font} fill="${textColor}" text-anchor="start">$${escapeXml(coin.price)}</text>
        <text x="${xCols[2] + 125}" y="20" ${font} fill="${textColor}" text-anchor="end">${escapeXml(coin.volume)}</text>
        <text x="${xCols[3] + 125}" y="20" ${font} fill="${trendColor}" text-anchor="end">${escapeXml(coin.trend.toFixed(2))}% ${trendIcon}</text>
        <g transform="translate(${xCols[4] + 15}, 8)">
          <rect x="0" y="0" width="100" height="24" fill="none" stroke="gray" stroke-width="0.2" />
          ${chartSvg}
        </g>
      </g>
    `;
  }).join('');

  const footerY = startY + headerHeight + limit * rowHeight + 25;
  const currentYear = new Date().getFullYear();

  const footer = `
    <text x="${svgWidth / 2}" y="${footerY}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.7">
      ${currentYear} © Crypto-Price-Readme v1.6.0 (PRO)
    </text>
    <text x="${svgWidth / 2}" y="${footerY + 18}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.6">
      by X.com/deisgoku
    </text>
  `;

  const height = footerY + 50;

  return `
    <svg width="${svgWidth}" height="${height}" viewBox="0 0 ${svgWidth} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>*{dominant-baseline:middle}</style>
      <rect x="5" y="5" width="${svgWidth - 10}" height="${height - 10}" fill="${bgColor}" stroke="${borderColor}" />
      ${header}
      ${tableHead}
      ${rows}
      ${footer}
    </svg>
  `;
};

module.exports = { renderClassic };
