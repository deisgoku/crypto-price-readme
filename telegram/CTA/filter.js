// telegram/CTA/filter.js


const { handleSymbolCommand } = require('./handlercoin');
const { redis } = require('../../lib/redis');
const { Markup } = require('telegraf');

// Key Redis per chat
function getFilterKey(chatId) {
  return `filters:${chatId}`;
}

// Cek status premium
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
  const raw = await redis.hgetall(getFilterKey(chatId));
  const parsed = {};
  for (const [k, v] of Object.entries(raw)) {
    parsed[k] = JSON.parse(v);
  }
  return parsed;
}

// Tangkap pesan non-command
async function handleFilterMessage(ctx) {
  const text = ctx.message?.text?.toLowerCase();
  if (!text || text.startsWith('/')) return;

  const raw = await redis.hgetall(getFilterKey(ctx.chat.id));
  const filters = raw || {};

  for (const keyword in filters) {
    try {
      const data = JSON.parse(filters[keyword]);

      if (text.includes(keyword)) {
        // Jika response diawali !c, jalankan handleSymbolCommand
        if (data.text?.trim().startsWith('!c ')) {
          const coinId = data.text.trim().slice(3).trim();
          return handleSymbolCommand(ctx, coinId);
        }

        const options = {};
        const isMono = data.text?.trim().startsWith('```') || data.text?.trim().startsWith('`');
        if (!isMono) options.parse_mode = 'Markdown';
        if (data.markup) options.reply_markup = data.markup;

        return ctx.reply(data.text, options);
      }
    } catch (err) {
      console.error('Gagal parse filter:', err.message);
      continue;
    }
  }
}

// Export fitur ke bot
module.exports = bot => {
  // Menu filter
  bot.action('filter_menu', async ctx => {
    await ctx.editMessageText(
      '🧰 *Kelola Filter Chat*\n\n' +
      '- Maksimal 5 filter untuk pengguna gratis\n' +
      '- Premium dapat menambahkan lebih banyak filter\n\n' +
      '*Gunakan tombol di bawah untuk:*\n' +
      '- Menambah, menghapus, atau melihat filter\n' +
      '- Jika tombol gagal, gunakan perintah manual seperti `/filter` atau `/unfilter`',
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

  // Callback: Tambah filter
  bot.action('filter_add', async ctx => {
    await ctx.answerCbQuery();
    await ctx.reply(
      '*Contoh:*\n/filter doge !c doge\n\nGunakan format:\n`/filter <kata> <balasan>`',
      { parse_mode: 'Markdown' }
    );
  });

  // Callback: Hapus filter
  bot.action('filter_remove', async ctx => {
    await ctx.answerCbQuery();
    await ctx.reply(
      '*Contoh:*\n/unfilter doge\n\nGunakan format:\n`/unfilter <kata>`',
      { parse_mode: 'Markdown' }
    );
  });

  // Callback: Lihat filter
  bot.action('lihat_filters', async ctx => {
    await ctx.answerCbQuery();
    const filters = await listFilters(ctx.chat.id);
    if (!Object.keys(filters).length) return ctx.reply('Belum ada filter.');
    const list = Object.keys(filters).map(k => `- \`${k}\``).join('\n');
    ctx.reply(`Filter aktif:\n${list}`, { parse_mode: 'Markdown' });
  });

  // Command: /filter <kata> <balasan>
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

  // Command: /unfilter <kata>
  bot.command('unfilter', async ctx => {
    const keyword = ctx.message.text.split(' ')[1];
    if (!keyword) return ctx.reply('Gunakan: /unfilter <kata>');
    await removeFilter(ctx.chat.id, keyword);
    ctx.reply(`Filter *"${keyword}"* dihapus.`, { parse_mode: 'Markdown' });
  });

  // Command: /filters
  bot.command('filters', async ctx => {
    const filters = await listFilters(ctx.chat.id);
    if (!Object.keys(filters).length) return ctx.reply('Belum ada filter.');
    const list = Object.keys(filters).map(k => `- \`${k}\``).join('\n');
    ctx.reply(`Filter aktif:\n${list}`, { parse_mode: 'Markdown' });
  });

  // Handler pesan biasa
  bot.on('text', handleFilterMessage);
};
