const fetch = require('node-fetch');

// Helper: Bungkus teks agar tidak melewati batas lebar
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

// Escape karakter Markdown
function escapeMarkdown(text) {
  return text.replace(/[*_`[\]]/g, '\\$&');
}

// --- SYMBOL RESOLVER (/s)
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

  return [...exactMatches, ...partialMatches].slice(0, 20);
}

async function handleSymbolSearch(ctx) {
  try {
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    if (!query) return ctx.reply('Untuk mencari ID coin , Gunakan /s <nama coin> \nnContoh:\n/s doge');

    const matches = await resolveSymbolToIds(query);
    if (!matches.length) return ctx.reply('Tidak ditemukan hasil.');

    const spacer = '\u2007';
    const centerText = (text, width) => {
      const pad = Math.floor((width - text.length) / 2);
      return spacer.repeat(pad) + text;
    };

    const maxNameLen = Math.min(25, Math.max(...matches.map(c => c.name.length), 4));
    const maxIdLen = Math.min(25, Math.max(...matches.map(c => c.id.length), 2));
    const lineWidth = 5 + maxNameLen + maxIdLen;
    const totalLen = lineWidth;
    const year = new Date().getFullYear();

    let reply = `🔎 Hasil pencarian coin berdasarkan nama *${query.toUpperCase()}*\n`;
    reply += '```\n' + '-'.repeat(lineWidth) + '\n';
    reply += `${'#'.padEnd(4)}${'NAMA'.padEnd(maxNameLen)}${'ID'}\n`;
    reply += '-'.repeat(lineWidth) + '\n';

    matches.slice(0, 10).forEach((coin, i) => {
      const nameLines = wrapText(coin.name, maxNameLen);
      const idLines = wrapText(coin.id, maxIdLen);
      const maxLines = Math.max(nameLines.length, idLines.length);

      for (let j = 0; j < maxLines; j++) {
        const number = j === 0 ? `${i + 1}.`.padEnd(4) : ' '.repeat(4);
        const name = (nameLines[j] || '').padEnd(maxNameLen);
        const id = idLines[j] || '';
        reply += `${number}${name}${id}\n`;
      }
    });

    reply += '-'.repeat(lineWidth) + '\n';
    reply += 'Gunakan ID untuk menampilkan harga\n';
    reply += 'Contoh: !c <id coin> | !c pepe-ai\n';
    reply += '-'.repeat(lineWidth) + '\n';
    reply += '```\n';
    reply += centerText(`[${year} © Crypto Market Card](https://t.me/crypto_market_card_bot/gcmc)`, totalLen);

    return ctx.reply(reply, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });

  } catch (err) {
    console.error(err);
    return ctx.reply('Terjadi kesalahan saat mencari coin.');
  }
}

// --- SYMBOL COMMAND (!c)
async function handleSymbolCommand(ctx, coinId) {
  try {
    const url = `https://crypto-price-on.vercel.app/api/data?coin=${coinId}`;
    const res = await fetch(url);
    const json = await res.json();

    const result = json.data?.[0];
    if (!result) return ctx.reply('☹️ Data tidak ditemukan.');

    const spacer = '\u2007';
    const centerText = (text, width) => {
      const pad = Math.floor((width - text.length) / 2);
      return spacer.repeat(pad) + text;
    };

    const data = {
      HARGA: result.price,
      VOLUME: result.volume,
      TREND: result.trend,
    };

    const labelMax = Math.max(...Object.keys(data).map(k => k.length));
    const valueMax = Math.max(...Object.values(data).map(v => v.length));
    const totalLen = labelMax + 3 + valueMax;
    const year = new Date().getFullYear();

    let msg = `📊 Market ${result.symbol.toUpperCase()}\n`;
    msg += '```\n' + '-'.repeat(totalLen) + '\n';

    for (const [label, value] of Object.entries(data)) {
      msg += `${label.padEnd(labelMax)} : ${value.padStart(valueMax)}\n`;
    }

    msg += '-'.repeat(totalLen) + '\n```\n';
    msg += centerText(`[${year} © Crypto Market Card](https://t.me/crypto_market_card_bot/gcmc)`, totalLen);

    return ctx.reply(msg, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });

  } catch (err) {
    console.error(err);
    return ctx.reply('☹️ Terjadi kesalahan saat mengambil data.');
  }
}

// --- CATEGORY RESOLVER (/c)
async function handleCategoryListing(ctx, keyword) {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/categories/list');
    const categories = await res.json();
    const lower = keyword.toLowerCase();

    const results = categories.filter(c =>
      c.category_id.toLowerCase().includes(lower) ||
      c.name.toLowerCase().includes(lower)
    );

    if (!results.length) {
      return ctx.reply('☹️Kategori tidak ditemukan.');
    }

    // Kalau cuma satu hasil, langsung tampilkan
    if (results.length === 1) {
      return handleCategoryCommand(ctx, results[0].category_id);
    }

    // Tampilkan list kategori kalau hasilnya lebih dari satu
    const spacer = '\u2007';
    const centerText = (text, width) => {
      const pad = Math.floor((width - text.length) / 2);
      return spacer.repeat(pad) + text;
    };

    const maxNameLen = Math.max(...results.map(c => c.name.length), 20);
    const maxIdLen = Math.max(...results.map(c => c.category_id.length), 20);
    const lineLen = 6 + maxNameLen + 2 + maxIdLen;
    const totalLen = lineLen;
    const year = new Date().getFullYear();

    let reply = `🔎 Ditemukan beberapa kategori dengan kata *${keyword.toUpperCase()}*:\n`;
    reply += '```\n' + '-'.repeat(lineLen) + '\n';
    reply += 'NAMA'.padEnd(maxNameLen) + '  ID\n' + '-'.repeat(lineLen) + '\n';

    results.forEach((cat, i) => {
      const nameLines = wrapText(cat.name, maxNameLen);
      const idLines = wrapText(cat.category_id, maxIdLen);
      const maxLines = Math.max(nameLines.length, idLines.length);

      for (let j = 0; j < maxLines; j++) {
        const num = j === 0 ? `${(i + 1)}.`.padStart(3) + ' ' : '    ';
        const name = (nameLines[j] || '').padEnd(maxNameLen);
        const id = idLines[j] || '';
        reply += `${num}${name}  ${id}\n`;
      }
    });

    reply += '-'.repeat(lineLen) + '\n```\n';
    reply += centerText(`[${year} © Crypto Market Card](https://t.me/crypto_market_card_bot/gcmc)`, totalLen);

    return ctx.reply(reply, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });

  } catch (err) {
    console.error(err);
    return ctx.reply('Terjadi kesalahan saat mencari kategori.');
  }
}

// --- CATEGORY DATA (!cat)
async function handleCategoryCommand(ctx, category, count = 5) {
  try {
    const url = `https://crypto-price-on.vercel.app/api/data?category=${category}&count=${count}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json.data || !json.data.length) return ctx.reply('☹️Data tidak ditemukan dalam kategori tersebut.');

    const spacer = '\u2007';
    const centerText = (text, width) => {
      const pad = Math.floor((width - text.length) / 2);
      return spacer.repeat(pad) + text;
    };

    const nameMax = 15;
    const priceLen = Math.max(...json.data.map(c => c.price.length), 5);
    const volLen = 10;
    const trendLen = 6;
    const year = new Date().getFullYear();

    const totalLen = nameMax + priceLen + volLen + trendLen + (4 * 3);

    let msg = centerText(`📊 Top (${json.data.length}) Populer Market`, totalLen) + '\n';
    msg += centerText(`Kategori: ${category.toUpperCase()}`, totalLen) + '\n';
    msg += '```\n' + '-'.repeat(totalLen) + '\n';

    msg += (
      `${'NAMA'.padEnd(nameMax)}${spacer.repeat(4)}` +
      `${'HARGA'.padEnd(priceLen)}${spacer.repeat(4)}` +
      `${'VOL'.padStart(volLen)}${spacer.repeat(4)}` +
      `TREND\n`
    );

    msg += '-'.repeat(totalLen) + '\n';

    json.data.forEach((coin) => {
      const nameLines = wrapText(coin.symbol, nameMax);
      const price = coin.price.padEnd(priceLen);
      const volume = coin.volume.padStart(volLen);
      const trend = coin.trend.padEnd(trendLen);

      nameLines.forEach((line, i) => {
        const name = line.padEnd(nameMax);
        const prefix = i === 0 ? '' : spacer.repeat(3);
        const row = i === 0
          ? `${name}${spacer.repeat(4)}${price}${spacer.repeat(4)}${volume}${spacer.repeat(4)}${trend}`
          : `${prefix}${name}`;
        msg += row + '\n';
      });
    });

    msg += '-'.repeat(totalLen) + '\n```\n';
    msg += centerText(`[${year} © Crypto Market Card](https://t.me/crypto_market_card_bot/gcmc)`, totalLen);

    return ctx.reply(msg, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });

  } catch (err) {
    console.error(err);
    return ctx.reply('Terjadi kesalahan saat mengambil data kategori.');
  }
}

// === EXPORT HANDLERS ===
module.exports = (bot) => {
	
  bot.command('c', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (!args.length) {
    return ctx.reply('Untuk mencari ID kategori:\n\nGunakan: /c <nama kategori>');
  }

  return handleCategoryListing(ctx, args.join(' '));
});

  bot.hears(/^!c\s+(.+)/i, (ctx) => {
    const coinId = ctx.match[1].trim();
    return handleSymbolCommand(ctx, coinId);
  });

  bot.command('c', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (!args.length) return ctx.reply('Untuk mencari ID cateory \n\nGunakan: /c <kategori>');
    return handleCategoryListing(ctx, args.join(' '));
  });

  bot.hears(/^!cat\s+(\S+)\s+(\d+)/i, (ctx) => {
    const [, category, count] = ctx.match;
    return handleCategoryCommand(ctx, category, count);
  });
};
