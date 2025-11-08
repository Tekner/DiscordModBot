module.exports = {
  name: 'guildCreate',
  async execute(guild, database, logger) {
    logger.info(`🎉 Joined new guild: ${guild.name} (${guild.id})`);
    
    // Add guild to database
    database.addGuild(guild.id, guild.name);
    
    // Try to send a welcome message to the system channel or first text channel
    try {
      const welcomeChannel = guild.systemChannel || 
        guild.channels.cache.find(ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has('SendMessages'));
      
      if (welcomeChannel) {
        await welcomeChannel.send({
          embeds: [{
            color: 0x00ff00,
            title: '👋 Thanks for adding me!',
            description: 
              '**I\'m a moderation bot that helps keep your server clean.**\n\n' +
              '**Getting Started:**\n' +
              '• Use `/help` to see all available commands\n' +
              '• Use `/config channels add` to add channels to monitor\n' +
              '• Use `/config moderator-channel` to set where I send alerts\n' +
              '• Use `/rules add` to add moderation rules\n\n' +
              '**Default Features:**\n' +
              '✅ Automatic spam detection\n' +
              '✅ Caps lock spam detection\n' +
              '✅ Customizable word filters\n' +
              '✅ User flagging system\n' +
              '✅ Detailed moderation logs',
            footer: { text: 'Configure me to start moderating!' }
          }]
        });
      }
    } catch (error) {
      logger.error('Failed to send welcome message', {
        guildId: guild.id,
        error: error.message
      });
    }
  }
};
