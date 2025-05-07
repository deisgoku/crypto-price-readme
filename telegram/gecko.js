//   telegram/gecko.js
//   author: Deisgoku


const fetch = require('node-fetch');

async function getGeckoCategories() {
  const res = await fetch('https://api.coingecko.com/api/v3/coins/categories/list');
  const data = await res.json();
  return data.map(c => c.category_id).slice(0, 8); // bisa ubah limit
}

module.exports = { getGeckoCategories };
