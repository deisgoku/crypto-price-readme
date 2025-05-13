// telegram/CTA/support


const { Markup } = require('telegraf');

async function sendSupport(ctx) {
  return ctx.reply(
    '*Dukung Proyek Crypto Market Card:*\n\nPilih metode dukungan:',
    {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('⭐ GitHub Sponsor', 'support_github')],
        [Markup.button.callback('₿ Dukung dengan Cryptocurrency', 'support_crypto')],
      ]),
    }
  );
}

function registerSupportActions(bot) {
  bot.action('support_github', async (ctx) => {
    await ctx.editMessageText(
      '*Dukung via Sponsor GitHub:*\n\nPilih salah satu metode:',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.url('💖 PayPal', 'https://www.paypal.me/DIskandar')],
          [Markup.button.url('☕ Ko-fi', 'https://ko-fi.com/deisgoku')],
          [Markup.button.url('🍵 Trakteer', 'https://trakteer.id/deisgoku')],
          [Markup.button.callback('◀️ Kembali', 'support_back')],
        ]),
      }
    );
  });

  bot.action('support_crypto', async (ctx) => {
    await ctx.editMessageText(
      '*Dukung via Crypto:*\n\nKirim donasi ke salah satu wallet berikut:\n\n' +
        '`BTC:` `bc1qexamplebtcwallet`\n' +
        '`ETH:` `0xexampleethwallet`\n' +
        '`BSC:` `0xexamplebscwallet`\n\n' +
        'Terima kasih atas dukungannya!',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('◀️ Kembali', 'support_back')],
        ]),
      }
    );
  });

  bot.action('support_back', async (ctx) => {
    await sendSupport(ctx);
  });
}

module.exports = {
  sendSupport,
  registerSupportActions,
};
