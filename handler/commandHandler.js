// معالج الأوامر: بادئة لكل سيرفر + منشن البوت كبادئة + صلاحيات + كولداون
const fs = require('fs');
const path = require('path');
const Data = require('pro.db');
const store = require('../lib/store');
const perms = require('../lib/perms');

const COOLDOWN_MS = 3000;
const NO_PREFIX_FOLDER = 'Owner Group';

function loadCommands(client) {
  const base = path.join(__dirname, '..', 'Commands');
  for (const folder of fs.readdirSync(base)) {
    const dir = path.join(base, folder);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
      const command = require(path.join(dir, file));
      if (!command || !command.name || typeof command.run !== 'function') continue;
      command.folder = command.folder || folder;
      command.aliases = command.aliases || [];
      // الاختصارات المضافة بأمر addalias
      const saved = Data.get(`aliases_${command.name}`);
      if (Array.isArray(saved)) command.aliases = [...new Set([...command.aliases, ...saved])];
      client.commands.set(command.name, command);
    }
  }
}

const findCommand = (client, name) =>
  client.commands.get(name) || client.commands.find((c) => c.aliases.includes(name));

module.exports = (client) => {
  loadCommands(client);
  const cooldowns = new Map();
  let mentionRe = null;

  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild || !message.member) return;
    // حماية: إذا انمسح التوكن من الكلاينت لأي سبب، نرجعه من config.json عشان يقدر البوت يرد
    if (!client.token && client.config.token) client.token = client.config.token;

    const data = store.get(message.guild.id);
    const prefix = data.settings.prefix ?? client.config.prefix ?? '+';
    const content = message.content.trim();
    mentionRe ||= new RegExp(`^<@!?${client.user.id}>\\s*`); // يتبني مرة وحدة بدل كل رسالة
    const mention = content.match(mentionRe);

    let used = null;
    if (prefix && content.startsWith(prefix)) used = prefix;
    else if (mention) used = mention[0];

    const body = used ? content.slice(used.length).trim() : content;
    const args = body.split(/\s+/).filter(Boolean);
    const name = (args.shift() || '').toLowerCase();

    if (!name) {
      if (mention) message.reply(`**البادئة في هذا السيرفر: \`${prefix}\`\nاكتب \`${prefix}help\` لعرض الأوامر.**`).catch(() => {});
      return;
    }

    const command = findCommand(client, name);
    if (!command) return;
    // أوامر أونر القروب تشتغل بدون بادئة، الباقي لازم بادئة أو منشن
    if (!used && command.folder !== NO_PREFIX_FOLDER) return;

    const level = perms.levelOf(client, message.member, data);
    if (!perms.atLeast(level, command.level)) {
      if (used && command.level !== 'owner') {
        message.reply('**ليس لديك صلاحية لاستخدام هذا الأمر.**').catch(() => {});
      }
      return;
    }

    const key = `${message.author.id}:${command.name}`;
    const until = cooldowns.get(key) || 0;
    if (Date.now() < until) return;
    cooldowns.set(key, Date.now() + COOLDOWN_MS);
    setTimeout(() => cooldowns.delete(key), COOLDOWN_MS);

    try {
      await command.run(client, message, args, { data, prefix, level, invoked: name });
    } catch (error) {
      if (error.userMessage) {
        message.reply(`**${error.userMessage}**`).catch(() => {});
      } else if (error.code === 50013) {
        message.reply('**البوت ما عنده صلاحية كافية لتنفيذ هذا الأمر. تأكد إن رتبة البوت فوق رتب القروبات وعندها صلاحيات الإدارة.**').catch(() => {});
      } else {
        console.error(`[command:${command.name}]`, error);
        message.reply('**حدث خطأ أثناء تنفيذ الأمر.**').catch(() => {});
      }
    }
  });
};
