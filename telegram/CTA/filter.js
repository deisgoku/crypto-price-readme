// telegram/CTA/filter.js


const { handleSymbolCommand } = require('./handlercoin');
const { redis } = require('../../lib/redis');
const { Markup } = require('telegraf');

function getFilterKey(chatId) {
  return `filters:${chatId}`;
}

async function isPremium(userId) {
  return await redis.get(`tg:premium:${userId}`);
}

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

async function removeFilter(chatId, keyword) {
  await redis.hdel(getFilterKey(chatId), keyword.toLowerCase());
}

async function listFilters(chatId) {
  const raw = await redis.hgetall(getFilterKey(chatId));
  const parsed = {};
  for (const [k, v] of Object.entries(raw)) {
    parsed[k] = JSON.parse(v);
  }
  return parsed;
}

async function handleFilterMessage(ctx) {
  const text = ctx.message?.text?.toLowerCase();
  if (!text || text.startsWith('/')) return;

  const raw = await redis.hgetall(getFilterKey(ctx.chat.id));
  for (const keyword in raw) {
    try {
      if (text.includes(keyword)) {
        const data = JSON.parse(raw[keyword]);

        // !c coin
        if (data.text?.trim().startsWith('!c ')) {
          const coinId = data.text.trim().slice(3).trim();
          return handleSymbolCommand(ctx, coinId);
        }

        const options = {};
        const isMono = data.text.trim().startsWith('```') || data.text.trim().startsWith('`');
        if (!isMono) options.parse_mode = 'Markdown';
        if (data.markup) options.reply_markup = data.markup;

        return ctx.reply(data.text, options);
      }
    } catch (err) {
      console.error('Filter rusak:', err.message);
    }
  }
}

module.exports = bot => {
  bot.action('filter_menu', async ctx => {
    await ctx.editMessageText(
      '🧰 *Kelola Filter Chat*\n\n- Maks 5 filter (free)\n- Premium bebas tambah filter\n\nGunakan tombol atau perintah:\n- `/filter <kata> <balasan>`\n- `/unfilter <kata>`\n- `/filters`',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback('➕ Tambah Filter', 'filter_add'),
            Markup.button.callback('🗑️ Hapus Filter', 'filter_remove')
          ],
          [Markup.button.callback('📃 Lihat Filter', 'lihat_filters')],
          [Markup.button.callback('⬅️ Kembali ke Menu', 'personal_menu')]
        ])
      }
    );
    await ctx.answerCbQuery();
  });

  bot.action('filter_add', async ctx => {
    await ctx.answerCbQuery();
    await ctx.reply(
      '*Contoh:*\n/filter doge !c doge\n/filter buy Buy now [Link](https://binance.com)',
      { parse_mode: 'Markdown' }
    );
  });

  bot.action('filter_remove', async ctx => {
    await ctx.answerCbQuery();
    await ctx.reply('Contoh: /unfilter doge', { parse_mode: 'Markdown' });
  });

  bot.action('lihat_filters', async ctx => {
    await ctx.answerCbQuery();
    const filters = await listFilters(ctx.chat.id);
    if (!Object.keys(filters).length) return ctx.reply('Belum ada filter.');
    const list = Object.keys(filters).map(k => `- \`${k}\``).join('\n');
    ctx.reply(`Filter aktif:\n${list}`, { parse_mode: 'Markdown' });
  });

  bot.command('filter', async ctx => {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const args = ctx.message.text.split(' ');

    const keyword = args[1];
    const response = args.slice(2).join(' ');

    if (!keyword || !response) {
      return ctx.reply('Gunakan: /filter doge !c doge atau /filter buy [Beli](https://...)', { parse_mode: 'Markdown' });
    }

    try {
      // Deteksi markdown tombol
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

      await addFilter(chatId, userId, keyword, cleanText, replyMarkup);
      ctx.reply(`Filter untuk *"${keyword}"* disimpan.`, { parse_mode: 'Markdown' });
    } catch (err) {
      ctx.reply(err.message);
    }
  });

  bot.command('unfilter', async ctx => {
    const keyword = ctx.message.text.split(' ')[1];
    if (!keyword) return ctx.reply('Gunakan: /unfilter <kata>');
    await removeFilter(ctx.chat.id, keyword);
    ctx.reply(`Filter *"${keyword}"* dihapus.`, { parse_mode: 'Markdown' });
  });

  bot.command('filters', async ctx => {
    const filters = await listFilters(ctx.chat.id);
    if (!Object.keys(filters).length) return ctx.reply('Belum ada filter.');
    const list = Object.keys(filters).map(k => `- \`${k}\``).join('\n');
    ctx.reply(`Filter aktif:\n${list}`, { parse_mode: 'Markdown' });
  });

  bot.on('text', handleFilterMessage);
};
