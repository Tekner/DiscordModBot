module.exports = {
  name: 'ready',
  once: true,
  async execute(client, database, logger) {
    logger.info(`✅ Logged in as ${client.user.tag}`);
    logger.info(`📊 Serving ${client.guilds.cache.size} guilds`);
    
    // Set bot status
    client.user.setActivity('for rule violations', { type: 'WATCHING' });
    
    // Ensure all guilds are in the database
    for (const guild of client.guilds.cache.values()) {
      const existingGuild = database.getGuild(guild.id);
      if (!existingGuild) {
        database.addGuild(guild.id, guild.name);
        logger.info(`Added guild to database: ${guild.name} (${guild.id})`);
      }
    }
  }
};
