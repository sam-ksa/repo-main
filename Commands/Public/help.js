const emojis = require('../../lib/emojis');
const ui = require('../../lib/ui');
const perms = require('../../lib/perms');

// ترتيب الأقسام (بدون عناوين، بينها سطر فاضي)
const SECTIONS = [
  { folder: 'Public', level: 'public' },
  { folder: 'Groups', level: 'manager' },
  { folder: 'Settings', level: 'manager' },
  { folder: 'Owner Group', level: 'public' },
  { folder: 'Owners', level: 'owner' },
];

// وصف قصير لكل أمر (بنفس أسلوب القائمة القديمة)
const SHORT = {
  help: 'قائمة الأوامر',
  topg: 'توب نقاط القروبات',
  create: 'إنشاء قروب',
  delete: 'حذف قروب',
  addpoint: 'اضافة نقاط',
  removepoint: 'حذف نقاط',
  info: 'معلومات قروب',
  check: 'أعضاء قروب',
  list: 'عرض جميع القروبات',
  panel: 'ارسال توب القروبات يتحدث تلقائيا',
  reset: 'تصفير نقاط القروبات',
  setleader: 'نقل ملكية قروب',
  setup: 'إعداد نظام القروبات تلقائيا',
  customize: 'تخصيص لوحة التوب',
  setgroup: 'تحديد كاتقوري القروبات',
  setlog: 'تحديد لوق القروبات',
  setlrole: 'تحديد رول ليدر القروبات',
  setmanager: 'إضافة أو إزالة مسؤول قروب',
  setmrole: 'تحديد رول مسؤولي القروبات',
  managers: 'قائمة المسؤولين',
  setprefix: 'تغيير بادئة البوت',
  setrate: 'تحديد نقاط الفويس',
  settings: 'عرض إعدادات السيرفر',
  setvoice: 'تثبيت البوت في روم صوتي',
  add: 'اضافة أو ازالة عضو',
  admin: 'اضافة أو ازالة مسؤول',
  control: 'التحكم بالقروب',
  leave: 'الخروج من القروب',
  members: 'أعضاء القروب',
  mycommands: 'أوامر القروب',
  mygroup: 'معلومات القروب',
  image: 'إضافة صورة للقروب',
  punish: 'عقوبة على روم القروب',
  vip: 'أوامر الاونر',
  setowner: 'إضافة اونر للبوت',
  removeowner: 'ازالة اونر من البوت',
  owners: 'عرض قائمة الاونرات',
  alias: 'اختصارات الأوامر',
};

module.exports = {
  name: 'help',
  aliases: ['مساعدة', 'اوامر'],
  level: 'public',
  description: 'قائمة الأوامر حسب صلاحيتك',
  usage: 'help',
  async run(client, message, args, { data, prefix, level }) {
    const blocks = [];
    for (const sec of SECTIONS) {
      if (!perms.atLeast(level, sec.level)) continue;
      const cmds = client.commands.filter((c) => c.folder === sec.folder && perms.atLeast(level, c.level));
      if (!cmds.size) continue;
      // كل الأوامر بالإنجليزي وبنفس النمط (أوامر شات القروب تشتغل كمان بدون بادئة)
      const order = Object.keys(SHORT);
      const rank = (c) => (order.includes(c.name) ? order.indexOf(c.name) : order.length);
      blocks.push([...cmds.values()].sort((a, b) => rank(a) - rank(b))
        .map((c) => `${emojis.str(c.name)} ${prefix}${c.name} : ${SHORT[c.name] || c.description}`.trim())
        .join('\n'));
    }

    const e = ui.embed(data)
      .setDescription(`**${blocks.join('\n\n')}**`.slice(0, 4096));

    return message.reply(ui.withLogo({ embeds: [e] }));
  },
  SHORT,
};
