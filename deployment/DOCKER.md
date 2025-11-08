# Docker Deployment Guide

This guide covers running the Discord Moderation Bot using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 1.29+

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tekner/DiscordModBot.git
   cd DiscordModBot
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env
   ```
   
   Set your bot credentials:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   LOG_LEVEL=info
   ```

3. **Deploy commands** (first time only)
   ```bash
   docker-compose run --rm discord-bot node src/deploy-commands.js
   ```

4. **Start the bot**
   ```bash
   docker-compose up -d
   ```

## Docker Commands

### Start the bot
```bash
docker-compose up -d
```

### Stop the bot
```bash
docker-compose down
```

### View logs
```bash
# Follow logs in real-time
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100
```

### Restart the bot
```bash
docker-compose restart
```

### Update and restart
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build
```

## Building the Image

### Build locally
```bash
docker build -t discord-mod-bot .
```

### Build with specific tag
```bash
docker build -t discord-mod-bot:v1.0.0 .
```

## Data Persistence

The Docker setup uses volumes to persist data:

- `./data` - SQLite database
- `./logs` - Application logs

These directories are created automatically and persist between container restarts.

## Deployment Commands

When updating commands or first deploying:

```bash
# Deploy commands using Docker
docker-compose run --rm discord-bot node src/deploy-commands.js
```

## Resource Management

### Check resource usage
```bash
docker stats discord-mod-bot
```

### Modify resource limits
Edit `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '2'        # Increase CPU limit
      memory: 1024M    # Increase memory limit
```

Then restart:
```bash
docker-compose up -d
```

## Backup and Restore

### Backup database
```bash
# Create backup directory
mkdir -p backups

# Copy database from container
docker cp discord-mod-bot:/app/data/bot.db backups/bot-$(date +%Y%m%d).db
```

### Restore database
```bash
# Stop the bot
docker-compose down

# Restore database
cp backups/bot-20231201.db data/bot.db

# Start the bot
docker-compose up -d
```

### Automated backups
Create a backup script:

```bash
#!/bin/bash
# backup-docker-bot.sh

BACKUP_DIR="/backup/discord-bot"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER="discord-mod-bot"

mkdir -p $BACKUP_DIR

# Backup database
docker cp $CONTAINER:/app/data/bot.db "$BACKUP_DIR/bot_$DATE.db"

# Compress old backups
find $BACKUP_DIR -name "bot_*.db" -mtime +7 -exec gzip {} \;

# Delete old compressed backups
find $BACKUP_DIR -name "bot_*.db.gz" -mtime +30 -delete

echo "Backup completed: bot_$DATE.db"
```

Add to crontab:
```bash
0 2 * * * /path/to/backup-docker-bot.sh
```

## Monitoring

### Health check
```bash
# Check if container is healthy
docker inspect discord-mod-bot --format='{{.State.Health.Status}}'
```

### Container status
```bash
docker-compose ps
```

### Real-time stats
```bash
watch docker stats discord-mod-bot
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs

# Check Docker daemon
sudo systemctl status docker

# Verify environment variables
docker-compose config
```

### Permission issues
```bash
# Fix data directory permissions
sudo chown -R 1001:1001 data logs

# Or use current user
sudo chown -R $(id -u):$(id -g) data logs
```

### Database locked
```bash
# Stop the container
docker-compose down

# Wait a moment, then start
sleep 5
docker-compose up -d
```

### Out of memory
```bash
# Check memory usage
docker stats discord-mod-bot

# Increase memory limit in docker-compose.yml
# Then restart
docker-compose up -d
```

## Production Deployment

### Using Docker Swarm

1. **Initialize swarm** (if not already)
   ```bash
   docker swarm init
   ```

2. **Create secrets**
   ```bash
   echo "your_token_here" | docker secret create discord_token -
   echo "your_client_id" | docker secret create client_id -
   ```

3. **Deploy stack**
   ```bash
   docker stack deploy -c docker-compose.yml discord-bot
   ```

### Using Kubernetes

Create a deployment file `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: discord-mod-bot
spec:
  replicas: 1
  selector:
    matchLabels:
      app: discord-mod-bot
  template:
    metadata:
      labels:
        app: discord-mod-bot
    spec:
      containers:
      - name: discord-mod-bot
        image: discord-mod-bot:latest
        env:
        - name: DISCORD_TOKEN
          valueFrom:
            secretKeyRef:
              name: discord-secrets
              key: token
        - name: CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: discord-secrets
              key: client-id
        volumeMounts:
        - name: data
          mountPath: /app/data
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: discord-bot-data
```

## Environment Variables

All environment variables from `.env` are passed to the container:

| Variable | Required | Default |
|----------|----------|---------|
| DISCORD_TOKEN | Yes | - |
| CLIENT_ID | Yes | - |
| DB_PATH | No | /app/data/bot.db |
| LOG_LEVEL | No | info |

## Networking

The bot only needs outbound internet access. No ports need to be exposed.

If you need to isolate the bot:

```yaml
services:
  discord-bot:
    # ... other config ...
    networks:
      - bot-network

networks:
  bot-network:
    driver: bridge
```

## Multi-Bot Setup

To run multiple bot instances:

1. **Copy the directory**
   ```bash
   cp -r DiscordModBot DiscordModBot-2
   cd DiscordModBot-2
   ```

2. **Update .env** with different credentials

3. **Change container name** in `docker-compose.yml`:
   ```yaml
   container_name: discord-mod-bot-2
   ```

4. **Start the second instance**
   ```bash
   docker-compose up -d
   ```

## CI/CD Integration

### GitHub Actions example

```yaml
name: Deploy Bot

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and push
        run: |
          docker build -t discord-mod-bot:latest .
          # Push to your registry
      
      - name: Deploy to server
        # SSH into server and update
```

## Best Practices

1. **Use specific tags** instead of `latest` in production
2. **Monitor container health** regularly
3. **Implement log rotation** to prevent disk issues
4. **Backup database** before updates
5. **Test updates** in staging environment first
6. **Use secrets** for sensitive data
7. **Set resource limits** appropriately
8. **Monitor disk usage** of volumes

## Security

1. **Run as non-root** (already configured in Dockerfile)
2. **Use read-only root filesystem** where possible
3. **Scan images** for vulnerabilities:
   ```bash
   docker scan discord-mod-bot
   ```
4. **Keep base images updated**
5. **Don't commit .env** file

## Performance Tuning

### For high-traffic servers

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 1024M
    reservations:
      cpus: '1'
      memory: 512M
```

### For multiple servers

Consider using Docker Swarm or Kubernetes for orchestration and scaling.

## Getting Help

- Check logs: `docker-compose logs`
- Inspect container: `docker inspect discord-mod-bot`
- Shell access: `docker exec -it discord-mod-bot sh`
- Review GitHub issues

## Additional Resources

- [Docker documentation](https://docs.docker.com/)
- [Docker Compose documentation](https://docs.docker.com/compose/)
- [Best practices for Node.js in Docker](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
