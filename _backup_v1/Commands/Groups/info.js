const { logoURL, logoFile } = require('../../utils/logo');
const { MessageEmbed } = require("discord.js");
const config = require("../../config.json");
const fs = require("fs");

module.exports = {
  name: 'info',
  run: async (client, message, args) => {
    const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
    const groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));
    const settings = JSON.parse(fs.readFileSync("./settings.json", "utf8"));
    if (!config.owners.includes(message.author.id) && !groups.managers.includes(message.author.id)) {
      return 
    }



    const groupName = args[0];

    if (!groupName) return message.reply("**يرجى تحديد اسم القروب.**");

    if (!groups[groupName]) return message.reply("**القروب غير موجود.**");

    const group = groups[groupName];

    const validGroups = Object.entries(groups).filter(([name, data]) => data.points !== undefined);
    const sortedGroups = validGroups.sort((a, b) => b[1].points - a[1].points);
    const groupPosition = sortedGroups.findIndex(([name]) => name === groupName) + 1;

    const membersCount = group.members.length;
    const points = group.points;
    const voiceChannel = group.voiceChannel ? `<#${group.voiceChannel}>` : "غير محدد";
    const textChannel = group.textChannel ? `<#${group.textChannel}>` : "غير محدد";
    const role = group.role ? `<@&${group.role}>` : "غير محدد";
    const leader = `<@${group.leader}>` || "غير محدد";

    const embed = new MessageEmbed()
      .setColor("#5c5e64")
      .setThumbnail(logoURL)
      .setAuthor({ name: groupName, iconURL: logoURL })
      .addFields(
        { name: "الأونر", value: `${leader}`, inline: true },
        { name: "الروم الصوتي", value: `${voiceChannel}`, inline: true },
        { name: "الروم الكتابي", value: `${textChannel}`, inline: true },
        { name: "الرتبة", value: `${role}`, inline: true },
        { name: "عدد أعضاء القروب", value: `${membersCount}`, inline: true },
        { name: "النقاط", value: `${points}`, inline: true },
        { name: "الترتيب", value: `${groupPosition}`, inline: true }
      );

    message.reply({ embeds: [embed], files: [logoFile()] });
  }
};
