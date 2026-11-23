// حفظ ملاك البوت في config.json بأمان
// نقرأ الملف من جديد ونعدّل "owners" بس، عشان ما نمسح أو نغيّر شي يحطه نظام الاشتراكات (التوكن وبيانات الاشتراك)
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'config.json');

function saveConfig(client) {
  let file = {};
  try { file = JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch {}
  file.owners = client.config.owners;
  const tmp = `${FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(file, null, 4));
  fs.renameSync(tmp, FILE);
}

module.exports = { saveConfig };
