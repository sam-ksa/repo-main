// ينقل بيانات النسخة القديمة (groups.json + settings.json) لنظام السيرفرات الجديد مرة وحدة
const fs = require('fs');
const path = require('path');
const store = require('./store');
const { newId } = require('./groups');

const ROOT = path.join(__dirname, '..');
const MARK = path.join(ROOT, 'data', '.migrated');
const RESERVED = ['managers', 'categories', 'leadersRole'];

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8')); } catch { return null; }
}

function migrate(config) {
  if (fs.existsSync(MARK)) return null;
  const old = readJSON('groups.json');
  const guildId = config.Guild;
  if (!old || !guildId) {
    fs.writeFileSync(MARK, new Date().toISOString());
    return null;
  }
  const oldSettings = readJSON('settings.json') || {};
  const cats = Array.isArray(old.categories) ? old.categories : [];
  const data = store.exists(guildId) ? store.get(guildId) : { settings: {}, groups: {} };

  data.settings.managers = [...new Set([...(data.settings.managers || []), ...(old.managers || [])])];
  data.settings.categories = {
    voice: (cats.find((c) => c.type === 'voice') || {}).id || null,
    text: (cats.find((c) => c.type === 'text') || {}).id || null,
  };
  if (old.leadersRole) data.settings.leadersRole = old.leadersRole;
  if (oldSettings.logChannel) data.settings.logChannel = oldSettings.logChannel;

  let count = 0;
  for (const [name, g] of Object.entries(old)) {
    if (RESERVED.includes(name) || !g || typeof g !== 'object' || !g.leader) continue;
    const id = newId();
    data.groups[id] = {
      id,
      name: g.name || name,
      leader: g.leader,
      members: g.members || [g.leader],
      admins: g.admins || [],
      voiceChannel: g.voiceChannel || null,
      textChannel: g.textChannel || null,
      role: g.role || null,
      points: g.points || 0,
      voiceMinutes: 0,
      bot: g.bot && g.bot !== 'none' ? g.bot : null,
      createdAt: Date.now(),
    };
    count += 1;
  }
  store.set(guildId, data);
  fs.writeFileSync(MARK, new Date().toISOString());
  return { guildId, count };
}

module.exports = { migrate };
