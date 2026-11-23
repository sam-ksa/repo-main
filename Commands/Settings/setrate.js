const store = require('../../lib/store');
const { TICK_MS } = require('../../lib/points');

module.exports = {
  name: 'setrate',
  aliases: ['معدل-النقاط'],
  level: 'admin',
  description: 'عدد النقاط لكل عضو في الفويس كل دقيقتين (0 = إيقاف النقاط التلقائية)',
  usage: 'setrate <عدد> [deaf on|off]',
  async run(client, message, args, { data }) {
    const s = data.settings;
    if ((args[0] || '').toLowerCase() === 'deaf') {
      const v = (args[1] || '').toLowerCase();
      if (!['on', 'off'].includes(v)) return message.reply('**الاستخدام: `setrate deaf on|off`\non تعني اللي مسوي ديفن ما ياخذ نقاط.**');
      s.ignoreDeafened = v === 'on';
      store.save(message.guild.id);
      return message.reply(`**${s.ignoreDeafened ? 'اللي مسوي ديفن ما ياخذ نقاط.' : 'الكل ياخذ نقاط حتى لو مسوي ديفن.'}**`);
    }
    const n = parseInt(args[0], 10);
    if (!Number.isFinite(n) || n < 0 || n > 1000) {
      return message.reply(`**المعدل الحالي: ${s.pointsPerTick} نقطة لكل عضو كل ${TICK_MS / 60000} دقائق.\nالاستخدام: ${this.usage}**`);
    }
    s.pointsPerTick = n;
    store.save(message.guild.id);
    return message.reply(n ? `**صار كل عضو في فويس قروبه ياخذ ${n} نقطة كل ${TICK_MS / 60000} دقائق.**` : '**تم إيقاف النقاط التلقائية.**');
  },
};
