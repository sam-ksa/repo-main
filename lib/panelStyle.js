// تخصيص تصميم لوحة التوب لكل سيرفر: الشعار، الاسم، اللون، الخلفية
// الصور تنحفظ في data/assets (روابط مرفقات ديسكورد تنتهي صلاحيتها، فما نعتمد عليها)
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const store = require('./store');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'data', 'assets');
fs.mkdirSync(ASSETS, { recursive: true });

const DEFAULTS = Object.freeze({
  title: 'توب القروبات',
  brand: 'Panel Tek', // الاسم الصغير اللي فوق يسار اللوحة
  color: '#f5b800',
  dim: 35, // نسبة تعتيم الخلفية (0 = الصورة كاملة بدون تعتيم، 80 = أغمق شي)
  logo: null, // null = شعار Panel Tek
  background: null, // null = الخلفية الافتراضية (تدرج داكن)
});
const DEFAULT_LOGO = path.join(ROOT, 'images', 'paneltek.png');
const MAX_BYTES = 8 * 1024 * 1024;

function getStyle(data) {
  const s = data.settings.panelStyle || {};
  return {
    title: s.title || DEFAULTS.title,
    brand: s.brand || DEFAULTS.brand,
    dim: Number.isInteger(s.dim) && s.dim >= 0 && s.dim <= 80 ? s.dim : DEFAULTS.dim,
    color: /^#[0-9a-f]{6}$/i.test(s.color || '') ? s.color : DEFAULTS.color,
    logo: s.logo ? path.join(ASSETS, s.logo) : DEFAULT_LOGO,
    background: s.background ? path.join(ASSETS, s.background) : null,
    version: s.version || 0,
  };
}

function update(guildId, data, patch) {
  const s = { ...(data.settings.panelStyle || {}), ...patch };
  s.version = (s.version || 0) + 1;
  data.settings.panelStyle = s;
  store.save(guildId);
}

// كاش صغير للصور المفكوكة (حد أقصى عشان الرام)
const imgCache = new Map();
const IMG_CACHE_MAX = 40; // الشعار + الخلفية + صور قروبات التوب
async function loadAsset(file) {
  if (imgCache.has(file)) return imgCache.get(file);
  const img = await loadImage(fs.readFileSync(file));
  if (imgCache.size >= IMG_CACHE_MAX) imgCache.delete(imgCache.keys().next().value);
  imgCache.set(file, img);
  return img;
}

function removeFile(name) {
  if (!name) return;
  const file = path.join(ASSETS, name);
  imgCache.delete(file);
  try { fs.unlinkSync(file); } catch {}
}

// يحمّل صورة من رابط، يتأكد إنها صورة، ويحفظها بمقاس مناسب
const userError = (msg) => Object.assign(new Error(msg), { userMessage: msg });

// يجرب الروابط بالترتيب (مرفق ديسكورد له رابطين: url و proxyURL)
async function fetchFirst(urls) {
  let lastStatus = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (PanelTek bot)' } });
      if (res.ok) return res;
      lastStatus = res.status;
      console.error(`[panelStyle] تحميل الصورة فشل (${res.status}): ${url.split('?')[0]}`);
    } catch (e) {
      console.error(`[panelStyle] تحميل الصورة فشل: ${e.message}`);
    }
  }
  throw userError(lastStatus === 403 || lastStatus === 404
    ? 'الرابط ما عاد يشتغل أو الموقع يمنع التحميل. ارفع الصورة كمرفق.'
    : 'ما قدرت أحمل الصورة من الرابط.');
}

async function downloadImage(urls) {
  const res = await fetchFirst(Array.isArray(urls) ? urls : [urls]);
  const len = Number(res.headers.get('content-length') || 0);
  if (len > MAX_BYTES) throw userError('الصورة أكبر من 8 ميقا.');
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) throw userError('الصورة أكبر من 8 ميقا.');
  // نفحص بداية الملف قبل فكه: مكتبة الرسم تطيّح البوت كامل لو أعطيناها ملف مو صورة (صفحة ويب مثلاً)
  if (!isImage(buf)) throw userError('الرابط مو صورة. استخدم صورة PNG أو JPG أو GIF أو WEBP.');
  try {
    return await loadImage(buf);
  } catch {
    throw userError('ما قدرت أقرا الصورة. جرب صورة PNG أو JPG.');
  }
}

// التعرف على نوع الصورة من أول بايتات الملف (بدون الاعتماد على نوع الملف اللي يرسله الموقع)
function isImage(buf) {
  if (!buf || buf.length < 16) return false;
  const hex = buf.subarray(0, 12).toString('hex');
  return hex.startsWith('89504e470d0a1a0a') // PNG
    || hex.startsWith('ffd8ff') // JPG
    || hex.startsWith('47494638') // GIF
    || (hex.startsWith('52494646') && buf.subarray(8, 12).toString('ascii') === 'WEBP'); // WEBP
}

async function setImage(guildId, data, kind, urls) {
  const img = await downloadImage(urls);
  let canvas;
  if (kind === 'logo') {
    // الشعار مربع 256×256 (يحافظ على النسبة ويتوسط)
    canvas = createCanvas(256, 256);
    const k = Math.min(256 / img.width, 256 / img.height);
    const w = img.width * k, h = img.height * k;
    canvas.getContext('2d').drawImage(img, (256 - w) / 2, (256 - h) / 2, w, h);
  } else {
    // الخلفية بعرض 1000 (عرض اللوحة)
    const k = 1000 / img.width;
    canvas = createCanvas(1000, Math.max(1, Math.round(img.height * k)));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  const old = (data.settings.panelStyle || {})[kind];
  const name = `${guildId}-${kind}-${Date.now()}.png`;
  fs.writeFileSync(path.join(ASSETS, name), await canvas.encode('png'));
  update(guildId, data, { [kind]: name });
  removeFile(old);
}

// صورة القروب: مربع 256×256 مقصوص من الوسط (تنرسم دائرة في اللوحة)
async function saveGroupImage(guildId, group, urls) {
  const img = await downloadImage(urls);
  const S = 256;
  const canvas = createCanvas(S, S);
  const k = Math.max(S / img.width, S / img.height);
  const w = img.width * k, h = img.height * k;
  canvas.getContext('2d').drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
  const old = group.image;
  const name = `${guildId}-group-${group.id}-${Date.now()}.png`;
  fs.writeFileSync(path.join(ASSETS, name), await canvas.encode('png'));
  group.image = name;
  store.save(guildId);
  removeFile(old);
}

function removeGroupImage(guildId, group) {
  removeFile(group.image);
  group.image = null;
  store.save(guildId);
}

const assetPath = (name) => (name ? path.join(ASSETS, name) : null);

function resetItem(guildId, data, kind) {
  const old = (data.settings.panelStyle || {})[kind];
  update(guildId, data, { [kind]: null });
  if (kind === 'logo' || kind === 'background') removeFile(old);
}

function resetAll(guildId, data) {
  const s = data.settings.panelStyle || {};
  removeFile(s.logo);
  removeFile(s.background);
  data.settings.panelStyle = { version: (s.version || 0) + 1 };
  store.save(guildId);
}

module.exports = {
  DEFAULTS, getStyle, update, loadAsset, setImage, resetItem, resetAll,
  saveGroupImage, removeGroupImage, removeFile, assetPath,
};
