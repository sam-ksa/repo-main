const store = require('../../lib/store');

module.exports = {
  name: 'setprefix',
  aliases: ['بادئة'],
  level: 'admin',
  description: 'تغيير بادئة البوت في هذا السيرفر (reset للافتراضية)',
  usage: 'setprefix <بادئة | reset>',
  async run(client, message, args, { data, prefix }) {
    const p = args[0];
    if (!p) return message.reply(`**البادئة الحالية: \`${prefix}\`**`);
    if (p.toLowerCase() === 'reset') {
      data.settings.prefix = null;
      store.save(message.guild.id);
      return message.reply(`**رجعت البادئة للافتراضية: \`${client.config.prefix}\`**`);
    }
    if (p.length > 5) return message.reply('**البادئة لازم تكون 5 أحرف أو أقل.**');
    data.settings.prefix = p;
    store.save(message.guild.id);
    return message.reply(`**تم تعيين البادئة إلى \`${p}\`**\n-# تقدر دائماً تستخدم منشن البوت كبادئة`);
  },
};
