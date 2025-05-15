const { handleSymbolCommand } = require('./handlercoin');
const { redis } = require('../../lib/redis');
const { Markup } = require('telegraf');

function getFilterKey(chatId) {
  return `filter:${chatId}`;
}

async function isPremium(userId) {
  return await redis.get(`tg:premium:${userId}`);
}

async function addFilter(chatId, userId, keyword, text) {
  const filters = await redis.hgetall(getFilterKey(chatId)) || {};
  const maxFilters = (await isPremium(userId)) ? 50 : 5;

  if (!filters[keyword] && Object.keys(filters).length >= maxFilters) {
    throw new Error(`Batas filter tercapai. Maksimal: ${maxFilters} filter.`);
  }

  await redis.hset(getFilterKey(chatId), keyword, text);
}

async function removeFilter(chatId, keyword) {
  await redis.hdel(getFilterKey(chatId), keyword);
}

async function listFilters(chatId) {
  return await redis.hgetall(getFilterKey(chatId)) || {};
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

      await addFilter(chatId, userId, keyword, response);

      await redis.del(`tg:${chatId}:lihat_filters`);
      await redis.del(`tg:${chatId}:filters_cmd`);

      ctx.reply(`Filter untuk *"${keyword}"* disimpan.`, {
        parse_mode: 'Markdown'
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

      const buttons = Markup.inlineKeyboard([
        [
          Markup.button.callback('➕ Tambah Filter', 'check_limit_before_add'),
          Markup.button.callback('🗑️ Hapus Filter', 'filter_remove')
        ],
        [Markup.button.callback('📃 Lihat Filter', 'lihat_filters')],
        [Markup.button.callback('⬅️ Kembali ke Menu', 'personal_menu')]
      ]);

      if (cached) {
        return ctx.reply(cached, {
          parse_mode: 'Markdown',
          ...buttons
        });
      }

      const filters = await listFilters(chatId);
      const keys = Object.keys(filters);
      if (!keys.length) return ctx.reply('Belum ada filter.');

      const list = keys.map(k => `- \`${k}\``).join('\n');
      const text = `Filter aktif:\n${list}`;
      await redis.setex(cacheKey, 300, text);

      ctx.reply(text, {
        parse_mode: 'Markdown',
        ...buttons
      });
    } catch (err) {
      console.error('[filters]', err.message);
    }
  });

  bot.action('lihat_filters', async ctx => {
    try {
      await ctx.answerCbQuery();
      const chatId = ctx.chat.id;
      const filters = await listFilters(chatId);
      const keys = Object.keys(filters);
      if (!keys.length) return ctx.reply('Belum ada filter.');

      const list = keys.map(k => `- \`${k}\``).join('\n');
      const text = `Filter aktif:\n${list}`;
      await redis.setex(`tg:${chatId}:lihat_filters`, 300, text);
      return ctx.reply(text, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[lihat_filters]', err.message);
    }
  });

  bot.on('text', handleFilterMessage);
};
