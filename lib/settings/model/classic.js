const { themes } = require('./theme');

const renderClassic = (data, theme = 'dark', limit = 10) => {
  const {
    bgColor, textColor, borderColor, rowBorder,
    trendUp, trendDown, headBg, headText,
  } = themes[theme] || themes.dark;

  const font = `font-family='monospace' font-size='13px'`;
  const rowHeight = 40;
  const headerHeight = 30;
  const svgWidth = 650;
  const startY = 90;

  const colWidth = 130;
  const xCols = [20, 150, 280, 410, 540];
  const labels = ['NAME', 'PRICE', 'VOL', '%24h', 'CHART'];
  const lastColRightEdge = xCols[xCols.length - 1] + colWidth;
  const categoryText = data[0]?.category || 'General';

  const header = `
    <g transform="translate(0, 40)">
      <text x="${svgWidth / 2}" y="0" text-anchor="middle" font-size="16" fill="${textColor}" font-family="Verdana" font-weight="bold">
        ☍ Top ${limit} Popular MarketCap
      </text>
      <text x="${svgWidth / 2}" y="20" text-anchor="middle" font-size="14" fill="${textColor}" font-family="Verdana">
        (Category: ${categoryText})
      </text>
    </g>
  `;

  const tableHead = `
    <g transform="translate(0, ${startY})">
      ${xCols.map((x, i) => `
        <rect x="${x}" y="0" width="${colWidth}" height="${headerHeight}" fill="${headBg}" stroke="${rowBorder}" />
        <text x="${x + colWidth / 2}" y="15" ${font} fill="${headText}" text-anchor="middle" font-weight="bold">${labels[i]}</text>
      `).join('')}
      <!-- Garis akhir kolom header -->
      <line x1="${lastColRightEdge}" y1="0" x2="${lastColRightEdge}" y2="${headerHeight}" stroke="${rowBorder}" />
    </g>
  `;

  const rows = data.slice(0, limit).map((coin, i) => {
    const y = startY + headerHeight + i * rowHeight;
    const trendColor = coin.trend > 0 ? trendUp : coin.trend < 0 ? trendDown : textColor;
    const trendIcon = coin.trend > 0 ? '▲' : coin.trend < 0 ? '▼' : '•';
    const rowFill = i % 2 === 0 ? '#ffffff22' : '#00bfff22';

    return `
      <g transform="translate(0, ${y})">
        <rect x="${xCols[0]}" y="0" width="${lastColRightEdge - xCols[0]}" height="${rowHeight}" fill="${rowFill}" />
        ${xCols.map((x) => `
          <rect x="${x}" y="0" width="${colWidth}" height="${rowHeight}" fill="transparent" stroke="${borderColor}" />
        `).join('')}
        <!-- Garis akhir kolom setiap baris -->
        <line x1="${lastColRightEdge}" y1="0" x2="${lastColRightEdge}" y2="${rowHeight}" stroke="${borderColor}" />
        <text x="${xCols[0] + 5}" y="20" ${font} fill="${textColor}" text-anchor="start">${coin.symbol}</text>
        <text x="${xCols[1] + 5}" y="20" ${font} fill="${textColor}" text-anchor="start">$${coin.price}</text>
        <text x="${xCols[2] + colWidth - 5}" y="20" ${font} fill="${textColor}" text-anchor="end">${coin.volume}</text>
        <text x="${xCols[3] + colWidth - 5}" y="20" ${font} fill="${trendColor}" text-anchor="end">${coin.trend.toFixed(2)}% ${trendIcon}</text>
        <g transform="translate(${xCols[4] + 10}, 6)">
          <rect x="0" y="0" width="110" height="28" fill="none" stroke="transparent" />
          <path d="${coin.chart}" fill="none" stroke="#0ff" stroke-width="2" transform="scale(0.8, 0.8)" />
        </g>
      </g>
    `;
  }).join('');

  const footerY = startY + headerHeight + limit * rowHeight + 25;
  const year = new Date().getFullYear();

  const footer = `
    <text x="${svgWidth / 2}" y="${footerY}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.7">
      ${year} © Crypto-Price-Readme v1.5.9 (PRO) - Classic
    </text>
    <text x="${svgWidth / 2}" y="${footerY + 18}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.6">
      by X.com/deisgoku
    </text>
  `;

  const height = footerY + 25;

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
