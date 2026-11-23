// منطق القروبات: البحث والترتيب والأدوار داخل القروب
const crypto = require('crypto');

const newId = () => crypto.randomBytes(4).toString('hex');
const norm = (s) => String(s || '').trim().toLowerCase();

const all = (data) => Object.values(data.groups);

function ranked(data) {
  return all(data).sort((a, b) => (b.points - a.points) || ((a.createdAt || 0) - (b.createdAt || 0)));
}

function rankOf(data, groupId) {
  return ranked(data).findIndex((g) => g.id === groupId) + 1;
}

const findByName = (data, name) => all(data).find((g) => norm(g.name) === norm(name));
const findByMember = (data, userId) => all(data).find((g) => g.members.includes(userId));
const findByLeader = (data, userId) => all(data).find((g) => g.leader === userId);
const findByChannel = (data, channelId) =>
  all(data).find((g) => g.textChannel === channelId || g.voiceChannel === channelId);
const findByRole = (data, roleId) => all(data).find((g) => g.role === roleId);

// يحدد القروب من: منشن رول / منشن روم / اسم (يقبل مسافات) / الروم الحالي
function resolve(message, data, args) {
  const role = message.mentions.roles.first();
  if (role) return findByRole(data, role.id);
  const ch = message.mentions.channels.first();
  if (ch) return findByChannel(data, ch.id);
  const name = args.join(' ').trim();
  if (name) return findByName(data, name);
  return findByChannel(data, message.channel.id);
}

function roleIn(group, userId) {
  if (!group) return null;
  if (group.leader === userId) return 'leader';
  if (group.admins.includes(userId)) return 'admin';
  if (group.members.includes(userId)) return 'member';
  return null;
}

const ROLE_NAMES = { leader: 'اونر', admin: 'مسؤول', member: 'عضو' };

module.exports = {
  newId, all, ranked, rankOf, findByName, findByMember, findByLeader,
  findByChannel, findByRole, resolve, roleIn, ROLE_NAMES,
};
