// يبني lib/icons.json من أيقونات Bootstrap Icons (رخصة MIT) — تحتاجه بس لو أضفت أيقونة جديدة في lib/iconMap.js
// الاستخدام:
//   npm pack bootstrap-icons   ثم فك الملف
//   node scripts/build-icons.js <مسار مجلد icons داخل الحزمة>
const fs = require('fs');
const path = require('path');
const map = require('../lib/iconMap');

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) {
  console.error('حدد مسار مجلد icons من حزمة bootstrap-icons');
  process.exit(1);
}

const out = {};
for (const name of [...new Set(Object.values(map))].sort()) {
  const file = path.join(dir, `${name}.svg`);
  if (!fs.existsSync(file)) {
    console.error(`الأيقونة غير موجودة: ${name}`);
    process.exit(1);
  }
  // نحتفظ بمحتوى الرسم فقط (المسارات) عشان نلونها بأي لون وقت الرسم
  const svg = fs.readFileSync(file, 'utf8');
  out[name] = svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>')).trim();
}
fs.writeFileSync(path.join(__dirname, '..', 'lib', 'icons.json'), `${JSON.stringify(out, null, 0)}\n`);
console.log(`تم: ${Object.keys(out).length} أيقونة`);
