class ModerationEngine {
  constructor(database, logger) {
    this.db = database;
    this.logger = logger;
  }

  /**
   * Check if a message violates any moderation rules
   * @param {string} guildId - Guild ID
   * @param {string} content - Message content
   * @returns {Object|null} Matched rule or null
   */
  checkMessage(guildId, content) {
    const rules = this.db.getModerationRules(guildId);
    
    for (const rule of rules) {
      if (this.matchesRule(content, rule)) {
        return rule;
      }
    }
    
    return null;
  }

  /**
   * Check if content matches a moderation rule
   * @param {string} content - Message content
   * @param {Object} rule - Moderation rule
   * @returns {boolean}
   */
  matchesRule(content, rule) {
    const lowerContent = content.toLowerCase();
    
    switch (rule.rule_type) {
      case 'keyword':
        return lowerContent.includes(rule.pattern.toLowerCase());
      
      case 'regex':
        try {
          const regex = new RegExp(rule.pattern, 'i');
          return regex.test(content);
        } catch (error) {
          this.logger.error('Invalid regex pattern', { 
            ruleId: rule.id, 
            pattern: rule.pattern,
            error: error.message
          });
          return false;
        }
      
      case 'spam':
        // Check for repeated characters or words
        return this.isSpam(content);
      
      case 'caps':
        // Check if message is mostly uppercase
        return this.isCapsSpam(content);
      
      default:
        return false;
    }
  }

  /**
   * Detect spam patterns
   * @param {string} content - Message content
   * @returns {boolean}
   */
  isSpam(content) {
    // Check for repeated characters (e.g., "aaaaaaa")
    const repeatedChars = /(.)\1{5,}/;
    if (repeatedChars.test(content)) return true;

    // Check for repeated words
    const words = content.toLowerCase().split(/\s+/);
    const wordCount = {};
    for (const word of words) {
      if (word.length > 2) {
        wordCount[word] = (wordCount[word] || 0) + 1;
        if (wordCount[word] >= 5) return true;
      }
    }

    return false;
  }

  /**
   * Check if message is caps spam
   * @param {string} content - Message content
   * @returns {boolean}
   */
  isCapsSpam(content) {
    if (content.length < 10) return false;
    
    const letters = content.replace(/[^a-zA-Z]/g, '');
    if (letters.length === 0) return false;
    
    const upperCount = (content.match(/[A-Z]/g) || []).length;
    const upperRatio = upperCount / letters.length;
    
    return upperRatio > 0.7;
  }

  /**
   * Execute moderation action on a message
   * @param {Object} message - Discord message object
   * @param {Object} rule - Matched rule
   * @param {Object} guildConfig - Guild configuration
   */
  async executeAction(message, rule, guildConfig) {
    const action = rule.action;
    
    try {
      switch (action) {
        case 'delete':
          await this.deleteMessage(message, rule);
          break;
        
        case 'flag':
          await this.flagUserForMessage(message, rule);
          break;
        
        case 'delete_and_flag':
          await this.deleteMessage(message, rule);
          await this.flagUserForMessage(message, rule);
          break;
        
        case 'warn':
          await this.warnUser(message, rule);
          break;
        
        default:
          this.logger.warn('Unknown action type', { action, ruleId: rule.id });
      }

      // Notify moderators if configured
      if (guildConfig && guildConfig.moderator_channel_id) {
        await this.notifyModerators(message, rule, guildConfig);
      }

    } catch (error) {
      this.logger.error('Failed to execute moderation action', {
        error: error.message,
        messageId: message.id,
        guildId: message.guild.id
      });
    }
  }

  /**
   * Delete a message and log the action
   * @param {Object} message - Discord message object
   * @param {Object} rule - Matched rule
   */
  async deleteMessage(message, rule) {
    await message.delete();
    
    this.db.addModerationLog(
      message.guild.id,
      message.channel.id,
      message.author.id,
      'delete',
      {
        reason: `Matched rule: ${rule.rule_type} - ${rule.pattern}`,
        messageContent: message.content,
        messageId: message.id
      }
    );

    this.logger.info('Message deleted', {
      guildId: message.guild.id,
      userId: message.author.id,
      ruleType: rule.rule_type
    });
  }

  /**
   * Flag a user and log the action
   * @param {Object} message - Discord message object
   * @param {Object} rule - Matched rule
   */
  async flagUserForMessage(message, rule) {
    this.db.flagUser(
      message.guild.id,
      message.author.id,
      `Auto-flagged: ${rule.rule_type} - ${rule.pattern}`
    );

    this.db.addModerationLog(
      message.guild.id,
      message.channel.id,
      message.author.id,
      'flag',
      {
        reason: `Matched rule: ${rule.rule_type} - ${rule.pattern}`,
        messageContent: message.content,
        messageId: message.id
      }
    );

    this.logger.info('User flagged', {
      guildId: message.guild.id,
      userId: message.author.id,
      ruleType: rule.rule_type
    });
  }

  /**
   * Send a warning to a user
   * @param {Object} message - Discord message object
   * @param {Object} rule - Matched rule
   */
  async warnUser(message, rule) {
    try {
      await message.author.send(
        `⚠️ Your message in **${message.guild.name}** was flagged for violating server rules.\n` +
        `Please review the server guidelines and adjust your behavior accordingly.`
      );

      this.db.addModerationLog(
        message.guild.id,
        message.channel.id,
        message.author.id,
        'warn',
        {
          reason: `Matched rule: ${rule.rule_type} - ${rule.pattern}`,
          messageContent: message.content,
          messageId: message.id
        }
      );
    } catch (error) {
      this.logger.warn('Could not send DM to user', {
        userId: message.author.id,
        error: error.message
      });
    }
  }

  /**
   * Notify moderators about a moderation action
   * @param {Object} message - Discord message object
   * @param {Object} rule - Matched rule
   * @param {Object} guildConfig - Guild configuration
   */
  async notifyModerators(message, rule, guildConfig) {
    try {
      const modChannel = await message.guild.channels.fetch(
        guildConfig.moderator_channel_id
      );

      if (modChannel) {
        const embed = {
          color: 0xff9900,
          title: '🛡️ Automatic Moderation Action',
          fields: [
            {
              name: 'User',
              value: `<@${message.author.id}> (${message.author.tag})`,
              inline: true
            },
            {
              name: 'Channel',
              value: `<#${message.channel.id}>`,
              inline: true
            },
            {
              name: 'Action',
              value: rule.action,
              inline: true
            },
            {
              name: 'Rule Type',
              value: rule.rule_type,
              inline: true
            },
            {
              name: 'Pattern',
              value: rule.pattern,
              inline: true
            },
            {
              name: 'Message Content',
              value: message.content.substring(0, 1024) || '*[No content]*'
            }
          ],
          timestamp: new Date().toISOString()
        };

        await modChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      this.logger.error('Failed to notify moderators', {
        error: error.message,
        guildId: message.guild.id
      });
    }
  }
}

module.exports = ModerationEngine;
