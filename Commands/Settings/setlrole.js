const store = require('../../lib/store');

module.exports = {
  name: 'setlrole',
  aliases: ['رتبة-الاونرات'],
  level: 'manager',
  description: 'رتبة تنعطى لكل أونرات القروبات (أو off)',
  usage: 'setlrole <@رتبة | ايدي | off>',
  async run(client, message, args, { data }) {
    if ((args[0] || '').toLowerCase() === 'off') {
      data.settings.leadersRole = null;
      store.save(message.guild.id);
      return message.reply('**تم إلغاء رتبة الأونرات.**');
    }
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    if (!role) return message.reply(`**الاستخدام: ${this.usage}**`);
    if (role.managed || role.position >= message.guild.me.roles.highest.position) {
      return message.reply('**البوت ما يقدر يعطي هذي الرتبة. خل رتبة البوت فوقها.**');
    }
    data.settings.leadersRole = role.id;
    store.save(message.guild.id);
    return message.reply(`**تم تعيين ${role} رتبة لأونرات القروبات.**`);
  },
};
