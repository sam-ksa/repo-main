// إعدادات البوت الخاصة فيه (رابط الدعم، لون الامبيد، لون الإيموجيات) في ملف مستقل bot-settings.json
// السبب: نظام الاشتراكات يكتب config.json بنفسه (التوكن، الملاك، بيانات الاشتراك)، فأي إعداد نحطه هناك ممكن ينمسح
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'bot-settings.json');
const DEFAULT_SUPPORT = 'https://discord.gg';

let cache = null;

function load() {
  if (cache) return cache;
  try { cache = JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch { cache = {}; }
  return cache;
}

function save() {
  const tmp = `${FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(load(), null, 2));
  fs.renameSync(tmp, FILE);
}

function get(key) {
  return load()[key];
}

function set(key, value) {
  load()[key] = value;
  save();
}

// القيمة الفعلية: ملف الإعدادات ← متغير بيئة ← config.json ← الافتراضي
function resolve(config) {
  const s = load();
  return {
    support: s.support || process.env.SUPPORT_URL || config.support || DEFAULT_SUPPORT,
    embedColor: s.embedColor || config.embedColor || null,
    emojiColor: s.emojiColor || config.emojiColor || null,
  };
}

module.exports = { get, set, resolve, FILE, DEFAULT_SUPPORT };
