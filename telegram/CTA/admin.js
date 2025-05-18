// telegram/CTA/admin.js

const { Markup } = require('telegraf');
const { redis } = require('../../lib/redis');

const pendingAdminInput = new Map();

// === Konstanta Key ===
const ADMIN_KEY = 'tg:admin';
const PREMIUM_KEY = 'tg:premium';
const CEO_KEY = 'tg:ceo';

// === Fungsi ADMIN ===
async function isAdmin(userId) {
  return await redis.hexists(ADMIN_KEY, userId) === 1;
}
async function addAdmin(userId) {
  await redis.hset(ADMIN_KEY, userId, '1');
}
async function removeAdmin(userId) {
  await redis.hdel(ADMIN_KEY, userId);
}
async function listAdmins() {
  const all = await redis.hgetall(ADMIN_KEY);
  return Object.keys(all || {});
}

// === Fungsi PREMIUM ===
async function isPremium(userId) {
  return await redis.hexists(PREMIUM_KEY, userId) === 1;
}
async function addPremium(userId) {
  await redis.hset(PREMIUM_KEY, userId, '1');
}
async function removePremium(userId) {
  await redis.hdel(PREMIUM_KEY, userId);
}
async function listPremiums() {
  const all = await redis.hgetall(PREMIUM_KEY);
  return Object.keys(all || {});
}

// === Fungsi CEO ===
async function isCEO(userId) {
  return await redis.hexists(CEO_KEY, userId) === 1;
}
async function setCEO(userId) {
  await redis.hset(CEO_KEY, userId, '1');
}

module.exports = bot => {

  // === Command Set CEO ===
  bot.command('setceo', async (ctx) => {
    await setCEO(ctx.from.id.toString());
    ctx.reply('Akses CEO berhasil diset.');
  });

  // === UI Admin Menu ===
  bot.action('admin_menu', async ctx => {
    await ctx.editMessageText('🧰 *Kelola Admin*', {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('➕ Add Admin', 'add_admin')],
        [Markup.button.callback('➖ Remove Admin', 'remove_admin')],
        [Markup.button.callback('💎 Add Premium', 'add_premium')],
        [Markup.button.callback('🧹 Remove Premium', 'remove_premium')],
        [Markup.button.callback('👤 Daftar Admin', 'list_admins')],
        [Markup.button.callback('💎 Daftar Premium', 'list_premiums')],
        [Markup.button.callback('📢 Broadcast', 'broadcast')],
        [Markup.button.callback('⬅️ Kembali', 'menu')],
      ])
    });
  });

  // === Aksi Tombol Admin ===
  bot.action('add_admin', async ctx => {
    const id = ctx.from.id.toString();
    if (!(await isCEO(id))) return ctx.answerCbQuery('Hanya CEO.', { show_alert: true });
    pendingAdminInput.set(id, { type: 'add_admin' });
    await ctx.editMessageText('Kirim *User ID* yang ingin dijadikan admin:', { parse_mode: 'Markdown' });
  });

  bot.action('remove_admin', async ctx => {
    const id = ctx.from.id.toString();
    if (!(await isAdmin(id))) return ctx.answerCbQuery('Kamu bukan admin.', { show_alert: true });
    pendingAdminInput.set(id, { type: 'remove_admin' });
    await ctx.editMessageText('Kirim *User ID* yang ingin dihapus dari admin:', { parse_mode: 'Markdown' });
  });

  bot.action('add_premium', async ctx => {
    const id = ctx.from.id.toString();
    if (!(await isAdmin(id))) return ctx.answerCbQuery('Kamu bukan admin.', { show_alert: true });
    pendingAdminInput.set(id, { type: 'add_premium' });
    await ctx.editMessageText('Kirim *User ID* yang ingin dijadikan premium:', { parse_mode: 'Markdown' });
  });

  bot.action('remove_premium', async ctx => {
    const id = ctx.from.id.toString();
    if (!(await isAdmin(id))) return ctx.answerCbQuery('Kamu bukan admin.', { show_alert: true });
    pendingAdminInput.set(id, { type: 'remove_premium' });
    await ctx.editMessageText('Kirim *User ID* yang ingin dihapus dari premium:', { parse_mode: 'Markdown' });
  });

  bot.action('list_admins', async ctx => {
    const id = ctx.from.id.toString();
    if (!(await isAdmin(id))) return ctx.answerCbQuery('Kamu bukan admin.', { show_alert: true });
    const list = await listAdmins();
    ctx.reply(list.length ? `Daftar Admin:\n${list.map(id => `- ${id}`).join('\n')}` : 'Belum ada admin.');
  });

  bot.action('list_premiums', async ctx => {
    const id = ctx.from.id.toString();
    if (!(await isAdmin(id))) return ctx.answerCbQuery('Kamu bukan admin.', { show_alert: true });
    const list = await listPremiums();
    ctx.reply(list.length ? `Daftar Premium:\n${list.map(id => `- ${id}`).join('\n')}` : 'Belum ada user premium.');
  });

  bot.action('broadcast', async ctx => {
    const id = ctx.from.id.toString();
    if (!(await isAdmin(id))) return ctx.answerCbQuery('Kamu bukan admin.', { show_alert: true });
    pendingAdminInput.set(id, { type: 'broadcast' });
    await ctx.editMessageText('Ketik pesan *broadcast* yang ingin dikirim ke semua user:', { parse_mode: 'Markdown' });
  });

  // === Handler Input Teks ===
  bot.on('text', async ctx => {
    const id = ctx.from.id.toString();
    if (!pendingAdminInput.has(id)) return;

    const { type } = pendingAdminInput.get(id);
    const input = ctx.message.text.trim();
    pendingAdminInput.delete(id);

    if (['add_admin', 'remove_admin', 'add_premium', 'remove_premium'].includes(type)) {
      if (!/^\d+$/.test(input)) return ctx.reply('User ID harus berupa angka.');
    }

    switch (type) {
      case 'add_admin':
        await addAdmin(input);
        return ctx.reply('Admin berhasil ditambahkan.');
      case 'remove_admin':
        await removeAdmin(input);
        return ctx.reply('Admin berhasil dihapus.');
      case 'add_premium':
        await addPremium(input);
        return ctx.reply('User sekarang premium.');
      case 'remove_premium':
        await removePremium(input);
        return ctx.reply('Premium user dihapus.');
      case 'broadcast':
        const userIds = await redis.smembers('tg:users');
        let sent = 0;
        for (const uid of userIds) {
          try {
            await ctx.telegram.sendMessage(uid, input);
            sent++;
          } catch (e) {}
        }
        return ctx.reply(`Broadcast terkirim ke ${sent} user.`);
    }
  });
};
