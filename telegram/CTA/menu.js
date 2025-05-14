const { Telegraf, Markup } = require('telegraf');
const { sendHelp, getFAQContent, getSponsorContent } = require('./help');
const {
  getAdminMenu,
  registerAdminActions,
  isAdmin,
  addAdmin,
  removeAdmin,
  listAdmins,
} = require('./admin');
const { sendSupport, registerSupportActions } = require('./support');

module.exports = function setupMenu(bot) {
  registerAdminActions(bot);
  registerSupportActions(bot);

  bot.command('start', (ctx) => {
    ctx.reply(
      'Selamat datang! Pilih menu di bawah:',
      Markup.inlineKeyboard([
        [Markup.button.callback('📋 Buka Menu', 'menu')],
      ])
    );
  });

  bot.action('start', (ctx) => {
    ctx.editMessageText(
      'Selamat datang! Pilih menu di bawah:',
      Markup.inlineKeyboard([
        [Markup.button.callback('📋 Buka Menu', 'menu')],
      ])
    );
  });

  bot.action('menu', (ctx) => {
    ctx.editMessageText(
      'Menu Utama:',
      Markup.inlineKeyboard([
        [
          Markup.button.callback('🛠️ Admin Tools', 'admin_menu'),
          Markup.button.callback('⚙️ Pengaturan Pribadi', 'personal_menu'),
        ],
        [
          Markup.button.callback('❓ FAQ', 'faq'),
          Markup.button.callback('🆘 Bantuan', 'help'),
        ],
        [
          Markup.button.callback('💖 Sponsor Kami', 'sponsor'),
          Markup.button.callback('🔒 Filter Premium', 'filter'),
        ],
        [
          Markup.button.callback('🌐 Ganti Bahasa', 'language'),
          Markup.button.url('🧩 MiniApp Web', 'https://crypto-price-on.vercel.app/unlock?ref=telegram'),
        ],
        [
          Markup.button.callback('🔙 Kembali', 'start'),
        ],
      ])
    );
  });

  
//  bot.action('admin_menu', async (ctx) => {
//    const fromId = ctx.from.id.toString();
//    if (!(await isAdmin(fromId))) {
//      return ctx.answerCbQuery('Kamu bukan admin.', { show_alert: true });
//    }

  bot.action('admin_menu', async (ctx) => {
    await getAdminMenu(ctx);
   });


    ctx.editMessageText(
      'Menu Admin:',
      Markup.inlineKeyboard([
        [Markup.button.callback('➕ Tambah Admin', 'add_admin')],
        [Markup.button.callback('➖ Hapus Admin', 'remove_admin')],
        [Markup.button.callback('📢 Kirim Broadcast', 'broadcast')],
        [Markup.button.callback('📋 Daftar Admin', 'list_admins')],
        [Markup.button.callback('🔙 Kembali', 'menu')],
      ])
    );
  });

  bot.action('personal_menu', (ctx) => {
    ctx.editMessageText(
      'Pengaturan Pribadi:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔗 Hubungkan Akun', 'link')],
        [Markup.button.callback('❌ Putuskan Akun', 'unlink')],
        [Markup.button.callback('🔙 Kembali', 'menu')],
      ])
    );
  });

  bot.action('language', (ctx) => {
    ctx.editMessageText(
      'Pilih bahasa:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🇮🇩 Bahasa Indonesia', 'lang_id')],
        [Markup.button.callback('🇬🇧 English', 'lang_en')],
        [Markup.button.callback('🇪🇸 Español', 'lang_es')],
        [Markup.button.callback('🔙 Kembali', 'menu')],
      ])
    );
  });

  bot.action(/^lang_/, (ctx) => {
    ctx.answerCbQuery('Bahasa telah diubah.', { show_alert: true });
    ctx.editMessageText(
      'Pengaturan bahasa diperbarui.',
      Markup.inlineKeyboard([
        [Markup.button.callback('📋 Kembali ke Menu', 'menu')],
      ])
    );
  });

  bot.action('faq', async (ctx) => {
    const text = getFAQContent();
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });
  });

  bot.action('support_back', async (ctx) => {
    const text = getSponsorContent();
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    });
  });

  bot.action('sponsor', async (ctx) => {
    await sendSupport(ctx);
  });

  bot.action('filter', (ctx) => {
    ctx.answerCbQuery('Fitur ini hanya untuk pengguna premium.');
  });

  bot.action('miniapp', (ctx) => {
    ctx.answerCbQuery('Buka miniapp melalui link di menu utama.');
  });

  bot.command('help', sendHelp);

  bot.action('help', async (ctx) => {
    await ctx.answerCbQuery();
    await sendHelp(ctx);
  });

  bot.command('admin', async (ctx) => {
    const fromId = ctx.from.id.toString();
    if (!(await isAdmin(fromId))) {
      return ctx.reply('Kamu bukan admin.');
    }

    ctx.reply('Menu Admin:', Markup.inlineKeyboard(getAdminMenu()));
  });
};
