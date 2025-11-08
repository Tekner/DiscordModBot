# DiscordModBot

A powerful Discord moderation bot built with Discord.js v14 and SQLite, designed to automatically monitor and moderate messages across multiple channels with customizable rules.

## Features

### 🛡️ Automatic Moderation
- **Real-time message monitoring** on configurable channels
- **Multiple rule types**: Keywords, Regex patterns, Spam detection, Caps lock spam
- **Flexible actions**: Delete messages, flag users, send warnings, or combine actions
- **Smart spam detection**: Identifies repeated characters, words, and patterns
- **Caps lock detection**: Automatically catches messages with excessive uppercase

### 📊 User Management
- **User flagging system** with configurable thresholds
- **Automatic flag tracking** for rule violations
- **Manual flag management** for moderators
- **Comprehensive user history** with detailed logs

### 📝 Logging & Reporting
- **Detailed moderation logs** stored in SQLite database
- **Per-user activity tracking** for pattern analysis
- **Moderator notifications** via dedicated channel
- **Timestamped actions** for accountability

### ⚙️ Configuration
- **Per-guild settings** with independent configurations
- **Channel-specific monitoring** - choose which channels to watch
- **Customizable thresholds** for auto-moderation actions
- **Enable/disable features** on the fly

## Prerequisites

- Node.js 18.0.0 or higher
- A Discord Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))
- Discord Application Client ID

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tekner/DiscordModBot.git
   cd DiscordModBot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your bot credentials:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   DB_PATH=./data/bot.db
   LOG_LEVEL=info
   ```

4. **Deploy slash commands**
   ```bash
   npm run deploy
   ```

5. **Start the bot**
   ```bash
   npm start
   ```

## Bot Setup

### Getting Bot Token and Client ID

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section
4. Click "Reset Token" to get your `DISCORD_TOKEN`
5. Enable the following Privileged Gateway Intents:
   - **Message Content Intent** (required for reading messages)
   - **Server Members Intent** (for member information)
6. Go to "OAuth2" > "General" to get your `CLIENT_ID`

### Inviting the Bot

Generate an invite URL with these permissions:
- Scopes: `bot`, `applications.commands`
- Bot Permissions:
  - Read Messages/View Channels
  - Send Messages
  - Manage Messages (for deletion)
  - Read Message History
  - Embed Links
  - Use Slash Commands

Or use this URL template:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274878220352&scope=bot%20applications.commands
```

## Quick Start Guide

### 1. Set Up Moderator Channel
This is where the bot will send alerts about moderation actions:
```
/config moderator-channel channel:#mod-logs
```

### 2. Add Channels to Monitor
Select which channels the bot should watch:
```
/config channels add channel:#general
/config channels add channel:#off-topic
```

### 3. Create Moderation Rules
Add rules to automatically moderate content:

**Block specific words:**
```
/rules add type:Keyword pattern:badword action:Delete & Flag
```

**Detect spam:**
```
/rules add type:Spam Detection action:Delete
```

**Catch excessive caps:**
```
/rules add type:Caps Lock Spam action:Warn
```

**Use regex for advanced patterns:**
```
/rules add type:Regular Expression pattern:\b(spam|scam)\b action:Delete & Flag
```

### 4. Configure Settings
Adjust bot behavior:
```
/config auto-delete enabled:true
/config flag-threshold threshold:3
```

## Commands Reference

### Configuration Commands
- `/config channels add` - Add a channel to monitor
- `/config channels remove` - Remove a monitored channel
- `/config channels list` - List all monitored channels
- `/config moderator-channel` - Set where to send moderation alerts
- `/config auto-delete` - Enable/disable automatic message deletion
- `/config flag-threshold` - Set how many flags trigger moderator alert
- `/config view` - View current server configuration

### Rule Management
- `/rules add` - Create a new moderation rule
- `/rules remove` - Delete a rule by ID
- `/rules list` - Show all active rules
- `/rules toggle` - Enable or disable a rule

### User Flag Management
- `/flags view` - Check flags for a specific user
- `/flags list` - List all flagged users
- `/flags add` - Manually flag a user
- `/flags remove` - Clear flags from a user

### Logging
- `/logs recent` - View recent moderation actions
- `/logs user` - View logs for a specific user

### Help
- `/help` - Display command help and bot information

## Rule Types Explained

### Keyword
Matches exact words or phrases (case-insensitive):
- Pattern: `badword`
- Matches: "badword", "BADWORD", "BadWord"

### Regular Expression
Advanced pattern matching using regex:
- Pattern: `\b(spam|scam)\b`
- Matches: "spam", "scam" as whole words
- Pattern: `h[a@]ck`
- Matches: "hack", "h@ck"

### Spam Detection
Automatically detects:
- Repeated characters (e.g., "aaaaaaa")
- Repeated words (same word 5+ times)
- Common spam patterns

### Caps Lock Spam
Detects messages that are 70%+ uppercase letters (minimum 10 characters)

## Action Types

| Action | Description |
|--------|-------------|
| **Delete** | Removes the offending message |
| **Flag** | Adds a flag to the user's record |
| **Delete & Flag** | Both removes message and flags user |
| **Warn** | Sends a DM warning to the user |

## Database Schema

The bot uses SQLite with the following tables:

- **guilds** - Server configurations
- **monitored_channels** - Channels being watched
- **moderation_logs** - All moderation actions
- **user_flags** - User flag records
- **moderation_rules** - Active moderation rules

Data is stored in `./data/bot.db` by default.

## Development

### Running in Development Mode
```bash
npm run dev
```

This uses Node's `--watch` flag to automatically restart on file changes.

### Project Structure
```
DiscordModBot/
├── src/
│   ├── commands/         # Slash command handlers
│   │   ├── config.js
│   │   ├── rules.js
│   │   ├── flags.js
│   │   ├── logs.js
│   │   └── help.js
│   ├── events/           # Discord event handlers
│   │   ├── ready.js
│   │   ├── messageCreate.js
│   │   ├── guildCreate.js
│   │   ├── guildDelete.js
│   │   └── interactionCreate.js
│   ├── database/         # Database management
│   │   └── DatabaseManager.js
│   ├── utils/            # Utility modules
│   │   ├── logger.js
│   │   └── moderationEngine.js
│   ├── index.js          # Main bot entry point
│   └── deploy-commands.js # Command deployment script
├── data/                 # Database files (auto-created)
├── logs/                 # Log files (auto-created)
├── .env                  # Environment variables (create from .env.example)
├── .env.example          # Example environment configuration
├── .gitignore
├── package.json
└── README.md
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal | Required |
| `CLIENT_ID` | Application client ID | Required |
| `DB_PATH` | Path to SQLite database file | `./data/bot.db` |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | `info` |

## Troubleshooting

### Bot doesn't respond to commands
- Ensure you've run `npm run deploy` to register slash commands
- Check that the bot has the "Use Application Commands" permission
- Verify `CLIENT_ID` in `.env` is correct

### Bot can't read messages
- Enable "Message Content Intent" in Discord Developer Portal
- Restart the bot after enabling

### Commands not appearing
- Wait a few minutes after deploying (global commands can take up to 1 hour)
- Try kicking and re-inviting the bot

### Database errors
- Ensure the `data` directory exists and is writable
- Check disk space availability

## Security Notes

- **Never commit your `.env` file** - it contains sensitive tokens
- **Rotate your bot token** if it's ever exposed
- **Use environment variables** for all sensitive data
- **Regular expressions** should be tested to avoid ReDoS attacks
- **Review moderation logs** regularly for false positives

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions

## Changelog

### Version 1.0.0
- Initial release
- Discord API v10 support
- SQLite database integration
- Automatic message moderation
- User flagging system
- Comprehensive logging
- Interactive slash commands
- Multiple rule types (keyword, regex, spam, caps)
- Flexible action system

---

**Note**: This bot requires Discord.js v14 and uses Discord API v10. Ensure your Node.js version is 18.0.0 or higher.
