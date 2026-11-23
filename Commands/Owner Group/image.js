const { MessageAttachment } = require('discord.js');
const ui = require('../../lib/ui');
const panel = require('../../lib/panel');
const style = require('../../lib/panelStyle');
const { groupCtx } = require('../../lib/groupCtx');

module.exports = {
  name: 'image',
  aliases: ['صورة', 'صوره'],
  level: 'public',
  groupRole: 'leader',
  description: 'إضافة صورة للقروب تظهر في لوحة التوب',
  usage: 'صورة',
  async run(client, message, args, { data }) {
    const ctx = groupCtx(client, message, data, 'leader');
    if (!ctx) return;
    const { group } = ctx;

    const img = await ui.askImage(message, `**أرفق صورة القروب أو أرسل رابطها:**\n-# تظهر دائرية في لوحة التوب، واكتب حذف لإزالة الصورة`);
    if (!img) return;

    if (img.reset) {
      if (!group.image) return message.reply('**القروب ما عنده صورة.**');
      style.removeGroupImage(message.guild.id, group);
      panel.schedule(message.guild, 2000);
      const done = ui.embed(data).setDescription(`**تم حذف صورة قروب ${group.name}.**`);
      return message.reply(ui.withLogo({ embeds: [done] }, await ui.iconFor(done, 'image'), { support: false }));
    }

    try {
      await style.saveGroupImage(message.guild.id, group, img.urls);
    } finally {
      img.done();
    }
    panel.schedule(message.guild, 2000);

    const e = ui.embed(data)
      .setDescription(`**تم تحديث صورة قروب ${group.name}، وبتظهر في لوحة التوب.**`)
      .setThumbnail(`attachment://group.png`);
    const file = new MessageAttachment(style.assetPath(group.image), 'group.png');
    return message.reply(ui.withLogo({ embeds: [e] }, [file], { support: false }));
  },
};
