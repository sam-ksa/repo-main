const store = require('../../lib/store');

module.exports = {
  name: 'setlog',
  aliases: ['لوق'],
  level: 'manager',
  description: 'تحديد روم لوق القروبات (أو off للإيقاف)',
  usage: 'setlog <#روم | off>',
  async run(client, message, args, { data }) {
    if ((args[0] || '').toLowerCase() === 'off') {
      data.settings.logChannel = null;
      store.save(message.guild.id);
      return message.reply('**تم إيقاف اللوق.**');
    }
    const channel = message.mentions.channels.first();
    if (!channel || !channel.isText()) return message.reply(`**الاستخدام: ${this.usage}**`);
    if (!channel.permissionsFor(message.guild.me).has(['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'])) {
      return message.reply(`**البوت ما يقدر يرسل في ${channel}.**`);
    }
    data.settings.logChannel = channel.id;
    store.save(message.guild.id);
    return message.reply(`**تم تعيين روم اللوق: ${channel}**`);
  },
};
