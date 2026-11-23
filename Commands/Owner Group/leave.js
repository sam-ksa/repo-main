const ui = require('../../lib/ui');
const G = require('../../lib/groups');
const ops = require('../../lib/groupOps');

module.exports = {
  name: 'leave',
  aliases: ['خروج'],
  level: 'public',
  groupRole: 'member',
  description: 'الخروج من القروب',
  usage: 'خروج',
  async run(client, message, args, { data }) {
    const group = G.all(data).find((g) => g.textChannel === message.channel.id);
    if (!group || !group.members.includes(message.author.id)) return;
    if (group.leader === message.author.id) return message.reply('**أنت الأونر. انقل الملكية أو اطلب من الإدارة حذف القروب.**');
    const { ok, msg } = await ui.confirm(message, `**متأكد تبي تطلع من قروب ${group.name}؟**`);
    if (!ok) return;
    await ops.removeMember(message.guild, group, message.member, `خروج من قروب ${group.name}`);
    msg.edit({ content: `**${message.author} طلع من القروب.**` }).catch(() => {});
  },
};
