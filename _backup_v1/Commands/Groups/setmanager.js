const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'setmanager',
  run: async (client, message, args) => {
    const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
    const groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));
    const settings = JSON.parse(fs.readFileSync("./settings.json", "utf8"));
    if (!config.owners.includes(message.author.id)) {
      return 
    }


    const userId = message.mentions.users.size > 0
      ? message.mentions.users.first().id
      : args[0];

    if (!userId) {
        return message.reply("**يرجى ادخال منشن أو الأيدي.**");
    }

    if (!groups.managers) {
      groups.managers = [];
    }

    if (groups.managers.includes(userId)) {
      groups.managers = groups.managers.filter(id => id !== userId);
      message.reply(`**تمت إزالة المسؤول <@${userId}>.**`);
    } else {
      groups.managers.push(userId);
      message.reply(`**تمت إضافة المسؤول <@${userId}>.**`);
    }

    fs.writeFileSync("./groups.json", JSON.stringify(groups, null, 4), "utf8");
  }
};
