//   telegram/gecko.js
//   author: Deisgoku

const axios = require('axios');
const redis = require('../lib/redis'); 

const CACHE_KEY = 'gecko:categories:v1';
const CACHE_DURATION = 60 * 10; // 10 menit (dalam detik)

async function getCategoryMarkdownList(minCoinCount = 3, maxItems = 30) {
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      console.log('[Gecko] Menggunakan data dari Redis cache.');
      return cached;
    }

    console.log('[Gecko] Fetching dari CoinGecko...');
    const res = await axios.get('https://api.coingecko.com/api/v3/coins/categories', { timeout: 5000 });
    const data = res.data;

    const filtered = data
      .filter(cat => (cat.coins_count || 0) >= minCoinCount)
      .sort((a, b) => b.coins_count - a.coins_count)
      .slice(0, maxItems)
      .map(cat => ({
        name: cat.name,
        category_id: cat.id,
        coins: cat.coins_count,
        icon: cat.image || ''
      }));

    
    const columnCount = 3;
    const colWidth = 28;
    const rows = Math.ceil(filtered.length / columnCount);
    const lines = [];

    for (let i = 0; i < rows; i++) {
      let line = '';
      for (let j = 0; j < columnCount; j++) {
        const index = i + j * rows;
        const item = filtered[index];
        if (item) {
          const num = index + 1;
          const text = `${num}. ${item.name} (${item.coins})`;
          line += text.padEnd(colWidth);
        }
      }
      lines.push(line.trimEnd());
    }

    const markdown = `*Pilih Kategori:*\n\n` +
      lines.join('\n') +
      `\n\nBalas dengan angka atau nama kategori.\nContoh: \`3\` atau \`DeFi\``;

    const result = {
      markdown,
      categories: filtered.map(c => ({
        name: c.name,
        category_id: c.category_id,
        icon: c.icon
      }))
    };

    await redis.set(CACHE_KEY, result, { ex: CACHE_DURATION });
    console.log('[Gecko] Data disimpan ke Redis cache.');
    return result;
  } catch (err) {
    console.error('[Gecko] Gagal fetch kategori:', err.message);
    return {
      markdown: '*Gagal memuat kategori. Coba lagi nanti.*',
      categories: []
    };
  }
}

module.exports = { getCategoryMarkdownList };
