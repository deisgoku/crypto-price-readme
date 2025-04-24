const renderModern = (data, theme = 'dark', limit = 6) => {
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
    },
  }[theme];

  const font = `font-family='Fira Code, monospace' font-size='12px'`;
  const charWidth = 7;
  const maxPriceLength = Math.max(...data.slice(0, limit).map(d => `$${d.price}`.length));
  const maxVolLength = Math.max(...data.slice(0, limit).map(d => `${d.volume}`.length));
  const maxTrendLength = Math.max(...data.slice(0, limit).map(d => `${d.trend.toFixed(2)}%`.length)) + 2;

  const xName = 40;
  const xPrice = xName + 100;
  const xVol = xPrice + (maxPriceLength * charWidth) + 40;
  const xTrend = xVol + (maxVolLength * charWidth) + 40;
  const xChart = xTrend + (maxTrendLength * charWidth) + 40;
  const chartWidth = 100;
  const svgWidth = xChart + chartWidth + 50;

  const header = `
    <text x='${svgWidth / 2}' y='30' text-anchor='middle' fill='${themes.textColor}' font-size='15' font-weight='bold' font-family='monospace'>
      ⛓ Top ${limit} Popular Prices
    </text>`;

  const tableHead = `
    <rect x='20' y='50' width='${svgWidth - 40}' height='30' fill='${themes.headBg}' stroke='${themes.borderColor}' rx='8'/>
    <text x='${xName + 20}' y='70' ${font} fill='${themes.headText}' text-anchor='middle' font-weight='bold'>Name</text>
    <text x='${xPrice + 20}' y='70' ${font} fill='${themes.headText}' text-anchor='middle' font-weight='bold'>Price</text>
    <text x='${xVol + 20}' y='70' ${font} fill='${themes.headText}' text-anchor='middle' font-weight='bold'>Vol</text>
    <text x='${xTrend + 20}' y='70' ${font} fill='${themes.headText}' text-anchor='middle' font-weight='bold'>Trend</text>
    <text x='${xChart + chartWidth / 2}' y='70' ${font} fill='${themes.headText}' text-anchor='middle' font-weight='bold'>Chart</text>`;

  const rows = data.slice(0, limit).map((coin, i) => {
    const y = 100 + i * 45;
    const trendColor = coin.trend > 0 ? themes.trendUp : coin.trend < 0 ? themes.trendDown : themes.textColor;
    const trendIcon = coin.trend > 0 ? '▲' : coin.trend < 0 ? '▼' : '•';

    return `
      <rect x='20' y='${y - 18}' width='${svgWidth - 40}' height='38' fill='none' stroke='${themes.rowBorder}' rx='8'/>
      <text x='${xName}' y='${y}' ${font} fill='${themes.textColor}' text-anchor='start'>${coin.symbol}</text>
      <text x='${xPrice}' y='${y}' ${font} fill='${themes.textColor}' text-anchor='start'>$${coin.price}</text>
      <text x='${xVol + (maxVolLength * charWidth)}' y='${y}' ${font} fill='${themes.textColor}' text-anchor='end'>${coin.volume}</text>
      <text x='${xTrend + (maxTrendLength * charWidth)}' y='${y}' ${font} fill='${trendColor}' text-anchor='end'>${coin.trend.toFixed(2)}% ${trendIcon}</text>
      <path d='${coin.chart}' fill='none' stroke='#0ff' stroke-width='2' transform='translate(${xChart},${y - 15}) scale(0.8,0.9)' />
    `;
  }).join('');

  const footerY = 100 + limit * 45;
  const footer = `
    <text x='${svgWidth / 2}' y='${footerY}' text-anchor='middle' ${font} fill='${themes.textColor}' opacity='0.7'>¢ Crypto-Price-Readme V1.5.5 (PRO)</text>
    <text x='${svgWidth / 2}' y='${footerY + 18}' text-anchor='middle' ${font} fill='${themes.textColor}' opacity='0.6'>by github.com/deisgoku</text>`;

  const height = footerY + 40;

  return `
    <svg width='${svgWidth}' height='${height}' viewBox='0 0 ${svgWidth} ${height}' xmlns='http://www.w3.org/2000/svg'>
      <style>*{dominant-baseline:middle}</style>
      <defs>
        <filter id='shadow'>
          <feDropShadow dx='0' dy='1' stdDeviation='2' flood-color='#000' flood-opacity='0.3'/>
        </filter>
      </defs>
      <rect x='10' y='10' width='${svgWidth - 20}' height='${height - 20}' fill='${themes.bgColor}' rx='14' filter='url(#shadow)' stroke='${themes.borderColor}' />
      ${header}
      ${tableHead}
      ${rows}
      ${footer}
    </svg>`;
};

module.exports = { renderModern };
