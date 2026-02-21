---
title: "Backing Up Docker Volumes"
description: "Back up Docker volumes and container data — named volumes, bind mounts, database dumps, automated backup scripts, and restore procedures."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["docker", "backup", "volumes", "data", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Docker Volume Backups Matter

Your Docker containers are disposable. Your data isn't. A `docker compose down -v` or a disk failure wipes everything. Volume backups are the difference between "let me restore that" and "everything is gone."

This guide covers backing up every type of Docker data — named volumes, bind mounts, and databases.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose Basics](/foundations/docker-compose-basics/))
- Understanding of Docker volumes ([Docker Volumes](/foundations/docker-volumes/))
- Understanding of the 3-2-1 backup rule ([Backup Strategy](/foundations/backup-3-2-1-rule/))

## Types of Docker Data

| Type | Where It Lives | Backup Method |
|------|---------------|---------------|
| Named volumes | `/var/lib/docker/volumes/` | Volume backup container or direct copy |
| Bind mounts | Your chosen path (e.g., `/opt/myapp/data`) | Standard file backup (rsync, tar) |
| Database data | Inside a named volume or bind mount | Database dump tool (pg_dump, mysqldump) |
| Config files | Bind-mounted from host | Standard file backup |

## Backing Up Bind Mounts

Bind mounts are the easiest to back up because they're regular directories on the host.

### Simple tar Archive

```bash
# Stop the container first (ensures consistent data)
docker compose stop myapp

# Create backup
tar -czf /backup/myapp-$(date +%Y%m%d).tar.gz -C /opt/myapp data/

# Restart
docker compose start myapp
```

### Rsync (For Incremental Backups)

```bash
# Local backup
rsync -avz /opt/myapp/data/ /backup/myapp/

# Remote backup
rsync -avz /opt/myapp/data/ user@backup-server:/backup/myapp/
```

### Without Stopping the Container

Some apps tolerate live backups. Others don't (databases especially). For live-safe apps:

```bash
rsync -avz /opt/myapp/data/ /backup/myapp/
```

For databases, always use the database's dump tool instead (see below).

## Backing Up Named Volumes

Named volumes live in `/var/lib/docker/volumes/` and need special handling.

### Method 1: Backup Container

Use a temporary container to mount the volume and create a tar archive:

```bash
# Back up a named volume to a tar file
docker run --rm \
  -v myproject_mydata:/source:ro \
  -v /backup:/backup \
  alpine tar -czf /backup/mydata-$(date +%Y%m%d).tar.gz -C /source .
```

Breaking this down:
- `-v myproject_mydata:/source:ro` — mount the named volume read-only
- `-v /backup:/backup` — mount the host backup directory
- `alpine tar ...` — create a compressed archive

### Method 2: Direct Copy

```bash
# Find the volume's path
docker volume inspect myproject_mydata --format '{{.Mountpoint}}'
# /var/lib/docker/volumes/myproject_mydata/_data

# Copy directly (requires root)
sudo tar -czf /backup/mydata-$(date +%Y%m%d).tar.gz -C /var/lib/docker/volumes/myproject_mydata/_data .
```

### Method 3: docker cp

Copy specific files from a running container:

```bash
docker cp mycontainer:/data/important-file.db /backup/
```

## Database Backups

Never back up database files by copying volume contents while the database is running. Use the database's native dump tool.

### PostgreSQL

```bash
# Dump all databases
docker exec postgres pg_dumpall -U postgres > /backup/postgres-$(date +%Y%m%d).sql

# Dump a specific database
docker exec postgres pg_dump -U postgres mydb > /backup/mydb-$(date +%Y%m%d).sql

# Compressed dump
docker exec postgres pg_dump -U postgres -Fc mydb > /backup/mydb-$(date +%Y%m%d).dump
```

### MariaDB/MySQL

```bash
# Dump all databases
docker exec mariadb mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --all-databases > /backup/mariadb-$(date +%Y%m%d).sql

# Dump a specific database
docker exec mariadb mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" mydb > /backup/mydb-$(date +%Y%m%d).sql
```

### SQLite

Many self-hosted apps use SQLite. Copy the database file while the app is stopped, or use the `.backup` command:

```bash
# Stop writes (or stop the container)
docker exec myapp sqlite3 /data/app.db ".backup /data/backup.db"
docker cp myapp:/data/backup.db /backup/app-$(date +%Y%m%d).db
```

### Redis

```bash
# Trigger a save
docker exec redis redis-cli BGSAVE

# Wait for save to complete
docker exec redis redis-cli LASTSAVE

# Copy the dump file
docker cp redis:/data/dump.rdb /backup/redis-$(date +%Y%m%d).rdb
```

## Automated Backup Script

```bash
#!/bin/bash
# /opt/scripts/backup-docker.sh
# Run daily via cron

BACKUP_DIR="/backup/docker/$(date +%Y%m%d)"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "=== Docker Backup — $(date) ==="

# 1. Database dumps (while containers are running)
echo "Dumping databases..."

# PostgreSQL for Nextcloud
docker exec nextcloud-db pg_dumpall -U postgres > "$BACKUP_DIR/nextcloud-db.sql" 2>/dev/null && \
  echo "  ✓ Nextcloud DB" || echo "  ✗ Nextcloud DB failed"

# PostgreSQL for Gitea
docker exec gitea-db pg_dumpall -U postgres > "$BACKUP_DIR/gitea-db.sql" 2>/dev/null && \
  echo "  ✓ Gitea DB" || echo "  ✗ Gitea DB failed"

# 2. Named volumes
echo "Backing up named volumes..."

VOLUMES=(
  "nextcloud_data"
  "gitea_data"
  "npm_data"
  "npm_letsencrypt"
  "vaultwarden_data"
)

for vol in "${VOLUMES[@]}"; do
  docker run --rm \
    -v "${vol}:/source:ro" \
    -v "$BACKUP_DIR:/backup" \
    alpine tar -czf "/backup/${vol}.tar.gz" -C /source . 2>/dev/null && \
    echo "  ✓ $vol" || echo "  ✗ $vol failed"
done

# 3. Bind mount configs
echo "Backing up config directories..."

CONFIG_DIRS=(
  "/opt/proxy"
  "/opt/nextcloud"
  "/opt/gitea"
)

for dir in "${CONFIG_DIRS[@]}"; do
  name=$(basename "$dir")
  tar -czf "$BACKUP_DIR/${name}-config.tar.gz" \
    --exclude='*/data' \
    --exclude='*/.git' \
    -C "$(dirname "$dir")" "$name" 2>/dev/null && \
    echo "  ✓ $name config" || echo "  ✗ $name config failed"
done

# 4. Docker Compose files (for disaster recovery)
echo "Backing up Compose files..."
find /opt -name "docker-compose.yml" -exec cp --parents {} "$BACKUP_DIR/" \; 2>/dev/null
find /opt -name ".env" -exec cp --parents {} "$BACKUP_DIR/" \; 2>/dev/null

# 5. Clean up old backups
echo "Cleaning backups older than $RETENTION_DAYS days..."
find /backup/docker/ -maxdepth 1 -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \;

# 6. Calculate backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo ""
echo "=== Backup complete: $TOTAL_SIZE ==="
```

### Schedule with Cron

```bash
# Edit crontab
sudo crontab -e

# Run backup daily at 3 AM
0 3 * * * /opt/scripts/backup-docker.sh >> /var/log/docker-backup.log 2>&1
```

See [Cron Jobs](/foundations/linux-cron-jobs/) for cron setup.

## Offsite Backup

Local backups protect against container disasters. Offsite backups protect against disk failures and physical disasters.

### Rsync to Remote Server

```bash
# Add to backup script after local backup
rsync -avz --delete /backup/docker/ backupuser@remote-server:/backup/selfhost/
```

### Rclone to Cloud Storage

```bash
# Configure rclone (one-time)
rclone config
# Set up B2, S3, or another provider

# Sync backups to cloud
rclone sync /backup/docker/ b2:my-backup-bucket/docker/ --progress
```

### Restic (Recommended for Encrypted Backups)

```bash
# Initialize repository (one-time)
restic -r b2:my-backup-bucket init

# Back up
restic -r b2:my-backup-bucket backup /backup/docker/

# Prune old snapshots (keep 7 daily, 4 weekly, 6 monthly)
restic -r b2:my-backup-bucket forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune
```

## Restore Procedures

### Restore a Bind Mount

```bash
# Stop the container
docker compose stop myapp

# Restore from tar
tar -xzf /backup/myapp-20260216.tar.gz -C /opt/myapp/data/

# Start the container
docker compose start myapp
```

### Restore a Named Volume

```bash
# Stop the container
docker compose stop myapp

# Restore the volume
docker run --rm \
  -v myproject_mydata:/target \
  -v /backup:/backup \
  alpine sh -c "rm -rf /target/* && tar -xzf /backup/mydata-20260216.tar.gz -C /target"

# Start the container
docker compose start myapp
```

### Restore a PostgreSQL Database

```bash
# Drop and recreate (WARNING: destroys current data)
docker exec -i postgres psql -U postgres -c "DROP DATABASE IF EXISTS mydb;"
docker exec -i postgres psql -U postgres -c "CREATE DATABASE mydb;"
docker exec -i postgres psql -U postgres mydb < /backup/mydb-20260216.sql

# Or restore from compressed dump
docker exec -i postgres pg_restore -U postgres -d mydb < /backup/mydb-20260216.dump
```

### Restore MariaDB/MySQL

```bash
docker exec -i mariadb mysql -u root -p"$MYSQL_ROOT_PASSWORD" < /backup/mariadb-20260216.sql
```

## Test Your Backups

An untested backup is not a backup. Schedule regular restore tests:

```bash
# Restore to a test directory
mkdir -p /tmp/backup-test
tar -xzf /backup/myapp-20260216.tar.gz -C /tmp/backup-test/

# Verify files exist and look correct
ls -la /tmp/backup-test/

# For databases, restore to a test database
docker exec -i postgres psql -U postgres -c "CREATE DATABASE test_restore;"
docker exec -i postgres psql -U postgres test_restore < /backup/mydb-20260216.sql
docker exec -i postgres psql -U postgres -c "DROP DATABASE test_restore;"

# Clean up
rm -rf /tmp/backup-test
```

## FAQ

### How often should I back up Docker volumes?

Daily for databases and important application data. Weekly for large media libraries. Always before upgrading a container to a new major version.

### Can I back up volumes while containers are running?

For file-based data (configs, media), yes — rsync handles this well. For databases, always use the database's dump tool (pg_dump, mysqldump) to ensure consistency. Never copy database files directly from a running database.

### How long should I keep backups?

Follow the 3-2-1 rule: 3 copies, 2 different media, 1 offsite. Keep 7 daily backups, 4 weekly, and 6 monthly for most self-hosted services. Adjust based on how critical the data is.

### Docker volumes or bind mounts — which is easier to back up?

Bind mounts are easier because they're regular directories you can back up with any file tool (rsync, tar, restic). Named volumes require the backup container method or knowing the volume's internal path. For backup simplicity, bind mounts are better.

## Related

- [Backup Strategy — 3-2-1 Rule](/foundations/backup-3-2-1-rule/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Disaster Recovery](/foundations/disaster-recovery/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Cron Jobs](/foundations/linux-cron-jobs/)
- [Storage Planning](/foundations/storage-planning/)
