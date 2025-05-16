const { redis } = require('../../lib/redis');
const CEO_ID = process.env.CEO_ID;

function join(bot) {
  bot.on('new_chat_members', async (ctx) => {
    const botId = ctx.botInfo.id;
    const newMembers = ctx.message.new_chat_members;

    const isBotJoined = newMembers.some(member => member.id === botId);
    if (!isBotJoined) return;

    const chatId = ctx.chat.id.toString();
    const key = 'joined_groups';

    const alreadyWelcomed = await redis.sismember(key, chatId);
    if (alreadyWelcomed) return;

    const groupName = ctx.chat.title || 'grup tanpa nama';
    const groupUsername = ctx.chat.username ? `@${ctx.chat.username}` : 'tidak tersedia';
    const dateJoined = new Date().toISOString();

    // Kirim salam ke grup
    await ctx.reply(`Assalamu’alaikum, terima kasih sudah mengizinkan saya bergabung di *${groupName}*!`, {
      parse_mode: 'Markdown'
    });

    // Simpan info ke Redis
    await redis.sadd(key, chatId);
    await redis.hset(`group_log:${chatId}`, {
      name: groupName,
      username: groupUsername,
      joined: dateJoined,
      id: chatId
    });

    // Kirim notifikasi ke CEO
    if (CEO_ID) {
      try {
        await ctx.telegram.sendMessage(CEO_ID, `Bot baru saja bergabung di grup:\n*${groupName}*\nUsername: ${groupUsername}\nID Grup: \`${chatId}\`\nWaktu: ${dateJoined}`, {
          parse_mode: 'Markdown'
        });
      } catch (err) {
        console.error('Gagal mengirim notifikasi ke CEO:', err);
      }
    }
  });
}

module.exports = join;
