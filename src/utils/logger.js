const fs = require('fs');
const path = require('path');

class Logger {
  constructor(logLevel = 'info') {
    this.logLevel = logLevel;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    this.logFile = path.join(logsDir, `bot-${new Date().toISOString().split('T')[0]}.log`);
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    let logMsg = `[${timestamp}] [${levelStr}] ${message}`;
    
    if (data) {
      logMsg += ' ' + JSON.stringify(data);
    }
    
    return logMsg;
  }

  writeToFile(message) {
    fs.appendFileSync(this.logFile, message + '\n');
  }

  error(message, data = null) {
    if (this.shouldLog('error')) {
      const formatted = this.formatMessage('error', message, data);
      console.error(formatted);
      this.writeToFile(formatted);
    }
  }

  warn(message, data = null) {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message, data);
      console.warn(formatted);
      this.writeToFile(formatted);
    }
  }

  info(message, data = null) {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message, data);
      console.log(formatted);
      this.writeToFile(formatted);
    }
  }

  debug(message, data = null) {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message, data);
      console.log(formatted);
      this.writeToFile(formatted);
    }
  }
}

module.exports = Logger;
