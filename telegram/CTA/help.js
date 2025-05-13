const { Markup } = require('telegraf');

async function sendHelp(ctx) {
  const helpText = `*Perintah:* 
/start - Mulai bot
/help - Bantuan & FAQ
/card - Buat kartu crypto
/link - Hubungkan akun
/unlink - Putuskan akun
/me - Info akun

*Admin:* 
/addadmin  
/removeadmin  
/admins 
/broadcast`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('❓ FAQ', 'faq'),
      Markup.button.callback('💜 Sponsor', 'sponsor')
    ],
    [
      Markup.button.webApp('🧾 Crypto Market Card', 'https://crypto-price-on.vercel.app/unlock?ref=telegram')
    ]
  ]);

  if (ctx.updateType === 'callback_query') {
    await ctx.editMessageText(helpText, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: keyboard.reply_markup
    });
  } else {
    await ctx.reply(helpText, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: keyboard.reply_markup
    });
  }
}

function getFAQContent() {
  return `
*FAQ Bot Crypto:*

1. _Apa itu Coin Card?_
   → Gambar berisi info harga coin crypto.

2. _Kenapa harga coin saya kosong?_
   → Gunakan simbol coin resmi (mis: BTC, ETH). Gunakan /s untuk cari.

3. _Bagaimana cara menjadi admin atau premium?_
   → Hubungi pemilik, lalu klaim token pakai /claim <token>.

4. _Apa gunanya /link dan /me?_
   → Untuk menghubungkan identitas pengguna dan melihat statistik akun.

5. _Saya tidak menemukan coin tertentu?_
   → Gunakan /s <nama> untuk pencarian manual.
`;
}

function getSponsorContent() {
  return `
*Dukung dan Gunakan Mini App Kami:*

[Crypto Market Card](https://t.me/crypto_market_card_bot/gcmc)  
→ Dapatkan kartu harga crypto real-time  
→ Bisa dipakai di Telegram, GitHub README, atau dibagikan  
→ Powered by CoinGecko & Binance  
→ Dikembangkan oleh [@Deisgoku](https://x.com/Deisgoku)

*Dukung Developer:*
- [PayPal](https://www.paypal.me/DIskandar)
- [Ko-fi](https://ko-fi.com/deisgoku)
- [Trakteer](https://trakteer.id/deisgoku)

*Web App Stars Unlock:*  
[Unlock Premium](https://crypto-price-on.vercel.app/unlock?ref=telegram)

_Afiliasi & bonus Stars akan tersedia segera._
`;
}

function registerHelpActions(bot) {
  bot.action('faq', async (ctx) => {
    await ctx.editMessageText(getFAQContent(), {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });
  });

  bot.action('sponsor', async (ctx) => {
    await ctx.editMessageText(getSponsorContent(), {
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    });
  });

  bot.action('help', async (ctx) => {
    await ctx.answerCbQuery();
    await sendHelp(ctx);
  });
}

module.exports = {
  sendHelp,
  getFAQContent,
  getSponsorContent,
  registerHelpActions,
};
