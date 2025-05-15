const fetch = require('node-fetch');
const { redis } = require('../../lib/redis');
const { Markup } = require('telegraf');

// Key filter per chat
function getFilterKey(chatId) {
  return `filter:${chatId}`;
}

async function isPremium(userId) {
  return await redis.get(`tg:premium:${userId}`);
}

// Tambah filter
async function addFilter(chatId, userId, keyword, responseText, replyMarkup) {
  const key = getFilterKey(chatId);
  const existing = await redis.hgetall(key);
  const premium = await isPremium(userId);

  if (!premium && Object.keys(existing).length >= 5) {
    throw new Error('Batas 5 filter tercapai. Upgrade ke premium untuk lebih banyak.');
  }

  const data = { text: responseText };
  if (replyMarkup) data.markup = replyMarkup;

  await redis.hset(key, { [keyword.toLowerCase()]: JSON.stringify(data) });
}

// Hapus filter
async function removeFilter(chatId, keyword) {
  await redis.hdel(getFilterKey(chatId), keyword.toLowerCase());
}

// Daftar semua filter
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
    const totalLen = labelMax + 3 + valueMax;
    const year = new Date().getFullYear();
    const creditText = `${year} © Crypto Market Card`;
    const creditLink = `[${creditText}](https://t.me/crypto_market_card_bot/gcmc)`;

    let msg = `📊 Market ${result.symbol.toUpperCase()}\n`;
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
  if (!textRaw) return;
  const text = textRaw.toLowerCase();
  if (text.startsWith('/')) return;

  const filters = await listFilters(ctx.chat.id);

  for (const keyword in filters) {
    if (text.includes(keyword.toLowerCase())) {
      const value = filters[keyword].trim();

      if (value.startsWith('!c ')) {
        const coinId = value.slice(3).trim();
        return handleSymbolCommand(ctx, coinId);
      }

      const isMono = value.startsWith('```') || value.startsWith('`');
      const options = {};
      if (!isMono) options.parse_mode = 'Markdown';

      return ctx.reply(value, options);
    }
  }
}

module.exports = bot => {
  bot.action('filter_menu', async ctx => {
    try {
      const cacheKey = `tg:${ctx.chat.id}:filter_menu`;
      let cached = await redis.get(cacheKey);
      if (!cached) {
        cached = '🧰 *Kelola Filter Chat*\n\nGunakan tombol berikut:';
        await redis.setex(cacheKey, 300, cached);
      }

      await ctx.answerCbQuery();
      return ctx.reply(cached, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('➕ Tambah Filter', 'check_limit_before_add'),
            Markup.button.callback('🗑️ Hapus Filter', 'filter_remove')
          ],
          [Markup.button.callback('📃 Lihat Filter', 'lihat_filters')],
          [Markup.button.callback('⬅️ Kembali ke Menu', 'personal_menu')]
        ])
      });
    } catch (err) {
      console.error('[filter_menu]', err.message);
    }
  });

  bot.action('check_limit_before_add', async ctx => {
    try {
      const userId = ctx.from.id;
      const chatId = ctx.chat.id;
      const key = getFilterKey(chatId);
      const existing = (await redis.hgetall(key)) || {};
      const premium = await isPremium(userId);

      if (!premium && Object.keys(existing).length >= 5) {
        return ctx.answerCbQuery(
          'Batas 5 filter tercapai. Upgrade ke premium untuk lebih banyak.',
          { show_alert: true }
        );
      }

      await ctx.answerCbQuery('Silakan kirim /filter <kata> <balasan>', { show_alert: true });
    } catch (err) {
      console.error('[check_limit_before_add]', err.message);
    }
  });

  bot.action('filter_remove', async ctx => {
    try {
      await ctx.answerCbQuery();
      await ctx.reply('Contoh: /unfilter doge', { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[filter_remove]', err.message);
    }
  });

  bot.action('lihat_filters', async ctx => {
    try {
      await ctx.answerCbQuery();
      const cacheKey = `tg:${ctx.chat.id}:lihat_filters`;
      let cached = await redis.get(cacheKey);
      if (cached) return ctx.reply(cached, { parse_mode: 'Markdown' });

      const filters = await listFilters(ctx.chat.id);
      const keys = Object.keys(filters);
      if (!keys.length) return ctx.reply('Belum ada filter.');

      const list = keys.map(k => `- \`${k}\``).join('\n');
      const text = `Filter aktif:\n${list}`;
      await redis.setex(cacheKey, 300, text);
      ctx.reply(text, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[lihat_filters]', err.message);
    }
  });

  bot.command('filter', async ctx => {
    try {
      const userId = ctx.from.id;
      const chatId = ctx.chat.id;
      const args = ctx.message.text.split(' ');
      const keyword = args[1];
      const response = args.slice(2).join(' ');

      if (!keyword || !response) {
        return ctx.reply(
          'Gunakan: /filter doge !c doge atau /filter buy [Beli](https://...)',
          { parse_mode: 'Markdown' }
        );
      }

      const linkRegex = /([^]+)(https?:\/\/[^\s)]+)/g;
      const buttons = [];
      let match;

      while ((match = linkRegex.exec(response)) !== null) {
        buttons.push(Markup.button.url(match[1], match[2]));
      }

      const replyMarkup = buttons.length
        ? Markup.inlineKeyboard(buttons.map(btn => [btn])).reply_markup
        : null;

      const cleanText = response.replace(linkRegex, '$1');

      await addFilter(chatId, userId, keyword, cleanText);

      await redis.del(`tg:${chatId}:lihat_filters`);
      await redis.del(`tg:${chatId}:filters_cmd`);

      ctx.reply(`Filter untuk *"${keyword}"* disimpan.`, {
        parse_mode: 'Markdown',
        reply_markup: replyMarkup
      });
    } catch (err) {
      ctx.reply(err.message);
    }
  });

  bot.command('unfilter', async ctx => {
    try {
      const chatId = ctx.chat.id;
      const keyword = ctx.message.text.split(' ')[1];
      if (!keyword) return ctx.reply('Gunakan: /unfilter <kata>');

      await removeFilter(chatId, keyword);
      await redis.del(`tg:${chatId}:lihat_filters`);
      await redis.del(`tg:${chatId}:filters_cmd`);

      ctx.reply(`Filter *"${keyword}"* dihapus.`, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[unfilter]', err.message);
    }
  });

  bot.command('filters', async ctx => {
    try {
      const cacheKey = `tg:${ctx.chat.id}:filters_cmd`;
      let cached = await redis.get(cacheKey);
      if (cached) return ctx.reply(cached, { parse_mode: 'Markdown' });

      const filters = await listFilters(ctx.chat.id);
      const keys = Object.keys(filters);
      if (!keys.length) return ctx.reply('Belum ada filter.');

      const list = keys.map(k => `- \`${k}\``).join('\n');
      const text = `Filter aktif:\n${list}`;
      await redis.setex(cacheKey, 300, text);
      ctx.reply(text, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[filters]', err.message);
    }
  });

  bot.on('text', handleFilterMessage);
};
