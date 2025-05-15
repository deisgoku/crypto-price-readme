const { redis } = require('../../lib/redis');
const { Markup } = require('telegraf');

const getFilterKey = chatId => `filter:${chatId}`;
const getPremiumKey = userId => `tg:premium:${userId}`;
const getSpamKey = userId => `spam:filter:${userId}`;

async function isPremium(userId) {
  return await redis.get(getPremiumKey(userId));
}

async function addFilter(chatId, userId, keyword, response) {
  const key = getFilterKey(chatId);
  const filterCount = await redis.hlen(key);
  const premium = await isPremium(userId);

  if (!premium && filterCount >= 5) {
    throw new Error('Kamu mencapai batas 5 filter. Upgrade ke premium untuk menambah lebih banyak.');
  }

  await redis.hset(key, { [keyword.toLowerCase()]: response });
}

async function removeFilter(chatId, keyword) {
  const key = getFilterKey(chatId);
  await redis.hdel(key, keyword.toLowerCase());
}

async function listFilters(chatId) {
  const key = getFilterKey(chatId);
  return await redis.hgetall(key);
}

async function handleFilterMessage(ctx) {
  const chatId = ctx.chat.id.toString();
  const text = ctx.message?.text?.toLowerCase();
  if (!text || text.startsWith('/') || text.startsWith('!')) return;

  const filters = await listFilters(chatId);
  for (const keyword in filters) {
    if (text.includes(keyword)) {
      return ctx.reply(filters[keyword]);
    }
  }
}

module.exports = bot => {
  // UI Menu Filter
  bot.action('filter_menu', async ctx => {
    const text = '🧰 *Kelola Filter Chat*\n\n' +
      '- Maksimal 5 filter untuk pengguna gratis\n' +
      '- Premium dapat menambahkan lebih banyak filter\n\n' +
      'Gunakan tombol di bawah untuk mengatur filter Anda.';
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.switchToCurrentChat('➕ Tambah Filter', '/filter ')],
      [Markup.button.switchToCurrentChat('➖ Hapus Filter', '/unfilter ')],
      [Markup.button.callback('📃 Daftar Filter', 'filter_list')],
      [Markup.button.callback('🔙 Kembali', 'personal_menu')],
    ]);

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup,
    });
    await ctx.answerCbQuery();
  });

  // Tampilkan daftar filter
  bot.action('filter_list', async ctx => {
    const filters = await listFilters(ctx.chat.id);
    const list = Object.keys(filters).map(k => `- \`${k}\``).join('\n') || 'Belum ada filter.';
    await ctx.editMessageText(`📃 *Daftar Filter Aktif:*\n\n${list}`, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Kembali', 'filter_menu')]
      ]).reply_markup
    });
    await ctx.answerCbQuery();
  });

  // Command: /filter <keyword> <response>
  bot.command('filter', async ctx => {
    const userId = ctx.from.id.toString();
    const spamKey = getSpamKey(userId);
    if (await redis.get(spamKey)) return ctx.reply('Tunggu sebentar sebelum menambahkan filter lagi.');

    const [_, keyword, ...resp] = ctx.message.text.split(' ');
    const response = resp.join(' ');
    if (!keyword || !response) return ctx.reply('Gunakan format: /filter <kata> <balasan>');

    try {
      await addFilter(ctx.chat.id, userId, keyword, response);
      await redis.set(spamKey, '1', 'EX', 5);
      ctx.reply(`Filter untuk *"${keyword}"* disimpan.`, { parse_mode: 'Markdown' });
    } catch (err) {
      ctx.reply(err.message);
    }
  });

  // Command: /unfilter <keyword>
  bot.command('unfilter', async ctx => {
    const keyword = ctx.message.text.split(' ')[1];
    if (!keyword) return ctx.reply('Gunakan format: /unfilter <kata>');
    await removeFilter(ctx.chat.id, keyword);
    ctx.reply(`Filter *"${keyword}"* dihapus.`, { parse_mode: 'Markdown' });
  });

  // Command: /filters
  bot.command('filters', async ctx => {
    const filters = await listFilters(ctx.chat.id);
    const list = Object.keys(filters).map(k => `- \`${k}\``).join('\n') || 'Belum ada filter.';
    ctx.reply(`📃 *Filter Aktif:*\n\n${list}`, { parse_mode: 'Markdown' });
  });

  // Auto reply berbasis filter
  bot.on('text', handleFilterMessage);
};
