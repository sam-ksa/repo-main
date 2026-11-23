const G = require('../../lib/groups');
const ui = require('../../lib/ui');
const store = require('../../lib/store');
const panel = require('../../lib/panel');

module.exports = {
  name: 'reset',
  aliases: ['تصفير'],
  level: 'manager',
  description: 'تصفير نقاط كل القروبات أو قروب واحد',
  usage: 'reset [اسم القروب]',
  async run(client, message, args, { data }) {
    const group = args.length ? G.resolve(message, data, args) : null;
    if (args.length && !group) return message.reply('**القروب غير موجود.**');

    const target = group ? `نقاط قروب ${group.name}` : `نقاط جميع القروبات (${G.all(data).length})`;
    const { ok, msg } = await ui.confirm(message, `**متأكد تبي تصفّر ${target}؟**`);
    if (!ok) return;

    for (const g of group ? [group] : G.all(data)) g.points = 0;
    store.save(message.guild.id);
    panel.schedule(message.guild, 1000);
    msg.edit({ content: `**تم تصفير ${target}.**` }).catch(() => {});

    ui.log(message.guild, data, ui.embed(data).setTitle('تصفير نقاط').setDescription(`**${target}\nبواسطة: ${message.author}**`));
  },
};
