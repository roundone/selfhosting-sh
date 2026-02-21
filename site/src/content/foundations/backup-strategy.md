---
title: "Self-Hosted Backup Strategy Guide"
description: "Complete backup strategy for self-hosted infrastructure — tools, automation, schedules, offsite storage, and restore testing."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "foundations"
apps: ["restic", "borgbackup", "kopia", "duplicati"]
tags: ["foundations", "backup", "data-protection", "self-hosted", "disaster-recovery"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why You Need a Backup Strategy

Self-hosting means your data lives on hardware you control. That's the point. But it also means there's no "contact support" button when things go wrong. A failed drive, a bad update, an accidental `docker compose down -v`, or ransomware — any of these can destroy everything.

A backup strategy is the plan that turns "disaster" into "minor inconvenience." This guide covers the tools, the schedule, the automation, and the testing that makes your self-hosted setup resilient.

## The 3-2-1 Rule

Every backup strategy starts with the 3-2-1 rule:

| Rule | Meaning | Why |
|------|---------|-----|
| **3 copies** | Your live data + 2 backups | One backup can fail. Two failing simultaneously is extremely unlikely. |
| **2 media types** | Store backups on different physical media (SSD + HDD, local + cloud) | A power surge that kills your SSD won't touch your HDD in a different machine. |
| **1 offsite** | At least one backup physically away from your server | A fire, flood, or theft takes out everything in one location. |

For a deeper dive into implementing the 3-2-1 rule with specific examples, see [The 3-2-1 Backup Rule Explained](/foundations/backup-3-2-1-rule/).

## What to Back Up

Not everything on your server needs the same backup treatment.

| Data Type | Priority | Backup Frequency | Examples |
|-----------|----------|-----------------|----------|
| **Application databases** | Critical | Every 4-6 hours | PostgreSQL, MariaDB, SQLite databases |
| **User-generated content** | Critical | Daily | Photos (Immich), documents (Paperless-ngx), notes (BookStack) |
| **Configuration files** | High | Daily or on change | Docker Compose files, `.env` files, reverse proxy configs |
| **Docker volumes** | High | Daily | Named volumes with persistent app state |
| **Media libraries** | Medium | Weekly | Jellyfin/Plex media (often replaceable from original sources) |
| **Container images** | Low | Not needed | Pulled from registries on demand |
| **Logs** | Low | Optional | Rotate and archive if needed for compliance |

**Rule of thumb:** If losing it would cost you more than 30 minutes to recreate, back it up. If losing it would be permanent (photos, personal data), back it up with the highest priority.

For Docker-specific backup procedures (named volumes, bind mounts, database dumps), see [Backing Up Docker Volumes](/foundations/backup-docker-volumes/).

## Backup Tools Compared

| Tool | Type | Deduplication | Encryption | Compression | Docker Image | Best For |
|------|------|--------------|------------|-------------|-------------|----------|
| **Restic** | CLI | Yes (content-defined) | AES-256 (always on) | zstd | `restic/restic:0.18.1` | Most self-hosters — fast, simple, works with every backend |
| **BorgBackup** | CLI | Yes (content-defined) | AES-256 (optional) | lz4/zstd/zlib | `b3vis/borgmatic:1.9.12` (via Borgmatic) | Large datasets — best dedup ratio, mature |
| **Kopia** | CLI + GUI | Yes | AES-256 (optional) | Multiple algorithms | `kopia/kopia:0.22.3` | Users who want a web UI for managing backups |
| **Duplicati** | GUI | Yes (block-level) | AES-256 | Zip | `lscr.io/linuxserver/duplicati:v2.1.0.108` | Beginners — point-and-click web interface |

### Our Recommendation

**Restic** is the best choice for most self-hosters. It's fast, always encrypts your data, supports every major storage backend (local, S3, SFTP, Backblaze B2, Wasabi, rclone), and has excellent documentation. Borgmatic (BorgBackup with a config file wrapper) is the runner-up for users who want slightly better dedup ratios on very large datasets.

## Storage Backends

Where you send your backups matters as much as how you create them.

| Backend | Cost | Speed | Offsite | Setup Complexity |
|---------|------|-------|---------|-----------------|
| **Local HDD/SSD** | One-time hardware cost | Fast | No | Lowest |
| **USB external drive** | $50-150 | Fast | Manual (rotate drives) | Low |
| **NAS (Synology, TrueNAS)** | $200-500+ | Fast (LAN) | No (unless remote NAS) | Medium |
| **Backblaze B2** | $0.006/GB/mo | Medium | Yes | Low |
| **Wasabi** | $0.0069/GB/mo, no egress fees | Medium | Yes | Low |
| **SFTP to second server** | Cost of second server | Medium | Yes | Medium |
| **Hetzner Storage Box** | From €3.81/mo for 1TB | Medium | Yes | Low |
| **S3-compatible (MinIO)** | Self-hosted | Fast (LAN) | Depends on location | Medium |

### Cost-Effective Offsite Strategy

For most self-hosters, the cheapest reliable offsite setup is:

1. **Primary backup:** Local HDD or NAS (fast restores)
2. **Offsite backup:** Backblaze B2 or Hetzner Storage Box (disaster recovery)

At Backblaze B2 rates, 500GB of backup data costs about $3/month. That's cheap insurance.

## Backup Schedule

| What | How Often | When | Retention |
|------|-----------|------|-----------|
| Database dumps | Every 6 hours | 00:00, 06:00, 12:00, 18:00 UTC | 7 days of 6-hourly, 4 weeks of daily, 6 months of weekly |
| Docker volumes | Daily | 02:00 UTC (low activity) | 7 daily, 4 weekly, 12 monthly |
| Config files | On change + daily | 03:00 UTC | 30 daily, 12 monthly |
| Full system | Weekly | Sunday 04:00 UTC | 4 weekly, 6 monthly |

**Stagger your backups.** Don't run everything at midnight. Spread jobs across the early morning hours to avoid I/O contention that slows down your services.

## Automating Backups with Restic

Here's a practical setup using Restic with a local backup target and Backblaze B2 for offsite.

### Local Backup Script

Create `/opt/backups/backup.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/mnt/backup/restic-repo"
RESTIC_PASSWORD_FILE="/opt/backups/.restic-password"

# Back up Docker volumes
restic -r "$BACKUP_DIR" --password-file "$RESTIC_PASSWORD_FILE" \
  backup /var/lib/docker/volumes \
  --tag docker-volumes \
  --exclude="*.tmp" \
  --exclude="*.log"

# Back up configuration
restic -r "$BACKUP_DIR" --password-file "$RESTIC_PASSWORD_FILE" \
  backup /opt/docker /etc/docker \
  --tag config

# Prune old snapshots (keep 7 daily, 4 weekly, 6 monthly)
restic -r "$BACKUP_DIR" --password-file "$RESTIC_PASSWORD_FILE" \
  forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune
```

### Database Dump Script

Create `/opt/backups/dump-databases.sh`:

```bash
#!/bin/bash
set -euo pipefail

DUMP_DIR="/opt/backups/db-dumps"
mkdir -p "$DUMP_DIR"

# PostgreSQL (used by Immich, Nextcloud, etc.)
docker exec postgres pg_dumpall -U postgres > "$DUMP_DIR/postgres-$(date +%Y%m%d-%H%M).sql"

# MariaDB (used by BookStack, etc.)
docker exec mariadb mariadb-dump --all-databases -u root -p"$MARIADB_ROOT_PASSWORD" > "$DUMP_DIR/mariadb-$(date +%Y%m%d-%H%M).sql"

# Clean up dumps older than 7 days
find "$DUMP_DIR" -name "*.sql" -mtime +7 -delete
```

### Systemd Timer (Preferred Over Cron)

Create `/etc/systemd/system/backup.service`:

```ini
[Unit]
Description=Run Restic backup
After=docker.service

[Service]
Type=oneshot
ExecStart=/opt/backups/backup.sh
Environment=HOME=/root
```

Create `/etc/systemd/system/backup.timer`:

```ini
[Unit]
Description=Daily backup at 2 AM

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
```

Enable with:

```bash
systemctl daemon-reload
systemctl enable --now backup.timer
```

## Testing Restores

**A backup you haven't tested is not a backup.** Schedule restore tests monthly.

### Restore Test Checklist

| Step | Command | What to Verify |
|------|---------|---------------|
| List snapshots | `restic -r /path/to/repo snapshots` | Snapshots exist and are recent |
| Restore to temp dir | `restic -r /path/to/repo restore latest --target /tmp/restore-test` | Files are intact and readable |
| Verify database dump | `psql -f /tmp/restore-test/dump.sql` (on test instance) | Database restores without errors |
| Check file counts | `find /tmp/restore-test -type f \| wc -l` | File count matches expectations |
| Verify integrity | `restic -r /path/to/repo check` | No corruption in repository |

### Automate Restore Verification

Add this to your backup script:

```bash
# Verify repository integrity after backup
restic -r "$BACKUP_DIR" --password-file "$RESTIC_PASSWORD_FILE" check

# Verify latest snapshot is readable
restic -r "$BACKUP_DIR" --password-file "$RESTIC_PASSWORD_FILE" \
  ls latest | tail -5
```

## Monitoring Backups

A backup that silently fails is worse than no backup — it gives you false confidence.

| Monitoring Method | Tool | How |
|------------------|------|-----|
| Heartbeat monitoring | [Uptime Kuma](/apps/uptime-kuma/), [Healthchecks.io](/apps/healthchecks/) | Backup script pings a URL on success. Alert if no ping received. |
| Systemd timer status | `systemctl list-timers` | Check that backup timer last triggered recently |
| Backup age check | Custom script | Alert if newest snapshot is older than 48 hours |
| Disk space monitoring | [Netdata](/apps/netdata/), [Beszel](/apps/beszel/) | Alert if backup volume drops below 20% free |

### Healthchecks Integration

Add to the end of your backup script:

```bash
# Notify healthcheck on success
curl -fsS --retry 3 https://hc-ping.com/YOUR-UUID-HERE > /dev/null

# Or for Uptime Kuma push monitor
curl -fsS "http://uptime-kuma:3001/api/push/YOUR-TOKEN?status=up&msg=OK" > /dev/null
```

## Common Mistakes

| Mistake | Why It's Bad | Fix |
|---------|-------------|-----|
| Only backing up to the same disk | Drive failure takes live data AND backup | Use a separate physical drive or offsite storage |
| No encryption on offsite backups | Anyone who accesses the storage can read your data | Restic encrypts by default. BorgBackup: use `--encryption repokey` |
| Never testing restores | You discover your backups are corrupted when you need them most | Schedule monthly restore tests |
| Backing up running databases by copying files | Results in corrupted, unusable database backups | Always use `pg_dump`/`mariadb-dump` for database backups |
| No retention policy | Backup storage grows forever until the disk is full | Set `--keep-daily 7 --keep-weekly 4 --keep-monthly 6` |
| Running backups during peak hours | Backup I/O slows down your services | Schedule backups for early morning (02:00-05:00) |
| Forgetting `.env` files | Losing environment variables means losing app configuration | Include `/opt/docker/` (or wherever your compose files live) in backups |

## Next Steps

1. **Pick a tool.** [Restic](/apps/restic/) for most people. [Kopia](/apps/kopia/) if you want a web UI.
2. **Set up local backup.** Get a working backup to a local HDD or NAS first.
3. **Add offsite.** Configure Backblaze B2 or another cloud backend as your second target.
4. **Automate.** Set up systemd timers so backups run without you thinking about it.
5. **Monitor.** Integrate with [Uptime Kuma](/apps/uptime-kuma/) or similar to alert on failures.
6. **Test.** Restore from backup at least once a month to verify it works.

## Related

- [The 3-2-1 Backup Rule Explained](/foundations/backup-3-2-1-rule/)
- [Backing Up Docker Volumes](/foundations/backup-docker-volumes/)
- [Best Self-Hosted Backup Tools](/best/backup/)
- [How to Self-Host Restic](/apps/restic/)
- [How to Self-Host Kopia](/apps/kopia/)
- [How to Self-Host Duplicati](/apps/duplicati/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Security Hardening](/foundations/security-hardening/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
