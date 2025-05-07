// telegram/config.js
// AUTHOR : Deigoku

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN || 'wkwkwkw',
  BASE_URL: 'https://crypto-price-on.vercel.app/cards',
  
  // ID Telegram admin 
  ADMIN_IDS: ['123456789', '987654321'],

  // Prefix Redis
  LINK_PREFIX: 'tg:link:',
  SESSION_PREFIX: 'tg:session:',
};
