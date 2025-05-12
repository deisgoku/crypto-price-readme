// lib/handlers.js
const fetch = require('node-fetch');

// Fungsi bantu untuk membungkus teks 
function wrapText(text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';

  for (const word of words) {
    if ((line + word).length <= maxWidth) {
      line += (line ? ' ' : '') + word;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

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


async function searchCoinAndFormat(query) {
  const matches = await resolveSymbolToIds(query);
  if (!matches.length) return null;

  const maxNameLen = 30;
  const maxIdLen = 25;

  const nameMax = Math.min(
    maxNameLen,
    Math.max(...matches.map(c => c.name.length), 'NAMA'.length)
  );
  const idMax = Math.min(
    maxIdLen,
    Math.max(...matches.map(c => c.id.length), 'ID'.length)
  );

  const lineWidth = 5 + nameMax + idMax;

  let reply = `🔎 Hasil pencarian coin berdasarkan nama *${query.toUpperCase()}*\n`;
  reply += '```' + '\n';
  reply += '-'.repeat(lineWidth) + '\n';
  reply += `${'#'.padEnd(4)}${'NAMA'.padEnd(nameMax)}${'ID'}\n`;
  reply += '-'.repeat(lineWidth) + '\n';

  matches.slice(0, 10).forEach((coin, i) => {
    const nameLines = wrapText(coin.name, nameMax);
    const idLines = wrapText(coin.id, idMax);
    const maxLines = Math.max(nameLines.length, idLines.length);

    for (let j = 0; j < maxLines; j++) {
      const number = j === 0 ? `${i + 1}.`.padEnd(4) : ' '.repeat(4);
      const name = (nameLines[j] || '').padEnd(nameMax);
      const id = idLines[j] || '';
      reply += `${number}${name}${id}\n`;
    }
  });

  reply += '-'.repeat(lineWidth) + '\n';
  reply += 'Gunakan ID untuk menampilkan harga\n';
  reply += 'Contoh: !c <id coin> | !c pepe-token\n';
  reply += '-'.repeat(lineWidth) + '\n';
  reply += '```';

  return reply;
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

    // Hitung panjang maksimum label dan isi
    const labelPad = 12;
    const price = result.price;
    const volume = result.volume;
    const trend = result.trend;

    const valuePad = Math.max(price.length, volume.length, trend.length);
    const lineLen = labelPad + 3 + valuePad;

    let msg = `📊 Market ${result.symbol.toUpperCase()}\n`;
    msg += '-'.repeat(lineLen) + '\n';
    msg += 'HARGA'.padEnd(labelPad) + ' :  ' + price.padStart(valuePad) + '\n';
    msg += 'VOLUME'.padEnd(labelPad) + ' :  ' + volume.padStart(valuePad) + '\n';
    msg += 'TREND'.padEnd(labelPad) + ' :  ' + trend.padStart(valuePad) + '\n';
    msg += '-'.repeat(lineLen);

    return ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (e) {
    console.error(e);
    return ctx.reply('☹️ Terjadi kesalahan saat mengambil data.');
  }
}

//--------- Area kategori --------+

// Resolve categories by name
async function resolveCategories(category) {
  const res = await fetch('https://api.coingecko.com/api/v3/coins/categories/list');
  const categories = await res.json();
  const lower = category.toLowerCase();
  return categories.filter(c => c.category_id.toLowerCase() === lower || c.name.toLowerCase().includes(lower));
}

async function searchCategoryCommand(ctx, category) {
  const categories = await resolveCategories(category);

  if (!categories.length) {
    return ctx.reply('☹️Kategori tidak ditemukan.');
  }

  if (categories.length === 1) {
    // hanya 1 hasil, lanjut ke handleCategoryCommand
    return null;
  }

  // Banyak hasil, tampilkan daftar
  const maxNameLength = Math.max(...categories.map(cat => cat.name.length), 'NAMA'.length, 20);
  const maxIdLength = Math.max(...categories.map(cat => cat.category_id.length), 'ID'.length, 20);
  const lineLength = 6 + maxNameLength + 2 + maxIdLength;

  let reply = `🤔 Ditemukan beberapa kategori dengan nama *${category.toUpperCase()}*:\n`;
  reply += '```\n';
  reply += '-'.repeat(lineLength) + '\n';
  reply += 'NAMA'.padEnd(maxNameLength) + '  ' + 'ID\n';
  reply += '-'.repeat(lineLength) + '\n';

  categories.forEach((cat, i) => {
    const nameLines = wrapText(cat.name, maxNameLength);
    const idLines = wrapText(cat.category_id, maxIdLength);
    const maxLines = Math.max(nameLines.length, idLines.length);

    for (let j = 0; j < maxLines; j++) {
      const num = j === 0 ? `${(i + 1)}.`.padStart(3) + ' ' : '    ';
      const name = (nameLines[j] || '').padEnd(maxNameLength);
      const id = idLines[j] || '';
      reply += `${num}${name}  ${id}\n`;
    }
  });

  reply += '-'.repeat(lineLength) + '\n';
  reply += 'Silakan pilih nomor atau ketik ID yang sesuai.\n';
  reply += '```';

  return ctx.reply(reply, { parse_mode: 'Markdown' });
}

// Handle the category command
async function handleCategoryCommand(ctx, categoryId, count = 5) {
  try {
    const url = `https://crypto-price-on.vercel.app/api/data?category=${categoryId}&count=${count}`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json.data || !json.data.length) {
      return ctx.reply('☹️Data tidak ditemukan dalam kategori tersebut.');
    }

    const nameMax = 20;
    const priceLen = Math.max(...json.data.map(c => c.price.length), 'HARGA'.length);
    const volLen = 10;
    const trendLen = 6;

    let message = `📊 Kategori  :      *${categoryId.toUpperCase()}*     ${json.data.length}\n`;
    const totalLen = nameMax + priceLen + volLen + trendLen + 6;
    message += '```\n';
    message += '-'.repeat(totalLen) + '\n';
    message += `${'NAMA'.padEnd(nameMax)}  ${'HARGA'.padEnd(priceLen)}  ${'VOL'.padEnd(volLen)}  ${'TREND'}\n`;
    message += '-'.repeat(totalLen) + '\n';

    json.data.forEach((coin) => {
      const nameLines = wrapText(coin.symbol, nameMax);
      const price = coin.price.padEnd(priceLen);
      const volume = coin.volume.padEnd(volLen);
      const trend = coin.trend.padEnd(trendLen);

      nameLines.forEach((line, i) => {
        const name = line.padEnd(nameMax);
        const prefix = i === 0 ? '' : ' '.repeat(3);
        const row = i === 0
          ? `${name}  ${price}  ${volume}  ${trend}`
          : `${prefix}${name}`;
        message += row + '\n';
      });
    });

    message += '-'.repeat(totalLen) + '\n';
    message += '```';

    return ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (e) {
    console.error(e);
    return ctx.reply('☹️ Terjadi kesalahan saat mengambil data.');
  }
}




module.exports = bot => {
  // Handle /cat category command with count
  bot.command('cat', async (ctx) => {
  const [_, cat, count] = ctx.message.text.split(' ');

  if (!cat) {
    return ctx.reply('❓Contoh: `/cat gaming 5`', { parse_mode: 'Markdown' });
  }
  await handleCategoryCommand(ctx, cat, Number(count) || 5);
});


bot.command('c', async (ctx) => {
  const text = ctx.message.text.trim();
  const [_, ...args] = text.split(' ');
  const category = args.join(' ');

  if (!category) {
    return ctx.reply('❓Contoh: `/c gaming`', { parse_mode: 'Markdown' });
  }
  await searchCategoryCommand(ctx, category);
});


  // Search coin (resolve) via /s
  bot.command('s', async (ctx) => {
  const query = ctx.message.text.split(' ').slice(1).join(' ');
  if (!query) return ctx.reply('Contoh:\n/s doge');

  const reply = await searchCoinAndFormat(query);
  if (!reply) return ctx.reply('Tidak ditemukan hasil.');

  return ctx.reply(reply, { parse_mode: 'Markdown' });
});

  // Tampilkan harga langsung via !c <coinId>
  bot.hears(/^!c\s+(.+)/i, async (ctx) => {
    const coinId = ctx.match[1].trim();
    return handleSymbolCommand(ctx, coinId);
  });
};
