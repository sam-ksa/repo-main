const emojis = require('../../lib/emojis');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const G = require('../../lib/groups');
const ui = require('../../lib/ui');
const store = require('../../lib/store');
const ops = require('../../lib/groupOps');
const { groupCtx } = require('../../lib/groupCtx');

const OPTIONS = [
  { label: 'تغيير اسم القروب', value: 'rename' },
  { label: 'إخفاء الروم الصوتي', value: 'hide' },
  { label: 'إظهار الروم الصوتي', value: 'show' },
  { label: 'قفل الروم الصوتي', value: 'lock' },
  { label: 'فتح الروم الصوتي', value: 'unlock' },
  { label: 'تعديل حد الروم الصوتي', value: 'limit' },
];

module.exports = {
  name: 'control',
  aliases: ['تحكم'],
  level: 'public',
  groupRole: 'leader',
  description: 'لوحة تحكم القروب (الاسم، إخفاء/قفل الفويس، الحد)',
  usage: 'تحكم',
  async run(client, message, args, { data }) {
    const ctx = groupCtx(client, message, data, 'leader');
    if (!ctx) return;
    const { group } = ctx;

    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu().setCustomId('group:control').setPlaceholder('اختر الإجراء...').addOptions(OPTIONS.map((o) => emojis.option(o, `menu:${o.value}`))),
    );
    const e = ui.embed(data).setTitle('التحكم بالقروب').setDescription(`**القروب: ${group.name}**`);
    const panelMsg = await message.reply(ui.withLogo({ embeds: [e], components: [row] }, await ui.iconFor(e, 'control'), { support: false }));

    const col = panelMsg.createMessageComponentCollector({ filter: (i) => i.user.id === message.author.id, time: 120000 });
    col.on('collect', async (i) => {
      await i.deferUpdate();
      const vc = group.voiceChannel && message.guild.channels.cache.get(group.voiceChannel);
      const everyone = message.guild.id;
      try {
        switch (i.values[0]) {
          case 'rename': {
            const ans = await ui.ask(message, '**اكتب اسم القروب الجديد:**');
            if (!ans) return;
            const name = ans.content.trim();
            if (name.length < 2 || name.length > 32) return message.reply('**الاسم لازم يكون بين 2 و 32 حرف.**');
            const same = G.findByName(data, name);
            if (same && same.id !== group.id) return message.reply('**فيه قروب بنفس الاسم.**');
            const old = group.name;
            await ops.renameGroup(message.guild, group, name, `تغيير اسم بواسطة ${message.author.tag}`);
            message.reply(`**تم تغيير اسم القروب إلى ${name}.**`);
            ui.log(message.guild, data, ui.embed(data).setTitle('تغيير اسم قروب').setDescription(`**من: ${old}\nإلى: ${name}\nبواسطة: ${message.author}**`));
            return;
          }
          case 'limit': {
            if (!vc) return message.reply('**الروم الصوتي غير موجود.**');
            const ans = await ui.ask(message, '**اكتب الحد الجديد (0 = بدون حد، أقصى 99):**');
            if (!ans) return;
            const n = parseInt(ans.content, 10);
            if (!Number.isFinite(n) || n < 0 || n > 99) return message.reply('**رقم غير صالح.**');
            await vc.setUserLimit(n);
            group.limit = n;
            store.save(message.guild.id);
            return message.reply(`**تم تعديل حد الروم إلى ${n || 'بدون حد'}.**`);
          }
          default: {
            if (!vc) return message.reply('**الروم الصوتي غير موجود.**');
            const map = {
              hide: [{ VIEW_CHANNEL: false }, 'تم إخفاء الروم الصوتي.'],
              show: [{ VIEW_CHANNEL: null }, 'تم إظهار الروم الصوتي.'],
              lock: [{ CONNECT: false }, 'تم قفل الروم الصوتي.'],
              unlock: [{ CONNECT: null }, 'تم فتح الروم الصوتي لكل السيرفر.'],
            };
            const [overwrite, text] = map[i.values[0]];
            await vc.permissionOverwrites.edit(everyone, overwrite);
            return message.reply(`**${text}**`);
          }
        }
      } catch (e) {
        message.reply(e.code === 50013 ? '**البوت ما عنده صلاحية على الروم.**' : '**حدث خطأ.**').catch(() => {});
      }
    });
    col.on('end', () => panelMsg.edit({ components: [] }).catch(() => {}));
  },
};
