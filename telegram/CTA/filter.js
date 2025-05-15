const { redis } = require('../../lib/redis');
const { Markup } = require('telegraf');
const { handleSymbolCommand } = require('./handlecoin'); // import fungsi coin asli

// Key filter Redis per chat
function getFilterKey(chatId) {
  return `filter:${chatId}`;
}

// Dummy cek premium, ganti sesuai logic asli
async function isPremium(userId) {
  return userId % 2 === 1;
}

// Simpan filter ke Redis (value simpan object JSON { text, markup })
async function addFilter(chatId, userId, keyword, text, markup = null) {
  const filters = await redis.hgetall(getFilterKey(chatId)) || {};
  const maxFilters = (await isPremium(userId)) ? 50 : 5;

  if (!filters[keyword] && Object.keys(filters).length >= maxFilters) {
    throw new Error(`Batas filter tercapai. Maksimal: ${maxFilters} filter.`);
  }

  const data = { text, markup };
  await redis.hset(getFilterKey(chatId), keyword, JSON.stringify(data));
}

// Hapus filter
async function removeFilter(chatId, keyword) {
  await redis.hdel(getFilterKey(chatId), keyword);
}

// List semua filter
async function listFilters(chatId) {
  return await redis.hgetall(getFilterKey(chatId)) || {};
}

// Handler pesan cek filter
async function handleFilterMessage(ctx) {
  const textRaw = ctx.message?.text;
  if (!textRaw) return;
  const text = textRaw.toLowerCase();
  if (text.startsWith('/')) return; // skip command

  const filters = await redis.hgetall(getFilterKey(ctx.chat.id)) || {};

  for (const keyword in filters) {
    if (text.includes(keyword.toLowerCase())) {
      const data = JSON.parse(filters[keyword]);
      const trimmedText = data.text.trim();

      if (trimmedText.startsWith('!c ')) {
        // jalankan handleSymbolCommand jika filter dimulai !c <coin>
        const coinId = trimmedText.slice(3).trim();
        return handleSymbolCommand(ctx, coinId);
      }

      // opsi parse_mode Markdown kecuali jika pakai backticks (monospace)
      const options = {};
      const isMono = trimmedText.startsWith('```') || trimmedText.startsWith('`');
      if (!isMono) options.parse_mode = 'Markdown';

      if (data.markup) options.reply_markup = data.markup;

      return ctx.reply(trimmedText, options);
    }
  }
}

// Export fitur filter ke bot
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
        'Gunakan: `/filter doge !c doge`\n\nContoh filter biasa:\n/filter hello Halo semua!',
        { parse_mode: 'Markdown' }
      );
    }

    try {
      // Kirim markup null karena tidak parsing tombol khusus di sini
      await addFilter(chatId, userId, keyword.toLowerCase(), response, null);
      ctx.reply(`Filter untuk *"${keyword}"* disimpan.`, { parse_mode: 'Markdown' });
    } catch (err) {
      ctx.reply(err.message);
    }
  });

  bot.command('unfilter', async ctx => {
    const keyword = ctx.message.text.split(' ')[1];
    if (!keyword) return ctx.reply('Gunakan: /unfilter <kata>');
    await removeFilter(ctx.chat.id, keyword.toLowerCase());
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
