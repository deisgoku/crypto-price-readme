const { Markup } = require('telegraf');
const { redis } = require('../../lib/redis');

const pendingAdminInput = new Map();

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

// === Util Input Manual ===
function requestAdminInput(ctx, type, prompt) {
  const id = ctx.from.id.toString();
  pendingAdminInput.set(id, { type });
  return ctx.reply(`*${prompt}*\nKetik sekarang lalu kirim pakai perintah: /admininput <input>`, { parse_mode: 'Markdown' });
}

module.exports = bot => {

  bot.command('setceo', async ctx => {
    await setCEO(ctx.from.id.toString());
    ctx.reply('Akses CEO berhasil diset.');
  });

  bot.action('admin_menu', async ctx => {
  await ctx.editMessageText(
    '🧰 *Kelola Admin*',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('➕ Add Admin', 'add_admin')],
        [Markup.button.callback('➖ Remove Admin', 'remove_admin')],
        [Markup.button.callback('💎 Add Premium', 'add_premium')],
        [Markup.button.callback('🧹 Remove Premium', 'remove_premium')],
        [Markup.button.callback('👤 Daftar Admin', 'list_admins')],
        [Markup.button.callback('💎 Daftar Premium', 'list_premiums')],
        [Markup.button.callback('📢 Broadcast', 'broadcast')],
        [Markup.button.callback('⬅️ Kembali', 'menu')],
      ])
    }
  );
});

  bot.action('add_admin', async ctx => {
    const id = ctx.from.id.toString();
    if (!(await isCEO(id))) return ctx.answerCbQuery('Hanya CEO.', { show_alert: true });
    return requestAdminInput(ctx, 'add_admin', 'Masukkan User ID untuk dijadikan admin:');
  });

  bot.action('remove_admin', async ctx => {
    const id = ctx.from.id.toString();
    if (!(await isAdmin(id))) return ctx.answerCbQuery('Kamu bukan admin.', { show_alert: true });
    return requestAdminInput(ctx, 'remove_admin', 'Masukkan User ID untuk dihapus dari admin:');
  });

  bot.action('add_premium', async ctx => {
    const id = ctx.from.id.toString();
    if (!(await isAdmin(id))) return ctx.answerCbQuery('Kamu bukan admin.', { show_alert: true });
    return requestAdminInput(ctx, 'add_premium', 'Masukkan User ID yang ingin dijadikan premium:');
  });

  bot.action('remove_premium', async ctx => {
    const id = ctx.from.id.toString();
    if (!(await isAdmin(id))) return ctx.answerCbQuery('Kamu bukan admin.', { show_alert: true });
    return requestAdminInput(ctx, 'remove_premium', 'Masukkan User ID yang ingin dihapus dari premium:');
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
    return requestAdminInput(ctx, 'broadcast', 'Tulis isi broadcast yang ingin dikirim ke semua user:');
  });

  // === Input final manual pakai /admininput <isi> ===
  bot.command('admininput', async ctx => {
    const id = ctx.from.id.toString();
    if (!pendingAdminInput.has(id)) return;

    const { type } = pendingAdminInput.get(id);
    const input = ctx.message.text.replace(/^\/admininput(@\w+)?\s*/, '').trim();
    pendingAdminInput.delete(id);

    if (!input) return ctx.reply('Input tidak boleh kosong.');

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
          } catch {}
        }
        return ctx.reply(`Broadcast terkirim ke ${sent} user.`);
    }
  });

};
