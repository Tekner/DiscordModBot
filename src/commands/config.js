const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure bot settings for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommandGroup(group =>
      group
        .setName('channels')
        .setDescription('Manage monitored channels')
        .addSubcommand(subcommand =>
          subcommand
            .setName('add')
            .setDescription('Add a channel to monitor')
            .addChannelOption(option =>
              option
                .setName('channel')
                .setDescription('The channel to monitor')
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('remove')
            .setDescription('Remove a channel from monitoring')
            .addChannelOption(option =>
              option
                .setName('channel')
                .setDescription('The channel to stop monitoring')
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('list')
            .setDescription('List all monitored channels')
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('moderator-channel')
        .setDescription('Set the channel for moderation alerts')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('The channel for moderation alerts')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('auto-delete')
        .setDescription('Enable or disable automatic message deletion')
        .addBooleanOption(option =>
          option
            .setName('enabled')
            .setDescription('Enable or disable auto-delete')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('flag-threshold')
        .setDescription('Set the number of flags before special action')
        .addIntegerOption(option =>
          option
            .setName('threshold')
            .setDescription('Number of flags')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(20)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View current configuration')
    ),

  async execute(interaction, database, logger) {
    const guildId = interaction.guild.id;
    
    // Ensure guild exists in database
    let guildConfig = database.getGuild(guildId);
    if (!guildConfig) {
      database.addGuild(guildId, interaction.guild.name);
      guildConfig = database.getGuild(guildId);
    }

    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    if (subcommandGroup === 'channels') {
      await handleChannelsConfig(interaction, database, subcommand);
    } else if (subcommand === 'moderator-channel') {
      await handleModeratorChannel(interaction, database);
    } else if (subcommand === 'auto-delete') {
      await handleAutoDelete(interaction, database);
    } else if (subcommand === 'flag-threshold') {
      await handleFlagThreshold(interaction, database);
    } else if (subcommand === 'view') {
      await handleViewConfig(interaction, database);
    }

    logger.info('Config command executed', {
      guildId,
      userId: interaction.user.id,
      subcommand: subcommandGroup ? `${subcommandGroup}.${subcommand}` : subcommand
    });
  }
};

async function handleChannelsConfig(interaction, database, subcommand) {
  const guildId = interaction.guild.id;

  if (subcommand === 'add') {
    const channel = interaction.options.getChannel('channel');
    
    database.addMonitoredChannel(guildId, channel.id);
    
    await interaction.reply({
      embeds: [{
        color: 0x00ff00,
        title: '✅ Channel Added',
        description: `Now monitoring <#${channel.id}> for rule violations.`,
        footer: { text: 'Use /rules to configure moderation rules' }
      }],
      ephemeral: true
    });
  } else if (subcommand === 'remove') {
    const channel = interaction.options.getChannel('channel');
    
    database.removeMonitoredChannel(guildId, channel.id);
    
    await interaction.reply({
      embeds: [{
        color: 0xff9900,
        title: '✅ Channel Removed',
        description: `Stopped monitoring <#${channel.id}>.`
      }],
      ephemeral: true
    });
  } else if (subcommand === 'list') {
    const channels = database.getMonitoredChannels(guildId);
    
    if (channels.length === 0) {
      await interaction.reply({
        embeds: [{
          color: 0xff9900,
          title: '📋 Monitored Channels',
          description: 'No channels are currently being monitored.\nUse `/config channels add` to add channels.'
        }],
        ephemeral: true
      });
      return;
    }

    const channelList = channels.map(ch => `• <#${ch.channel_id}>`).join('\n');
    
    await interaction.reply({
      embeds: [{
        color: 0x0099ff,
        title: '📋 Monitored Channels',
        description: channelList,
        footer: { text: `Monitoring ${channels.length} channel(s)` }
      }],
      ephemeral: true
    });
  }
}

async function handleModeratorChannel(interaction, database) {
  const guildId = interaction.guild.id;
  const channel = interaction.options.getChannel('channel');
  
  database.updateGuild(guildId, { moderator_channel_id: channel.id });
  
  await interaction.reply({
    embeds: [{
      color: 0x00ff00,
      title: '✅ Moderator Channel Set',
      description: `Moderation alerts will be sent to <#${channel.id}>.`
    }],
    ephemeral: true
  });
}

async function handleAutoDelete(interaction, database) {
  const guildId = interaction.guild.id;
  const enabled = interaction.options.getBoolean('enabled');
  
  database.updateGuild(guildId, { auto_delete_enabled: enabled ? 1 : 0 });
  
  await interaction.reply({
    embeds: [{
      color: enabled ? 0x00ff00 : 0xff9900,
      title: `✅ Auto-Delete ${enabled ? 'Enabled' : 'Disabled'}`,
      description: enabled 
        ? 'Messages violating rules will be automatically deleted.'
        : 'Messages violating rules will be flagged but not deleted.'
    }],
    ephemeral: true
  });
}

async function handleFlagThreshold(interaction, database) {
  const guildId = interaction.guild.id;
  const threshold = interaction.options.getInteger('threshold');
  
  database.updateGuild(guildId, { flag_threshold: threshold });
  
  await interaction.reply({
    embeds: [{
      color: 0x00ff00,
      title: '✅ Flag Threshold Updated',
      description: `Moderators will be alerted when a user reaches **${threshold}** flags.`
    }],
    ephemeral: true
  });
}

async function handleViewConfig(interaction, database) {
  const guildId = interaction.guild.id;
  const config = database.getGuild(guildId);
  const channels = database.getMonitoredChannels(guildId);
  const rules = database.getModerationRules(guildId);
  
  const fields = [
    {
      name: 'Auto-Delete',
      value: config.auto_delete_enabled ? '✅ Enabled' : '❌ Disabled',
      inline: true
    },
    {
      name: 'Flag Threshold',
      value: `${config.flag_threshold} flags`,
      inline: true
    },
    {
      name: 'Moderator Channel',
      value: config.moderator_channel_id ? `<#${config.moderator_channel_id}>` : 'Not set',
      inline: true
    },
    {
      name: 'Monitored Channels',
      value: channels.length > 0 
        ? `${channels.length} channel(s)` 
        : 'None',
      inline: true
    },
    {
      name: 'Active Rules',
      value: `${rules.length} rule(s)`,
      inline: true
    }
  ];
  
  await interaction.reply({
    embeds: [{
      color: 0x0099ff,
      title: '⚙️ Server Configuration',
      fields,
      footer: { text: 'Use /config to modify settings' }
    }],
    ephemeral: true
  });
}
