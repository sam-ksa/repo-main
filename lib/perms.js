// مستويات الصلاحية:
// owner   = أونر البوت (config.json)
// admin   = أونر السيرفر أو عنده Administrator (أو أونر البوت)
// manager = مسؤول قروبات (admin + المضافين بـ setmanager + رتبة المسؤولين)
// public  = الكل
const LEVELS = ['public', 'manager', 'admin', 'owner'];

const isBotOwner = (client, userId) => (client.config.owners || []).includes(userId);

function isAdmin(client, member) {
  if (!member) return false;
  return isBotOwner(client, member.id)
    || member.id === member.guild.ownerId
    || member.permissions.has('ADMINISTRATOR');
}

function isManager(client, member, data) {
  if (!member) return false;
  if (isAdmin(client, member)) return true;
  const s = data.settings;
  return s.managers.includes(member.id) || Boolean(s.managerRole && member.roles.cache.has(s.managerRole));
}

function levelOf(client, member, data) {
  if (isBotOwner(client, member.id)) return 'owner';
  if (isAdmin(client, member)) return 'admin';
  if (isManager(client, member, data)) return 'manager';
  return 'public';
}

const atLeast = (level, required) => LEVELS.indexOf(level) >= LEVELS.indexOf(required || 'public');

// صلاحيات البوت الناقصة في السيرفر
const missingBotPerms = (guild, perms) => guild.me.permissions.missing(perms);

const PERM_NAMES = {
  MANAGE_CHANNELS: 'إدارة الرومات',
  MANAGE_ROLES: 'إدارة الرتب',
  MOVE_MEMBERS: 'نقل الأعضاء',
  MUTE_MEMBERS: 'كتم الأعضاء',
  MANAGE_NICKNAMES: 'إدارة الأسماء',
  SEND_MESSAGES: 'إرسال الرسائل',
  EMBED_LINKS: 'تضمين الروابط',
  ATTACH_FILES: 'إرفاق الملفات',
  VIEW_CHANNEL: 'عرض الروم',
};
const permList = (perms) => perms.map((p) => PERM_NAMES[p] || p).join('، ');

module.exports = { LEVELS, isBotOwner, isAdmin, isManager, levelOf, atLeast, missingBotPerms, permList };
