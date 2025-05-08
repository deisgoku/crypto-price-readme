//   telegram/gecko.js
//   author: Deisgoku

const axios = require('axios');

async function getCategoryMarkdownList(minCoinCount = 3, maxItems = 30) {
  try {
    console.log('[Gecko] Fetching dari CoinGecko...');
    const res = await axios.get('https://api.coingecko.com/api/v3/coins/categories', { timeout: 5000 });
    const data = res.data;

    let filtered = data
      .filter(cat => (cat.coins_count || 0) >= minCoinCount)
      .sort((a, b) => b.coins_count - a.coins_count)
      .slice(0, maxItems)
      .map(cat => ({
        name: cat.name,
        category_id: cat.id,
        coins: cat.coins_count,
        icon: cat.image || '',
        alias: cat.name.split(' ')[0] // Alias diambil dari kata pertama nama kategori
      }));

    const columnCount = 3;
    const colWidth = 28;
    let rows = Math.ceil(filtered.length / columnCount);
    let lines = [];

    for (let i = 0; i < rows; i++) {
      let line = '';
      for (let j = 0; j < columnCount; j++) {
        const index = i + j * rows;
        const item = filtered[index];
        if (item) {
          const num = index + 1;
          const safeName = item.alias.replace(/([*_`()])/g, '\\$1'); // Menggunakan alias di sini
          const text = `${num}. ${safeName}`;
          line += text.padEnd(colWidth);
        }
      }
      lines.push(line.trimEnd());
    }

    let markdown = `*Pilih Kategori:*\n\n` +
                   lines.join('\n') +
                   `\n\nBalas dengan angka atau nama kategori.\nContoh: \`3\` atau \`DeFi\``;

    // Batas Telegram: 4096, amankan di bawah 4000
    const MAX_LEN = 4000;
    while (markdown.length > MAX_LEN && filtered.length > 3) {
      filtered = filtered.slice(0, filtered.length - columnCount); // potong 1 baris
      rows = Math.ceil(filtered.length / columnCount);
      lines = [];

      for (let i = 0; i < rows; i++) {
        let line = '';
        for (let j = 0; j < columnCount; j++) {
          const index = i + j * rows;
          const item = filtered[index];
          if (item) {
            const num = index + 1;
            const safeName = item.alias.replace(/([*_`()])/g, '\\$1'); // Menggunakan alias di sini
            const text = `${num}. ${safeName}`;
            line += text.padEnd(colWidth);
          }
        }
        lines.push(line.trimEnd());
      }

      markdown = `*Pilih Kategori:*\n\n` +
                 lines.join('\n') +
                 `\n\nBalas dengan angka atau nama kategori.\nContoh: \`3\` atau \`DeFi\``;
    }

    return {
      markdown,
      categories: filtered.map(c => ({
        name: c.name,
        category_id: c.category_id,
        icon: c.icon,
        alias: c.alias
      }))
    };
  } catch (err) {
    console.error('[Gecko] Gagal fetch kategori:', err.message);
    return {
      markdown: '*Gagal memuat kategori. Coba lagi nanti.*',
      categories: []
    };
  }
}

module.exports = { getCategoryMarkdownList };
