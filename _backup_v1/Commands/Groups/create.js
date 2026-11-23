const { logoURL, logoFile } = require('../../utils/logo');
const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'create',
  run: async (client, message, args) => {
    const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
    const groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));
    const settings = JSON.parse(fs.readFileSync("./settings.json", "utf8"));

    if (!config.owners.includes(message.author.id) && !groups.managers.includes(message.author.id)) {
      return;
    }

    // Ensure categories exist in groups
    if (!groups.categories) {
      groups.categories = [];
    }

    const voiceCategory = groups.categories.find(cat => cat.type === 'voice');
    const textCategory = groups.categories.find(cat => cat.type === 'text');

    if (!voiceCategory || !textCategory) {
      return message.reply("**يجب عليك تحديد كاتقوري لكل من الفويس والشات.**");
    }

    const filter = response => response.author.id === message.author.id;

    await message.reply("**يرجى كتابة منشن أو ايدي الاونر الآن ..**");
    const collectedOwnerId = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] }).catch(() => {
      return message.reply("**انتهى وقت الإدخال.**");
    });

    if (!collectedOwnerId || !collectedOwnerId.first()) return;

    const ownerId = collectedOwnerId.first().mentions.members.first() ? collectedOwnerId.first().mentions.members.first().id : collectedOwnerId.first().content.trim();
    const groupLeader = await message.guild.members.fetch(ownerId).catch(() => null);
    if (!groupLeader) return message.reply("**لم يتم العثور على اونر القروب.**");

    await message.reply("**يرجى كتابة اسم القروب الآن ..**");
    const collectedGroupName = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] }).catch(() => {
      return message.reply("**انتهى وقت الإدخال.**");
    });

    if (!collectedGroupName || !collectedGroupName.first()) return;

    const groupName = collectedGroupName.first().content.trim();

    await message.reply("**يرجى ارفاق منشن أو ايدي البوت الآن ..\n في حال عدم الوجود يرجى كتابة none**");
    const collectedBotId = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] }).catch(() => {
      return message.reply("**انتهى وقت الإدخال.**");
    });

    if (!collectedBotId || !collectedBotId.first()) return;

    const botInput = collectedBotId.first().content.trim().toLowerCase();
    const botId = botInput === 'none' ? null : (collectedBotId.first().mentions.members.first() ? collectedBotId.first().mentions.members.first().id : botInput);

    // Check if the owner already has a group
    const existingGroup = Object.values(groups).find(group => group.leader === ownerId);

    if (existingGroup) {
      // Delete the existing group
      const oldGroupName = Object.keys(groups).find(key => groups[key] === existingGroup);
      const textChannel = await message.guild.channels.cache.get(existingGroup.textChannel);
      const voiceChannel = await message.guild.channels.cache.get(existingGroup.voiceChannel);
      const groupRole = await message.guild.roles.cache.get(existingGroup.role);

      if (textChannel) await textChannel.delete();
      if (voiceChannel) await voiceChannel.delete();
      if (groupRole) await groupRole.delete();

      delete groups[oldGroupName];

      fs.writeFileSync("./groups.json", JSON.stringify(groups, null, 4));
    }

    const category = message.guild.channels.cache.get(textCategory.id);
    if (!category) return message.reply("**لم يتم العثور على الكاتجوري**");

    const groupRole = await message.guild.roles.create({
      name: groupName,
      color: '#000000',
      permissions: []
    });

    await groupLeader.roles.add(groupRole);

    const textChannel = await message.guild.channels.create(groupName, {
      type: 'GUILD_TEXT',
      parent: category.id,
      permissionOverwrites: [
        {
          id: message.guild.id,
          deny: ['VIEW_CHANNEL']
        },
        {
          id: groupRole.id,
          allow: ['VIEW_CHANNEL']
        },
        {
          id: groupLeader.id,
          allow: ['MANAGE_CHANNELS', 'MANAGE_ROLES']
        }
      ]
    });

    const voiceChannel = await message.guild.channels.create(groupName, {
      type: 'GUILD_VOICE',
      parent: voiceCategory.id,
      permissionOverwrites: [
        {
          id: message.guild.id,
          deny: ['CONNECT']
        },
        {
          id: groupRole.id,
          allow: ['VIEW_CHANNEL', 'CONNECT']
        },
        {
          id: groupLeader.id,
          allow: ['MANAGE_CHANNELS', 'MANAGE_ROLES']
        }
      ]
    });

    if (botId) {
      const botMember = await message.guild.members.fetch(botId).catch(() => null);
      if (botMember) {
        if (botMember.voice.channel) {
          await botMember.voice.setChannel(voiceChannel.id).catch(console.error);
        }
        await botMember.setNickname(groupName).catch(console.error);
      }
    }

    groups[groupName] = {
      leader: groupLeader.id,
      members: [groupLeader.id],
      admins: [],
      voiceChannel: voiceChannel.id,
      textChannel: textChannel.id,
      category: textCategory.id,
      role: groupRole.id,
      points: 0,
      pointsSystem: false,
      locked: false,
      muted: [],
      allowed: [],
      limit: 10,
      bot: botId || 'none'
    };

    fs.writeFileSync("./groups.json", JSON.stringify(groups, null, 4));

    if (groups.leadersRole) {
      const leadersRole = message.guild.roles.cache.get(groups.leadersRole);
      if (leadersRole) {
        await groupLeader.roles.add(leadersRole).catch(console.error);
      }
    }

    const responseMessage = `**تم إنشاء القروب**`;

    message.reply(responseMessage);

    const logChannel = client.channels.cache.get(settings.logChannel);
    if (logChannel) {
      const logEmbed = new MessageEmbed()
        .setColor("#5c5e64")
        .setTitle("إنشاء قروب")
        .setDescription(`
        **اسم القروب : ${groupName}
        اونر القروب : <@${ownerId}>
        شات القروب : <#${textChannel.id}>
        روم الفويس : <#${voiceChannel.id}>
        كاتغوري القروب : ${category.name}**
        `)
        .setThumbnail(logoURL);
      logChannel.send({ embeds: [logEmbed], files: [logoFile()] });
    }

    collectedOwnerId.first().delete();
    collectedGroupName.first().delete();
    collectedBotId.first().delete();
    message.react('✅');
  }
};
