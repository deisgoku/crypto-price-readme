// telegram/CTA/help.js

const { Markup } = require('telegraf');
const { redis } = require('../../lib/redis');

async function sendHelp(ctx) {
  const key = `tg:${ctx.from.id}:help`;
  const cached = await redis.get(key);

  const helpText = `*Perintah Umum:*
/start - Mulai bot
/help - Bantuan & FAQ
/card - Buat kartu crypto
/link - Hubungkan akun
/unlink - Putuskan akun
/me - Info akun pribadi

*Admin:*
/addadmin - Tambah admin
/removeadmin - Hapus admin
/admins - Daftar admin
/broadcast - Kirim pesan ke semua user`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('❓ FAQ', 'faq'),
      Markup.button.callback('💜 Sponsor', 'sponsor')
    ],
    [
      Markup.button.webApp('🧾 WebApp Kartu Crypto', 'https://crypto-price-on.vercel.app/unlock?ref=telegram')
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

function getSponsorContent() {
  return `
*Dukung dan Gunakan Mini App Kami:*

[Crypto Market Card](https://t.me/crypto_market_card_bot/gcmc)  
→ Kartu harga crypto real-time  
→ Bisa dipakai di Telegram, GitHub README, atau dibagikan  
→ Powered by CoinGecko & Binance  
→ Dibuat oleh [@Deisgoku](https://x.com/Deisgoku)

*Dukung Developer:*
- [PayPal](https://www.paypal.me/DIskandar)
- [Ko-fi](https://ko-fi.com/deisgoku)
- [Trakteer](https://trakteer.id/deisgoku)

*Unlock Premium:*
[WebApp Stars Unlock](https://crypto-price-on.vercel.app/unlock?ref=telegram)

_Afiliasi & bonus Stars akan hadir segera._
`;
}

function getFAQList() {
  return {
    text: '*FAQ - Pilih Pertanyaan:*',
    keyboard: Markup.inlineKeyboard([
      [Markup.button.callback('1. Apa itu Coin Card?', 'faq_q1')],
      [Markup.button.callback('2. Harga coin saya kosong?', 'faq_q2')],
      [Markup.button.callback('3. Cara jadi admin/premium?', 'faq_q3')],
      [Markup.button.callback('4. Gunanya /link dan /me?', 'faq_q4')],
      [Markup.button.callback('5. Coin tidak ditemukan?', 'faq_q5')],
      [Markup.button.callback('🔙 Kembali ke Bantuan', 'help')]
    ])
  };
}

function registerHelpActions(bot) {
  // Aksi buka daftar FAQ
  bot.action('faq', async (ctx) => {
    const { text, keyboard } = getFAQList();
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup
    });
  });

  // Tiap jawaban FAQ
  const faqAnswers = {
    faq_q1: '*Apa itu Coin Card?*\n\n→ Gambar otomatis berisi info harga crypto real-time. Cocok untuk share atau dipantau harian.',
    faq_q2: '*Harga coin saya kosong?*\n\n→ Gunakan simbol resmi (contoh: BTC, ETH). Cek simbol dengan /s <nama coin>.',
    faq_q3: '*Cara jadi admin/premium?*\n\n→ Hubungi pemilik bot. Klaim token dengan perintah /claim <token>.',
    faq_q4: '*Gunanya /link dan /me?*\n\n→ Untuk menghubungkan akun Telegram kamu dan melihat data akun seperti penggunaan dan status.',
    faq_q5: '*Coin tidak ditemukan?*\n\n→ Gunakan perintah /s <nama coin> untuk cari simbol yang tepat.'
  };

  for (const [key, answer] of Object.entries(faqAnswers)) {
    bot.action(key, async (ctx) => {
      await ctx.editMessageText(answer, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🔙 Kembali ke FAQ', 'faq')]
        ]).reply_markup
      });
    });
  }

  // Sponsor
  bot.action('sponsor', async (ctx) => {
    const key = `tg:${ctx.from.id}:sponsor`;
    let cached = await redis.get(key);

    if (!cached) {
      cached = getSponsorContent();
      await redis.setex(key, 300, cached);
    }

    await ctx.editMessageText(cached, {
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Kembali ke Bantuan', 'help')]
      ]).reply_markup
    });
  });

  // Kembali ke halaman bantuan utama
  bot.action('help', async (ctx) => {
    await ctx.answerCbQuery();
    await sendHelp(ctx);
  });
}

module.exports = {
  sendHelp,
  registerHelpActions
};
