// telegram/CTA/filter.js


const { handleSymbolCommand } = require('./handlercoin');
const { redis } = require('../../lib/redis');
const { Markup } = require('telegraf');

function getFilterKey(userId) {
  return `filters:${userId}`;
}

async function isPremium(userId) {
  return await redis.get(`tg:premium:${userId}`);
}

async function addFilter(userId, keyword, responseText) {
  const key = getFilterKey(userId);
  const existing = await redis.hgetall(key);
  const premium = await isPremium(userId);

  if (!premium && Object.keys(existing).length >= 5) {
    throw new Error('Batas 5 filter tercapai. Upgrade ke premium untuk lebih banyak.');
  }

  await redis.hset(key, keyword.toLowerCase(), responseText);
}

async function removeFilter(userId, keyword) {
  await redis.hdel(getFilterKey(userId), keyword.toLowerCase());
}

async function listFilters(userId) {
  return await redis.hgetall(getFilterKey(userId));
}

async function handleFilterMessage(ctx) {
  const text = ctx.message?.text?.toLowerCase();
  if (!text || text.startsWith('/')) return;

  const filters = await redis.hgetall(getFilterKey(ctx.from.id));

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
}

module.exports = bot => {
  bot.action('filter_menu', async ctx => {
    await ctx.answerCbQuery();
    return ctx.reply(
      '🧰 *Kelola Filter Chat*\n\nGunakan tombol berikut:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('➕ Tambah Filter', 'check_limit_before_add'),
            Markup.button.callback('🗑️ Hapus Filter', 'filter_remove')
          ],
          [Markup.button.callback('📃 Lihat Filter', 'lihat_filters')],
          [Markup.button.callback('⬅️ Kembali ke Menu', 'personal_menu')]
        ])
      }
    );
  });

  bot.action('check_limit_before_add', async ctx => {
    const userId = ctx.from.id;
    const key = getFilterKey(userId);
    const existing = await redis.hgetall(key);
    const premium = await isPremium(userId);

    if (!premium && Object.keys(existing).length >= 5) {
      return ctx.answerCbQuery(
        'Batas 5 filter tercapai. Upgrade ke premium untuk lebih banyak.',
        { show_alert: true }
      );
    }

    await ctx.answerCbQuery('Silakan kirim /filter <kata> <balasan>', { show_alert: true });
  });

  bot.action('filter_remove', async ctx => {
    await ctx.answerCbQuery();
    await ctx.reply('Contoh: /unfilter doge', { parse_mode: 'Markdown' });
  });

  bot.action('lihat_filters', async ctx => {
    await ctx.answerCbQuery();
    const filters = await listFilters(ctx.from.id);
    if (!Object.keys(filters).length) return ctx.reply('Belum ada filter.');
    const list = Object.keys(filters).map(k => `- \`${k}\``).join('\n');
    ctx.reply(`Filter aktif:\n${list}`, { parse_mode: 'Markdown' });
  });

  bot.command('filter', async ctx => {
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

    try {
      const linkRegex = /([^]+)](https?:\/\/[^\s)]+)/g;
      const buttons = [];
      let match;

      while ((match = linkRegex.exec(response)) !== null) {
        buttons.push(Markup.button.url(match[1], match[2]));
      }

      const replyMarkup = buttons.length
        ? Markup.inlineKeyboard(buttons.map(btn => [btn])).reply_markup
        : null;

      const cleanText = response.replace(linkRegex, '$1');

      await addFilter(userId, keyword, cleanText);
      ctx.reply(`Filter untuk *"${keyword}"* disimpan.`, {
        parse_mode: 'Markdown',
        reply_markup: replyMarkup
      });
    } catch (err) {
      ctx.reply(err.message);
    }
  });

  bot.command('unfilter', async ctx => {
    const keyword = ctx.message.text.split(' ')[1];
    if (!keyword) return ctx.reply('Gunakan: /unfilter <kata>');
    await removeFilter(ctx.from.id, keyword);
    ctx.reply(`Filter *"${keyword}"* dihapus.`, { parse_mode: 'Markdown' });
  });

  bot.command('filters', async ctx => {
    const filters = await listFilters(ctx.from.id);
    if (!Object.keys(filters).length) return ctx.reply('Belum ada filter.');
    const list = Object.keys(filters).map(k => `- \`${k}\``).join('\n');
    ctx.reply(`Filter aktif:\n${list}`, { parse_mode: 'Markdown' });
  });

  bot.on('text', handleFilterMessage);
};
