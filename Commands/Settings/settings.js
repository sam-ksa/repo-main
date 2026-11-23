const ui = require('../../lib/ui');
const G = require('../../lib/groups');
const { TICK_MS } = require('../../lib/points');

module.exports = {
  name: 'settings',
  aliases: ['الاعدادات'],
  level: 'manager',
  description: 'عرض إعدادات نظام القروبات في هذا السيرفر',
  usage: 'settings',
  async run(client, message, args, { data, prefix }) {
    const s = data.settings;
    const ch = (id) => (id ? `<#${id}>` : 'غير محدد');
    const role = (id) => (id ? `<@&${id}>` : 'غير محددة');
    const e = ui.embed(data)
      .setTitle('إعدادات القروبات')
      .addField('البادئة', `\`${prefix}\``, true)
      .addField('عدد القروبات', String(G.all(data).length), true)
      .addField('كاتقوري الفويس', ch(s.categories.voice), true)
      .addField('كاتقوري الشات', ch(s.categories.text), true)
      .addField('روم اللوق', ch(s.logChannel), true)
      .addField('لوحة التوب', ch(s.panel.channelId), true)
      .addField('رتبة الأونرات', role(s.leadersRole), true)
      .addField('رتبة المسؤولين', role(s.managerRole), true)
      .addField('النقاط', `${s.pointsPerTick} لكل عضو / ${TICK_MS / 60000} د${s.ignoreDeafened ? ' • الديفن ما يحسب' : ''}`, false);
    return message.reply(ui.withLogo({ embeds: [e] }));
  },
};
