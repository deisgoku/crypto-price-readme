// telegram/config.js

const BASE_URL = 'https://crypto-price-on.vercel.app/cards';

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  BASE_URL,

  // Ini bisa dari env, aman dan dinamis
  WEBHOOK_URL: process.env.WEBHOOK_URL,

  ADMIN_IDS: ['123456789', '987654321'],

  LINK_PREFIX: 'tg:link:',
  SESSION_PREFIX: 'tg:session:',
};
