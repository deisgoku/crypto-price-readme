const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');
const { Canvg } = require('canvg');
const { DOMParser } = require('xmldom');
const { createCanvas, registerFont } = require('canvas');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const { BOT_TOKEN, BASE_URL } = require('./config');
const { getCategoryMarkdownList } = require('./gecko');
const { themeNames } = require('../lib/settings/model/theme');
const renderers = require('../lib/settings/model/list');
const { redis } = require('../lib/redis');
const { registerAdminCommands } = require('./admin');

const LINK_KEY = 'user_passwords';
const USER_SET = 'tg:users';
const GARAM = parseInt(process.env.GARAM || '10', 10);

const bot = new Telegraf(BOT_TOKEN);
const modelsName = Object.keys(renderers);
const themes = themeNames.join('\n');
const tempSession = new Map();

const fontDir = path.join(__dirname, '../lib/data/fonts');
const fontsCache = new Map();

async function loadFonts() {
  const fonts = [
    { name: 'Verdana', path: path.join(fontDir, 'Verdana.ttf') },
    { name: 'monospace', path: path.join(fontDir, 'Monospace.ttf') },
    { name: 'Arial', path: path.join(fontDir, 'Arial.ttf') },
    { name: 'sans-serif', path: path.join(fontDir, 'sans-serif.ttf') }
  ];

  for (const font of fonts) {
    const fontKey = `font:${font.name}`;
    let fontData;
    const base64 = await redis.get(fontKey);

    if (!base64) {
      console.log(`Font ${font.name} tidak ada di Redis, memuat dan menyimpannya.`);
      fontData = fs.readFileSync(font.path);
      const encoded = fontData.toString('base64');
      await redis.set(fontKey, encoded, { ex: 86400 });
    } else {
      console.log(`Font ${font.name} dimuat dari Redis.`);
      fontData = Buffer.from(base64, 'base64');
    }

    fontsCache.set(font.name, fontData);

    const tmpFontPath = `/tmp/${font.name}.ttf`;
    fs.writeFileSync(tmpFontPath, fontData);
    registerFont(tmpFontPath, { family: font.name });
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
/link - Hubungkan akun
/unlink - Putuskan akun
/me - Info akun

*Admin:* 
/addadmin  
/removeadmin  
/admins 
/broadcast

*Kategori:* ${markdown}`,
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

  return ctx.answerCbQuery();
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
    }

    const ratio = 2;

    const tempCanvas = createCanvas(1, 1);
    const tempCtx = tempCanvas.getContext('2d');
    const parser = await Canvg.from(tempCtx, svg, { parseOnly: true, DOMParser });
    const { width, height } = parser.document;

    const canvas = createCanvas(width * ratio, height * ratio);
    const ctx2d = canvas.getContext('2d');
    ctx2d.scale(ratio, ratio);

    const renderer = await Canvg.from(ctx2d, svg, { DOMParser, fetch });
    await renderer.render();

    const png = canvas.toBuffer('image/png');
    await ctx.replyWithPhoto({ source: png }, {
      caption: `📊 Kartu siap: *${session.model} - ${session.theme}*`,
      parse_mode: 'Markdown'
    });

  } catch (err) {
    console.error('Gagal membuat kartu:', err);
    ctx.reply('☹️ Terjadi kesalahan saat membuat kartu.', { show_alert: true });
  }

  tempSession.delete(userId);
});

module.exports = { bot };
