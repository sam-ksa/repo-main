const { MessageActionRow, MessageSelectMenu, MessageAttachment } = require('discord.js');
const ui = require('../../lib/ui');
const panel = require('../../lib/panel');
const style = require('../../lib/panelStyle');
const emojis = require('../../lib/emojis');
const perms = require('../../lib/perms');
const botSettings = require('../../lib/botSettings');

const OPTIONS = [
  { label: 'تغيير شعار اللوحة', value: 'logo' },
  { label: 'تغيير اسم اللوحة', value: 'brand', description: 'النص الصغير فوق يسار اللوحة (Panel Tek)' },
  { label: 'تغيير عنوان اللوحة', value: 'title', description: 'العنوان الكبير (توب القروبات)' },
  { label: 'تغيير لون اللوحة', value: 'color' },
  { label: 'تغيير خلفية اللوحة', value: 'background' },
  { label: 'تغيير تعتيم الخلفية', value: 'dim', description: 'من 0 (الصورة كاملة) إلى 80 (أغمق)' },
  { label: 'إزالة خلفية اللوحة', value: 'removeBackground' },
  { label: 'تغيير مدة تحديث اللوحة', value: 'interval', description: 'بالثواني، من 30 إلى 3600 (الافتراضي 60)' },
  { label: 'إرجاع التصميم الافتراضي', value: 'reset' },
];

// لون الإيموجيات عام لكل السيرفرات (إيموجيات البوت نفسه)، فيظهر لأونر البوت فقط
const EMOJI_OPTION = { label: 'تغيير لون الإيموجيات', value: 'emojiColor', description: 'لكل السيرفرات (أونر البوت فقط)' };

const { RESET_WORDS } = ui;

async function applyImage(message, data, kind, prompt) {
  const img = await ui.askImage(message, `${prompt}\n-# اكتب افتراضي للإرجاع للأصل`);
  if (!img) return null;
  if (img.reset) return 'reset';
  try {
    await style.setImage(message.guild.id, data, kind, img.urls);
  } finally {
    img.done();
  }
  return 'ok';
}

// نص (العنوان أو الاسم) مع إمكانية الإرجاع للأصل
async function askText(message, data, key, label) {
  const ans = await ui.ask(message, `**اكتب ${label} الجديد:**\n-# الحالي: ${style.getStyle(data)[key]}، واكتب افتراضي للإرجاع للأصل`);
  if (!ans) return null;
  ans.delete().catch(() => {});
  const t = ans.content.trim();
  if (RESET_WORDS.includes(t.toLowerCase())) { style.resetItem(message.guild.id, data, key); return `رجع ${label} للأصل.`; }
  if (t.length < 2 || t.length > 32) { message.reply(`**${label} لازم يكون بين 2 و 32 حرف.**`).catch(() => {}); return null; }
  style.update(message.guild.id, data, { [key]: t });
  return `صار ${label}: ${t}`;
}

const actions = {
  async logo(message, data) {
    const r = await applyImage(message, data, 'logo', '**أرفق صورة الشعار الجديد أو أرسل رابطها:**\n-# يفضل صورة مربعة بخلفية شفافة');
    if (!r) return null;
    if (r === 'reset') { style.resetItem(message.guild.id, data, 'logo'); return 'رجع شعار اللوحة للأصل.'; }
    return 'تم تغيير شعار اللوحة.';
  },

  async title(message, data) {
    return askText(message, data, 'title', 'عنوان اللوحة');
  },

  async brand(message, data) {
    return askText(message, data, 'brand', 'اسم اللوحة');
  },

  async dim(message, data) {
    const ans = await ui.ask(message, `**اكتب نسبة تعتيم الخلفية من 0 إلى 80:**\n-# الحالي: ${style.getStyle(data).dim}، و0 يعني الصورة كاملة بدون تعتيم`);
    if (!ans) return null;
    ans.delete().catch(() => {});
    const raw = ans.content.trim().replace('%', '');
    if (RESET_WORDS.includes(raw.toLowerCase())) { style.resetItem(message.guild.id, data, 'dim'); return 'رجع تعتيم الخلفية للأصل.'; }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > 80) { message.reply('**اكتب رقم من 0 إلى 80.**').catch(() => {}); return null; }
    style.update(message.guild.id, data, { dim: n });
    const note = style.getStyle(data).background ? '' : ' (يبان لما تحط خلفية)';
    return `صار تعتيم الخلفية: ${n}${note}`;
  },

  async color(message, data) {
    const ans = await ui.ask(message, `**اكتب كود اللون الجديد (مثال: ${style.DEFAULTS.color}):**\n-# الحالي: ${style.getStyle(data).color}، واكتب افتراضي للإرجاع للأصل`);
    if (!ans) return null;
    ans.delete().catch(() => {});
    const raw = ans.content.trim();
    if (RESET_WORDS.includes(raw.toLowerCase())) { style.resetItem(message.guild.id, data, 'color'); return 'رجع لون اللوحة للأصل.'; }
    const c = raw.replace(/^#?/, '#');
    if (!/^#[0-9a-f]{6}$/i.test(c)) { message.reply('**كود لون غير صالح.**').catch(() => {}); return null; }
    style.update(message.guild.id, data, { color: c.toLowerCase() });
    return `صار لون اللوحة: ${c.toLowerCase()}`;
  },

  async background(message, data) {
    const r = await applyImage(message, data, 'background', '**أرفق صورة الخلفية الجديدة أو أرسل رابطها:**\n-# يفضل صورة عريضة، والبوت يضيف عليها تعتيم عشان الكتابة تبان');
    if (!r) return null;
    if (r === 'reset') { style.resetItem(message.guild.id, data, 'background'); return 'رجعت الخلفية الافتراضية.'; }
    return 'تم تغيير خلفية اللوحة.';
  },

  async removeBackground(message, data) {
    style.resetItem(message.guild.id, data, 'background');
    return 'تمت إزالة الخلفية.';
  },

  async interval(message, data) {
    const current = panel.intervalOf(data);
    const ans = await ui.ask(message, `**اكتب مدة تحديث اللوحة بالثواني (من ${panel.MIN_INTERVAL} إلى ${panel.MAX_INTERVAL}):**
-# الحالي: ${current} ثانية، واكتب افتراضي للإرجاع لـ ${panel.DEFAULT_INTERVAL}`);
    if (!ans) return null;
    ans.delete().catch(() => {});
    const raw = ans.content.trim();
    const n = RESET_WORDS.includes(raw.toLowerCase()) ? panel.DEFAULT_INTERVAL : Number(raw);
    if (!Number.isInteger(n) || n < panel.MIN_INTERVAL || n > panel.MAX_INTERVAL) {
      message.reply(`**اكتب رقم من ${panel.MIN_INTERVAL} إلى ${panel.MAX_INTERVAL}.**`).catch(() => {});
      return null;
    }
    await panel.setRefreshInterval(message.guild, data, n);
    return `صارت اللوحة تتحدث كل ${n} ثانية`;
  },

  async emojiColor(message) {
    const client = message.client;
    if (!perms.isBotOwner(client, message.author.id)) {
      message.reply('**هذا الخيار لأونر البوت فقط، لأنه يغيّر الإيموجيات في كل السيرفرات.**').catch(() => {});
      return null;
    }
    const ans = await ui.ask(message, `**اكتب لون الإيموجيات الجديد (مثال: ${emojis.DEFAULT_COLOR}):**
-# الحالي: ${emojis.getColor()}، واكتب افتراضي للإرجاع للأصل`);
    if (!ans) return null;
    ans.delete().catch(() => {});
    const raw = ans.content.trim();
    const c = RESET_WORDS.includes(raw.toLowerCase()) ? emojis.DEFAULT_COLOR : raw.replace(/^#?/, '#').toLowerCase();
    if (!emojis.validColor(c)) { message.reply('**كود لون غير صالح.**').catch(() => {}); return null; }
    if (c === emojis.getColor()) return `الإيموجيات أصلاً باللون ${c}`;
    const wait = await message.reply(`**جاري تجهيز الإيموجيات باللون ${c}... ممكن ياخذ دقيقة، والبوت يشتغل عادي خلالها.**`);
    const r = await emojis.sync(client, c);
    client.config.emojiColor = c;
    botSettings.set('emojiColor', c);
    wait.edit(`**جهزت ${r.ready} من ${r.total} إيموجي باللون ${c}${r.failed ? ` (فشل ${r.failed}، بتنعاد المحاولة مع التشغيل الجاي)` : ''}.**`).catch(() => {});
    return `صار لون الإيموجيات: ${c}`;
  },

  async reset(message, data) {
    style.resetAll(message.guild.id, data);
    return 'رجع تصميم اللوحة للافتراضي.';
  },
};

async function preview(message, data, note) {
  const img = new MessageAttachment(await panel.render(message.guild, data), 'top.png');
  const e = ui.embed(data)
    .setTitle('تخصيص لوحة التوب')
    .setDescription(`${note ? `**${note}**\n` : ''}اختر من القائمة اللي تبي تغيّره، والتغيير يتطبق على كل لوحات التوب في السيرفر`)
    .setImage('attachment://top.png');
  return { e, img };
}

module.exports = {
  name: 'customize',
  aliases: ['تخصيص'],
  level: 'manager',
  description: 'تخصيص تصميم لوحة التوب (الشعار، الاسم، اللون، الخلفية)',
  usage: 'customize',
  actions,
  async run(client, message, args, { data }) {
    const menu = () => new MessageActionRow().addComponents(
      new MessageSelectMenu().setCustomId('customize:menu').setPlaceholder('اختر التخصيص').addOptions(
        [...OPTIONS, ...(perms.isBotOwner(client, message.author.id) ? [EMOJI_OPTION] : [])]
          .map((o) => emojis.option(o, `menu:${o.value}`)),
      ),
    );
    const first = await preview(message, data);
    const msg = await message.reply(ui.withLogo({ embeds: [first.e], components: [menu()] }, [first.img]));

    const col = msg.createMessageComponentCollector({ filter: (i) => i.user.id === message.author.id, time: 300000 });
    let busy = false;
    col.on('collect', async (i) => {
      await i.deferUpdate().catch(() => {});
      if (busy) return; // ننتظر ينتهي التخصيص الحالي
      busy = true;
      try {
        const note = await actions[i.values[0]](message, data);
        if (!note) return;
        col.resetTimer();
        // تحديث المعاينة + لوحة التوب الموجودة في السيرفر
        const p = await preview(message, data, note);
        await msg.edit(ui.editWithLogo({ embeds: [p.e], components: [menu()] }, [p.img])).catch(() => {});
        panel.update(message.guild, { force: true }).catch(() => {});
      } catch (e) {
        message.reply(`**${e.userMessage || 'حدث خطأ أثناء التخصيص.'}**`).catch(() => {});
        if (!e.userMessage) console.error('[customize]', e);
      } finally {
        busy = false;
      }
    });
    col.on('end', () => msg.edit(ui.addSupport({ components: [] }, true)).catch(() => {}));
  },
};
