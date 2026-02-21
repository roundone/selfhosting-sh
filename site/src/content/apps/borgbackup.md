---
title: "How to Self-Host BorgBackup"
description: "Complete guide to setting up BorgBackup for self-hosted backups, including encryption, deduplication, remote repos, and automation."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "backup"
apps:
  - borgbackup
tags:
  - self-hosted
  - backup
  - borgbackup
  - encryption
  - deduplication
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is BorgBackup?

[BorgBackup](https://www.borgbackup.org) (Borg) is a deduplicating, encrypting backup program. It breaks files into variable-length chunks, deduplicates them across all backups, compresses the result, and encrypts everything. Borg is extremely efficient — after the first backup, subsequent backups only store changed chunks. It's one of the most trusted backup tools in the self-hosting community, replacing services like CrashPlan and Backblaze for users who want full control.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- BorgBackup installed on the source machine
- A backup destination (local disk, remote server via SSH, or NAS)
- SSH access to the remote server (if using remote backups)

## Installation

BorgBackup runs as a native binary — it's not typically Dockerized because it needs direct filesystem access for efficient deduplication.

```bash
# Ubuntu/Debian
sudo apt install borgbackup

# Fedora
sudo dnf install borgbackup

# Arch Linux
sudo pacman -S borg

# pip (latest version)
pip install borgbackup==1.4.3
```

Verify the installation:

```bash
borg --version
# borg 1.4.3
```

## Initial Setup

### 1. Initialize a Repository

```bash
# Local repository
borg init --encryption=repokey /mnt/backup-drive/borg-repo

# Remote repository (via SSH)
borg init --encryption=repokey ssh://user@backup-server/path/to/borg-repo
```

**Encryption modes:**
- `repokey` (recommended) — encryption key stored in the repository, protected by your passphrase
- `keyfile` — encryption key stored on your local machine in `~/.config/borg/keys/`
- `none` — no encryption (not recommended)

**Critical:** Export and securely store your key:

```bash
borg key export /mnt/backup-drive/borg-repo /path/to/safe/location/borg-key-backup.txt
```

Without this key AND your passphrase, your backups are permanently inaccessible.

### 2. Create Your First Backup

```bash
export BORG_PASSPHRASE="your-strong-passphrase"

borg create \
  /mnt/backup-drive/borg-repo::backup-{now:%Y-%m-%d_%H:%M} \
  /home/user/data \
  /opt/selfhosted \
  /etc \
  --exclude '*.tmp' \
  --exclude '.cache' \
  --stats --progress
```

The `{now:%Y-%m-%d_%H:%M}` creates a timestamp-named archive (e.g., `backup-2026-02-16_14:30`).

### 3. Verify the Backup

```bash
# List all archives
borg list /mnt/backup-drive/borg-repo

# Check repository integrity
borg check /mnt/backup-drive/borg-repo

# Show archive details
borg info /mnt/backup-drive/borg-repo::backup-2026-02-16_14:30
```

## Configuration

### Automated Backups with a Script

Create `/usr/local/bin/borg-backup.sh`:

```bash
#!/bin/bash
set -euo pipefail

# Configuration
export BORG_REPO="/mnt/backup-drive/borg-repo"
export BORG_PASSPHRASE="your-strong-passphrase"

# Logging
LOG_FILE="/var/log/borg-backup.log"
exec > >(tee -a "$LOG_FILE") 2>&1
echo "=== Borg Backup started at $(date) ==="

# Dump databases before backup
docker exec postgres pg_dumpall -U postgres > /opt/backups/postgres.sql 2>/dev/null || true
docker exec mariadb mariadb-dump --all-databases -u root -pchangeme > /opt/backups/mariadb.sql 2>/dev/null || true

# Create backup
borg create \
  ::backup-{now:%Y-%m-%d_%H:%M} \
  /opt/selfhosted \
  /home \
  /opt/backups \
  /var/lib/docker/volumes \
  --exclude '*/lost+found' \
  --exclude '*.tmp' \
  --exclude '*/.cache' \
  --stats

# Prune old backups
borg prune \
  --keep-daily 7 \
  --keep-weekly 4 \
  --keep-monthly 6 \
  --keep-yearly 2 \
  --stats

# Compact repository (reclaim disk space)
borg compact

echo "=== Borg Backup completed at $(date) ==="
```

Make it executable:

```bash
chmod +x /usr/local/bin/borg-backup.sh
```

### Automate with systemd

Create `/etc/systemd/system/borg-backup.service`:

```ini
[Unit]
Description=BorgBackup
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/borg-backup.sh
Environment="BORG_PASSPHRASE=your-strong-passphrase"
```

Create `/etc/systemd/system/borg-backup.timer`:

```ini
[Unit]
Description=Run BorgBackup Daily

[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now borg-backup.timer
```

### Remote Backups via SSH

For offsite backups to a remote server:

```bash
# Initialize remote repo
borg init --encryption=repokey ssh://backupuser@remote-server:22/~/borg-repo

# Create backup to remote
borg create \
  ssh://backupuser@remote-server:22/~/borg-repo::backup-{now:%Y-%m-%d_%H:%M} \
  /opt/selfhosted \
  --stats
```

**Tip:** Set up SSH key authentication for unattended backups:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/borg-backup -N ""
ssh-copy-id -i ~/.ssh/borg-backup.pub backupuser@remote-server
```

Add to your backup script:
```bash
export BORG_RSH="ssh -i /root/.ssh/borg-backup"
```

### Compression

Borg supports multiple compression algorithms. Set in your create command:

```bash
borg create --compression zstd,6 ::backup-{now} /data
```

| Algorithm | Speed | Ratio | Best For |
|-----------|-------|-------|----------|
| `lz4` | Fastest | Lowest | Fast local backups |
| `zstd,3` | Fast | Good | Default recommendation |
| `zstd,6` | Medium | Better | Remote backups (bandwidth saving) |
| `zlib,6` | Slow | Good | Legacy compatibility |

## Restoring from Backup

### List Archives and Contents

```bash
# List all archives
borg list /mnt/backup-drive/borg-repo

# List files in an archive
borg list /mnt/backup-drive/borg-repo::backup-2026-02-16_14:30
```

### Restore Files

```bash
# Restore everything to a directory
cd /tmp/restore
borg extract /mnt/backup-drive/borg-repo::backup-2026-02-16_14:30

# Restore specific paths
borg extract /mnt/backup-drive/borg-repo::backup-2026-02-16_14:30 opt/selfhosted/docker-compose.yml

# Restore to original location (careful — overwrites existing files)
cd /
borg extract /mnt/backup-drive/borg-repo::backup-2026-02-16_14:30 opt/selfhosted
```

### Mount an Archive

Browse backup contents without extracting:

```bash
mkdir /mnt/borg-mount
borg mount /mnt/backup-drive/borg-repo::backup-2026-02-16_14:30 /mnt/borg-mount
# Browse /mnt/borg-mount/ in a file manager or terminal
# When done:
borg umount /mnt/borg-mount
```

## Troubleshooting

### "Failed to create/acquire the lock" error

**Symptom:** Borg operations fail with a lock error.

**Fix:** A previous backup may have crashed. If you're certain no other Borg process is running:
```bash
borg break-lock /mnt/backup-drive/borg-repo
```

### Backup is very slow

**Symptom:** First backup takes many hours.

**Fix:** The first backup is always the slowest — it uploads everything. Subsequent backups are fast due to deduplication. For remote backups, bandwidth is usually the bottleneck. Use compression (`--compression zstd,6`) to reduce transfer size.

### "Permission denied" errors during backup

**Symptom:** Borg skips files with permission errors.

**Fix:** Run Borg as root for system backups:
```bash
sudo borg create ::backup-{now} /opt/selfhosted /home /etc
```

Or use `--one-file-system` to avoid crossing mount boundaries.

### Repository check shows errors

**Symptom:** `borg check` reports inconsistencies.

**Fix:** Run a repair:
```bash
borg check --repair /mnt/backup-drive/borg-repo
```

Always have a separate backup before running repair.

## Resource Requirements

- **RAM:** 200-500 MB during backup (caches file hashes for deduplication)
- **CPU:** Moderate during backup (compression and encryption). Low otherwise.
- **Disk:** Repository size is typically 50-70% of original data for the first archive, then very small increments due to deduplication.

## Frequently Asked Questions

### BorgBackup vs Restic — which should I use?

Borg has better compression and is more efficient for local/SSH backups. [Restic](/apps/restic/) supports more storage backends (S3, B2, Azure, GCS) and is better for cloud storage. See [Restic vs BorgBackup](/compare/restic-vs-borgbackup/).

### Can BorgBackup back up to the cloud?

Not natively. Borg works with local paths and SSH. For cloud storage, use [Borgmatic](/apps/borgmatic/) with rclone, or use [Restic](/apps/restic/) which has native S3/B2 support.

### What is Borgmatic?

[Borgmatic](/apps/borgmatic/) is a wrapper around BorgBackup that simplifies configuration with a YAML config file. It handles creating, pruning, and checking backups automatically. Think of it as "BorgBackup made easy."

## Verdict

BorgBackup is rock-solid and extremely space-efficient. The deduplication and compression mean your backups use a fraction of the original data size, and the encryption is strong by default. The main downsides: SSH-only for remote backups (no native cloud storage support), and the CLI can be complex for beginners. For local or SSH-based backups, Borg is the best choice. For cloud backups, use [Restic](/apps/restic/). For an easier interface on top of Borg, use [Borgmatic](/apps/borgmatic/).

## Related

- [How to Self-Host Restic](/apps/restic/)
- [How to Self-Host Borgmatic](/apps/borgmatic/)
- [Restic vs BorgBackup](/compare/restic-vs-borgbackup/)
- [Best Self-Hosted Backup](/best/backup/)
- [Replace CrashPlan](/replace/crashplan/)
- [3-2-1 Backup Rule](/foundations/backup-3-2-1-rule/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Linux Basics](/foundations/linux-basics-self-hosting/)
