const { handleSymbolCommand } = require('./handlercoin');
const { redis } = require('../../lib/redis');
const { Markup } = require('telegraf');

// Key filter Redis per chat
function getFilterKey(chatId) {
  return `filter:${chatId}`;
}

// Cek premium user (tetap pakai userId)
async function isPremium(userId) {
  return await redis.get(`tg:premium:${userId}`);
}

// Tambah filter dengan batas 5 untuk non premium
async function addFilter(chatId, userId, keyword, responseText) {
  const key = getFilterKey(chatId);
  const existing = await redis.hgetall(key) || {};
  const premium = await isPremium(userId);

  if (!premium && Object.keys(existing).length >= 5) {
    throw new Error('Batas 5 filter tercapai. Upgrade ke premium untuk lebih banyak.');
  }

  await redis.hset(key, keyword.toLowerCase(), responseText);
}

// Hapus filter berdasarkan keyword
async function removeFilter(chatId, keyword) {
  await redis.hdel(getFilterKey(chatId), keyword.toLowerCase());
}

// Ambil semua filter untuk chat
async function listFilters(chatId) {
  return (await redis.hgetall(getFilterKey(chatId))) || {};
}

// Handle pesan masuk dan cek apakah mengandung keyword filter
async function handleFilterMessage(ctx) {
  try {
    const text = ctx.message?.text?.toLowerCase();
    if (!text || text.startsWith('/')) return;

    const chatId = ctx.chat.id;
    const filters = await listFilters(chatId);

    for (const keyword in filters) {
      if (text.includes(keyword)) {
        const value = filters[keyword];
        if (value.trim().startsWith('!c ')) {
          const coinId = value.trim().slice(3).trim();
          return handleSymbolCommand(ctx, coinId);
        }

        const isMono = value.trim().startsWith('```') || value.trim().startsWith('`');
        const options = {};
        if (!isMono) options.parse_mode = 'Markdown';

        return ctx.reply(value, options);
      }
    }
  } catch (err) {
    console.error('[Filter Message Error]', err.message);
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
      const chatId = ctx.chat.id;
      const userId = ctx.from.id;
      const key = getFilterKey(chatId);
      const existing = await redis.hgetall(key) || {};
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
      const chatId = ctx.chat.id;
      const userId = ctx.from.id;
      const args = ctx.message.text.split(' ');
      const keyword = args[1];
      const response = args.slice(2).join(' ');

      if (!keyword || !response) {
        return ctx.reply(
          'Gunakan: /filter doge !c doge atau /filter buy [Beli](https://...)',
          { parse_mode: 'Markdown' }
        );
      }

      // Parsing tombol URL khusus jika ada
      const linkRegex = /([^]+)(https?:\/\/[^\s)]+)/g;
      const buttons = [];
      let match;

      while ((match = linkRegex.exec(response)) !== null) {
        buttons.push(Markup.button.url(match[1], match[2]));
      }

      const replyMarkup = buttons.length
        ? Markup.inlineKeyboard(buttons.map(btn => [btn])).reply_markup
        : null;

      // Simpan text tanpa markup khusus
      const cleanText = response.replace(linkRegex, '$1');

      await addFilter(chatId, userId, keyword, cleanText);

      // Hapus cache agar list update
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
      const chatId = ctx.chat.id;
      const cacheKey = `tg:${chatId}:filters_cmd`;
      let cached = await redis.get(cacheKey);
      if (cached) return ctx.reply(cached, { parse_mode: 'Markdown' });

      const filters = await listFilters(chatId);
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
