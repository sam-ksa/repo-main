// أزرار لوحة التوب (تشتغل لأي أحد في السيرفر)
const store = require('../lib/store');
const panel = require('../lib/panel');
const G = require('../lib/groups');
const ui = require('../lib/ui');
const panelStyle = require('../lib/panelStyle');
const fs = require('fs');
const { MessageAttachment } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton() || !interaction.guild) return;
    if (!interaction.customId.startsWith('panel:')) return;
    const data = store.get(interaction.guild.id);

    // زر التحديث انشال (اللوحة تتحدث كل 60 ثانية). لو أحد ضغطه في رسالة قديمة قبل ما تتحدث، نحدثها بصمت
    if (interaction.customId === 'panel:refresh') {
      await interaction.deferUpdate().catch(() => {});
      panel.update(interaction.guild, { force: true }).catch(() => {});
      return;
    }

    if (interaction.customId === 'panel:mine') {
      const group = G.findByMember(data, interaction.user.id);
      if (!group) return interaction.reply({ content: '**أنت لست عضواً في أي قروب.**', ephemeral: true });
      const list = G.ranked(data);
      const rank = list.findIndex((g) => g.id === group.id) + 1;
      const above = list[rank - 2];
      const gap = above ? `\nيحتاج قروبك **${above.points - group.points + 1}** نقطة ليتجاوز **${above.name}**.` : '\n**قروبك في المركز الأول!**';
      const e = ui.embed(data)
        .setTitle(group.name)
        .setDescription(`**الترتيب: #${rank} من ${list.length}\nالنقاط: ${group.points}\nالأعضاء: ${group.members.length}**${gap}`);

      // صورة القروب مكان الشعار (إذا القروب عنده صورة والملف موجود)
      const extra = [];
      const file = panelStyle.assetPath(group.image);
      if (file && fs.existsSync(file)) {
        extra.push(new MessageAttachment(file, 'group.png'));
        e.setThumbnail('attachment://group.png');
      }
      return interaction.reply(ui.withLogo({ embeds: [e], ephemeral: true }, extra));
    }
  },
};
