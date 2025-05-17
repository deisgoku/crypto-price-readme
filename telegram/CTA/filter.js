const fetch = require('node-fetch');
const { redis } = require('../../lib/redis');
const { Markup } = require('telegraf');

// ===================== Utilitas =====================
function getFilterKey(chatId) {
  return `filter:${chatId}`;
}

function getBotFetchDataKey(coinId) {
  return `filter:botfetchdata:${coinId.toLowerCase()}`;
}

function getFilterButtonsCacheKey(chatId) {
  return `cache:filter_buttons:${chatId}`;
}

async function isPremium(userId) {
  return await redis.get(`tg:premium:${userId}`);
}

function centerText(text, width) {
  const spacer = '\u2007';
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return spacer.repeat(pad) + text;
}

// ===================== Fungsi Filter =====================
async function addFilter(chatId, userId, keyword, responseText) {
  const key = getFilterKey(chatId);
  const existing = await redis.hgetall(key) || {};
  const premium = await isPremium(userId);

  if (!premium && Object.keys(existing).length >= 5) {
    throw new Error('Batas 5 filter tercapai. Upgrade ke premium untuk lebih banyak.');
  }

  await redis.hset(key, { [keyword.toLowerCase()]: responseText });
  await clearFilterButtonsCache(chatId);
}

async function removeFilter(chatId, keyword) {
  await redis.hdel(getFilterKey(chatId), keyword.toLowerCase());
  await clearFilterButtonsCache(chatId);
}

async function listFilters(chatId) {
  return await redis.hgetall(getFilterKey(chatId)) || {};
}

// ===================== Cache Tombol Filter =====================
// Fungsi buat generate tombol hapus filter
function generateDeleteButtons(filters) {
  return Object.keys(filters).map(k =>
    Markup.button.callback(`❌ ${k}`, `confirm_del_${k}`)
  );
}

// Fungsi buat generate tombol lihat filter (tanpa hapus)
function generateViewButtons(filters) {
  return Object.keys(filters).map(k =>
    Markup.button.callback(`🔹 ${k}`, `filter_${k}`) 
  );
}

// Fungsi menampilkan daftar filter dengan tombol hapus (menu hapus)
async function showFilterList(ctx) {
  const chatId = ctx.chat.id;
  const filters = await listFilters(chatId);
  const keywords = Object.keys(filters || {});
  const hasFilters = keywords.length > 0;

  const list = hasFilters
    ? keywords.map(k => `- \`${k}\``).join('\n')
    : '_Belum ada filter_';

  let buttons = hasFilters ? generateDeleteButtons(filters).map(b => [b]) : [];
  buttons.push([Markup.button.callback('⬅️ Kembali', 'filter_menu')]);

  await ctx.editMessageText(`🧾 *Pilih filter yang ingin di hapus:*\n${list}`, {
    parse_mode: 'Markdown',
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup
  });
}

// Fungsi menampilkan daftar filter hanya untuk lihat (tanpa hapus)
async function showFilterView(ctx) {
  const chatId = ctx.chat.id;
  const filters = await listFilters(chatId);
  const keywords = Object.keys(filters || {});
  const hasFilters = keywords.length > 0;

  const list = hasFilters
    ? keywords.map(k => `- \`${k}\``).join('\n')
    : '_Belum ada filter_';

  let buttons = hasFilters ? generateViewButtons(filters).map(b => [b]) : [];
  buttons.push([Markup.button.callback('⬅️ Kembali', 'filter_menu')]);

  await ctx.editMessageText(`🧾 *Filter Aktif:*\n${list}`, {
    parse_mode: 'Markdown',
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup
  });
}

// Cache tombol hapus filter (dipakai di showFilterList)
async function clearFilterButtonsCache(chatId) {
  await redis.del(getFilterButtonsCacheKey(chatId));
}

async function getFilterButtons(chatId) {
  const cacheKey = getFilterButtonsCacheKey(chatId);
  let buttonsJSON = await redis.get(cacheKey);

  if (buttonsJSON) {
    try {
      return JSON.parse(buttonsJSON);
    } catch {
      // Kalau gagal parse, generate fresh
    }
  }

  const filters = await listFilters(chatId);
  const buttons = generateDeleteButtons(filters);

  // Cache tombol selama 5 menit
  await redis.set(cacheKey, JSON.stringify(buttons), 'EX', 300);

  return buttons;
}

// ===================== Cache Data Coin (optional caching example) =====================
async function cacheGetCoinData(coinId) {
  const key = getBotFetchDataKey(coinId);
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  return null;
}

async function cacheSetCoinData(coinId, data, ttlSeconds = 60) {
  const key = getBotFetchDataKey(coinId);
  await redis.set(key, JSON.stringify(data), { EX: ttlSeconds });
}

// ===================== Handler Command Coin =====================
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

// ===================== Handler Filter Message =====================
async function handleFilterMessage(ctx) {
  const textRaw = ctx.message?.text;
  if (!textRaw || textRaw.startsWith('/')) return;

  const filters = await listFilters(ctx.chat.id);

  for (const keyword in filters) {
    const full = filters[keyword];
    if (typeof full !== 'string') continue;
    if (!textRaw.toLowerCase().includes(keyword.toLowerCase())) continue;

    const trimmed = full.trim();

    if (trimmed.startsWith('!c ')) {
      const coinId = trimmed.slice(3).trim();
      return handleSymbolCommand(ctx, coinId);
    }

    const linkRegex = /([^]+)(https?:\/\/[^\s)]+)/g;
    const buttons = [];
    let match;
    while ((match = linkRegex.exec(trimmed)) !== null) {
      buttons.push(Markup.button.url(match[1], match[2]));
    }

    const cleanText = trimmed.replace(linkRegex, '$1');
    const isMono = cleanText.startsWith('```') || cleanText.startsWith('`');

    return ctx.reply(cleanText, {
      parse_mode: isMono ? undefined : 'Markdown',
      reply_markup: buttons.length
        ? Markup.inlineKeyboard(buttons.map(b => [b])).reply_markup
        : undefined
    });
  }
}

// ===================== Register ke Bot =====================
module.exports = bot => {

  // Menu utama filter
  bot.action('filter_menu', async ctx => {
    await ctx.editMessageText('🧰 *Kelola Filter Chat*', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('➕ Tambah Filter', 'check_limit_before_add')],
        [Markup.button.callback('🗑️ Hapus Filter', 'filter_remove')],
        [Markup.button.callback('📃 Lihat Filter', 'lihat_filters')],
        [Markup.button.callback('⬅️ Kembali ke Menu', 'menu')]
      ])
    });
  });

  // Cek limit filter sebelum menambahkan
  bot.action('check_limit_before_add', async ctx => {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const existing = await redis.hgetall(getFilterKey(chatId));
    const premium = await isPremium(userId);

    if (!premium && Object.keys(existing).length >= 5) {
      return ctx.answerCbQuery('Batas 5 filter tercapai.', { show_alert: true });
    }

    return ctx.answerCbQuery('Silakan kirim /filter <kata> <respon>', { show_alert: true });
  });





// Action untuk buka menu hapus filter
bot.action('filter_remove', async ctx => {
  ctx.answerCbQuery('Memuat...').catch(() => {});
  await showFilterList(ctx);
});


// Action untuk konfirmasi hapus filter
bot.action(/confirm_del_(.+)/, async ctx => {
  ctx.answerCbQuery().catch(() => {}); 

  const keyword = ctx.match[1];
  const confirmMarkup = Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Ya', `del_filter_${keyword}`),
      Markup.button.callback('❌ Tidak', 'filter_remove')
    ]
  ]);

  await ctx.editMessageText(`❓ *Yakin hapus filter:* \`${keyword}\`?`, {
    parse_mode: 'Markdown',
    reply_markup: confirmMarkup.reply_markup
  });
});


// Action eksekusi hapus filter
bot.action(/del_filter_(.+)/, async ctx => {
  const keyword = ctx.match[1];
  const chatId = ctx.chat.id;

  await removeFilter(chatId, keyword);
  await clearFilterButtonsCache(chatId);
  await ctx.answerCbQuery(`Filter '${keyword}' dihapus.`);

  // Tampilkan ulang daftar filter setelah hapus
  await showFilterList(ctx);
});




// Action lihat filter (tanpa hapus)
bot.action('lihat_filters', async ctx => {
  ctx.answerCbQuery('Memuat...').catch(() => {});
  await showFilterView(ctx);
});

// Action noop untuk tombol filter yang hanya tampilan
bot.action(/filter_(.+)/, async ctx => {
  try {
    const data = ctx.callbackQuery.data;
    const keyword = data.slice(5); 

    await ctx.answerCbQuery(`Filter '${keyword}' masih aktif`, {
      show_alert: true
    });
  } catch (e) {
    console.error('Error di noop:', e);
    await ctx.answerCbQuery('Masih aktif');
  }
});

// ======= command inline ======

  // Perintah /filter
  bot.command('filter', async ctx => {
    try {
      const text = ctx.message?.text;
      if (!text) return ctx.reply('Perintah tidak valid.');

      const [cmd, keyword, ...resArr] = text.trim().split(' ');
      const response = resArr.join(' ');

      if (!keyword || !response) return ctx.reply('Format: /filter <kata> <respon>');

      await addFilter(ctx.chat.id, ctx.from.id, keyword, response);
      ctx.reply(`Filter *${keyword}* disimpan.`, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Error /filter:', err);
      ctx.reply(`⚠️ ${err.message}`);
    }
  });

  // Perintah /unfilter
  bot.command('unfilter', async ctx => {
    const keyword = ctx.message.text.split(' ')[1];
    if (!keyword) return ctx.reply('Gunakan: /unfilter <kata>');
    await removeFilter(ctx.chat.id, keyword);
    ctx.reply(`Filter *${keyword}* dihapus.`, { parse_mode: 'Markdown' });
  });

  // Handler teks biasa
  bot.on('text', handleFilterMessage);
};
