const fetch = require('node-fetch');
const { redis } = require('../../lib/redis');
const { Markup } = require('telegraf');
const {
  replacePlaceholders,
  parseInlineButtons,
  removeButtonMarkup,
  getQuote
} = require('./format');





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
  const isPremium = await redis.hget('tg:premium', userId);
  const isAdmin = await redis.hget('tg:admin', userId);
  return Boolean(isPremium || isAdmin);
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

  if (!cached) return null;

  try {
    if (typeof cached === 'string') {
      return JSON.parse(cached);
    } else {
      // Jika bukan string, kemungkinan kesalahan set cache sebelumnya
      console.warn(`Cache bukan string untuk ${coinId}, hapus cache.`);
      await redis.del(key);
      return null;
    }
  } catch (err) {
    console.error(`Gagal parse JSON cache untuk ${coinId}:`, err);
    await redis.del(key); // hapus cache rusak
    return null;
  }
}

async function cacheSetCoinData(coinId, data, ttlSeconds = 60) {
  const key = getBotFetchDataKey(coinId);
  await redis.set(key, JSON.stringify(data), { EX: ttlSeconds });
}

// ===================== Handler Command Coin =====================
async function handleSymbolCommand(ctx, coinId) {
  try {
    let dataCached = await cacheGetCoinData(coinId);

    if (!dataCached) {
      const url = `https://crypto-price-on.vercel.app/api/data?coin=${coinId}`;
      const res = await fetch(url);
      const json = await res.json();

      if (!json.data || !json.data.length) {
        return ctx.reply(
          `☹️ Data ${coinId} tidak ditemukan.\n\nCoba cek lagi ID-nya pakai /c ${coinId}, kali typo.`
        );
      }

      dataCached = json.data[0];
      await cacheSetCoinData(coinId, dataCached, 60);
    }

    const result = dataCached;

    // Tambahkan emoji tren
    const trendValue = result.trend?.replace('%', '') || '0';
    const trendNum = parseFloat(trendValue);
    let trendEmoji = '';

    if (!isNaN(trendNum)) {
      trendEmoji = trendNum > 0 ? '🚀' : trendNum < 0 ? '🔻' : '➖';
    }

    const data = {
      HARGA: result.price,
      VOLUME: result.volume,
      TREND: `${trendEmoji} ${result.trend}`,
    };

    // Fix bagian judul
    let msg = `📊 Market ${result.symbol?.toUpperCase()}`;
    if (result.name) msg += ` (${result.name})`;
    msg += `\n\n`;

    // Tampilkan semua contract address dari blockchain_sites
    if (
      result.contract_address &&
      typeof result.contract_address === 'object' &&
      Array.isArray(result.blockchain_sites)
    ) {
      const links = [];

      for (const [chain, address] of Object.entries(result.contract_address)) {
        const match = result.blockchain_sites.find(url => url.includes(address));
        if (match) {
          links.push(`• [${chain.toUpperCase()}](${match})`);
        }
      }

      if (links.length) {
        msg += `🔗 Contract Address:\n${links.join('\n')}\n\n`;
      }
    }

    // Tampilkan sosial media jika ada
    if (result.social && typeof result.social === 'object') {
      const socialLinks = Object.values(result.social).filter(
        url => typeof url === 'string' && url.startsWith('http')
      );

      if (socialLinks.length) {
        msg += `🌐 Sosial Media:\n`;
        const socialLines = socialLinks.map(url => {
          let name = 'Link';
          try {
            const u = new URL(url);
            const hostname = u.hostname.replace(/^www\./, '').split('.')[0];
            name = hostname.charAt(0).toUpperCase() + hostname.slice(1);
          } catch {
            // pakai default "Link"
          }
          return `• [${name}](${url})`;
        });
        msg += socialLines.join('\n') + '\n\n';
      }
    }

    // Format output dengan border dan rata kiri/kanan
    const labelMax = Math.max(...Object.keys(data).map(k => k.length));
    const valueMax = Math.max(...Object.values(data).map(v => v.length));
    const totalLen = Math.max(30, labelMax + 3 + valueMax);
    const year = new Date().getFullYear();
    const creditText = `${year} © Crypto Market Card`;
    const creditLink = `[${creditText}](https://t.me/crypto_market_card_bot/gcmc)`;

    msg += '```\n' + '━'.repeat(totalLen) + '\n';
    for (const [label, value] of Object.entries(data)) {
      msg += `${label.padEnd(labelMax)}    : ${value.padStart(valueMax)}\n\n`;
    }
    msg += '━'.repeat(totalLen) + '\n';
    msg += '```\n\n';

    msg += centerText(creditText, totalLen).replace(creditText, creditLink);

    return ctx.reply(msg, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
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
      if (coinId) {
        return handleSymbolCommand(ctx, coinId);
      } else {
        return ctx.reply('Format filter command !c tidak valid.');
      }
    }

    const isPremium = true;
    const isAdmin = false;
    const finalText = replacePlaceholders(trimmed, ctx, { isPremium, isAdmin });
    const reply_markup = parseInlineButtons(finalText);
    const textOnly = removeButtonMarkup(finalText);
    const quote = getQuote(ctx);
    const isMono = textOnly.startsWith('```') || textOnly.startsWith('`');

    return ctx.reply(
      [quote, textOnly].filter(Boolean).join('\n\n'),
      {
        parse_mode: isMono ? undefined : 'Markdown',
        reply_markup,
        reply_to_message_id: ctx.message.message_id
      }
    );
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
    const keyword = data.slice(7); 

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
  const text = ctx.message?.text;
  if (!text) return ctx.reply('Perintah tidak valid.');

  const [cmd, keyword, ...resArr] = text.trim().split(' ');
  const response = resArr.join(' ');

  if (!keyword || !response) return ctx.reply('Format: /filter <kata> <respon>');

  // Kirim respons dulu supaya pengguna gak nunggu lama
  ctx.reply(`Sedang menyimpan filter *${keyword}*...`, { parse_mode: 'Markdown' });

  try {
    await addFilter(ctx.chat.id, ctx.from.id, keyword, response);
    // Kalau perlu, update pesan sebelumnya atau beri konfirmasi lain
    ctx.reply(`Filter *${keyword}* berhasil disimpan.`, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Error saat addFilter:', err);
    ctx.reply(`⚠️ Gagal menyimpan filter: ${err.message}`);
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
