const { saveConfig } = require('../../lib/config');

module.exports = {
  name: 'setowner',
  level: 'owner',
  description: 'إضافة أونر للبوت (صلاحية كاملة في كل السيرفرات)',
  usage: 'setowner <@عضو | ايدي>',
  async run(client, message, args) {
    const id = (message.mentions.users.first() || {}).id || (args[0] || '').match(/^\d{17,20}$/)?.[0];
    if (!id) return message.reply(`**الاستخدام: ${this.usage}**`);
    if (client.config.owners.includes(id)) return message.reply('**موجود من قبل.**');
    client.config.owners.push(id);
    saveConfig(client);
    return message.reply(`**تمت إضافة <@${id}> كأونر للبوت.**`);
  },
};
