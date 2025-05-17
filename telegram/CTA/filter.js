const fetch = require('node-fetch');
const { redis } = require('../../lib/redis');
const { Markup } = require('telegraf');

function getFilterKey(chatId) {
  return `filter:${chatId}`;
}

async function isPremium(userId) {
  return await redis.get(`tg:premium:${userId}`);
}

async function addFilter(chatId, userId, keyword, responseText) {
  const key = getFilterKey(chatId);
  const existing = await redis.hgetall(key) || {};
  const premium = await isPremium(userId);

  if (!premium && Object.keys(existing).length >= 5) {
    throw new Error('Batas 5 filter tercapai. Upgrade ke premium untuk lebih banyak.');
  }

  await redis.hset(key, { [keyword.toLowerCase()]: responseText });
}

async function removeFilter(chatId, keyword) {
  await redis.hdel(getFilterKey(chatId), keyword.toLowerCase());
}

async function listFilters(chatId) {
  return await redis.hgetall(getFilterKey(chatId)) || {};
}

function centerText(text, width) {
  const spacer = '\u2007';
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return spacer.repeat(pad) + text;
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
    const totalLen = Math.max(30, labelMax + 3 + valueMax);
    const year = new Date().getFullYear();
    const creditText = `${year} © Crypto Market Card`;
    const creditLink = `[${creditText}](https://t.me/crypto_market_card_bot/gcmc)`;

    let msg = `📊 Market ${result.symbol.toUpperCase()}\n\n`;

    // Tambahkan CA kalau ada
    if (result.contract_address && typeof result.contract_address === 'object') {
      for (const [chain, address] of Object.entries(result.contract_address)) {
        msg += `CA ${chain.toUpperCase()} :\n\`${address}\`\n\n`;
      }
    }

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

module.exports = bot => {
  bot.action('filter_menu', async ctx => {
    await ctx.editMessageText('🧰 *Kelola Filter Chat*', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('➕ Tambah Filter', 'check_limit_before_add')],
        [Markup.button.callback('🗑️ Hapus Filter', 'filter_remove')],
        [Markup.button.callback('📃 Lihat Filter', 'lihat_filters')],
        [Markup.button.callback('⬅️ Kembali ke Menu', 'personal_menu')]
      ])
    });
  });

  bot.action('check_limit_before_add', async ctx => {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const existing = await redis.hgetall(getFilterKey(chatId));
    const premium = await isPremium(userId);

    if (!premium && Object.keys(existing).length >= 5) {
      return ctx.answerCbQuery('Batas 5 filter tercapai.', { show_alert: true });
    }
    ctx.answerCbQuery('Silakan kirim /filter <kata> <respon>', { show_alert: true });
  });

  bot.action('filter_remove', ctx => {
    ctx.answerCbQuery();
    ctx.reply('Contoh: /unfilter doge');
  });

  bot.action('lihat_filters', async ctx => {
    await ctx.answerCbQuery();
    const filters = await listFilters(ctx.chat.id);
    const list = Object.keys(filters).map(k => `- \`${k}\``).join('\n') || '_Belum ada filter_';

    await ctx.editMessageText(`🧾 *Filter Aktif:*\n${list}`, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Kembali', 'filter_menu')]
      ]).reply_markup
    });
  });

  bot.command('filter', async ctx => {
    try {
      if (!ctx.message || !ctx.message.text) {
        return ctx.reply('Perintah tidak valid.');
      }

      const [cmd, keyword, ...resArr] = ctx.message.text.split(' ');
      const response = resArr.join(' ');

      if (!keyword || !response) {
        return ctx.reply('Format: /filter <kata> <respon>');
      }

      await addFilter(ctx.chat.id, ctx.from.id, keyword, response);
      ctx.reply(`Filter *${keyword}* disimpan.`, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Error /filter:', err);
      ctx.reply(`⚠️ ${err.message}`);
    }
  });

  bot.command('unfilter', async ctx => {
    const keyword = ctx.message.text.split(' ')[1];
    if (!keyword) return ctx.reply('Gunakan: /unfilter <kata>');
    await removeFilter(ctx.chat.id, keyword);
    ctx.reply(`Filter *${keyword}* dihapus.`, { parse_mode: 'Markdown' });
  });

  bot.on('text', handleFilterMessage);
};
