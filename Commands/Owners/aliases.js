const Data = require('pro.db');
const ui = require('../../lib/ui');

// addalias / removealias / showaliases في ملف واحد
module.exports = {
  name: 'alias',
  aliases: ['addalias', 'removealias', 'showaliases', 'aliases'],
  level: 'owner',
  description: 'اختصارات الأوامر: alias add <أمر> <اختصار> | alias remove <أمر> <اختصار> | alias list',
  usage: 'alias <add|remove|list> [أمر] [اختصار]',
  async run(client, message, args, { data, invoked }) {
    const used = invoked;
    let sub = (args[0] || '').toLowerCase();
    if (used === 'addalias') { sub = 'add'; args.unshift('add'); }
    if (used === 'removealias') { sub = 'remove'; args.unshift('remove'); }
    if (used === 'showaliases' || used === 'aliases') sub = 'list';

    if (sub === 'list' || !sub) {
      const lines = client.commands
        .filter((c) => c.aliases.length)
        .map((c) => `**${c.name}**: \`${c.aliases.join('`, `')}\``);
      return message.reply(ui.withLogo({ embeds: [ui.embed(data).setTitle('الاختصارات').setDescription(lines.join('\n').slice(0, 4000) || 'لا يوجد')] }));
    }

    const [, cmdName, alias] = args.map((a) => a.toLowerCase());
    const command = client.commands.get(cmdName);
    if (!command || !alias) return message.reply(`**الاستخدام: ${this.usage}**`);

    const saved = Data.get(`aliases_${command.name}`) || [];
    if (sub === 'add') {
      const clash = client.commands.find((c) => c.name === alias || c.aliases.includes(alias));
      if (clash) return message.reply(`**الاختصار مستخدم في أمر ${clash.name}.**`);
      command.aliases.push(alias);
      Data.set(`aliases_${command.name}`, [...new Set([...saved, alias])]);
      return message.reply(`**تمت إضافة \`${alias}\` لأمر ${command.name}.**`);
    }
    if (sub === 'remove') {
      if (!command.aliases.includes(alias)) return message.reply('**الاختصار غير موجود.**');
      command.aliases = command.aliases.filter((a) => a !== alias);
      Data.set(`aliases_${command.name}`, saved.filter((a) => a !== alias));
      return message.reply(`**تمت إزالة \`${alias}\`.**`);
    }
    return message.reply(`**الاستخدام: ${this.usage}**`);
  },
};
