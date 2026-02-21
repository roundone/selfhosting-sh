---
title: "How to Self-Host Restic Backup"
description: "Complete guide to setting up Restic for self-hosted backups, including Docker volumes, remote repositories, encryption, and automation."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "backup"
apps:
  - restic
tags:
  - self-hosted
  - backup
  - restic
  - docker
  - encryption
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Restic?

[Restic](https://restic.net) is a fast, secure, and efficient backup program. It encrypts all data by default, deduplicates at the block level, and supports a wide range of storage backends — local disk, SFTP, S3 (and compatible), Backblaze B2, Azure, Google Cloud Storage, and more. Restic replaces paid backup services like Backblaze Personal and CrashPlan while giving you full control over your data and encryption keys.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker installed ([guide](/foundations/docker-compose-basics)) — or install Restic directly
- Storage destination for backups (local disk, NAS, S3 bucket, SFTP server)
- Data to back up (Docker volumes, config files, databases)

## Installation

### Option 1: Docker (for backing up Docker volumes)

Use the `restic/restic` Docker image to back up other containers' volumes:

```yaml
services:
  restic:
    image: restic/restic:0.18.1
    container_name: restic
    entrypoint: /bin/sh
    command: ["-c", "crond -f -d 8"]
    restart: unless-stopped
    environment:
      RESTIC_REPOSITORY: "/backups"
      RESTIC_PASSWORD: "your-strong-encryption-password"  # CHANGE THIS
    volumes:
      - restic-backups:/backups           # Where backup data is stored
      - /var/lib/docker/volumes:/source:ro # Docker volumes to back up
      - ./restic-crontab:/etc/crontabs/root:ro

volumes:
  restic-backups:
```

Create a `restic-crontab` file for automated backups:

```
# Run backup every day at 2 AM
0 2 * * * restic backup /source --verbose >> /var/log/restic.log 2>&1

# Prune old snapshots weekly (keep 7 daily, 4 weekly, 6 monthly)
0 3 * * 0 restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune >> /var/log/restic.log 2>&1
```

### Option 2: Direct Install (recommended for most setups)

Install Restic directly on the host for maximum flexibility:

```bash
# Ubuntu/Debian
sudo apt install restic

# Or download the latest binary
curl -L https://github.com/restic/restic/releases/download/v0.18.1/restic_0.18.1_linux_amd64.bz2 | bunzip2 > /usr/local/bin/restic
chmod +x /usr/local/bin/restic
```

## Initial Setup

### 1. Initialize a Repository

A repository is where Restic stores your encrypted backup data. Initialize one:

```bash
# Local directory
export RESTIC_REPOSITORY="/mnt/backup-drive/restic-repo"
export RESTIC_PASSWORD="your-strong-encryption-password"
restic init

# SFTP (remote server)
export RESTIC_REPOSITORY="sftp:user@backup-server:/backups/restic"
restic init

# S3-compatible (MinIO, Wasabi, Backblaze B2 via S3)
export RESTIC_REPOSITORY="s3:s3.amazonaws.com/your-bucket-name"
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
restic init

# Backblaze B2 (native)
export RESTIC_REPOSITORY="b2:your-bucket-name:/restic"
export B2_ACCOUNT_ID="your-account-id"
export B2_ACCOUNT_KEY="your-account-key"
restic init
```

**Critical:** Store your `RESTIC_PASSWORD` somewhere safe. Without it, your backups are permanently inaccessible. There is no password recovery.

### 2. Run Your First Backup

```bash
# Back up a directory
restic backup /home/user/data

# Back up Docker volumes
restic backup /var/lib/docker/volumes

# Back up multiple directories
restic backup /opt/selfhosted /home/user/documents /etc

# Exclude specific patterns
restic backup /home --exclude="*.tmp" --exclude=".cache"
```

### 3. Verify the Backup

```bash
# List all snapshots
restic snapshots

# Check repository integrity
restic check
```

## Configuration

### Environment File

Create `/etc/restic/env` to avoid typing credentials every time:

```bash
export RESTIC_REPOSITORY="/mnt/backup-drive/restic-repo"
export RESTIC_PASSWORD="your-strong-encryption-password"
# For S3:
# export AWS_ACCESS_KEY_ID="your-access-key"
# export AWS_SECRET_ACCESS_KEY="your-secret-key"
```

Source it before running Restic:

```bash
source /etc/restic/env
restic backup /opt/selfhosted
```

### Automated Backups with systemd

Create a backup service at `/etc/systemd/system/restic-backup.service`:

```ini
[Unit]
Description=Restic Backup
After=network-online.target

[Service]
Type=oneshot
EnvironmentFile=/etc/restic/env
ExecStart=/usr/local/bin/restic backup /opt/selfhosted /home --exclude=".cache" --verbose
ExecStartPost=/usr/local/bin/restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune
```

Create a timer at `/etc/systemd/system/restic-backup.timer`:

```ini
[Unit]
Description=Run Restic Backup Daily

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now restic-backup.timer
```

### Retention Policy

Restic's `forget` command manages snapshot retention:

```bash
restic forget \
  --keep-daily 7 \
  --keep-weekly 4 \
  --keep-monthly 6 \
  --keep-yearly 2 \
  --prune
```

This keeps: 7 daily snapshots, 4 weekly, 6 monthly, and 2 yearly. The `--prune` flag removes data no longer referenced by any snapshot.

### Back Up Docker Databases Properly

Don't just back up PostgreSQL or MySQL data files — they may be inconsistent. Dump first, then back up:

```bash
#!/bin/bash
source /etc/restic/env

# Dump databases before backup
docker exec postgres pg_dumpall -U postgres > /opt/backups/postgres-dump.sql
docker exec mariadb mariadb-dump --all-databases -u root -p"$MYSQL_ROOT_PASSWORD" > /opt/backups/mariadb-dump.sql

# Run backup
restic backup /opt/selfhosted /opt/backups /var/lib/docker/volumes \
  --exclude="*/lost+found" \
  --verbose
```

## Restoring from Backup

### List Available Snapshots

```bash
restic snapshots
```

### Restore a Full Snapshot

```bash
restic restore latest --target /opt/restore
```

### Restore Specific Files

```bash
restic restore latest --target /opt/restore --include "/opt/selfhosted/docker-compose.yml"
```

### Mount a Snapshot as a Filesystem

Browse backup contents without restoring:

```bash
mkdir /mnt/restic-mount
restic mount /mnt/restic-mount
# Browse /mnt/restic-mount/snapshots/ in another terminal
# Press Ctrl+C to unmount
```

## Troubleshooting

### "repository does not exist" error

**Symptom:** Restic operations fail with "unable to open repository."

**Fix:** Verify `RESTIC_REPOSITORY` is set correctly and the path exists:
```bash
echo $RESTIC_REPOSITORY
# For remote repos, check connectivity:
restic cat config
```

### Backup is slow

**Symptom:** First backup takes hours for large datasets.

**Fix:** The first backup is always the slowest — it uploads everything. Subsequent backups are incremental and only transfer changed blocks. For the initial backup of large datasets, consider running overnight. Check bandwidth with:
```bash
restic backup --verbose /data
# Watch the throughput output
```

### "Fatal: wrong password or no key found"

**Symptom:** Cannot access repository after changing password environment.

**Fix:** The password must match what was used during `restic init`. There is no recovery. Check your password source:
```bash
echo $RESTIC_PASSWORD
```

If you need to change the password:
```bash
restic key passwd
```

### Lock file errors

**Symptom:** "repository is already locked by another process."

**Fix:** If no other Restic process is running, a previous run may have crashed:
```bash
restic unlock
```

## Resource Requirements

- **RAM:** 100-500 MB during backup (depends on dataset size; Restic caches block hashes)
- **CPU:** Moderate during backup (encryption and deduplication). Low otherwise.
- **Disk:** Repository size depends on data and deduplication ratio. Typical: 60-80% of source data size for the first snapshot, then small increments.

## Frequently Asked Questions

### Is Restic encrypted?

Yes. All data is encrypted with AES-256 before leaving your machine. The repository password is the encryption key derivation source. Without it, backup data is unreadable.

### Restic vs BorgBackup — which should I use?

Restic supports more storage backends (S3, B2, Azure, GCS) and is easier to set up with cloud storage. [BorgBackup](/apps/borgbackup) has better compression and is slightly more efficient on local/SSH storage. See [Restic vs BorgBackup](/compare/restic-vs-borgbackup) for the full comparison.

### Can Restic back up to multiple destinations?

Not natively in a single command. Run separate backups to different repositories:
```bash
RESTIC_REPOSITORY="/mnt/local-backup" restic backup /data
RESTIC_REPOSITORY="s3:s3.amazonaws.com/offsite-bucket" restic backup /data
```

This is a good practice for the [3-2-1 backup rule](/foundations/backup-3-2-1-rule).

## Verdict

Restic is the best general-purpose backup tool for self-hosters. It encrypts by default, deduplicates efficiently, and supports every storage backend you'd want — from a local USB drive to S3 or Backblaze B2. The CLI is clean and well-documented. The main downside is no built-in GUI — if you want a web interface for managing backups, look at [Duplicati](/apps/duplicati) or pair Restic with [Borgmatic](/apps/borgmatic)-style wrappers. For anyone comfortable with the command line, Restic should be your first choice.

## Related

- [How to Self-Host BorgBackup](/apps/borgbackup)
- [How to Self-Host Kopia](/apps/kopia)
- [Restic vs BorgBackup](/compare/restic-vs-borgbackup)
- [Borgmatic vs Restic](/compare/borgmatic-vs-restic)
- [Duplicati vs Restic](/compare/duplicati-vs-restic)
- [Best Self-Hosted Backup](/best/backup)
- [Replace Backblaze](/replace/backblaze)
- [3-2-1 Backup Rule](/foundations/backup-3-2-1-rule)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Volumes](/foundations/docker-volumes)
