const G = require('../../lib/groups');
const ui = require('../../lib/ui');
const ops = require('../../lib/groupOps');
const { groupCtx } = require('../../lib/groupCtx');

module.exports = {
  name: 'add',
  aliases: ['اضافة', 'اضافه'],
  level: 'public',
  groupRole: 'admin',
  description: 'إضافة عضو للقروب أو إزالته (أونر ومسؤول القروب)',
  usage: 'اضافة @عضو',
  async run(client, message, args, { data }) {
    const ctx = groupCtx(client, message, data, 'admin');
    if (!ctx) return;
    const { group, role } = ctx;

    const member = await ui.resolveMember(message.guild, message.mentions.members.first() ? message : args[0]);
    if (!member) return message.reply('**منشن العضو أو اكتب الايدي.**');
    if (member.user.bot) return message.reply('**ما ينفع تضيف بوت.**');
    if (member.id === group.leader) return message.reply('**ما تقدر تشيل أونر القروب.**');

    if (group.members.includes(member.id)) {
      if (group.admins.includes(member.id) && role !== 'leader') return message.reply('**بس الأونر يقدر يشيل مسؤول.**');
      await ops.removeMember(message.guild, group, member, `إزالة من قروب ${group.name}`);
      return message.reply(`**تمت إزالة ${member} من القروب.**`);
    }

    const other = G.findByMember(data, member.id);
    if (other) return message.reply(`**${member} موجود في قروب ثاني (${other.name}).**`);
    const max = data.settings.maxMembers;
    if (max && group.members.length >= max) return message.reply(`**القروب وصل الحد الأقصى (${max} عضو).**`);

    await ops.addMember(message.guild, group, member, `إضافة لقروب ${group.name}`);
    return message.reply(`**تمت إضافة ${member} إلى القروب.**`);
  },
};
