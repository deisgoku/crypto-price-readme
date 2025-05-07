//    telegram/bot.js
//    Author : Deisgoku


const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');
const { Resvg } = require('@resvg/resvg-js');
const bcrypt = require('bcrypt');
const { BOT_TOKEN, BASE_URL } = require('./config');
const { models, themes } = require('./lists');
const { getGeckoCategories } = require('./gecko');
const { redis } = require('../lib/redis');

const SESSION_PREFIX = 'tg:session:';
const LINK_PREFIX = 'tg:link:';

const bot = new Telegraf(BOT_TOKEN);



// Session helpers
async function getSession(userId) {
  const raw = await redis.get(SESSION_PREFIX + userId);
  let session = raw ? JSON.parse(raw) : {};
  session.username = await redis.get(LINK_PREFIX + userId) || `tg-${userId}`;
  return session;
}

async function setSession(userId, data) {
  await redis.set(SESSION_PREFIX + userId, JSON.stringify(data), { ex: 3600 });
}


// ----------------------------
// Start
bot.command('start', ctx => {
  ctx.reply('Selamat datang di Crypto Card Bot!\nGunakan /card untuk buat kartu crypto.');
});

// Link
bot.command('link', async (ctx) => {
  const userId = ctx.from.id.toString();
  const args = ctx.message.text.split(' ').slice(1);
  const [username, password] = args;

  if (!username || !password) {
    return ctx.reply('Format: /link <username> <password>');
  }

  const hash = await redis.get(`user:${username}`);
  if (!hash) return ctx.reply('Username tidak ditemukan.');
  const valid = await bcrypt.compare(password, hash);
  if (!valid) return ctx.reply('Password salah.');

  await redis.set(LINK_PREFIX + userId, username);
  ctx.reply(`Berhasil terhubung dengan akun '${username}'`);
});

// Unlink
bot.command('unlink', async (ctx) => {
  const userId = ctx.from.id.toString();
  await redis.del(LINK_PREFIX + userId);
  ctx.reply('Akun Telegram kamu sudah di-unlink.');
});

// /me
bot.command('me', async (ctx) => {
  const userId = ctx.from.id.toString();
  const linkedUsername = await redis.get(LINK_PREFIX + userId);

  if (linkedUsername) {
    ctx.reply(`Akun kamu terhubung ke: *${linkedUsername}*`, { parse_mode: 'Markdown' });
  } else {
    ctx.reply('Kamu belum menghubungkan akun. Gunakan /link <username> <password>');
  }
});


// ----------------------------
// admin area

const { addAdmin, removeAdmin, isAdmin, listAdmins } = require('./admin');

// /addadmin
bot.command('addadmin', async (ctx) => {
  const fromId = ctx.from.id.toString();
  if (!(await isAdmin(fromId))) return ctx.reply('Kamu bukan admin.');

  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('Gunakan: /addadmin <userId>');

  const targetId = args[1];
  await addAdmin(targetId);
  ctx.reply(`Admin ${targetId} berhasil ditambahkan.`);
});

// /removeadmin
bot.command('removeadmin', async (ctx) => {
  const fromId = ctx.from.id.toString();
  if (!(await isAdmin(fromId))) return ctx.reply('Kamu bukan admin.');

  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('Gunakan: /removeadmin <userId>');

  const targetId = args[1];
  await removeAdmin(targetId);
  ctx.reply(`Admin ${targetId} berhasil dihapus.`);
});

// /admin
bot.command('admins', async (ctx) => {
  const fromId = ctx.from.id.toString();
  if (!(await isAdmin(fromId))) return ctx.reply('Kamu bukan admin.');

  const admins = await listAdmins();
  if (admins.length === 0) {
    ctx.reply('Belum ada admin yang terdaftar.');
  } else {
    ctx.reply(`Daftar Admin:\n${admins.map(id => `- ${id}`).join('\n')}`);
  }
});

// /broadcast
bot.command('broadcast', async (ctx) => {
  const fromId = ctx.from.id.toString();
  if (!(await isAdmin(fromId))) return ctx.reply('Kamu bukan admin.');

  const message = ctx.message.text.replace('/broadcast', '').trim();
  if (!message) return ctx.reply('Gunakan: /broadcast <pesan kamu>');

  const userIds = await redis.smembers(USER_SET);
  let success = 0;

  for (const uid of userIds) {
    try {
      await ctx.telegram.sendMessage(uid, `ðŸ“¢ *Broadcast:*\n${message}`, { parse_mode: 'Markdown' });
      success++;
    } catch (err) {
      console.error(`Gagal kirim ke ${uid}`, err);
    }
  }

  ctx.reply(`Broadcast terkirim ke ${success} user.`);
});


// ----------------------------
// Card
bot.command('card', async (ctx) => {
  const userId = ctx.from.id.toString();
  const session = await getSession(userId);
  session.step = 'model';
  await setSession(userId, session);

  await ctx.reply('Pilih model:', Markup.inlineKeyboard(
    models.map(m => Markup.button.callback(m, `model:${m}`)), { columns: 2 }
  ));
});

// Callback (model > theme > category)
bot.on('callback_query', async (ctx) => {
  const userId = ctx.from.id.toString();
  const data = ctx.callbackQuery.data;
  const session = await getSession(userId);

  if (data.startsWith('model:')) {
    session.model = data.split(':')[1];
    session.step = 'theme';
    await setSession(userId, session);
    await ctx.editMessageText('Pilih theme:', Markup.inlineKeyboard(
      themes.map(t => Markup.button.callback(t, `theme:${t}`)), { columns: 2 }
    ));
  }

  else if (data.startsWith('theme:')) {
    session.theme = data.split(':')[1];
    session.step = 'category';
    await setSession(userId, session);

    const categories = await getGeckoCategories();
    session.allCategories = categories;
    await setSession(userId, session);

    await ctx.editMessageText('Pilih kategori:', Markup.inlineKeyboard(
      categories.map(c => Markup.button.callback(`cat:${c}`, `cat:${c}`)), { columns: 2 }
    ));
  }

  else if (data.startsWith('cat:')) {
    session.category = data.split(':')[1];
    session.step = 'coin';
    await setSession(userId, session);
    await ctx.editMessageText('Masukkan jumlah coin (misal: 5)');
  }

  await ctx.answerCbQuery();
});

// Final input: jumlah coin
bot.on('text', async (ctx) => {
  const userId = ctx.from.id.toString();
  const session = await getSession(userId);

  if (session.step === 'coin') {
    const coin = parseInt(ctx.message.text.trim());
    if (isNaN(coin) || coin < 1 || coin > 50) {
      return ctx.reply('Jumlah coin harus angka 1-50 bro!');
    }

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

      await ctx.replyWithPhoto({ source: png }, { caption: `Hasil untuk ${model} - ${theme}` });
    } catch (err) {
      console.error(err);
      ctx.reply('Gagal ambil kartu bro. Coba lagi nanti!');
    }
  }
});

bot.launch();
