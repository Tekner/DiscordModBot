require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const DatabaseManager = require('./database/DatabaseManager');
const Logger = require('./utils/logger');
const ModerationEngine = require('./utils/moderationEngine');

// Validate required environment variables
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN is required in .env file');
  process.exit(1);
}

// Initialize logger
const logger = new Logger(process.env.LOG_LEVEL || 'info');

// Initialize database
const dbPath = process.env.DB_PATH || './data/bot.db';
const database = new DatabaseManager(dbPath);
logger.info(`📁 Database initialized at ${dbPath}`);

// Initialize moderation engine
const moderationEngine = new ModerationEngine(database, logger);

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    logger.info(`✅ Loaded command: ${command.data.name}`);
  } else {
    logger.warn(`⚠️  Command at ${filePath} is missing required "data" or "execute" property`);
  }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, database, logger, moderationEngine));
  } else {
    client.on(event.name, (...args) => event.execute(...args, database, logger, moderationEngine));
  }
  
  logger.info(`✅ Loaded event: ${event.name}`);
}

// Error handling
client.on('error', error => {
  logger.error('Discord client error', { error: error.message, stack: error.stack });
});

process.on('unhandledRejection', error => {
  logger.error('Unhandled promise rejection', { error: error.message, stack: error.stack });
});

process.on('SIGINT', () => {
  logger.info('⚠️  Received SIGINT signal, shutting down gracefully...');
  database.close();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('⚠️  Received SIGTERM signal, shutting down gracefully...');
  database.close();
  client.destroy();
  process.exit(0);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    logger.info('🚀 Bot is starting...');
  })
  .catch(error => {
    logger.error('Failed to login', { error: error.message });
    process.exit(1);
  });
