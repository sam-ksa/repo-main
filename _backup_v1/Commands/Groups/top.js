const { logoURL, logoFile } = require('../../utils/logo');
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'top',
  run: async (client, message, args) => {
    const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
    const groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));
    if (!config.owners.includes(message.author.id) && !groups.managers.includes(message.author.id)) {
      return 
    }

    const validGroups = Object.entries(groups).filter(([name, data]) => data.points !== undefined);
    if (validGroups.length === 0) {
      return message.reply("لا يوجد قروبات.");
    }

    const sortedGroups = validGroups.sort((a, b) => b[1].points - a[1].points);

    const itemsPerPage = 5; 
    let currentPage = 0;
    const totalPages = Math.ceil(sortedGroups.length / itemsPerPage);

    const generateEmbed = (page) => {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const paginatedGroups = sortedGroups.slice(start, end);

      const embed = new MessageEmbed()
        .setColor("#5c5e64")
        .setTitle("قائمة القروبات")
        .setThumbnail(logoURL)
        .setFooter({ text: `Page ${page + 1}/${totalPages}` })
        .setTimestamp();

      paginatedGroups.forEach(([groupName, group]) => {
        const membersCount = group.members.length;
        const points = group.points;
        const leader = `<@${group.leader}>` || "غير محدد";

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

    const initialEmbed = generateEmbed(currentPage);
    const initialButtons = generateButtons(currentPage);

    const messageEmbed = await message.reply({ embeds: [initialEmbed], files: [logoFile()], components: [initialButtons] });

    const filter = (interaction) => {
      return ['prev', 'next'].includes(interaction.customId) && interaction.user.id === message.author.id;
    };

    const collector = messageEmbed.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'prev') {
        currentPage--;
      } else if (interaction.customId === 'next') {
        currentPage++;
      }

      const updatedEmbed = generateEmbed(currentPage);
      const updatedButtons = generateButtons(currentPage);

      await interaction.update({ embeds: [updatedEmbed], files: [logoFile()], attachments: [], components: [updatedButtons] });
    });

    collector.on('end', () => {
      messageEmbed.edit({ components: [] });
    });
  }
};
