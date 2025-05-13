// telegram/CTA/admin.js

const { Markup } = require('telegraf');
const { redis } = require('../lib/redis');
const bcrypt = require('bcrypt');

const ADMIN_SET = 'tg:admins';
const USER_SET = 'tg:users';
const TOKEN_KEY = 'tg:tokens'; 
const CEO_KEY = 'ceo:access';

const GARAM = parseInt(process.env.GARAM || '10', 10);
const pendingAdminInput = new Map(); // key: userId, value: { type, step }

// ===== ADMIN =====
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

// ===== TOKEN SYSTEM (bcrypt) =====
async function generateToken(type = 'admin') {
  const raw = Math.random().toString(36).substring(2, 10);
  const hashed = await bcrypt.hash(raw, GARAM);
  await redis.hset(TOKEN_KEY, raw, JSON.stringify({ type, hashed }));
  return raw;
}

async function claimToken(userId, token) {
  const raw = await redis.hget(TOKEN_KEY, token);
  if (!raw) return null;

  const { type } = JSON.parse(raw);
  await redis.hdel(TOKEN_KEY, token);

  if (type === 'admin') await addAdmin(userId);
  return type;
}

// ===== CEO Check =====
async function isCEO(userId) {
  const ceoHash = await redis.hget(CEO_KEY, userId);
  return ceoHash !== null;
}
async function setCEO(userId, password) {
  const hashed = await bcrypt.hash(password, GARAM);
  await redis.hset(CEO_KEY, userId, hashed);
}
async function verifyCEO(userId, password) {
  const hashed = await redis.hget(CEO_KEY, userId);
  if (!hashed) return false;
  return await bcrypt.compare(password, hashed);
}

// ===== UI MENU =====
function getAdminMenu() {
  return [
    [Markup.button.callback('➕ Add Admin', 'add_admin')],
    [Markup.button.callback('➖ Remove Admin', 'remove_admin')],
    [Markup.button.callback('📢 Broadcast', 'broadcast')],
    [Markup.button.callback('🔑 Buat Token Admin', 'gen_token_admin')],
    [Markup.button.callback('👤 Daftar Admin', 'list_admins')],
    [Markup.button.callback('⬅️ Kembali', 'menu')]
  ];
}

// ====== COMMAND ======
function registerAdminCommands(bot) {
  bot.command('claim', async (ctx) => {
    const token = ctx.message.text.split(' ')[1];
    if (!token) return ctx.reply('Gunakan: /claim <token_key>');

    const result = await claimToken(ctx.from.id.toString(), token);
    if (!result) return ctx.reply('Token tidak valid atau sudah dipakai.');
    ctx.reply(`Token berhasil diklaim. Akses "${result}" aktif.`);
  });

  bot.command('setceo', async (ctx) => {
    const [_, password] = ctx.message.text.split(' ');
    if (!password) return ctx.reply('Gunakan: /setceo <password>');
    await setCEO(ctx.from.id.toString(), password);
    ctx.reply('Akses CEO berhasil disimpan.');
  });
}

// ====== INTERAKSI INLINE ======
function registerAdminActions(bot) {
  bot.action('gen_token_admin', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (!(await isCEO(userId))) {
      return ctx.answerCbQuery('Hanya CEO yang bisa membuat token admin.', { show_alert: true });
    }

    const token = await generateToken('admin');
    await ctx.reply(`🔑 *Token Admin dibuat:*\nGunakan /claim \`${token}\` untuk klaim akses admin.`, {
      parse_mode: 'Markdown'
    });
  });

  // ➖ Remove Admin
  bot.action('remove_admin', async (ctx) => {
    const fromId = ctx.from.id.toString();
    if (!(await isAdmin(fromId))) return ctx.answerCbQuery('Kamu bukan admin.', { show_alert: true });
    pendingAdminInput.set(fromId, { type: 'remove' });
    await ctx.editMessageText('Kirim *User ID* yang ingin **DIHAPUS** dari admin:', { parse_mode: 'Markdown' });
  });

  // 📢 Broadcast
  bot.action('broadcast', async (ctx) => {
    const fromId = ctx.from.id.toString();
    if (!(await isAdmin(fromId))) return ctx.answerCbQuery('Kamu bukan admin.', { show_alert: true });
    pendingAdminInput.set(fromId, { type: 'broadcast' });
    await ctx.editMessageText('Ketik pesan *broadcast* yang ingin dikirim ke semua user:', { parse_mode: 'Markdown' });
  });

  // 👤 Daftar Admin
  bot.action('list_admins', async (ctx) => {
    const fromId = ctx.from.id.toString();
    if (!(await isAdmin(fromId))) return ctx.answerCbQuery('Kamu bukan admin.', { show_alert: true });
    const admins = await listAdmins();
    await ctx.reply(admins.length
      ? `Daftar Admin:\n${admins.map(id => `- ${id}`).join('\n')}`
      : 'Tidak ada admin.');
  });

  // Input Handler dari semua mode (add/remove/broadcast)
  bot.on('text', async (ctx) => {
    const fromId = ctx.from.id.toString();
    const pending = pendingAdminInput.get(fromId);
    if (!pending) return;

    const text = ctx.message.text.trim();

    if (pending.type === 'add') {
      if (!/^\d+$/.test(text)) return ctx.reply('User ID tidak valid.');
      await addAdmin(text);
      ctx.reply(`User ${text} sudah ditambahkan sebagai admin.`);
    }

    if (pending.type === 'remove') {
      await removeAdmin(text);
      ctx.reply(`User ${text} sudah dihapus dari admin.`);
    }

    if (pending.type === 'broadcast') {
      const userIds = await redis.smembers(USER_SET);
      let count = 0;
      for (const uid of userIds) {
        try {
          await ctx.telegram.sendMessage(uid, `\u{1F4E1} *Broadcast:*\n${text}`, {
            parse_mode: 'Markdown'
          });
          count++;
        } catch (e) {
          console.error(`Gagal kirim ke ${uid}`, e);
        }
      }
      ctx.reply(`Broadcast terkirim ke ${count} user.`);
    }

    pendingAdminInput.delete(fromId);
  });



 
}

module.exports = {
  registerAdminCommands,
  registerAdminActions,
  getAdminMenu,
  isAdmin,
  addAdmin,
  removeAdmin,
  listAdmins,
  generateToken,
  claimToken,
  isCEO,
  setCEO,
  verifyCEO
};
