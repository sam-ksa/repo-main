const G = require('../../lib/groups');
const ui = require('../../lib/ui');

module.exports = {
  name: 'list',
  aliases: ['القروبات'],
  level: 'manager',
  description: 'عرض كل القروبات',
  usage: 'list',
  async run(client, message, args, { data }) {
    const groups = G.all(data).sort((a, b) => a.name.localeCompare(b.name));
    if (!groups.length) return message.reply('**لا توجد قروبات.**');
    const pages = ui.chunk(groups, 10).map((part) => ui.embed(data)
      .setTitle(`القروبات (${groups.length})`)
      .setDescription(part.map((g) => `**${g.name}** : الأونر <@${g.leader}> • ${g.members.length} عضو`).join('\n')));
    return ui.paginate(message, pages);
  },
};
