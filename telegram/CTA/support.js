// telegram/CTA/support

const { Markup } = require('telegraf');

async function sendSupport(ctx) {
  const text = '*Dukung Proyek Crypto Market Card:*\n\nPilih metode dukungan:';
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⭐ GitHub Sponsor', 'support_github')],
    [Markup.button.callback('₿ Dukung dengan Cryptocurrency', 'support_crypto')],
  ]).reply_markup;

  const options = {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_markup: keyboard,
  };

  if (ctx.updateType === 'callback_query') {
    return ctx.editMessageText(text, options);
  } else {
    return ctx.reply(text, options);
  }
}

function registerSupportActions(bot) {
  bot.command('support', async (ctx) => {
    await sendSupport(ctx);
  });

  bot.action('support_github', async (ctx) => {
    await ctx.editMessageText(
      '*Dukung via Sponsor GitHub:*\n\nPilih salah satu metode:',
      {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.url('💖 PayPal', 'https://www.paypal.me/DIskandar')],
          [Markup.button.url('☕ Ko-fi', 'https://ko-fi.com/deisgoku')],
          [Markup.button.url('🍵 Trakteer', 'https://trakteer.id/deisgoku')],
          [Markup.button.callback('◀️ Kembali', 'support_back')],
        ]).reply_markup,
      }
    );
  });

  bot.action('support_crypto', async (ctx) => {
    await ctx.editMessageText(
      '*Terima kasih atas dukungan Anda!*\n\n' +
      'Bot ini dikembangkan sepenuhnya secara suka rela. Jika Anda merasa terbantu, donasi Anda sangat berarti untuk kelangsungan proyek ini.\n\n' +
      '*BTC:* `bc1qexamplebtcwallet`\n' +
      '*ETH:* `0xexampleethwallet`\n' +
      '*BSC:* `0xexamplebscwallet`\n' +
      '*USDT (TON):* `UQDWbI3lyY94Z8R8-kYzOpOlGPDmBmlld3gcWftpEGfkeEqa`\n\n' +
      'Klik tombol di bawah untuk langsung mengirim USDT via Telegram Wallet:',
      {
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
