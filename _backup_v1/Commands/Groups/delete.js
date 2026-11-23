const { logoURL, logoFile } = require('../../utils/logo');
const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'delete',
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
    const groupLeader = await message.guild.members.fetch(group.leader).catch(() => null);

    if (groupLeader && groups.leadersRole) {
      const leadersRole = message.guild.roles.cache.get(groups.leadersRole);
      if (leadersRole && groupLeader.roles.cache.has(leadersRole.id)) {
        await groupLeader.roles.remove(leadersRole).catch(console.error);
      }
    }
    
    if (group.textChannel) {
      const textChannel = message.guild.channels.cache.get(group.textChannel);
      if (textChannel) {
        await textChannel.delete().catch(console.error);
      }
    }


    if (group.voiceChannel) {
      const voiceChannel = message.guild.channels.cache.get(group.voiceChannel);
      if (voiceChannel) {
        await voiceChannel.delete().catch(console.error);
      }
    }

    if (group.role) {
      const role = message.guild.roles.cache.get(group.role);
      if (role) {
        await role.delete().catch(console.error);
      }
    }

    delete groups[groupName];
    fs.writeFileSync("./groups.json", JSON.stringify(groups, null, 4));

    const embed = new MessageEmbed()
      .setThumbnail(logoURL)
      .setColor("#5c5e64")
      .setTitle("تم حذف القروب")
      .setDescription(`**تم حذف القروب ${groupName} بنجاح.**`);

    message.reply({ embeds: [embed], files: [logoFile()] });

    const logChannel = client.channels.cache.get(settings.logChannel);
    if (logChannel) {
      const logEmbed = new MessageEmbed()
        .setColor("#5c5e64")
        .setTitle("حذف قروب")
        .setDescription(`**
اسم القروب: ${groupName}
بواسطة : <@${message.author.id}>
         ** `)
         .setThumbnail(logoURL);
      logChannel.send({ embeds: [logEmbed], files: [logoFile()] });
    }
  }
};
