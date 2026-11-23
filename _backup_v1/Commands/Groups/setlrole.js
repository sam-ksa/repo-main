const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'setlrole',
  run: async (client, message, args) => {
    const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
    const groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));
    const settings = JSON.parse(fs.readFileSync("./settings.json", "utf8"));
    if (!config.owners.includes(message.author.id) && !groups.managers.includes(message.author.id)) {
      return 
    }


    if (!args[0]) {
      return message.reply("**يرجى تحديد دور صالح عن طريق الإشارة إليه أو كتابة معرفه.**");
    }

    let role;
    if (message.mentions.roles.size > 0) {
      role = message.mentions.roles.first();
    } else if (args[0]) {
      role = message.guild.roles.cache.get(args[0]);
    }

    if (!role) {
      return message.reply("**لم يتم العثور على الرول.**");
    }

    try {
      let groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));
      groups.leadersRole = role.id;

      fs.writeFileSync("./groups.json", JSON.stringify(groups, null, 4), "utf8");

      message.reply(`**تم تعيين الرول <@&${role.id}> رول ليدر القروبات.**`);
    } catch (error) {
      console.error(error);
      message.reply("**حدث خطأ أثناء تحديث ملف القروب.**");
    }
  }
};
