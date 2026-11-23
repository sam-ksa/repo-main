// تخزين بيانات كل سيرفر في ملف مستقل: data/guilds/<guildId>.json
// البيانات تنحفظ في الذاكرة وتنكتب على القرص بتأخير بسيط (كتابة آمنة عبر ملف مؤقت)
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data', 'guilds');
fs.mkdirSync(DIR, { recursive: true });

const cache = new Map();
const timers = new Map();

const defaultSettings = () => ({
  prefix: null,            // null = البادئة الافتراضية من config.json
  logChannel: null,
  categories: { voice: null, text: null },
  leadersRole: null,
  managers: [],
  managerRole: null,
  panel: { channelId: null, messageId: null, interval: 60 }, // interval = مدة تحديث لوحة التوب بالثواني
  pointsPerTick: 1,         // نقاط لكل عضو في الروم الصوتي كل دورة
  ignoreDeafened: true,     // ما يحسب نقاط للي مسوي ديفن
  maxMembers: 0,            // 0 = بدون حد
});

const file = (id) => path.join(DIR, `${id}.json`);

function normalize(d) {
  const def = defaultSettings();
  d.settings = { ...def, ...(d.settings || {}) };
  d.settings.categories = { ...def.categories, ...(d.settings.categories || {}) };
  d.settings.panel = { ...def.panel, ...(d.settings.panel || {}) };
  if (!Array.isArray(d.settings.managers)) d.settings.managers = [];
  d.groups = d.groups || {};
  for (const g of Object.values(d.groups)) {
    g.members = Array.isArray(g.members) ? g.members : [];
    g.admins = Array.isArray(g.admins) ? g.admins : [];
    g.points = Number(g.points) || 0;
    g.voiceMinutes = Number(g.voiceMinutes) || 0;
  }
  return d;
}

function get(guildId) {
  if (cache.has(guildId)) return cache.get(guildId);
  let d = {};
  try {
    d = JSON.parse(fs.readFileSync(file(guildId), 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') {
      const bad = `${file(guildId)}.corrupt-${Date.now()}`;
      try { fs.renameSync(file(guildId), bad); } catch {}
      console.error(`[store] ملف السيرفر ${guildId} تالف، انحفظت نسخة منه في ${bad}`);
    }
  }
  normalize(d);
  cache.set(guildId, d);
  return d;
}

function exists(guildId) {
  return cache.has(guildId) || fs.existsSync(file(guildId));
}

function flush(guildId) {
  clearTimeout(timers.get(guildId));
  timers.delete(guildId);
  const d = cache.get(guildId);
  if (!d) return;
  const tmp = `${file(guildId)}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(d, null, 2));
  fs.renameSync(tmp, file(guildId));
}

function save(guildId) {
  clearTimeout(timers.get(guildId));
  timers.set(guildId, setTimeout(() => flush(guildId), 1000));
}

function set(guildId, data) {
  cache.set(guildId, normalize(data));
  flush(guildId);
}

function flushAll() {
  for (const id of [...timers.keys()]) {
    try { flush(id); } catch (e) { console.error('[store] flush failed', id, e); }
  }
}

process.on('exit', flushAll);
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => { flushAll(); process.exit(0); });
}

// يحفظ بيانات السيرفر ويشيلها من الذاكرة (الملف يبقى، وترجع لو رجع البوت للسيرفر)
function unload(guildId) {
  if (timers.has(guildId)) flush(guildId);
  cache.delete(guildId);
}

module.exports = { get, save, set, flush, flushAll, exists, unload, DIR };
