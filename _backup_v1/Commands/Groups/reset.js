const { logoURL, logoFile } = require('../../utils/logo');
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const config = require("../../config.json");
const fs = require("fs");

module.exports = {
  name: 'reset',
  run: async (client, message, args) => {
    const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
    const groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));
    const settings = JSON.parse(fs.readFileSync("./settings.json", "utf8"));
    if (!config.owners.includes(message.author.id) && !groups.managers.includes(message.author.id)) {
      return 
    }


    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('yes')
          .setLabel('Yes')
          .setStyle('SUCCESS'),
        new MessageButton()
          .setCustomId('no')
          .setLabel('No')
          .setStyle('DANGER')
      );

    const confirmMessage = await message.reply({ content:'**هل تود تصفير جميع النقاط ؟**', components: [row] });

    const filter = i => i.customId === 'yes' || i.customId === 'no';
    const collector = confirmMessage.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
      if (i.customId === 'yes') {
        let groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));

        for (const [name, data] of Object.entries(groups)) {
          if (data.points !== undefined) {
            data.points = 0;
          }
        }

        fs.writeFileSync("./groups.json", JSON.stringify(groups, null, 2), "utf8");

        await i.update({ content: '**تم تصفير جميع النقاط بنجاح.**', components: [] });
      } else if (i.customId === 'no') {
        await i.update({ content: '**تم إلغاء العملية.**', components: [] });
      }
    });

    collector.on('end', collected => {
      if (!collected.size) {
        confirmMessage.edit({ content: '**انتهى الوقت ولم يتم الرد.**', components: [] });
      }
    });

    const logChannel = client.channels.cache.get(settings.logChannel);
    if (logChannel) {
        const logEmbed = new MessageEmbed()
            .setThumbnail(logoURL)
            .setColor("#5c5e64")
            .setTitle("اعادة تعيين نقاط")
            .setDescription(`**
اسم القروب : ${groupName}
بواسطة : <@${message.author.id}>
           ** `);
        logChannel.send({ embeds: [logEmbed], files: [logoFile()] });
    }
  }
};
