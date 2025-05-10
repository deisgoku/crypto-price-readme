// telegram/bot.js
// author: deisgoku

const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
const bcrypt = require('bcrypt');
const { BOT_TOKEN, BASE_URL } = require('./config');
const { getCategoryMarkdownList } = require('./gecko');
const { themeNames } = require('../lib/settings/model/theme');
const renderers = require('../lib/settings/model/list');
const { redis } = require('../lib/redis');
const { addAdmin, removeAdmin, isAdmin, listAdmins } = require('./admin');

const LINK_KEY = 'user_passwords';
const USER_SET = 'tg:users';
const GARAM = parseInt(process.env.GARAM || '10', 10);

const bot = new Telegraf(BOT_TOKEN);
const modelsName = Object.keys(renderers);
const themes = themeNames.join('\n');

const tempSession = new Map();

// Fungsi konversi SVG ke PNG menggunakan Puppeteer
async function svgToPng(svg) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent(`<html><body>${svg}</body></html>`);
  const element = await page.$('svg');
  const pngBuffer = await element.screenshot();
  await browser.close();
  return pngBuffer;
}

bot.start(ctx => {
  ctx.reply(
    `Selamat datang di *Crypto Card Bot!*\n\nGunakan /card untuk membuat kartu crypto.\nGunakan /help untuk melihat perintah lain.`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('help', async ctx => {
  const { markdown } = await getCategoryMarkdownList();
  ctx.reply(
    `*Perintah:*
/start - Mulai bot
/help - Bantuan
/card - Buat kartu crypto
/link <username> <password> - Hubungkan akun
/unlink - Putuskan akun
/me - Info akun

*Admin:*
/addadmin <userId>
/removeadmin <userId>
/admins
/broadcast <pesan>

*Kategori:*
${markdown}`,
    { parse_mode: 'Markdown' }
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

bot.command('addadmin', async ctx => {
  const fromId = ctx.from.id.toString();
  if (!(await isAdmin(fromId))) return ctx.reply('Kamu bukan admin.');

  const targetId = ctx.message.text.split(' ')[1];
  if (!targetId) return ctx.reply('Gunakan: /addadmin <userId>');

  await addAdmin(targetId);
  ctx.reply(`Admin ${targetId} ditambahkan.`);
});

bot.command('removeadmin', async ctx => {
  const fromId = ctx.from.id.toString();
  if (!(await isAdmin(fromId))) return ctx.reply('Kamu bukan admin.');

  const targetId = ctx.message.text.split(' ')[1];
  if (!targetId) return ctx.reply('Gunakan: /removeadmin <userId>');

  await removeAdmin(targetId);
  ctx.reply(`Admin ${targetId} dihapus.`);
});

bot.command('admins', async ctx => {
  const fromId = ctx.from.id.toString();
  if (!(await isAdmin(fromId))) return ctx.reply('Kamu bukan admin.');

  const admins = await listAdmins();
  ctx.reply(
    admins.length
      ? `Daftar Admin:\n${admins.map(id => `- ${id}`).join('\n')}`
      : 'Tidak ada admin.'
  );
});

bot.command('broadcast', async ctx => {
  const fromId = ctx.from.id.toString();
  if (!(await isAdmin(fromId))) return ctx.reply('Kamu bukan admin.');

  const message = ctx.message.text.replace('/broadcast', '').trim();
  if (!message) return ctx.reply('Gunakan: /broadcast <pesan>');

  const userIds = await redis.smembers(USER_SET);
  let count = 0;

  for (const uid of userIds) {
    try {
      await ctx.telegram.sendMessage(uid, `\ud83d\udce1 *Broadcast:*\n${message}`, {
        parse_mode: 'Markdown'
      });
      count++;
    } catch (e) {
      console.error(`Gagal kirim ke ${uid}`, e);
    }
  }

  ctx.reply(`Broadcast terkirim ke ${count} user.`);
});

bot.command('card', async ctx => {
  const userId = ctx.from.id.toString();
  tempSession.set(userId, { step: 'model' });

  await ctx.reply('Pilih model:', Markup.inlineKeyboard(
    modelsName.map(m => Markup.button.callback(`\ud83d\uddbc\ufe0f ${m}`, `model:${m}`)),
    { columns: 2 }
  ));
});

bot.on('callback_query', async ctx => {
  const userId = ctx.from.id.toString();
  const session = tempSession.get(userId) || {};
  const data = ctx.callbackQuery.data;

  if (data.startsWith('model:')) {
    session.model = data.split(':')[1];
    session.step = 'theme';
    tempSession.set(userId, session);

    await ctx.editMessageText('Pilih theme:', Markup.inlineKeyboard(
      themeNames.map(t => Markup.button.callback(`\ud83c\udfa8 ${t}`, `theme:${t}`)),
      { columns: 2 }
    ));
    return ctx.answerCbQuery();
  }

  if (data.startsWith('theme:')) {
    session.theme = data.split(':')[1];
    session.step = 'category';
    tempSession.set(userId, session);

    const { categories } = await getCategoryMarkdownList();
    await ctx.editMessageText('Pilih kategori:', Markup.inlineKeyboard(
      categories.map(c => Markup.button.callback(`\ud83d\udcc1 ${c.name}`, `category:${c.category_id}`)),
      { columns: 2 }
    ));
    return ctx.answerCbQuery();
  }

  if (data.startsWith('category:')) {
    const categoryId = data.split(':')[1].trim();
    const { categories } = await getCategoryMarkdownList();
    const category = categories.find(c => c.category_id === categoryId);
    if (!category) {
      return ctx.answerCbQuery('⚠️ Kategori tidak valid.', { show_alert: true });
    }

    session.category = category.category_id;
    session.step = 'coin';
    tempSession.set(userId, session);

    await ctx.editMessageText('Masukkan jumlah coin (1-50):');
    return ctx.answerCbQuery();
  }

  await ctx.answerCbQuery();
});

bot.on('text', async ctx => {
  const userId = ctx.from.id.toString();
  const session = tempSession.get(userId);
  if (!session || session.step !== 'coin') return;

  const input = ctx.message.text.trim();
  const count = parseInt(input);
  if (count < 1 || count > 50) {
    return ctx.reply('Jumlah coin harus antara 1 - 50.');
  }

  session.coin = count;
  session.step = 'done';
  session.username = ctx.from?.username?.trim().toLowerCase() || `tg-${userId}`;

  await redis.set(`card:${userId}`, JSON.stringify(session), { ex: 3600 });
  await redis.sadd(USER_SET, userId);

  const url = `${BASE_URL}?user=${session.username}&model=${session.model}&theme=${session.theme}&coin=${session.coin}&category=${session.category}`;

  try {
    const res = await fetch(url);
    const svg = await res.text();
    const png = await svgToPng(svg);

    await ctx.replyWithPhoto({ source: png }, {
      caption: `\ud83d\uddbc\ufe0f Kartu siap: *${session.model} - ${session.theme}*`,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    console.error('Gagal membuat kartu:', err);
    ctx.reply('Terjadi kesalahan saat membuat kartu.');
  }

  tempSession.delete(userId);
});

module.exports = { bot };
