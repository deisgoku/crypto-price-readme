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
const {
  getSession,
  setSession,
  setField,
  getField,
  USER_SET,
} = require('./session');

const LINK_PREFIX = 'tg:link:';
const bot = new Telegraf(BOT_TOKEN);

const modelsName = Object.keys(renderers);
const themes = themeNames.join('\n');

// ===== Temp Memory for State Tracking =====
const tempSessionMap = new Map();

function getTempSession(userId) {
  return tempSessionMap.get(userId) || { step: 'model' };
}

function updateTempSession(userId, data) {
  tempSessionMap.set(userId, { ...getTempSession(userId), ...data });
}

// ===== Commands =====

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

bot.command('link', async ctx => {
  const userId = ctx.from.id.toString();
  const [username, password] = ctx.message.text.split(' ').slice(1);
  if (!username || !password) return ctx.reply('Format: /link <username> <password>');

  const hash = await redis.get(`user:${username}`);
  if (!hash) return ctx.reply('Username tidak ditemukan.');
  if (!(await bcrypt.compare(password, hash))) return ctx.reply('Password salah.');

  await redis.set(LINK_PREFIX + userId, username);
  await setField(userId, 'username', username);
  ctx.reply(`Berhasil terhubung dengan akun '${username}'`);
});

bot.command('unlink', async ctx => {
  await redis.del(LINK_PREFIX + ctx.from.id.toString());
  ctx.reply('Akun Telegram kamu sudah di-unlink.');
});

bot.command('me', async ctx => {
  const linkedUsername = await redis.get(LINK_PREFIX + ctx.from.id.toString());
  ctx.reply(linkedUsername
    ? `Akun kamu terhubung ke: *${linkedUsername}*`
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

// ===== Card Flow =====

bot.command('card', async ctx => {
  const userId = ctx.from.id.toString();
  updateTempSession(userId, { step: 'model' });

  await ctx.reply('Pilih model:', Markup.inlineKeyboard(
    modelsName.map(m => Markup.button.callback(`🖼️ ${m}`, `model:${m}`)), { columns: 2 }
  ));
});

bot.on('callback_query', async ctx => {
  const userId = ctx.from.id.toString();
  const temp = getTempSession(userId);
  const data = ctx.callbackQuery.data;

  if (data.startsWith('model:')) {
    const model = data.split(':')[1];
    await setField(userId, 'model', model);
    updateTempSession(userId, { step: 'theme' });

    return ctx.editMessageText('Pilih theme:', Markup.inlineKeyboard(
      themeNames.map(t => Markup.button.callback(`🎨 ${t}`, `theme:${t}`)), { columns: 2 }
    ));
  }

  if (data.startsWith('theme:')) {
    const theme = data.split(':')[1];
    await setField(userId, 'theme', theme);
    updateTempSession(userId, { step: 'category' });

    const { categories } = await getCategoryMarkdownList();
    return ctx.editMessageText('Pilih kategori:', Markup.inlineKeyboard(
      categories.map(c => Markup.button.callback(`📁 ${c.name}`, `category:${c.category_id}`)), { columns: 2 }
    ));
  }

  if (data.startsWith('category:')) {
    const category = data.split(':')[1];
    await setField(userId, 'category', category);
    updateTempSession(userId, { step: 'coin' });

    return ctx.editMessageText('Masukkan jumlah coin (1-50):');
  }

  await ctx.answerCbQuery();
});

bot.on('text', async ctx => {
  const userId = ctx.from.id.toString();
  const temp = getTempSession(userId);
  if (temp.step !== 'coin') return;

  const input = ctx.message.text.trim();
  const count = parseInt(input);
  if (isNaN(count) || count < 1 || count > 50) {
    return ctx.reply('Jumlah coin harus antara 1 - 50.');
  }

  await setField(userId, 'coin', count);

  let username = await getField(userId, 'username');
  if (!username) {
    const linked = await redis.get(LINK_PREFIX + userId);
    username = linked || `tg-${userId}`;
    await setField(userId, 'username', username);
  }

  const [model, theme, category] = await Promise.all([
    getField(userId, 'model'),
    getField(userId, 'theme'),
    getField(userId, 'category'),
  ]);

  const url = `${BASE_URL}?user=${username}&model=${model}&theme=${theme}&coin=${count}&category=${category}`;
  try {
    const res = await fetch(url);
    const svg = await res.text();
    const resvg = new Resvg(svg);
    const png = resvg.render().asPng();

    await ctx.replyWithPhoto({ source: png }, {
      caption: `🖼️ *Crypto Card*\nModel: ${model}\nTheme: ${theme}\nCoin: ${count}\nKategori: ${category}`,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    console.error(err);
    ctx.reply('Gagal mengambil gambar kartu.');
  }
});

module.exports = bot;
