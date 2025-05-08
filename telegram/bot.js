// telegram/bot.js
// author: deisgoku

const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');
const { Resvg } = require('@resvg/resvg-js');
const bcrypt = require('bcrypt');
const { BOT_TOKEN, BASE_URL } = require('./config');
const { modelsName, themesName } = require('./lists');
const { getCategoryMarkdownList } = require('./gecko');
const { redis } = require('../lib/redis');
const { addAdmin, removeAdmin, isAdmin, listAdmins } = require('./admin');

const SESSION_PREFIX = 'tg:session:';
const LINK_PREFIX = 'tg:link:';
const USER_SET = 'tg:users';

const bot = new Telegraf(BOT_TOKEN);

// ===== Session Helpers =====
async function getSession(userId) {
  const raw = await redis.get(SESSION_PREFIX + userId);
  let session = {};
  try {
    session = raw ? JSON.parse(raw) : {};
  } catch {
    session = {};
  }
  session.username = await redis.get(LINK_PREFIX + userId) || `tg-${userId}`;
  return session;
}

async function setSession(userId, data) {
  await redis.set(SESSION_PREFIX + userId, JSON.stringify(data), { ex: 3600 });
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
  ctx.replyWithMarkdown(
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
${markdown}`
  );
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
      await ctx.telegram.sendMessage(uid, `📢 *Broadcast:*\n${message}`, { parse_mode: 'Markdown' });
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
  const session = await getSession(userId);
  session.step = 'model';
  await setSession(userId, session);

  await ctx.reply('Pilih model:', Markup.inlineKeyboard(
    modelsName.map(m => Markup.button.callback(m, `model:${m}`)), { columns: 2 }
  ));
});

bot.on('callback_query', async ctx => {
  const userId = ctx.from.id.toString();
  const session = await getSession(userId);
  const data = ctx.callbackQuery.data;

  if (data.startsWith('model:')) {
    session.model = data.split(':')[1];
    session.step = 'theme';
    await setSession(userId, session);
    return ctx.editMessageText('Pilih theme:', Markup.inlineKeyboard(
      themesName.map(t => Markup.button.callback(t, `theme:${t}`)), { columns: 2 }
    ));
  }

  if (data.startsWith('theme:')) {
    session.theme = data.split(':')[1];
    session.step = 'category';

    const { markdown, categories } = await getCategoryMarkdownList();
    session.allCategories = categories.map(c => c.category_id);
    await setSession(userId, session);

    return ctx.editMessageText(
      `Ketik nama *ID kategori* dari daftar berikut:\n\n${markdown}`,
      { parse_mode: 'Markdown' }
    );
  }

  await ctx.answerCbQuery();
});

bot.on('text', async ctx => {
  const userId = ctx.from.id.toString();
  const session = await getSession(userId);
  const input = ctx.message.text.trim();

  if (session.step === 'category') {
    const valid = session.allCategories?.includes(input);
    if (!valid) {
      const { markdown } = await getCategoryMarkdownList();
      return ctx.reply(`Kategori tidak valid. Ketik salah satu dari berikut:\n\n${markdown}`, { parse_mode: 'Markdown' });
    }

    session.category = input;
    session.step = 'coin';
    await setSession(userId, session);
    return ctx.reply('Masukkan jumlah coin (1-50):');
  }

  if (session.step === 'coin') {
    const count = parseInt(input);
    if (isNaN(count) || count < 1 || count > 50) return ctx.reply('Jumlah coin harus antara 1 - 50.');
    session.coin = count;
    session.step = 'done';
    await setSession(userId, session);

    const { username, model, theme, category, coin } = session;
    const url = `${BASE_URL}?user=${username}&model=${model}&theme=${theme}&coin=${coin}&category=${category}`;

    try {
      const res = await fetch(url);
      const svg = await res.text();
      const resvg = new Resvg(svg);
      const png = resvg.render().asPng();

      await ctx.replyWithPhoto({ source: png }, {
        caption: `✅ Kartu siap: *${model} - ${theme}*`,
        parse_mode: 'Markdown'
      });
    } catch (err) {
      console.error(err);
      ctx.reply('Gagal ambil kartu. Coba lagi nanti.');
    }
  }
});

module.exports = { bot };
