const G = require('../../lib/groups');
const ui = require('../../lib/ui');

function groupEmbed(data, group) {
  const hours = Math.floor(group.voiceMinutes / 60);
  return ui.embed(data)
    .setTitle(group.name)
    .addField('الأونر', `<@${group.leader}>`, true)
    .addField('الترتيب', `#${G.rankOf(data, group.id)} من ${G.all(data).length}`, true)
    .addField('النقاط', String(group.points), true)
    .addField('الأعضاء', String(group.members.length), true)
    .addField('المسؤولين', String(group.admins.length), true)
    .addField('ساعات الفويس', String(hours), true)
    .addField('الرتبة', group.role ? `<@&${group.role}>` : 'غير موجودة', true)
    .addField('الشات', group.textChannel ? `<#${group.textChannel}>` : 'غير موجود', true)
    .addField('الفويس', group.voiceChannel ? `<#${group.voiceChannel}>` : 'غير موجود', true)
    .setTimestamp(group.createdAt || null);
}

module.exports = {
  name: 'info',
  aliases: ['معلومات'],
  level: 'manager',
  description: 'معلومات قروب (الترتيب والنقاط والرومات)',
  usage: 'info <اسم القروب>',
  groupEmbed,
  async run(client, message, args, { data }) {
    const group = G.resolve(message, data, args);
    if (!group) return message.reply('**القروب غير موجود.**');
    return message.reply(ui.withLogo({ embeds: [groupEmbed(data, group)] }));
  },
};
