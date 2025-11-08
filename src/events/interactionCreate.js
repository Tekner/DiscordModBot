module.exports = {
  name: 'interactionCreate',
  async execute(interaction, database, logger) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn('Unknown command', { commandName: interaction.commandName });
      return;
    }

    try {
      await command.execute(interaction, database, logger);
    } catch (error) {
      logger.error('Error executing command', {
        error: error.message,
        stack: error.stack,
        commandName: interaction.commandName,
        userId: interaction.user.id,
        guildId: interaction.guild?.id
      });

      const errorMessage = {
        content: '❌ There was an error executing this command!',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
};
