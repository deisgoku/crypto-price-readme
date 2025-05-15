const { Markup } = require('telegraf');
const { redis } = require('../../lib/redis'); // Pastikan sudah konfigurasi redis client benar
const { sendHelp, getFAQContent, getSponsorContent } = require('./help');
const { getAdminMenu, registerAdminActions } = require('./admin');
const { sendSupport, registerSupportActions } = require('./support');

module.exports = function setupMenu(bot) {
  // Daftarkan action tambahan admin & support
  registerAdminActions(bot);
  registerSupportActions(bot);

  // Command start
  bot.command('start', (ctx) => {
    ctx.reply(
      'Selamat datang! Pilih menu di bawah:',
      Markup.inlineKeyboard([
        [Markup.button.callback('📋 Buka Menu', 'menu')],
      ])
    );
  });

  // Action start (callback)
  bot.action('start', async (ctx) => {
    try {
      await ctx.editMessageText(
        'Selamat datang! Pilih menu di bawah:',
        Markup.inlineKeyboard([
          [Markup.button.callback('📋 Buka Menu', 'menu')],
        ])
      );
      await ctx.answerCbQuery();
    } catch (err) {
      // pesan error di log, tapi ga crash
      console.error('Error di action start:', err);
    }
  });

  // Menu utama
  bot.action('menu', async (ctx) => {
    const key = `tg:${ctx.from.id}:menu`;
    try {
      let cached = await redis.get(key);
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
      if (!cached) await redis.setex(key, 600, text); // Cache 10 menit
      await ctx.editMessageText(text, keyboard);
      await ctx.answerCbQuery();
    } catch (err) {
      console.error('Error di menu:', err);
      await ctx.answerCbQuery('Terjadi kesalahan, coba lagi nanti.', { show_alert: true });
    }
  });

  // Admin menu
  bot.action('admin_menu', async (ctx) => {
    const key = `tg:${ctx.from.id}:admin_menu`;
    try {
      let cached = await redis.get(key);
      const text = 'Menu Admin:';
      const buttons = getAdminMenu();
      if (!cached) await redis.setex(key, 600, text);
      await ctx.editMessageText(text, Markup.inlineKeyboard(buttons));
      await ctx.answerCbQuery();
    } catch (err) {
      console.error('Error di admin_menu:', err);
      await ctx.answerCbQuery('Tidak dapat membuka menu admin.', { show_alert: true });
    }
  });

  // Personal menu
  bot.action('personal_menu', async (ctx) => {
    const key = `tg:${ctx.from.id}:personal_menu`;
    try {
      let cached = await redis.get(key);
      const text = 'Pengaturan Pribadi:';
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔗 Hubungkan Akun', 'link')],
        [Markup.button.callback('❌ Putuskan Akun', 'unlink')],
        [Markup.button.callback('🔙 Kembali', 'menu')],
      ]);
      if (!cached) await redis.setex(key, 600, text);
      await ctx.editMessageText(text, keyboard);
      await ctx.answerCbQuery();
    } catch (err) {
      console.error('Error di personal_menu:', err);
      await ctx.answerCbQuery('Tidak dapat membuka pengaturan pribadi.', { show_alert: true });
    }
  });

  // Language menu
  bot.action('language', async (ctx) => {
    const key = `tg:${ctx.from.id}:language`;
    try {
      let cached = await redis.get(key);
      const text = 'Pilih bahasa:';
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🇮🇩 Bahasa Indonesia', 'lang_id')],
        [Markup.button.callback('🇬🇧 English', 'lang_en')],
        [Markup.button.callback('🇪🇸 Español', 'lang_es')],
        [Markup.button.callback('🔙 Kembali', 'menu')],
      ]);
      if (!cached) await redis.setex(key, 600, text);
      await ctx.editMessageText(text, keyboard);
      await ctx.answerCbQuery();
    } catch (err) {
      console.error('Error di language:', err);
      await ctx.answerCbQuery('Gagal membuka pilihan bahasa.', { show_alert: true });
    }
  });

  // Language selection (lang_id, lang_en, lang_es, etc)
  bot.action(/^lang_/, async (ctx) => {
    try {
      // TODO: Simpan preferensi bahasa di DB/cache sesuai kebutuhan
      await ctx.answerCbQuery('Bahasa telah diubah.', { show_alert: true });
      await ctx.editMessageText(
        'Pengaturan bahasa diperbarui.',
        Markup.inlineKeyboard([
          [Markup.button.callback('📋 Kembali ke Menu', 'menu')],
        ])
      );
    } catch (err) {
      console.error('Error di lang_ action:', err);
      await ctx.answerCbQuery('Gagal mengubah bahasa.', { show_alert: true });
    }
  });

  // FAQ
  bot.action('faq', async (ctx) => {
    const key = `tg:${ctx.from.id}:faq`;
    try {
      let text = await redis.get(key);
      if (!text) {
        text = getFAQContent();
        await redis.setex(key, 600, text);
      }
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });
      await ctx.answerCbQuery();
    } catch (err) {
      console.error('Error di faq:', err);
      await ctx.answerCbQuery('Gagal memuat FAQ.', { show_alert: true });
    }
  });

  // Sponsor content
  bot.action('support_back', async (ctx) => {
    const key = `tg:${ctx.from.id}:support_back`;
    try {
      let text = await redis.get(key);
      if (!text) {
        text = getSponsorContent();
        await redis.setex(key, 600, text);
      }
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      });
      await ctx.answerCbQuery();
    } catch (err) {
      console.error('Error di support_back:', err);
      await ctx.answerCbQuery('Gagal memuat sponsor.', { show_alert: true });
    }
  });

  bot.action('sponsor', async (ctx) => {
    const key = `tg:${ctx.from.id}:sponsor`;
    try {
      const cached = await redis.get(key);
      if (!cached) await redis.setex(key, 600, '1');
      await sendSupport(ctx);
      await ctx.answerCbQuery();
    } catch (err) {
      console.error('Error di sponsor:', err);
      await ctx.answerCbQuery('Gagal memuat sponsor.', { show_alert: true });
    }
  });

  // Filter premium
  bot.action('filter', async (ctx) => {
    try {
      await ctx.answerCbQuery('Fitur ini hanya untuk pengguna premium.', { show_alert: true });
    } catch (err) {
      console.error('Error di filter:', err);
    }
  });

  // Miniapp (link only)
  bot.action('miniapp', async (ctx) => {
    try {
      await ctx.answerCbQuery('Buka miniapp melalui link di menu utama.');
    } catch (err) {
      console.error('Error di miniapp:', err);
    }
  });

  // Help command & action
  bot.command('help', sendHelp);

  bot.action('help', async (ctx) => {
    const key = `tg:${ctx.from.id}:help`;
    try {
      const cached = await redis.get(key);
      if (!cached) await redis.setex(key, 600, '1');
      await sendHelp(ctx);
      await ctx.answerCbQuery();
    } catch (err) {
      console.error('Error di help action:', err);
      await ctx.answerCbQuery('Gagal menampilkan bantuan.', { show_alert: true });
    }
  });

  // Admin command
  bot.command('admin', async (ctx) => {
    try {
      await getAdminMenu(ctx);
    } catch (err) {
      console.error('Error di admin command:', err);
    }
  });
};
