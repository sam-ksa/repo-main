const ui = require('../../lib/ui');
const store = require('../../lib/store');

module.exports = {
  name: 'setmanager',
  aliases: ['مسؤول-قروبات'],
  level: 'admin',
  description: 'إضافة أو إزالة مسؤول قروبات',
  usage: 'setmanager <@عضو | ايدي>',
  async run(client, message, args, { data }) {
    const member = await ui.resolveMember(message.guild, message.mentions.members.first() ? message : args[0]);
    if (!member) return message.reply(`**الاستخدام: ${this.usage}**`);
    const list = data.settings.managers;
    if (list.includes(member.id)) {
      data.settings.managers = list.filter((id) => id !== member.id);
      message.reply(`**تمت إزالة ${member} من مسؤولي القروبات.**`);
    } else {
      list.push(member.id);
      message.reply(`**تمت إضافة ${member} لمسؤولي القروبات.**`);
    }
    store.save(message.guild.id);
  },
};
