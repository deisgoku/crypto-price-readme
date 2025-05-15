const { redis } = require('../../lib/redis');
const { Markup } = require('telegraf');
const { handleSymbolCommand } = require('./handlercoin'); 

// Fungsi helper untuk key redis filter per chat
function getFilterKey(chatId) {
  return `filters:${chatId}`;
}

// Fungsi tambah filter
async function addFilter(chatId, userId, keyword, text, markup = null) {
  const filters = await redis.hgetall(getFilterKey(chatId));
  if (Object.keys(filters).length >= 5) {
    // Contoh cek batas filter gratis, kamu bisa buat premium nanti
    throw new Error('Maksimal 5 filter untuk pengguna gratis.');
  }
  const data = { userId, text, markup };
  await redis.hset(getFilterKey(chatId), keyword.toLowerCase(), JSON.stringify(data));
}

// Fungsi hapus filter
async function removeFilter(chatId, keyword) {
  await redis.hdel(getFilterKey(chatId), keyword.toLowerCase());
}

// Fungsi list semua filter
async function listFilters(chatId) {
  const filters = await redis.hgetall(getFilterKey(chatId));
  return filters;
}

// Handler filter message
async function handleFilterMessage(ctx) {
  const text = ctx.message?.text;
  if (!text || text.startsWith('/')) return;

  const filters = await redis.hgetall(getFilterKey(ctx.chat.id));
  for (const keyword in filters) {
    if (text.toLowerCase().includes(keyword)) {
      const data = JSON.parse(filters[keyword]);

      if (data.text.trim().startsWith('!c ')) {
        const coinId = data.text.trim().slice(3).trim();
        return handleSymbolCommand(ctx, coinId);
      }

      const options = {};
      const trimmedText = data.text.trim();
      const isMono = trimmedText.startsWith('```') || trimmedText.startsWith('`');
      if (!isMono) options.parse_mode = 'Markdown';
      if (data.markup) options.reply_markup = data.markup;

      return ctx.reply(data.text, options);
    }
  }
}

// Export modul filter ke bot
module.exports = bot => {
  bot.action('filter_menu', async ctx => {
    await ctx.editMessageText(
      '🧰 *Kelola Filter Chat*\n\n- Maksimal 5 filter untuk pengguna gratis\n- Premium dapat menambahkan lebih banyak filter\n\nGunakan tombol di bawah untuk mengatur filter Anda.',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.switchToCurrentChat('➕ Tambah Filter', '/filter '),
            Markup.button.switchToCurrentChat('🗑️ Hapus Filter', '/unfilter ')
          ],
          [Markup.button.switchToCurrentChat('📃 Lihat Filter', '/filters')],
          [Markup.button.callback('⬅️ Kembali ke Menu', 'personal_menu')]
        ])
      }
    );
    await ctx.answerCbQuery();
  });

  bot.command('filter', async ctx => {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const args = ctx.message.text.split(' ');
    const keyword = args[1];
    const response = args.slice(2).join(' ');

    if (!keyword || !response) {
      return ctx.reply(
        'Gunakan: `/filter doge !c doge`\n\nUntuk tombol custom:\n/filter buy [Buy](https://example.com)',
        { parse_mode: 'Markdown' }
      );
    }

    try {
      const markdownRegex = /([^]+)(https?:\/\/[^\s)]+)/g;
      const buttons = [];
      let match;

      while ((match = markdownRegex.exec(response)) !== null) {
        buttons.push(Markup.button.url(match[1], match[2]));
      }

      const replyMarkup = buttons.length
        ? Markup.inlineKeyboard(buttons.map(b => [b])).reply_markup
        : null;

      const cleanText = response.replace(markdownRegex, '$1');

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
