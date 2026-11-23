// أدوات الواجهة: امبيد Panel Tek، الأسئلة، التأكيد، الصفحات، اللوق
const { MessageEmbed, MessageActionRow, MessageButton, MessageAttachment } = require('discord.js');
const { logoURL, logoFile } = require('../utils/logo');
const brand = require('./brand');
const emojis = require('./emojis');

const BRAND = 'Panel Tek';
const DEFAULT_COLOR = '#ffc400';
// لون كل امبيدات البوت (واحد لكل السيرفرات، يتغير من قائمة vip وينحفظ في config.json → embedColor)
let color = DEFAULT_COLOR;
const setColor = (c) => { color = /^#[0-9a-f]{6}$/i.test(c || '') ? c : DEFAULT_COLOR; };
const getColor = () => color;

function embed(data) {
  return new MessageEmbed()
    .setColor(color)
    .setThumbnail(logoURL)
    .setFooter({ text: BRAND, iconURL: logoURL });
}

// زر الدعم: يظهر تلقائياً تحت كل امبيد (ما عدا أوامر شات القروب: support: false)
let supportURL = null;
const setSupport = (url) => { supportURL = url || null; };

function supportRow() {
  if (!supportURL) return null;
  const btn = new MessageButton().setLabel('Support').setStyle('LINK').setURL(supportURL);
  const emoji = brand.getEmoji();
  if (emoji) btn.setEmoji({ id: emoji.id, name: emoji.name });
  return new MessageActionRow().addComponents(btn);
}

function addSupport(payload, support) {
  const row = support && supportRow();
  const comps = payload.components || [];
  if (!row || comps.length >= 5) return payload;
  return { ...payload, components: [...comps, row] };
}

// يضيف ملف الشعار (وزر الدعم) للرسالة
const withLogo = (payload, extraFiles = [], { support = true } = {}) =>
  ({ ...addSupport(payload, support), files: [logoFile(), ...extraFiles] });
// للتعديل: يستبدل المرفقات القديمة عشان ما يتكرر الشعار
const editWithLogo = (payload, extraFiles = [], { support = true } = {}) =>
  ({ ...addSupport(payload, support), files: [logoFile(), ...extraFiles], attachments: [] });

// يحط أيقونة الأمر (Bootstrap Icons) مكان صورة الامبيد، ويرجع المرفق اللي لازم ينرسل معها
async function iconFor(embeds, key) {
  const buf = await emojis.iconPng(key).catch(() => null);
  if (!buf) return [];
  for (const e of [].concat(embeds)) e.setThumbnail('attachment://icon.png');
  return [new MessageAttachment(buf, 'icon.png')];
}

async function log(guild, data, e) {
  const ch = data.settings.logChannel && guild.channels.cache.get(data.settings.logChannel);
  if (!ch) return;
  await ch.send(withLogo({ embeds: [e.setTimestamp()] })).catch(() => {});
}

const CANCEL_WORDS = ['cancel', 'الغاء', 'إلغاء'];

// يسأل صاحب الأمر وينتظر رده. يرجّع الرسالة أو null
async function ask(message, prompt, time = 60000) {
  // سطر صغير رمادي تحت السؤال (بدون مائل أو كود عشان ما يتلخبط اتجاه العربي)
  const q = await message.reply(`${prompt}\n-# للإلغاء اكتب: الغاء`);
  const col = await message.channel
    .awaitMessages({ filter: (m) => m.author.id === message.author.id, max: 1, time })
    .catch(() => null);
  const ans = col && col.first();
  if (!ans) {
    q.edit('**انتهى وقت الإدخال.**').catch(() => {});
    return null;
  }
  if (CANCEL_WORDS.includes(ans.content.trim().toLowerCase())) {
    message.reply('**تم الإلغاء.**').catch(() => {});
    return null;
  }
  return ans;
}

// يطلب صورة (مرفق أو رابط). يرجع { reset } أو { urls, done } أو null
// مهم: رسالة الشخص ما تنحذف إلا بعد تحميل الصورة (done)، لأن حذفها يحذف المرفق من ديسكورد
const RESET_WORDS = ['افتراضي', 'default', 'حذف', 'delete'];
async function askImage(message, prompt) {
  const ans = await ask(message, prompt);
  if (!ans) return null;
  const done = () => ans.delete().catch(() => {});
  if (RESET_WORDS.includes(ans.content.trim().toLowerCase())) {
    done();
    return { reset: true };
  }
  const att = ans.attachments.first();
  const urls = att ? [att.url, att.proxyURL].filter(Boolean) : [ans.content.trim()];
  if (!/^https?:\/\//.test(urls[0] || '')) {
    message.reply('**أرفق صورة أو أرسل رابط صورة.**').catch(() => {});
    return null;
  }
  return { urls, done };
}

// تأكيد بأزرار نعم / لا
async function confirm(message, text, time = 30000) {
  const row = new MessageActionRow().addComponents(
    emojis.button(new MessageButton().setCustomId('confirm:yes').setLabel('نعم').setStyle('SUCCESS'), 'btn:yes'),
    emojis.button(new MessageButton().setCustomId('confirm:no').setLabel('لا').setStyle('DANGER'), 'btn:no'),
  );
  const msg = await message.reply({ content: text, components: [row] });
  const i = await msg
    .awaitMessageComponent({ filter: (x) => x.user.id === message.author.id, time })
    .catch(() => null);
  if (!i) {
    await msg.edit({ content: '**انتهى الوقت ولم يتم الرد.**', components: [] }).catch(() => {});
    return { ok: false, msg };
  }
  const ok = i.customId === 'confirm:yes';
  await i.update({ content: ok ? text : '**تم إلغاء العملية.**', components: [] }).catch(() => {});
  return { ok, msg };
}

// صفحات بأزرار السابق / التالي
async function paginate(message, pages, { time = 120000, support = true, files = [] } = {}) {
  const opt = { support };
  const row = (i) => new MessageActionRow().addComponents(
    emojis.button(new MessageButton().setCustomId('page:prev').setLabel('السابق').setStyle('SECONDARY').setDisabled(i === 0), 'btn:prev'),
    emojis.button(new MessageButton().setCustomId('page:next').setLabel('التالي').setStyle('SECONDARY').setDisabled(i === pages.length - 1), 'btn:next'),
  );
  const tag = (i) => pages[i].setFooter({ text: `${BRAND} • صفحة ${i + 1}/${pages.length}`, iconURL: logoURL });
  let page = 0;
  if (pages.length === 1) return message.reply(withLogo({ embeds: [tag(0)] }, files, opt));
  const msg = await message.reply(withLogo({ embeds: [tag(0)], components: [row(0)] }, files, opt));
  const col = msg.createMessageComponentCollector({ filter: (i) => i.user.id === message.author.id, time });
  col.on('collect', async (i) => {
    page += i.customId === 'page:next' ? 1 : -1;
    page = Math.max(0, Math.min(pages.length - 1, page));
    await i.update(editWithLogo({ embeds: [tag(page)], components: [row(page)] }, files, opt)).catch(() => {});
  });
  // بعد انتهاء الوقت تختفي أزرار الصفحات ويبقى زر الدعم
  col.on('end', () => msg.edit(addSupport({ components: [] }, support)).catch(() => {}));
  return msg;
}

// يجيب عضو من منشن أو ايدي (من رسالة أو نص)
async function resolveMember(guild, input) {
  if (!input) return null;
  if (typeof input !== 'string') {
    const m = input.mentions && input.mentions.members && input.mentions.members.first();
    if (m) return m;
    input = input.content;
  }
  const id = (String(input).match(/\d{17,20}/) || [])[0];
  if (!id) return null;
  return guild.members.fetch(id).catch(() => null);
}

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

module.exports = { iconFor, askImage, RESET_WORDS, BRAND, DEFAULT_COLOR, setColor, getColor, setSupport, supportRow, addSupport, embed, withLogo, editWithLogo, log, ask, confirm, paginate, resolveMember, chunk, logoURL };
