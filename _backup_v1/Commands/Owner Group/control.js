const { logoURL, logoFile } = require('../../utils/logo');
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'control',
  aliases: ['تحكم'], 
  folder: 'Owner Group', 
  run: async (client, message, args) => {
    try {
      let groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));

      const userGroupEntry = Object.entries(groups).find(([groupName, group]) => group.members && group.members.includes(message.author.id));

      if (!userGroupEntry) {
        return 
      }

      const [groupName, group] = userGroupEntry;

      if (group.leader !== message.author.id ) {
        return 
      
    }


    if (message.channel.id !== group.textChannel) {
      return 
    }

      const row = new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId('controlMenu')
            .setPlaceholder('يرجى تحديد نوع الإجراء...')
            .addOptions([
              { label: 'اسم القروب', value: 'changeName' },
              { label: 'اختفاء الروم الصوتي', value: 'hideVoice'  },
              { label: 'اظهار الروم الصوتي', value: 'showVoice' },
              { label: 'قفل الروم الصوتي', value: 'lockVoice' },
              { label: 'فتح الروم الصوتي', value: 'unlockVoice' },
              { label: 'تعديل حد الغرفة', value: 'editLimit' },
            ]),
        );

      const embed = new MessageEmbed()
        .setColor("#5c5e64")
        .setTitle("Group Settings")
        .setThumbnail(logoURL)
        .setDescription(`${groupName} : القروب`);

      const controlMessage = await message.reply({ embeds: [embed], files: [logoFile()], components: [row] });

      const filter = i => i.user.id === message.author.id;
      const collector = controlMessage.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async i => {
        if (i.customId === 'controlMenu') {
          const selectedOption = i.values[0];
          await i.deferUpdate();

          switch (selectedOption) {
            case 'changeName':
              await changeGroupName(client, message, group, groupName, groups);
              break;
            case 'hideVoice':
              await hideVoiceChannel(client, message, group);
              break;
            case 'showVoice':
              await showVoiceChannel(client, message, group);
              break;
            case 'lockVoice':
              await lockVoiceChannel(client, message, group);
              break;
            case 'unlockVoice':
              await unlockVoiceChannel(client, message, group);
              break;
            case 'editLimit':
              await editRoomLimit(client, message, group, groups);
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
      console.error(`Error executing 'control' command: ${error.message}`);
      message.reply("**حدث خطأ أثناء محاولة تنفيذ الأمر.**");
    }
  }
};

async function changeGroupName(client, message, group, oldGroupName, groups) {
  const filter = response => response.author.id === message.author.id;

  await message.reply("**يرجى كتابة اسم القروب الجديد:**");
  const collected = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] }).catch(() => {
    return message.reply("**انتهى وقت الإدخال.**");
  });

  if (!collected) return;

  const newName = collected.first().content.trim();

  groups[newName] = { ...group, name: newName };
  delete groups[oldGroupName];

  const groupRole = message.guild.roles.cache.get(group.role);
  if (groupRole) await groupRole.setName(newName);

  const textChannel = message.guild.channels.cache.get(group.textChannel);
  if (textChannel) await textChannel.setName(newName);

  const voiceChannel = message.guild.channels.cache.get(group.voiceChannel);
  if (voiceChannel) await voiceChannel.setName(newName);

  fs.writeFileSync("./groups.json", JSON.stringify(groups, null, 4));

  await message.reply(`**تم تغيير اسم القروب إلى ${newName}.**`);
}

async function hideVoiceChannel(client, message, group) {
  const voiceChannel = message.guild.channels.cache.get(group.voiceChannel);
  if (!voiceChannel) return message.reply("**لم يتم العثور على الروم الصوتي.**");

  await voiceChannel.permissionOverwrites.edit(message.guild.id, { VIEW_CHANNEL: false });
  message.reply("**تم إخفاء الروم الصوتي.**");
}

async function showVoiceChannel(client, message, group) {
  const voiceChannel = message.guild.channels.cache.get(group.voiceChannel);
  if (!voiceChannel) return message.reply("**لم يتم العثور على الروم الصوتي.**");

  await voiceChannel.permissionOverwrites.edit(message.guild.id, { VIEW_CHANNEL: true });
  message.reply("**تم إظهار الروم الصوتي.**");
}

async function lockVoiceChannel(client, message, group) {
  const voiceChannel = message.guild.channels.cache.get(group.voiceChannel);
  if (!voiceChannel) return message.reply("**لم يتم العثور على الروم الصوتي.**");

  await voiceChannel.permissionOverwrites.edit(message.guild.id, { CONNECT: false });
  message.reply("**تم قفل الروم الصوتي.**");
}

async function unlockVoiceChannel(client, message, group) {
  const voiceChannel = message.guild.channels.cache.get(group.voiceChannel);
  if (!voiceChannel) return message.reply("**لم يتم العثور على الروم الصوتي.**");

  await voiceChannel.permissionOverwrites.edit(message.guild.id, { CONNECT: true });
  message.reply("**تم فتح الروم الصوتي.**");
}

async function editRoomLimit(client, message, group, groups) {
  const filter = response => response.author.id === message.author.id;

  await message.reply("**يرجى كتابة حد الروم الجديد:**");
  const collected = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] }).catch(() => {
    return message.reply("**انتهى وقت الإدخال.**");
  });

  if (!collected) return;

  const newLimit = parseInt(collected.first().content.trim(), 10);
  if (isNaN(newLimit)) return message.reply("**الحد الجديد غير صالح.**");

  const voiceChannel = message.guild.channels.cache.get(group.voiceChannel);
  if (!voiceChannel) return message.reply("**لم يتم العثور على الروم الصوتي.**");

  await voiceChannel.setUserLimit(newLimit);
  group.limit = newLimit;

  fs.writeFileSync("./groups.json", JSON.stringify(groups, null, 4));

  message.reply(`**تم تعديل حد الروم الصوتي إلى ${newLimit}.**`);
}
