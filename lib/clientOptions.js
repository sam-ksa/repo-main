// إعدادات كاش discord.js: تمنع تضخم الرام مع كثرة السيرفرات والأعضاء والرسائل
// اللي يحتاجه البوت فعلاً: السيرفرات، الرومات، الرتب، حالات الفويس، وأعضاء الفويس (لحساب النقاط)
const { Options } = require('discord.js');

const isSelf = (x) => x.client.user && x.id === x.client.user.id;

const makeCache = Options.cacheWithLimits({
  ...Options.defaultMakeCacheSettings,
  // الرسائل: البوت ما يعتمد على كاش الرسائل (الأزرار والأسئلة تشتغل بالأحداث)
  MessageManager: 25,
  // الأعضاء: بدون حد ثابت، لأن ديسكورد يرسل الأعضاء قبل حالات الفويس، والحد الثابت كان بيطرد
  // اللي في الفويس وقت التشغيل (وتضيع نقاطهم). التنظيف يصير بالـ sweeper تحت (يحتفظ باللي في الفويس)
  UserManager: { maxSize: 200, keepOverLimit: isSelf },
  // أشياء البوت ما يستخدمها أبداً
  PresenceManager: 0,
  ReactionManager: 0,
  ReactionUserManager: 0,
  GuildBanManager: 0,
  GuildInviteManager: 0,
  GuildStickerManager: 0,
  GuildEmojiManager: 0,
  BaseGuildEmojiManager: 0,
  StageInstanceManager: 0,
  ThreadMemberManager: 0,
  GuildScheduledEventManager: 0,
  ApplicationCommandManager: 0,
});

const sweepers = {
  ...Options.defaultSweeperSettings,
  // تنظيف دوري: الرسائل الأقدم من 15 دقيقة، والمستخدمين والأعضاء اللي مو في فويس
  messages: { interval: 300, lifetime: 900 },
  users: { interval: 1800, filter: () => (u) => !isSelf(u) },
  guildMembers: {
    interval: 900,
    filter: () => (m) => !isSelf(m) && !m.guild.voiceStates.cache.get(m.id)?.channelId,
  },
};

module.exports = { makeCache, sweepers };
