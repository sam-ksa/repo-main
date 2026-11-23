const emojis = require('../../lib/emojis');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const ui = require('../../lib/ui');
const perms = require('../../lib/perms');
const { groupCtx } = require('../../lib/groupCtx');

const OPTIONS = [
  { label: 'إخفاء الروم عن شخص', value: 'hide' },
  { label: 'إظهار الروم لشخص', value: 'show' },
  { label: 'قفل الروم عن شخص', value: 'lock' },
  { label: 'فتح الروم لشخص', value: 'unlock' },
  { label: 'ميوت (داخل روم القروب)', value: 'mute' },
  { label: 'فك الميوت', value: 'unmute' },
  { label: 'طرد من روم القروب', value: 'kick' },
];

module.exports = {
  name: 'punish',
  aliases: ['عقوبه', 'عقوبة'],
  level: 'public',
  groupRole: 'admin',
  description: 'عقوبات على روم القروب الصوتي (إخفاء، قفل، ميوت، طرد)',
  usage: 'عقوبة',
  async run(client, message, args, { data }) {
    const ctx = groupCtx(client, message, data, 'admin');
    if (!ctx) return;
    const { group } = ctx;

    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu().setCustomId('group:punish').setPlaceholder('اختر العقوبة...').addOptions(OPTIONS.map((o) => emojis.option(o, `menu:${o.value}`))),
    );
    const e = ui.embed(data).setTitle('عقوبات القروب').setDescription(`**القروب: ${group.name}**`);
    const panelMsg = await message.reply(ui.withLogo({ embeds: [e], components: [row] }, await ui.iconFor(e, 'punish'), { support: false }));

    const col = panelMsg.createMessageComponentCollector({ filter: (i) => i.user.id === message.author.id, time: 120000 });
    col.on('collect', async (i) => {
      await i.deferUpdate();
      const action = i.values[0];
      const ans = await ui.ask(message, '**منشن الشخص أو اكتب الايدي:**');
      if (!ans) return;
      const member = await ui.resolveMember(message.guild, ans);
      ans.delete().catch(() => {});
      if (!member) return message.reply('**لم يتم العثور على العضو.**');

      // حماية: ما تعاقب نفسك، أونر القروب، أو إدارة السيرفر
      if (member.id === message.author.id || member.id === group.leader
        || perms.isManager(client, member, data) || member.user.bot) {
        return message.reply('**ما تقدر تعاقب هذا الشخص.**');
      }

      const vc = group.voiceChannel && message.guild.channels.cache.get(group.voiceChannel);
      if (!vc) return message.reply('**الروم الصوتي غير موجود.**');
      const inRoom = member.voice.channelId === vc.id;

      try {
        switch (action) {
          case 'hide':
            await vc.permissionOverwrites.edit(member.id, { VIEW_CHANNEL: false, CONNECT: false });
            if (inRoom) await member.voice.disconnect().catch(() => {});
            return message.reply(`**تم إخفاء الروم عن ${member}.**`);
          case 'show':
            await vc.permissionOverwrites.edit(member.id, { VIEW_CHANNEL: null, CONNECT: null });
            return message.reply(`**تم إظهار الروم لـ ${member}.**`);
          case 'lock':
            await vc.permissionOverwrites.edit(member.id, { CONNECT: false });
            if (inRoom) await member.voice.disconnect().catch(() => {});
            return message.reply(`**تم قفل الروم عن ${member}.**`);
          case 'unlock':
            await vc.permissionOverwrites.edit(member.id, { CONNECT: null });
            return message.reply(`**تم فتح الروم لـ ${member}.**`);
          case 'mute':
            // ميوت داخل روم القروب فقط (بالصلاحيات، ما يأثر على باقي السيرفر)
            await vc.permissionOverwrites.edit(member.id, { SPEAK: false });
            if (inRoom) await member.voice.setChannel(vc).catch(() => {});
            return message.reply(`**تم إعطاء ${member} ميوت في روم القروب.**`);
          case 'unmute':
            await vc.permissionOverwrites.edit(member.id, { SPEAK: null });
            if (inRoom) await member.voice.setChannel(vc).catch(() => {});
            return message.reply(`**تم فك الميوت عن ${member}.**`);
          case 'kick':
            if (!inRoom) return message.reply('**الشخص مو موجود في روم القروب.**');
            await member.voice.disconnect();
            return message.reply(`**تم طرد ${member} من روم القروب.**`);
        }
      } catch (e) {
        message.reply(e.code === 50013 ? '**البوت ما عنده صلاحية كافية.**' : '**حدث خطأ.**').catch(() => {});
      }
    });
    col.on('end', () => panelMsg.edit({ components: [] }).catch(() => {}));
  },
};
