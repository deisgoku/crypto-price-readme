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

const SESSION_PREFIX = 'tg:session:';
const LINK_PREFIX = 'tg:link:';
const USER_SET = 'tg:users';

const bot = new Telegraf(BOT_TOKEN);

// Define available themes and models
const themes = themeNames.join('\n');
const modelsName = Object.keys(renderers);

// ===== Session Helpers =====

async function getSession(userId) {
  const raw = await redis.get(SESSION_PREFIX + userId);
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function setSession(userId, data) {
  await redis.set(SESSION_PREFIX + userId, JSON.stringify(data), { ex: 3600 });
  await redis.sadd(USER_SET, userId);
}

async function updateSession(userId, newData) {
  const key = SESSION_PREFIX + userId;
  const existing = await getSession(userId);

  // Filter only defined keys
  const filteredNewData = Object.fromEntries(
    Object.entries(newData).filter(([_, val]) => val !== undefined)
  );

  const merged = { ...existing, ...filteredNewData };

  if (!merged.username) {
    const linked = await redis.get(LINK_PREFIX + userId);
    merged.username = linked || `tg-${userId}`;
  }

  await redis.set(key, JSON.stringify(merged), { ex: 3600 });
  await redis.sadd(USER_SET, userId);
}

// ===== General Commands =====

bot.start(ctx => {
  ctx.reply(
    `Selamat datang di *Crypto Card Bot!*\n\nGunakan /card untuk membuat kartu crypto.\nGunakan /help untuk melihat perintah lain.`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('help', async ctx => {
  const { markdown } = await getCategoryMarkdownList();

  const helpText = `*Perintah:*
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
  ${markdown}`;

  ctx.reply(helpText, { parse_mode: 'Markdown' });
});

// ===== Link & Account =====

bot.command('link', async ctx => {
  const userId = ctx.from.id.toString();
  const args = ctx.message.text.split(' ').slice(1);
  const [username, password] = args;

  if (!username || !password) return ctx.reply('Format: /link <username> <password>');
  
  const hash = await redis.get(`user:${username}`);
  if (!hash) return ctx.reply('Username tidak ditemukan.');
  if (!(await bcrypt.compare(password, hash))) return ctx.reply('Password salah.');

  await redis.set(LINK_PREFIX + userId, username);
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
    : 'Belum terhubung. Gunakan /link <username> <password>',
    { parse_mode: 'Markdown' });
});

// ===== Card Flow =====

bot.command('card', async ctx => {
  const userId = ctx.from.id.toString();
  await updateSession(userId, { step: 'model' });

  await ctx.reply('Pilih model:', Markup.inlineKeyboard(
    modelsName.map(m => Markup.button.callback(`🖼️ ${m}`, `model:${m}`)),
    { columns: 2 }
  ));
});

bot.on('callback_query', async ctx => {
  const userId = ctx.from.id.toString();
  const data = ctx.callbackQuery.data;
  const session = await getSession(userId); // Ambil data sesi dari Redis

  // Step 1: Pilih Model
  if (data.startsWith('model:')) {
    const model = data.split(':')[1];
    await redis.set(`tg:model:${userId}`, model); // Simpan model pilihan ke Redis
    session.model = model;
    await updateSession(userId, { step: 'theme', ...session });

    return ctx.editMessageText('Pilih theme:', Markup.inlineKeyboard(
      themeNames.map(t => Markup.button.callback(`🎨 ${t}`, `theme:${t}`)),
      { columns: 2 }
    ));
  }

  // Step 2: Pilih Theme
  if (data.startsWith('theme:')) {
    const theme = data.split(':')[1];
    await redis.set(`tg:theme:${userId}`, theme); // Simpan theme pilihan ke Redis
    session.theme = theme;
    await updateSession(userId, { step: 'category', ...session });

    const { categories } = await getCategoryMarkdownList();

    return ctx.editMessageText('Pilih kategori:', Markup.inlineKeyboard(
      categories.map(c => Markup.button.callback(`📁 ${c.name}`, `category:${c.category_id}`)),
      { columns: 2 }
    ));
  }

  // Step 3: Pilih Category
  if (data.startsWith('category:')) {
    const categoryId = data.split(':')[1].trim();
    await redis.set(`tg:category:${userId}`, categoryId); // Simpan category pilihan ke Redis
    session.category = categoryId;
    await updateSession(userId, { step: 'coin', ...session });

    return ctx.editMessageText('Masukkan jumlah coin (1-50):');
  }

  await ctx.answerCbQuery();
});

bot.on('text', async ctx => {
  const userId = ctx.from.id.toString();
  const session = await getSession(userId);
  const input = ctx.message.text.trim();
  const count = parseInt(input);

  if (session.step !== 'coin') return;

  if (isNaN(count) || count < 1 || count > 50) {
    return ctx.reply('Jumlah coin harus antara 1 - 50.');
  }

  session.coin = count;
  await updateSession(userId, { ...session });

  // Ambil data dari Redis
  const model = await redis.get(`tg:model:${userId}`);
  const theme = await redis.get(`tg:theme:${userId}`);
  const category = await redis.get(`tg:category:${userId}`);
  const coin = session.coin;

  // Buat URL akhir
  const username = await redis.get(LINK_PREFIX + userId);
  const url = `${BASE_URL}?user=${username}&model=${model}&theme=${theme}&coin=${coin}&category=${category}`;

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
    return ctx.reply('Gagal ambil kartu. Coba lagi nanti.');
  }

  // Reset session
  await redis.del(SESSION_PREFIX + userId);
});

module.exports = { bot };
