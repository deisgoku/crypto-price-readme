//   telegram/gecko.js
//   author: Deisgoku

const axios = require('axios');

/**
 * Ambil daftar kategori dari CoinGecko dan format ke markdown 2 kolom + array ID dan ikon.
 * @returns {Promise<{ markdown: string, categories: { name: string, category_id: string, icon: string }[] }>}
 */
async function getCategoryMarkdownList(minCoinCount = 3, maxItems = 30) {
  const url = 'https://api.coingecko.com/api/v3/coins/categories';

  try {
    const res = await axios.get(url);
    const data = res.data;

    const filtered = data
      .filter(cat => (cat.coins_count || 0) >= minCoinCount)
      .sort((a, b) => b.coins_count - a.coins_count)
      .slice(0, maxItems)
      .map(cat => ({
        name: cat.name,
        category_id: cat.id,
        coins: cat.coins_count,
        icon: cat.image || ''  // Menambahkan ikon kategori
      }));

    // Format ke 2 kolom vertikal
    const columnCount = 2;
    const colWidth = 32;
    const rows = Math.ceil(filtered.length / columnCount);
    const lines = [];

    for (let i = 0; i < rows; i++) {
      let line = '';
      for (let j = 0; j < columnCount; j++) {
        const index = i + j * rows;
        const item = filtered[index];
        if (item) {
          const num = index + 1;
          const text = `${num}. ${item.icon ? `![${item.name}](${item.icon})` : ''} ${item.name} (${item.coins})`;
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
      categories: filtered.map(c => ({ name: c.name, category_id: c.category_id, icon: c.icon }))
    };
  } catch (err) {
    console.error('Gagal ambil kategori dari CoinGecko:', err.message);
    return {
      markdown: '*Gagal memuat kategori. Coba lagi nanti.*',
      categories: []
    };
  }
}

module.exports = { getCategoryMarkdownList };
