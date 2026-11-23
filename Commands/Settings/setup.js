const ui = require('../../lib/ui');
const store = require('../../lib/store');
const panel = require('../../lib/panel');
const perms = require('../../lib/perms');

module.exports = {
  name: 'setup',
  aliases: ['اعداد'],
  level: 'admin',
  description: 'إعداد تلقائي: كاتقوري القروبات + روم اللوق + روم لوحة التوب',
  usage: 'setup',
  async run(client, message, args, { data, prefix }) {
    const guild = message.guild;
    const missing = perms.missingBotPerms(guild, ['MANAGE_CHANNELS', 'MANAGE_ROLES', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES']);
    if (missing.length) return message.reply(`**البوت يحتاج صلاحيات: ${perms.permList(missing)}**`);

    const s = data.settings;
    const existing = (id) => id && guild.channels.cache.get(id);
    const done = [];
    const reason = `إعداد Panel Tek بواسطة ${message.author.tag}`;

    let category = existing(s.categories.text) || existing(s.categories.voice);
    if (!category) {
      category = await guild.channels.create('القروبات', { type: 'GUILD_CATEGORY', reason });
      done.push(`كاتقوري القروبات: **${category.name}**`);
    }
    if (!existing(s.categories.voice)) s.categories.voice = category.id;
    if (!existing(s.categories.text)) s.categories.text = category.id;

    if (!existing(s.logChannel)) {
      const log = await guild.channels.create('groups-log', {
        type: 'GUILD_TEXT',
        parent: category.id,
        reason,
        permissionOverwrites: [
          { id: guild.id, deny: ['VIEW_CHANNEL'] },
          { id: guild.me.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES'] },
        ],
      });
      s.logChannel = log.id;
      done.push(`روم اللوق: ${log}`);
    }

    if (!existing(s.panel.channelId)) {
      const top = await guild.channels.create('top-groups', {
        type: 'GUILD_TEXT',
        parent: category.id,
        reason,
        permissionOverwrites: [
          { id: guild.id, allow: ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'], deny: ['SEND_MESSAGES'] },
          { id: guild.me.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES'] },
        ],
      });
      await panel.send(top, data);
      done.push(`لوحة التوب: ${top}`);
    }

    store.save(guild.id);
    const e = ui.embed(data)
      .setTitle('تم إعداد نظام القروبات')
      .setDescription(`${done.length ? done.map((d) => `• ${d}`).join('\n') : '**كل شيء مُعد مسبقاً.**'}\n\n**الخطوة الجاية:** \`${prefix}create\` لإنشاء أول قروب.\n\`${prefix}settings\` لعرض كل الإعدادات.`);
    return message.reply(ui.withLogo({ embeds: [e] }));
  },
};
