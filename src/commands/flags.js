const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('flags')
    .setDescription('Manage user flags')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View flags for a user')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to check')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all flagged users')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Manually flag a user')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to flag')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Reason for flagging')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove flags from a user')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to unflag')
            .setRequired(true)
        )
    ),

  async execute(interaction, database, logger) {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'view') {
      await handleViewFlags(interaction, database);
    } else if (subcommand === 'list') {
      await handleListFlags(interaction, database);
    } else if (subcommand === 'add') {
      await handleAddFlag(interaction, database);
    } else if (subcommand === 'remove') {
      await handleRemoveFlag(interaction, database);
    }

    logger.info('Flags command executed', {
      guildId,
      userId: interaction.user.id,
      subcommand
    });
  }
};

async function handleViewFlags(interaction, database) {
  const guildId = interaction.guild.id;
  const user = interaction.options.getUser('user');
  
  const flags = database.getUserFlags(guildId, user.id);
  const logs = database.getUserModerationLogs(guildId, user.id, 10);

  if (!flags) {
    await interaction.reply({
      embeds: [{
        color: 0x00ff00,
        title: '✅ Clean Record',
        description: `<@${user.id}> has no flags.`
      }],
      ephemeral: true
    });
    return;
  }

  const recentLogs = logs.slice(0, 5).map(log => 
    `• **${log.action}** - <t:${log.created_at}:R> ${log.reason ? `\n  _${log.reason}_` : ''}`
  ).join('\n') || 'No recent activity';

  await interaction.reply({
    embeds: [{
      color: flags.flag_count >= 5 ? 0xff0000 : 0xff9900,
      title: `🚩 User Flags - ${user.tag}`,
      fields: [
        {
          name: 'Total Flags',
          value: `${flags.flag_count}`,
          inline: true
        },
        {
          name: 'Last Flagged',
          value: `<t:${flags.last_flagged_at}:R>`,
          inline: true
        },
        {
          name: 'Notes',
          value: flags.notes || 'None',
          inline: false
        },
        {
          name: 'Recent Activity',
          value: recentLogs,
          inline: false
        }
      ],
      footer: { text: `User ID: ${user.id}` }
    }],
    ephemeral: true
  });
}

async function handleListFlags(interaction, database) {
  const guildId = interaction.guild.id;
  const flaggedUsers = database.getAllFlaggedUsers(guildId);

  if (flaggedUsers.length === 0) {
    await interaction.reply({
      embeds: [{
        color: 0x00ff00,
        title: '✅ No Flagged Users',
        description: 'No users are currently flagged.'
      }],
      ephemeral: true
    });
    return;
  }

  const userList = flaggedUsers.slice(0, 25).map((flag, index) => 
    `${index + 1}. <@${flag.user_id}> - **${flag.flag_count}** flag(s) - <t:${flag.last_flagged_at}:R>`
  ).join('\n');

  await interaction.reply({
    embeds: [{
      color: 0xff9900,
      title: '🚩 Flagged Users',
      description: userList,
      footer: { 
        text: flaggedUsers.length > 25 
          ? `Showing top 25 of ${flaggedUsers.length} flagged users` 
          : `Total: ${flaggedUsers.length} flagged user(s)`
      }
    }],
    ephemeral: true
  });
}

async function handleAddFlag(interaction, database) {
  const guildId = interaction.guild.id;
  const user = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'Manually flagged by moderator';
  
  database.flagUser(guildId, user.id, reason);
  
  // Log the manual flag
  database.addModerationLog(
    guildId,
    interaction.channel.id,
    user.id,
    'manual_flag',
    {
      moderatorId: interaction.user.id,
      reason: reason
    }
  );

  const flags = database.getUserFlags(guildId, user.id);

  await interaction.reply({
    embeds: [{
      color: 0xff9900,
      title: '🚩 User Flagged',
      description: `<@${user.id}> has been flagged.\n\n**Reason:** ${reason}`,
      fields: [
        {
          name: 'Total Flags',
          value: `${flags.flag_count}`,
          inline: true
        },
        {
          name: 'Flagged By',
          value: `<@${interaction.user.id}>`,
          inline: true
        }
      ]
    }],
    ephemeral: true
  });
}

async function handleRemoveFlag(interaction, database) {
  const guildId = interaction.guild.id;
  const user = interaction.options.getUser('user');
  
  database.unflagUser(guildId, user.id);
  
  // Log the flag removal
  database.addModerationLog(
    guildId,
    interaction.channel.id,
    user.id,
    'unflag',
    {
      moderatorId: interaction.user.id,
      reason: 'Flags removed by moderator'
    }
  );

  await interaction.reply({
    embeds: [{
      color: 0x00ff00,
      title: '✅ Flags Removed',
      description: `All flags have been removed from <@${user.id}>.`
    }],
    ephemeral: true
  });
}
