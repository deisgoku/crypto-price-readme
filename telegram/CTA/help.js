const { Markup } = require('telegraf');
const { redis } = require('../../lib/redis');

// ===================== Teks =====================
function getHelpText() {
  return `*Perintah:* 
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
}

function renderFAQMessage(answerText) {
  const buttons = [
    [Markup.button.callback('1. Apa itu Coin Card?', 'faq_q1')],
    [Markup.button.callback('2. Harga coin saya kosong?', 'faq_q2')],
    [Markup.button.callback('3. Cara jadi admin/premium?', 'faq_q3')],
    [Markup.button.callback('4. Gunanya /link dan /me?', 'faq_q4')],
    [Markup.button.callback('5. Coin tidak ditemukan?', 'faq_q5')],
    [Markup.button.callback('🔙 Kembali ke Bantuan', 'menu_help')],
  ];
  const text = (answerText ? `${answerText}\n\n` : '') + '*FAQ - Pilih Pertanyaan:*';
  return { text, reply_markup: Markup.inlineKeyboard(buttons) };
}

function getSponsorText() {
  return `*Dukung dan Gunakan Mini App Kami:*

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

_Afiliasi & bonus Stars akan tersedia segera._`;
}

// ===================== Handler =====================
async function sendHelp(ctx) {
  const key = `tg:${ctx.from.id}:help`;
  const cached = await redis.get(key);
  if (!cached) await redis.setex(key, 300, '1');

  const markup = Markup.inlineKeyboard([
    [Markup.button.callback('❓ FAQ', 'faq')],
    [Markup.button.callback('💜 Sponsor', 'sponsor')],
    [Markup.button.webApp('🧾 Crypto Market Card', 'https://crypto-price-on.vercel.app/unlock?ref=telegram')],
    [Markup.button.callback('🔙 Kembali ke Menu', 'menu')]
  ]);

  const text = getHelpText();
  const options = {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_markup: markup.reply_markup
  };

  if (ctx.updateType === 'callback_query') {
    await ctx.editMessageText(text, options);
  } else {
    await ctx.reply(text, options);
  }
}

const faqAnswers = {
  faq_q1: '*Apa itu Coin Card?*\n\n→ Gambar info harga coin crypto real-time.',
  faq_q2: '*Harga coin saya kosong?*\n\n→ Gunakan simbol resmi (mis: BTC, ETH). Cek dengan /s <nama coin>.',
  faq_q3: '*Cara jadi admin/premium?*\n\n→ Hubungi pemilik bot dan klaim token lewat /claim <token>.',
  faq_q4: '*Gunanya /link dan /me?*\n\n→ Untuk menghubungkan ID Telegram kamu dan melihat statistik akun.',
  faq_q5: '*Coin tidak ditemukan?*\n\n→ Gunakan /s <nama coin> untuk pencarian manual.'
};

// ===================== Ekspor =====================
module.exports = bot => {
  bot.command('help', sendHelp);
  bot.action('menu_help', sendHelp);

  bot.action('faq', async ctx => {
    await ctx.answerCbQuery();
    const { text, reply_markup } = renderFAQMessage('');
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup
    });
  });

  for (const [action, text] of Object.entries(faqAnswers)) {
    bot.action(action, async ctx => {
      await ctx.answerCbQuery();
      const { text: fullText, reply_markup } = renderFAQMessage(text);
      await ctx.editMessageText(fullText, {
        parse_mode: 'Markdown',
        reply_markup
      });
    });
  }

  bot.action('sponsor', async ctx => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(getSponsorText(), {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Kembali ke Bantuan', 'menu_help')]
      ]).reply_markup
    });
  });
};
