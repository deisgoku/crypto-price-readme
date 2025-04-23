const renderModern = (data, theme = 'dark', limit = 6) => {
  const bgColor = theme === 'light' ? '#fff' :
                  theme === 'dracula' ? '#282a36' : '#0d0d0d';
  const textColor = theme === 'light' ? '#111' :
                    theme === 'dracula' ? '#f8f8f2' : '#fff';
  const tableHeadBg = theme === 'light' ? '#f1f1f1' :
                      theme === 'dracula' ? '#44475a' : '#ffffff10';
  const border = theme === 'light' ? '#ccc' :
                 theme === 'dracula' ? '#6272a4' : '#333';
  const font = `font-family="monospace" font-size="12px"`;

  const header = `
    <text x="50%" y="28" text-anchor="middle" fill="${textColor}" font-size="15" font-weight="bold" font-family="monospace">
      ⛓ Top ${limit} Popular Prices
    </text>`;

  const tableHead = `
    <rect x="0" y="40" width="100%" height="20" fill="${tableHeadBg}" />
    <text x="20" y="55" ${font} fill="${textColor}">NAME</text>
    <text x="90" y="55" ${font} fill="${textColor}">PRICE</text>
    <text x="170" y="55" ${font} fill="${textColor}">VOL</text>
    <text x="240" y="55" ${font} fill="${textColor}">TREND</text>
    <text x="310" y="55" ${font} fill="${textColor}">CHART</text>
  `;

  const rows = data
    .slice(0, limit)
    .map((coin, i) => {
      const y = 70 + i * 40;
      const rowColor = coin.trend >= 0 ? '#104020' : '#401010';
      const trendColor = coin.trend > 0 ? '#1aff1a' : coin.trend < 0 ? '#ff4d4d' : '#fff';
      const trendIcon = coin.trend > 0 ? '▲' : coin.trend < 0 ? '▼' : '•';

      return `
        <rect x="0" y="${y - 15}" width="100%" height="35" fill="${rowColor}" rx="6" />
        <text x="20" y="${y}" ${font} fill="${textColor}">${coin.symbol}</text>
        <text x="90" y="${y}" ${font} fill="${textColor}">$${coin.price}</text>
        <text x="170" y="${y}" ${font} fill="${textColor}">${coin.volume}</text>
        <text x="240" y="${y}" ${font} fill="${trendColor}">${coin.trend.toFixed(2)}% ${trendIcon}</text>
        <path d="${coin.chart}" fill="none" stroke="#0ff" stroke-width="2" transform="translate(310,${y - 15}) scale(0.4)" />
      `;
    })
    .join('');

  const footerY = 70 + limit * 40;
  const footer = `
    <text x="50%" y="${footerY}" text-anchor="middle" ${font} fill="${textColor}" opacity="0.6">
      © crypto-price-readme v1.4.1 by github.com/deisgoku
    </text>`;

  const height = footerY + 20;

  return `
    <svg width="400" height="${height}" viewBox="0 0 400 ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>*{dominant-baseline:middle}</style>
      <rect width="100%" height="100%" fill="${bgColor}" rx="14" />
      ${header}
      ${tableHead}
      ${rows}
      ${footer}
    </svg>`;
};

module.exports = { renderModern };
