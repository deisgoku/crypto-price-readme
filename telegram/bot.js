const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');
const { Resvg } = require('@resvg/resvg-js');
const { BOT_TOKEN, BASE_URL } = require('./config');
const { getCategoryMarkdownList } = require('./gecko');
const { themeNames } = require('../lib/settings/model/theme');
const renderers = require('../lib/settings/model/list');
const { redis } = require('../lib/redis');

const SESSION_PREFIX = 'tg:session:';
const LINK_PREFIX = 'tg:link:';
const USER_SET = 'tg:users';

const bot = new Telegraf(BOT_TOKEN);

const modelsName = Object.keys(renderers);

// ===== Session Helpers =====

async function getSession(userId) {
  const key = SESSION_PREFIX + userId;
  const data = await redis.hgetall(key); // Mendapatkan seluruh field dalam Redis Hash
  return data ? data : {};
}

async function updateSession(userId, newData) {
  const key = SESSION_PREFIX + userId;

  // Update hanya field yang diperlukan di Redis Hash
  for (const [field, value] of Object.entries(newData)) {
    await redis.hset(key, field, value); // Mengupdate hanya field yang diperlukan
  }

  // Pastikan username tetap ada
  const username = await redis.hget(key, 'username');
  if (!username) {
    const linked = await redis.get(LINK_PREFIX + userId);
    const userNameToSave = linked || `tg-${userId}`;
    await redis.hset(key, 'username', userNameToSave);
  }

  // Menambahkan user ke set pengguna jika belum ada
  await redis.sadd(USER_SET, userId);
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

// ===== Card Flow =====

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
  const data = ctx.callbackQuery.data;
  const [type, value] = data.split(':');

  switch (type) {
    case 'model': {
      // Simpan model yang dipilih
      await updateSession(userId, { model: value });
      return ctx.editMessageText('Pilih theme:', Markup.inlineKeyboard(
        themeNames.map(t => Markup.button.callback(`🎨 ${t}`, `theme:${t}`)),
        { columns: 2 }
      ));
    }

    case 'theme': {
      // Simpan theme yang dipilih
      await updateSession(userId, { theme: value });
      const { categories } = await getCategoryMarkdownList();
      return ctx.editMessageText('Pilih kategori:', Markup.inlineKeyboard(
        categories.map(c => Markup.button.callback(`📁 ${c.name}`, `category:${c.category_id}`)),
        { columns: 2 }
      ));
    }

    case 'category': {
      // Simpan kategori yang dipilih
      await updateSession(userId, { category: value.trim() });
      return ctx.editMessageText('Masukkan jumlah coin (1-50):');
    }

    default:
      return ctx.answerCbQuery();
  }
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

  await updateSession(userId, { coin: count });

  const { username, model, theme, category, coin } = await getSession(userId);
  const url = `${BASE_URL}?user=${username}&model=${model}&theme=${theme}&coin=${coin}&category=${category}`;

  try {
    const res = await fetch(url);
    const svg = await res.text(); // Ambil SVG
    const resvg = new Resvg(svg);
    const png = resvg.render().asPng(); // Konversi ke PNG

    await ctx.replyWithPhoto({ source: png }, {
      caption: `🖼️ Kartu siap: *${model} - ${theme}*\n[Klik untuk lihat SVG](${url})`,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    console.error(err);
    ctx.reply('Gagal ambil kartu. Coba lagi nanti.');
  }

  await redis.del(SESSION_PREFIX + userId); // Hapus sesi setelah selesai
});

module.exports = { bot };
