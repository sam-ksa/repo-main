const points = require('../lib/points');
const panel = require('../lib/panel');
const store = require('../lib/store');
const brand = require('../lib/brand');
const emojis = require('../lib/emojis');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(
      '\x1b[36m',
      ` Client \x1b[33m${client.user.tag} \x1b[36m is Ready! (${client.guilds.cache.size} servers)\n`,
      '\x1b[31m',
      `Invite: https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot\n`,
      '\x1b[0m',
    );

    // نفس الحالة المحددة في index.js (ستريمنق: Panel Tek)
    client.user.setPresence(client.options.presence);

    points.start(client);
    panel.startAuto(client); // تحديث لوحات التوب كل 60 ثانية
    brand.ensureEmoji(client);
    // تجهيز إيموجيات الأوامر (أول تشغيل يرفعها، بعدها يقرأها بس). الأوامر ما تنتظرها: لو ما جهزت تطلع بدون إيموجي
    emojis.sync(client, client.config.emojiColor).catch((e) => console.error('[emojis] المزامنة فشلت:', e.message));

    // تحديث لوحات التوب بعد التشغيل
    for (const guild of client.guilds.cache.values()) {
      if (store.exists(guild.id) && store.get(guild.id).settings.panel.messageId) {
        panel.update(guild, { force: true }).catch(() => {});
      }
    }
  },
};
