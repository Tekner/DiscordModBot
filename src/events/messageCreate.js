module.exports = {
  name: 'messageCreate',
  async execute(message, database, logger, moderationEngine) {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Ignore DMs
    if (!message.guild) return;
    
    try {
      // Check if this channel is monitored
      const isMonitored = database.isChannelMonitored(message.guild.id, message.channel.id);
      if (!isMonitored) return;
      
      // Get guild configuration
      const guildConfig = database.getGuild(message.guild.id);
      if (!guildConfig) {
        logger.warn('Guild not found in database', { guildId: message.guild.id });
        return;
      }
      
      // Check if auto-moderation is enabled
      if (!guildConfig.auto_delete_enabled) return;
      
      // Check message against moderation rules
      const violatedRule = moderationEngine.checkMessage(message.guild.id, message.content);
      
      if (violatedRule) {
        logger.info('Message violated moderation rule', {
          guildId: message.guild.id,
          channelId: message.channel.id,
          userId: message.author.id,
          ruleType: violatedRule.rule_type,
          action: violatedRule.action
        });
        
        // Execute the moderation action
        await moderationEngine.executeAction(message, violatedRule, guildConfig);
        
        // Check if user should be flagged based on flag threshold
        const userFlags = database.getUserFlags(message.guild.id, message.author.id);
        if (userFlags && userFlags.flag_count >= guildConfig.flag_threshold) {
          logger.warn('User exceeded flag threshold', {
            guildId: message.guild.id,
            userId: message.author.id,
            flagCount: userFlags.flag_count,
            threshold: guildConfig.flag_threshold
          });
          
          // Notify moderators about threshold breach
          if (guildConfig.moderator_channel_id) {
            try {
              const modChannel = await message.guild.channels.fetch(
                guildConfig.moderator_channel_id
              );
              
              if (modChannel) {
                await modChannel.send({
                  embeds: [{
                    color: 0xff0000,
                    title: '⚠️ User Flag Threshold Exceeded',
                    description: `<@${message.author.id}> has been flagged ${userFlags.flag_count} times (threshold: ${guildConfig.flag_threshold})`,
                    fields: [
                      {
                        name: 'User',
                        value: `${message.author.tag}`,
                        inline: true
                      },
                      {
                        name: 'Flags',
                        value: `${userFlags.flag_count}`,
                        inline: true
                      },
                      {
                        name: 'Last Flagged',
                        value: `<t:${userFlags.last_flagged_at}:R>`,
                        inline: true
                      }
                    ],
                    footer: { text: 'Consider taking manual action' }
                  }]
                });
              }
            } catch (error) {
              logger.error('Failed to send threshold notification', {
                error: error.message,
                guildId: message.guild.id
              });
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error processing message', {
        error: error.message,
        stack: error.stack,
        messageId: message.id,
        guildId: message.guild.id
      });
    }
  }
};
