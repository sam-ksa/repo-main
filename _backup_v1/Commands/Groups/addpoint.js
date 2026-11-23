const { logoURL, logoFile } = require('../../utils/logo');
const fs = require("fs");
const { MessageEmbed } = require("discord.js");

module.exports = {
  name: 'addpoint',
  description: 'Add points to a group.',
  run: async (client, message, args) => {
    const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
    const groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));
    const settings = JSON.parse(fs.readFileSync("./settings.json", "utf8"));
    if (!config.owners.includes(message.author.id) && !groups.managers.includes(message.author.id)) {
      return 
    }


    const groupName = args[0];
    const pointsToAdd = parseInt(args[1]);

    if (!groupName || isNaN(pointsToAdd)) {
      return message.reply("**يرجى تحديد اسم القروب وعدد النقاط.**");
    }


    let group = groups[groupName];

    if (!group) {
      return message.reply("**القروب غير موجود.**");
    }

    group.points = (group.points || 0) + pointsToAdd;
    fs.writeFileSync("./groups.json", JSON.stringify(groups, null, 4));

    message.reply(`**تمت إضافة ${pointsToAdd} نقطة إلى قروب ${groupName}. النقاط الحالية: ${group.points}**`);

    
    const logChannel = client.channels.cache.get(settings.logChannel);
    if (logChannel) {
        const logEmbed = new MessageEmbed()
            .setThumbnail(logoURL)
            .setColor("#5c5e64")
            .setTitle("اضافة نقاط")
            .setDescription(`**اسم القروب : ${groupName}
عدد النقاط : ${pointsToAdd}
بواسطة : <@${message.author.id}>
           ** `);
        logChannel.send({ embeds: [logEmbed], files: [logoFile()] });
    }
  }
};
