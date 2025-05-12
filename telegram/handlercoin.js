// lib/handlers.js
const fetch = require('node-fetch');

// Escape helper to prevent coin names from breaking Markdown
function escapeMarkdown(text) {
  return text.replace(/[*_`[\]]/g, '\\$&');
}

// Resolve symbol to CoinGecko IDs
async function resolveSymbolToIds(symbol) {
  const res = await fetch('https://api.coingecko.com/api/v3/coins/list');
  const coins = await res.json();
  const lower = symbol.toLowerCase();
  
  return coins.filter(c => c.symbol.toLowerCase() === lower);
}

// Handle the symbol command
async function handleSymbolCommand(ctx, symbol) {
  try {
    const matches = await resolveSymbolToIds(symbol);

    if (!matches.length) {
      return ctx.reply('Symbol tidak ditemukan.');
    }

    if (matches.length > 1) {
      // Try to find an exact match by name or ID
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

    if (!json.data || !json.data.length) {
      return ctx.reply('☹️Data tidak ditemukan.');
    }

    const result = json.data[0];
    const msg = `*${escapeMarkdown(result.symbol)}*\nHarga: ${result.price} USD\nVolume: ${result.volume}\nTren: ${result.trend}`;
    return ctx.reply(msg, { parse_mode: 'Markdown' });

  } catch (e) {
    console.error(e);
    return ctx.reply('☹️Terjadi kesalahan saat mengambil data.');
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

  // Handle !c <symbol> for coin
  bot.hears(/^!c\s+(.+)/i, async (ctx) => {
    const symbol = ctx.match[1].trim();
    return handleSymbolCommand(ctx, symbol);
  });
};
