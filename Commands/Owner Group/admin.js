const G = require('../../lib/groups');
const ui = require('../../lib/ui');
const store = require('../../lib/store');
const ops = require('../../lib/groupOps');
const { groupCtx } = require('../../lib/groupCtx');

module.exports = {
  name: 'admin',
  aliases: ['مسؤول'],
  level: 'public',
  groupRole: 'leader',
  description: 'إضافة مسؤول للقروب أو إزالته (الأونر فقط)',
  usage: 'مسؤول @عضو',
  async run(client, message, args, { data }) {
    const ctx = groupCtx(client, message, data, 'leader');
    if (!ctx) return;
    const { group } = ctx;

    const member = await ui.resolveMember(message.guild, message.mentions.members.first() ? message : args[0]);
    if (!member) return message.reply('**منشن العضو أو اكتب الايدي.**');
    if (member.user.bot || member.id === group.leader) return message.reply('**ما ينفع.**');

    if (group.admins.includes(member.id)) {
      group.admins = group.admins.filter((id) => id !== member.id);
      store.save(message.guild.id);
      return message.reply(`**تمت إزالة ${member} من مسؤولي القروب (باقي عضو).**`);
    }

    if (!group.members.includes(member.id)) {
      const other = G.findByMember(data, member.id);
      if (other) return message.reply(`**${member} موجود في قروب ثاني (${other.name}).**`);
      await ops.addMember(message.guild, group, member, `إضافة لقروب ${group.name}`);
    }
    group.admins.push(member.id);
    store.save(message.guild.id);
    return message.reply(`**صار ${member} مسؤول في القروب.**`);
  },
};
