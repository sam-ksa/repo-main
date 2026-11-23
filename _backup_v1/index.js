const { Client, Intents, Collection } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES] });

client.commands = new Collection();
client.events = new Collection();
client.config = config;


['commandHandler', 'eventHandler'].forEach(handler => {
  require(`./handler/${handler}`)(client);
});

client.login(config.token);




client.on('error', error => {
  console.error('Client error:', error);
});

client.on('warn', info => {
  console.warn('Client warning:', info);
});

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled rejection:', reason.stack ? reason.stack : reason);
});

process.on('uncaughtException', (err, origin) => {
  console.error('Uncaught exception:', err.stack ? err.stack : err);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
  console.error('Uncaught exception monitor:', err.stack ? err.stack : err);
});


client.on("ready", () => {
  const botId = client.user.id;
  config.botId = `https://discord.com/oauth2/authorize?client_id=${botId}&permissions=8&scope=bot`
  fs.writeFile(`${process.cwd()}/config.json`, JSON.stringify(config, null, 4), (err) => {
  });
});