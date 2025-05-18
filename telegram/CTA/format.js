// telegram/CTA/format.js
const { Markup } = require('telegraf');

// Placeholder handler
function replacePlaceholders(text, ctx, options = {}) {
  const from = ctx.message?.from || ctx.from || {};
  const chat = ctx.chat || {};
  const bot = ctx.botInfo || {};
  const msg = ctx.message || {};
  const date = new Date();

  const map = {
    '{userId}': from.id || '',
    '{username}': from.username ? `@${from.username}` : from.first_name || '',
    '{firstName}': from.first_name || '',
    '{lastName}': from.last_name || '',
    '{fullName}': [from.first_name, from.last_name].filter(Boolean).join(' '),
    '{mention}': from.username
      ? `[@${from.username}](tg://user?id=${from.id})`
      : `[${from.first_name || 'user'}](tg://user?id=${from.id})`,
    '{groupId}': chat.id || '',
    '{chatTitle}': chat.title || '',
    '{chatType}': chat.type || '',
    '{botUsername}': bot.username ? '@' + bot.username : '',
    '{date}': date.toLocaleDateString('id-ID'),
    '{time}': date.toLocaleTimeString('id-ID'),
    '{timestamp}': date.toISOString(),
    '{year}': date.getFullYear(),
    '{month}': String(date.getMonth() + 1).padStart(2, '0'),
    '{day}': String(date.getDate()).padStart(2, '0'),
    '{hour}': String(date.getHours()).padStart(2, '0'),
    '{minute}': String(date.getMinutes()).padStart(2, '0'),
    '{second}': String(date.getSeconds()).padStart(2, '0'),

    // Tambahan
    '{bio}': options.bio || '-',
    '{lang}': from.language_code || 'id',
    '{isAdmin}': options.isAdmin ? '✅' : '❌',
    '{isPremium}': options.isPremium ? '⭐️ Premium' : 'Free',
    '{random}': Math.random().toString(36).substring(2, 8),
  };

  // {randomIn:Apple,Banana,Orange}
  text = text.replace(/\{randomIn:([^\}]+)\}/g, (_, list) => {
    const arr = list.split(',').map(s => s.trim());
    return arr[Math.floor(Math.random() * arr.length)];
  });

  let replaced = text;
  for (const [key, value] of Object.entries(map)) {
    replaced = replaced.replace(new RegExp(key, 'g'), value);
  }

  return replaced;
}

// Tombol Inline
function parseInlineButtons(text) {
  const buttons = [];
  const urlRegex = /([^]+)(https?:\/\/[^\s]+)/g;
  const callbackRegex = /([^]+)\{([^\}]+)\}/g;

  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    buttons.push(Markup.button.url(match[1], match[2]));
  }
  while ((match = callbackRegex.exec(text)) !== null) {
    buttons.push(Markup.button.callback(match[1], match[2]));
  }

  const keyboard = [];
  for (let i = 0; i < buttons.length; i += 2) {
    keyboard.push(buttons.slice(i, i + 2));
  }

  return keyboard.length ? Markup.inlineKeyboard(keyboard).reply_markup : undefined;
}

// Bersihkan markup tombol dari teks
function removeButtonMarkup(text) {
  return text
    .replace(/([^]+)(https?:\/\/[^\s]+)/g, '$1')
    .replace(/([^]+)\{([^\}]+)\}/g, '$1');
}

// Ambil quote jika tersedia
function getQuote(ctx) {
  const reply = ctx.message?.reply_to_message;
  if (!reply) return null;

  let text = reply.text || reply.caption;
  if (!text) return null;

  const author = reply.from?.first_name || 'User';
  return `> _${text.replace(/\n/g, '\n> ')}_\n— *${author}*`;
}

module.exports = {
  replacePlaceholders,
  parseInlineButtons,
  removeButtonMarkup,
  getQuote,
};
