const { logoURL, logoFile } = require('../../utils/logo');
const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'members',
  aliases: ['اعضاء'], 
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

      const members = group.members.map((memberId, index) => {
        let memberRole = "عضو";
        if (group.leader === memberId) {
          memberRole = "اونر";
        } else if (group.admins && group.admins.includes(memberId)) {
          memberRole = "مسؤول";
        }
        return `**#${index + 1} <@${memberId}> (${memberRole})**`;
      }).join('\n');

      const embed = new MessageEmbed()
        .setColor("#5c5e64")
        .setTitle(`أعضاء القروب`)
        .setDescription(members)
        .setThumbnail(logoURL);

      message.reply({ embeds: [embed], files: [logoFile()] });
    } catch (error) {
      console.error(`Error executing 'members' command: ${error.message}`);
      message.reply("**حدث خطأ أثناء محاولة تنفيذ الأمر.**");
    }
  }
};
