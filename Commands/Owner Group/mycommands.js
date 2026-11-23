const emojis = require('../../lib/emojis');
const ui = require('../../lib/ui');
const { groupCtx } = require('../../lib/groupCtx');
const { SHORT } = require('../Public/help');

module.exports = {
  name: 'mycommands',
  aliases: ['اوامري'],
  level: 'public',
  groupRole: 'member',
  description: 'أوامر القروب',
  usage: 'mycommands',
  async run(client, message, args, { data, prefix }) {
    const ctx = groupCtx(client, message, data, 'member');
    if (!ctx) return;
    const order = Object.keys(SHORT);
    const lines = [...client.commands.filter((c) => c.folder === 'Owner Group').values()]
      .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
      .map((c) => `${emojis.str(c.name)} ${prefix}${c.name} : ${SHORT[c.name] || c.description}`.trim());
    const e = ui.embed(data).setDescription(`**${lines.join('\n')}**`);
    return message.reply(ui.withLogo({ embeds: [e] }, await ui.iconFor(e, 'mycommands'), { support: false }));
  },
};
