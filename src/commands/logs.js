const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('View moderation logs')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(subcommand =>
      subcommand
        .setName('recent')
        .setDescription('View recent moderation actions')
        .addIntegerOption(option =>
          option
            .setName('limit')
            .setDescription('Number of logs to show (default: 10)')
            .setMinValue(1)
            .setMaxValue(25)
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('user')
        .setDescription('View logs for a specific user')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to check logs for')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('limit')
            .setDescription('Number of logs to show (default: 10)')
            .setMinValue(1)
            .setMaxValue(25)
            .setRequired(false)
        )
    ),

  async execute(interaction, database, logger) {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'recent') {
      await handleRecentLogs(interaction, database);
    } else if (subcommand === 'user') {
      await handleUserLogs(interaction, database);
    }

    logger.info('Logs command executed', {
      guildId,
      userId: interaction.user.id,
      subcommand
    });
  }
};

async function handleRecentLogs(interaction, database) {
  const guildId = interaction.guild.id;
  const limit = interaction.options.getInteger('limit') || 10;
  
  const logs = database.getModerationLogs(guildId, limit);

  if (logs.length === 0) {
    await interaction.reply({
      embeds: [{
        color: 0x00ff00,
        title: '📋 Moderation Logs',
        description: 'No moderation actions recorded yet.'
      }],
      ephemeral: true
    });
    return;
  }

  const actionEmoji = {
    'delete': '🗑️',
    'flag': '🚩',
    'warn': '⚠️',
    'manual_flag': '🚩',
    'unflag': '✅'
  };

  const logsList = logs.map(log => {
    const emoji = actionEmoji[log.action] || '•';
    const moderator = log.moderator_id ? `by <@${log.moderator_id}>` : '(auto)';
    return `${emoji} <@${log.user_id}> - **${log.action}** ${moderator} - <t:${log.created_at}:R>`;
  }).join('\n');

  await interaction.reply({
    embeds: [{
      color: 0x0099ff,
      title: '📋 Recent Moderation Logs',
      description: logsList,
      footer: { text: `Showing ${logs.length} most recent log(s)` }
    }],
    ephemeral: true
  });
}

async function handleUserLogs(interaction, database) {
  const guildId = interaction.guild.id;
  const user = interaction.options.getUser('user');
  const limit = interaction.options.getInteger('limit') || 10;
  
  const logs = database.getUserModerationLogs(guildId, user.id, limit);

  if (logs.length === 0) {
    await interaction.reply({
      embeds: [{
        color: 0x00ff00,
        title: `📋 Logs for ${user.tag}`,
        description: 'No moderation actions recorded for this user.'
      }],
      ephemeral: true
    });
    return;
  }

  const actionEmoji = {
    'delete': '🗑️',
    'flag': '🚩',
    'warn': '⚠️',
    'manual_flag': '🚩',
    'unflag': '✅'
  };

  const logsList = logs.map(log => {
    const emoji = actionEmoji[log.action] || '•';
    const moderator = log.moderator_id ? `by <@${log.moderator_id}>` : '(auto)';
    const reason = log.reason ? `\n  _${log.reason}_` : '';
    return `${emoji} **${log.action}** ${moderator} - <t:${log.created_at}:R>${reason}`;
  }).join('\n\n');

  await interaction.reply({
    embeds: [{
      color: 0x0099ff,
      title: `📋 Logs for ${user.tag}`,
      description: logsList,
      footer: { text: `Showing ${logs.length} log(s) | User ID: ${user.id}` }
    }],
    ephemeral: true
  });
}
