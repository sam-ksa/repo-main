const ui = require('../../lib/ui');

module.exports = {
  name: 'owners',
  level: 'owner',
  description: 'قائمة أونرات البوت',
  usage: 'owners',
  async run(client, message, args, { data }) {
    const list = client.config.owners.map((id, i) => `\`#${i + 1}\` <@${id}>`).join('\n') || 'لا يوجد';
    return message.reply(ui.withLogo({ embeds: [ui.embed(data).setTitle('أونرات البوت').setDescription(list)] }));
  },
};
