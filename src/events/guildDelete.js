module.exports = {
  name: 'guildDelete',
  async execute(guild, database, logger) {
    logger.info(`👋 Left guild: ${guild.name} (${guild.id})`);
    
    // Optionally, you can keep the data for a while or delete it immediately
    // For now, we'll keep it in case the bot is re-added
    // database.deleteGuild(guild.id);
  }
};
