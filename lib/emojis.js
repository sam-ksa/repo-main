// إيموجيات Bootstrap Icons الملونة: البوت يرسمها من lib/icons.json (بدون إنترنت) ويرفعها كإيموجيات تطبيق
//
// الأمان (عشان الإيموجيات ما توقف ردود البوت أبداً):
// - البوت ما يستخدم أي إيموجي إلا بعد ما ديسكورد يأكد وجوده. قبلها الأوامر تشتغل عادي بدون إيموجي.
// - تغيير اللون: نرفع الجديدة كاملة أول، بعدين نبدل، بعدين نحذف القديمة (ما فيه لحظة نستخدم فيها إيموجي محذوف).
// - لو ديسكورد رفض رسالة بسبب إيموجي (انحذف يدوياً مثلاً): safeSend يعيد الإرسال بدون إيموجيات ويعيد المزامنة.
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const icons = require('./icons.json');
const map = require('./iconMap');

const PREFIX = 'pt_';
const DEFAULT_COLOR = '#ffc400';
const SIZE = 128;

let color = DEFAULT_COLOR;
const ready = new Map(); // اسم الأيقونة → { id, name }
let syncing = null;
let clientRef = null;

const validColor = (c) => /^#[0-9a-f]{6}$/i.test(c || '');
const emojiName = (icon, c) => `${PREFIX}${icon.replace(/-/g, '_')}_${c.slice(1).toLowerCase()}`;

async function renderPng(icon, c) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 16 16" fill="${c}">${icons[icon]}</svg>`;
  const img = await loadImage(Buffer.from(svg));
  const canvas = createCanvas(SIZE, SIZE);
  canvas.getContext('2d').drawImage(img, 0, 0, SIZE, SIZE);
  return canvas.encode('png');
}

// صورة أيقونة كبيرة (لصورة الامبيد) بلون الإيموجيات، مع كاش صغير
const iconCache = new Map();
async function iconPng(key, size = 256) {
  const icon = map[key];
  if (!icon || !icons[icon]) return null;
  const cacheKey = `${icon}:${color}:${size}`;
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey);
  const pad = Math.round(size * 0.12);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size - pad * 2}" height="${size - pad * 2}" viewBox="0 0 16 16" fill="${color}">${icons[icon]}</svg>`;
  const img = await loadImage(Buffer.from(svg));
  const canvas = createCanvas(size, size);
  canvas.getContext('2d').drawImage(img, pad, pad, size - pad * 2, size - pad * 2);
  const buf = await canvas.encode('png');
  if (iconCache.size >= 40) iconCache.delete(iconCache.keys().next().value);
  iconCache.set(cacheKey, buf);
  return buf;
}

// يجيب إيموجيات التطبيق الحالية، يرفع الناقص باللون المطلوب، يبدّل، ويحذف القديم
async function sync(client, newColor = color) {
  clientRef = client;
  const target = validColor(newColor) ? newColor.toLowerCase() : DEFAULT_COLOR;
  if (syncing) await syncing.catch(() => {});
  syncing = (async () => {
    const app = client.api.applications(client.user.id).emojis;
    const res = await app.get();
    const existing = Array.isArray(res) ? res : (res && res.items) || [];
    const byName = new Map(existing.map((e) => [e.name, e]));
    const wanted = [...new Set(Object.values(map))];
    const wantedNames = new Set(wanted.map((i) => emojiName(i, target)));
    const firstRun = ready.size === 0;
    const next = new Map();
    let uploaded = 0;
    let failed = 0;

    for (const icon of wanted) {
      const name = emojiName(icon, target);
      let e = byName.get(name);
      if (!e) {
        try {
          const png = await renderPng(icon, target);
          e = await app.post({ data: { name, image: `data:image/png;base64,${png.toString('base64')}` } });
          uploaded += 1;
        } catch (err) {
          failed += 1;
          console.error(`[emojis] رفع ${name} فشل:`, err.message);
          continue;
        }
      }
      const entry = { id: e.id, name: e.name };
      next.set(icon, entry);
      // أول تشغيل: نستخدم كل إيموجي أول ما يجهز (ما فيه قديم نحافظ عليه)
      if (firstRun) ready.set(icon, entry);
    }

    // التبديل مرة وحدة بعد ما يجهز الجديد كامل
    ready.clear();
    for (const [k, v] of next) ready.set(k, v);
    color = target;

    // حذف إيموجياتنا القديمة (لون سابق)
    let removed = 0;
    for (const e of existing) {
      if (e.name.startsWith(PREFIX) && !wantedNames.has(e.name)) {
        try {
          await client.api.applications(client.user.id).emojis(e.id).delete();
          removed += 1;
        } catch (err) {
          console.error(`[emojis] حذف ${e.name} فشل:`, err.message);
        }
      }
    }
    console.log(`[emojis] جاهزة: ${ready.size}/${wanted.length} (رفع ${uploaded}، حذف ${removed}${failed ? `، فشل ${failed}` : ''}) باللون ${color}`);
    return { total: wanted.length, ready: ready.size, uploaded, removed, failed, color };
  })();
  try {
    return await syncing;
  } finally {
    syncing = null;
  }
}

// إيموجي جاهز لمفتاح (أمر أو خيار قائمة أو زر)، أو null
function get(key) {
  const icon = map[key];
  return (icon && ready.get(icon)) || null;
}

// نص الإيموجي للامبيد، أو نص فاضي
function str(key) {
  const e = get(key);
  return e ? `<:${e.name}:${e.id}>` : '';
}

// يضيف الإيموجي لزر (MessageButton) إذا جاهز
function button(btn, key) {
  const e = get(key);
  if (e) btn.setEmoji({ id: e.id, name: e.name });
  return btn;
}

// يضيف الإيموجي لخيار قائمة إذا جاهز
function option(opt, key) {
  const e = get(key);
  return e ? { ...opt, emoji: { id: e.id, name: e.name } } : opt;
}

// هل الخطأ سببه إيموجي غير موجود؟
function isEmojiError(err) {
  const text = `${err && err.message} ${JSON.stringify((err && err.rawError) || {})}`;
  return Boolean(err && err.code === 50035 && /emoji/i.test(text));
}

// إذا رفض ديسكورد إيموجي: نمسح الإيموجيات من الذاكرة ونعيد المزامنة بالخلفية
function invalidate() {
  ready.clear();
  if (clientRef && !syncing) sync(clientRef).catch((e) => console.error('[emojis] إعادة المزامنة فشلت:', e.message));
}

// يشيل كل الإيموجيات المخصصة من رسالة (للإرسال الاحتياطي)
function strip(payload) {
  const clean = (s) => (typeof s === 'string' ? s.replace(/<a?:\w+:\d+>\s?/g, '') : s);
  if (!payload || typeof payload !== 'object') return clean(payload);
  const out = { ...payload };
  if (out.content) out.content = clean(out.content);
  if (out.embeds) {
    out.embeds = out.embeds.map((e) => {
      const j = typeof e.toJSON === 'function' ? e.toJSON() : { ...e };
      if (j.description) j.description = clean(j.description);
      if (j.title) j.title = clean(j.title);
      if (j.fields) j.fields = j.fields.map((f) => ({ ...f, name: clean(f.name), value: clean(f.value) }));
      return j;
    });
  }
  if (out.components) {
    out.components = out.components.map((row) => {
      const r = typeof row.toJSON === 'function' ? row.toJSON() : row;
      return {
        ...r,
        components: r.components.map((c) => {
          const { emoji, ...rest } = c;
          if (rest.options) rest.options = rest.options.map(({ emoji: _e, ...o }) => o);
          return rest;
        }),
      };
    });
  }
  return out;
}

// إرسال آمن: لو فشل بسبب إيموجي، يعيد الإرسال بدون إيموجيات (البوت يرد دائماً)
async function safeSend(sendFn, payload) {
  try {
    return await sendFn(payload);
  } catch (err) {
    if (!isEmojiError(err)) throw err;
    console.error('[emojis] ديسكورد رفض إيموجي، أعيد الإرسال بدونها وأعيد المزامنة');
    invalidate();
    return sendFn(strip(payload));
  }
}

const getColor = () => color;
const isReady = () => ready.size > 0;

module.exports = {
  DEFAULT_COLOR, sync, get, str, button, option, safeSend, strip, isEmojiError, invalidate,
  getColor, isReady, validColor, renderPng, iconPng, emojiName, PREFIX,
};
