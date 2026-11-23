const { logoURL, logoFile } = require('../../utils/logo');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const fs = require('fs');

module.exports = {
  name: 'topg',
  run: async (client, message, args) => {
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    let groups = JSON.parse(fs.readFileSync('./groups.json', 'utf8'));

    if (!config.owners.includes(message.author.id) && !groups.managers.includes(message.author.id)) {
      return message.reply('ليس لديك الصلاحيات اللازمة.');
    }

    let validGroups = Object.entries(groups).filter(([name, data]) => data.points !== undefined);

    if (validGroups.length === 0) {
      return message.reply('لا يوجد قروبات.');
    }

    let sortedGroups = validGroups.sort((a, b) => b[1].points - a[1].points).slice(0, 10);

    const itemsPerPage = 5; 
    let currentPage = 0;
    const totalPages = Math.ceil(sortedGroups.length / itemsPerPage);

    const generateEmbed = (page) => {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const paginatedGroups = sortedGroups.slice(start, end);

      const embed = new MessageEmbed()
        .setColor('#5c5e64')
        .setTitle('قائمة توب 10 للقروبات')
        .setThumbnail(logoURL)
        .setFooter({ text: `Page ${page + 1}/${totalPages}` });

      paginatedGroups.forEach(([groupName, group]) => {
        const membersCount = group.members.length;
        const points = group.points;
        const leader = `<@${group.leader}>` || 'غير محدد';

        embed.addField(groupName, `**Owner:** ${leader} - **Points:** ${points}`);
      });

      return embed;
    };

    const generateButtons = (page) => {
      return new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId('prev')
          .setLabel('السابق')
          
          .setStyle('SECONDARY')
          .setDisabled(page === 0),
        new MessageButton()
          .setCustomId('next')
          .setLabel('التالي')
          
          .setStyle('SECONDARY')
          .setDisabled(page === totalPages - 1)
      );
    };

    const updateMessage = async () => {
      groups = JSON.parse(fs.readFileSync('./groups.json', 'utf8')); // إعادة قراءة الملف لتحديث القروبات
      validGroups = Object.entries(groups).filter(([name, data]) => data.points !== undefined);
      sortedGroups = validGroups.sort((a, b) => b[1].points - a[1].points).slice(0, 10);
      
      const updatedEmbed = generateEmbed(currentPage);
      const updatedButtons = generateButtons(currentPage);

      await messageEmbed.edit({ embeds: [updatedEmbed], files: [logoFile()], attachments: [], components: [updatedButtons] });
    };

    const initialEmbed = generateEmbed(currentPage);
    const initialButtons = generateButtons(currentPage);

    const messageEmbed = await message.reply({ embeds: [initialEmbed], files: [logoFile()], components: [initialButtons] });

    const filter = (interaction) => {
      return ['prev', 'next'].includes(interaction.customId) && interaction.user.id === message.author.id;
    };

    const collector = messageEmbed.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'prev') {
        currentPage = Math.max(currentPage - 1, 0);
      } else if (interaction.customId === 'next') {
        currentPage = Math.min(currentPage + 1, totalPages - 1);
      }

      await updateMessage();
      await interaction.deferUpdate();
    });

    // مراقبة التغييرات في ملف groups.json لتحديث الرسالة
    fs.watchFile('./groups.json', () => {
      updateMessage();
    });

    // تحديث الرسالة كل 10 ثوانٍ
    setInterval(updateMessage, 60000);
  }
};
