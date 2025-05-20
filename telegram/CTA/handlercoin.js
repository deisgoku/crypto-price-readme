// telegram/CTA/handlercoin.js
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

    const maxNameLen = Math.min(Math.max(...matches.map(c => c.name.length), 10), 24);
    const maxIdLen = Math.min(Math.max(...matches.map(c => c.id.length), 6), 28);
    const gap = 2;
    const nomorWidth = 4; // e.g. "1.  "
    const contentWidth = nomorWidth + maxNameLen + gap + maxIdLen;
    const totalLen = contentWidth + 4; // +4 for box sides and spaces
    const year = new Date().getFullYear();
    const creditText = `${year} © Crypto Market Card`;
    const creditLink = `[${creditText}](https://t.me/crypto_market_card_bot/gcmc)`;

    const repeat = (char, len) => char.repeat(len);
    const horizontal = repeat('─', contentWidth + 2);
    const centerText = (text, width) => {
      if (text.length >= width) return text;
      const left = Math.floor((width - text.length) / 2);
      const right = width - text.length - left;
      return ' '.repeat(left) + text + ' '.repeat(right);
    };

    let reply = '';
    reply += `🔎 Hasil Pencarian Coin${' '.repeat(Math.max(1, totalLen - 30 - query.length))}Nama: ${query.toUpperCase()}\n`;
    reply += `┌${horizontal}┐\n`;
    reply += `│ #   ${'NAMA'.padEnd(maxNameLen)}${' '.repeat(gap)}${'ID'.padEnd(maxIdLen)} │\n`;
    reply += `├${repeat('─', contentWidth + 2)}┤\n`;

    matches.slice(0, 10).forEach((coin, i) => {
      const nomor = `${i + 1}.`.padEnd(nomorWidth);
      const nama = coin.name.padEnd(maxNameLen);
      const id = coin.id.padEnd(maxIdLen);
      reply += `│ ${nomor}${nama}${' '.repeat(gap)}${id} │\n`;
      reply += `│${' '.repeat(contentWidth + 2)}│\n`;
    });

    reply += `└${horizontal}┘\n`;
    reply += `Gunakan ID untuk melihat harga\n`;
    reply += `Contoh: !c <id> | !c pepe-ai\n`;
    reply += `${repeat('─', totalLen)}\n`;
    reply += `${centerText(creditLink, totalLen)}\n`;

    return ctx.reply(reply, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });
  } catch (err) {
    console.error(err);
    return ctx.reply('Terjadi kesalahan saat mencari coin.');
  }
}


async function handleSymbolCommand(ctx, coinId) {
  try {
    // Coba ambil dari cache dulu
    let dataCached = await cacheGetCoinData(coinId);
    if (!dataCached) {
      const url = `https://crypto-price-on.vercel.app/api/data?coin=${coinId}`;
      const res = await fetch(url);
      const json = await res.json();

      if (!json.data || !json.data.length) {
        return ctx.reply(`☹️ Data ${coinId} tidak ditemukan.\n\nCoba cek lagi ID-nya pakai /c ${coinId}, kali typo.`);
      }
      dataCached = json.data[0];
      await cacheSetCoinData(coinId, dataCached, 60); // cache 60 detik
    }

    const result = dataCached;
    const data = {
      HARGA: result.price,
      VOLUME: result.volume,
      TREND: result.trend,
    };

    // Explorer mapping
    const explorers = {
      ethereum: "https://etherscan.io/token/",
      "binance-smart-chain": "https://bscscan.com/token/",
      solana: "https://solscan.io/token/",
      sui: "https://suiexplorer.com/object/",
      base: "https://basescan.org/token/",
      avalanche: "https://snowtrace.io/token/",
      polygon: "https://polygonscan.com/token/",
      optimism: "https://optimistic.etherscan.io/token/"
    };

    let msg = `📊 Market ${result.symbol.toUpperCase()}\n\n`;

    if (result.contract_address && typeof result.contract_address === 'object') {
      const [chain, address] = Object.entries(result.contract_address)[0] || [];
      if (chain && address && explorers[chain]) {
        const encodedAddress = encodeURIComponent(address);
        const link = explorers[chain] + encodedAddress;
        msg += `[CA di ${chain.toUpperCase()}](${link})\n\n`;
      }
    }

    const labelMax = Math.max(...Object.keys(data).map(k => k.length));
    const valueMax = Math.max(...Object.values(data).map(v => v.length));
    const totalLen = Math.max(30, labelMax + 3 + valueMax);
    const year = new Date().getFullYear();
    const creditText = `${year} © Crypto Market Card`;
    const creditLink = `[${creditText}](https://t.me/crypto_market_card_bot/gcmc)`;

    msg += '```\n' + '━'.repeat(totalLen) + '\n';
    for (const [label, value] of Object.entries(data)) {
      msg += `${label.padEnd(labelMax)} : ${value.padStart(valueMax)}\n\n`;
    }
    msg += '━'.repeat(totalLen) + '\n```\n';
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

function centerText(text, width = 60) {
  if (text.length >= width) return text;
  const left = Math.floor((width - text.length) / 2);
  const right = width - text.length - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

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

    const totalLen = 60;
    const year = new Date().getFullYear();
    const creditText = `${year} © Crypto Market Card`;
    const creditLink = `[${creditText}](https://t.me/crypto_market_card_bot/gcmc)`;

    let reply = '';
    reply += centerText(`🔎 Ditemukan ${categories.length} kategori`, totalLen) + '\n';
    reply += centerText(`dengan kata: ${category.toUpperCase()}`, totalLen) + '\n';
    reply += '```\n';

    categories.forEach((cat, i) => {
      reply += `${i + 1}. ${cat.name}\n`;
      reply += `   ID: ${cat.category_id}\n\n`;
    });

    reply += '```' + '\n';
    reply += centerText(creditLink, totalLen);

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
      return ctx.reply('☹️ Data tidak ditemukan dalam kategori yang elu mau,\n\ncoba cek lagi ID-nya dah bener belum.');
    }

    const spacer = '\u2007'; // FIGURE SPACE
    const gap = 2;
    const nameMax = 8;
    const priceLen = Math.max(...json.data.map(c => c.price.length), 8);
    const volLen = 7;
    const trendLen = 6;
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

    // ┏━┓ ┣━┫ ┗━┛ ┃
    const boxTop = `┏${'━'.repeat(totalLen)}┓\n`;
    const boxHeader = `┃${'NAMA'.padEnd(nameMax)}${spacer.repeat(gap)}${'HARGA'.padEnd(priceLen)}${spacer.repeat(gap)}${'VOL'.padStart(volLen)}${spacer.repeat(gap)}TREND`.padEnd(totalLen) + `┃\n`;
    const boxDivider = `┣${'━'.repeat(totalLen)}┫\n`;
    const boxBottom = `┗${'━'.repeat(totalLen)}┛`;

    let boxContent = '';
    json.data.forEach((coin) => {
      const name = coin.symbol.slice(0, nameMax).padEnd(nameMax);
      const price = coin.price.padEnd(priceLen);
      const volume = coin.volume.padStart(volLen);
      const trend = coin.trend.padEnd(trendLen);
      const row = `${name}${spacer.repeat(gap)}${price}${spacer.repeat(gap)}${volume}${spacer.repeat(gap)}${trend}`;
      boxContent += `┃${row.padEnd(totalLen)}┃\n`;
      boxContent += `┃${' '.repeat(totalLen)}┃\n`;
    });

    msg += '```\n' + boxTop + boxHeader + boxDivider + boxContent + boxBottom + '\n```\n';
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
