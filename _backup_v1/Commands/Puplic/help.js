const { logoURL, logoFile } = require('../../utils/logo');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const config = require('../../config.json');
module.exports = {
  name: 'help',
  run: async (client, message, args) => {
    const helpEmbed = new MessageEmbed()
      .setColor('#5c5e64')
      .setDescription(`**${config.prefix}create : إنشاء قروب
${config.prefix}delete : حذف قروب
${config.prefix}addpoint  : اضافة نقاط
${config.prefix}removepoint : حذف نقاط
${config.prefix}info : معلومات قروب
${config.prefix}check : أعضاء قروب
${config.prefix}top : توب نقاط القروبات
${config.prefix}topg : ارسال توب القروبات يتحدث تلقائيا
${config.prefix}list: عرض جميع القروبات
${config.prefix}reset : تصفير نقاط القروب
${config.prefix}setmanager : إضافة أو إزالة مسؤول قروب
${config.prefix}managers : قائمة المسؤولين
${config.prefix}setgroup : تحديد كاتوقري القروبات
${config.prefix}setlog : تحديد لوق القروبات
${config.prefix}setlrole : تحديد رول ليدر القروبات
${config.prefix}addpoint : اضافة نقاط للقروب
${config.prefix}removepoint : ازالة نقاط من القروب
${config.prefix}vip : أوامر ألاونر
${config.prefix}setowner : إضافة اونر للبوت
${config.prefix}removeowner : ازالة اونر من البوت
${config.prefix}setprefix : تغيير بادئه البوت
${config.prefix}owners : عرض قائمة الاونرات
 **`)
      .setThumbnail(logoURL)
      .setFooter({ text: 'Panel Tek', iconURL: logoURL });
      

    const supportRow = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setLabel('Support')
          .setStyle('LINK')
          .setURL('https://discord.gg/Ov') // Replace with your support link
      );

    message.channel.send({ embeds: [helpEmbed], files: [logoFile()], components: [supportRow] });
  },
};
