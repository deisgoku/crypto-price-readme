// telegram/bot.js
// author: deisgoku

const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');
const { Resvg } = require('@resvg/resvg-js');
const bcrypt = require('bcrypt');
const { BOT_TOKEN, BASE_URL } = require('./config');
const { getCategoryMarkdownList } = require('./gecko');
const { themeNames } = require('../lib/settings/model/theme');
const renderers = require('../lib/settings/model/list');
const { redis } = require('../lib/redis');
const { addAdmin, removeAdmin, isAdmin, listAdmins } = require('./admin');

const SESSION_KEY = 'tg:sessions'; // Redis Hash
const LINK_KEY = 'tg:links';       // Redis Hash
const USER_SET = 'tg:users';

const bot = new Telegraf(BOT_TOKEN);
const modelsName = Object.keys(renderers);
const themes = themeNames.join('\n');

// ===== Session Helpers =====

async function getSession(userId) {
  const raw = await redis.hget(SESSION_KEY, userId);
  let session = {};
  try {
    session = raw ? JSON.parse(raw) : {};
  } catch {
    session = {};
  }
  session.username = await redis.hget(LINK_KEY, userId) || `tg-${userId}`;
  return session;
}

async function updateSession(userId, newData) {
  const current = await getSession(userId);
  const updated = { ...current, ...newData };
  await redis.hset(SESSION_KEY, userId, JSON.stringify(updated));
  await redis.sadd(USER_SET, userId);
}

// ===== Bot Commands =====

bot.start(ctx => {
  ctx.reply(`Selamat datang di *Crypto Card Bot!*\n\nGunakan /card untuk membuat kartu crypto.\nGunakan /help untuk melihat perintah lain.`, { parse_mode: 'Markdown' });
});

bot.command('help', async ctx => {
  const { markdown } = await getCategoryMarkdownList();
  ctx.reply(`*Perintah:*
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
${markdown}`, { parse_mode: 'Markdown' });
});

// ===== Account Linkage =====

bot.command('link', async ctx => {
  const userId = ctx.from.id.toString();
  const [_, username, password] = ctx.message.text.trim().split(' ');
  if (!username || !password) return ctx.reply('Format: /link <username> <password>');

  const hash = await redis.get(`user:${username}`);
  if (!hash) return ctx.reply('Username tidak ditemukan.');
  if (!(await bcrypt.compare(password, hash))) return ctx.reply('Password salah.');

  await redis.hset(LINK_KEY, userId, username);
  ctx.reply(`Berhasil terhubung dengan akun '${username}'`);
});

bot.command('unlink', async ctx => {
  await redis.hdel(LINK_KEY, ctx.from.id.toString());
  ctx.reply('Akun Telegram kamu sudah di-unlink.');
});

bot.command('me', async ctx => {
  const username = await redis.hget(LINK_KEY, ctx.from.id.toString());
  ctx.reply(username
    ? `Akun kamu terhubung ke: *${username}*`
    : 'Belum terhubung. Gunakan /link <username> <password>', { parse_mode: 'Markdown' });
});

// ===== Admin Commands =====

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
  ctx.reply(admins.length ? `Daftar Admin:\n${admins.map(id => `- ${id}`).join('\n')}` : 'Tidak ada admin.');
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
      await ctx.telegram.sendMessage(uid, `📡 *Broadcast:*\n${message}`, { parse_mode: 'Markdown' });
      count++;
    } catch (e) {
      console.error(`Gagal kirim ke ${uid}`, e);
    }
  }
  ctx.reply(`Broadcast terkirim ke ${count} user.`);
});

// ===== Card Creation Flow =====

bot.command('card', async ctx => {
  const userId = ctx.from.id.toString();
  await updateSession(userId, { step: 'model' });
  ctx.reply('Pilih model:', Markup.inlineKeyboard(
    modelsName.map(m => Markup.button.callback(`🖼️ ${m}`, `model:${m}`)),
    { columns: 2 }
  ));
});

bot.on('callback_query', async ctx => {
  const userId = ctx.from.id.toString();
  const session = await getSession(userId);
  const data = ctx.callbackQuery.data;

  if (data.startsWith('model:')) {
    await updateSession(userId, { model: data.split(':')[1], step: 'theme' });
    return ctx.editMessageText('Pilih theme:', Markup.inlineKeyboard(
      themeNames.map(t => Markup.button.callback(`🎨 ${t}`, `theme:${t}`)),
      { columns: 2 }
    ));
  }

  if (data.startsWith('theme:')) {
    const theme = data.split(':')[1];
    const { categories } = await getCategoryMarkdownList();
	const allowed = categories.map(c => c.name);	
	await updateSession(userId, { theme, allowedCategories: allowed, step: 'category' });

    return ctx.editMessageText('Pilih kategori:', Markup.inlineKeyboard(
      categories.map(c => Markup.button.callback(`📁 ${c.name}`, `category:${c.name}`)),
      { columns: 2 }
    ));
  }

  if (data.startsWith('category:')) {
    const category = data.split(':')[1];
    const valid = session.allowedCategories?.includes(category);

    if (!valid) return ctx.answerCbQuery('Kategori tidak valid.');

    await updateSession(userId, { category, step: 'coin' });
    return ctx.editMessageText('Masukkan jumlah coin (1-50):');
  }

  ctx.answerCbQuery();
});

bot.on('text', async ctx => {
  const userId = ctx.from.id.toString();
  const session = await getSession(userId);
  const input = ctx.message.text.trim();

  if (session.step === 'coin') {
    const count = parseInt(input);
    if (isNaN(count) || count < 1 || count > 50) {
      return ctx.reply('Jumlah coin harus antara 1 - 50.');
    }

    await updateSession(userId, { coin: count, step: 'done' });

    const { username, model, theme, category } = session;
    const url = `${BASE_URL}?user=${username}&model=${model}&theme=${theme}&coin=${count}&category=${category}`;

    try {
      const res = await fetch(url);
      const svg = await res.text();
      const resvg = new Resvg(svg);
      const png = resvg.render().asPng();

      await ctx.replyWithPhoto({ source: png }, {
        caption: `🖼️ Kartu siap: *${model} - ${theme}*`,
        parse_mode: 'Markdown'
      });
    } catch (err) {
      console.error(err);
      ctx.reply('Gagal mengambil kartu. Coba lagi nanti.');
    }
  }
});

module.exports = { bot };
