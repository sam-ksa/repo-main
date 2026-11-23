const { logoURL, logoFile } = require('../../utils/logo');
const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
    name: 'managers',
    run: async (client, message, args) => {
        const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
        const groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));
        const settings = JSON.parse(fs.readFileSync("./settings.json", "utf8"));
        if (!config.owners.includes(message.author.id) ) {
          return 
        }
    

        if (!groups.managers || groups.managers.length === 0) {
            return message.reply("**لا يوجد مسؤول مضاف حاليًا.**");
        }

        const managerList = groups.managers.map((managerId, index) => `**${index + 1}.** <@${managerId}>`).join("\n");

        const embed = new MessageEmbed()
            .setTitle("قائمة المسؤولين")
            .setThumbnail(logoURL)
            .setColor("#5c5e64")
            .setDescription(`${managerList}`)


        return message.reply({ embeds: [embed], files: [logoFile()] });
    }
};
