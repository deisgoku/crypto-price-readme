// telegram/menu.js

const { Markup } = require('telegraf');
const { sendHelp } = require('./telegram/help');
const { getAdminMenu, registerAdminActions } = require('./admin');
const { sendSupport, registerSupportActions } = require('./support');


module.exports = function setupMenu(bot) {
  registerAdminActions(bot);
  registerSupportActions(bot);
  require('./auth')(bot);
  

  // /start
  bot.command('start', (ctx) => {
    ctx.reply(ctx.i18n.t('start.welcome'), {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(ctx.i18n.t('menu.button'), 'menu')]
      ])
    });
  });

  // Callback: start ulang
  bot.action('start', (ctx) => {
    ctx.editMessageText(ctx.i18n.t('start.welcome'), {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(ctx.i18n.t('menu.button'), 'menu')]
      ])
    });
  });

  // Menu utama
  bot.action('menu', (ctx) => {
    ctx.editMessageText(ctx.i18n.t('menu.title'), {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(ctx.i18n.t('menu.admin'), 'admin_menu')],
        [Markup.button.callback(ctx.i18n.t('menu.personal'), 'personal_menu')],
        [Markup.button.callback(ctx.i18n.t('menu.faq'), 'faq')],
        [Markup.button.callback(ctx.i18n.t('menu.help'), 'help')],
        [Markup.button.callback(ctx.i18n.t('menu.sponsor'), 'sponsor')],
        [Markup.button.callback(ctx.i18n.t('menu.filter'), 'filter')],
        [Markup.button.callback(ctx.i18n.t('menu.language'), 'language')],
        [Markup.button.url(ctx.i18n.t('menu.app'), 'https://crypto-price-on.vercel.app/unlock?ref=telegram')]
        [Markup.button.callback(ctx.i18n.t('back'), 'start')]
      ])
    });
  });

  // Admin Menu
  bot.action('admin_menu', async (ctx) => {
    const fromId = ctx.from.id.toString();
    if (!(await isAdmin(fromId))) {
      return ctx.answerCbQuery(ctx.i18n.t('error.not_admin'), { show_alert: true });
    }

    ctx.editMessageText(ctx.i18n.t('admin.title'), {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(ctx.i18n.t('admin.add'), 'add_admin')],
        [Markup.button.callback(ctx.i18n.t('admin.remove'), 'remove_admin')],
        [Markup.button.callback(ctx.i18n.t('admin.broadcast'), 'broadcast')],
        [Markup.button.callback(ctx.i18n.t('admin.list'), 'list_admins')],
        [Markup.button.callback(ctx.i18n.t('back'), 'menu')]
      ])
    });
  });

  // Personal Menu
  bot.action('personal_menu', (ctx) => {
    ctx.editMessageText(ctx.i18n.t('personal.title'), {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(ctx.i18n.t('personal.link'), 'link')],
        [Markup.button.callback(ctx.i18n.t('personal.unlink'), 'unlink')],
        [Markup.button.callback(ctx.i18n.t('back'), 'menu')]
      ])
    });
  });

  // Language selector
  bot.action('language', (ctx) => {
    ctx.editMessageText(ctx.i18n.t('language.choose'), {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('🇮🇩 Bahasa Indonesia', 'lang_id')],
        [Markup.button.callback('🇬🇧 English', 'lang_en')],
        [Markup.button.callback('🇪🇸 Español', 'lang_es')],
        [Markup.button.callback(ctx.i18n.t('back'), 'menu')]
      ])
    });
  });

  // Ganti bahasa
  bot.action(/^lang_/, (ctx) => {
    const langCode = ctx.callbackQuery.data.split('_')[1];
    ctx.i18n.locale(langCode);

    ctx.answerCbQuery(ctx.i18n.t(`language.changed_${langCode}`), { show_alert: true });
    ctx.editMessageText(ctx.i18n.t('language.success'), {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(ctx.i18n.t('back_to_menu'), 'menu')]
      ])
    });
  });

  // Placeholder
  bot.action('faq', (ctx) => ctx.answerCbQuery(ctx.i18n.t('faq.placeholder')));
  
  
    // Aksi untuk tombol sponsor
  bot.action('sponsor', (ctx) => {
    ctx.answerCbQuery(ctx.i18n.t('sponsor.placeholder'));
    sendSupport(ctx);  
  });
}
bot.action('support_back', async (ctx) => {
    await sendSupport(ctx);
  });
  
  bot.action('filter', (ctx) => ctx.answerCbQuery(ctx.i18n.t('filter.premium')));
  bot.action('miniapp', (ctx) => ctx.answerCbQuery(ctx.i18n.t('miniapp.app')));

  bot.command('help', sendHelp);
  bot.action('help', async (ctx) => {
    await ctx.answerCbQuery();
    await sendHelp(ctx);
  });

  // Admin Command via /admin
  bot.command('admin', async (ctx) => {
    const fromId = ctx.from.id.toString();
    if (!(await isAdmin(fromId))) {
      return ctx.reply(ctx.i18n.t('error.not_admin'));
    }

    ctx.reply(ctx.i18n.t('admin.title'), Markup.inlineKeyboard(getAdminMenu()));
  });
};
