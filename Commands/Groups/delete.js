const G = require('../../lib/groups');
const ui = require('../../lib/ui');
const ops = require('../../lib/groupOps');

module.exports = {
  name: 'delete',
  aliases: ['حذف'],
  level: 'manager',
  description: 'حذف قروب مع روماته ورتبته',
  usage: 'delete <اسم القروب | @رتبته>',
  async run(client, message, args, { data }) {
    if (!args.length && !G.findByChannel(data, message.channel.id)) return message.reply('**حدد اسم القروب.**');
    const group = G.resolve(message, data, args);
    if (!group) return message.reply('**القروب غير موجود.**');

    const { ok, msg } = await ui.confirm(message, `**متأكد تبي تحذف قروب ${group.name}؟ بتنحذف الرومات والرتبة ونقاطه (${group.points}).**`);
    if (!ok) return;

    const name = group.name;
    const inGroupChannel = message.channel.id === group.textChannel;
    await ops.deleteGroup(message.guild, data, group, `حذف قروب بواسطة ${message.author.tag}`);
    if (!inGroupChannel) msg.edit({ content: `**تم حذف القروب ${name}.**` }).catch(() => {});

    ui.log(message.guild, data, ui.embed(data).setTitle('حذف قروب').setDescription(`**القروب: ${name}\nبواسطة: ${message.author}**`));
  },
};
