// telegram/CTA/help.js
const { Markup } = require('telegraf');

async function sendHelp(ctx) {
  return ctx.reply(
    `${ctx.i18n.t('help.command')}
/start - ${ctx.i18n.t('help.start')}
/help - ${ctx.i18n.t('help.help')}
` +
    `/card - ${ctx.i18n.t('help.card')}
/link - ${ctx.i18n.t('help.link')}
` +
    `/unlink - ${ctx.i18n.t('help.unlink')}
/me - ${ctx.i18n.t('help.me')}

${ctx.i18n.t('help.admin')}
` +
    `/addadmin  
/removeadmin  
/admins 
/broadcast`,
    {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback(ctx.i18n.t('help.faq'), 'faq'),
          Markup.button.callback(ctx.i18n.t('help.sponsor'), 'sponsor')
        ],
        [
          Markup.button.webApp(ctx.i18n.t('help.crypto_card'), 'https://crypto-price-on.vercel.app/unlock?ref=telegram')
        ]
      ]),
    }
  );
}

function getFAQContent() {
  return `
${ctx.i18n.t('faq.title')}

1. _${ctx.i18n.t('faq.coin_card')}_
   → ${ctx.i18n.t('faq.coin_card_answer')}

2. _${ctx.i18n.t('faq.empty_price')}_
   → ${ctx.i18n.t('faq.empty_price_answer')}

3. _${ctx.i18n.t('faq.become_admin')}_
   → ${ctx.i18n.t('faq.become_admin_answer')}

4. _${ctx.i18n.t('faq.link_me')}_
   → ${ctx.i18n.t('faq.link_me_answer')}

5. _${ctx.i18n.t('faq.not_found')}_
   → ${ctx.i18n.t('faq.not_found_answer')}
`;
}

function getSponsorContent() {
  return `
${ctx.i18n.t('sponsor.title')}

[Crypto Market Card](https://t.me/crypto_market_card_bot/gcmc)  
→ ${ctx.i18n.t('sponsor.crypto_card_desc')}
→ ${ctx.i18n.t('sponsor.use_in')}
→ ${ctx.i18n.t('sponsor.powered_by')}
→ ${ctx.i18n.t('sponsor.developed_by')}

${ctx.i18n.t('sponsor.support_developer')}
- [PayPal](https://www.paypal.me/DIskandar)
- [Ko-fi](https://ko-fi.com/deisgoku)
- [Trakteer](https://trakteer.id/deisgoku)

${ctx.i18n.t('sponsor.premium_unlock')}  
[Unlock Premium](https://crypto-price-on.vercel.app/unlock?ref=telegram)

${ctx.i18n.t('sponsor.affiliate_bonus')}
`;
}

function registerHelpActions(bot) {
  bot.action('faq', async (ctx) => {
    await ctx.editMessageText(getFAQContent(), { parse_mode: 'Markdown' });
  });

  bot.action('sponsor', async (ctx) => {
    await ctx.editMessageText(getSponsorContent(), {
      parse_mode: 'Markdown',
      disable_web_page_preview: false
    });
  });
}

module.exports = {
  sendHelp,
  registerHelpActions,
};
