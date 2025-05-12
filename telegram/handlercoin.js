// lib/handlers.js
const fetch = require('node-fetch');

// Escape helper biar nama coin gak error di Markdown
function escapeMarkdown(text) {
  return text.replace(/[*_`[\]]/g, '\\$&');
}

async function resolveSymbolToIds(symbol) {
  const res = await fetch('https://api.coingecko.com/api/v3/coins/list');
  const coins = await res.json();
  const lower = symbol.toLowerCase();

  return coins.filter(c => c.symbol.toLowerCase() === lower);
}

async function handleSymbolCommand(ctx, symbol) {
  try {
    const matches = await resolveSymbolToIds(symbol);
    if (!matches.length) return ctx.reply('Symbol tidak ditemukan.');

    if (matches.length > 1) {
  // Coba cari yang name atau id persis cocok
    const exact = matches.find(c =>
    c.id.toLowerCase() === symbol.toLowerCase() ||
    c.name.toLowerCase() === symbol.toLowerCase()
  );

  if (exact) {
    matches.length = 1;
    matches[0] = exact;
  } else {
    let reply = '🤔 Ditemukan beberapa token dengan simbol sama:\n\n';
    matches.forEach((coin, i) => {
      reply += `${i + 1}. ${coin.name} (${coin.id})\n`;
    });
    return ctx.reply(reply);
  }
}
    const coinId = matches[0].id;
    const url = `https://crypto-price-on.vercel.app/api/data?coin=${coinId}`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json.data || !json.data.length) return ctx.reply('☹️Data tidak ditemukan.');

    const result = json.data[0];
    const msg = `*${escapeMarkdown(result.symbol)}*\nHarga: ${result.price} USD\nVolume: ${result.volume}\nTren: ${result.trend}`;

    return ctx.reply(msg, { parse_mode: 'Markdown' });

  } catch (e) {
    console.error(e);
    return ctx.reply('☹️Terjadi kesalahan saat mengambil data.');
  }
}

async function resolveCategories(category) {
  const res = await fetch('https://api.coingecko.com/api/v3/coins/categories/list');
  const categories = await res.json();
  const lower = category.toLowerCase();

  return categories.filter(c => c.category_id.toLowerCase() === lower);
}

async function handleCategoryCommand(ctx, category, count = 5) {
  try {
    const categories = await resolveCategories(category);
    if (!categories.length) return ctx.reply('☹️Kategori tidak ditemukan.');

    if (categories.length > 1) {
      let reply = `🤔 Ditemukan beberapa kategori dengan nama *${category}*:\n\n`;
      categories.forEach((cat, i) => {
        reply += `${i + 1}. ${cat.name} - ID: ${cat.category_id}\n`;
      });
      return ctx.reply(reply + '\nSilakan pilih nomor kategori yang sesuai.');
    }

    const categoryId = categories[0].category_id;
    const url = `https://crypto-price-on.vercel.app/api/data?category=${categoryId}&count=${count}`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json.data || !json.data.length) {
      return ctx.reply('☹️Data tidak ditemukan dalam kategori tersebut.');
    }

    let message = `Kategori *${category}* (${json.data.length} coin):\n\n`;
    json.data.forEach((coin, i) => {
      message += `${i + 1}. ${coin.symbol} - ${coin.price} USD - ${coin.trend}\n`;
    });

    return ctx.reply(message, { parse_mode: 'Markdown' });

  } catch (e) {
    console.error(e);
    return ctx.reply('☹️ Terjadi kesalahan saat mengambil data.');
  }
}

module.exports = bot => {
  bot.command('c', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (!args.length) return ctx.reply('Contoh:\n!c pepe\n!c memes 10');

    const [first, second] = args;

    // Cek apakah input adalah kategori + jumlah
    if (args.length === 2 && !isNaN(parseInt(second))) {
      return handleCategoryCommand(ctx, first, second);
    }

    // Kalau cuma satu argumen atau bukan angka, anggap sebagai nama coin
    return handleSymbolCommand(ctx, first);
  });
};
