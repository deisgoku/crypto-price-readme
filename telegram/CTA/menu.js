const { Markup } = require('telegraf');
const { redis } = require('../lib/redis'); // Tambahan Redis
const { sendHelp, getFAQContent, getSponsorContent } = require('./help');
const {
  getAdminMenu,
  registerAdminActions,
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

  bot.action('menu', async (ctx) => {
    const key = `tg:${ctx.from.id}:menu`;
    const cached = await redis.get(key);
    const text = 'Menu Utama:';
    const keyboard = Markup.inlineKeyboard([
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
    ]);
    if (!cached) await redis.setex(key, 120, text);
    await ctx.editMessageText(text, keyboard);
  });

  bot.action('admin_menu', async (ctx) => {
    const key = `tg:${ctx.from.id}:admin_menu`;
    const cached = await redis.get(key);
    const text = 'Menu Admin:';
    const buttons = getAdminMenu();
    if (!cached) await redis.setex(key, 120, text);
    await ctx.editMessageText(text, Markup.inlineKeyboard(buttons));
  });

  bot.action('personal_menu', async (ctx) => {
    const key = `tg:${ctx.from.id}:personal_menu`;
    const cached = await redis.get(key);
    const text = 'Pengaturan Pribadi:';
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔗 Hubungkan Akun', 'link')],
      [Markup.button.callback('❌ Putuskan Akun', 'unlink')],
      [Markup.button.callback('🔙 Kembali', 'menu')],
    ]);
    if (!cached) await redis.setex(key, 120, text);
    await ctx.editMessageText(text, keyboard);
  });

  bot.action('language', async (ctx) => {
    const key = `tg:${ctx.from.id}:language`;
    const cached = await redis.get(key);
    const text = 'Pilih bahasa:';
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🇮🇩 Bahasa Indonesia', 'lang_id')],
      [Markup.button.callback('🇬🇧 English', 'lang_en')],
      [Markup.button.callback('🇪🇸 Español', 'lang_es')],
      [Markup.button.callback('🔙 Kembali', 'menu')],
    ]);
    if (!cached) await redis.setex(key, 120, text);
    await ctx.editMessageText(text, keyboard);
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
    const key = `tg:${ctx.from.id}:faq`;
    let text = await redis.get(key);
    if (!text) {
      text = getFAQContent();
      await redis.setex(key, 300, text);
    }
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });
  });

  bot.action('support_back', async (ctx) => {
    const key = `tg:${ctx.from.id}:support_back`;
    let text = await redis.get(key);
    if (!text) {
      text = getSponsorContent();
      await redis.setex(key, 300, text);
    }
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    });
  });

  bot.action('sponsor', async (ctx) => {
    const key = `tg:${ctx.from.id}:sponsor`;
    const cached = await redis.get(key);
    if (!cached) await redis.setex(key, 300, '1');
    await sendSupport(ctx);
  });

  bot.action('filter', (ctx) => {
    ctx.answerCbQuery('Fitur ini hanya untuk pengguna premium.', { show_alert: true });
  });

  bot.action('miniapp', (ctx) => {
    ctx.answerCbQuery('Buka miniapp melalui link di menu utama.');
  });

  bot.command('help', sendHelp);

  bot.action('help', async (ctx) => {
    const key = `tg:${ctx.from.id}:help`;
    const cached = await redis.get(key);
    if (!cached) await redis.setex(key, 300, '1');
    await ctx.answerCbQuery();
    await sendHelp(ctx);
  });

  bot.command('admin', async (ctx) => {
    await getAdminMenu(ctx);
  });
};
