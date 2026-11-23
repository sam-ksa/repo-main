const G = require('../../lib/groups');
const ui = require('../../lib/ui');
const store = require('../../lib/store');
const panel = require('../../lib/panel');

// يستخدم لـ addpoint و removepoint: آخر كلمة رقم والباقي اسم القروب
function makePointsCommand({ name, aliases, sign, title, description }) {
  return {
    name,
    aliases,
    level: 'manager',
    description,
    usage: `${name} <اسم القروب> <عدد>`,
    async run(client, message, args, { data }) {
      const amount = parseInt(args[args.length - 1], 10);
      if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1e9) return message.reply(`**الاستخدام: ${this.usage}**`);
      const group = G.resolve(message, data, args.slice(0, -1));
      if (!group) return message.reply('**القروب غير موجود.**');

      group.points = Math.max(0, group.points + sign * amount);
      store.save(message.guild.id);
      panel.schedule(message.guild, 2000);

      message.reply(`**${sign > 0 ? 'تمت إضافة' : 'تمت إزالة'} ${amount} نقطة ${sign > 0 ? 'لقروب' : 'من قروب'} ${group.name}. النقاط الحالية: ${group.points} (الترتيب #${G.rankOf(data, group.id)})**`);
      ui.log(message.guild, data, ui.embed(data).setTitle(title).setDescription(
        `**القروب: ${group.name}\nالعدد: ${amount}\nالنقاط الحالية: ${group.points}\nبواسطة: ${message.author}**`,
      ));
    },
  };
}

module.exports = makePointsCommand({
  name: 'addpoint', aliases: ['اضافة-نقاط'], sign: 1, title: 'إضافة نقاط', description: 'إضافة نقاط لقروب',
});
module.exports.makePointsCommand = makePointsCommand;
