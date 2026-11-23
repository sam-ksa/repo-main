const G = require('../../lib/groups');
const ui = require('../../lib/ui');
const { groupCtx } = require('../../lib/groupCtx');

module.exports = {
  name: 'members',
  aliases: ['اعضاء'],
  level: 'public',
  groupRole: 'member',
  description: 'عرض أعضاء القروب',
  usage: 'اعضاء',
  async run(client, message, args, { data }) {
    const ctx = groupCtx(client, message, data, 'member');
    if (!ctx) return;
    const { group } = ctx;
    const order = { leader: 0, admin: 1, member: 2 };
    const sorted = [...group.members].sort((a, b) => order[G.roleIn(group, a)] - order[G.roleIn(group, b)]);
    const pages = ui.chunk(sorted, 20).map((part, p) => ui.embed(data)
      .setTitle(`أعضاء ${group.name} (${group.members.length})`)
      .setDescription(part.map((id, i) => `\`${p * 20 + i + 1}\` <@${id}> : ${G.ROLE_NAMES[G.roleIn(group, id)]}`).join('\n')));
    return ui.paginate(message, pages, { support: false, files: await ui.iconFor(pages, 'members') });
  },
};
