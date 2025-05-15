// telegram/CTA/filter.js


const { redis } = require('../../lib/redis');

// ========== Logic Filter ==========
function getFilterKey(chatId) {
  return `filter:${chatId}`;
}

async function addFilter(chatId, keyword, response) {
  const key = getFilterKey(chatId);
  await redis.hset(key, keyword.toLowerCase(), response);
}

async function removeFilter(chatId, keyword) {
  const key = getFilterKey(chatId);
  await redis.hdel(key, keyword.toLowerCase());
}

async function listFilters(chatId) {
  const key = getFilterKey(chatId);
  return await redis.hgetall(key);
}

async function handleFilterMessage(ctx) {
  const chatId = ctx.chat.id.toString();
  const key = getFilterKey(chatId);
  const filters = await redis.hgetall(key);

  const text = ctx.message?.text?.toLowerCase();
  if (!text || text.startsWith('/')) return; // Abaikan command

  for (const keyword in filters) {
    if (text.includes(keyword)) {
      return ctx.reply(filters[keyword]);
    }
  }
}

// ========== Command Handler ==========
module.exports = bot => {
  bot.command('filter', async ctx => {
    const [_, keyword, ...responseParts] = ctx.message.text.split(' ');
    const response = responseParts.join(' ');
    if (!keyword || !response) return ctx.reply('Gunakan: /filter <kata> <balasan>');

    await addFilter(ctx.chat.id, keyword, response);
    ctx.reply(`Filter untuk "${keyword}" disimpan.`);
  });

  bot.command('unfilter', async ctx => {
    const keyword = ctx.message.text.split(' ')[1];
    if (!keyword) return ctx.reply('Gunakan: /unfilter <kata>');

    await removeFilter(ctx.chat.id, keyword);
    ctx.reply(`Filter "${keyword}" dihapus.`);
  });

  bot.command('filters', async ctx => {
    const filters = await listFilters(ctx.chat.id);
    if (!Object.keys(filters).length) return ctx.reply('Belum ada filter.');

    const list = Object.keys(filters).map(k => `- ${k}`).join('\n');
    ctx.reply(`Filter aktif:\n${list}`);
  });

  bot.on('text', handleFilterMessage);
};
