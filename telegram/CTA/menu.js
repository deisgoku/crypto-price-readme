// telegram/CTA/menu.js


const { Telegraf, Markup } = require('telegraf');
const { sendHelp } = require('./help');
const { getAdminMenu, registerAdminActions } = require('./admin');
const { sendSupport, registerSupportActions } = require('./support');


module.exports = function setupMenu(bot) {
  registerAdminActions(bot);
  registerSupportActions(bot);
  

  // /start
  bot.command('start', (ctx) => {
    ctx.reply('Selamat datang! Pilih menu di bawah:', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('Buka Menu', 'menu')]
      ])
    });
  });

  // Callback: start ulang
  bot.action('start', (ctx) => {
    ctx.editMessageText('Selamat datang! Pilih menu di bawah:', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('Buka Menu', 'menu')]
      ])
    });
  });

  // Menu utama
  bot.action('menu', (ctx) => {
    ctx.editMessageText('Menu Utama:', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('Admin Tools', 'admin_menu')],
        [Markup.button.callback('Pengaturan Pribadi', 'personal_menu')],
        [Markup.button.callback('FAQ', 'faq')],
        [Markup.button.callback('Bantuan', 'help')],
        [Markup.button.callback('Sponsor Kami', 'sponsor')],
        [Markup.button.callback('Filter Premium', 'filter')],
        [Markup.button.callback('Ganti Bahasa', 'language')],
        [Markup.button.url('MiniApp Web', 'https://crypto-price-on.vercel.app/unlock?ref=telegram')],
        [Markup.button.callback('Kembali', 'start')]
      ])
    });
  });

  // Admin Menu
  bot.action('admin_menu', async (ctx) => {
    const fromId = ctx.from.id.toString();
    if (!(await isAdmin(fromId))) {
      return ctx.answerCbQuery('Kamu bukan admin.', { show_alert: true });
    }

    ctx.editMessageText('Menu Admin:', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('Tambah Admin', 'add_admin')],
        [Markup.button.callback('Hapus Admin', 'remove_admin')],
        [Markup.button.callback('Kirim Broadcast', 'broadcast')],
        [Markup.button.callback('Daftar Admin', 'list_admins')],
        [Markup.button.callback('Kembali', 'menu')]
      ])
    });
  });

  // Personal Menu
  bot.action('personal_menu', (ctx) => {
    ctx.editMessageText('Pengaturan Pribadi:', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('Hubungkan Akun', 'link')],
        [Markup.button.callback('Putuskan Akun', 'unlink')],
        [Markup.button.callback('Kembali', 'menu')]
      ])
    });
  });

  // Language selector
  bot.action('language', (ctx) => {
    ctx.editMessageText('Pilih bahasa:', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('🇮🇩 Bahasa Indonesia', 'lang_id')],
        [Markup.button.callback('🇬🇧 English', 'lang_en')],
        [Markup.button.callback('🇪🇸 Español', 'lang_es')],
        [Markup.button.callback('Kembali', 'menu')]
      ])
    });
  });

  // Ganti bahasa (dummy)
  bot.action(/^lang_/, (ctx) => {
    ctx.answerCbQuery('Bahasa telah diubah.', { show_alert: true });
    ctx.editMessageText('Pengaturan bahasa diperbarui.', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('Kembali ke Menu', 'menu')]
      ])
    });
  });

  // FAQ
  bot.action('faq', (ctx) => ctx.answerCbQuery('FAQ belum tersedia.'));

  // Sponsor
  bot.action('sponsor', (ctx) => {
    ctx.answerCbQuery('Berikut adalah cara mensponsori kami.');
    sendSupport(ctx);
  });

  // Kembali dari support
  bot.action('support_back', async (ctx) => {
    await sendSupport(ctx);
  });

  // Filter premium
  bot.action('filter', (ctx) => ctx.answerCbQuery('Fitur ini hanya untuk pengguna premium.'));

  // Miniapp
  bot.action('miniapp', (ctx) => ctx.answerCbQuery('Buka miniapp melalui link di menu utama.'));

  // Help
  bot.command('help', sendHelp);
  bot.action('help', async (ctx) => {
    await ctx.answerCbQuery();
    await sendHelp(ctx);
  });

  // Admin command
  bot.command('admin', async (ctx) => {
    const fromId = ctx.from.id.toString();
    if (!(await isAdmin(fromId))) {
      return ctx.reply('Kamu bukan admin.');
    }

    ctx.reply('Menu Admin:', Markup.inlineKeyboard(getAdminMenu()));
  });
};
