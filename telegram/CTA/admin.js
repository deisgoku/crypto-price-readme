// telegram/CTA/admin.js
// Author : Deisgoku

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

// ===== TOKEN SYSTEM  =====
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
function getAdminMenu(ctx) {
  return [
    [Markup.button.callback(ctx.i18n.t('admin.add_admin'), 'add_admin')],
    [Markup.button.callback(ctx.i18n.t('admin.remove_admin'), 'remove_admin')],
    [Markup.button.callback(ctx.i18n.t('admin.broadcast'), 'broadcast')],
    [Markup.button.callback(ctx.i18n.t('admin.gen_token_admin'), 'gen_token_admin')],
    [Markup.button.callback(ctx.i18n.t('admin.list_admins'), 'list_admins')],
    [Markup.button.callback(ctx.i18n.t('admin.back'), 'menu')]
  ];
}

// ====== COMMAND ======
function registerAdminCommands(bot) {
  bot.command('claim', async (ctx) => {
    const token = ctx.message.text.split(' ')[1];
    if (!token) return ctx.reply(ctx.i18n.t('admin.claim_usage'));

    const result = await claimToken(ctx.from.id.toString(), token);
    if (!result) return ctx.reply(ctx.i18n.t('admin.token_invalid'));
    ctx.reply(ctx.i18n.t('admin.token_claimed', { type: result }));
  });

  bot.command('setceo', async (ctx) => {
    const [_, password] = ctx.message.text.split(' ');
    if (!password) return ctx.reply(ctx.i18n.t('admin.setceo_usage'));
    await setCEO(ctx.from.id.toString(), password);
    ctx.reply(ctx.i18n.t('admin.ceo_set_success'));
  });
}

// ====== INTERAKSI INLINE ======
function registerAdminActions(bot) {
  bot.action('gen_token_admin', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (!(await isCEO(userId))) {
      return ctx.answerCbQuery(ctx.i18n.t('admin.only_ceo'), { show_alert: true });
    }

    const token = await generateToken('admin');
    await ctx.reply(ctx.i18n.t('admin.token_generated', { token }), {
      parse_mode: 'Markdown'
    });
  });

  // ➖ Remove Admin
  bot.action('remove_admin', async (ctx) => {
    const fromId = ctx.from.id.toString();
    if (!(await isAdmin(fromId))) return ctx.answerCbQuery(ctx.i18n.t('admin.not_admin'), { show_alert: true });
    pendingAdminInput.set(fromId, { type: 'remove' });
    await ctx.editMessageText(ctx.i18n.t('admin.remove_prompt'), { parse_mode: 'Markdown' });
  });

  // 📢 Broadcast
  bot.action('broadcast', async (ctx) => {
    const fromId = ctx.from.id.toString();
    if (!(await isAdmin(fromId))) return ctx.answerCbQuery(ctx.i18n.t('admin.not_admin'), { show_alert: true });
    pendingAdminInput.set(fromId, { type: 'broadcast' });
    await ctx.editMessageText(ctx.i18n.t('admin.broadcast_prompt'), { parse_mode: 'Markdown' });
  });

  // 👤 Daftar Admin
  bot.action('list_admins', async (ctx) => {
    const fromId = ctx.from.id.toString();
    if (!(await isAdmin(fromId))) return ctx.answerCbQuery(ctx.i18n.t('admin.not_admin'), { show_alert: true });
    const admins = await listAdmins();
    await ctx.reply(admins.length
      ? ctx.i18n.t('admin.admin_list', { list: admins.map(id => `- ${id}`).join('\n') })
      : ctx.i18n.t('admin.no_admins'));
  });

  // Input Handler dari semua mode (add/remove/broadcast)
  bot.on('text', async (ctx) => {
    const fromId = ctx.from.id.toString();
    const pending = pendingAdminInput.get(fromId);
    if (!pending) return;

    const text = ctx.message.text.trim();

    if (pending.type === 'add') {
      if (!/^\d+$/.test(text)) return ctx.reply(ctx.i18n.t('admin.invalid_user_id'));
      await addAdmin(text);
      ctx.reply(ctx.i18n.t('admin.added', { userId: text }));
    }

    if (pending.type === 'remove') {
      await removeAdmin(text);
      ctx.reply(ctx.i18n.t('admin.removed', { userId: text }));
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
      ctx.reply(ctx.i18n.t('admin.broadcast_sent', { count }));
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
