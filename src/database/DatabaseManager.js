const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor(dbPath) {
    // Ensure the data directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeTables();
  }

  initializeTables() {
    // Guilds configuration table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS guilds (
        guild_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        moderator_channel_id TEXT,
        auto_delete_enabled INTEGER DEFAULT 1,
        flag_threshold INTEGER DEFAULT 3,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Monitored channels table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS monitored_channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(guild_id, channel_id),
        FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
      )
    `);

    // Moderation logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS moderation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        moderator_id TEXT,
        action TEXT NOT NULL,
        reason TEXT,
        message_content TEXT,
        message_id TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
      )
    `);

    // User flags table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_flags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        flag_count INTEGER DEFAULT 1,
        last_flagged_at INTEGER DEFAULT (strftime('%s', 'now')),
        notes TEXT,
        UNIQUE(guild_id, user_id),
        FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
      )
    `);

    // Moderation rules table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS moderation_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        rule_type TEXT NOT NULL,
        pattern TEXT NOT NULL,
        action TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better query performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_monitored_channels_guild 
      ON monitored_channels(guild_id);
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_moderation_logs_guild 
      ON moderation_logs(guild_id);
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_user_flags_guild_user 
      ON user_flags(guild_id, user_id);
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_moderation_rules_guild 
      ON moderation_rules(guild_id);
    `);

    console.log('✅ Database tables initialized');
  }

  // Guild operations
  addGuild(guildId, name) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO guilds (guild_id, name)
      VALUES (?, ?)
    `);
    return stmt.run(guildId, name);
  }

  getGuild(guildId) {
    const stmt = this.db.prepare('SELECT * FROM guilds WHERE guild_id = ?');
    return stmt.get(guildId);
  }

  updateGuild(guildId, updates) {
    const fields = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);
    
    const stmt = this.db.prepare(`
      UPDATE guilds 
      SET ${fields}, updated_at = strftime('%s', 'now')
      WHERE guild_id = ?
    `);
    return stmt.run(...values, guildId);
  }

  deleteGuild(guildId) {
    const stmt = this.db.prepare('DELETE FROM guilds WHERE guild_id = ?');
    return stmt.run(guildId);
  }

  // Monitored channels operations
  addMonitoredChannel(guildId, channelId) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO monitored_channels (guild_id, channel_id, enabled)
      VALUES (?, ?, 1)
    `);
    return stmt.run(guildId, channelId);
  }

  removeMonitoredChannel(guildId, channelId) {
    const stmt = this.db.prepare(`
      DELETE FROM monitored_channels 
      WHERE guild_id = ? AND channel_id = ?
    `);
    return stmt.run(guildId, channelId);
  }

  getMonitoredChannels(guildId) {
    const stmt = this.db.prepare(`
      SELECT * FROM monitored_channels 
      WHERE guild_id = ? AND enabled = 1
    `);
    return stmt.all(guildId);
  }

  isChannelMonitored(guildId, channelId) {
    const stmt = this.db.prepare(`
      SELECT id FROM monitored_channels 
      WHERE guild_id = ? AND channel_id = ? AND enabled = 1
    `);
    return stmt.get(guildId, channelId) !== undefined;
  }

  // Moderation logs operations
  addModerationLog(guildId, channelId, userId, action, details = {}) {
    const stmt = this.db.prepare(`
      INSERT INTO moderation_logs 
      (guild_id, channel_id, user_id, moderator_id, action, reason, message_content, message_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      guildId,
      channelId,
      userId,
      details.moderatorId || null,
      action,
      details.reason || null,
      details.messageContent || null,
      details.messageId || null
    );
  }

  getModerationLogs(guildId, limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM moderation_logs 
      WHERE guild_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(guildId, limit);
  }

  getUserModerationLogs(guildId, userId, limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM moderation_logs 
      WHERE guild_id = ? AND user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(guildId, userId, limit);
  }

  // User flags operations
  flagUser(guildId, userId, notes = null) {
    const stmt = this.db.prepare(`
      INSERT INTO user_flags (guild_id, user_id, flag_count, notes)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(guild_id, user_id) 
      DO UPDATE SET 
        flag_count = flag_count + 1,
        last_flagged_at = strftime('%s', 'now'),
        notes = COALESCE(?, notes)
    `);
    return stmt.run(guildId, userId, notes, notes);
  }

  unflagUser(guildId, userId) {
    const stmt = this.db.prepare(`
      DELETE FROM user_flags 
      WHERE guild_id = ? AND user_id = ?
    `);
    return stmt.run(guildId, userId);
  }

  getUserFlags(guildId, userId) {
    const stmt = this.db.prepare(`
      SELECT * FROM user_flags 
      WHERE guild_id = ? AND user_id = ?
    `);
    return stmt.get(guildId, userId);
  }

  getAllFlaggedUsers(guildId) {
    const stmt = this.db.prepare(`
      SELECT * FROM user_flags 
      WHERE guild_id = ? 
      ORDER BY flag_count DESC, last_flagged_at DESC
    `);
    return stmt.all(guildId);
  }

  // Moderation rules operations
  addModerationRule(guildId, ruleType, pattern, action) {
    const stmt = this.db.prepare(`
      INSERT INTO moderation_rules (guild_id, rule_type, pattern, action)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(guildId, ruleType, pattern, action);
  }

  removeModerationRule(ruleId) {
    const stmt = this.db.prepare(`
      DELETE FROM moderation_rules WHERE id = ?
    `);
    return stmt.run(ruleId);
  }

  getModerationRules(guildId) {
    const stmt = this.db.prepare(`
      SELECT * FROM moderation_rules 
      WHERE guild_id = ? AND enabled = 1
    `);
    return stmt.all(guildId);
  }

  toggleModerationRule(ruleId, enabled) {
    const stmt = this.db.prepare(`
      UPDATE moderation_rules 
      SET enabled = ? 
      WHERE id = ?
    `);
    return stmt.run(enabled ? 1 : 0, ruleId);
  }

  close() {
    this.db.close();
  }
}

module.exports = DatabaseManager;
