const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');
const { Canvg, presets } = require('canvg');
const { DOMParser } = require('xmldom');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { BOT_TOKEN, BASE_URL } = require('./config');
const { getCategoryMarkdownList } = require('./gecko');
const { themeNames } = require('../lib/settings/model/theme');
const renderers = require('../lib/settings/model/list');
const { redis } = require('../lib/redis');
const { registerAdminCommands } = require('./admin');
const { createCanvas } = require('canvas');

const LINK_KEY = 'user_passwords';
const USER_SET = 'tg:users';
const GARAM = parseInt(process.env.GARAM || '10', 10);

const bot = new Telegraf(BOT_TOKEN);
const modelsName = Object.keys(renderers);
const themes = themeNames.join('\n');
const tempSession = new Map();

// Font cache
const fontDir = path.join(__dirname, '../lib/data/fonts');
const fontsCache = new Map();

async function loadFonts() {
  if (fontsCache.size === 0) {
    console.log('Loading fonts into cache...');
    const fonts = [
      { name: 'Verdana', data: fs.readFileSync(path.join(fontDir, 'Verdana.ttf')) },
      { name: 'monospace', data: fs.readFileSync(path.join(fontDir, 'Monospace.ttf')) },
      { name: 'Arial', data: fs.readFileSync(path.join(fontDir, 'Arial.ttf')) },
      { name: 'sans-serif', data: fs.readFileSync(path.join(fontDir, 'sans-serif.ttf')) }
    ];
    fonts.forEach(font => fontsCache.set(font.name, font.data));
    console.log('Fonts loaded.');
  }
}

registerAdminCommands(bot);
require('./auth')(bot);

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

bot.command('card', async ctx => {
  const userId = ctx.from.id.toString();
  tempSession.set(userId, { step: 'model' });

  await ctx.reply('Pilih model:', Markup.inlineKeyboard(
    modelsName.map(m => Markup.button.callback(`\u{1F5BC} ${m}`, `model:${m}`)),
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
      themeNames.map(t => Markup.button.callback(`\u{1F3A8} ${t}`, `theme:${t}`)),
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
      categories.map(c => Markup.button.callback(`\u{1F4C1} ${c.name}`, `category:${c.category_id}`)),
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
  const cacheKey = `svg:${session.username}:${session.model}:${session.theme}:${session.coin}:${session.category}`;

  try {
    await loadFonts();
    let svg = await redis.get(cacheKey);

    if (!svg) {
      console.log('SVG not in cache, fetching from:', url);
      const res = await fetch(url);
      svg = await res.text();
      await redis.set(cacheKey, svg, { ex: 3600 });
    } else {
      console.log('SVG loaded from cache.');
    }

    const canvas = createCanvas(680, 400);
    const context = canvas.getContext('2d');

    // Gunakan xmldom untuk DOMParser jika dibutuhkan
    const v = await Canvg.from(context, svg, {
      ...presets.node({
        DOMParser,
      }),
    });
    await v.render();

    const png = canvas.toBuffer('image/png');
    await ctx.replyWithPhoto({ source: png }, {
      caption: `📊 Kartu siap: *${session.model} - ${session.theme}*`,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    console.error('Gagal membuat kartu:', err);
    ctx.reply('Terjadi kesalahan saat membuat kartu.');
  }

  tempSession.delete(userId);
});

module.exports = { bot };
