const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'add',
  aliases: ['اضافة','اضافه'], 
  folder: 'Owner Group', 
  run: async (client, message, args) => {
    let groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));

    const group = Object.values(groups).find(group => {
        // تحقق من أن group.members معرف ومصفوفة
        return group.members && Array.isArray(group.members) && group.members.includes(message.author.id);
    });
    
    if (!group) {
        return; // إذا لم يتم العثور على المجموعة، يتم الخروج من الدالة
    }

    if (!group.leader === message.author.id && !(group.admins && group.admins.includes(message.author.id))) {
      return 
    }

    if (message.channel.id !== group.textChannel) {
      return 
    }

    const userId = message.mentions.users.first() ? message.mentions.users.first().id : args[0];
    
    if (!userId) {
      return message.reply("**يرجى تحديد معرف المستخدم أو الإشارة إليه.**");
    }

    const member = await message.guild.members.fetch(userId).catch(() => null);

    if (!member) {
      console.log(`Member with ID ${userId} not found.`);
      return message.reply("**لم يتم العثور على المستخدم.**");
    }

    if (!group.members) {
      group.members = {};
    }

    if (group.members.includes(userId)) {
      // Remove member
      group.members = group.members.filter(id => id !== userId);
      fs.writeFileSync("./groups.json", JSON.stringify(groups, null, 4));

      message.reply(`**تمت إزالة <@${userId}> من القروب.**`);

      const role = message.guild.roles.cache.get(group.role);
      if (role) {
        member.roles.remove(role).catch(console.error);
      }
    } else {
      // Add member
      group.members.push(userId);
      fs.writeFileSync("./groups.json", JSON.stringify(groups, null, 4));

      message.reply(`**تمت إضافة <@${userId}> إلى القروب.**`);

      const role = message.guild.roles.cache.get(group.role);
      if (role) {
        member.roles.add(role).catch(console.error);
      }
    }
  }
};
