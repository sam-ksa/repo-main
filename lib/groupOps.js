// عمليات إنشاء وحذف القروبات (رومات + رتبة + بيانات) مع التراجع عند الفشل
const store = require('./store');
const G = require('./groups');
const panel = require('./panel');

const NEEDED = ['MANAGE_CHANNELS', 'MANAGE_ROLES'];

// صلاحيات البوت داخل رومات القروب (فقط اللي يملكها البوت أصلاً، وإلا ديسكورد يرفض)
function botAllow(guild, perms) {
  return perms.filter((p) => guild.me.permissions.has(p));
}

async function createGroup(guild, data, { name, leader, botMember = null, reason }) {
  const s = data.settings;
  const voiceCat = guild.channels.cache.get(s.categories.voice);
  const textCat = guild.channels.cache.get(s.categories.text);
  if (!voiceCat || !textCat) throw Object.assign(new Error('categories'), { userMessage: 'كاتقوري القروبات المحفوظة انحذفت. حددها من جديد بـ `setgroup` أو `setup`.' });

  const created = [];
  try {
    const role = await guild.roles.create({ name, permissions: [], mentionable: false, reason });
    created.push(role);

    const me = guild.me.id;
    const textChannel = await guild.channels.create(name, {
      type: 'GUILD_TEXT',
      parent: textCat.id,
      reason,
      permissionOverwrites: [
        { id: guild.id, deny: ['VIEW_CHANNEL'] },
        { id: role.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'] },
        { id: me, allow: botAllow(guild, ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MANAGE_CHANNELS', 'MANAGE_MESSAGES']) },
      ],
    });
    created.push(textChannel);

    const voiceChannel = await guild.channels.create(name, {
      type: 'GUILD_VOICE',
      parent: voiceCat.id,
      reason,
      permissionOverwrites: [
        { id: guild.id, deny: ['CONNECT'] },
        { id: role.id, allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK'] },
        { id: me, allow: botAllow(guild, ['VIEW_CHANNEL', 'CONNECT', 'MANAGE_CHANNELS', 'MOVE_MEMBERS', 'MUTE_MEMBERS']) },
      ],
    });
    created.push(voiceChannel);

    await leader.roles.add(role, reason).catch(() => {});
    if (s.leadersRole) await leader.roles.add(s.leadersRole, reason).catch(() => {});

    if (botMember) {
      await botMember.setNickname(name.slice(0, 32), reason).catch(() => {});
      if (botMember.voice.channel) await botMember.voice.setChannel(voiceChannel).catch(() => {});
    }

    const id = G.newId();
    const group = {
      id,
      name,
      leader: leader.id,
      members: [leader.id],
      admins: [],
      voiceChannel: voiceChannel.id,
      textChannel: textChannel.id,
      role: role.id,
      points: 0,
      voiceMinutes: 0,
      bot: botMember ? botMember.id : null,
      createdAt: Date.now(),
    };
    data.groups[id] = group;
    store.save(guild.id);
    panel.schedule(guild, 3000);
    return group;
  } catch (e) {
    for (const x of created.reverse()) await x.delete('فشل إنشاء القروب').catch(() => {});
    throw e;
  }
}

async function deleteGroup(guild, data, group, reason) {
  const s = data.settings;
  if (s.leadersRole) {
    const leader = await guild.members.fetch(group.leader).catch(() => null);
    if (leader) await leader.roles.remove(s.leadersRole, reason).catch(() => {});
  }
  for (const id of [group.textChannel, group.voiceChannel]) {
    const ch = id && guild.channels.cache.get(id);
    if (ch) await ch.delete(reason).catch(() => {});
  }
  const role = group.role && guild.roles.cache.get(group.role);
  if (role) await role.delete(reason).catch(() => {});
  if (group.image) require('./panelStyle').removeFile(group.image);
  delete data.groups[group.id];
  store.save(guild.id);
  panel.schedule(guild, 3000);
}

async function renameGroup(guild, group, newName, reason) {
  const role = group.role && guild.roles.cache.get(group.role);
  if (role) await role.setName(newName, reason).catch(() => {});
  for (const id of [group.textChannel, group.voiceChannel]) {
    const ch = id && guild.channels.cache.get(id);
    if (ch) await ch.setName(newName, reason).catch(() => {});
  }
  group.name = newName;
  store.save(guild.id);
  panel.schedule(guild, 3000);
}

// يضيف/يشيل عضو من القروب مع الرتبة
async function addMember(guild, group, member, reason) {
  if (!group.members.includes(member.id)) group.members.push(member.id);
  if (group.role) await member.roles.add(group.role, reason).catch(() => {});
  store.save(guild.id);
  panel.schedule(guild);
}

async function removeMember(guild, group, member, reason) {
  group.members = group.members.filter((id) => id !== member.id);
  group.admins = group.admins.filter((id) => id !== member.id);
  if (group.role) await member.roles.remove(group.role, reason).catch(() => {});
  store.save(guild.id);
  panel.schedule(guild);
}

module.exports = { NEEDED, createGroup, deleteGroup, renameGroup, addMember, removeMember };
