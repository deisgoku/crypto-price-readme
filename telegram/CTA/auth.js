const bcrypt = require('bcrypt');
const { redis } = require('../../lib/redis');

const LINK_KEY = 'user_passwords';
const GARAM = parseInt(process.env.GARAM || '10', 10);
const TTL = 300; // cache waktu 5 menit

module.exports = bot => {

  bot.action('link', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    const cacheKey = `cache:auth:link:${userId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return ctx.editMessageText(cached, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '⬅️ Kembali', callback_data: 'personal_menu' }]]
        }
      });
    }

    const message = `Untuk menghubungkan akunmu, kirim perintah berikut:\n\n` +
                    `/link <username> <password>\n\n` +
                    `Contoh:\n/link johndoe 123456`;

    await redis.setex(cacheKey, TTL, message);

    return ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '⬅️ Kembali', callback_data: 'personal_menu' }]]
      }
    });
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
    await redis.hset('tg:linked', userId, normalizedUser);

    ctx.reply(`Berhasil terhubung dengan akun '${username}'`);
  });

  bot.action('unlink', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id.toString();
    const cacheKey = `cache:auth:unlink:${userId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return ctx.editMessageText(cached, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '⬅️ Kembali', callback_data: 'personal_menu' }]]
        }
      });
    }

    await redis.hdel('tg:linked', userId);

    const message = 'Akun Telegram kamu berhasil di-*unlink*.';
    await redis.setex(cacheKey, TTL, message);

    return ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '⬅️ Kembali', callback_data: 'personal_menu' }]]
      }
    });
  });

  bot.command('unlink', async ctx => {
    await redis.hdel('tg:linked', ctx.from.id.toString());
    ctx.reply('Akun Telegram kamu sudah di-unlink.');
  });

  bot.command('me', async ctx => {
    const telegramId = ctx.from.id.toString();
    const linkedUsername = await redis.hget('tg:linked', telegramId);
    ctx.reply(
      linkedUsername
        ? `Akun kamu terhubung ke: *${linkedUsername}*`
        : 'Belum terhubung. Gunakan /link <username> <password>',
      { parse_mode: 'Markdown' }
    );
  });

};
