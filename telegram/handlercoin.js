// telegram/handlers.js
const fetch = require('node-fetch');

// --- Utility Functions ---

function escapeMarkdown(text) {
  return text.replace(/[*_`[\]]/g, '\\$&');
}

function wrapText(text, width) {
  const words = text.split(' ');
  const lines = [];
  let line = '';

  for (const word of words) {
    if ((line + word).length <= width) {
      line += (line ? ' ' : '') + word;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function centerText(text, width) {
  const spacer = '\u2007';
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return spacer.repeat(pad) + text;
}

// --- Symbol Search ---

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

async function searchCoinAndFormat(ctx, query) {
  try {
    const matches = await resolveSymbolToIds(query);
    if (!matches.length) return null;

    const spacer = '\u2007';
    const maxTotalWidth = 60;
    const maxNameLen = Math.min(Math.max(...matches.map(c => c.name.length), 10), 24);
    const maxIdLen = Math.min(Math.max(...matches.map(c => c.id.length), 6), 28);
    const gap = 2;
    const lineLen = 4 + maxNameLen + gap + maxIdLen;
    const totalLen = Math.min(lineLen, maxTotalWidth);
    const year = new Date().getFullYear();
    const creditText = `${year} © Crypto Market Card`;
    const creditLink = `[${creditText}](https://t.me/crypto_market_card_bot/gcmc)`;

    let reply = centerText(`🔎 Hasil Pencarian Coin`, totalLen) + '\n';
    reply += centerText(`Nama: ${query.toUpperCase()}`, totalLen) + '\n';
    reply += '```\n' + '-'.repeat(totalLen) + '\n';
    reply += ` #  ${centerText('NAMA', maxNameLen)}${spacer.repeat(gap)}${centerText('ID', maxIdLen)}\n`;
    reply += '-'.repeat(totalLen) + '\n';

    matches.slice(0, 10).forEach((coin, i) => {
      const nameLines = wrapText(coin.name, maxNameLen);
      const idLines = wrapText(coin.id, maxIdLen);
      const maxLines = Math.max(nameLines.length, idLines.length);

      for (let j = 0; j < maxLines; j++) {
        const number = j === 0 ? `${i + 1}.`.padStart(3) + ' ' : '    ';
        const name = (nameLines[j] || '').padEnd(maxNameLen);
        const id = idLines[j] || '';
        reply += `${number}${name}${spacer.repeat(gap)}${id}\n`;
      }
    });

    reply += '-'.repeat(totalLen) + '\n';
    reply += 'Gunakan ID untuk melihat harga\n';
    reply += 'Contoh: !c <id> | !c pepe-ai\n';
    reply += '-'.repeat(totalLen) + '\n';
    reply += '```\n' + centerText(creditText, totalLen).replace(creditText, creditLink);

    return ctx.reply(reply, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
  } catch (err) {
    console.error(err);
    return ctx.reply('Terjadi kesalahan saat mencari coin.');
  }
}

async function handleSymbolCommand(ctx, coinId) {
  try {
    const url = `https://crypto-price-on.vercel.app/api/data?coin=${coinId}`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json.data || !json.data.length) {
      return ctx.reply(`☹️ Data ${coinId} tidak ditemukan.\n\nCoba cek lagi ID-nya pakai /c ${coinId}, kali typo.`);
    }

    const result = json.data[0];
    const data = {
      HARGA: result.price,
      VOLUME: result.volume,
      TREND: result.trend,
    };

    const labelMax = Math.max(...Object.keys(data).map(k => k.length));
    const valueMax = Math.max(...Object.values(data).map(v => v.length));
    const totalLen = labelMax + 3 + valueMax;
    const year = new Date().getFullYear();
    const creditText = `${year} © Crypto Market Card`;
    const creditLink = `[${creditText}](https://t.me/crypto_market_card_bot/gcmc)`;

    let msg = `📊 Market ${result.symbol.toUpperCase()}\n`;
    msg += '```\n' + '-'.repeat(totalLen) + '\n';
    for (const [label, value] of Object.entries(data)) {
      msg += `${label.padEnd(labelMax)} : ${value.padStart(valueMax)}\n`;
    }
    msg += '-'.repeat(totalLen) + '\n```\n';
    msg += centerText(creditText, totalLen).replace(creditText, creditLink);

    return ctx.reply(msg, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
  } catch (e) {
    console.error(e);
    return ctx.reply(`☹️ Terjadi kesalahan saat mengambil data ${coinId}`);
  }
}

// --- Category Search ---

async function resolveCategories(category) {
  const res = await fetch('https://api.coingecko.com/api/v3/coins/categories/list');
  const categories = await res.json();
  const lower = category.toLowerCase();
  return categories.filter(c =>
    c.category_id.toLowerCase() === lower || c.name.toLowerCase().includes(lower)
  );
}

async function searchCategoryCommand(ctx, category) {
  try {
    const categories = await resolveCategories(category);
    if (!categories.length) {
      return ctx.reply('☹️Kategori yang elu mau tidak ditemukan.');
    }

    if (categories.length === 1) {
      return null;
    }

    const spacer = '\u2007';
    const totalLen = 60;
    const year = new Date().getFullYear();
    const creditText = `${year} © Crypto Market Card`;
    const creditLink = `[${creditText}](https://t.me/crypto_market_card_bot/gcmc)`;

    let reply = centerText(`🔎 Ditemukan ${categories.length} kategori`, totalLen) + '\n';
    reply += centerText(`dengan kata: ${category.toUpperCase()}`, totalLen) + '\n';
    reply += '```\n';

    categories.forEach((cat, i) => {
      reply += `${i + 1}. ${cat.name}\n`;
      reply += `   ID: ${cat.category_id}\n\n`;
    });

    reply += '```' + '\n';
    reply += centerText(creditText, totalLen).replace(creditText, creditLink);

    return ctx.reply(reply, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
  } catch (err) {
    console.error(err);
    return ctx.reply('☹️ Terjadi kesalahan saat mengambil data \n\nMungkin gua lelah kalo belum ngopi');
  }
}

async function handleCategoryCommand(ctx, categoryId, count = 5) {
  try {
    const url = `https://crypto-price-on.vercel.app/api/data?category=${categoryId}&count=${count}`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json.data || !json.data.length) {
      return ctx.reply('☹️Data tidak ditemukan dalam kategori yang elu mau,\n\ncoba cek lagi ID-nya dah bener belum.');
    }

    const spacer = '\u2007';
    const gap = 2;
    const nameMax = 8;
    const priceLen = Math.max(...json.data.map(c => c.price.length), 8);
    const volLen = 7;
    const trendLen = 5;
    const totalLen = nameMax + priceLen + volLen + trendLen + (gap * 3);
    const year = new Date().getFullYear();
    const creditText = `${year} © Crypto Market Card`;
    const creditLink = `[${creditText}](https://t.me/crypto_market_card_bot/gcmc)`;

    const maxCatLen = 24;
    const categoryShort = categoryId.length > maxCatLen
      ? categoryId.slice(0, maxCatLen - 3) + '...'
      : categoryId;

    let msg = centerText(`📊 Top (${json.data.length}) Populer Market`, totalLen) + '\n';
    msg += centerText(`Kategori: ${categoryShort.toUpperCase()}`, totalLen) + '\n';
    msg += '```\n' + '-'.repeat(totalLen) + '\n';
    msg += `${'NAMA'.padEnd(nameMax)}${spacer.repeat(gap)}${'HARGA'.padEnd(priceLen)}${spacer.repeat(gap)}${'VOL'.padStart(volLen)}${spacer.repeat(gap)}TREND\n`;
    msg += '-'.repeat(totalLen) + '\n';

    json.data.forEach((coin) => {
      const name = coin.symbol.slice(0, nameMax).padEnd(nameMax);
      const price = coin.price.padEnd(priceLen);
      const volume = coin.volume.padStart(volLen);
      const trend = coin.trend.padEnd(trendLen);
      msg += `${name}${spacer.repeat(gap)}${price}${spacer.repeat(gap)}${volume}${spacer.repeat(gap)}${trend}\n`;
    });

    msg += '-'.repeat(totalLen) + '\n```\n';
    msg += centerText(creditText, totalLen).replace(creditText, creditLink);

    return ctx.reply(msg, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
  } catch (e) {
    console.error(e);
    return ctx.reply('☹️ Terjadi kesalahan saat mengambil data market kategori');
  }
}

// --- Bot Command Handler ---

module.exports = bot => {
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

  bot.command('s', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    if (!query) return ctx.reply('Contoh:\n/s doge');
    await searchCoinAndFormat(ctx, query);
  });

  bot.hears(/^!c\s+(.+)/i, async (ctx) => {
    const coinId = ctx.match[1].trim();
    return handleSymbolCommand(ctx, coinId);
  });
};
