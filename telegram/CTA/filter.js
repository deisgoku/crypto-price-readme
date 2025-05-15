// telegram/CTA/filter.js
const { redis } = require('../../lib/redis');

// ===== Logic Filter =====
function getFilterKey(chatId) {
  return `filter:${chatId}`;
}

async function isPremium(userId) {
  return await redis.get(`tg:premium:${userId}`); // bisa disesuaikan sistem premiumnya
}

async function addFilter(chatId, userId, keyword, response) {
  const key = getFilterKey(chatId);
  const filterCount = await redis.hlen(key);
  const premium = await isPremium(userId);

  if (!premium && filterCount >= 5) {
    throw new Error('Kamu mencapai batas 5 filter. Upgrade ke premium untuk menambah lebih banyak.');
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

async function handleFilterMessage(ctx) {
  const chatId = ctx.chat.id.toString();
  const key = getFilterKey(chatId);
  const filters = await redis.hgetall(key);

  const text = ctx.message?.text?.toLowerCase();
  if (!text || text.startsWith('/')) return;

  for (const keyword in filters) {
    if (text.includes(keyword)) {
      return ctx.reply(filters[keyword]);
    }
  }
}

// ===== Bot Handler =====
module.exports = bot => {
  // Inline Menu
  bot.action('filter_menu', async ctx => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `Kelola filter otomatis untuk grup atau obrolan ini:\n\n` +
      `Gunakan perintah:\n` +
      `/filter <kata> <balasan>\n` +
      `/unfilter <kata>\n` +
      `/filters\n\n` +
      `Contoh:\n/filter halo Halo juga!`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '➕ Tambah Filter', switch_inline_query_current_chat: '/filter ' },
              { text: '🗑️ Hapus Filter', switch_inline_query_current_chat: '/unfilter ' }
            ],
            [{ text: '⬅️ Kembali ke Menu', callback_data: 'personal_menu' }]
          ]
        }
      }
    );
  });

  // Tambah Filter
  bot.command('filter', async ctx => {
    const userId = ctx.from.id.toString();
    const spamKey = `spam:filter:${userId}`;

    if (await redis.get(spamKey)) return ctx.reply('Tunggu sebentar sebelum menambahkan filter lagi.');

    const [_, keyword, ...responseParts] = ctx.message.text.split(' ');
    const response = responseParts.join(' ');

    if (!keyword || !response) return ctx.reply('Gunakan: /filter <kata> <balasan>');

    try {
      await addFilter(ctx.chat.id, userId, keyword, response);
      await redis.set(spamKey, '1', 'EX', 5);
      ctx.reply(`Filter untuk "${keyword}" disimpan.`);
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

  // Lihat Daftar Filter
  bot.command('filters', async ctx => {
    const filters = await listFilters(ctx.chat.id);
    if (!Object.keys(filters).length) return ctx.reply('Belum ada filter.');

    const list = Object.keys(filters).map(k => `- ${k}`).join('\n');
    ctx.reply(`Filter aktif:\n${list}`);
  });

  // Tanggapi pesan berdasarkan filter
  bot.on('text', handleFilterMessage);
};
