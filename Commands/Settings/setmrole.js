const store = require('../../lib/store');

module.exports = {
  name: 'setmrole',
  aliases: ['رتبة-المسؤولين'],
  level: 'admin',
  description: 'رتبة كل من يحملها يصير مسؤول قروبات (أو off)',
  usage: 'setmrole <@رتبة | ايدي | off>',
  async run(client, message, args, { data }) {
    if ((args[0] || '').toLowerCase() === 'off') {
      data.settings.managerRole = null;
      store.save(message.guild.id);
      return message.reply('**تم إلغاء رتبة المسؤولين.**');
    }
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    if (!role) return message.reply(`**الاستخدام: ${this.usage}**`);
    data.settings.managerRole = role.id;
    store.save(message.guild.id);
    return message.reply(`**كل من يحمل ${role} صار يقدر يدير القروبات.**`);
  },
};
