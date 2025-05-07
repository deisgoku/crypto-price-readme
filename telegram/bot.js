// telegram/bot.js
// author : deisgoku

const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');
const { Resvg } = require('@resvg/resvg-js');
const bcrypt = require('bcrypt');
const { BOT_TOKEN, BASE_URL, WEBHOOK_URL } = require('./config');
const { models, themes } = require('./lists');
const { getGeckoCategories } = require('./gecko');
const { redis } = require('../lib/redis');
const { addAdmin, removeAdmin, isAdmin, listAdmins } = require('./admin');

const SESSION_PREFIX = 'tg:session:';
const LINK_PREFIX = 'tg:link:';
const USER_SET = 'tg:users';

const bot = new Telegraf(BOT_TOKEN);

// ==========================
// Session helpers
async function getSession(userId) {
  const raw = await redis.get(SESSION_PREFIX + userId);
  let session = raw ? JSON.parse(raw) : {};
  session.username = await redis.get(LINK_PREFIX + userId) || `tg-${userId}`;
  return session;
}

async function setSession(userId, data) {
  await redis.set(SESSION_PREFIX + userId, JSON.stringify(data), { ex: 3600 });
  await redis.sadd(USER_SET, userId);
}

// ==========================
// General Commands

bot.start(ctx => {
  ctx.reply(
    `Selamat datang di *Crypto Card Bot!*\n\nGunakan /card untuk membuat kartu crypto.\nGunakan /help untuk melihat perintah lain.`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('help', ctx => {
  ctx.replyWithMarkdown(
    `*Daftar Perintah:*
/start - Mulai bot
/help - Bantuan
/card - Buat kartu crypto
/link <username> <password> - Hubungkan akun
/unlink - Putuskan akun
/me - Lihat akun terhubung

*Admin Commands:*
/addadmin <userId> - Tambah admin
/removeadmin <userId> - Hapus admin
/admins - Lihat semua admin
/broadcast <pesan> - Kirim pesan ke semua user`
  );
});

// ==========================
// Link & User Account

bot.command('link', async ctx => {
  const userId = ctx.from.id.toString();
  const args = ctx.message.text.split(' ').slice(1);
  const [username, password] = args;

  if (!username || !password) return ctx.reply('Format: /link <username> <password>');

  const hash = await redis.get(`user:${username}`);
  if (!hash) return ctx.reply('Username tidak ditemukan.');
  const valid = await bcrypt.compare(password, hash);
  if (!valid) return ctx.reply('Password salah.');

  await redis.set(LINK_PREFIX + userId, username);
  ctx.reply(`Berhasil terhubung dengan akun '${username}'`);
});

bot.command('unlink', async ctx => {
  const userId = ctx.from.id.toString();
  await redis.del(LINK_PREFIX + userId);
  ctx.reply('Akun Telegram kamu sudah di-unlink.');
});

bot.command('me', async ctx => {
  const userId = ctx.from.id.toString();
  const linkedUsername = await redis.get(LINK_PREFIX + userId);
  if (linkedUsername) {
    ctx.reply(`Akun kamu terhubung ke: *${linkedUsername}*`, { parse_mode: 'Markdown' });
  } else {
    ctx.reply('Kamu belum menghubungkan akun. Gunakan /link <username> <password>');
  }
});

// ==========================
// Admin Commands

bot.command('addadmin', async ctx => {
  const fromId = ctx.from.id.toString();
  if (!(await isAdmin(fromId))) return ctx.reply('Kamu bukan admin.');

  const targetId = ctx.message.text.split(' ')[1];
  if (!targetId) return ctx.reply('Gunakan: /addadmin <userId>');

  await addAdmin(targetId);
  ctx.reply(`Admin ${targetId} berhasil ditambahkan.`);
});

bot.command('removeadmin', async ctx => {
  const fromId = ctx.from.id.toString();
  if (!(await isAdmin(fromId))) return ctx.reply('Kamu bukan admin.');

  const targetId = ctx.message.text.split(' ')[1];
  if (!targetId) return ctx.reply('Gunakan: /removeadmin <userId>');

  await removeAdmin(targetId);
  ctx.reply(`Admin ${targetId} berhasil dihapus.`);
});

bot.command('admins', async ctx => {
  const fromId = ctx.from.id.toString();
  if (!(await isAdmin(fromId))) return ctx.reply('Kamu bukan admin.');

  const admins = await listAdmins();
  ctx.reply(admins.length ? `Daftar Admin:\n${admins.map(id => `- ${id}`).join('\n')}` : 'Belum ada admin.');
});

bot.command('broadcast', async ctx => {
  const fromId = ctx.from.id.toString();
  if (!(await isAdmin(fromId))) return ctx.reply('Kamu bukan admin.');

  const message = ctx.message.text.replace('/broadcast', '').trim();
  if (!message) return ctx.reply('Gunakan: /broadcast <pesan kamu>');

  const userIds = await redis.smembers(USER_SET);
  let success = 0;
  for (const uid of userIds) {
    try {
      await ctx.telegram.sendMessage(uid, `📢 *Broadcast:*\n${message}`, { parse_mode: 'Markdown' });
      success++;
    } catch (err) {
      console.error(`Gagal kirim ke ${uid}`, err);
    }
  }

  ctx.reply(`Broadcast terkirim ke ${success} user.`);
});

// ==========================
// Card Flow

bot.command('card', async ctx => {
  const userId = ctx.from.id.toString();
  const session = await getSession(userId);
  session.step = 'model';
  await setSession(userId, session);

  await ctx.reply('Pilih model:', Markup.inlineKeyboard(
    models.map(m => Markup.button.callback(m, `model:${m}`)), { columns: 2 }
  ));
});

bot.on('callback_query', async ctx => {
  const userId = ctx.from.id.toString();
  const data = ctx.callbackQuery.data;
  const session = await getSession(userId);

  if (data.startsWith('model:')) {
    session.model = data.split(':')[1];
    session.step = 'theme';
    await setSession(userId, session);
    return ctx.editMessageText('Pilih theme:', Markup.inlineKeyboard(
      themes.map(t => Markup.button.callback(t, `theme:${t}`)), { columns: 2 }
    ));
  }

  if (data.startsWith('theme:')) {
    session.theme = data.split(':')[1];
    session.step = 'category';
    const categories = await getGeckoCategories();
    session.allCategories = categories;
    await setSession(userId, session);
    return ctx.editMessageText('Pilih kategori:', Markup.inlineKeyboard(
      categories.map(c => Markup.button.callback(`cat:${c}`, `cat:${c}`)), { columns: 2 }
    ));
  }

  if (data.startsWith('cat:')) {
    session.category = data.split(':')[1];
    session.step = 'coin';
    await setSession(userId, session);
    return ctx.editMessageText('Masukkan jumlah coin (1-50)');
  }

  await ctx.answerCbQuery();
});

bot.on('text', async ctx => {
  const userId = ctx.from.id.toString();
  const session = await getSession(userId);

  if (session.step === 'coin') {
    const coin = parseInt(ctx.message.text.trim());
    if (isNaN(coin) || coin < 1 || coin > 50) return ctx.reply('Jumlah coin harus antara 1-50 bro!');

    session.coin = coin;
    session.step = 'done';
    await setSession(userId, session);

    const { username, model, theme, category } = session;
    const url = `${BASE_URL}?user=${username}&model=${model}&theme=${theme}&coin=${coin}&category=${category}`;

    try {
      const res = await fetch(url);
      const svg = await res.text();
      const resvg = new Resvg(svg);
      const png = resvg.render().asPng();

      await ctx.replyWithPhoto({ source: png }, {
        caption: `✅ Kartu berhasil dibuat: *${model} - ${theme}*`,
        parse_mode: 'Markdown'
      });
    } catch (err) {
      console.error(err);
      ctx.reply('Gagal ambil kartu bro. Coba lagi nanti!');
    }
  }
});

// ==========================

module.exports = { bot };
