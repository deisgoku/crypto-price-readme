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
  const maxFilters = (await isPremium(userId)) ? 50 : 5;

  if (!filters[keyword] && Object.keys(filters).length >= maxFilters) {
    throw new Error(`Batas filter tercapai. Maksimal: ${maxFilters} filter.`);
  }

  const data = { text, markup };
  await redis.hset(getFilterKey(chatId), keyword, JSON.stringify(data));
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

  const filters = await redis.hgetall(getFilterKey(ctx.chat.id)) || {};

  for (const keyword in filters) {
    if (text.includes(keyword.toLowerCase())) {
      const data = JSON.parse(filters[keyword]);
      const trimmedText = data.text.trim();

      if (trimmedText.startsWith('!c ')) {
        const coinId = trimmedText.slice(3).trim();
        return handleSymbolCommand(ctx, coinId);
      }

      const options = {};
      const isMono = trimmedText.startsWith('```') || trimmedText.startsWith('`');
      if (!isMono) options.parse_mode = 'Markdown';

      if (data.markup) options.reply_markup = data.markup;

      return ctx.reply(trimmedText, options);
    }
  }
}

module.exports = bot => {
  bot.action('filter_menu', async ctx => {
    try {
      const cacheKey = `tg:${ctx.from.id}:filter_menu`;
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
      const filters = await redis.hgetall(getFilterKey(chatId)) || {};
      const premium = await isPremium(userId);
      const maxFilters = premium ? 50 : 5;

      if (!premium && Object.keys(filters).length >= maxFilters) {
        return ctx.answerCbQuery(
          `Batas ${maxFilters} filter tercapai. Upgrade ke premium untuk lebih banyak.`,
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

      // Parsing tombol URL (sesuai format)
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

      await addFilter(chatId, userId, keyword, cleanText, replyMarkup);

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
