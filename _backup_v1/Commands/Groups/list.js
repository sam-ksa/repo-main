const { logoURL, logoFile } = require('../../utils/logo');
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'list',
  run: async (client, message, args) => {
    const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
    const groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));
    if (!config.owners.includes(message.author.id) && !groups.managers.includes(message.author.id)) {
      return 
    }

    const groupEntries = Object.entries(groups).filter(([key, value]) => key !== 'categories' && key !== 'managers' && key !== 'leadersRole');

    if (groupEntries.length === 0) {
      return message.reply("لا يوجد قروبات.");
    }

    const itemsPerPage = 20;
    let currentPage = 0;
    const totalPages = Math.ceil(groupEntries.length / itemsPerPage);

    const generateEmbed = (page) => {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const currentGroups = groupEntries.slice(start, end);

      const embed = new MessageEmbed()
        .setColor("#5c5e64")
        .setThumbnail(logoURL)
        .setTimestamp();

      currentGroups.forEach(([groupName, group]) => {
        embed.addField(
          groupName,
          `**Members [${group.members.length}] - Owner: <@${group.leader}>**`,
          false
        );
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
