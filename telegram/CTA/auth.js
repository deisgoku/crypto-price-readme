// telegram/CTA/auth.js

const bcrypt = require('bcrypt');
const { redis } = require('../lib/redis');

const LINK_KEY = 'user_passwords';
const GARAM = parseInt(process.env.GARAM || '10', 10);

module.exports = bot => {
	  bot.action('link', (ctx) => {
  ctx.editMessageText(
    `Untuk menghubungkan akunmu, kirim perintah berikut:\n\n` +
    `/link <username> <password>\n\n` +
    `Contoh:\n/link johndoe 123456`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '⬅️ Kembali', callback_data: 'personal_menu' }]
        ]
      }
    }
  );
});

  bot.command('link', async ctx => {
    const userId = ctx.from.id.toString();
    const [_, username, password] = ctx.message.text.trim().split(' ');

    if (!username || !password) {
      return ctx.reply('Format: /link <username> <password>');
    }

    const normalizedUser = username.trim().toLowerCase();
    const storedHashedPassword = await redis.hget(LINK_KEY, normalizedUser);

    if (!storedHashedPassword) {
      return ctx.reply('Username tidak ditemukan.');
    }

    const match = await bcrypt.compare(password, storedHashedPassword);
    if (!match) {
      return ctx.reply('Password salah.');
    }

    const hashedPassword = await bcrypt.hash(password, GARAM);
    await redis.hset(LINK_KEY, { [normalizedUser]: hashedPassword });
    ctx.reply(`Berhasil terhubung dengan akun '${username}'`);
  });

bot.action('unlink', async (ctx) => {
  const userId = ctx.from.id.toString();
  await redis.hdel('tg:linked', userId); // pastikan nama LINK_KEY sesuai
  await ctx.editMessageText('Akun Telegram kamu berhasil di-*unlink*.', {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '⬅️ Kembali', callback_data: 'personal_menu' }]
      ]
    }
  });
});


  bot.command('unlink', async ctx => {
    await redis.hdel(LINK_KEY, ctx.from.id.toString());
    ctx.reply('Akun Telegram kamu sudah di-unlink.');
  });

  bot.command('me', async ctx => {
    const telegramUsername = ctx.from?.username?.trim().toLowerCase();
    if (!telegramUsername) {
      return ctx.reply('Username Telegram kamu tidak tersedia.');
    }

    const allUsernames = await redis.hkeys(LINK_KEY);
    const isLinked = allUsernames.includes(telegramUsername);
    ctx.reply(
      isLinked
        ? `Akun kamu terhubung ke: *${telegramUsername}*`
        : 'Belum terhubung. Gunakan /link <username> <password>',
      { parse_mode: 'Markdown' }
    );
  });
};
