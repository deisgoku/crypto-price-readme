const bcrypt = require('bcrypt');
const { redis } = require('../lib/redis');

const LINK_KEY = 'user_passwords';
const GARAM = parseInt(process.env.GARAM || '10', 10);

module.exports = bot => {
  bot.action('link', (ctx) => {
    ctx.editMessageText(
      `${ctx.i18n.t('auth.link_instructions')}\n\n` +
      `/link <username> <password>\n\n` +
      `${ctx.i18n.t('auth.link_example')}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: ctx.i18n.t('auth.back_button'), callback_data: 'personal_menu' }]
          ]
        }
      }
    );
  });

  bot.command('link', async ctx => {
    const userId = ctx.from.id.toString();
    const [_, username, password] = ctx.message.text.trim().split(' ');

    if (!username || !password) {
      return ctx.reply(ctx.i18n.t('auth.link_format'));
    }

    const normalizedUser = username.trim().toLowerCase();
    const storedHashedPassword = await redis.hget(LINK_KEY, normalizedUser);

    if (!storedHashedPassword) {
      return ctx.reply(ctx.i18n.t('auth.username_not_found'));
    }

    const match = await bcrypt.compare(password, storedHashedPassword);
    if (!match) {
      return ctx.reply(ctx.i18n.t('auth.password_incorrect'));
    }

    const hashedPassword = await bcrypt.hash(password, GARAM);
    await redis.hset(LINK_KEY, { [normalizedUser]: hashedPassword });
    ctx.reply(`${ctx.i18n.t('auth.link_success')} '${username}'`);
  });

  bot.action('unlink', async (ctx) => {
    const userId = ctx.from.id.toString();
    await redis.hdel('tg:linked', userId); // pastikan nama LINK_KEY sesuai
    await ctx.editMessageText(ctx.i18n.t('auth.unlink_success'), {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: ctx.i18n.t('auth.back_button'), callback_data: 'personal_menu' }]
        ]
      }
    });
  });

  bot.command('unlink', async ctx => {
    await redis.hdel(LINK_KEY, ctx.from.id.toString());
    ctx.reply(ctx.i18n.t('auth.unlink_reply'));
  });

  bot.command('me', async ctx => {
    const telegramUsername = ctx.from?.username?.trim().toLowerCase();
    if (!telegramUsername) {
      return ctx.reply(ctx.i18n.t('auth.username_not_available'));
    }

    const allUsernames = await redis.hkeys(LINK_KEY);
    const isLinked = allUsernames.includes(telegramUsername);
    ctx.reply(
      isLinked
        ? `${ctx.i18n.t('auth.linked_to')} *${telegramUsername}*`
        : ctx.i18n.t('auth.not_linked'),
      { parse_mode: 'Markdown' }
    );
  });
};
