const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'admin',
  aliases: ['مسؤول'], 
  folder: 'Owner Group', 
  run: async (client, message, args) => {
    if (!args[0]) {
      return message.reply("**يرجى إدخال المنشن أو الأي دي**");
    }

    let groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));

    const group = Object.values(groups).find(group => group.leader === message.author.id);

    if (!group) {
      return; 
    }

    if (message.channel.id !== group.textChannel) {
      return 
    }

    const userId = message.mentions.users.first() ? message.mentions.users.first().id : args[0];

    const member = await message.guild.members.fetch(userId).catch(() => null);

    if (!member) {
      console.log(`Member with ID ${userId} not found.`);
      return message.reply("**لم يتم العثور على المستخدم.**");
    }

    group.admins = group.admins || [];

    if (group.admins.includes(userId)) {
      // Remove admin
      group.admins = group.admins.filter(id => id !== userId);
      fs.writeFileSync("./groups.json", JSON.stringify(groups, null, 4));

      message.reply(`**تمت إزالة <@${userId}> من المسؤولين في القروب.**`);

      const role = message.guild.roles.cache.get(group.role);
      if (role) {
        member.roles.remove(role).catch(console.error);
      }
    } else {
      // Add admin
      group.admins.push(userId);
      fs.writeFileSync("./groups.json", JSON.stringify(groups, null, 4));

      message.reply(`**تمت إضافة <@${userId}> إلى المسؤولين في القروب.**`);

      const role = message.guild.roles.cache.get(group.role);
      if (role) {
        member.roles.add(role).catch(console.error);
      }
    }
  }
};
