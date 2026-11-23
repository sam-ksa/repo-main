const fs = require('fs');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(
      '\x1b[36m', 
      ` Client \x1b[33m${client.user.tag} \x1b[36m is Ready!\n`, 
      '\x1b[31m', 
      `Link: https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=412384488512&scope=bot\n`, 
      '\x1b[31m', 
      `╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌`, 
      '\x1b[0m' 
    );
    

    client.user.setPresence({
      status: 'online', 
      activities: [{
        name: 'Ov', 
        type: 'STREAMING', 
        url: 'https://twitch.tv/Ov', 
      }],
    });

    setInterval(async () => {
      let groups = JSON.parse(fs.readFileSync("./groups.json", "utf8"));

      for (const [groupName, group] of Object.entries(groups)) {
        if (groupName === 'categories' || groupName === 'managers' || groupName === 'leadersRole') continue;

        const voiceChannel = await client.channels.fetch(group.voiceChannel).catch(() => null);
        if (!voiceChannel) continue;

        let pointsToAdd = 0;

        voiceChannel.members.forEach(member => {
          if (group.members.includes(member.id)) {
            pointsToAdd += 1;
          }
        });

        group.points = (group.points || 0) + pointsToAdd;
        groups[groupName] = group;
      }

      fs.writeFileSync("./groups.json", JSON.stringify(groups, null, 4));

     // console.log("Points updated.");
    }, 120000); //2 min
  },
};
