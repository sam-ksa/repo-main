const { logoURL, logoFile } = require('../../utils/logo');
const { MessageEmbed } = require("discord.js");
const config = require("../../config.json");
const fs = require("fs");

module.exports = {
  name: 'setlog',
  run: async (client, message, args) => {
    const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
    const groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));
    const settings = JSON.parse(fs.readFileSync("./settings.json", "utf8"));
    if (!config.owners.includes(message.author.id) && !groups.managers.includes(message.author.id)) {
      return 
    }


    const logChannel = message.mentions.channels.first();
    if (!logChannel) return message.reply("**يرجى ذكر قناة اللوق.**");

    settings.logChannel = logChannel.id;
    fs.writeFileSync("./settings.json", JSON.stringify(settings, null, 4));

    const embed = new MessageEmbed()
      .setThumbnail(logoURL)
      .setColor("#5c5e64")
      .setTitle("تم تعيين قناة اللوق")
      .setDescription(`**تم تعيين قناة اللوق إلى ${logChannel}**`);

    message.reply({ embeds: [embed], files: [logoFile()] });
  }
};