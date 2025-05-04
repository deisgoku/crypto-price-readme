// lib/settings/model/aurora.js
// author : Deisgoku 

const { themes, trendUpGradient, trendDownGradient } = require('./theme');

function drawMedalBadge(rank) {
  const colors = {
    1: { fill: "#FFD700", stroke: "#cc9b00", ribbon: "#FFA500" },
    2: { fill: "#C0C0C0", stroke: "#888", ribbon: "#aaa" },
    3: { fill: "#CD7F32", stroke: "#854d0e", ribbon: "#b06d26" },
  };
  if (rank > 3) return "";

  const { fill, stroke, ribbon } = colors[rank];

  return `
    <g transform="scale(0.8)">
      <rect x="0" y="0" width="32" height="10" rx="2" fill="${ribbon}" />
      <path d="M4 10 L8 18 L12 10 Z" fill="${ribbon}" />
      <path d="M20 10 L24 18 L28 10 Z" fill="${ribbon}" />
      <circle cx="16" cy="10" r="9" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <text x="16" y="14" text-anchor="middle" font-size="10" font-weight="bold" fill="#000">${rank}</text>
    </g>
  `;
}

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
    headText, shadowColor,
    colName, colPrice, colVol, colTrend,
  } = themes[theme] || themes.dark;

  
  const fontTitle = `font-family='Verdana' font-size='14px' font-weight='bold'`;
  const fontSubTitle = `font-family='Verdana' font-size='13px' font-weight='bold'`;
  const fontHeader = `font-family='Arial' font-size='13px' font-weight='bold'`;
  const fontRow = `font-family='monospace' font-size='13px'`;
  const fontFooter1 = `font-family='Verdana' font-size='12px' font-weight='bold'`;
  const fontFooter2 = `font-family='sans-serif' font-size='12px'`;

  const rowHeight = 60;
  const headerHeight = 32;
  const radius = 20;
  const xName = 80, xPrice = 190, xVol = 340, xTrend = 480, xChart = 580;
  const svgWidth = 680;
  const rowStartY = 135;
  const chartWidth = 80;
  const categoryText = data[0]?.category || 'General';

  const header = `
    <g transform='translate(0, 40)'>
      <text x='${svgWidth / 2}' y='0' text-anchor='middle' ${fontTitle} fill='${textColor}'>
        ☍ Top ${limit} Popular MarketCap
      </text>
      <text x='${svgWidth / 2}' y='20' text-anchor='middle' ${fontSubTitle} fill='${textColor}' opacity='0.7'>
        ( Category: ${categoryText} )
      </text>
    </g>
  `;

  const tableHead = `
    <g transform='translate(20, 90)'>
      <rect width='${svgWidth - 40}' height='${headerHeight}' rx='${radius}' fill='url(#auroraHeaderGradient)' stroke='${rowBorder}' />
      <text x='${xName}' y='20' ${fontHeader} fill='${headText}' text-anchor='middle'>Name</text>
      <text x='${xPrice}' y='20' ${fontHeader} fill='${headText}' text-anchor='middle'>Price</text>
      <text x='${xVol}' y='20' ${fontHeader} fill='${headText}' text-anchor='middle'>Vol</text>
      <text x='${xTrend}' y='20' ${fontHeader} fill='${headText}' text-anchor='middle'>24h</text>
      <text x='${xChart}' y='20' ${fontHeader} fill='${headText}' text-anchor='middle'>Chart</text>
    </g>
  `;

  const rows = data.slice(0, limit).map((coin, i) => {
    const badgeX = xName - 72;
    const medal = drawMedalBadge(i + 1);
    const badge = medal ? `<g transform="translate(${badgeX}, 6)">${medal}</g>` : '';

    const y = rowStartY + i * rowHeight;
    const rowBg = coin.trend > 0 ? trendUpBg : coin.trend < 0 ? trendDownBg : 'transparent';
    const trendIcon = coin.trend > 0 ? '↑' : coin.trend < 0 ? '↓' : '-';
    const spark = catmullRomPath(coin.sparkline || []);
    const trendGradientId = coin.trend > 0 ? 'auroraTrendUp' : coin.trend < 0 ? 'auroraTrendDown' : '';

    return `
      <g transform='translate(20, ${y})'>
        <rect width='${svgWidth - 40}' height='50' rx='${radius}' fill='${rowBg}' stroke='${rowBorder}' />
        ${badge}
        <text x='${xName - 35}' y='25' ${fontRow} fill='${colName || textColor}' text-anchor='start'>${coin.symbol}</text>
        <text x='${xPrice - 30}' y='25' ${fontRow} fill='${colPrice || textColor}' text-anchor='start'>$${coin.price}</text>
        <text x='${xVol + 30}' y='25' ${fontRow} fill='${colVol || textColor}' text-anchor='end'>${coin.volume}</text>
        <text x='${xTrend + 30}' y='25' ${fontRow} fill='${colTrend || textColor}' text-anchor='end'>${coin.trend.toFixed(2)}% ${trendIcon}</text>
        <g transform='translate(${xChart - chartWidth / 2}, 12)'>
          <path d='${spark}' fill='none' stroke='url(#${trendGradientId})' stroke-width='2'/>
        </g>
      </g>
    `;
  }).join('');

  const footerY = rowStartY + limit * rowHeight + 25;
  const year = new Date().getFullYear();

  const footer = `
    <text x="${svgWidth / 2}" y="${footerY}" text-anchor="middle" ${fontFooter1} fill="${textColor}" opacity="0.7">
       Github Crypto Market Card™  v1.6.0 • AURORA
    </text>
    <text x="${svgWidth / 2}" y="${footerY + 18}" text-anchor="middle" ${fontFooter2} fill="${textColor}" opacity="0.6">
      ${year} © DeisGoku All rights reserved
    </text>
  `;

  const height = footerY + 50;

  return `
<svg width='${svgWidth}' height='${height}' viewBox='0 0 ${svgWidth} ${height}' xmlns='http://www.w3.org/2000/svg'>
  <defs>
    <filter id='iosShadow'>
      <feDropShadow dx='0' dy='1' stdDeviation='1.5' flood-color='${shadowColor}' flood-opacity='0.3'/>
    </filter>
    <linearGradient id="auroraHeaderGradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4facfe"/>
      <stop offset="100%" stop-color="#00f2fe"/>
    </linearGradient>
    ${trendUpGradient('auroraTrendUp')}
    ${trendDownGradient('auroraTrendDown')}
  </defs>
  <rect width='100%' height='100%' fill='${bgColor}'/>
  ${header}
  ${tableHead}
  ${rows}
  ${footer}
</svg>
  `;
};

module.exports = { renderAurora };
