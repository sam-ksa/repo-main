const emojis = require('../../lib/emojis');
const { MessageActionRow, MessageSelectMenu, MessageButton } = require('discord.js');
const ui = require('../../lib/ui');
const sub = require('../../lib/subscription');
const { saveConfig } = require('../../lib/config');
const botSettings = require('../../lib/botSettings');
const { restart } = require('../../lib/restart');

// امبيد معلومات الاشتراك (نفس منطق Bots Settings في سورس الميوزك، ومحلياً كل القيم "-")
async function subscriptionEmbed(data, client, guildId) {
  const s = await sub.read({ guildId });
  const val = (v) => (v == null ? '-' : `**${v}**`);
  const remaining = s && s.remainingMs != null ? sub.formatRemaining(s.remainingMs) : null;
  // هذا السورس بوت واحد: إذا ما حدد نظام الاشتراكات عدد البوتات، نعتبره 1، والمتصل = هذا البوت
  const bots = s ? (s.bots ?? 1) : null;
  const active = s ? (s.activeBots ?? (client && client.isReady() ? 1 : 0)) : null;
  return ui.embed(data)
    .setDescription([
      `المالك : ${s && s.owner ? `<@${s.owner}>` : '-'}`,
      `مدة الاشتراك : ${val(remaining)}`,
      `كود الاشتراك : ${val(s && s.code)}`,
      `البوتات ضمن الاشتراك : ${val(bots)}`,
      `البوتات المتصلة حالياً : ${val(active)}`,
    ].join('\n'))
    .setTimestamp();
}

const OPTIONS = [
  { label: 'تغيير اسم البوت', value: 'name' },
  { label: 'تغيير أفتار البوت', value: 'avatar' },
  { label: 'تغيير بنر البوت', value: 'banner' },
  { label: 'تغيير حالة البوت', value: 'status' },
  { label: 'تغيير لون امبيد البوت', value: 'color' },
  { label: 'إضافة مالك للبوت', value: 'addOwner' },
  { label: 'إزالة مالك من البوت', value: 'removeOwner' },
  { label: 'إعادة تشغيل البوت', value: 'restart' },
];

// صورة من مرفق أو رابط
async function askImage(message, prompt) {
  const ans = await ui.ask(message, prompt);
  if (!ans) return null;
  const url = ans.attachments.size ? ans.attachments.first().url : ans.content.trim();
  if (!/^https?:\/\//.test(url)) {
    message.reply('**رابط غير صالح.**').catch(() => {});
    return null;
  }
  return url;
}

// ايدي عضو من منشن أو رقم
async function askUserId(message, prompt) {
  const ans = await ui.ask(message, prompt);
  if (!ans) return null;
  const id = (ans.content.match(/\d{17,20}/) || [])[0];
  if (!id) message.reply('**منشن أو ايدي غير صالح.**').catch(() => {});
  return id || null;
}

const actions = {
  async name(client, message) {
    const ans = await ui.ask(message, '**اكتب اسم البوت الجديد:**');
    if (!ans) return;
    await client.user.setUsername(ans.content.trim());
    return message.reply('**تم تغيير اسم البوت.**');
  },

  async avatar(client, message) {
    const url = await askImage(message, '**أرفق صورة الأفتار الجديدة أو أرسل رابطها:**');
    if (!url) return;
    await client.user.setAvatar(url);
    return message.reply('**تم تغيير أفتار البوت.**');
  },

  async banner(client, message) {
    const url = await askImage(message, '**أرفق صورة البنر الجديدة أو أرسل رابطها:**\n-# المقاس المناسب 680×240');
    if (!url) return;
    const res = await fetch(url);
    if (!res.ok) throw new Error('ما قدرت أحمل الصورة');
    const type = (res.headers.get('content-type') || 'image/png').split(';')[0];
    if (!type.startsWith('image/')) throw new Error('الملف مو صورة');
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 10 * 1024 * 1024) throw new Error('الصورة أكبر من 10 ميقا');
    // discord.js v13 ما فيه setBanner، نستخدم API ديسكورد مباشرة
    await client.api.users('@me').patch({ data: { banner: `data:${type};base64,${buf.toString('base64')}` } });
    return message.reply('**تم تغيير بنر البوت.**');
  },

  async status(client, message) {
    const ans = await ui.ask(message, '**اكتب نص الحالة:**');
    if (!ans) return;
    const text = ans.content.trim().slice(0, 120);
    const row = new MessageActionRow().addComponents(
      ['WATCHING:مشاهدة', 'LISTENING:استماع', 'STREAMING:بث', 'PLAYING:لعب'].map((x) => {
        const [type, label] = x.split(':');
        return emojis.button(new MessageButton().setCustomId(`vip:type:${type}`).setLabel(label).setStyle('SECONDARY'), `btn:${type}`);
      }),
    );
    const pick = await message.reply({ content: `**اختر نوع الحالة لـ "${text}":**`, components: [row] });
    const b = await pick.awaitMessageComponent({ filter: (x) => x.user.id === message.author.id, time: 60000 }).catch(() => null);
    if (!b) return pick.edit({ content: '**انتهى الوقت.**', components: [] }).catch(() => {});
    const type = b.customId.split(':')[2];
    client.user.setActivity(text, { type, url: type === 'STREAMING' ? 'https://twitch.tv/paneltek' : undefined });
    return b.update({ content: `**تم تغيير الحالة إلى ${text}.**`, components: [] });
  },

  async color(client, message) {
    const ans = await ui.ask(message, `**اكتب كود اللون الجديد (مثال: ${ui.DEFAULT_COLOR}):**\n-# اللون الحالي: ${ui.getColor()}`);
    if (!ans) return;
    const c = ans.content.trim().replace(/^#?/, '#');
    if (!/^#[0-9a-f]{6}$/i.test(c)) return message.reply('**كود لون غير صالح.**');
    ui.setColor(c);
    client.config.embedColor = c;
    botSettings.set('embedColor', c);
    return message.reply(ui.withLogo({ embeds: [ui.embed().setDescription(`**تم تغيير لون امبيد البوت إلى ${c}**`)] }));
  },

  async addOwner(client, message) {
    const id = await askUserId(message, '**منشن المالك الجديد أو اكتب الايدي:**');
    if (!id) return;
    if (client.config.owners.includes(id)) return message.reply('**هذا الشخص مالك من قبل.**');
    client.config.owners.push(id);
    saveConfig(client);
    return message.reply(`**تمت إضافة <@${id}> كمالك للبوت.**`);
  },

  async removeOwner(client, message) {
    const id = await askUserId(message, '**منشن المالك أو اكتب الايدي:**');
    if (!id) return;
    if (!client.config.owners.includes(id)) return message.reply('**هذا الشخص مو مالك.**');
    if (client.config.owners.length === 1) return message.reply('**ما تقدر تشيل آخر مالك.**');
    client.config.owners = client.config.owners.filter((x) => x !== id);
    saveConfig(client);
    return message.reply(`**تمت إزالة <@${id}> من ملاك البوت.**`);
  },

  async restart(client, message) {
    await message.reply('**جاري إعادة تشغيل البوت... يرجع خلال ثواني.**');
    restart();
  },
};

module.exports = {
  name: 'vip',
  level: 'owner',
  description: 'معلومات الاشتراك وإعدادات البوت',
  usage: 'vip',
  subscriptionEmbed,
  actions,
  async run(client, message, args, { data }) {
    const menu = new MessageActionRow().addComponents(
      new MessageSelectMenu().setCustomId('vip:menu').setPlaceholder('اختر إحدى الخيارات').addOptions(OPTIONS.map((o) => emojis.option(o, `menu:${o.value}`))),
    );
    const msg = await message.reply(ui.withLogo({ embeds: [await subscriptionEmbed(data, client, message.guild.id)], components: [menu] }));
    const i = await msg.awaitMessageComponent({ filter: (x) => x.user.id === message.author.id, time: 60000 }).catch(() => null);
    // بعد الاختيار أو انتهاء الوقت: يبقى امبيد الاشتراك وتختفي القائمة
    if (i) await i.deferUpdate().catch(() => {});
    await msg.edit(ui.addSupport({ components: [] }, true)).catch(() => {});
    if (!i) return;

    try {
      await actions[i.values[0]](client, message);
    } catch (e) {
      message.reply(`**فشل: ${e.message}**`).catch(() => {});
    }
  },
};
