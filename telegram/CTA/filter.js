const { Markup } = require('telegraf');
const { redis } = require('../../lib/redis');

// === Helper ===
function getFilterKey(chatId) {
  return `filter:${chatId}`;
}

async function isPremium(userId) {
  return await redis.get(`tg:premium:${userId}`);
}

// === Logic Filter ===
async function addFilter(chatId, userId, keyword, response) {
  const key = getFilterKey(chatId);
  const filterCount = await redis.hlen(key);
  const premium = await isPremium(userId);

  if (!premium && filterCount >= 5) {
    throw new Error('Batas filter gratis tercapai (maks 5). Upgrade premium untuk lebih banyak.');
  }

  await redis.hset(key, keyword.toLowerCase(), response);
}

async function removeFilter(chatId, keyword) {
  const key = getFilterKey(chatId);
  await redis.hdel(key, keyword.toLowerCase());
}

async function listFilters(chatId) {
  const key = getFilterKey(chatId);
  return await redis.hgetall(key);
}

// === Handler Pesan (Tanggapan Filter) ===
async function handleFilterMessage(ctx) {
  const chatId = ctx.chat.id.toString();
  const text = ctx.message?.text?.toLowerCase();
  const fromBot = ctx.message?.from?.is_bot;

  if (!text || fromBot) return;

  // Abaikan semua command
  if (text.startsWith('/') || text.startsWith('!')) return;

  const filters = await redis.hgetall(getFilterKey(chatId));
  for (const keyword in filters) {
    if (text.includes(keyword)) {
      const response = filters[keyword];
      if (response.startsWith('!')) {
        // Kirim ulang sebagai command agar diproses handler
        return ctx.telegram.sendMessage(ctx.chat.id, response, {
          reply_to_message_id: ctx.message.message_id,
        });
      }
      return ctx.reply(response);
    }
  }
}

// === Bot Handler ===
module.exports = bot => {
  // Menu UI Filter
  bot.action('filter_menu', async (ctx) => {
    const key = `tg:${ctx.from.id}:filter_menu`;
    const text = '🧰 *Kelola Filter Chat*\n\n' +
      '- Maksimal 5 filter untuk pengguna gratis\n' +
      '- Premium dapat menambahkan lebih banyak filter\n\n' +
      'Gunakan tombol di bawah untuk mengatur filter Anda.';

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.switchToCurrentChat('➕ Tambah Filter', '/filter '),
        Markup.button.switchToCurrentChat('➖ Hapus Filter', '/unfilter ')
      ],
      [Markup.button.callback('📃 Daftar Filter', 'filter_list')],
      [Markup.button.callback('⬅️ Kembali ke Menu', 'personal_menu')],
    ]);

    try {
      if (!await redis.get(key)) await redis.setex(key, 600, text);
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      await ctx.answerCbQuery();
    } catch (err) {
      console.error('Error di filter_menu:', err);
      await ctx.answerCbQuery('Gagal memuat menu filter.', { show_alert: true });
    }
  });

  // List Filter via Tombol
  bot.action('filter_list', async ctx => {
    const filters = await listFilters(ctx.chat.id);
    if (!Object.keys(filters).length) {
      return ctx.answerCbQuery('Belum ada filter.');
    }

    const list = Object.keys(filters).map(k => `- ${k}`).join('\n');
    await ctx.reply(`📃 Filter aktif:\n${list}`);
    await ctx.answerCbQuery();
  });

  // Tambah Filter
  bot.command('filter', async ctx => {
    const userId = ctx.from.id.toString();
    const spamKey = `spam:filter:${userId}`;
    const [_, keyword, ...responseParts] = ctx.message.text.split(' ');
    const response = responseParts.join(' ');

    if (!keyword || !response) return ctx.reply('Gunakan: /filter <kata> <balasan>');

    if (await redis.get(spamKey)) {
      return ctx.reply('Tunggu beberapa detik sebelum menambahkan filter lagi.');
    }

    try {
      await addFilter(ctx.chat.id, userId, keyword, response);
      await redis.set(spamKey, '1', 'EX', 5);
      ctx.reply(`Filter untuk *"${keyword}"* disimpan.`, { parse_mode: 'Markdown' });
    } catch (err) {
      ctx.reply(err.message);
    }
  });

  // Hapus Filter
  bot.command('unfilter', async ctx => {
    const keyword = ctx.message.text.split(' ')[1];
    if (!keyword) return ctx.reply('Gunakan: /unfilter <kata>');

    await removeFilter(ctx.chat.id, keyword);
    ctx.reply(`Filter "${keyword}" dihapus.`);
  });

  // Lihat semua filter
  bot.command('filters', async ctx => {
    const filters = await listFilters(ctx.chat.id);
    if (!Object.keys(filters).length) return ctx.reply('Belum ada filter.');

    const list = Object.keys(filters).map(k => `- ${k}`).join('\n');
    ctx.reply(`📃 Filter aktif:\n${list}`);
  });

  // Tangkap semua pesan teks
  bot.on('text', handleFilterMessage);
};
