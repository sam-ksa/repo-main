// أوامر أونر القروب: تشتغل فقط داخل شات القروب، وحسب دور الشخص في القروب
const G = require('./groups');
const perms = require('./perms');

const RANK = { member: 1, admin: 2, leader: 3 };

// يرجع { group, role } أو null (بصمت) إذا الشخص ما له صلاحية
function groupCtx(client, message, data, minRole = 'member') {
  const group = G.all(data).find((g) => g.textChannel === message.channel.id);
  if (!group) return null;
  let role = G.roleIn(group, message.author.id);
  // مسؤولي القروبات يقدرون يديرون أي قروب من داخل شاته
  if (perms.isManager(client, message.member, data)) role = 'leader';
  if (!role || RANK[role] < RANK[minRole]) return null;
  return { group, role };
}

module.exports = { groupCtx };
