// لما البوت يطلع من سيرفر: نحفظ بياناته ونشيلها من الذاكرة (الملف يبقى لو رجع البوت)
const store = require('../lib/store');
const panel = require('../lib/panel');

module.exports = {
  name: 'guildDelete',
  execute(guild) {
    if (!guild || guild.available === false) return; // انقطاع مؤقت من ديسكورد، مو طلعة
    panel.forget(guild.id);
    store.unload(guild.id);
  },
};
