const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'guildCreate',
  execute(guild) {
    const configPath = path.join(__dirname, '../config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    if (guild.id !== config.Guild) {
      console.log(`Joined a new guild: ${guild.name} (${guild.id})`);
      guild.leave()
        .then(g => console.log(`Left the guild: ${g.name} (${g.id}) as it is not the configured guild.`))
        .catch(console.error);
    }
  },
};
