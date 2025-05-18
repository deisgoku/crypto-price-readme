const { Markup } = require('telegraf');
const { redis } = require('../../lib/redis');

const pendingAdminInput = new Map();

const ADMIN_KEY = 'tg:admin';
const PREMIUM_KEY = 'tg:premium';
const CEO_KEY = 'tg:ceo';


// === Helper ====
// === Validasi userId ===
function validateUserId(userId) {
  const strId = userId.toString();
  if (!/^\d{6,15}$/.test(strId)) {
    throw new Error(`Invalid userId: ${userId}`);
  }
  return strId;
}

// === Konversi @username atau ID jadi userId valid ===
async function resolveUserIdOrThrow(ctx, input) {
  let userId;
  if (input.startsWith('@')) {
    const user = await ctx.telegram.getChat(input);
    userId = user.id.toString();
  } else {
    userId = input.toString();
  }
  return validateUserId(userId); 
}



// === Data Ceo =====
// === Fungsi CEO ===
async function isCEO(userId) {
  const id = validateUserId(userId);
  return await redis.hexists(CEO_KEY, id) === 1;
}

async function setCEO(userId) {
  const id = validateUserId(userId);
  const envCEO = process.env.CEO_ID;

  if (id !== envCEO) {
    throw new Error('Kamu bukan CEO yang sah.');
  }

  await redis.hset(CEO_KEY, { [id]: '1' });
}

// === Data Admin ===
async function isAdmin(userId) {
  const id = validateUserId(userId);
  return await redis.hexists(ADMIN_KEY, id) === 1;
}
async function addAdmin(userId) {
  const id = validateUserId(userId);
  await redis.hset(ADMIN_KEY, { [id]: '1' });
}
async function removeAdmin(userId) {
  const id = validateUserId(userId);
  await redis.hdel(ADMIN_KEY, id);
}

// === Data Premium ===
async function isPremium(userId) {
  const id = validateUserId(userId);
  return await redis.hexists(PREMIUM_KEY, id) === 1;
}
async function addPremium(userId) {
  const id = validateUserId(userId);
  await redis.hset(PREMIUM_KEY, { [id]: '1' });
}
async function removePremium(userId) {
  const id = validateUserId(userId);
  await redis.hdel(PREMIUM_KEY, id);
}



// === Fungsi Admin ===
// =================
function requestAdminInput(ctx, key, promptText) {
  const id = ctx.from.id.toString();
  pendingAdminInput.set(id, key);
  return ctx.reply(promptText);
}


async function showRemoveAdminUI(ctx) {
  const admins = await redis.hkeys(ADMIN_KEY);
  if (!admins.length) {
    return ctx.reply('Tidak ada admin saat ini.');
  }

  const buttons = [];

  for (const id of admins) {
    let label = `ID ${id}`;
    try {
      const user = await ctx.telegram.getChat(id);
      if (user.username) {
        label = `@${user.username} (${id})`;
      } else if (user.first_name || user.last_name) {
        const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        label = `${name} (${id})`;
      }
    } catch (err) {
      // Jika gagal ambil data user, pakai ID saja
    }

    buttons.push([
      Markup.button.callback(`Hapus Admin: ${label}`, `confirm_remove_admin:${id}`)
    ]);
  }

  // Tombol kembali
  buttons.push([
    Markup.button.callback('⬅️ Kembali', 'admin_menu')
  ]);

  return ctx.reply('Pilih admin yang ingin dihapus:', Markup.inlineKeyboard(buttons));
}


// =====================
// Fungsi listAdmins
async function listAdmins(bot) {
  const all = await redis.hgetall(ADMIN_KEY);
  const ids = Object.keys(all || {});
  const results = await Promise.all(ids.map(async (id) => {
    try {
      const user = await bot.telegram.getChat(id);
      const name = user.username
        ? `@${user.username}`
        : user.first_name
          ? user.first_name
          : 'Tanpa Nama';
      return `- ${name} (${id})`;
    } catch {
      return `- (Tidak Dikenal) ${id}`;
    }
  }));
  return results.join('\n');
}


// === Fungsi Premium ===
// ================


async function showRemovePremiumUI(ctx) {
  const premiums = await redis.hkeys(PREMIUM_KEY);
  if (!premiums.length) {
    return ctx.reply('Tidak ada user premium saat ini.');
  }

  const buttons = [];

  for (const id of premiums) {
    let label = `ID ${id}`;
    try {
      const user = await ctx.telegram.getChat(id);
      if (user.username) {
        label = `@${user.username}`;
      } else if (user.first_name || user.last_name) {
        label = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      }
    } catch (err) {
      // Kalau gagal ambil info user, tetap pakai ID
    }

    buttons.push([
      Markup.button.callback(`Hapus Premium: ${label}`, `confirm_remove_premium:${id}`)
    ]);
  }

  // Tambahkan tombol kembali
  buttons.push([
    Markup.button.callback('⬅️ Kembali', 'admin_menu')
  ]);

  return ctx.reply('Pilih user premium yang ingin dihapus:', Markup.inlineKeyboard(buttons));
}

async function listPremiums(bot) {
  const all = await redis.hgetall(PREMIUM_KEY);
  const ids = Object.keys(all || {});
  const results = await Promise.all(ids.map(async (id) => {
    try {
      const user = await bot.telegram.getChat(id);
      const name = user.username
        ? `@${user.username}`
        : user.first_name
          ? user.first_name
          : 'Tanpa Nama';
      return `- ${name} (${id})`;
    } catch {
      return `- (Tidak Dikenal) ${id}`;
    }
  }));
  return results.join('\n');
}



// === Prompt input manual ===
function requestAdminInput(ctx, type, prompt) {
  const id = ctx.from.id.toString();
  pendingAdminInput.set(id, { type });
  return ctx.reply(`*${prompt}*\nKetik lalu kirim: /admininput <input>`, {
    parse_mode: 'Markdown'
  });
}

// === Menu Admin ===
async function showAdminMenu(ctx) {
  const text = '🧰 *Kelola Admin*';
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('➕ Add Admin', 'add_admin'),
      Markup.button.callback('➖ Remove Admin', 'remove_admin')
    ],
    [
      Markup.button.callback('💎 Add Premium', 'add_premium'),
      Markup.button.callback('🧹 Remove Premium', 'remove_premium')
    ],
    [
      Markup.button.callback('👤 Daftar Admin', 'list_admins'),
      Markup.button.callback('💎 Daftar Premium', 'list_premiums')
    ],
    [
      Markup.button.callback('📢 Broadcast', 'broadcast')
    ],
     [ Markup.button.callback('⬅️ Kembali', 'menu')
    ]
  ]);

  try {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  } catch {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  }
}
// === Ekspor ke bot ===
module.exports = bot => {

  // === Set CEO ===
  bot.command('setceo', async ctx => {
    await setCEO(ctx.from.id.toString());
    ctx.reply('Akses CEO berhasil diset.');
  });

  // === Menu Admin Utama ===
  bot.action('admin_menu', async ctx => {
    await ctx.answerCbQuery().catch(() => {}); 
    await showAdminMenu(ctx);
  });

  // === Tambah Admin ===
  bot.action('add_admin', async ctx => {
  await ctx.answerCbQuery().catch(() => {}); 
  const id = ctx.from.id.toString();
  if (!(await isCEO(id) || await isAdmin(id)))
    return ctx.reply('Hanya CEO atau Admin yang bisa menambah admin.');

  pendingAdminInput.set(id, 'addAdmin');
  return ctx.reply(
    '*Masukkan User ID atau @username yang ingin dijadikan admin:*\nKetik: /admininput 12345678 atau /admininput @username',
    { parse_mode: 'Markdown' }
  );
});

  // === Handler Input Admin ===
  bot.command('admin', async ctx => {
  const fromId = ctx.from.id.toString();
  const args = ctx.message.text.split(' ').slice(1);
  const input = args.join(' ').trim();

  if (!input) return ctx.reply('Input tidak boleh kosong.');

  const pending = pendingAdminInput.get(fromId);
  if (pending !== 'addAdmin') return ctx.reply('Tidak ada permintaan aktif.');

  if (!(await isCEO(fromId) || await isAdmin(fromId)))
    return ctx.reply('Hanya CEO atau Admin yang bisa melakukan ini.');

  try {
    const userId = await resolveUserIdOrThrow(ctx, input); // ini kunci
    await addAdmin(userId);
    await ctx.reply(`Berhasil menambahkan admin: ${userId}`);
  } catch (err) {
    await ctx.reply(`Gagal menambahkan admin: ${err.message}`);
  } finally {
    pendingAdminInput.delete(fromId);
  }
});

  // === Hapus Admin ===
bot.action(/^confirm_remove_admin:(.+)/, async ctx => {
  await ctx.answerCbQuery().catch(() => {}); 
  const id = ctx.from.id.toString();
  if (!(await isAdmin(id))) return ctx.answerCbQuery('⚠️ Kamu bukan admin.', { show_alert: true });

  const userId = ctx.match[1];

  let display = `\`${userId}\``; // fallback default

  try {
    const user = await ctx.telegram.getChat(userId);
    if (user.username) {
      display = `@${user.username}`;
    } else if (user.first_name || user.last_name) {
      display = `${user.first_name || ''} ${user.last_name || ''}`.trim() + `\nID: \`${userId}\``;
    }
  } catch {
    // fallback ke ID saja jika gagal fetch user
  }

  return ctx.reply(`⚠️ Yakin ingin menghapus admin *${display}*?`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Ya', `delete_admin_yes:${userId}`),
        Markup.button.callback('❌ Tidak', 'delete_admin_no')
      ]
    ])
  });
});

  bot.action(/^delete_admin_yes:(.+)/, async ctx => {
    await ctx.answerCbQuery().catch(() => {}); 
    const id = ctx.from.id.toString();
    if (!(await isAdmin(id))) return ctx.answerCbQuery('⚠️ Kamu bukan admin.', { show_alert: true });

    const userId = ctx.match[1];
    await removeAdmin(userId);
    return ctx.reply(`Admin ${userId} berhasil dihapus.`);
  });

  bot.action('delete_admin_no', async ctx => {
    await ctx.answerCbQuery('Dibatalkan');
  });

  bot.action('remove_admin', async ctx => {
    await ctx.answerCbQuery().catch(() => {}); 
    const id = ctx.from.id.toString();
    if (!(await isAdmin(id))) return ctx.answerCbQuery('⚠️ Kamu bukan admin.', { show_alert: true });
    return showRemoveAdminUI(ctx);
  });

  // === Lihat Daftar Admin ===
  bot.action('list_admins', async ctx => {
    ctx.answerCbQuery().catch(() => {}); 
    const all = await redis.hgetall(ADMIN_KEY);
    const ids = Object.keys(all || {});
    if (!ids.length) return ctx.answerCbQuery('Tidak ada admin.', { show_alert: true });

    const rows = [];
    for (const id of ids) {
      try {
        const user = await ctx.telegram.getChat(id);
        const label = user.username ? `@${user.username}` : user.first_name || 'Tanpa Nama';
        rows.push([Markup.button.callback(label, `view_admin_${id}`)]);
      } catch {
        rows.push([Markup.button.callback(`(Tidak dikenal)`, `view_admin_${id}`)]);
      }
    }

    rows.push([Markup.button.callback('⬅️ Kembali', 'admin_menu')]);

    await ctx.editMessageText('🧑‍💼 *Daftar Admin Aktif:*', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(rows)
    });
  });

  bot.action(/view_admin_(\d+)/, async ctx => {
    const id = ctx.match[1];
    try {
      const user = await ctx.telegram.getChat(id);
      const name = user.username ? `@${user.username}` : user.first_name || 'Tanpa Nama';
      await ctx.answerCbQuery(`${name} | ${id} aktif`, { show_alert: true });
    } catch {
      await ctx.answerCbQuery(`(Tidak dikenal) | ${id} aktif`, { show_alert: true });
    }
  });


  // === Tambah Premium ===
  bot.action('add_premium', async ctx => {
  await ctx.answerCbQuery().catch(() => {}); 
  const id = ctx.from.id.toString();
  if (!(await isAdmin(id))) return ctx.answerCbQuery('⚠️ Kamu bukan admin.', { show_alert: true });
  return requestAdminInput(ctx, 'add_premium', 'Masukkan User ID atau @username yang ingin dijadikan premium:\nContoh: /premiuminput @user atau /premiuminput 12345678');
});

// premiuminput command langsung eksekusi
bot.command('premiuminput', async ctx => {
  const fromId = ctx.from.id.toString();
  const args = ctx.message.text.split(' ').slice(1);
  const input = args.join(' ').trim();

  if (!input) return ctx.reply('Masukkan User ID atau @username');

  if (!(await isAdmin(fromId)))
    return ctx.reply('Hanya admin yang dapat memberikan akses premium.');

  try {
    const userId = await resolveUserIdOrThrow(ctx, input);
    await addPremium(userId);
    return ctx.reply(`Berhasil menambahkan premium: ${userId}`);
  } catch (err) {
    return ctx.reply(`Gagal menambahkan premium: ${err.message}`);
  }
});


// === Hapus Premium ===
bot.action(/^confirm_remove_premium:(.+)/, async ctx => {
  await ctx.answerCbQuery().catch(() => {}); 
  const id = ctx.from.id.toString();
  if (!(await isAdmin(id))) return ctx.answerCbQuery('⚠️ Kamu bukan admin.', { show_alert: true });

  const userId = ctx.match[1];
  let display = `\`${userId}\``;

  try {
    const user = await ctx.telegram.getChat(userId);
    if (user.username) {
      display = `@${user.username}`;
    } else if (user.first_name || user.last_name) {
      display = `${user.first_name || ''} ${user.last_name || ''}`.trim() + `\nID: \`${userId}\``;
    }
  } catch {
    // fallback jika gagal ambil info
  }

  return ctx.reply(`⚠️ Yakin ingin menghapus akses premium dari *${display}*?`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Ya', `delete_premium_yes:${userId}`),
        Markup.button.callback('❌ Tidak', 'delete_premium_no')
      ]
    ])
  });
});

  bot.action(/^delete_premium_yes:(.+)/, async ctx => {
    await ctx.answerCbQuery().catch(() => {}); 
    const id = ctx.from.id.toString();
    if (!(await isAdmin(id))) return ctx.answerCbQuery('⚠️ Kamu bukan admin.', { show_alert: true });

    const userId = ctx.match[1];
    await removePremium(userId);
    return ctx.reply(`Premium untuk ${userId} berhasil dihapus.`);
  });

  bot.action('delete_premium_no', async ctx => {
    await ctx.answerCbQuery('Dibatalkan');
  });

  bot.action('remove_premium', async ctx => {
    await ctx.answerCbQuery().catch(() => {}); 
    const id = ctx.from.id.toString();
    if (!(await isAdmin(id))) return ctx.answerCbQuery('⚠️ Kamu bukan admin.', { show_alert: true });
    return showRemovePremiumUI(ctx);
  });

  // === Lihat Daftar Premium ===
  bot.action('list_premiums', async ctx => {
  try {
    await ctx.answerCbQuery().catch(() => {});  // Penting! langsung respons query duluan

    const all = await redis.hgetall(PREMIUM_KEY);
    const ids = Object.keys(all || {});
    if (!ids.length) {
      return ctx.editMessageText('💎 *Daftar User Premium:*\n(Tidak ada user premium)', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Kembali', 'admin_menu')]
        ])
      });
    }

    const rows = await Promise.all(ids.map(async id => {
      try {
        const user = await ctx.telegram.getChat(id);
        const label = user.username ? `@${user.username}` : user.first_name || 'Tanpa Nama';
        return [Markup.button.callback(label, `view_premium_${id}`)];
      } catch {
        return [Markup.button.callback(`(Tidak dikenal) ${id}`, `view_premium_${id}`)];
      }
    }));

    rows.push([Markup.button.callback('⬅️ Kembali', 'admin_menu')]);

    await ctx.editMessageText('💎 *Daftar User Premium:*', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(rows)
    });
  } catch (err) {
    console.error('Error list_premiums:', err);
    await ctx.answerCbQuery('Terjadi kesalahan.', { show_alert: true });
  }
});

  bot.action(/view_premium_(\d+)/, async ctx => {
  const id = ctx.match[1];
  try {
    await ctx.answerCbQuery(); // <<< WAJIB cepat
    const user = await ctx.telegram.getChat(id);
    const name = user.username ? `@${user.username}` : user.first_name || 'Tanpa Nama';
    await ctx.answerCbQuery(`${name} | ${id} adalah user premium`, { show_alert: true });
    
  } catch {
    await ctx.answerCbQuery('🗨️Data user tidak ditemukan.', { show_alert: true });
  }
});

  // === Command list Premiums ===
  bot.command('listpremiums', async ctx => {
    const list = await listPremiums(bot);
    if (list.length) {
      ctx.reply(`🌟 *Daftar Premium:*\n${list}`, { parse_mode: 'Markdown' });
    } else {
      ctx.reply('Belum ada user premium.');
    }
  });

  // === Broadcast ke semua user ===
  // === 
bot.action('broadcast', async ctx => {
  await ctx.answerCbQuery();
  const id = ctx.from.id.toString();
  if (!(await isAdmin(id))) return ctx.reply('❌ Kamu bukan admin.');
  pendingAdminInput.set(id, 'broadcast');
  return ctx.reply('📢 *Tulis pesan broadcast yang ingin dikirim ke semua pengguna:*\n(Ketik /cancel untuk membatalkan)', {
    parse_mode: 'Markdown'
  });
});

// Handler khusus broadcast
// 
bot.hears(/^([^/!].*)$/, async ctx => {
  const id = ctx.from.id.toString();
  const mode = pendingAdminInput.get(id);

  // Hanya tangani jika sedang mode broadcast
  if (mode !== 'broadcast') return;

  const text = ctx.message?.text?.trim();
  if (!text) return;

  // pastikan admin
  if (!(await isAdmin(id))) return ctx.reply('❌ Kamu bukan admin.');

  pendingAdminInput.delete(id);

  const allUsers = await redis.smembers('tg:users');
  let sent = 0, failed = 0;

  for (const userId of allUsers) {
    try {
      await ctx.telegram.sendMessage(userId, text);
      sent++;
    } catch {
      failed++;
    }
  }

  return ctx.reply(`✅ *Broadcast selesai.*\n\nTerkirim: ${sent} pengguna\nGagal: ${failed}`, {
    parse_mode: 'Markdown'
  });
});

// Command cancel untuk membatalkan input
bot.command('cancel', async ctx => {
  const id = ctx.from.id.toString();

  if (!pendingAdminInput.has(id)) {
    return ctx.reply('⚠️ Tidak ada input yang sedang aktif.');
  }

  pendingAdminInput.delete(id);
  return ctx.reply('❎ Input dibatalkan.');
});

};
