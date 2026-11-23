const { saveConfig } = require('../../lib/config');

module.exports = {
  name: 'removeowner',
  level: 'owner',
  description: 'إزالة أونر من البوت',
  usage: 'removeowner <@عضو | ايدي>',
  async run(client, message, args) {
    const id = (message.mentions.users.first() || {}).id || (args[0] || '').match(/^\d{17,20}$/)?.[0];
    if (!id) return message.reply(`**الاستخدام: ${this.usage}**`);
    if (!client.config.owners.includes(id)) return message.reply('**هذا الشخص مو أونر.**');
    if (client.config.owners.length === 1) return message.reply('**ما تقدر تشيل آخر أونر.**');
    client.config.owners = client.config.owners.filter((x) => x !== id);
    saveConfig(client);
    return message.reply(`**تمت إزالة <@${id}> من أونرات البوت.**`);
  },
};
