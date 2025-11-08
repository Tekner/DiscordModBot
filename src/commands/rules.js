const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Manage moderation rules')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a new moderation rule')
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('Type of rule')
            .setRequired(true)
            .addChoices(
              { name: 'Keyword', value: 'keyword' },
              { name: 'Regular Expression', value: 'regex' },
              { name: 'Spam Detection', value: 'spam' },
              { name: 'Caps Lock Spam', value: 'caps' }
            )
        )
        .addStringOption(option =>
          option
            .setName('pattern')
            .setDescription('Pattern to match (keyword, regex, or leave empty for auto-detection)')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('action')
            .setDescription('Action to take when rule is violated')
            .setRequired(true)
            .addChoices(
              { name: 'Delete Message', value: 'delete' },
              { name: 'Flag User', value: 'flag' },
              { name: 'Delete & Flag', value: 'delete_and_flag' },
              { name: 'Warn User', value: 'warn' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a moderation rule')
        .addIntegerOption(option =>
          option
            .setName('rule-id')
            .setDescription('ID of the rule to remove')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all moderation rules')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Enable or disable a rule')
        .addIntegerOption(option =>
          option
            .setName('rule-id')
            .setDescription('ID of the rule to toggle')
            .setRequired(true)
        )
        .addBooleanOption(option =>
          option
            .setName('enabled')
            .setDescription('Enable or disable the rule')
            .setRequired(true)
        )
    ),

  async execute(interaction, database, logger) {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      await handleAddRule(interaction, database);
    } else if (subcommand === 'remove') {
      await handleRemoveRule(interaction, database);
    } else if (subcommand === 'list') {
      await handleListRules(interaction, database);
    } else if (subcommand === 'toggle') {
      await handleToggleRule(interaction, database);
    }

    logger.info('Rules command executed', {
      guildId,
      userId: interaction.user.id,
      subcommand
    });
  }
};

async function handleAddRule(interaction, database) {
  const guildId = interaction.guild.id;
  const type = interaction.options.getString('type');
  const pattern = interaction.options.getString('pattern') || type;
  const action = interaction.options.getString('action');

  // Validate pattern for regex type
  if (type === 'regex') {
    try {
      new RegExp(pattern);
    } catch (error) {
      await interaction.reply({
        embeds: [{
          color: 0xff0000,
          title: '❌ Invalid Regular Expression',
          description: `The pattern you provided is not a valid regular expression.\n\nError: ${error.message}`
        }],
        ephemeral: true
      });
      return;
    }
  }

  // Validate that pattern is provided for keyword and regex types
  if ((type === 'keyword' || type === 'regex') && !interaction.options.getString('pattern')) {
    await interaction.reply({
      embeds: [{
        color: 0xff0000,
        title: '❌ Pattern Required',
        description: `You must provide a pattern for ${type} rules.`
      }],
      ephemeral: true
    });
    return;
  }

  database.addModerationRule(guildId, type, pattern, action);

  const actionText = {
    'delete': 'Delete the message',
    'flag': 'Flag the user',
    'delete_and_flag': 'Delete the message and flag the user',
    'warn': 'Send a warning to the user'
  };

  await interaction.reply({
    embeds: [{
      color: 0x00ff00,
      title: '✅ Rule Added',
      fields: [
        { name: 'Type', value: type, inline: true },
        { name: 'Pattern', value: pattern, inline: true },
        { name: 'Action', value: actionText[action], inline: false }
      ],
      footer: { text: 'Use /rules list to see all rules' }
    }],
    ephemeral: true
  });
}

async function handleRemoveRule(interaction, database) {
  const ruleId = interaction.options.getInteger('rule-id');
  
  database.removeModerationRule(ruleId);
  
  await interaction.reply({
    embeds: [{
      color: 0x00ff00,
      title: '✅ Rule Removed',
      description: `Rule #${ruleId} has been removed.`
    }],
    ephemeral: true
  });
}

async function handleListRules(interaction, database) {
  const guildId = interaction.guild.id;
  const rules = database.db.prepare(`
    SELECT * FROM moderation_rules WHERE guild_id = ? ORDER BY id
  `).all(guildId);

  if (rules.length === 0) {
    await interaction.reply({
      embeds: [{
        color: 0xff9900,
        title: '📋 Moderation Rules',
        description: 'No moderation rules configured.\nUse `/rules add` to create rules.'
      }],
      ephemeral: true
    });
    return;
  }

  const actionEmoji = {
    'delete': '🗑️',
    'flag': '🚩',
    'delete_and_flag': '🗑️🚩',
    'warn': '⚠️'
  };

  const rulesList = rules.map(rule => {
    const status = rule.enabled ? '✅' : '❌';
    const emoji = actionEmoji[rule.action] || '•';
    return `${status} **#${rule.id}** ${emoji} \`${rule.rule_type}\` - ${rule.pattern}`;
  }).join('\n');

  await interaction.reply({
    embeds: [{
      color: 0x0099ff,
      title: '📋 Moderation Rules',
      description: rulesList,
      footer: { text: `Total: ${rules.length} rule(s) | Use /rules toggle to enable/disable` }
    }],
    ephemeral: true
  });
}

async function handleToggleRule(interaction, database) {
  const ruleId = interaction.options.getInteger('rule-id');
  const enabled = interaction.options.getBoolean('enabled');
  
  database.toggleModerationRule(ruleId, enabled);
  
  await interaction.reply({
    embeds: [{
      color: enabled ? 0x00ff00 : 0xff9900,
      title: `✅ Rule ${enabled ? 'Enabled' : 'Disabled'}`,
      description: `Rule #${ruleId} is now ${enabled ? 'active' : 'inactive'}.`
    }],
    ephemeral: true
  });
}
