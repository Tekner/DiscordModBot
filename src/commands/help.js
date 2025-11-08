const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help with bot commands'),

  async execute(interaction, database, logger) {
    await interaction.reply({
      embeds: [{
        color: 0x0099ff,
        title: '🤖 Discord Moderation Bot - Help',
        description: 'I help keep your server clean by automatically moderating messages based on configurable rules.',
        fields: [
          {
            name: '⚙️ Configuration Commands',
            value: 
              '`/config channels add` - Add a channel to monitor\n' +
              '`/config channels remove` - Remove a monitored channel\n' +
              '`/config channels list` - List all monitored channels\n' +
              '`/config moderator-channel` - Set moderator alert channel\n' +
              '`/config auto-delete` - Enable/disable auto-deletion\n' +
              '`/config flag-threshold` - Set user flag threshold\n' +
              '`/config view` - View current configuration',
            inline: false
          },
          {
            name: '📜 Rule Management',
            value:
              '`/rules add` - Add a moderation rule\n' +
              '`/rules remove` - Remove a rule\n' +
              '`/rules list` - List all rules\n' +
              '`/rules toggle` - Enable/disable a rule',
            inline: false
          },
          {
            name: '🚩 User Flags',
            value:
              '`/flags view` - View flags for a user\n' +
              '`/flags list` - List all flagged users\n' +
              '`/flags add` - Manually flag a user\n' +
              '`/flags remove` - Remove flags from a user',
            inline: false
          },
          {
            name: '📋 Logs',
            value:
              '`/logs recent` - View recent moderation actions\n' +
              '`/logs user` - View logs for a specific user',
            inline: false
          },
          {
            name: '🎯 Rule Types',
            value:
              '**Keyword** - Match specific words or phrases\n' +
              '**Regex** - Match patterns using regular expressions\n' +
              '**Spam** - Detect spam patterns automatically\n' +
              '**Caps** - Detect excessive caps lock usage',
            inline: false
          },
          {
            name: '⚡ Actions',
            value:
              '**Delete** - Remove the offending message\n' +
              '**Flag** - Flag the user for review\n' +
              '**Delete & Flag** - Both actions\n' +
              '**Warn** - Send a DM warning to the user',
            inline: false
          },
          {
            name: '🔗 Quick Start',
            value:
              '1. Set a moderator channel: `/config moderator-channel`\n' +
              '2. Add channels to monitor: `/config channels add`\n' +
              '3. Add moderation rules: `/rules add`\n' +
              '4. Monitor logs and flags as needed',
            inline: false
          }
        ],
        footer: { text: 'All commands require appropriate permissions' }
      }],
      ephemeral: true
    });

    logger.info('Help command executed', {
      guildId: interaction.guild?.id,
      userId: interaction.user.id
    });
  }
};
