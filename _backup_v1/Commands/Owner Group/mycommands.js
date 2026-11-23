const { logoURL, logoFile } = require('../../utils/logo');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const config = require('../../config.json');
const fs = require("fs");

module.exports = {
  name: 'mycommands',
  aliases: ['اوامري'], 
  folder: 'Owner Group', 
  run: async (client, message, args) => {
    let groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));

    const userGroupEntry = Object.entries(groups).find(([groupName, group]) => group.members && group.members.includes(message.author.id));

    if (!userGroupEntry) {
      return 
    }

    const [groupName, group] = userGroupEntry;

    if (message.channel.id !== group.textChannel) {
      return 
    }
    
    const helpEmbed = new MessageEmbed()
      .setColor('#5c5e64')
      .setTitle("اوامر مسؤول القروب")
      .setDescription(`**
تحكم : تعديل القروب
عقوبه : اضافة عقوبه الى شخص
مسح : مسح شات القروب
اعضاء : عرض اعضاء القروب
اضافة : اضافة او ازالة رول القروب
قروبي : معلومات القروب
مسؤول : اضافة او ازالة المسؤول
      **`)
      .setThumbnail(logoURL)



    message.channel.send({ embeds: [helpEmbed], files: [logoFile()] });
  },
};
