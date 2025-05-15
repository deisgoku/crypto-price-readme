const { Markup } = require('telegraf');
const { redis } = require('../../lib/redis');

async function sendHelp(ctx) {
  const key = `tg:${ctx.from.id}:help`;
  const cached = await redis.get(key);

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
    ],
    [
      Markup.button.callback('🔙 Kembali ke Menu', 'menu')
    ]
  ]);

  if (!cached) await redis.setex(key, 300, '1');

  const options = {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_markup: keyboard.reply_markup
  };

  if (ctx.updateType === 'callback_query') {
    await ctx.editMessageText(helpText, options);
  } else {
    await ctx.reply(helpText, options);
  }
}

function renderFAQMessage(answerText) {
  const faqButtons = [
    [Markup.button.callback('1. Apa itu Coin Card?', 'faq_q1')],
    [Markup.button.callback('2. Harga coin saya kosong?', 'faq_q2')],
    [Markup.button.callback('3. Cara jadi admin/premium?', 'faq_q3')],
    [Markup.button.callback('4. Gunanya /link dan /me?', 'faq_q4')],
    [Markup.button.callback('5. Coin tidak ditemukan?', 'faq_q5')],
    [Markup.button.callback('🔙 Kembali ke Bantuan', 'help')]
  ];

  const text = (answerText ? answerText + '\n\n' : '') + '*FAQ - Pilih Pertanyaan:*';

  return {
    text,
    keyboard: Markup.inlineKeyboard(faqButtons)
  };
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
    try {
      await ctx.answerCbQuery();
      const { text, keyboard } = renderFAQMessage('');
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
    } catch (err) {
      console.error('Error edit FAQ list:', err);
      const { text, keyboard } = renderFAQMessage('');
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
    }
  });

  const faqAnswers = {
    faq_q1: '*Apa itu Coin Card?*\n\n→ Gambar berisi info harga coin crypto.',
    faq_q2: '*Harga coin saya kosong?*\n\n→ Gunakan simbol resmi (mis: BTC, ETH). Cek dengan /s <nama coin>.',
    faq_q3: '*Cara jadi admin/premium?*\n\n→ Hubungi pemilik bot dan klaim token lewat /claim <token>.',
    faq_q4: '*Gunanya /link dan /me?*\n\n→ Untuk menghubungkan ID Telegram kamu dan melihat statistik akun.',
    faq_q5: '*Coin tidak ditemukan?*\n\n→ Gunakan /s <nama coin> untuk pencarian manual.'
  };

  for (const [action, answerText] of Object.entries(faqAnswers)) {
    bot.action(action, async (ctx) => {
      try {
        await ctx.answerCbQuery();
        const { text, keyboard } = renderFAQMessage(answerText);
        await ctx.editMessageText(text, {
          parse_mode: 'Markdown',
          reply_markup: keyboard.reply_markup
        });
      } catch (err) {
        console.error(`Error edit FAQ answer (${action}):`, err);
        await ctx.reply(answerText, {
          parse_mode: 'Markdown'
        });
      }
    });
  }

  bot.action('sponsor', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const key = `tg:${ctx.from.id}:sponsor`;
      let cached = await redis.get(key);

      if (!cached) {
        cached = getSponsorContent();
        await redis.setex(key, 300, cached);
      }

      await ctx.editMessageText(cached, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🔙 Kembali ke Bantuan', 'help')]
        ]).reply_markup
      });
    } catch (err) {
      console.error('Error edit Sponsor:', err);
      const cached = getSponsorContent();
      await ctx.reply(cached, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🔙 Kembali ke Bantuan', 'help')]
        ]).reply_markup
      });
    }
  });

  bot.action('help', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await sendHelp(ctx);
    } catch (err) {
      console.error('Error kembali ke help:', err);
    }
  });
}

module.exports = {
  sendHelp,
  registerHelpActions,
  getSponsorContent
};
