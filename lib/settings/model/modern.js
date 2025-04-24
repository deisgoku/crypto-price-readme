const themes = {
  dark: {
    bgColor: '#0d0d0d',
    textColor: '#ffffff',
    borderColor: '#ffffff33',
    rowBorder: '#ffffff55',
    trendUp: '#00c46a',
    trendDown: '#ff595e',
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
    headBg: '#44475a',
    headText: '#ff79c6',
    shadowColor: '#ffffff20',
  },
};

const renderModern = (data, theme = 'dark', limit = 6) => {
  const {
    bgColor,
    textColor,
    borderColor,
    rowBorder,
    trendUp,
    trendDown,
    headBg,
    headText,
    shadowColor,
  } = themes[theme] || themes.dark;

  const font = `font-family="monospace" font-size="12px"`;
  const charWidth = 7;
  
  const textAnchorConfig = {
  Name: 'middle',    // kiri = start
  Price: 'middle',   // kiri
  Vol: 'middle',       // kanan = end
  Trend: 'middle',     // kanan 
  Chart: 'middle',  // tengah = middle
};

  const rowHeight = 45;
  const rowPaddingY = 18;
  const headerHeight = 25;
  const headPaddingBottom = 30; // awal 10
  const borderRadius = 8;
  const chartWidth = 80;

  const xName = 30;
  const maxPriceLength = Math.max(...data.slice(0, limit).map(d => `$${d.price}`.length));
  const maxVolLength = Math.max(...data.slice(0, limit).map(d => `${d.volume}`.length));
  const maxTrendLength = Math.max(...data.slice(0, limit).map(d => `${d.trend.toFixed(2)}%`.length)) + 2;

  const xPrice = xName + 70;
  const xVol = xPrice + (maxPriceLength * charWidth) + 40;
  const xTrend = xVol + (maxVolLength * charWidth) + 40;
  const xChart = xTrend + (maxTrendLength * charWidth) + 40;
  const svgWidth = xChart + chartWidth + 40;

  const header = `
    <text x="${svgWidth / 2}" y="30" text-anchor="middle" fill="${textColor}" font-size="15" font-weight="bold" font-family="monospace">
      ⛓ Top ${limit} Popular Prices
    </text>`;

  const tableHeadY = 50;
  const tableHead = `
  <rect x="20" y="${tableHeadY}" width="${svgWidth - 40}" height="${headerHeight}" rx="${borderRadius}" fill="${headBg}" stroke="${rowBorder}" />
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

    return `
      <rect x="20" y="${y - rowPaddingY}" width="${svgWidth - 40}" height="${rowHeight - 9}" rx="${borderRadius}"
        fill="transparent" stroke="${rowBorder}" filter="url(#shadow)" />
      <text x="${xName}" y="${y}" ${font} fill="${textColor}" text-anchor="start">${coin.symbol}</text>
      <text x="${xPrice}" y="${y}" ${font} fill="${textColor}" text-anchor="start">$${coin.price}</text>
      <text x="${xVol + (maxVolLength * charWidth)}" y="${y}" ${font} fill="${textColor}" text-anchor="end">${coin.volume}</text>
      <text x="${xTrend + (maxTrendLength * charWidth)}" y="${y}" ${font} fill="${trendColor}" text-anchor="end">${coin.trend.toFixed(2)}% ${trendIcon}</text>
      <path d="${coin.chart}" fill="none" stroke="#0ff" stroke-width="2"
        transform="translate(${xChart},${y - 15}) scale(0.75,0.8)" />
    `;
  }).join('');

  const footerY1 = startRowY + limit * rowHeight + 10;
  const footer = `
    <text x="${svgWidth / 2}" y="${footerY1}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.7">
      ¢ Crypto-Price-Readme v1.5.5 (PRO)
    </text>
    <text x="${svgWidth / 2}" y="${footerY1 + 18}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.6">
      by github.com/deisgoku
    </text>`;

  const height = footerY1 + 30;

  return `
    <svg width="${svgWidth}" height="${height}" viewBox="0 0 ${svgWidth} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>*{dominant-baseline:middle}</style>
      <defs>
        <filter id="shadow"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="${shadowColor}" flood-opacity="0.5"/></filter>
      </defs>
      <rect width="100%" height="100%" fill="${bgColor}" rx="14" filter="url(#shadow)" />
      ${header}
      ${tableHead}
      ${rows}
      ${footer}
    </svg>`;
};

module.exports = { renderModern };
