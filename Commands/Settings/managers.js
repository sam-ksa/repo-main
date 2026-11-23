const ui = require('../../lib/ui');

module.exports = {
  name: 'managers',
  aliases: ['المسؤولين'],
  level: 'manager',
  description: 'قائمة مسؤولي القروبات',
  usage: 'managers',
  async run(client, message, args, { data }) {
    const s = data.settings;
    const list = s.managers.map((id, i) => `\`${i + 1}\` <@${id}>`).join('\n') || 'لا يوجد';
    const e = ui.embed(data)
      .setTitle('مسؤولي القروبات')
      .setDescription(`${list}\n\n**رتبة المسؤولين:** ${s.managerRole ? `<@&${s.managerRole}>` : 'غير محددة'}\n-# أونر السيرفر واللي عندهم Administrator مسؤولين تلقائياً`);
    return message.reply(ui.withLogo({ embeds: [e] }));
  },
};
