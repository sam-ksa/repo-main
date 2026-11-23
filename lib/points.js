// نظام نقاط الفويس: كل دورة يحسب أعضاء القروب الموجودين في روم القروب الصوتي
const store = require('./store');
const panel = require('./panel');

const TICK_MS = 2 * 60 * 1000; // كل دقيقتين

function countActive(group, voiceChannel, settings) {
  return voiceChannel.members.filter((m) =>
    !m.user.bot
    && group.members.includes(m.id)
    && !(settings.ignoreDeafened && (m.voice.selfDeaf || m.voice.serverDeaf)),
  ).size;
}

function tickGuild(guild) {
  if (!store.exists(guild.id)) return;
  const data = store.get(guild.id);
  const per = Math.max(0, Number(data.settings.pointsPerTick) || 0);
  let changed = false;
  for (const group of Object.values(data.groups)) {
    const vc = group.voiceChannel && guild.channels.cache.get(group.voiceChannel);
    if (!vc || !vc.members) continue;
    const active = countActive(group, vc, data.settings);
    if (!active) continue;
    group.points += active * per;
    group.voiceMinutes += active * (TICK_MS / 60000);
    changed = true;
  }
  if (changed) {
    store.save(guild.id);
    panel.schedule(guild, 1000);
  }
}

function start(client) {
  setInterval(() => {
    for (const guild of client.guilds.cache.values()) {
      try { tickGuild(guild); } catch (e) { console.error('[points]', guild.id, e); }
    }
  }, TICK_MS);
}

module.exports = { start, tickGuild, countActive, TICK_MS };
