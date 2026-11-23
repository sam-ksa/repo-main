// تشغيل البوت من مجلده دائماً (مهم في لينكس: systemd / pm2 ممكن يشغلونه من مجلد ثاني،
// وملف database.json حق pro.db ينقرا وينكتب بالنسبة للمجلد الحالي)
process.chdir(__dirname);

require('./lib/patches'); // لازم قبل أي شي: يصلّح مسح التوكن عند تغيير الأفتار/الاسم
const { Client, Intents, Collection } = require('discord.js');
const config = require('./config.json');
const { migrate } = require('./lib/migrate');
const { makeCache, sweepers } = require('./lib/clientOptions');

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES],
  allowedMentions: { parse: ['users'], repliedUser: false },
  // حدود الكاش عشان استهلاك الرام يبقى ثابت مهما زادت السيرفرات
  makeCache,
  sweepers,
  // حالة البوت: ستريمنق باسم Panel Tek (تنرسل مع كل تسجيل دخول وإعادة اتصال)
  // رابط تويتش مطلوب عشان ديسكورد يعرضها كبث مباشر (اللون البنفسجي)
  presence: {
    status: 'online',
    activities: [{ name: 'Panel Tek', type: 'STREAMING', url: 'https://www.twitch.tv/paneltek' }],
  },
});

client.commands = new Collection();
client.config = config;

// توافق مع نظام الاشتراكات (نفس سورس الميوزك): التوكن والملاك ممكن يجون من متغيرات البيئة
const envToken = [process.env.TOKEN, process.env.MASTER_BOT_TOKEN, process.env.DISCORD_TOKEN].find((t) => t && t.trim());
config.token = (config.token || config.Token || config.botToken || envToken || '').trim();
const envOwners = `${process.env.GLOBAL_OWNERS || ''} ${process.env.SUPER_OWNER_ID || ''}`.match(/\d{15,20}/g) || [];
config.owners = [...new Set([...(Array.isArray(config.owners) ? config.owners : []), ...envOwners].map(String))];
config.prefix = (config.prefix || process.env.PREFIX || '+').trim() || '+'; // بادئة فاضية = '+'

// إعدادات البوت (رابط الدعم والألوان) من bot-settings.json، لأن config.json يكتبه نظام الاشتراكات
const settings = require('./lib/botSettings').resolve(config);
Object.assign(config, settings);
require('./lib/ui').setSupport(settings.support);
require('./lib/ui').setColor(settings.embedColor);

// نقل بيانات النسخة القديمة (سيرفر واحد) لنظام السيرفرات المتعددة
const migrated = migrate(config);
if (migrated) console.log(`[migrate] انتقل ${migrated.count} قروب للسيرفر ${migrated.guildId}`);

['commandHandler', 'eventHandler'].forEach((handler) => require(`./handler/${handler}`)(client));

client.on('error', (error) => console.error('Client error:', error));
client.on('warn', (info) => console.warn('Client warning:', info));
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason && reason.stack ? reason.stack : reason));
process.on('uncaughtException', (err) => console.error('Uncaught exception:', err && err.stack ? err.stack : err));

// إذا فشل تسجيل الدخول (توكن غلط أو انقطاع): نطلع بخطأ عشان pm2 / systemd يعيد التشغيل
// بدل ما تبقى العملية شغالة بدون بوت
client.login(config.token).catch((e) => {
  console.error('فشل تسجيل دخول البوت:', e.message);
  process.exit(1);
});
