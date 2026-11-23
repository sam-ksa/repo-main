// لوحة توب القروبات: صورة مرسومة + امبيد + أزرار، تتحدث تلقائياً
const path = require('path');
const { MessageActionRow, MessageButton, MessageAttachment } = require('discord.js');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const store = require('./store');
const G = require('./groups');
const ui = require('./ui');
const panelStyle = require('./panelStyle');
const emojis = require('./emojis');

const ROOT = path.join(__dirname, '..');
GlobalFonts.registerFromPath(path.join(ROOT, 'Fonts', 'Cairo-Regular.ttf'), 'Cairo');
const FONT = 'Cairo';
const TOP_N = 10;

const COLORS = {
  bg1: '#101218', bg2: '#1a1d26', row: '#1f232e', rowAlt: '#232836',
  silver: '#c9ced6', bronze: '#cd7f32', text: '#f3f4f6', muted: '#9aa1ad',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fit(ctx, text, maxW) {
  let t = String(text);
  if (ctx.measureText(t).width <= maxW) return t;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
  return `${t}…`;
}

// نص عربي مختلط مع إنجليزي: نجبر اتجاه الفقرة من اليمين لليسار
const rtl = (t) => `‫${t}‬`;

const fmt = (n) => Number(n || 0).toLocaleString('en-US');

// يرسم صورة شعار السيرفر في مكانها (مع رجوع لشعار Panel Tek لو الملف تالف)
async function drawLogo(ctx, style, x, y, size) {
  let img;
  try { img = await panelStyle.loadAsset(style.logo); } catch { img = await panelStyle.loadAsset(panelStyle.getStyle({ settings: {} }).logo); }
  ctx.drawImage(img, x, y, size, size);
}

// لون فاتح/غامق من لون أساسي (للتدرجات)
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amt > 0 ? (255 - c) * amt : c * amt))));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// هل اللون فاتح؟ (عشان نختار كتابة غامقة أو فاتحة فوقه)
function isLight(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

// فريمات المراكز الثلاثة (معدني بدون توهج)
const FRAMES = {
  1: ['#fff3b0', '#e2b21a', '#9c7200'], // ذهبي
  2: ['#ffffff', '#c3c9d2', '#7d8591'], // فضي
  3: ['#f6c896', '#b8742f', '#6f4119'], // برونزي
};
const NUMBER_COLORS = { 1: '#f7d23e', 2: '#dfe3ea', 3: '#d69a5b' };
const BLOCK = { face: '#16140f', top: '#3b3934', side: '#0d0c09' };

// صورة القروب داخل دائرة مع فريم (أو حرف أول من اسمه إذا ما عنده صورة)
async function drawAvatar(ctx, group, cx, cy, r, frame, frameWidth, letterColor = frame ? frame[1] : '#e9e6df') {
  // الفريم
  if (frame) {
    const gr = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    gr.addColorStop(0, frame[0]);
    gr.addColorStop(0.5, frame[1]);
    gr.addColorStop(1, frame[2]);
    ctx.beginPath();
    ctx.arc(cx, cy, r + frameWidth, 0, Math.PI * 2);
    ctx.fillStyle = gr;
    ctx.fill();
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  let drawn = false;
  if (group.image) {
    try {
      const img = await panelStyle.loadAsset(panelStyle.assetPath(group.image));
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
      drawn = true;
    } catch {}
  }
  if (!drawn) {
    ctx.fillStyle = '#1d1b16';
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = letterColor;
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.round(r * 0.95)}px ${FONT}`;
    const letter = [...String(group.name).trim()][0] || '?';
    ctx.fillText(rtl(letter.toUpperCase()), cx, cy + r * 0.34);
  }
  ctx.restore();
}

// مكان فاضي في المنصة (لو القروبات أقل من 3)
function drawEmptySlot(ctx, cx, cy, r, ink) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(cx - 14, cy - 3, 28, 6);
  ctx.globalAlpha = 1;
}

// بلوك المنصة الأسود ثلاثي الأبعاد مع رقم المركز
function drawBlock(ctx, x, w, base, h, rank) {
  const top = base - h;
  const bevel = 12;
  // الوجه العلوي (مائل)
  ctx.beginPath();
  ctx.moveTo(x + bevel, top - bevel);
  ctx.lineTo(x + w - bevel, top - bevel);
  ctx.lineTo(x + w, top);
  ctx.lineTo(x, top);
  ctx.closePath();
  ctx.fillStyle = BLOCK.top;
  ctx.fill();
  // الوجه الأمامي
  ctx.fillStyle = BLOCK.face;
  ctx.fillRect(x, top, w, h);
  // خط فاصل خفيف بين البلوكات
  ctx.fillStyle = BLOCK.side;
  ctx.fillRect(x, top, 1, h);
  ctx.fillRect(x + w - 1, top, 1, h);
  // الرقم
  ctx.textAlign = 'center';
  ctx.fillStyle = NUMBER_COLORS[rank];
  const size = rank === 1 ? 88 : rank === 2 ? 72 : 64;
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.fillText(String(rank), x + w / 2, top + h / 2 + size * 0.36);
}

// صف من صفوف المراكز 4-10 (أو صف فاضي "-" إذا ما فيه قروب بهالمركز)
async function drawRow(ctx, g, rank, y, W, PAD, ROW, accent, max, rowColor) {
  roundRect(ctx, PAD, y, W - PAD * 2, ROW, 14);
  ctx.fillStyle = rowColor;
  ctx.fill();

  const cy = y + ROW / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9a968c';
  ctx.font = `bold 23px ${FONT}`;
  ctx.fillText(String(rank), W - PAD - 30, cy + 8);

  if (!g) {
    ctx.beginPath();
    ctx.arc(W - PAD - 82, cy, 19, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(W - PAD - 132, cy - 2, 22, 4);
    return;
  }

  await drawAvatar(ctx, g, W - PAD - 82, cy, 19, ['#5a5750', '#46443e', '#2f2d29'], 3, '#e9e6df');
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f4f1ea';
  ctx.font = `bold 21px ${FONT}`;
  ctx.fillText(rtl(fit(ctx, g.name, 330)), W - PAD - 114, cy + 1);
  ctx.fillStyle = '#9a968c';
  ctx.font = `14px ${FONT}`;
  ctx.fillText(rtl(`${g.members.length} عضو`), W - PAD - 114, cy + 20);

  // النقاط + شريط التقدم مقارنة بالمركز الأول
  const barX = PAD + 20, barW = 230, barY = cy + 9;
  ctx.textAlign = 'left';
  ctx.fillStyle = accent;
  ctx.font = `bold 21px ${FONT}`;
  ctx.fillText(fmt(g.points), barX, cy - 3);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  roundRect(ctx, barX, barY, barW, 7, 3.5);
  ctx.fill();
  const pct = max > 0 ? Math.max(0.03, Math.min(1, g.points / max)) : 0.03;
  ctx.fillStyle = accent;
  roundRect(ctx, barX, barY, Math.max(7, barW * pct), 7, 3.5);
  ctx.fill();
}

// يرسم صورة التوب (طولية) ويرجعها كـ Buffer (بتصميم السيرفر من أمر customize)
async function render(guild, data) {
  const style = panelStyle.getStyle(data);
  const accent = style.color;
  const list = G.ranked(data).slice(0, TOP_N);

  // مقاس طولي ثابت: المراكز العشرة دائماً موجودة (الفاضي يطلع "-")
  const W = 830, H = 1080, PAD = 30, HEAD = 215, PODIUM = 365, ROWS_TOP = 18, FOOT = 46, GAP = 7;
  const ROWS = TOP_N - 3;
  // ارتفاع الصف يتحسب من المساحة الباقية عشان المقاس يبقى 830×1080 بالضبط
  const ROW = Math.floor((H - HEAD - PODIUM - ROWS_TOP - FOOT) / ROWS) - GAP;
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');

  // الخلفية: صورة السيرفر، أو تدرج من لون اللوحة
  let hasBg = false;
  if (style.background) {
    try {
      const img = await panelStyle.loadAsset(style.background);
      const k = Math.max(W / img.width, H / img.height);
      ctx.drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k);
      if (style.dim > 0) {
        ctx.fillStyle = `rgba(10, 12, 18, ${style.dim / 100})`;
        ctx.fillRect(0, 0, W, H);
      }
      hasBg = true;
    } catch (e) {
      console.error('[panel] خلفية تالفة:', e.message);
    }
  }
  if (!hasBg) {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, shade(accent, 0.35));
    bg.addColorStop(0.45, accent);
    bg.addColorStop(1, shade(accent, 0.45));
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }
  // لون الكتابة حسب الخلفية
  const light = !hasBg && isLight(accent);
  const ink = light ? '#17150f' : '#ffffff';
  const inkSoft = light ? 'rgba(23, 21, 15, 0.62)' : 'rgba(255, 255, 255, 0.7)';

  // الهيدر (بالوسط): الشعار، العنوان، اسم السيرفر، ثم الاسم وعدد القروبات
  await drawLogo(ctx, style, W / 2 - 42, 20, 84);
  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  ctx.font = `bold 44px ${FONT}`;
  ctx.fillText(rtl(fit(ctx, style.title, W - PAD * 2)), W / 2, 146);
  ctx.fillStyle = inkSoft;
  ctx.font = `21px ${FONT}`;
  ctx.fillText(rtl(fit(ctx, guild.name, W - PAD * 2)), W / 2, 176);

  const total = G.all(data).length;
  ctx.font = `bold 15px ${FONT}`;
  const brand = fit(ctx, style.brand, 220);
  const count = `${total} ${total === 1 ? 'GROUP' : 'GROUPS'}`;
  const label = `${/[؀-ۿ]/.test(brand) ? rtl(brand) : brand}   •   ${count}`;
  const lw = ctx.measureText(label).width + 32;
  roundRect(ctx, W / 2 - lw / 2, 186, lw, 28, 14);
  ctx.fillStyle = light ? 'rgba(23, 21, 15, 0.88)' : 'rgba(255, 255, 255, 0.14)';
  ctx.fill();
  ctx.fillStyle = light ? accent : '#ffffff';
  ctx.fillText(label, W / 2, 205);

  // منصة التتويج: الثاني يسار، الأول وسط (أعلى)، الثالث يمين
  const base = HEAD + PODIUM;
  const bw = (W - PAD * 2) / 3;
  const slots = [
    { rank: 2, x: PAD, h: 116, r: 46 },
    { rank: 1, x: PAD + bw, h: 150, r: 56 },
    { rank: 3, x: PAD + bw * 2, h: 94, r: 42 },
  ];
  for (const s of slots) drawBlock(ctx, s.x, bw, base, s.h, s.rank);
  for (const s of slots) {
    const g = list[s.rank - 1];
    const cx = s.x + bw / 2;
    const blockTop = base - s.h - 12;
    const pointsY = blockTop - 14;
    const nameY = pointsY - 26;
    const cy = nameY - 34 - s.r;
    ctx.textAlign = 'center';
    if (!g) {
      drawEmptySlot(ctx, cx, cy, s.r, ink);
      ctx.fillStyle = inkSoft;
      ctx.fillRect(cx - 9, nameY - 8, 18, 3);
      continue;
    }
    await drawAvatar(ctx, g, cx, cy, s.r, FRAMES[s.rank], 6);
    ctx.textAlign = 'center';
    ctx.fillStyle = ink;
    ctx.font = `bold ${s.rank === 1 ? 26 : 22}px ${FONT}`;
    ctx.fillText(rtl(fit(ctx, g.name, bw - 20)), cx, nameY);
    ctx.fillStyle = inkSoft;
    ctx.font = `bold 15px ${FONT}`;
    ctx.fillText(rtl(fit(ctx, `${fmt(g.points)} نقطة • ${g.members.length} عضو`, bw - 16)), cx, pointsY);
  }

  // المراكز 4-10
  const max = list.length ? list[0].points : 0;
  let y = base + ROWS_TOP;
  for (let k = 0; k < ROWS; k++) {
    await drawRow(ctx, list[k + 3], k + 4, y, W, PAD, ROW, accent, max, k % 2 ? 'rgba(22, 20, 15, 0.9)' : 'rgba(30, 28, 22, 0.9)');
    y += ROW + GAP;
  }

  // الفوتر
  ctx.textAlign = 'center';
  ctx.fillStyle = inkSoft;
  ctx.font = `15px ${FONT}`;
  ctx.fillText(rtl(`${style.brand}  •  توب القروبات يتحدث تلقائياً`), W / 2, H - FOOT / 2 + 6);

  return c.encode('png');
}

function components() {
  return [new MessageActionRow().addComponents(
    emojis.button(new MessageButton().setCustomId('panel:mine').setLabel('ترتيب قروبي').setStyle('SECONDARY'), 'btn:mine'),
  )];
}

// رسالة اللوحة: الصورة فقط + الأزرار (بدون امبيد)
async function build(guild, data) {
  const img = new MessageAttachment(await render(guild, data), 'top.png');
  return { payload: { content: null, embeds: [], components: components() }, img };
}

// للإرسال والتعديل: الصورة هي المرفق الوحيد
const imagePayload = ({ payload, img }, edit = false) => ({
  ...payload,
  files: [img],
  ...(edit ? { attachments: [] } : {}),
});

// بصمة الترتيب: إذا ما تغيرت ما نعدل الرسالة (نخفف الطلبات على ديسكورد)
const lastSig = new Map();
// (يشمل نسخة التصميم: أي تخصيص جديد يحدّث اللوحة)
const signature = (data) => `${panelStyle.getStyle(data).version}#` + G.ranked(data).slice(0, TOP_N).map((g) => `${g.id}:${g.name}:${g.points}:${g.members.length}:${g.image || ''}`).join('|');

// مدة تحديث اللوحة لكل سيرفر (بالثواني) + العداد اللي يظهر فوق الصورة
const DEFAULT_INTERVAL = 60;
const MIN_INTERVAL = 30;
const MAX_INTERVAL = 3600;
const intervalOf = (data) => {
  const n = Number(data.settings.panel.interval);
  return Number.isInteger(n) && n >= MIN_INTERVAL && n <= MAX_INTERVAL ? n : DEFAULT_INTERVAL;
};

const nextAt = new Map(); // وقت التحديث الجاي لكل سيرفر
const armTimer = (guildId, data) => nextAt.set(guildId, Date.now() + intervalOf(data) * 1000);

// <t:..:R> عداد ديسكورد: يعدّ تنازلياً عند كل شخص بلغته بدون ما نعدّل الرسالة كل ثانية
function countdown(guildId) {
  const t = Math.floor((nextAt.get(guildId) || Date.now()) / 1000);
  const em = emojis.str('panel:timer');
  return `${em ? `${em} ` : ''}**سيتم تحديث اللوحة <t:${t}:R>**`;
}

// يوقف اللوحة إذا انحذف رومها أو رسالتها (ويحافظ على مدة التحديث)
function clearPanel(guildId, data) {
  data.settings.panel = { ...data.settings.panel, channelId: null, messageId: null };
  store.save(guildId);
  nextAt.delete(guildId);
}

async function fetchPanelMessage(guild, data) {
  const { channelId, messageId } = data.settings.panel;
  const ch = guild.channels.cache.get(channelId);
  const msg = ch && await ch.messages.fetch(messageId).catch((e) => (e.code === 10008 ? 'gone' : null));
  if (!ch || msg === 'gone') {
    clearPanel(guild.id, data);
    return null;
  }
  return msg || null;
}

async function send(channel, data) {
  const built = await build(channel.guild, data);
  const old = data.settings.panel;
  if (old.channelId && old.messageId) {
    const oldCh = channel.guild.channels.cache.get(old.channelId);
    if (oldCh) oldCh.messages.delete(old.messageId).catch(() => {});
  }
  armTimer(channel.guild.id, data);
  const msg = await channel.send({ ...imagePayload(built), content: countdown(channel.guild.id) });
  data.settings.panel = { ...data.settings.panel, channelId: channel.id, messageId: msg.id };
  store.save(channel.guild.id);
  lastSig.set(channel.guild.id, signature(data));
  return msg;
}

// force: يعيد رسم الصورة دائماً | tick: انتهى العداد (يبدأ عداد جديد)
async function update(guild, { force = false, tick = false } = {}) {
  const data = store.get(guild.id);
  const { channelId, messageId } = data.settings.panel;
  if (!channelId || !messageId) return false;
  const sig = signature(data);
  const changed = force || lastSig.get(guild.id) !== sig;
  if (!changed && !tick) return false;
  const msg = await fetchPanelMessage(guild, data);
  if (!msg) return false;
  if (tick || !nextAt.has(guild.id)) armTimer(guild.id, data);
  const content = countdown(guild.id);
  try {
    // تغير شي: صورة جديدة + العداد | ما تغير: العداد بس (بدون رسم ولا رفع صورة)
    await msg.edit(changed ? { ...imagePayload(await build(guild, data), true), content } : { content });
    lastSig.set(guild.id, sig);
  } catch (e) {
    console.error('[panel] edit failed', guild.id, e.message);
  }
  return true;
}

// تحديث مؤجل: يجمع التغييرات المتتالية في تحديث واحد
const pending = new Map();
function schedule(guild, delay = 15000) {
  if (pending.has(guild.id)) return;
  pending.set(guild.id, setTimeout(() => {
    pending.delete(guild.id);
    update(guild).catch((e) => console.error('[panel]', e));
  }, delay));
}

function forget(guildId) {
  clearTimeout(pending.get(guildId));
  pending.delete(guildId);
  lastSig.delete(guildId);
  nextAt.delete(guildId);
}

// تغيير مدة التحديث من أمر customize (يبدأ عداد جديد فوراً)
async function setRefreshInterval(guild, data, seconds) {
  data.settings.panel = { ...data.settings.panel, interval: seconds };
  store.save(guild.id);
  if (data.settings.panel.messageId) await update(guild, { tick: true });
}

// المؤقت: كل 5 ثواني يشيك أي لوحة خلص عدادها ويحدّثها
// (لوحة تتعدل مرة كل مدة تحديث بالكثير، والصورة ما تنرسم إلا إذا تغير الترتيب)
const LOOP_MS = 5000;
let autoTimer = null;
const running = new Set();
function startAuto(client) {
  if (autoTimer) return;
  autoTimer = setInterval(async () => {
    const now = Date.now();
    for (const guild of client.guilds.cache.values()) {
      if (running.has(guild.id) || !store.exists(guild.id) || !store.get(guild.id).settings.panel.messageId) continue;
      if (nextAt.has(guild.id) && now < nextAt.get(guild.id)) continue;
      running.add(guild.id);
      await update(guild, { tick: true }).catch((e) => console.error('[panel] auto', guild.id, e.message));
      running.delete(guild.id);
    }
  }, LOOP_MS);
  autoTimer.unref?.();
}

module.exports = {
  forget, render, build, imagePayload, send, update, schedule, startAuto, setRefreshInterval, intervalOf,
  DEFAULT_INTERVAL, MIN_INTERVAL, MAX_INTERVAL, TOP_N,
};
