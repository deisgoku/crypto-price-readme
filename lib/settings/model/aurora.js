// lib/settings/model/aurora.js
const { themes } = require('./theme');

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

const renderAurora = (data, theme = 'tokyonight', limit = 10) => {
  const {
    bgColor, textColor, borderColor, rowBorder,
    trendUp, trendDown, trendUpBg, trendDownBg,
    headBg, headText, shadowColor,
  } = themes[theme] || themes.dark;

  const font = `font-family='-apple-system, sans-serif' font-size='13px'`;
  const fontHeader = `font-family='-apple-system, sans-serif' font-size='15px' font-weight='600'`;

  const rowHeight = 60;
  const headerHeight = 32;
  const radius = 14;
  const xName = 80, xPrice = 190, xVol = 340, xTrend = 480, xChart = 580;
  const svgWidth = 680;
  const rowStartY = 135;
  const chartWidth = 80;
  const categoryText = data[0]?.category || 'General';

  const header = `
    <g transform='translate(0, 40)'>
      <text x='${svgWidth / 2}' y='0' text-anchor='middle' ${fontHeader} fill='${textColor}'>
        AURORA — Top ${limit} Coins
      </text>
      <text x='${svgWidth / 2}' y='20' text-anchor='middle' ${font} fill='${textColor}' opacity='0.7'>
        Category: ${categoryText}
      </text>
    </g>
  `;

  const tableHead = `
    <g transform='translate(20, 90)'>
      <rect width='${svgWidth - 40}' height='${headerHeight}' rx='${radius}' fill='${headBg}' stroke='${rowBorder}' />
      <text x='${xName}' y='16' ${font} fill='${headText}' text-anchor='middle'>Name</text>
      <text x='${xPrice}' y='16' ${font} fill='${headText}' text-anchor='middle'>Price</text>
      <text x='${xVol}' y='16' ${font} fill='${headText}' text-anchor='middle'>Vol</text>
      <text x='${xTrend}' y='16' ${font} fill='${headText}' text-anchor='middle'>24h</text>
      <text x='${xChart}' y='16' ${font} fill='${headText}' text-anchor='middle'>Chart</text>
    </g>
  `;

  const rows = data.slice(0, limit).map((coin, i) => {
    // Custom vector icon badges
    let badge = '';
    if (i === 0) {
      badge = `<g transform="translate(${xName - 65}, 10)">
        <path d="M10 1 L12.4 7.6 L19.5 7.6 L13.9 11.9 L16.3 18.5 L10 14 L3.7 18.5 L6.1 11.9 L0.5 7.6 L7.6 7.6 Z"
          fill="#FFD700" transform="scale(1.1)"/>
      </g>`;
    } else if (i === 1) {
      badge = `<g transform="translate(${xName - 65}, 10)">
        <path d="M10 1 L12.4 7.6 L19.5 7.6 L13.9 11.9 L16.3 18.5 L10 14 L3.7 18.5 L6.1 11.9 L0.5 7.6 L7.6 7.6 Z"
          fill="#C0C0C0" transform="scale(1.1)"/>
      </g>`;
    } else if (i === 2) {
      badge = `<g transform="translate(${xName - 65}, 10)">
        <path d="M12 2 C9 6, 13 8, 9 13 C12 12, 12 16, 15 14 C18 10, 14 7, 16 4 C14 3, 13 2, 12 2 Z"
          fill="#FF4500" transform="scale(0.9)"/>
      </g>`;
    }

    const y = rowStartY + i * rowHeight;
    const trendColor = coin.trend > 0 ? trendUp : coin.trend < 0 ? trendDown : textColor;
    const trendIcon = coin.trend > 0 ? '↑' : coin.trend < 0 ? '↓' : '-';
    const rowBg = coin.trend > 0 ? trendUpBg : coin.trend < 0 ? trendDownBg : 'transparent';
    const spark = catmullRomPath(coin.sparkline || []);

    return `
      <g transform='translate(20, ${y})'>
        <rect width='${svgWidth - 40}' height='50' rx='${radius}' fill='${rowBg}' stroke='${rowBorder}' />
        ${badge}
        <text x='${xName - 35}' y='25' ${font} fill='${textColor}' text-anchor='start'>${coin.symbol}</text>
        <text x='${xPrice - 30}' y='25' ${font} fill='${textColor}' text-anchor='start'>$${coin.price}</text>
        <text x='${xVol + 30}' y='25' ${font} fill='${textColor}' text-anchor='end'>${coin.volume}</text>
        <text x='${xTrend + 30}' y='25' ${font} fill='${trendColor}' text-anchor='end'>${coin.trend.toFixed(2)}% ${trendIcon}</text>
        <g transform='translate(${xChart - chartWidth / 2}, 12)'>
          <path d='${spark}' fill='none' stroke='#ffffffcc' stroke-width='2'/>
        </g>
      </g>
    `;
  }).join('');

  const footerY = rowStartY + limit * rowHeight + 25;
  const currentYear = new Date().getFullYear();

  const footer = `
    <text x="${svgWidth / 2}" y="${footerY}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.7">
      ${currentYear} © Crypto-Price-Readme v1.6.0 (PRO) - AURORA
    </text>
    <text x="${svgWidth / 2}" y="${footerY + 18}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.6">
      by X.com/deisgoku
    </text>
  `;

  const height = footerY + 50;

  return `
    <svg width='${svgWidth}' height='${height}' viewBox='0 0 ${svgWidth} ${height}' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <filter id='iosShadow'>
          <feDropShadow dx='0' dy='1' stdDeviation='1.5' flood-color='${shadowColor}' flood-opacity='0.3'/>
        </filter>
      </defs>
      <rect x='10' y='5' width='${svgWidth - 20}' height='${height - 10}' rx='${radius}' fill='${bgColor}' filter='url(#iosShadow)' />
      ${header}
      ${tableHead}
      ${rows}
      ${footer}
    </svg>
  `;
};

module.exports = { renderAurora };
