# Production Deployment Guide

This guide covers deploying the Discord Moderation Bot to a production server.

## Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18.0.0 or higher
- Git
- A non-root user with sudo privileges

## Installation Steps

### 1. Create a Dedicated User

```bash
sudo useradd -r -s /bin/bash -d /opt/discord-mod-bot discord-bot
sudo mkdir -p /opt/discord-mod-bot
sudo chown discord-bot:discord-bot /opt/discord-mod-bot
```

### 2. Clone and Install

```bash
sudo -u discord-bot bash << 'EOF'
cd /opt/discord-mod-bot
git clone https://github.com/Tekner/DiscordModBot.git .
npm install --production
EOF
```

### 3. Configure Environment

```bash
sudo -u discord-bot bash << 'EOF'
cd /opt/discord-mod-bot
cp .env.example .env
# Edit .env with your credentials
nano .env
EOF
```

Set the following in `.env`:
```env
DISCORD_TOKEN=your_actual_bot_token
CLIENT_ID=your_actual_client_id
DB_PATH=/opt/discord-mod-bot/data/bot.db
LOG_LEVEL=info
```

### 4. Deploy Commands

```bash
sudo -u discord-bot bash << 'EOF'
cd /opt/discord-mod-bot
npm run deploy
EOF
```

### 5. Set Up Systemd Service

```bash
# Copy service file
sudo cp deployment/discord-bot.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable discord-bot

# Start the service
sudo systemctl start discord-bot

# Check status
sudo systemctl status discord-bot
```

## Managing the Service

### View Logs

```bash
# Follow logs in real-time
sudo journalctl -u discord-bot -f

# View recent logs
sudo journalctl -u discord-bot -n 100

# View logs from today
sudo journalctl -u discord-bot --since today
```

### Control the Service

```bash
# Start
sudo systemctl start discord-bot

# Stop
sudo systemctl stop discord-bot

# Restart
sudo systemctl restart discord-bot

# Check status
sudo systemctl status discord-bot
```

## Updating

### Standard Update

```bash
# Stop the bot
sudo systemctl stop discord-bot

# Update code
sudo -u discord-bot bash << 'EOF'
cd /opt/discord-mod-bot
git pull
npm install --production
EOF

# Deploy updated commands (if changed)
sudo -u discord-bot bash << 'EOF'
cd /opt/discord-mod-bot
npm run deploy
EOF

# Start the bot
sudo systemctl start discord-bot
```

### Zero-Downtime Update (Advanced)

If you need to minimize downtime:

```bash
# Prepare update in a new directory
sudo -u discord-bot bash << 'EOF'
cd /opt
cp -r discord-mod-bot discord-mod-bot-new
cd discord-mod-bot-new
git pull
npm install --production
EOF

# Quick swap
sudo systemctl stop discord-bot
sudo mv /opt/discord-mod-bot /opt/discord-mod-bot-old
sudo mv /opt/discord-mod-bot-new /opt/discord-mod-bot
sudo systemctl start discord-bot

# Verify it's working, then cleanup
sudo rm -rf /opt/discord-mod-bot-old
```

## Backup

### Database Backup

Create a backup script:

```bash
sudo nano /usr/local/bin/backup-discord-bot.sh
```

Content:
```bash
#!/bin/bash
BACKUP_DIR="/backup/discord-bot"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp /opt/discord-mod-bot/data/bot.db "$BACKUP_DIR/bot_$DATE.db"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "bot_*.db" -mtime +30 -delete
```

Make it executable:
```bash
sudo chmod +x /usr/local/bin/backup-discord-bot.sh
```

### Automated Backups with Cron

```bash
# Edit crontab
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-discord-bot.sh
```

## Monitoring

### Check Bot Health

Create a health check script:

```bash
#!/bin/bash
if systemctl is-active --quiet discord-bot; then
    echo "Bot is running"
    exit 0
else
    echo "Bot is not running!"
    sudo systemctl start discord-bot
    exit 1
fi
```

### Log Rotation

The systemd journal handles log rotation automatically, but you can configure it:

```bash
sudo nano /etc/systemd/journald.conf
```

Set:
```ini
SystemMaxUse=1G
SystemMaxFileSize=100M
```

Then restart journald:
```bash
sudo systemctl restart systemd-journald
```

## Firewall Configuration

If using UFW:

```bash
# The bot only needs outbound connections
# Ensure outbound HTTPS is allowed
sudo ufw allow out 443/tcp
```

## Security Best Practices

1. **File Permissions**
   ```bash
   sudo chmod 600 /opt/discord-mod-bot/.env
   sudo chown discord-bot:discord-bot /opt/discord-mod-bot/.env
   ```

2. **Regular Updates**
   ```bash
   # Update system packages regularly
   sudo apt update && sudo apt upgrade
   
   # Update Node.js dependencies
   sudo -u discord-bot bash -c "cd /opt/discord-mod-bot && npm update"
   ```

3. **Monitor Logs**
   - Check logs daily for errors
   - Set up alerts for critical errors
   - Monitor disk space usage

4. **Database Backups**
   - Automate daily backups
   - Store backups off-server
   - Test restore procedures

5. **Environment Variables**
   - Never commit `.env` to git
   - Use secure token generation
   - Rotate tokens periodically

## Troubleshooting

### Bot Won't Start

```bash
# Check service status
sudo systemctl status discord-bot

# Check recent errors
sudo journalctl -u discord-bot -n 50

# Verify file permissions
sudo ls -la /opt/discord-mod-bot

# Test bot manually
sudo -u discord-bot bash << 'EOF'
cd /opt/discord-mod-bot
node src/index.js
EOF
```

### Database Issues

```bash
# Check database file
sudo -u discord-bot ls -lh /opt/discord-mod-bot/data/

# Verify database integrity
sudo -u discord-bot bash << 'EOF'
cd /opt/discord-mod-bot
sqlite3 data/bot.db "PRAGMA integrity_check;"
EOF
```

### Performance Issues

```bash
# Check resource usage
top -u discord-bot

# Check disk space
df -h

# Check database size
du -h /opt/discord-mod-bot/data/bot.db
```

## Scaling Considerations

### High-Traffic Servers

For servers with heavy message volume:

1. **Increase Database Performance**
   - Use SSD storage for database
   - Regularly VACUUM the database
   - Consider database tuning

2. **Monitor Resources**
   ```bash
   # Watch CPU and memory usage
   htop -u discord-bot
   ```

3. **Optimize Rules**
   - Remove unnecessary rules
   - Use efficient regex patterns
   - Limit monitored channels

### Multiple Bots

To run multiple bot instances:

1. Create separate directories for each bot
2. Create separate service files
3. Use different database files
4. Different Discord tokens for each

## Production Checklist

- [ ] Dedicated user account created
- [ ] Bot installed in /opt/discord-mod-bot
- [ ] Environment variables configured
- [ ] Slash commands deployed
- [ ] Systemd service installed and enabled
- [ ] Bot starts successfully
- [ ] Logs are being written
- [ ] Database is being created/updated
- [ ] Backup system configured
- [ ] Monitoring in place
- [ ] File permissions secured
- [ ] Firewall configured
- [ ] Update procedure documented

## Support

For issues specific to your deployment:
- Check application logs: `journalctl -u discord-bot`
- Check system logs: `dmesg`
- Review file permissions
- Verify environment variables

For application bugs or features, open an issue on GitHub.
