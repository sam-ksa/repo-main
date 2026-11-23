const { logoURL, logoFile } = require('../../utils/logo');
const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'check',
  run: async (client, message, args) => {
    const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
    const groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));
    const settings = JSON.parse(fs.readFileSync("./settings.json", "utf8"));
    if (!config.owners.includes(message.author.id) && !groups.managers.includes(message.author.id)) {
      return 
    }

    if (!args[0]) {
      return message.reply("يرجى تحديد أي دي المستخدم أو اسم القروب.");
    }


    let groupName = args[0];
    let group = groups[groupName];

    if (!group) {
      return message.reply("**القروب غير موجود.**");
    }

    const role = message.guild.roles.cache.get(group.role);
    if (!role) {
      return message.reply("**الرول غير موجود.**");
    }

    const membersWithRole = role.members.map(member => member.id);

    if (membersWithRole.length === 0) {
      return message.reply("**لا يوجد أعضاء في هذا القروب.**");
    }

    const leader = group.leader;
    const admins = group.admins || [];
    const members = group.members.filter(member => member !== leader && !admins.includes(member));

    const embed = new MessageEmbed()
      .setColor("#5c5e64")
      .setTitle(`${groupName}`)
      .setThumbnail(logoURL)
      .setTimestamp()

    embed.addField("الأونر:", `<@${leader}>`, false);
    if (admins.length > 0) {
      embed.addField("المسؤولين:", `${admins.map((admin, index) => `\`${index + 1}\`: <@${admin}>`).join('\n')}`, false);
    } else {
      embed.addField("المسؤولين:", "لا يوجد مسؤولين.", false);
    }
    if (members.length > 0) {
      embed.addField("الأعضاء:", `${members.map((member, index) => `\`${index + 1}\`: <@${member}>`).join('\n')}`, false);
    } else {
      embed.addField("الأعضاء:", "لا يوجد أعضاء.", false);
    }

    message.reply({ embeds: [embed], files: [logoFile()] });
  }
};
