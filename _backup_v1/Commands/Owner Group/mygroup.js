const { logoURL, logoFile } = require('../../utils/logo');
const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'mygroup',
  aliases: ['قروبي'], 
  folder: 'Owner Group', 
  run: async (client, message, args) => {
    try {
      let groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));

      const userGroupEntry = Object.entries(groups).find(([groupName, group]) => group.members && group.members.includes(message.author.id));

      if (!userGroupEntry) {
        return 
      }

      const [groupName, group] = userGroupEntry;

      if (message.channel.id !== group.textChannel) {
        return 
      }

      const sortedGroups = Object.entries(groups)
        .filter(([key, g]) => key !== 'managers' && key !== 'leadersRole' && key !== 'categories' && g.points !== undefined)
        .sort((a, b) => b[1].points - a[1].points);
      const topPosition = sortedGroups.findIndex(([name]) => name === groupName) + 1;

      const owner = `<@${group.leader}>`;
      const textChannel = group.textChannel ? `<#${group.textChannel}>` : "غير محدد";
      const voiceChannel = group.voiceChannel ? `<#${group.voiceChannel}>` : "غير محدد";
      const groupRole = group.role ? `<@&${group.role}>` : "غير محدد";
      const memberCount = group.members ? group.members.length : 0;
      const adminCount = group.admins ? group.admins.length : 0;
      const points = group.points || 0;

      const embed = new MessageEmbed()
        .setColor("#5c5e64")
        .setTitle(groupName)
        .setThumbnail(logoURL)
        .addField("الأونر", owner, true)
        .addField("الروم الكتابي", textChannel, true)
        .addField("الروم الصوتي", voiceChannel, true)
        .addField("الرول", groupRole, true)
        .addField("عدد أعضاء القروب", memberCount.toString(), true)
        .addField("مسؤولي القروب", adminCount.toString(), true)
        .addField("النقاط", points.toString(), true)
        .addField("التوب", topPosition.toString(), true);

      console.log(`Sending embed for group: ${groupName}`);
      message.reply({ embeds: [embed], files: [logoFile()] });
    } catch (error) {
      console.error(`Error executing 'ginfo' command: ${error.message}`);
      message.reply("**حدث خطأ أثناء محاولة تنفيذ الأمر.**");
    }
  }
};
