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

const SESSION_KEY = 'tg:sessions';
const LINK_KEY = 'user_passwords';
const USER_SET = 'tg:users';
const GARAM = parseInt(process.env.GARAM || '10', 10);

const bot = new Telegraf(BOT_TOKEN);
const modelsName = Object.keys(renderers);
const themes = themeNames.join('\n');

// ===== Session Helpers =====

function normalizeUserId(userId) {
  return `tg:${userId.toString().trim()}`;
}

async function getSession(userId) {
  const key = normalizeUserId(userId);
  const raw = await redis.hget(SESSION_KEY, key);
  let session = {};
  try {
    session = raw ? JSON.parse(raw) : {};
  } catch {
    session = {};
  }
  session.username = session.username || key; // fallback
  return session;
}

async function updateSession(userId, newData = {}) {
  const key = normalizeUserId(userId);
  const current = await getSession(userId);
  const updated = { ...current, ...newData };
  await redis.hset(SESSION_KEY, key, JSON.stringify(updated));
  await redis.sadd(USER_SET, key);
  return updated;
}

// ===== Bot Commands =====

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

// ===== Account Linkage =====

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
  
  const normalizedPwd = username.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(password, GARAM);
  await redis.hset(LINK_KEY, { [normalizedPwd]: hashedPassword });
  ctx.reply(`Berhasil terhubung dengan akun '${username}'`);
});

bot.command('unlink', async ctx => {
  await redis.hdel(LINK_KEY, ctx.from.id.toString());
  ctx.reply('Akun Telegram kamu sudah di-unlink.');
});

bot.command('me', async ctx => {
  const telegramUsername = ctx.from?.username?.trim().toLowerCase();

  if (!telegramUsername) {
    return ctx.reply('Username Telegram kamu tidak tersedia atau tidak sama dengan twiter. Pastikan akun Telegram kamu punya username.');
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
      await ctx.telegram.sendMessage(uid, `📡 *Broadcast:*\n${message}`, {
        parse_mode: 'Markdown'
      });
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
  const session = await getSession(userId);
  session.step = 'model';  // Menyimpan state ke 'model'
  await updateSession(userId, session);

  // Kirim pilihan model
  await ctx.reply('Pilih model:', Markup.inlineKeyboard(
    modelsName.map(m => Markup.button.callback(`🖼️ ${m}`, `model:${m}`)),
    { columns: 2 }
  ));
});

bot.on('callback_query', async ctx => {
  const userId = ctx.from.id.toString();
  const session = await getSession(userId);
  const data = ctx.callbackQuery.data;

  // Step 1: Pilih Model
  if (data.startsWith('model:')) {
    session.model = data.split(':')[1]; // Menyimpan pilihan model
    session.step = 'theme';  // Pindah ke step pemilihan theme
    await updateSession(userId, session);

    return ctx.editMessageText('Pilih theme:', Markup.inlineKeyboard(
      themeNames.map(t => Markup.button.callback(`🎨 ${t}`, `theme:${t}`)),
      { columns: 2 }
    ));
  }

  // Step 2: Pilih Theme
  if (data.startsWith('theme:')) {
    session.theme = data.split(':')[1];  // Menyimpan pilihan theme
    session.step = 'category';  // Pindah ke step pemilihan kategori
    await updateSession(userId, session);

    const { categories } = await getCategoryMarkdownList();
    

    return ctx.editMessageText('Pilih kategori:', Markup.inlineKeyboard(
      categories.map(c => Markup.button.callback(`📁 ${c.name}`, `category:${c.category_id}`)),
      { columns: 2 }
    ));
  }

  // Step 3: Pilih Kategori Inline
  if (data.startsWith('category:')) {
  const categoryId = data.split(':')[1].trim();
  const category = categories?.find(c => c.category_id === categoryId);

  if (!category) {
    return ctx.answerCbQuery('⚠️ Kategori tidak valid.', { show_alert: true });
  }

  session.category = category.category_id; // Gunakan category_id untuk ke URL
  session.step = 'coin';
  await updateSession(userId, session);

  return ctx.editMessageText('Masukkan jumlah coin (1-50):');
 }

  await ctx.answerCbQuery();
});

bot.on('text', async ctx => {
  const userId = ctx.from.id.toString();
  const session = await getSession(userId);
  const input = ctx.message.text.trim();

  // Step 4: Pilih Jumlah Coin
  if (session.step === 'coin') {
    const count = parseInt(input);
    if (count < 1 || count > 50) {
      return ctx.reply('Jumlah coin harus antara 1 - 50.');
    }

    session.coin = count;  // Menyimpan jumlah coin
    session.step = 'done';  // Pindah ke step konfirmasi
    await updateSession(userId, session);

    // Ambil URL dan generate kartu
    const { username, model, theme, category: sessionCategory, coin } = session;
    const url = `${BASE_URL}?user=${username}&model=${model}&theme=${theme}&coin=${coin}&category=${sessionCategory}`;

    try {
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

const SESSION_KEY = 'tg:sessions';
const LINK_KEY = 'user_passwords';
const USER_SET = 'tg:users';
const GARAM = parseInt(process.env.GARAM || '10', 10);

const bot = new Telegraf(BOT_TOKEN);
const modelsName = Object.keys(renderers);
const themes = themeNames.join('\n');

// ===== Session Helpers =====

async function getSession(userId) {
  const raw = await redis.get(SESSION_KEY + userId);
  let session = {};
  try {
    session = raw ? JSON.parse(raw) : {};
  } catch {
    session = {};
  }
  session.username = await redis.get(USER_SET + userId) || `tg-${userId}`;
  return session;
}

async function setSession(userId, data) {
  await redis.set(SESSION_KEY + userId, JSON.stringify(data), { ex: 3600 });
  await redis.sadd(USER_SET, userId);
}


async function updateSession(userId, newData) {
  const current = await getSession(userId);
  const updated = { ...current, ...newData };
  await setSession(userId, updated);
}

// ===== Bot Commands =====

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

// ===== Account Linkage =====

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
  
  const normalizedPwd = username.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(password, GARAM);
  await redis.hset(LINK_KEY, { [normalizedPwd]: hashedPassword });
  ctx.reply(`Berhasil terhubung dengan akun '${username}'`);
});

bot.command('unlink', async ctx => {
  await redis.hdel(LINK_KEY, ctx.from.id.toString());
  ctx.reply('Akun Telegram kamu sudah di-unlink.');
});

bot.command('me', async ctx => {
  const telegramUsername = ctx.from?.username?.trim().toLowerCase();

  if (!telegramUsername) {
    return ctx.reply('Username Telegram kamu tidak tersedia atau tidak sama dengan twiter. Pastikan akun Telegram kamu punya username.');
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
      await ctx.telegram.sendMessage(uid, `📡 *Broadcast:*\n${message}`, {
        parse_mode: 'Markdown'
      });
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
  const session = await getSession(userId);
  session.step = 'model';  // Menyimpan state ke 'model'
  await updateSession(userId, session);

  // Kirim pilihan model
  await ctx.reply('Pilih model:', Markup.inlineKeyboard(
    modelsName.map(m => Markup.button.callback(`🖼️ ${m}`, `model:${m}`)),
    { columns: 2 }
  ));
});

bot.on('callback_query', async ctx => {
  const userId = ctx.from.id.toString();
  const session = await getSession(userId);
  const data = ctx.callbackQuery.data;

  // Step 1: Pilih Model
  if (data.startsWith('model:')) {
    session.model = data.split(':')[1]; // Menyimpan pilihan model
    session.step = 'theme';  // Pindah ke step pemilihan theme
    await updateSession(userId, session);

    return ctx.editMessageText('Pilih theme:', Markup.inlineKeyboard(
      themeNames.map(t => Markup.button.callback(`🎨 ${t}`, `theme:${t}`)),
      { columns: 2 }
    ));
  }

  // Step 2: Pilih Theme
  if (data.startsWith('theme:')) {
    session.theme = data.split(':')[1];  // Menyimpan pilihan theme
    session.step = 'category';  // Pindah ke step pemilihan kategori
    await updateSession(userId, session);

    const { categories } = await getCategoryMarkdownList();
    

    return ctx.editMessageText('Pilih kategori:', Markup.inlineKeyboard(
      categories.map(c => Markup.button.callback(`📁 ${c.name}`, `category:${c.category_id}`)),
      { columns: 2 }
    ));
  }

  // Step 3: Pilih Kategori Inline
  if (data.startsWith('category:')) {
  const categoryId = data.split(':')[1].trim();
  const category = categories?.find(c => c.category_id === categoryId);

  if (!category) {
    return ctx.answerCbQuery('⚠️ Kategori tidak valid.', { show_alert: true });
  }

  session.category = category.category_id; // Gunakan category_id untuk ke URL
  session.step = 'coin';
  await updateSession(userId, session);

  return ctx.editMessageText('Masukkan jumlah coin (1-50):');
 }

  await ctx.answerCbQuery();
});

bot.on('text', async ctx => {
  const userId = ctx.from.id.toString();
  const session = await getSession(userId);
  const input = ctx.message.text.trim();

  // Step 4: Pilih Jumlah Coin
  if (session.step === 'coin') {
    const count = parseInt(input);
    if (count < 1 || count > 50) {
      return ctx.reply('Jumlah coin harus antara 1 - 50.');
    }

    session.coin = count;  // Menyimpan jumlah coin
    session.step = 'done';  // Pindah ke step konfirmasi
    await updateSession(userId, session);

    // Ambil URL dan generate kartu
    const { username, model, theme, category: sessionCategory, coin } = session;
    const url = `${BASE_URL}?user=${username}&model=${model}&theme=${theme}&coin=${coin}&category=${sessionCategory}`;

    try {
      const res = await fetch(url);
      const svg = await res.text();
      const resvg = new Resvg(svg);
      const png = resvg.render().asPng();

      // Kirim foto kartu ke pengguna
      await ctx.replyWithPhoto({ source: png }, {
        caption: `🖼️ Kartu siap: *${model} - ${theme}*`,
        parse_mode: 'Markdown'
      });
    } catch (err) {
      console.error(err);
      return ctx.reply('Gagal ambil kartu. Coba lagi nanti.');
    }
  }
});

module.exports = { bot };
