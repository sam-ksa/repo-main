const G = require('../../lib/groups');
const ui = require('../../lib/ui');
const panel = require('../../lib/panel');

module.exports = {
  name: 'topg',
  aliases: ['توب'],
  level: 'public',
  description: 'ترتيب القروبات حسب النقاط (صورة + قائمة كاملة)',
  usage: 'topg',
  async run(client, message, args, { data }) {
    const list = G.ranked(data);
    if (!list.length) return message.reply('**لا توجد قروبات بعد.**');

    // صورة التوب 10 بدون امبيد
    const { img } = await panel.build(message.guild, data);
    await message.reply({ files: [img] });
    if (list.length <= panel.TOP_N) return;

    // أكثر من 10: صفحات للباقي
    const rest = list.slice(panel.TOP_N);
    const pages = ui.chunk(rest, 15).map((part, p) => ui.embed(data)
      .setTitle('باقي الترتيب')
      .setDescription(part.map((g, i) => `\`#${panel.TOP_N + p * 15 + i + 1}\` **${g.name}** : ${g.points} نقطة`).join('\n')));
    return ui.paginate(message, pages);
  },
};
