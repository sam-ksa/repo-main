const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
  name: 'setvoice',
  aliases: ['247', 'bot-setvoice'],
  level: 'admin',
  description: 'تثبيت البوت في روم صوتي',
  usage: 'setvoice <#روم صوتي | ايدي>',
  async run(client, message, args) {
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    if (!channel || !channel.isVoice()) return message.reply(`**الاستخدام: ${this.usage}**`);
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
      selfMute: true,
      selfDeaf: true,
    });
    connection.once('ready', () => message.reply(`**البوت دخل ${channel}.**`).catch(() => {}));
    connection.on('error', (e) => message.reply(`**خطأ: ${e.message}**`).catch(() => {}));
  },
};
