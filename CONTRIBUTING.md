# Contributing to DiscordModBot

Thank you for considering contributing to DiscordModBot! This document provides guidelines and information for contributors.

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/DiscordModBot.git
   cd DiscordModBot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up development environment**
   ```bash
   cp .env.example .env
   # Edit .env with your test bot credentials
   ```

4. **Create a test Discord server**
   - Create a new Discord server for testing
   - Invite your development bot to this server
   - Never test on production servers

## Project Structure

```
src/
├── commands/           # Slash command implementations
├── events/            # Discord event handlers
├── database/          # Database management
├── utils/             # Utility functions and helpers
├── index.js          # Main entry point
└── deploy-commands.js # Command registration script
```

## Adding New Commands

1. **Create a new file** in `src/commands/your-command.js`

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('commandname')
    .setDescription('Command description'),
  
  async execute(interaction, database, logger) {
    // Your command logic here
    await interaction.reply('Response');
    
    logger.info('Command executed', {
      guildId: interaction.guild.id,
      userId: interaction.user.id
    });
  }
};
```

2. **Deploy commands** after adding/modifying
   ```bash
   npm run deploy
   ```

3. **Test your command** in your test server

## Adding New Event Handlers

1. **Create a new file** in `src/events/eventName.js`

```javascript
module.exports = {
  name: 'eventName',
  once: false, // Set to true for one-time events
  
  async execute(eventData, database, logger, moderationEngine) {
    // Your event handling logic
    logger.debug('Event triggered', { /* data */ });
  }
};
```

2. **Restart the bot** to load the new event handler

## Database Changes

### Adding a New Table

Modify `src/database/DatabaseManager.js` in the `initializeTables()` method:

```javascript
this.db.exec(`
  CREATE TABLE IF NOT EXISTS new_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
  )
`);
```

### Adding Helper Methods

Add methods to the `DatabaseManager` class:

```javascript
getNewTableData(guildId) {
  const stmt = this.db.prepare('SELECT * FROM new_table WHERE guild_id = ?');
  return stmt.all(guildId);
}
```

## Code Style Guidelines

### JavaScript Style

- Use **const** for variables that don't change
- Use **let** for variables that do change
- Use **arrow functions** for callbacks
- Use **async/await** instead of promise chains
- Always use **semicolons**
- Use **camelCase** for variables and functions
- Use **PascalCase** for classes

### Naming Conventions

- **Commands**: Use descriptive names (`config`, `rules`, `flags`)
- **Functions**: Use verb phrases (`addGuild`, `checkMessage`)
- **Variables**: Use descriptive names (`guildConfig`, `moderationEngine`)

### Comments

- Add comments for complex logic
- Document function parameters and return values
- Explain "why" not "what" when possible

Example:
```javascript
// Check if user exceeds threshold to prevent notification spam
if (userFlags.flag_count >= guildConfig.flag_threshold) {
  // Notify moderators
}
```

## Error Handling

Always wrap async operations in try-catch:

```javascript
try {
  await message.delete();
  logger.info('Message deleted', { messageId: message.id });
} catch (error) {
  logger.error('Failed to delete message', {
    error: error.message,
    messageId: message.id
  });
}
```

## Logging

Use the logger appropriately:

- **error**: Critical failures that need attention
- **warn**: Issues that might cause problems
- **info**: Important events and actions
- **debug**: Detailed information for debugging

```javascript
logger.error('Database query failed', { query, error: error.message });
logger.warn('Channel not found', { channelId });
logger.info('Guild added', { guildId, guildName });
logger.debug('Processing message', { messageId, content });
```

## Testing

### Manual Testing Checklist

Before submitting a PR, test:

1. **Bot startup**
   - Bot connects successfully
   - No errors in console
   - Database initializes

2. **Commands**
   - All commands appear in Discord
   - Commands execute without errors
   - Permissions work correctly

3. **Message monitoring**
   - Messages are detected in monitored channels
   - Rules trigger correctly
   - Actions execute properly

4. **Database**
   - Data persists between restarts
   - No database errors in logs
   - Queries return expected results

### Testing Commands

```bash
# Syntax check all files
node -c src/index.js
node -c src/commands/*.js
node -c src/events/*.js

# Run the bot in development mode
npm run dev
```

## Submitting Changes

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Keep commits focused and atomic
   - Write clear commit messages

3. **Test thoroughly**
   - Run syntax checks
   - Test all affected functionality
   - Verify no regressions

4. **Update documentation**
   - Update README.md if needed
   - Add examples to EXAMPLES.md
   - Document new commands

5. **Submit pull request**
   - Describe what you changed and why
   - Reference any related issues
   - Include testing details

### Commit Message Format

```
Short description (50 chars or less)

More detailed explanation if needed. Wrap at 72 characters.
Explain the problem this commit solves and why you chose this solution.

- Bullet points are okay
- Use present tense ("Add feature" not "Added feature")
```

Examples:
```
Add regex validation for moderation rules

Prevent bot crashes when invalid regex patterns are added by
validating patterns before storing them in the database.

Fix spam detection for messages under 10 characters

Spam detection was throwing errors on short messages. Added
length check before analyzing message content.
```

## Feature Requests

When proposing new features:

1. **Check existing issues** to avoid duplicates
2. **Describe the use case** - why is this needed?
3. **Provide examples** of how it would work
4. **Consider scope** - should this be a core feature or plugin?

## Bug Reports

When reporting bugs:

1. **Describe the bug** clearly
2. **Provide steps to reproduce**
3. **Include error messages** and logs
4. **Specify environment** (Node version, OS, etc.)
5. **Expected vs actual behavior**

Example:
```markdown
**Bug**: Bot crashes when processing emoji-only messages

**Steps to reproduce**:
1. Add channel to monitoring
2. Post a message with only emojis: 😀😀😀
3. Bot crashes with error: ...

**Expected**: Bot should handle emoji-only messages

**Environment**:
- Node.js: v18.17.0
- discord.js: v14.24.2
- OS: Ubuntu 22.04
```

## Code Review

All submissions require review. Expect feedback on:

- **Code quality**: Readability, maintainability
- **Performance**: Efficiency, resource usage
- **Security**: Input validation, error handling
- **Style**: Consistency with existing code

## Security Issues

**Do not** report security vulnerabilities through public GitHub issues.

Instead:
1. Email the maintainers directly
2. Provide details of the vulnerability
3. Allow time for a fix before public disclosure

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

## Questions?

Feel free to:
- Open an issue for clarification
- Ask in pull request comments
- Reach out to maintainers

Thank you for contributing! 🎉
