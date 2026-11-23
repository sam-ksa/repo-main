const fs = require('fs');

module.exports = (client) => {
  const commandFolders = fs.readdirSync('./Commands');
  for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./Commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const command = require(`../Commands/${folder}/${file}`);
      client.commands.set(command.name, command);
    }
  }

  client.on('messageCreate', message => {
    if (message.author.bot) return;

    const args = message.content.trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Check if the command is in the "Owner Group" folder and should run without a prefix
    const ownerGroupCommand = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (ownerGroupCommand && message.channel.type !== 'dm') {
      const folderName = ownerGroupCommand.folder || '';
      if (folderName === 'Owner Group') {
        try {
          ownerGroupCommand.run(client, message, args);
          return;
        } catch (error) {
          console.error(error);
          return message.reply('There was an error trying to execute that command!');
        }
      }
    }

    if (!message.content.startsWith(client.config.prefix)) return;

    const prefixedCommandName = commandName.slice(client.config.prefix.length).toLowerCase();
    const command = client.commands.get(prefixedCommandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(prefixedCommandName));

    if (!command) return;

    try {
      command.run(client, message, args);
    } catch (error) {
      console.error(error);
      message.reply('There was an error trying to execute that command!');
    }
  });
};
