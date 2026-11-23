// البوت صار عام: يقبل أي سيرفر ويجهز له بياناته
const store = require('../lib/store');

module.exports = {
  name: 'guildCreate',
  execute(guild, client) {
    store.get(guild.id);
    console.log(`[guild] دخل سيرفر: ${guild.name} (${guild.id}) | المجموع ${client.guilds.cache.size}`);
  },
};
