// telegram/CTA/support.js

const { Markup } = require('telegraf');
const { redis } = require('../../lib/redis'); // Pastikan ini tersedia

async function sendSupport(ctx) {
  const key = `tg:${ctx.from.id}:support_menu`;
  let text = await redis.get(key);

  if (!text) {
    text = '*Dukung Proyek Crypto Market Card:*\n\nPilih metode dukungan:';
    await redis.setex(key, 300, text);
  }

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⭐ GitHub Sponsor', 'support_github')],
    [Markup.button.callback('₿ Dukung dengan Cryptocurrency', 'support_crypto')],
    [Markup.button.callback('◀️ Kembali', 'menu')],
  ]);

  const options = {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_markup: keyboard.reply_markup,
  };

  try {
    if (ctx.updateType === 'callback_query') {
      await ctx.editMessageText(text, options);
    } else {
      await ctx.reply(text, options);
    }
  } catch (err) {
    if (!err.description?.includes('message is not modified')) {
      console.error('sendSupport error:', err);
    }
  }

  if (ctx.answerCbQuery) await ctx.answerCbQuery();
}

function registerSupportActions(bot) {
  bot.command('support', async (ctx) => {
    await sendSupport(ctx);
  });

  bot.action('support_github', async (ctx) => {
    const key = `tg:${ctx.from.id}:support_github`;
    let text = await redis.get(key);

    if (!text) {
      text = '*Dukung via Sponsor GitHub:*\n\nPilih salah satu metode:';
      await redis.setex(key, 300, text);
    }

    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.url('💖 PayPal', 'https://www.paypal.me/DIskandar')],
          [Markup.button.url('☕ Ko-fi', 'https://ko-fi.com/deisgoku')],
          [Markup.button.url('🍵 Trakteer', 'https://trakteer.id/deisgoku')],
          [Markup.button.callback('◀️ Kembali', 'support_back')],
        ]).reply_markup,
      });
    } catch (err) {
      if (!err.description?.includes('message is not modified')) {
        console.error('support_github error:', err);
      }
    }

    await ctx.answerCbQuery();
  });

  bot.action('support_crypto', async (ctx) => {
    const key = `tg:${ctx.from.id}:support_crypto`;
    let text = await redis.get(key);

    if (!text) {
      text =
        '*Terima kasih atas dukungan Anda!*\n\n' +
        'Bot ini dikembangkan sepenuhnya secara suka rela. Jika Anda merasa terbantu, donasi Anda sangat berarti untuk kelangsungan proyek ini.\n\n' +
        '*BTC:* `bc1qexamplebtcwallet`\n' +
        '*ETH:* `0xexampleethwallet`\n' +
        '*BSC:* `0xexamplebscwallet`\n' +
        '*USDT (TON):* `UQDWbI3lyY94Z8R8-kYzOpOlGPDmBmlld3gcWftpEGfkeEqa`\n\n' +
        'Klik tombol di bawah untuk langsung mengirim USDT via Telegram Wallet:';
      await redis.setex(key, 300, text);
    }

    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.url(
              '💸 Kirim USDT via Telegram Wallet',
              'https://t.me/wallet/start?startapp=ton_send_UQDWbI3lyY94Z8R8-kYzOpOlGPDmBmlld3gcWftpEGfkeEqa'
            ),
          ],
          [Markup.button.callback('◀️ Kembali', 'support_back')],
        ]).reply_markup,
      });
    } catch (err) {
      if (!err.description?.includes('message is not modified')) {
        console.error('support_crypto error:', err);
      }
    }

    await ctx.answerCbQuery();
  });

  bot.action('support_back', async (ctx) => {
    await sendSupport(ctx);
  });
}

module.exports = {
  sendSupport,
  registerSupportActions,
};
