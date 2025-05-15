const { handleSymbolCommand } = require('./handlercoin');
const { redis } = require('../../lib/redis');
const { Markup } = require('telegraf');

function getFilterKey(chatId) {
  return `filter:${chatId}`;
}

async function isPremium(userId) {
  return await redis.get(`tg:premium:${userId}`);
}

async function addFilter(chatId, userId, keyword, text, markup = null) {
  const filters = await redis.hgetall(getFilterKey(chatId)) || {};
  const max = (await isPremium(userId)) ? 50 : 5;

  if (!filters[keyword] && Object.keys(filters).length >= max) {
    throw new Error(`Batas filter tercapai. Maks: ${max}`);
  }

  await redis.hset(getFilterKey(chatId), keyword, JSON.stringify({ text, markup }));
  await redis.del(`tg:${chatId}:lihat_filters`);
  await redis.del(`tg:${chatId}:filters_cmd`);
}

async function removeFilter(chatId, keyword) {
  await redis.hdel(getFilterKey(chatId), keyword);
  await redis.del(`tg:${chatId}:lihat_filters`);
  await redis.del(`tg:${chatId}:filters_cmd`);
}

async function listFilters(chatId) {
  return await redis.hgetall(getFilterKey(chatId)) || {};
}

async function handleFilterMessage(ctx) {
  const textRaw = ctx.message?.text;
  if (!textRaw || textRaw.startsWith('/')) return;
  const filters = await listFilters(ctx.chat.id);

  for (const keyword in filters) {
    if (textRaw.toLowerCase().includes(keyword.toLowerCase())) {
      const { text, markup } = JSON.parse(filters[keyword]);
      const isMono = text.trim().startsWith('```') || text.trim().startsWith('`');

      if (text.trim().startsWith('!c ')) {
        const coinId = text.trim().slice(3).trim();
        return handleSymbolCommand(ctx, coinId);
      }

      return ctx.reply(text, {
        parse_mode: isMono ? undefined : 'Markdown',
        reply_markup: markup || undefined
      });
    }
  }
}

module.exports = bot => {
  bot.action('filter_menu', async ctx => {
    try {
      await ctx.answerCbQuery();
      const msg = '🧰 *Kelola Filter Chat*\n\nGunakan tombol berikut:';
      await ctx.reply(msg, {
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
      const filters = await listFilters(ctx.chat.id);
      const max = (await isPremium(ctx.from.id)) ? 50 : 5;
      if (Object.keys(filters).length >= max) {
        return ctx.answerCbQuery(`Batas ${max} filter tercapai.`, { show_alert: true });
      }
      return ctx.answerCbQuery('Kirim: /filter <kata> <balasan>', { show_alert: true });
    } catch (err) {
      console.error('[check_limit_before_add]', err.message);
    }
  });

  bot.action('filter_remove', async ctx => {
    await ctx.answerCbQuery();
    await ctx.reply('Contoh: /unfilter doge');
  });

  bot.action('lihat_filters', async ctx => {
    try {
      await ctx.answerCbQuery();
      const cacheKey = `tg:${ctx.chat.id}:lihat_filters`;
      let cached = await redis.get(cacheKey);
      if (cached) return ctx.reply(cached, { parse_mode: 'Markdown' });

      const filters = await listFilters(ctx.chat.id);
      if (!Object.keys(filters).length) return ctx.reply('Belum ada filter.');

      const text = 'Filter aktif:\n' + Object.keys(filters).map(k => `- \`${k}\``).join('\n');
      await redis.setex(cacheKey, 300, text);
      ctx.reply(text, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[lihat_filters]', err.message);
    }
  });

  bot.command('filter', async ctx => {
    try {
      const [cmd, keyword, ...resParts] = ctx.message.text.split(' ');
      const response = resParts.join(' ');
      if (!keyword || !response) {
        return ctx.reply('Gunakan: /filter doge !c doge atau /filter beli [Link](https://...)', {
          parse_mode: 'Markdown'
        });
      }

      const btnRegex = /\|\|([^|]+)\|\|([^\s)]+)/g;
      const buttons = [];
      let match;
      while ((match = btnRegex.exec(response)) !== null) {
        buttons.push(Markup.button.url(match[1], match[2]));
      }
      const replyMarkup = buttons.length ? Markup.inlineKeyboard(buttons.map(btn => [btn])).reply_markup : null;
      const cleanText = response.replace(btnRegex, '$1');

      await addFilter(ctx.chat.id, ctx.from.id, keyword, cleanText, replyMarkup);

      ctx.reply(`Filter *"${keyword}"* disimpan.`, {
        parse_mode: 'Markdown',
        reply_markup: replyMarkup
      });
    } catch (err) {
      ctx.reply(err.message);
    }
  });

  bot.command('unfilter', async ctx => {
    try {
      const keyword = ctx.message.text.split(' ')[1];
      if (!keyword) return ctx.reply('Gunakan: /unfilter <kata>');
      await removeFilter(ctx.chat.id, keyword);
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
      if (!Object.keys(filters).length) return ctx.reply('Belum ada filter.');

      const text = 'Filter aktif:\n' + Object.keys(filters).map(k => `- \`${k}\``).join('\n');
      await redis.setex(cacheKey, 300, text);
      ctx.reply(text, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[filters]', err.message);
    }
  });

  bot.on('text', handleFilterMessage);
};
