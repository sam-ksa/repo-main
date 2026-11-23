const ui = require('../../lib/ui');
const { groupCtx } = require('../../lib/groupCtx');
const { groupEmbed } = require('../Groups/info');

module.exports = {
  name: 'mygroup',
  aliases: ['قروبي'],
  level: 'public',
  groupRole: 'member',
  description: 'معلومات القروب وترتيبه',
  usage: 'قروبي',
  async run(client, message, args, { data }) {
    const ctx = groupCtx(client, message, data, 'member');
    if (!ctx) return;
    const e = groupEmbed(data, ctx.group);
    return message.reply(ui.withLogo({ embeds: [e] }, await ui.iconFor(e, 'mygroup'), { support: false }));
  },
};
