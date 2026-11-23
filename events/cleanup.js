// تنظيف البيانات إذا انحذف روم أو رتبة قروب يدوياً
const store = require('../lib/store');

function onChannelDelete(channel) {
  if (!channel.guild || !store.exists(channel.guild.id)) return;
  const data = store.get(channel.guild.id);
  let changed = false;
  for (const g of Object.values(data.groups)) {
    if (g.textChannel === channel.id) { g.textChannel = null; changed = true; }
    if (g.voiceChannel === channel.id) { g.voiceChannel = null; changed = true; }
  }
  const s = data.settings;
  if (s.logChannel === channel.id) { s.logChannel = null; changed = true; }
  if (s.panel.channelId === channel.id) { s.panel = { ...s.panel, channelId: null, messageId: null }; changed = true; }
  for (const t of ['voice', 'text']) if (s.categories[t] === channel.id) { s.categories[t] = null; changed = true; }
  if (changed) store.save(channel.guild.id);
}

function onRoleDelete(role) {
  if (!store.exists(role.guild.id)) return;
  const data = store.get(role.guild.id);
  let changed = false;
  for (const g of Object.values(data.groups)) if (g.role === role.id) { g.role = null; changed = true; }
  const s = data.settings;
  if (s.leadersRole === role.id) { s.leadersRole = null; changed = true; }
  if (s.managerRole === role.id) { s.managerRole = null; changed = true; }
  if (changed) store.save(role.guild.id);
}

function onMessageDelete(message) {
  if (!message.guild || !store.exists(message.guild.id)) return;
  const data = store.get(message.guild.id);
  if (data.settings.panel.messageId === message.id) {
    data.settings.panel = { ...data.settings.panel, channelId: null, messageId: null };
    store.save(message.guild.id);
  }
}

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    client.on('channelDelete', onChannelDelete);
    client.on('roleDelete', onRoleDelete);
    client.on('messageDelete', onMessageDelete);
  },
};
