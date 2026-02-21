---
title: "Disaster Recovery for Self-Hosting"
description: "Plan and test disaster recovery for your homelab — restore from backups, handle disk failures, and get self-hosted services back online fast."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["backup", "disaster-recovery", "homelab", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Disaster Recovery?

Disaster recovery (DR) is your plan for getting services back online after a failure. Backups protect your data; disaster recovery gets you running again. A backup without a tested restore process is just a hope.

The goal: if your server dies tonight, how fast can you be back online? With a solid DR plan, the answer is hours, not days.

## Prerequisites

- Working backups in place ([3-2-1 Backup Rule](/foundations/backup-3-2-1-rule/))
- A Linux server ([Getting Started](/foundations/getting-started/))
- Docker Compose knowledge ([Docker Compose Basics](/foundations/docker-compose-basics/))

## Disaster Scenarios

| Scenario | Severity | Recovery Time |
|----------|----------|---------------|
| Container crash | Low | Minutes (auto-restart) |
| Corrupted database | Medium | 30–60 min (restore from backup) |
| Disk failure (single) | Medium-High | 1–4 hours (replace disk, restore) |
| Total server failure | High | 2–8 hours (new server, restore everything) |
| Ransomware/compromise | Critical | 4–24 hours (clean install, restore from offline backup) |
| Data center/power outage | Critical | Minutes to hours (wait, or failover) |

## The DR Document

Create a disaster recovery document and store it **outside your server** — in a password manager, printed, or in cloud storage. If your server is dead, you need this document accessible from another device.

```markdown
# Disaster Recovery Plan — [Your Homelab]
Last tested: YYYY-MM-DD

## Server Details
- Hardware: [description]
- OS: Ubuntu 24.04 LTS
- IP: 192.168.1.50
- Domain: example.com
- SSH key location: [where your SSH private key is backed up]

## Backup Locations
- Local: /mnt/backup-drive (USB external or second internal drive)
- Remote: Backblaze B2 bucket [bucket-name]
- Backup tool: restic (repo password in password manager under "Restic Backup")

## Service Inventory
| Service | Data Directory | Compose Location | Priority |
|---------|---------------|------------------|----------|
| Nginx Proxy Manager | /opt/npm/data | /opt/npm | P0 (restore first) |
| Vaultwarden | /opt/vaultwarden/data | /opt/vaultwarden | P0 |
| Nextcloud | /opt/nextcloud/data | /opt/nextcloud | P1 |
| Jellyfin | /opt/jellyfin/config | /opt/jellyfin | P2 |
| PostgreSQL | /opt/postgres/data | /opt/postgres | P0 (dependency) |

## Recovery Steps
[See sections below]
```

## Recovery Procedures

### Scenario 1: Container Won't Start

**Symptoms:** `docker compose up -d` fails, container in restart loop.

```bash
# Check logs
docker compose logs --tail=50 myservice

# Check container status
docker compose ps

# Common fixes:
# 1. Permission issue on volume
chown -R 1000:1000 /opt/myservice/data

# 2. Port conflict
sudo ss -tlnp | grep :8080
# If another process has the port, stop it or change the port mapping

# 3. Corrupted config
# Restore config from backup:
restic restore latest --include /opt/myservice/config --target /tmp/restore
cp /tmp/restore/opt/myservice/config/* /opt/myservice/config/

# 4. Image issue — pull fresh
docker compose pull
docker compose up -d
```

### Scenario 2: Database Corruption

**Symptoms:** App shows errors, database won't start, integrity check fails.

```bash
# Stop the app (not the database)
docker compose stop myapp

# For PostgreSQL — try a repair first
docker exec postgres pg_isready
docker exec postgres pg_dump -U myuser mydb > /tmp/test-dump.sql

# If dump succeeds — database is probably fine, issue is elsewhere

# If dump fails — restore from backup:
docker compose down

# Restore database volume
restic restore latest --include /opt/postgres/data --target /tmp/restore
rm -rf /opt/postgres/data/*
cp -a /tmp/restore/opt/postgres/data/* /opt/postgres/data/

# Restart
docker compose up -d
```

For SQL-level backups (recommended over volume backups for databases):

```bash
# Restore from SQL dump
docker compose up -d db   # Start only the database
cat backup.sql | docker exec -i postgres psql -U myuser mydb
docker compose up -d      # Start everything else
```

### Scenario 3: Disk Failure

**Symptoms:** I/O errors in logs, files inaccessible, `dmesg` shows disk errors.

```bash
# Check disk health
sudo smartctl -a /dev/sda

# Check filesystem
sudo dmesg | grep -i error

# If disk is failing — don't write to it
# Boot from USB or connect new disk
```

**Recovery steps:**

1. Install fresh OS on new disk (or replacement)
2. Install Docker and Docker Compose
3. Restore from backup (see "Full Server Recovery" below)

### Scenario 4: Full Server Recovery

This is the big one. Your server is gone — hardware failure, theft, fire. You need to rebuild from scratch.

**Step 1: New Server Setup (30–60 min)**

```bash
# Install Ubuntu 24.04 LTS
# Set static IP
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose (included with Docker Engine now)
docker compose version

# Install your backup tool
sudo apt install restic

# Set up SSH (restore your key or generate new)
```

**Step 2: Restore Configuration (15–30 min)**

```bash
# Initialize restic connection to your remote backup
export RESTIC_REPOSITORY="b2:your-bucket-name"
export RESTIC_PASSWORD="your-repo-password"
export B2_ACCOUNT_ID="your-account-id"
export B2_ACCOUNT_KEY="your-account-key"

# List available snapshots
restic snapshots

# Restore all service directories
restic restore latest --target /

# Or restore selectively (recommended — restore in priority order)
restic restore latest --include /opt/npm --target /
restic restore latest --include /opt/vaultwarden --target /
restic restore latest --include /opt/postgres --target /
restic restore latest --include /opt/nextcloud --target /
```

**Step 3: Restore Services (30–60 min)**

```bash
# Start services in dependency order

# 1. Databases first
cd /opt/postgres && docker compose up -d
# Wait for healthy
docker exec postgres pg_isready

# 2. Reverse proxy
cd /opt/npm && docker compose up -d

# 3. Critical services
cd /opt/vaultwarden && docker compose up -d

# 4. Everything else
cd /opt/nextcloud && docker compose up -d
cd /opt/jellyfin && docker compose up -d
```

**Step 4: Verify (15–30 min)**

```bash
# Check all containers
docker ps

# Test each service in a browser
# Check DNS records point to new IP (if IP changed)
# Test login to each service
# Verify data is present (files, passwords, media)
```

### Scenario 5: Ransomware/Compromise

**Do not restore onto the compromised system.** You don't know what's been modified.

1. **Disconnect the server from the network immediately**
2. **Take a forensic snapshot** (optional — for analysis later)
3. **Wipe and reinstall the OS from scratch**
4. **Change all passwords** — database passwords, admin accounts, SSH keys, API keys
5. **Restore from a backup that predates the compromise**
6. **Audit how the compromise happened** — check logs from before the incident

Critical: restore from an **offline** backup (one the attacker couldn't have encrypted/modified). This is why the 3-2-1 rule includes an offsite copy.

## Database Backup Strategy

Volume-level backups of database directories are unreliable — the files may be in an inconsistent state. Use logical backups instead:

### PostgreSQL

```bash
# Backup (add to cron — daily at 2 AM)
docker exec postgres pg_dumpall -U postgres | gzip > /opt/backups/postgres-$(date +%Y%m%d).sql.gz

# Restore
gunzip -c /opt/backups/postgres-20260216.sql.gz | docker exec -i postgres psql -U postgres
```

### MySQL/MariaDB

```bash
# Backup
docker exec mariadb mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --all-databases | gzip > /opt/backups/mysql-$(date +%Y%m%d).sql.gz

# Restore
gunzip -c /opt/backups/mysql-20260216.sql.gz | docker exec -i mariadb mysql -u root -p"$MYSQL_ROOT_PASSWORD"
```

### SQLite (Vaultwarden, Pihole, etc.)

```bash
# Backup — use sqlite3 .backup command, not file copy
docker exec vaultwarden sqlite3 /data/db.sqlite3 ".backup /data/backup.sqlite3"
cp /opt/vaultwarden/data/backup.sqlite3 /opt/backups/

# Or simply stop the container before copying the database file
docker compose stop vaultwarden
cp /opt/vaultwarden/data/db.sqlite3 /opt/backups/vaultwarden-$(date +%Y%m%d).sqlite3
docker compose start vaultwarden
```

## Testing Your Recovery

**An untested backup is not a backup.** Schedule recovery tests quarterly.

### Quick Test (Monthly)

```bash
# Restore a single service's data to a temp directory
restic restore latest --include /opt/nextcloud --target /tmp/restore-test

# Verify files exist and have recent timestamps
ls -la /tmp/restore-test/opt/nextcloud/data/

# Verify database backup is valid
gunzip -c /opt/backups/postgres-latest.sql.gz | head -20
# Should see valid SQL statements

# Clean up
rm -rf /tmp/restore-test
```

### Full Test (Quarterly)

If you have spare hardware or a VM:

1. Spin up a fresh server (or VM)
2. Follow your full recovery procedure
3. Time it — how long did it take?
4. Verify every service works
5. Document any issues found
6. Update your DR document

## Recovery Time Optimization

| Optimization | Impact |
|-------------|--------|
| Keep docker-compose.yml in version control (git) | No need to restore config files separately |
| Use infrastructure-as-code (Ansible playbook for server setup) | Automated server provisioning in minutes |
| Pre-pull Docker images on backup server | Skip image download time during recovery |
| Use incremental backups (restic, borg) | Faster backup = more frequent backups = less data loss |
| Document everything in the DR document | No guessing during a stressful recovery |
| Automate database dumps on a schedule | Always have a recent, consistent database backup |

## Common Mistakes

### 1. Never Testing Restores

The #1 DR mistake. Your backup might be corrupted, incomplete, or using an outdated process. Test quarterly.

### 2. Only Backing Up Data, Not Config

You need both data (database, user files) and configuration (docker-compose.yml, .env files, nginx configs). Without config, you're rebuilding from memory.

### 3. Backing Up Database Files While Running

Copying PostgreSQL's data directory while the database is running produces inconsistent files that may be unrestorable. Always use `pg_dump`/`mysqldump` or stop the database first.

### 4. Keeping All Backups on the Same Server

If the server is compromised or the disk fails, your backups are gone too. Follow the [3-2-1 rule](/foundations/backup-3-2-1-rule/): 3 copies, 2 media types, 1 offsite.

### 5. No Priority Order for Service Restoration

Restore databases and reverse proxies first. Don't waste time on Jellyfin while your password manager is down. Document priority order in your DR plan.

## FAQ

### How often should I back up?

Daily for most services. Hourly for critical data (password managers, email). Use incremental backups (restic, borg) so frequent backups are fast and space-efficient.

### Should I back up Docker images?

No. Images are pulled from registries. Back up your `docker-compose.yml` files and `.env` files instead — these define which images to pull and how to configure them.

### What's the fastest way to recover a single container?

Stop the container, restore its data directory from backup, restart. For databases, restore the SQL dump rather than the data directory.

### Do I need a separate backup server?

Ideally, yes — even a Raspberry Pi with an external drive running restic rest-server. At minimum, use an offsite cloud backup (Backblaze B2, Wasabi) so you have a copy outside your home.

### How long should I keep backups?

Keep daily backups for 7 days, weekly for 4 weeks, monthly for 12 months. Restic and borg handle retention policies automatically.

## Next Steps

- [3-2-1 Backup Rule](/foundations/backup-3-2-1-rule/) — implement proper backup strategy
- [Docker Compose Basics](/foundations/docker-compose-basics/) — understand service configuration
- [Linux Cron Jobs](/foundations/linux-cron-jobs/) — automate backup schedules

## Related

- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Linux Cron Jobs](/foundations/linux-cron-jobs/)
- [Systemd Services](/foundations/linux-systemd/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
