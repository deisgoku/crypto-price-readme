// /lib/settings/model/modern.js

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

  const font = `font-family="monospace" font-size="13px"`;
  const rowHeight = 60;
  const headerHeight = 30;
  const borderRadius = 6;
  const chartWidth = 80;

  const paddingX = 20;
  const svgWidth = 640;

  const xName = paddingX + 70;
  const xPrice = paddingX + 190;
  const xVol = paddingX + 300;
  const xTrend = paddingX + 410;
  const xChart = paddingX + 520;

  const header = `
    <g transform="translate(0, 40)">
      <text x="${svgWidth / 2}" text-anchor="middle" y="0" font-size="16" fill="${textColor}" font-family="monospace" font-weight="bold">
        ⛓ Top ${limit} Popular Prices
      </text>
    </g>`;

  const tableHead = `
    <g transform="translate(0, 60)">
      <rect x="${paddingX}" y="0" width="${svgWidth - paddingX * 2}" height="${headerHeight}" rx="${borderRadius}" fill="${headBg}" stroke="${rowBorder}" />
      <text x="${xName}" y="20" ${font} fill="${headText}" text-anchor="middle" font-weight="bold">NAME</text>
      <text x="${xPrice}" y="20" ${font} fill="${headText}" text-anchor="middle" font-weight="bold">PRICE</text>
      <text x="${xVol}" y="20" ${font} fill="${headText}" text-anchor="middle" font-weight="bold">VOL</text>
      <text x="${xTrend}" y="20" ${font} fill="${headText}" text-anchor="middle" font-weight="bold">%24h</text>
      <text x="${xChart}" y="20" ${font} fill="${headText}" text-anchor="middle" font-weight="bold">CHART</text>
    </g>`;

  const rows = data.slice(0, limit).map((coin, i) => {
    const y = 100 + i * rowHeight;
    const trendColor = coin.trend > 0 ? trendUp : coin.trend < 0 ? trendDown : textColor;
    const trendIcon = coin.trend > 0 ? '▲' : coin.trend < 0 ? '▼' : '•';
    const rowBg = coin.trend > 0 ? trendUpBg : coin.trend < 0 ? trendDownBg : 'transparent';

    return `
      <g transform="translate(${paddingX}, ${y})">
        <rect width="${svgWidth - paddingX * 2}" height="50" rx="${borderRadius}" fill="${rowBg}" stroke="${rowBorder}" />
        <text x="${xName}" y="25" ${font} fill="${textColor}" text-anchor="end">${coin.symbol}</text>
        <text x="${xPrice}" y="25" ${font} fill="${textColor}" text-anchor="end">$${coin.price}</text>
        <text x="${xVol}" y="25" ${font} fill="${textColor}" text-anchor="end">${coin.volume}</text>
        <text x="${xTrend}" y="25" ${font} fill="${trendColor}" text-anchor="end">${coin.trend.toFixed(2)}% ${trendIcon}</text>
        <path d="${coin.chart}" fill="none" stroke="#0ff" stroke-width="2" transform="translate(${xChart - chartWidth / 2 - paddingX},10) scale(0.75,0.8)" />
      </g>`;
  }).join('');

  const footerY = 100 + limit * rowHeight + 10;

  const footer = `
    <text x="${svgWidth / 2}" y="${footerY}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.7">
      ¢ Crypto-Price-Readme v1.5.6 (PRO)
    </text>
    <text x="${svgWidth / 2}" y="${footerY + 18}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.6">
      by github.com/deisgoku
    </text>`;

  const height = footerY + 30;

  return `
    <svg width="${svgWidth}" height="${height}" viewBox="0 0 ${svgWidth} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>*{dominant-baseline:middle}</style>
      <defs>
        <filter id="shadow"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="${shadowColor}" flood-opacity="0.5"/></filter>
      </defs>
      <rect x="${paddingX}" y="5" width="${svgWidth - paddingX * 2}" height="${height - 10}" rx="14" fill="${bgColor}" filter="url(#shadow)" />
      ${header}
      ${tableHead}
      ${rows}
      ${footer}
    </svg>`;
};

module.exports = { renderModern };
