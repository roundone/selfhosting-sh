---
title: "Backup Strategy: The 3-2-1 Rule"
description: "Protect your self-hosted data with the 3-2-1 backup rule — three copies, two media types, one offsite. Complete guide."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "backup", "data-protection", "3-2-1"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Backups Matter

Self-hosting means you own your data. It also means nobody else has a copy. There is no "Restore from Google" button. No support ticket to file. If your server's boot drive dies at 2 AM, the only thing standing between you and total data loss is your backup strategy.

This is not hypothetical. Drives fail. SSDs wear out without warning. A bad `docker compose down -v` deletes named volumes permanently. Ransomware encrypts everything it can reach. A botched update corrupts your database. A power surge takes out the whole machine.

The question is not whether you will lose data. The question is whether you will have a copy when it happens.

The 3-2-1 rule is the simplest framework that actually protects you. It has been the standard in enterprise IT for decades, and it applies perfectly to self-hosted infrastructure.

## The 3-2-1 Rule Explained

The rule has three requirements:

- **3 copies** of your data (the original plus two backups)
- **2 different storage media** (not two partitions on the same drive)
- **1 offsite copy** (physically separate location)

### Three Copies

Your live data on the server counts as copy one. You need two more. If one backup is corrupted or lost, you still have another. This is basic redundancy — a single backup is a single point of failure.

### Two Different Media

"Two different media" means the backups cannot live on the same physical device as the original. Two folders on the same SSD is one copy, not two. A backup on a separate internal drive counts. A backup on an external USB drive counts. A backup on a NAS on your local network counts. The point: a single hardware failure should not take out both your data and your backup.

### One Offsite

Fire, theft, flooding, and power surges do not care how many drives you have in your server closet. One copy must be in a different physical location. This can be cloud storage, a drive at a friend's house, or a second server in a different building. If your house burns down, the offsite copy survives.

## What to Back Up

Not everything on your server needs backing up. Focus on data you cannot recreate.

### Back Up These

**Docker volumes and bind mounts.** This is where your applications store persistent data — databases, uploads, configuration, user files. If you use [bind mounts or named volumes](/foundations/docker-volumes), back up the underlying host directories.

For named volumes, find the host path:

```bash
docker volume inspect my_volume --format '{{ .Mountpoint }}'
```

**Database dumps.** Do NOT back up database files directly by copying the data directory while the database is running. You will get a corrupted backup. Instead, dump the database to a file first:

```bash
# PostgreSQL
docker exec my-postgres pg_dumpall -U postgres > /backups/postgres-$(date +%F).sql

# MySQL/MariaDB
docker exec my-mariadb mariadb-dump -u root -p"$MYSQL_ROOT_PASSWORD" --all-databases > /backups/mariadb-$(date +%F).sql

# SQLite (used by many self-hosted apps)
docker exec my-app sqlite3 /data/db.sqlite3 ".backup '/data/backup.sqlite3'"
```

**Docker Compose files and `.env` files.** These define your entire stack. Losing them means reconstructing every service configuration from memory. Store them in a dedicated directory (e.g., `/opt/stacks/`) and back up the whole thing.

**System configuration changes.** If you have modified `/etc/` files — SSH config, firewall rules, cron jobs, systemd units — back those up. A script that copies `/etc/ssh/sshd_config`, `/etc/ufw/`, and your crontab is sufficient.

### Skip These

**Container images.** They are pulled from registries. A `docker compose pull` rebuilds them. Backing up images wastes storage.

**Logs.** Unless you need audit trails, logs are disposable. Your monitoring stack can regenerate dashboards from fresh data.

**Cache directories.** Redis, temp files, thumbnail caches. Applications regenerate these.

## Backup Tools for Self-Hosters

### Restic (Recommended)

[Restic](/apps/restic) is the best backup tool for most self-hosters. It handles deduplication, encryption, and supports multiple storage backends out of the box — local directories, SFTP, Amazon S3, Backblaze B2, Wasabi, and more.

Key strengths:

- **Deduplication.** Only new or changed data is stored. Your second backup takes seconds, not hours.
- **Encryption.** All data is encrypted before it leaves your machine. Safe for cloud storage.
- **Fast.** Written in Go, single binary, no dependencies.
- **Multiple backends.** One tool backs up to local, cloud, and remote simultaneously.

Quick start:

```bash
# Initialize a local backup repository
restic init --repo /mnt/backup/restic-repo

# Back up your Docker volumes
restic -r /mnt/backup/restic-repo backup /opt/stacks /var/lib/docker/volumes

# Back up to Backblaze B2
export B2_ACCOUNT_ID="your-account-id"
export B2_ACCOUNT_KEY="your-account-key"
restic -r b2:my-backup-bucket:/restic backup /opt/stacks
```

Restic handles retention policies (keep last 7 daily, 4 weekly, 12 monthly) and prunes old snapshots automatically. See the [full Restic guide](/apps/restic) for complete Docker Compose setup and automation.

### BorgBackup / Borgmatic

[BorgBackup](/apps/borgmatic) (commonly used through its automation wrapper Borgmatic) is the other top-tier option. It offers excellent deduplication and compression, with strong community support.

Key strengths:

- **Compression.** Borg compresses backups with lz4, zstd, or zlib. Smaller backups than Restic in most cases.
- **Borgmatic.** A YAML-configured wrapper that handles scheduling, retention, pre/post hooks (database dumps), and monitoring notifications.
- **Mature.** Stable, well-documented, battle-tested in production.

The trade-off versus Restic: Borg natively supports only local and SSH backends. For cloud storage, you need to pair it with rclone. Restic supports cloud backends directly.

### Duplicati

[Duplicati](/apps/duplicati) is the GUI-based option. If you prefer configuring backups through a web interface rather than the command line, Duplicati works well.

Key strengths:

- **Web UI.** Point-and-click backup configuration.
- **Cloud support.** Native support for most cloud storage providers.
- **Encryption and deduplication.** Standard features, handled automatically.

The trade-off: Duplicati is written in C#/.NET, is heavier on resources, and historically has had stability issues with large backup sets. For small to medium setups, it is fine. For serious infrastructure, Restic or Borg is more reliable.

### Simple Scripts

For small setups (one or two apps, under 50 GB of data), a shell script with rsync works:

```bash
#!/bin/bash
# simple-backup.sh — Back up Docker stacks and volumes
set -euo pipefail

BACKUP_DIR="/mnt/external/backups/$(date +%F)"
mkdir -p "$BACKUP_DIR"

# Dump databases first
docker exec postgres pg_dumpall -U postgres > "$BACKUP_DIR/postgres.sql"

# Sync Docker Compose files and volumes
rsync -a --delete /opt/stacks/ "$BACKUP_DIR/stacks/"
rsync -a --delete /var/lib/docker/volumes/ "$BACKUP_DIR/volumes/"

# Keep only last 7 days
find /mnt/external/backups/ -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \;

echo "Backup complete: $BACKUP_DIR"
```

This is better than nothing, but it lacks deduplication (each backup is a full copy), encryption (data is stored in plain text), and integrity verification. Graduate to Restic or Borg when your setup grows. See [Docker Compose Basics](/foundations/docker-compose-basics) for structuring your stacks directory.

## Automating Backups

A backup strategy that requires you to remember to run it is not a strategy. Automate everything.

### Cron

The simplest automation. Run your backup script or Restic command on a schedule:

```bash
# Edit crontab
crontab -e

# Run backup daily at 3 AM
0 3 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
```

### systemd Timers

More robust than cron. Timers integrate with journald for logging and can handle missed runs:

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily backup

[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Run backup

[Service]
Type=oneshot
ExecStart=/opt/scripts/backup.sh
```

```bash
sudo systemctl enable --now backup.timer
```

### Borgmatic Scheduling

Borgmatic includes built-in cron/systemd integration and pre-backup hooks for database dumps. Configure everything in one YAML file:

```yaml
# /etc/borgmatic.d/config.yaml
source_directories:
  - /opt/stacks
  - /var/lib/docker/volumes

repositories:
  - path: /mnt/backup/borg-repo

hooks:
  before_backup:
    - docker exec postgres pg_dumpall -U postgres > /opt/stacks/db-dumps/postgres.sql
  after_backup:
    - echo "Backup finished at $(date)"

retention:
  keep_daily: 7
  keep_weekly: 4
  keep_monthly: 6
```

The key principle: if your backup does not run automatically, it will not run at all. Set it up once, verify it works, and forget about it — until your quarterly restore test.

## Testing Restores

A backup you have never restored is not a backup. It is a hope. You have no idea if the data is intact, if the dump is valid, or if the encryption key works until you test it.

### How to Test

1. **Restore to a temporary directory.** Never restore over live data during a test.

```bash
# Restic: restore latest snapshot to a temp directory
restic -r /mnt/backup/restic-repo restore latest --target /tmp/restore-test

# Borg: extract latest archive
borg extract /mnt/backup/borg-repo::archive-name --target /tmp/restore-test
```

2. **Verify file integrity.** Check that key files exist and have expected sizes. For database dumps, try importing into a test database:

```bash
# Verify a PostgreSQL dump is valid
createdb test_restore
psql test_restore < /tmp/restore-test/postgres.sql
dropdb test_restore
```

3. **Spin up a test stack.** Copy your Docker Compose files and restored volumes to a test directory. Change the ports to avoid conflicts. Run `docker compose up` and verify the application works.

### Schedule It

Put "test backup restore" on your calendar. Quarterly at minimum. Monthly is better. The five minutes it takes to verify a restore will save you days of pain when you need it for real.

## Offsite Backup Options

Your offsite copy is your disaster recovery plan. Pick one that matches your budget and risk tolerance.

### Cloud Storage via rclone

rclone syncs your backup repository to any cloud provider. Pair it with Restic or Borg for encrypted, deduplicated offsite backups.

| Provider | Cost (1 TB) | Egress Fees | Notes |
|----------|-------------|-------------|-------|
| Backblaze B2 | ~$5/month | $0.01/GB | Best value. S3-compatible. |
| Wasabi | ~$7/month | Free | No egress fees. Minimum 1 TB. |
| AWS S3 Glacier | ~$4/month | $0.09/GB | Cheap storage, expensive retrieval. |
| Hetzner Storage Box | ~$3.50/month | Free | SSH/SFTP access. Good for Borg. |

```bash
# Sync a Restic repo to Backblaze B2 with rclone
rclone sync /mnt/backup/restic-repo b2:my-backup-bucket/restic
```

### External USB Drive

The simplest offsite option: back up to a USB drive, take it to another location, swap it periodically. No subscription fees. Works for small setups. The downside is that it requires manual effort and your offsite copy is only as current as the last swap.

### Second Server or NAS

If you have a friend or family member who self-hosts, arrange a mutual offsite backup swap. You back up to their server over SSH/WireGuard, they back up to yours. Encrypted backups mean neither party can read the other's data. This is free and reliable if both parties keep their servers running.

## Common Mistakes

**Not testing restores.** The most common mistake. You discover your backups are corrupt exactly when you need them most. Test quarterly.

**Backing up to the same physical drive.** Two partitions on one SSD is one point of failure, not two. Use a separate device.

**Copying database files instead of dumping.** Copying PostgreSQL or MariaDB data directories while the database is running produces inconsistent, often unrestorable backups. Always use `pg_dump` or `mariadb-dump`.

**Forgetting `.env` files.** Your `.env` files contain database passwords, API keys, and secrets. Without them, a restored Docker Compose stack will not start. Back them up — encrypted.

**No retention policy.** Keeping every backup forever fills your storage. Keeping only the latest backup means you cannot recover from corruption that happened three days ago. Use a policy: 7 daily, 4 weekly, 6 monthly is a solid default.

**Skipping encryption for offsite backups.** If your backup goes to the cloud or another person's server, encrypt it. Restic and Borg encrypt by default. Raw rsync does not.

## Next Steps

Start with the basics and build up:

1. **Today:** Identify what needs backing up. List your Docker stacks, volumes, and databases.
2. **This week:** Set up Restic or Borgmatic with a local backup to a separate drive. See the [Restic guide](/apps/restic) or [Borgmatic guide](/apps/borgmatic) for full Docker Compose configurations.
3. **This month:** Add an offsite copy via cloud storage or a remote server.
4. **Quarterly:** Test a full restore. Put it on your calendar.

If you are just starting with self-hosting, read [Getting Started with Self-Hosting](/foundations/getting-started) first. For understanding how Docker stores your data, see [Docker Volumes](/foundations/docker-volumes).

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics) -- structuring your stacks for easy backup
- [Docker Volumes](/foundations/docker-volumes) -- understanding where your data lives
- [Getting Started with Self-Hosting](/foundations/getting-started) -- the complete beginner's guide
- [How to Self-Host Restic](/apps/restic) -- recommended backup tool, full setup guide
- [How to Self-Host Borgmatic](/apps/borgmatic) -- BorgBackup with automated scheduling
- [How to Self-Host Duplicati](/apps/duplicati) -- GUI-based backup for those who prefer it
- [Best Self-Hosted Backup Solutions](/best/backup) -- full comparison of all backup tools
