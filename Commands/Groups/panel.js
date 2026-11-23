const panel = require('../../lib/panel');
const perms = require('../../lib/perms');

module.exports = {
  name: 'panel',
  aliases: ['لوحة'],
  level: 'manager',
  description: 'إرسال لوحة التوب اللي تتحدث تلقائياً (أو إيقافها بـ off)',
  usage: 'panel [#روم | off]',
  async run(client, message, args, { data }) {
    if ((args[0] || '').toLowerCase() === 'off') {
      const { channelId, messageId } = data.settings.panel;
      const ch = channelId && message.guild.channels.cache.get(channelId);
      if (ch && messageId) ch.messages.delete(messageId).catch(() => {});
      data.settings.panel = { ...data.settings.panel, channelId: null, messageId: null };
      require('../../lib/store').save(message.guild.id);
      return message.reply('**تم إيقاف لوحة التوب.**');
    }

    const channel = message.mentions.channels.first() || message.channel;
    if (!channel.isText()) return message.reply('**اختر روم كتابي.**');
    const missing = channel.permissionsFor(message.guild.me).missing(['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES']);
    if (missing.length) return message.reply(`**البوت يحتاج في ${channel}: ${perms.permList(missing)}**`);

    await panel.send(channel, data);
    if (channel.id !== message.channel.id) message.reply(`**تم إرسال لوحة التوب في ${channel}. تتحدث كل ${panel.intervalOf(data)} ثانية.**
-# تقدر تغيّر المدة من أمر customize`);
    else message.delete().catch(() => {});
  },
};
