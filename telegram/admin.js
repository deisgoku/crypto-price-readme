// telegram/admin.js
// author: Deisgoku

const { redis } = require('../lib/redis');

const ADMIN_SET = 'tg:admins';
const USER_SET = 'tg:users';

async function addAdmin(userId) {
  await redis.sadd(ADMIN_SET, userId);
}

async function removeAdmin(userId) {
  await redis.srem(ADMIN_SET, userId);
}

async function isAdmin(userId) {
  return await redis.sismember(ADMIN_SET, userId) === 1;
}

async function listAdmins() {
  return await redis.smembers(ADMIN_SET);
}

function registerAdminCommands(bot) {
  bot.command('addadmin', async ctx => {
    const fromId = ctx.from.id.toString();
    if (!(await isAdmin(fromId))) return ctx.reply('Kamu bukan admin.');

    const targetId = ctx.message.text.split(' ')[1];
    if (!targetId) return ctx.reply('Gunakan: /addadmin <userId>');

    await addAdmin(targetId);
    ctx.reply(`Admin ${targetId} ditambahkan.`);
  });

  bot.command('removeadmin', async ctx => {
    const fromId = ctx.from.id.toString();
    if (!(await isAdmin(fromId))) return ctx.reply('Kamu bukan admin.');

    const targetId = ctx.message.text.split(' ')[1];
    if (!targetId) return ctx.reply('Gunakan: /removeadmin <userId>');

    await removeAdmin(targetId);
    ctx.reply(`Admin ${targetId} dihapus.`);
  });

  bot.command('admins', async ctx => {
    const fromId = ctx.from.id.toString();
    if (!(await isAdmin(fromId))) return ctx.reply('Kamu bukan admin.');

    const admins = await listAdmins();
    ctx.reply(
      admins.length
        ? `Daftar Admin:\n${admins.map(id => `- ${id}`).join('\n')}`
        : 'Tidak ada admin.'
    );
  });

  bot.command('broadcast', async ctx => {
    const fromId = ctx.from.id.toString();
    if (!(await isAdmin(fromId))) return ctx.reply('Kamu bukan admin.');

    const message = ctx.message.text.replace('/broadcast', '').trim();
    if (!message) return ctx.reply('Gunakan: /broadcast <pesan>');

    const userIds = await redis.smembers(USER_SET);
    let count = 0;

    for (const uid of userIds) {
      try {
        await ctx.telegram.sendMessage(uid, `\u{1F4E1} *Broadcast:*\n${message}`, {
          parse_mode: 'Markdown'
        });
        count++;
      } catch (e) {
        console.error(`Gagal kirim ke ${uid}`, e);
      }
    }

    ctx.reply(`Broadcast terkirim ke ${count} user.`);
  });
}

module.exports = { registerAdminCommands };
