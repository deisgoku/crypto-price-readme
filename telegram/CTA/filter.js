const { redis } = require('../../lib/redis');
const { Markup } = require('telegraf');

// ... fungsi getFilterKey, isPremium, addFilter, removeFilter, listFilters sama kayak sebelumnya ...

// Fungsi ambil harga coin asli
async function getPriceCoin(coin) {
  // Contoh: panggil API eksternal, ganti ini dengan API lo sendiri
  // return await fetchPriceFromAPI(coin);
  // Buat contoh dummy:
  const prices = { doge: 0.07, btc: 30000, eth: 2000 };
  return prices[coin.toLowerCase()] || null;
}

// Handler !c asli yang bisa dipakai di filter dan command
async function handleCommandC(ctx, coin) {
  if (!coin) return ctx.reply('Tolong masukkan nama coin, contoh: !c doge');

  try {
    const price = await getPriceCoin(coin);
    if (!price) return ctx.reply(`Coin ${coin} tidak ditemukan.`);

    return ctx.reply(`Harga ${coin.toUpperCase()} sekarang: $${price}`);
  } catch (e) {
    console.error(e);
    return ctx.reply('Gagal ambil harga coin.');
  }
}

// Tangkap pesan user & cek filter, jika filter text dimulai !c, jalankan handleCommandC
async function handleFilterMessage(ctx) {
  const text = ctx.message?.text?.toLowerCase();
  if (!text || text.startsWith('/')) return;

  const filters = await redis.hgetall(getFilterKey(ctx.chat.id));

  for (const keyword in filters) {
    if (text.includes(keyword)) {
      const data = JSON.parse(filters[keyword]);

      if (data.text.trim().startsWith('!c ')) {
        const coin = data.text.trim().slice(3).trim();
        return handleCommandC(ctx, coin);
      }

      const options = {};
      const isMono = data.text.trim().startsWith('```') || data.text.trim().startsWith('`');
      if (!isMono) options.parse_mode = 'Markdown';
      if (data.markup) options.reply_markup = data.markup;

      return ctx.reply(data.text, options);
    }
  }
}

// Export fitur ke bot
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
