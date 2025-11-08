# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/

# Create directories for data and logs
RUN mkdir -p /app/data /app/logs

# Set environment variables
ENV NODE_ENV=production
ENV DB_PATH=/app/data/bot.db

# Run as non-root user
RUN addgroup -g 1001 -S discord && \
    adduser -S -u 1001 -G discord discord && \
    chown -R discord:discord /app

USER discord

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('fs').statSync('/app/data/bot.db')" || exit 1

# Start the bot
CMD ["node", "src/index.js"]
