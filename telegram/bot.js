const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');
const { Resvg } = require('@resvg/resvg-js');
const { BOT_TOKEN, BASE_URL } = require('./config');
const { getCategoryMarkdownList } = require('./gecko');
const { themeNames } = require('../lib/settings/model/theme');
const renderers = require('../lib/settings/model/list');
const { redis } = require('../lib/redis');
const { addAdmin, removeAdmin, isAdmin, listAdmins } = require('./admin');

const bot = new Telegraf(BOT_TOKEN);

const SESSION_KEY = 'tg:sessions';

async function getSession(userId) {
  const session = await redis.hget(SESSION_KEY, userId);
  return session ? JSON.parse(session) : {};
}

async function setSession(userId, sessionData) {
  await redis.hset(SESSION_KEY, userId, JSON.stringify(sessionData));
}

// Handler untuk memulai percakapan
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  await ctx.reply('Selamat datang! Silakan pilih model:', Markup.inlineKeyboard(
    renderers.map(m => Markup.button.callback(`🖼️ ${m}`, `model:${m}`)),
    { columns: 2 }
  ));
});

// Handler untuk memilih model
bot.action(/model:(.+)/, async (ctx) => {
  const userId = ctx.from.id;
  const model = ctx.match[1];

  const session = await getSession(userId);
  session.model = model;
  await setSession(userId, session);

  await ctx.editMessageText('Pilih theme:', Markup.inlineKeyboard(
    themeNames.map(t => Markup.button.callback(`🎨 ${t}`, `theme:${t}`)),
    { columns: 2 }
  ));
});

// Handler untuk memilih theme
bot.action(/theme:(.+)/, async (ctx) => {
  const userId = ctx.from.id;
  const theme = ctx.match[1];

  const session = await getSession(userId);
  session.theme = theme;
  await setSession(userId, session);

  const categories = await getCategoryMarkdownList();
  await ctx.editMessageText('Pilih kategori:', Markup.inlineKeyboard(
    categories.map(c => Markup.button.callback(`📁 ${c.name}`, `category:${c.category_id}`)),
    { columns: 2 }
  ));
});

// Handler untuk memilih kategori
bot.action(/category:(\d+)/, async (ctx) => {
  const userId = ctx.from.id;
  const categoryId = ctx.match[1];

  const session = await getSession(userId);
  session.category = categoryId;
  await setSession(userId, session);

  await ctx.editMessageText('Pilih jumlah coin:', Markup.inlineKeyboard(
    [1, 5, 10, 25].map(c => Markup.button.callback(`💰 ${c}`, `coin:${c}`)),
    { columns: 4 }
  ));
});

// Handler untuk memilih jumlah coin
bot.action(/coin:(\d+)/, async (ctx) => {
  const userId = ctx.from.id;
  const coin = parseInt(ctx.match[1], 10);

  const session = await getSession(userId);
  session.coin = coin;
  await setSession(userId, session);

  const { username, model, theme, category, coin: selectedCoin } = session;
  const url = `${BASE_URL}?user=${username}&model=${model}&theme=${theme}&coin=${selectedCoin}&category=${category}`;

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
    console.error('Gagal membuat kartu:', err);
    ctx.reply('Terjadi kesalahan saat membuat kartu.');
  }
});

// Start bot
module.exports = { bot };
