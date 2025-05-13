// telegram/CTA/admin.js

const bcrypt = require('bcrypt');
const { redis } = require('../lib/redis');

const ADMIN_SET = 'tg:admins';
const USER_SET = 'tg:users';
const TOKEN_KEY = 'tg:tokens'; 
const CEO_KEY = 'ceo:access';

const GARAM = parseInt(process.env.GARAM || '10', 10);
const pendingAdminInput = new Map(); // key: userId, value: { type, step }

// Fungsi untuk verifikasi apakah user mengikuti
async function isFollowing(username) {
  const normalized = username.trim().toLowerCase();
  const exists = await redis.sismember('verified_followers', normalized);
  return exists === 1;
}

// Fungsi untuk menambahkan follower baru
async function addFollower(username) {
  const normalized = username.trim().toLowerCase();
  const alreadyExists = await isFollowing(normalized);
  if (alreadyExists) return { status: 'already_verified' };

  const added = await redis.sadd('verified_followers', normalized);
  return added === 1 ? { status: 'newly_verified' } : { status: 'error' };
}

// Fungsi untuk cek apakah user sudah terdaftar
async function isRegistered(username) {
  const normalized = username.trim().toLowerCase();
  const exists = await redis.hexists('user_passwords', normalized);
  return exists === 1;
}

// Fungsi register user dengan bcrypt hashing
async function registerUser(username, password) {
  const normalized = username.trim().toLowerCase();
  const userExists = await isRegistered(normalized);
  if (userExists) {
    return { status: 'error', error: 'Username already registered.' };
  }

  const hashedPassword = await bcrypt.hash(password, GARAM);
  await redis.hset('user_passwords', normalized, hashedPassword);
  return { status: 'success' };
}

// Fungsi login user dan mencocokkan password
async function loginUser(username, password) {
  const normalized = username.trim().toLowerCase();
  const storedHashedPassword = await redis.hget('user_passwords', normalized);
  if (!storedHashedPassword) {
    return { status: 'error', error: 'User not found. Please register first.' };
  }

  const passwordMatch = await bcrypt.compare(password, storedHashedPassword);
  return passwordMatch
    ? { status: 'success' }
    : { status: 'error', error: 'Invalid password.' };
}

// Fungsi untuk menambahkan admin
async function addAdmin(userId) {
  await redis.sadd(ADMIN_SET, userId);
}

// Fungsi untuk menghapus admin
async function removeAdmin(userId) {
  await redis.srem(ADMIN_SET, userId);
}

// Fungsi untuk mengecek apakah user admin
async function isAdmin(userId) {
  return await redis.sismember(ADMIN_SET, userId) === 1;
}

// Fungsi untuk daftar admin
async function listAdmins() {
  return await redis.smembers(ADMIN_SET);
}

// Fungsi untuk generate token admin
async function generateToken(type = 'admin') {
  const raw = Math.random().toString(36).substring(2, 10);
  const hashed = await bcrypt.hash(raw, GARAM);
  await redis.hset(TOKEN_KEY, raw, JSON.stringify({ type, hashed }));
  return raw;
}

// Fungsi klaim token
async function claimToken(userId, token) {
  const raw = await redis.hget(TOKEN_KEY, token);
  if (!raw) return null;

  const { type } = JSON.parse(raw);
  await redis.hdel(TOKEN_KEY, token);

  if (type === 'admin') await addAdmin(userId);
  return type;
}

// Fungsi untuk mengecek apakah user CEO
async function isCEO(userId) {
  const ceoHash = await redis.hget(CEO_KEY, userId);
  return ceoHash !== null;
}

// Fungsi untuk set CEO
async function setCEO(userId, password) {
  const hashed = await bcrypt.hash(password, GARAM);
  await redis.hset(CEO_KEY, userId, hashed);
}

// Fungsi untuk verifikasi CEO
async function verifyCEO(userId, password) {
  const hashed = await redis.hget(CEO_KEY, userId);
  if (!hashed) return false;
  return await bcrypt.compare(password, hashed);
}

// UI Menu Admin
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

// Register Admin Commands (misalnya claim token)
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

// Register Admin Actions
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
  verifyCEO,
  registerUser,
  loginUser
};
