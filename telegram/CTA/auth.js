// telegram/CTA/auth.js
const {
  loginUser,
  isRegistered
} = require('../lib/follow-check');

module.exports = bot => {

  bot.command('link', async ctx => {
    const [_, username, password] = ctx.message.text.trim().split(' ');
    if (!username || !password) {
      return ctx.reply('Format: /link <username> <password>');
    }

    const result = await loginUser(username, password);
    if (result.status !== 'success') {
      return ctx.reply(result.error || 'Gagal login.');
    }

    await redis.hset('tg:linked', ctx.from.id.toString(), username.trim().toLowerCase());
    ctx.reply(`Berhasil menghubungkan akun ke: *${username}*`, { parse_mode: 'Markdown' });
  });

  bot.command('unlink', async ctx => {
    await redis.hdel('tg:linked', ctx.from.id.toString());
    ctx.reply('Akun Telegram kamu sudah di-unlink.');
  });

  bot.command('me', async ctx => {
    const linked = await redis.hget('tg:linked', ctx.from.id.toString());
    ctx.reply(
      linked
        ? `Akun kamu terhubung ke: *${linked}*`
        : 'Belum terhubung. Gunakan /link <username> <password>',
      { parse_mode: 'Markdown' }
    );
  });

  bot.action('link', ctx => {
    ctx.editMessageText(
      `Untuk menghubungkan akunmu, kirim perintah:\n\n` +
      `/link <username> <password>`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Kembali', callback_data: 'personal_menu' }]
          ]
        }
      }
    );
  });

  bot.action('unlink', async ctx => {
    await redis.hdel('tg:linked', ctx.from.id.toString());
    await ctx.editMessageText('Akun Telegram kamu berhasil di-*unlink*.', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '⬅️ Kembali', callback_data: 'personal_menu' }]
        ]
      }
    });
  });
};
