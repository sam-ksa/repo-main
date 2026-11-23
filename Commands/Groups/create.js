const G = require('../../lib/groups');
const ui = require('../../lib/ui');
const ops = require('../../lib/groupOps');
const perms = require('../../lib/perms');

module.exports = {
  name: 'create',
  aliases: ['انشاء'],
  level: 'manager',
  description: 'إنشاء قروب جديد (رتبة + روم كتابي + روم صوتي)',
  usage: 'create [@الأونر] [اسم القروب]',
  async run(client, message, args, { data, prefix }) {
    const s = data.settings;
    if (!s.categories.voice || !s.categories.text) {
      return message.reply(`**لازم تحدد كاتقوري الفويس والشات أول.**\nاكتب \`${prefix}setup\` للإعداد التلقائي، أو \`${prefix}setgroup\` لتحديدها يدوياً.`);
    }
    const missing = perms.missingBotPerms(message.guild, ops.NEEDED);
    if (missing.length) return message.reply(`**البوت يحتاج صلاحيات: ${perms.permList(missing)}**`);

    const interactive = args.length === 0;
    let leader = await ui.resolveMember(message.guild, args.find((a) => /\d{17,20}/.test(a)) || '');
    let name = args.filter((a) => !/^<@!?\d{17,20}>$|^\d{17,20}$/.test(a)).join(' ').trim();

    if (!leader) {
      const ans = await ui.ask(message, '**منشن أو ايدي أونر القروب:**');
      if (!ans) return;
      leader = await ui.resolveMember(message.guild, ans);
      ans.delete().catch(() => {});
    }
    if (!leader) return message.reply('**لم يتم العثور على العضو.**');
    if (leader.user.bot) return message.reply('**ما ينفع يكون الأونر بوت.**');

    const current = G.findByMember(data, leader.id);
    if (current) return message.reply(`**${leader} موجود في قروب ${current.name}. احذفه أو أخرجه منه أول.**`);

    if (!name) {
      const ans = await ui.ask(message, '**اكتب اسم القروب:**');
      if (!ans) return;
      name = ans.content.trim();
      ans.delete().catch(() => {});
    }
    if (name.length < 2 || name.length > 32) return message.reply('**اسم القروب لازم يكون بين 2 و 32 حرف.**');
    if (G.findByName(data, name)) return message.reply('**فيه قروب بنفس الاسم.**');

    let botMember = null;
    if (interactive) {
      const ans = await ui.ask(message, '**منشن أو ايدي بوت القروب (اختياري)، أو اكتب `none`:**');
      if (!ans) return;
      if (ans.content.trim().toLowerCase() !== 'none') {
        botMember = await ui.resolveMember(message.guild, ans);
        if (botMember && !botMember.user.bot) botMember = null;
      }
      ans.delete().catch(() => {});
    }

    const group = await ops.createGroup(message.guild, data, {
      name, leader, botMember, reason: `إنشاء قروب بواسطة ${message.author.tag}`,
    });

    const e = ui.embed(data)
      .setTitle('تم إنشاء القروب')
      .addField('القروب', group.name, true)
      .addField('الأونر', `${leader}`, true)
      .addField('الرتبة', `<@&${group.role}>`, true)
      .addField('الشات', `<#${group.textChannel}>`, true)
      .addField('الفويس', `<#${group.voiceChannel}>`, true);
    await message.reply(ui.withLogo({ embeds: [e] }));

    ui.log(message.guild, data, ui.embed(data).setTitle('إنشاء قروب').setDescription(
      `**القروب: ${group.name}\nالأونر: ${leader}\nالشات: <#${group.textChannel}>\nالفويس: <#${group.voiceChannel}>\nبواسطة: ${message.author}**`,
    ));
  },
};
