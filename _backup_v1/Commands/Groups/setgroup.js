const { logoURL, logoFile } = require('../../utils/logo');
const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
    name: 'setgroup',
    run: async (client, message, args) => {
        const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
        const groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));
        const settings = JSON.parse(fs.readFileSync("./settings.json", "utf8"));
        if (!config.owners.includes(message.author.id) && !groups.managers.includes(message.author.id)) {
            return message.reply("ليس لديك الصلاحية لاستخدام هذا الأمر.");
        }

        const categoryId = args[0];
        if (!categoryId) return message.reply("**يرجى ارفاق ايدي الكاتوقري.**");

        const typeEmbed = new MessageEmbed()
            .setColor("#5c5e64")
            .setDescription(`
        **1- كاتوقري الفويس**
        **2- كاتوقري الشات**
            `)
            .setThumbnail(logoURL);

        const promptMessage = await message.channel.send({ embeds: [typeEmbed], files: [logoFile()] });

        const filter = response => {
            return response.author.id === message.author.id && (response.content === '1' || response.content === '2');
        };

        const collectedType = await message.channel.awaitMessages({ filter, max: 1, time: 180000, errors: ['time'] }).catch(() => {
            return message.reply("**أنتهى وقت الإدخال.**");
        });

        if (!collectedType) return;

        const categoryTypeInput = collectedType.first().content;
        const categoryType = categoryTypeInput === '1' ? 'voice' : 'text';
        
        groups.categories = groups.categories || [];

        const existingCategoryIndex = groups.categories.findIndex(category => category.type === categoryType);

        if (existingCategoryIndex !== -1) {
            groups.categories[existingCategoryIndex] = { id: categoryId, type: categoryType };
        } else {
            groups.categories.push({ id: categoryId, type: categoryType });
        }

        fs.writeFileSync("./groups.json", JSON.stringify(groups, null, 4));

        const logChannel = client.channels.cache.get(settings.logChannel);
        if (logChannel) {
            const logEmbed = new MessageEmbed()
                .setColor("#5c5e64")
                .setThumbnail(logoURL)
                .setTitle("حفظ كاتقوري جديدة")
                .setDescription(`
                **أي دي : ${categoryId}
                نوع: ${categoryType === 'voice' ? 'صوتي' : 'كتابي'}**`);
            logChannel.send({ embeds: [logEmbed], files: [logoFile()] });
        }

        collectedType.first().delete();
        promptMessage.delete();
        message.react('✅');
    }
};