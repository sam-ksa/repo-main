const G = require('../../lib/groups');
const ui = require('../../lib/ui');
const store = require('../../lib/store');

module.exports = {
  name: 'setleader',
  aliases: ['نقل-الملكية'],
  level: 'manager',
  description: 'نقل ملكية قروب لعضو ثاني',
  usage: 'setleader <اسم القروب> @العضو',
  async run(client, message, args, { data }) {
    const member = message.mentions.members.first();
    if (!member) return message.reply(`**الاستخدام: ${this.usage}**`);
    const group = G.resolve(message, data, args.filter((a) => !/^<@!?\d+>$/.test(a)));
    if (!group) return message.reply('**القروب غير موجود.**');
    if (member.user.bot) return message.reply('**ما ينفع يكون الأونر بوت.**');
    if (group.leader === member.id) return message.reply('**هذا العضو هو الأونر أصلاً.**');
    const other = G.findByMember(data, member.id);
    if (other && other.id !== group.id) return message.reply(`**العضو موجود في قروب ${other.name}.**`);

    const old = group.leader;
    const lr = data.settings.leadersRole;
    group.leader = member.id;
    group.admins = group.admins.filter((id) => id !== member.id);
    if (!group.members.includes(member.id)) group.members.push(member.id);
    store.save(message.guild.id);

    if (group.role) await member.roles.add(group.role).catch(() => {});
    if (lr) {
      await member.roles.add(lr).catch(() => {});
      const oldM = await message.guild.members.fetch(old).catch(() => null);
      if (oldM) await oldM.roles.remove(lr).catch(() => {});
    }

    message.reply(`**صار ${member} أونر قروب ${group.name}.**`);
    ui.log(message.guild, data, ui.embed(data).setTitle('نقل ملكية قروب').setDescription(
      `**القروب: ${group.name}\nمن: <@${old}>\nإلى: ${member}\nبواسطة: ${message.author}**`,
    ));
  },
};
