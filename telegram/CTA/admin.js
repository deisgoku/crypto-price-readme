const { Markup } = require('telegraf');
const { redis } = require('../../lib/redis');

const pendingAdminInput = new Map();

const ADMIN_KEY = 'tg:admin';
const PREMIUM_KEY = 'tg:premium';
const CEO_KEY = 'tg:ceo';

// === Validasi userId ===
function validateUserId(userId) {
  const strId = userId.toString();
  if (!/^\d{6,15}$/.test(strId)) {
    throw new Error(`Invalid userId: ${userId}`);
  }
  return strId;
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
  await redis.hset(ADMIN_KEY, id, '1');
}
// fungsi remove admin
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
  await redis.hset(PREMIUM_KEY, id, '1');
}
async function removePremium(userId) {
  const id = validateUserId(userId);
  await redis.hdel(PREMIUM_KEY, id);
}
// ================




// === Fungsi Admin ===
// =================
async function showRemoveAdminUI(ctx) {
  const admins = await redis.hkeys(ADMIN_KEY);
  if (!admins.length) return ctx.reply('Tidak ada admin saat ini.');

  const buttons = admins.map(id => [{
    text: `Hapus Admin ${id}`,
    callback_data: `confirm_remove_admin:${id}`
  }]);

  return ctx.reply('Pilih admin yang ingin dihapus:', {
    reply_markup: { inline_keyboard: buttons }
  });
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
  if (!premiums.length) return ctx.reply('Tidak ada user premium saat ini.');

  const buttons = premiums.map(id => [{
    text: `Hapus Premium ${id}`,
    callback_data: `confirm_remove_premium:${id}`
  }]);

  return ctx.reply('Pilih user premium yang ingin dihapus:', {
    reply_markup: { inline_keyboard: buttons }
  });
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

  bot.command('setceo', async ctx => {
    await setCEO(ctx.from.id.toString());
    ctx.reply('Akses CEO berhasil diset.');
  });

  bot.action('admin_menu', async ctx => {
    await ctx.answerCbQuery();
    await showAdminMenu(ctx);
  });

// ===============

  bot.action('add_admin', async (ctx) => {
  await ctx.answerCbQuery();
  const id = ctx.from.id.toString();

  if (!(await isCEO(id) || await isAdmin(id)))
    return ctx.reply('Hanya CEO atau Admin yang bisa menambah admin.');

  // Simpan status untuk user ini
  pendingAdminInput.set(id, 'addAdmin');

  return ctx.reply(
    '*Masukkan User ID yang ingin dijadikan admin:*\nKetik: /admininput <user_id>',
    { parse_mode: 'Markdown' }
  );
});

  // === Handler input dari /admininput <isi> ===
  bot.command('admininput', async (ctx) => {
  const fromId = ctx.from.id.toString();
  const args = ctx.message.text.split(' ').slice(1);
  const input = args.join(' ').trim();

  if (!input) return ctx.reply('Input tidak boleh kosong.');

  const pending = pendingAdminInput.get(fromId);
  if (pending !== 'addAdmin') {
    return ctx.reply('Tidak ada permintaan aktif untuk menambahkan admin.');
  }

  if (!(await isCEO(fromId) || await isAdmin(fromId))) {
    return ctx.reply('Hanya CEO atau Admin yang bisa melakukan ini.');
  }

  try {
    await addAdmin(input);
    await ctx.reply(`Berhasil menambahkan admin: ${input}`);
  } catch (err) {
    await ctx.reply(`Gagal menambahkan admin: ${err.message}`);
  } finally {
    pendingAdminInput.delete(fromId);
  }
});

// ========={{{ Area UI remove Admin =======
bot.action(/^confirm_remove_admin:(.+)/, async ctx => {
  await ctx.answerCbQuery();
  const id = ctx.from.id.toString();
  if (!(await isAdmin(id))) return ctx.reply('Kamu bukan admin.');

  const userId = ctx.match[1];
  return ctx.reply(`Yakin ingin menghapus admin ${userId}?`, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Ya', callback_data: `delete_admin_yes:${userId}` },
          { text: 'Tidak', callback_data: 'delete_admin_no' }
        ]
      ]
    }
  });
});


bot.action(/^delete_admin_yes:(.+)/, async ctx => {
  await ctx.answerCbQuery();
  const id = ctx.from.id.toString();
  if (!(await isAdmin(id))) return ctx.reply('Kamu bukan admin.');

  const userId = ctx.match[1];
  await removeAdmin(userId);
  return ctx.reply(`Admin ${userId} berhasil dihapus.`);
});

bot.action('delete_admin_no', async ctx => {
  await ctx.answerCbQuery('Dibatalkan');
});

  bot.action('remove_admin', async ctx => {
  await ctx.answerCbQuery();
  const id = ctx.from.id.toString();
  if (!(await isAdmin(id))) return ctx.reply('Kamu bukan admin.');
  return showRemoveAdminUI(ctx);
});


// =========Aeea view List Admin =====
  bot.action('list_admins', async ctx => {
  const all = await redis.hgetall(ADMIN_KEY);
  const ids = Object.keys(all || {});

  if (!ids.length) {
    return ctx.answerCbQuery('Tidak ada user admin tersedia', { show_alert: true });
  }

  const rows = [];

  for (const id of ids) {
    try {
      const user = await ctx.telegram.getChat(id);
      const label = user.username
        ? `@${user.username}`
        : user.first_name || 'Tanpa Nama';

      rows.push([Markup.button.callback(label, `view_admin_${id}`)]);
    } catch {
      rows.push([Markup.button.callback(`(Tidak dikenal)`, `view_admin_${id}`)]);
    }
  }

  rows.push([Markup.button.callback('⬅️ Kembali', 'admin_menu')]);

  await ctx.editMessageText('🧑‍💼 *Daftar Admin Aktif:*', {
    parse_mode: 'Markdown',
    reply_markup: Markup.inlineKeyboard(rows)
  });
});


  bot.action(/view_admin_(\d+)/, async ctx => {
  const id = ctx.match[1];
  try {
    const user = await ctx.telegram.getChat(id);
    const username = user.username ? `@${user.username}` : user.first_name || 'Tanpa Nama';
    await ctx.answerCbQuery(`${username} | ${id} aktif`, { show_alert: true });
  } catch {
    await ctx.answerCbQuery(`(Tidak dikenal) | ${id} aktif`, { show_alert: true });
  }
});






// ======{ Area Pfemium ======


  bot.action('add_premium', async ctx => {
    await ctx.answerCbQuery();
    const id = ctx.from.id.toString();
    if (!(await isAdmin(id))) return ctx.reply('Kamu bukan admin.');
    return requestAdminInput(ctx, 'add_premium', 'Masukkan User ID yang ingin dijadikan premium:');
  });

bot.action(/^confirm_remove_premium:(.+)/, async ctx => {
  await ctx.answerCbQuery();
  const id = ctx.from.id.toString();
  if (!(await isAdmin(id))) return ctx.reply('Kamu bukan admin.');

  const userId = ctx.match[1];
  return ctx.reply(`Yakin ingin menghapus premium dari ${userId}?`, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Ya', callback_data: `delete_premium_yes:${userId}` },
          { text: 'Tidak', callback_data: 'delete_premium_no' }
        ]
      ]
    }
  });
});


bot.action(/^delete_premium_yes:(.+)/, async ctx => {
  await ctx.answerCbQuery();
  const id = ctx.from.id.toString();
  if (!(await isAdmin(id))) return ctx.reply('Kamu bukan admin.');

  const userId = ctx.match[1];
  await removePremium(userId);
  return ctx.reply(`Premium untuk ${userId} berhasil dihapus.`);
});

bot.action('delete_premium_no', async ctx => {
  await ctx.answerCbQuery('Dibatalkan');
});


  bot.action('remove_premium', async ctx => {
  await ctx.answerCbQuery();
  const id = ctx.from.id.toString();
  if (!(await isAdmin(id))) return ctx.reply('Kamu bukan admin.');
  return showRemovePremiumUI(ctx);
});
  
  bot.action('list_premiums', async ctx => {
    const all = await redis.hgetall(PREMIUM_KEY);
    const ids = Object.keys(all || {});

    if (!ids.length) {
      return ctx.answerCbQuery('Tidak ada user premium tersedia', { show_alert: true });
    }

    const rows = await Promise.all(ids.map(async id => {
      try {
        const user = await ctx.telegram.getChat(id);
        const label = user.username
          ? `@${user.username}`
          : user.first_name || 'Tanpa Nama';
        return [Markup.button.callback(label, `view_premium_${id}`)];
      } catch {
        return [Markup.button.callback(`(Tidak dikenal) ${id}`, `view_premium_${id}`)];
      }
    }));

    rows.push([Markup.button.callback('⬅️ Kembali', 'admin_menu')]);

    await ctx.editMessageText('💎 *Daftar User Premium:*', {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(rows)
    });
  });

  bot.action(/view_premium_(\d+)/, async ctx => {
    const id = ctx.match[1];
    try {
      const user = await ctx.telegram.getChat(id);
      const username = user.username ? `@${user.username}` : user.first_name || 'Tanpa Nama';
      await ctx.answerCbQuery(`${username} | ${id} premium`, { show_alert: true });
    } catch {
      await ctx.answerCbQuery(`(Tidak dikenal) | ${id} premium`, { show_alert: true });
    }
  });

//======= Area Command  Premium ========
  bot.command('listpremiums', async (ctx) => {
  await ctx.answerCbQuery();
  const list = await listPremiums(bot);
  if (list.length) {
    ctx.reply(`🌟 *Daftar Premium:*\n${list}`, { parse_mode: 'Markdown' });
  } else {
    ctx.reply('Belum ada user premium.');
  }
});

  bot.action('broadcast', async ctx => {
    await ctx.answerCbQuery();
    const id = ctx.from.id.toString();
    if (!(await isAdmin(id))) return ctx.reply('Kamu bukan admin.');
    return requestAdminInput(ctx, 'broadcast', 'Tulis isi broadcast yang ingin dikirim ke semua user:');
  });



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
