const themes = {
  dark: {
    bg: '#0d1117',
    text: '#c9d1d9',
    up: '#16c784',
    down: '#ea3943',
    border: '#30363d'
  },
  light: {
    bg: '#ffffff',
    text: '#000000',
    up: '#089981',
    down: '#f23645',
    border: '#d0d7de'
  }
};

function renderModern(data, theme = 'dark', limit = 6) {
  const t = themes[theme] || themes.dark;

  const rows = data.slice(0, limit).map((coin, i) => {
    const color = coin.trend >= 0 ? t.up : t.down;
    return `
      <g transform="translate(0, ${i * 38})">
        <rect x="0" y="0" width="480" height="38" fill="${i % 2 ? t.bg : t.border}" />
        <text x="10" y="25" fill="${t.text}" font-size="14" font-family="Segoe UI">${coin.symbol}</text>
        <text x="80" y="25" fill="${t.text}" font-size="14" font-family="Segoe UI">$${coin.price}</text>
        <text x="160" y="25" fill="${t.text}" font-size="14" font-family="Segoe UI">${coin.volume}</text>
        <text x="250" y="25" fill="${color}" font-size="14" font-family="Segoe UI">${coin.trend?.toFixed(2)}%</text>
        ${coin.chart ? `<path d="${coin.chart}" stroke="${color}" stroke-width="2" fill="none" transform="translate(330,4)" />` : ''}
      </g>
    `;
  }).join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="${38 * limit}" viewBox="0 0 480 ${38 * limit}">
  <style>
    text { dominant-baseline: middle }
  </style>
  <rect width="100%" height="100%" fill="${t.bg}" />
  ${rows}
</svg>
  `.trim();
}

module.exports = { renderModern };
