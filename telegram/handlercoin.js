// lib/handlers.js
const fetch = require('node-fetch');

// Escape helper to prevent coin names from breaking Markdown
function escapeMarkdown(text) {
  return text.replace(/[*_`[\]]/g, '\\$&');
}

// Resolve symbol to CoinGecko IDs (used for /s <query>)
async function resolveSymbolToIds(symbol) {
  const res = await fetch('https://api.coingecko.com/api/v3/coins/list');
  const coins = await res.json();
  const lower = symbol.toLowerCase();

  const exactMatches = coins.filter(c => 
    c.symbol.toLowerCase() === lower || 
    c.id.toLowerCase() === lower || 
    c.name.toLowerCase() === lower
  );

  const partialMatches = coins.filter(c =>
    (c.symbol + c.id + c.name).toLowerCase().includes(lower) &&
    !exactMatches.includes(c)
  );

  return [...exactMatches, ...partialMatches].slice(0, 20); // batasi hasil
}

// Untuk command !c <coinId>
async function handleSymbolCommand(ctx, coinId) {
  try {
    const url = `https://crypto-price-on.vercel.app/api/data?coin=${coinId}`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json.data || !json.data.length) {
      return ctx.reply('☹️ Data tidak ditemukan.');
    }

    const result = json.data[0];
    const msg = `*${escapeMarkdown(result.symbol)}*\nHarga: ${result.price} USD\nVolume: ${result.volume}\nTren: ${result.trend}`;
    return ctx.reply(msg, { parse_mode: 'Markdown' });

  } catch (e) {
    console.error(e);
    return ctx.reply('☹️ Terjadi kesalahan saat mengambil data.');
  }
}

// Resolve categories by name
async function resolveCategories(category) {
  const res = await fetch('https://api.coingecko.com/api/v3/coins/categories/list');
  const categories = await res.json();
  const lower = category.toLowerCase();

  return categories.filter(c => c.category_id.toLowerCase() === lower);
}

// Handle the category command
async function handleCategoryCommand(ctx, category, count = 5) {
  try {
    const categories = await resolveCategories(category);

    if (!categories.length) {
      return ctx.reply('☹️Kategori tidak ditemukan.');
    }

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
  // Handle /c category command with count
  bot.command('c', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);

    // Validation: must have 2 arguments, and the second one must be a number
    if (args.length !== 2 || isNaN(parseInt(args[1]))) {
      return ctx.reply('Contoh:\n/c meme 10\n/c ai 5');
    }

    const [category, count] = args;
    return handleCategoryCommand(ctx, category, count);
  });

  // Search coin (resolve) via /s
  bot.command('s', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    if (!query) return ctx.reply('Contoh:\n/s doge');

    const matches = await resolveSymbolToIds(query);
    if (!matches.length) return ctx.reply('Tidak ditemukan hasil.');

    let reply = `🔎Hasil pencarian untuk *${query}*:\n\n`;
    matches.slice(0, 10).forEach((coin, i) => {
      reply += `${i + 1}. ${coin.name} (${coin.symbol}) - ID: \`${coin.id}\`\n`;
    });

    return ctx.reply(reply, { parse_mode: 'Markdown' });
  });

  // Tampilkan harga langsung via !c <coinId>
  bot.hears(/^!c\s+(.+)/i, async (ctx) => {
    const coinId = ctx.match[1].trim();
    return handleSymbolCommand(ctx, coinId);
  });
};
