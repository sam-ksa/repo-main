const G = require('../../lib/groups');
const ui = require('../../lib/ui');

module.exports = {
  name: 'check',
  aliases: ['فحص'],
  level: 'manager',
  description: 'أعضاء قروب مع التحقق من الرتبة',
  usage: 'check <اسم القروب>',
  async run(client, message, args, { data }) {
    const group = G.resolve(message, data, args);
    if (!group) return message.reply('**القروب غير موجود.**');

    const role = group.role && message.guild.roles.cache.get(group.role);
    // حد ديسكورد 100 عضو لكل طلب، ومهلة قصيرة بدل الافتراضية (دقيقتين)
    const fetched = group.members.length && group.members.length <= 100
      ? await message.guild.members.fetch({ user: group.members, time: 15000 }).catch(() => null)
      : null;
    const line = (id, i) => {
      const m = fetched && fetched.get(id);
      const note = !fetched ? '' : !m ? ' (طلع من السيرفر)' : role && !m.roles.cache.has(role.id) ? ' (بدون رتبة)' : '';
      return `\`${i + 1}\` <@${id}>${note}`;
    };
    const admins = group.admins;
    const members = group.members.filter((id) => id !== group.leader && !admins.includes(id));

    const pages = ui.chunk(members, 20);
    if (!pages.length) pages.push([]);
    const embeds = pages.map((part, p) => ui.embed(data)
      .setTitle(group.name)
      .addField('الأونر', line(group.leader, 0), false)
      .addField('المسؤولين', admins.map(line).join('\n') || 'لا يوجد', false)
      .addField(`الأعضاء (${members.length})`, part.map((id, i) => line(id, p * 20 + i)).join('\n') || 'لا يوجد', false));
    return ui.paginate(message, embeds);
  },
};
