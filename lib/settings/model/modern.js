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

const renderModern = (data, theme = 'dark', limit = 6) => {
  const {
    bgColor, textColor, borderColor, rowBorder,
    trendUp, trendDown, trendUpBg, trendDownBg,
    headBg, headText, shadowColor,
  } = themes[theme] || themes.dark;

  const outerPadding = 16;
  const font = `font-family="monospace" font-size="12px"`;
  const charWidth = 7;
  const rowHeight = 50;
  const rowPaddingY = 15;
  const headerHeight = 25;
  const headPaddingBottom = 17;
  const borderRadius = 10;
  const chartWidth = 80;

  const textAnchorConfig = {
    Name: 'start',
    Price: 'start',
    Vol: 'end',
    Trend: 'end',
    Chart: 'middle',
  };

  const xName = outerPadding + 14;
  const maxPriceLength = Math.max(...data.slice(0, limit).map(d => `$${d.price}`.length));
  const maxVolLength = Math.max(...data.slice(0, limit).map(d => `${d.volume}`.length));
  const maxTrendLength = Math.max(...data.slice(0, limit).map(d => `${d.trend.toFixed(2)}%`.length)) + 2;

  const xPrice = xName + 70;
  const xVol = xPrice + (maxPriceLength * charWidth) + 50;
  const xTrend = xVol + (maxVolLength * charWidth) + 50;
  const xChart = xTrend + (maxTrendLength * charWidth) + 40;
  const innerWidth = xChart + chartWidth + outerPadding * 2;

  const header = `
    <text x="${innerWidth / 2}" y="28" text-anchor="middle" fill="${textColor}" font-size="15" font-weight="bold" font-family="monospace">
      ⛓ Top ${limit} Popular Prices
    </text>`;

  const tableHeadY = 50;
  const tableHead = `
    <rect x="${outerPadding}" y="${tableHeadY}" width="${innerWidth - outerPadding * 2}" height="${headerHeight}" rx="${borderRadius}" fill="${headBg}" stroke="${rowBorder}" />
    <text x="${xName}" y="${tableHeadY + 15}" ${font} fill="${headText}" text-anchor="${textAnchorConfig.Name}" font-weight="bold">NAME</text>
    <text x="${xPrice}" y="${tableHeadY + 15}" ${font} fill="${headText}" text-anchor="${textAnchorConfig.Price}" font-weight="bold">PRICE</text>
    <text x="${xVol + (maxVolLength * charWidth)}" y="${tableHeadY + 15}" ${font} fill="${headText}" text-anchor="${textAnchorConfig.Vol}" font-weight="bold">VOL</text>
    <text x="${xTrend + (maxTrendLength * charWidth)}" y="${tableHeadY + 15}" ${font} fill="${headText}" text-anchor="${textAnchorConfig.Trend}" font-weight="bold">%24h</text>
    <text x="${xChart + chartWidth / 2}" y="${tableHeadY + 15}" ${font} fill="${headText}" text-anchor="${textAnchorConfig.Chart}" font-weight="bold">CHART</text>`;

  const startRowY = tableHeadY + headerHeight + headPaddingBottom;
  const rows = data.slice(0, limit).map((coin, i) => {
    const y = startRowY + i * rowHeight;
    const trendColor = coin.trend > 0 ? trendUp : coin.trend < 0 ? trendDown : textColor;
    const trendIcon = coin.trend > 0 ? '▲' : coin.trend < 0 ? '▼' : '•';
    const rowBg = coin.trend > 0 ? trendUpBg : coin.trend < 0 ? trendDownBg : 'transparent';

    return `
      <rect x="${outerPadding}" y="${y - rowPaddingY}" width="${innerWidth - outerPadding * 2}" height="${rowHeight - 10}" rx="${borderRadius}" fill="${rowBg}" stroke="${rowBorder}" />
      <text x="${xName}" y="${y}" ${font} fill="${textColor}" text-anchor="start">${coin.symbol}</text>
      <text x="${xPrice}" y="${y}" ${font} fill="${textColor}" text-anchor="start">$${coin.price}</text>
      <text x="${xVol + (maxVolLength * charWidth)}" y="${y}" ${font} fill="${textColor}" text-anchor="end">${coin.volume}</text>
      <text x="${xTrend + (maxTrendLength * charWidth)}" y="${y}" ${font} fill="${trendColor}" text-anchor="end">${coin.trend.toFixed(2)}% ${trendIcon}</text>
      <path d="${coin.chart}" fill="none" stroke="#0ff" stroke-width="2" transform="translate(${xChart},${y - 15}) scale(0.75,0.8)" />
    `;
  }).join('');

  const footerY1 = startRowY + limit * rowHeight + 12;
  const footer = `
    <text x="${innerWidth / 2}" y="${footerY1}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.7">
      ¢ Crypto-Price-Readme v1.5.5 (PRO)
    </text>
    <text x="${innerWidth / 2}" y="${footerY1 + 18}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.6">
      by github.com/deisgoku
    </text>`;

  const innerHeight = footerY1 + 30;

  return `
    <svg width="${innerWidth}" height="${innerHeight}" viewBox="0 0 ${innerWidth} ${innerHeight}" xmlns="http://www.w3.org/2000/svg">
      <style>*{dominant-baseline:middle}</style>
      <defs>
        <filter id="shadow"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="${shadowColor}" flood-opacity="0.5"/></filter>
      </defs>
      <g transform="translate(0, 0)">
        <rect width="${innerWidth}" height="${innerHeight}" fill="${bgColor}" rx="14" filter="url(#shadow)" />
        ${header}
        ${tableHead}
        ${rows}
        ${footer}
      </g>
    </svg>`;
};

module.exports = { renderModern };
