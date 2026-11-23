const ui = require('../../lib/ui');
const store = require('../../lib/store');

const TYPES = { voice: 'voice', فويس: 'voice', 1: 'voice', text: 'text', شات: 'text', 2: 'text', both: 'both', الكل: 'both' };

module.exports = {
  name: 'setgroup',
  aliases: ['كاتقوري'],
  level: 'manager',
  description: 'تحديد كاتقوري رومات القروبات',
  usage: 'setgroup <voice|text|both> <ايدي الكاتقوري>',
  async run(client, message, args, { data, prefix }) {
    let type = TYPES[(args[0] || '').toLowerCase()];
    const id = (args.join(' ').match(/\d{17,20}/) || [])[0];
    if (!id) {
      return message.reply(`**الاستخدام:**\n\`${prefix}setgroup voice <ايدي>\` كاتقوري الفويس\n\`${prefix}setgroup text <ايدي>\` كاتقوري الشات\n\`${prefix}setgroup both <ايدي>\` نفس الكاتقوري للاثنين\n-# لنسخ ايدي الكاتقوري: فعّل وضع المطوّر، ثم كليك يمين على الكاتقوري ← نسخ المعرّف`);
    }
    const category = message.guild.channels.cache.get(id);
    if (!category || category.type !== 'GUILD_CATEGORY') return message.reply('**هذا الايدي مو لكاتقوري في هذا السيرفر.**');

    if (!type) {
      const ans = await ui.ask(message, '**هذي الكاتقوري لأي نوع؟**\n`1` الفويس\n`2` الشات\n`both` الاثنين');
      if (!ans) return;
      type = TYPES[ans.content.trim().toLowerCase()];
      ans.delete().catch(() => {});
      if (!type) return message.reply('**اختيار غير صحيح.**');
    }

    if (type === 'both' || type === 'voice') data.settings.categories.voice = category.id;
    if (type === 'both' || type === 'text') data.settings.categories.text = category.id;
    store.save(message.guild.id);

    const c = data.settings.categories;
    const show = (x) => (x ? `<#${x}>` : 'غير محدد');
    return message.reply(`**تم الحفظ.\nكاتقوري الفويس: ${show(c.voice)}\nكاتقوري الشات: ${show(c.text)}**`);
  },
};
