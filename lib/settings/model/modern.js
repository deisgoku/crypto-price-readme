const themes = {
  dark: {
    bgColor: '#0d0d0d',
    textColor: '#ffffff',
    borderColor: '#ffffff33',
    rowBorder: '#ffffff55',
    trendUp: '#00c46a',
    trendDown: '#ff595e',
    trendUpBg: '#00c46a20',
    trendDownBg: '#ff595e20',
    headBg: '#ffffff10',
    headText: '#ffffff',
    shadowColor: '#ffffff20',
  },
  light: {
    bgColor: '#ffffff',
    textColor: '#111111',
    borderColor: '#11111133',
    rowBorder: '#11111166',
    trendUp: '#00c46a',
    trendDown: '#ff595e',
    trendUpBg: '#00c46a20',
    trendDownBg: '#ff595e20',
    headBg: '#f1f1f1',
    headText: '#111111',
    shadowColor: '#00000020',
  },
  dracula: {
    bgColor: '#282a36',
    textColor: '#f8f8f2',
    borderColor: '#f8f8f255',
    rowBorder: '#f8f8f288',
    trendUp: '#00ff87',
    trendDown: '#ff6e6e',
    trendUpBg: '#00ff8720',
    trendDownBg: '#ff6e6e20',
    headBg: '#44475a',
    headText: '#ff79c6',
    shadowColor: '#ffffff20',
  },
};

function renderModern(data, theme = 'dark', limit = 6) {
  const {
    bgColor, textColor, borderColor, rowBorder,
    trendUp, trendDown, trendUpBg, trendDownBg,
    headBg, headText, shadowColor,
  } = themes[theme] || themes.dark;

  const font = `font-family="monospace" font-size="12px"`;
  const rowHeight = 50;
  const headerHeight = 25;
  const headPaddingBottom = 18;
  const borderRadius = 10;
  const chartWidth = 80;
  const charWidth = 7;

  const xName = 30;
  const maxPriceLength = Math.max(...data.slice(0, limit).map(d => `$${d.price}`.length));
  const maxVolLength = Math.max(...data.slice(0, limit).map(d => `${d.volume}`.length));
  const maxTrendLength = Math.max(...data.slice(0, limit).map(d => `${d.trend.toFixed(2)}%`.length)) + 2;

  const xPrice = xName + 70;
  const xVol = xPrice + (maxPriceLength * charWidth) + 50;
  const xTrend = xVol + (maxVolLength * charWidth) + 50;
  const xChart = xTrend + (maxTrendLength * charWidth) + 40;
  const svgWidth = xChart + chartWidth + 40;

  const header = `
    <text x="${svgWidth / 2}" y="28" text-anchor="middle" fill="${textColor}" font-size="15" font-weight="bold" font-family="monospace">
      ⛓ Top ${limit} Popular Prices
    </text>`;

  const tableHeadY = 50;
  const tableHead = `
    <rect x="20" y="${tableHeadY}" width="${svgWidth - 40}" height="${headerHeight}" rx="${borderRadius}" fill="${headBg}" stroke="${rowBorder}" />
    <text x="${xName}" y="${tableHeadY + 15}" ${font} fill="${headText}" text-anchor="start" font-weight="bold">NAME</text>
    <text x="${xPrice}" y="${tableHeadY + 15}" ${font} fill="${headText}" text-anchor="start" font-weight="bold">PRICE</text>
    <text x="${xVol + (maxVolLength * charWidth)}" y="${tableHeadY + 15}" ${font} fill="${headText}" text-anchor="end" font-weight="bold">VOL</text>
    <text x="${xTrend + (maxTrendLength * charWidth)}" y="${tableHeadY + 15}" ${font} fill="${headText}" text-anchor="end" font-weight="bold">%24h</text>
    <text x="${xChart + chartWidth / 2}" y="${tableHeadY + 15}" ${font} fill="${headText}" text-anchor="middle" font-weight="bold">CHART</text>`;

  const startRowY = tableHeadY + headerHeight + headPaddingBottom;
  const rows = data.slice(0, limit).map((coin, i) => {
    const y = startRowY + i * rowHeight;
    const trendColor = coin.trend > 0 ? trendUp : coin.trend < 0 ? trendDown : textColor;
    const trendIcon = coin.trend > 0 ? '▲' : coin.trend < 0 ? '▼' : '•';
    const rowBg = coin.trend > 0 ? trendUpBg : coin.trend < 0 ? trendDownBg : 'transparent';

    return `
      <rect x="20" y="${y - 20}" width="${svgWidth - 40}" height="${rowHeight - 10}" rx="${borderRadius}" fill="${rowBg}" stroke="${rowBorder}" />
      <text x="${xName}" y="${y}" ${font} fill="${textColor}" text-anchor="start">${coin.symbol}</text>
      <text x="${xPrice}" y="${y}" ${font} fill="${textColor}" text-anchor="start">$${coin.price}</text>
      <text x="${xVol + (maxVolLength * charWidth)}" y="${y}" ${font} fill="${textColor}" text-anchor="end">${coin.volume}</text>
      <text x="${xTrend + (maxTrendLength * charWidth)}" y="${y}" ${font} fill="${trendColor}" text-anchor="end">${trendIcon} ${coin.trend.toFixed(2)}%</text>
      <g transform="translate(${xChart}, ${y - 20})">${coin.chart.replace(/<\/?svg[^>]*>/g, '')}</g>`;
  }).join('');

  const footerY = startRowY + limit * rowHeight + 10;
  const footer = `<text x="${svgWidth / 2}" y="${footerY}" text-anchor="middle" font-size="11" fill="${textColor}" font-family="monospace">© crypto-price-readme modern</text>`;
  const cardHeight = footerY + 20;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${cardHeight}" viewBox="0 0 ${svgWidth} ${cardHeight}">
      <style> text { dominant-baseline: middle; } </style>
      <filter id="card-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="${shadowColor}" />
      </filter>
      <g filter="url(#card-shadow)">
        <rect x="5" y="5" width="${svgWidth - 10}" height="${cardHeight - 10}" rx="12" ry="12" fill="${bgColor}" />
      </g>
      ${header}
      ${tableHead}
      ${rows}
      ${footer}
    </svg>
  `;
}

module.exports = { renderModern };
