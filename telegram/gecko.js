const axios = require('axios');

async function getCategoryMarkdownList(maxItems = 40) {
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/coins/categories/list');
    const data = res.data.slice(0, maxItems);

    const columnCount = 2;
    const colWidth = 32;
    const rows = Math.ceil(data.length / columnCount);
    const lines = [];

    for (let i = 0; i < rows; i++) {
      let line = '';
      for (let j = 0; j < columnCount; j++) {
        const index = i + j * rows;
        const item = data[index];
        if (item) {
          const num = index + 1;
          const text = `${num}. ${item.name}`;
          line += text.padEnd(colWidth);
        }
      }
      lines.push(line.trimEnd());
    }

    const markdown = `*Pilih Kategori:*\n\n` +
      lines.join('\n') +
      `\n\nBalas dengan angka atau nama kategori.\nContoh: \`3\` atau \`DeFi\``;

    return {
      markdown,
      categories: data.map((c, i) => ({
        name: c.name,
        category_id: c.category_id,
        alias: c.name
      }))
    };
  } catch (err) {
    console.error('Gagal fetch kategori:', err.message);
    return {
      markdown: '*Gagal memuat kategori.*',
      categories: []
    };
  }
}

module.exports = { getCategoryMarkdownList };
