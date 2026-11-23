const { logoURL, logoFile } = require('../../utils/logo');
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'punish',
  aliases: ['عقوبه','عقوبة'], 
  folder: 'Owner Group', 
  run: async (client, message, args) => {
    try {
      let groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));

      const userGroupEntry = Object.entries(groups).find(([groupName, group]) => group.members && group.members.includes(message.author.id));

      if (!userGroupEntry) {
        return
      }

      const [groupName, group] = userGroupEntry;

      if (group.leader !== message.author.id && !(group.admins && group.admins.includes(message.author.id))) {
        return 
      }
      if (message.channel.id !== group.textChannel) {
        return 
      }

      const row = new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId('punishMenu')
            .setPlaceholder('يرجى تحديد نوع الإجراء...')
            .addOptions([
              { label: 'اختفاء الروم عن شخص', value: 'hideVoice' },
              { label: 'اظهار الروم عن شخص', value: 'showVoice' },
              { label: 'قفل الروم عن شخص', value: 'lockVoice' },
              { label: 'فتح الروم عن شخص', value: 'unlockVoice' },
              { label: 'اعطاء ميوت لشخص', value: 'muteUser' },
              { label: 'فك ميوت عن شخص', value: 'unmuteUser' },
              { label: 'طرد شخص من الروم', value: 'kickUser' },
            ]),
        );

      const embed = new MessageEmbed()
        .setColor("#5c5e64")
        .setTitle("Group Settings")
        .setThumbnail(logoURL)
        .setDescription(`القروب: ${groupName}`);

      const controlMessage = await message.reply({ embeds: [embed], files: [logoFile()], components: [row] });

      const filter = i => i.user.id === message.author.id;
      const collector = controlMessage.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async i => {
        if (i.customId === 'punishMenu') {
          const selectedOption = i.values[0];
          await i.deferUpdate();

          const promptMessage = await message.channel.send("**يرجى كتابة منشن أو ايدي الشخص:**");
          const userFilter = response => response.author.id === message.author.id;
          const collectedUser = await message.channel.awaitMessages({ filter: userFilter, max: 1, time: 60000, errors: ['time'] }).catch(() => {
            return message.reply("**انتهى وقت الإدخال.**");
          });

          if (!collectedUser) return;
          const userId = collectedUser.first().mentions.users.first() ? collectedUser.first().mentions.users.first().id : collectedUser.first().content.trim();
          collectedUser.first().delete();
          promptMessage.delete();

          const member = await message.guild.members.fetch(userId).catch(() => null);
          if (!member) {
            return message.reply("**لم يتم العثور على المستخدم.**");
          }

          switch (selectedOption) {
            case 'hideVoice':
              await hideVoiceChannelForUser(client, message, group, member);
              break;
            case 'showVoice':
              await showVoiceChannelForUser(client, message, group, member);
              break;
            case 'lockVoice':
              await lockVoiceChannelForUser(client, message, group, member);
              break;
            case 'unlockVoice':
              await unlockVoiceChannelForUser(client, message, group, member);
              break;
            case 'muteUser':
              await muteUser(client, message, group, member);
              break;
            case 'unmuteUser':
              await unmuteUser(client, message, group, member);
              break;
            case 'kickUser':
              await kickUser(client, message, group, member);
              break;
          }
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          controlMessage.edit({ components: [] });
        }
      });
    } catch (error) {
      console.error(`Error executing 'punish' command: ${error.message}`);
      message.reply("**حدث خطأ أثناء محاولة تنفيذ الأمر.**");
    }
  }
};

async function hideVoiceChannelForUser(client, message, group, member) {
  const voiceChannel = message.guild.channels.cache.get(group.voiceChannel);
  if (!voiceChannel) return message.reply("**لم يتم العثور على الروم الصوتي.**");

  await voiceChannel.permissionOverwrites.edit(member.id, { VIEW_CHANNEL: false });
  message.reply(`**تم إخفاء الروم الصوتي عن <@${member.id}>.**`);
}

async function showVoiceChannelForUser(client, message, group, member) {
  const voiceChannel = message.guild.channels.cache.get(group.voiceChannel);
  if (!voiceChannel) return message.reply("**لم يتم العثور على الروم الصوتي.**");

  await voiceChannel.permissionOverwrites.edit(member.id, { VIEW_CHANNEL: true });
  message.reply(`**تم إظهار الروم الصوتي لـ <@${member.id}>.**`);
}

async function lockVoiceChannelForUser(client, message, group, member) {
  const voiceChannel = message.guild.channels.cache.get(group.voiceChannel);
  if (!voiceChannel) return message.reply("**لم يتم العثور على الروم الصوتي.**");

  await voiceChannel.permissionOverwrites.edit(member.id, { CONNECT: false });
  message.reply(`**تم قفل الروم الصوتي عن <@${member.id}>.**`);
}

async function unlockVoiceChannelForUser(client, message, group, member) {
  const voiceChannel = message.guild.channels.cache.get(group.voiceChannel);
  if (!voiceChannel) return message.reply("**لم يتم العثور على الروم الصوتي.**");

  await voiceChannel.permissionOverwrites.edit(member.id, { CONNECT: true });
  message.reply(`**تم فتح الروم الصوتي لـ <@${member.id}>.**`);
}

async function muteUser(client, message, group, member) {
  const voiceChannel = message.guild.channels.cache.get(group.voiceChannel);
  if (!voiceChannel) return message.reply("**لم يتم العثور على الروم الصوتي.**");

  await member.voice.setMute(true);
  message.reply(`**تم إعطاء ميوت لـ <@${member.id}>.**`);
}

async function unmuteUser(client, message, group, member) {
  const voiceChannel = message.guild.channels.cache.get(group.voiceChannel);
  if (!voiceChannel) return message.reply("**لم يتم العثور على الروم الصوتي.**");

  await member.voice.setMute(false);
  message.reply(`**تم فك الميوت عن <@${member.id}>.**`);
}

async function kickUser(client, message, group, member) {
  const voiceChannel = message.guild.channels.cache.get(group.voiceChannel);
  if (!voiceChannel) return message.reply("**لم يتم العثور على الروم الصوتي.**");

  if (member.voice.channel && member.voice.channel.id === group.voiceChannel) {
    await member.voice.kick();
    message.reply(`**تم طرد <@${member.id}> من الروم الصوتي.**`);
  } else {
    message.reply("**المستخدم ليس في الروم الصوتي.**");
  }
}
