---
title: "How to Self-Host Borgmatic with Docker"
description: "Deploy Borgmatic with Docker Compose for automated, encrypted, deduplicated backups using BorgBackup with YAML configuration."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "backup"
apps:
  - borgmatic
tags:
  - docker
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

## What Is Borgmatic?

[Borgmatic](https://torsion.org/borgmatic/) is a wrapper around [BorgBackup](/apps/borgbackup/) that replaces manual borg commands with a single YAML configuration file and built-in scheduling. Where BorgBackup gives you a powerful deduplication and encryption engine, borgmatic gives you automated, scheduled, hands-off backups that run from a Docker container with cron built in. It supports local repositories, remote SSH/SFTP destinations, and S3-compatible or Backblaze B2 storage via rclone integration. If you are paying for CrashPlan, Backblaze, or any managed backup service, borgmatic lets you self-host the same functionality with full control over encryption keys and storage destinations.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 1 GB of free RAM (minimum; more for large backup sets)
- Storage for backup repositories (local disk, NAS, or remote server)
- SSH key pair (if using remote backup destinations)
- A domain name (optional, for monitoring integrations)

## Docker Compose Configuration

Create a directory for your borgmatic stack:

```bash
mkdir -p /opt/borgmatic
cd /opt/borgmatic
```

Create a `docker-compose.yml` file:

```yaml
services:
  borgmatic:
    image: ghcr.io/borgmatic-collective/borgmatic:1.9.14
    container_name: borgmatic
    restart: unless-stopped
    init: true  # Ensures proper signal handling for cron and borg processes
    environment:
      # Timezone for cron scheduling
      TZ: UTC
      # Borg passphrase for repository encryption
      # CHANGE THIS to a strong, unique passphrase and store it securely
      BORG_PASSPHRASE: "your-strong-passphrase-change-me"
    volumes:
      # Borgmatic configuration
      - ./config:/etc/borgmatic
      # Data to back up (mount as many source directories as needed)
      - /home:/mnt/source/home:ro
      - /opt:/mnt/source/opt:ro
      # Local backup repository (skip if using remote-only)
      - /mnt/backups/borg-repo:/mnt/borg-repository
      # Borg internal state (cache, keys, security)
      - borg-config:/root/.config/borg
      - borg-cache:/root/.cache/borg
      # Borgmatic state (database dump staging, etc.)
      - borgmatic-state:/root/.borgmatic
      # SSH keys for remote backup destinations
      - ./ssh:/root/.ssh:ro
      # Crontab for scheduling
      - ./crontab.txt:/etc/borgmatic/crontab.txt
    # Optional healthcheck — verifies borgmatic can read its config
    healthcheck:
      test: ["CMD", "borgmatic", "config", "validate"]
      interval: 1h
      timeout: 30s
      retries: 3
      start_period: 30s

volumes:
  borg-config:
  borg-cache:
  borgmatic-state:
```

Create the crontab file that controls backup scheduling:

```bash
mkdir -p /opt/borgmatic/config
```

Create `crontab.txt`:

```
# Run borgmatic every day at 3:00 AM UTC
0 3 * * * PATH=$PATH:/usr/local/bin /usr/local/bin/borgmatic --verbosity -2 --syslog-verbosity 1
```

The container's entrypoint installs this crontab and starts crond automatically. Adjust the schedule to match your backup window.

## Configuration File

Create `config/config.yaml` — this is the core borgmatic configuration:

```yaml
# /opt/borgmatic/config/config.yaml
# Borgmatic configuration — full reference: https://torsion.org/borgmatic/docs/reference/configuration/

# Directories to back up
source_directories:
  - /mnt/source/home
  - /mnt/source/opt

# Backup repositories — local and/or remote
repositories:
  # Local repository
  - path: /mnt/borg-repository
    label: local

  # Remote repository via SSH (uncomment and configure)
  # - path: ssh://borg@backup-server.example.com/./borgmatic-repo
  #   label: remote-ssh

# Files and directories to exclude from backups
exclude_patterns:
  - "*.pyc"
  - "*/.cache/*"
  - "*/node_modules/*"
  - "*/.tmp/*"
  - "*/lost+found"

# Exclude caches marked with CACHEDIR.TAG
exclude_caches: true

# Encryption — MUST match what you used during borg init
encryption_passcommand: "printenv BORG_PASSPHRASE"

# Compression — lz4 is fast with decent ratios; zstd offers better compression
compression: auto,lz4

# Retention policy — how many backups to keep
keep_daily: 7
keep_weekly: 4
keep_monthly: 6
keep_yearly: 1

# Consistency checks — run periodically to verify backup integrity
checks:
  - name: repository
    frequency: 2 weeks
  - name: archives
    frequency: 4 weeks

# Archive name template
archive_name_format: "{hostname}-{now:%Y-%m-%dT%H:%M:%S}"
```

This configuration backs up `/mnt/source/home` and `/mnt/source/opt` (which map to the host's `/home` and `/opt`) into a local borg repository, keeps 7 daily, 4 weekly, 6 monthly, and 1 yearly archive, and runs integrity checks periodically.

## Initial Setup

Before borgmatic can run scheduled backups, you must initialize the borg repository.

### 1. Start the Container

```bash
cd /opt/borgmatic
docker compose up -d
```

### 2. Initialize the Repository

```bash
docker compose exec borgmatic borgmatic init --encryption repokey-blake2
```

The `repokey-blake2` encryption mode stores the encryption key inside the repository, protected by your passphrase. This is the recommended mode for most setups. The `BORG_PASSPHRASE` environment variable in your Compose file provides the passphrase automatically.

### 3. Export the Encryption Key

This step is critical. Without both the key and the passphrase, your backups are permanently unrecoverable.

```bash
docker compose exec borgmatic borg key export /mnt/borg-repository > /opt/borgmatic/borg-key-backup.txt
```

Store `borg-key-backup.txt` in a separate, secure location — a password manager, a USB drive in a safe, or a different server entirely. Do not store it alongside the backup repository.

### 4. Run the First Backup

```bash
docker compose exec borgmatic borgmatic --verbosity 1
```

The first backup takes the longest because every file chunk is new. Subsequent backups are fast thanks to deduplication — only changed chunks are stored.

### 5. Verify the Backup

```bash
# List all archives
docker compose exec borgmatic borgmatic list

# Show details of the latest archive
docker compose exec borgmatic borgmatic info --archive latest
```

Once you see a successful archive listed, borgmatic is working. The cron job in the container handles everything from here.

## Configuration

### Retention Policies

Borgmatic's retention settings control how many archives to keep. When borgmatic runs, it creates a new archive and then prunes old ones according to these rules:

```yaml
# Keep the most recent N archives per time period
keep_daily: 7       # One per day for the last 7 days
keep_weekly: 4      # One per week for the last 4 weeks
keep_monthly: 6     # One per month for the last 6 months
keep_yearly: 1      # One per year for the last 1 year
```

Borg deduplication means keeping more archives costs very little extra space — most data is shared across archives. Err on the side of keeping more.

### Multiple Repositories

You can back up to multiple destinations simultaneously. Borgmatic runs the backup against each repository in sequence:

```yaml
repositories:
  - path: /mnt/borg-repository
    label: local
  - path: ssh://borg@nas.local/./borgmatic
    label: nas
  - path: ssh://borg@offsite.example.com/./borgmatic
    label: offsite
```

This follows the [3-2-1 backup rule](/foundations/backup-3-2-1-rule/): three copies, two different media types, one offsite.

### Exclude Patterns

Fine-tune what gets backed up:

```yaml
exclude_patterns:
  - "*.pyc"
  - "*/.cache/*"
  - "*/node_modules/*"
  - "*.tmp"
  - "*/.Trash-*"
  - "*/lost+found"

# Exclude large files over a threshold
exclude_if_present:
  - .nobackup

# Exclude caches marked with CACHEDIR.TAG
exclude_caches: true
```

Create an empty `.nobackup` file in any directory you want excluded. This is useful for temporary build directories or large media collections you back up separately.

### Hooks

Borgmatic supports hooks that run before and after backup operations:

```yaml
before_backup:
  - echo "Starting backup at $(date)"

after_backup:
  - echo "Backup finished at $(date)"

on_error:
  - echo "Backup FAILED at $(date)"
```

Hooks are the foundation for database dumps, notifications, and healthcheck pings — covered in the Advanced Configuration section.

## Advanced Configuration

### Remote SSH Backups

For remote repositories over SSH, set up key-based authentication:

```bash
# Generate an SSH key pair (if you don't have one)
ssh-keygen -t ed25519 -f /opt/borgmatic/ssh/id_ed25519 -N ""

# Copy the public key to the remote server
ssh-copy-id -i /opt/borgmatic/ssh/id_ed25519.pub borg@backup-server.example.com
```

Create `ssh/config` to avoid host key verification prompts:

```
Host backup-server.example.com
    IdentityFile /root/.ssh/id_ed25519
    StrictHostKeyChecking accept-new
```

Set correct permissions:

```bash
chmod 700 /opt/borgmatic/ssh
chmod 600 /opt/borgmatic/ssh/id_ed25519
chmod 644 /opt/borgmatic/ssh/id_ed25519.pub
chmod 644 /opt/borgmatic/ssh/config
```

Then add the remote repository in `config.yaml`:

```yaml
repositories:
  - path: /mnt/borg-repository
    label: local
  - path: ssh://borg@backup-server.example.com/./borgmatic-repo
    label: remote-ssh
```

Initialize the remote repository:

```bash
docker compose exec borgmatic borgmatic init --encryption repokey-blake2 --repository remote-ssh
```

### S3 and B2 Storage via Rclone

Borgmatic does not natively support S3 or B2, but you can use rclone to mount cloud storage as a local filesystem and then point borg at it. A simpler approach is to use borgmatic's `after_backup` hook to sync with rclone:

```yaml
after_backup:
  - rclone sync /mnt/borg-repository remote:borgmatic-backup --transfers 4
```

For this to work, install rclone in a custom Docker image or use a sidecar container:

```yaml
services:
  borgmatic:
    image: ghcr.io/borgmatic-collective/borgmatic:1.9.14
    # ... (same as above)

  rclone-sync:
    image: rclone/rclone:1.69
    container_name: borgmatic-rclone
    restart: "no"
    volumes:
      - /mnt/backups/borg-repo:/mnt/borg-repository:ro
      - ./rclone.conf:/config/rclone/rclone.conf:ro
    # Run after borgmatic completes via cron or manual trigger
    entrypoint: ["rclone", "sync", "/mnt/borg-repository", "remote:borgmatic-backup", "--transfers", "4"]
    profiles:
      - sync  # Only runs when explicitly started
```

Trigger the sync after a backup:

```bash
docker compose run --rm rclone-sync
```

### Apprise Notifications

Borgmatic has built-in support for [Apprise](https://github.com/caronc/apprise), which sends notifications to dozens of services (Slack, Discord, Telegram, email, Gotify, ntfy, and more).

Add to `config.yaml`:

```yaml
apprise:
  services:
    # Discord webhook
    - url: "discord://webhook_id/webhook_token"
      label: discord
    # Telegram bot
    - url: "tgram://bot_token/chat_id"
      label: telegram
    # ntfy (self-hosted)
    - url: "ntfy://ntfy.example.com/borgmatic"
      label: ntfy
  start:
    title: "Borgmatic: Backup Starting"
    body: "Backup job started on {hostname}"
  finish:
    title: "Borgmatic: Backup Complete"
    body: "Backup finished successfully on {hostname}"
  fail:
    title: "Borgmatic: Backup FAILED"
    body: "Backup failed on {hostname}. Check logs."
```

### Healthchecks.io Integration

Send pings to [healthchecks.io](https://healthchecks.io) (or a self-hosted instance) to monitor that backups are running on schedule. If a ping is missed, you get alerted.

```yaml
healthchecks:
  ping_url: "https://hc-ping.com/your-uuid-here"
```

Borgmatic pings the URL at the start of a backup, on success, and on failure. If your backup cron stops running entirely, healthchecks.io notices the missing ping and alerts you.

### Database Backup Hooks

Use `before_backup` hooks to dump databases before the filesystem backup runs. This ensures you have consistent database snapshots in every archive:

```yaml
postgresql_databases:
  - name: all
    hostname: postgres
    port: 5432
    username: postgres
    password: "your-db-password"
    format: custom

mysql_databases:
  - name: all
    hostname: mariadb
    port: 3306
    username: root
    password: "your-db-password"

# Dumps are stored in /root/.borgmatic/ and included in the backup automatically
```

For services on the same Docker network, use the container name as the hostname. Add the database containers' network to borgmatic's Compose config:

```yaml
services:
  borgmatic:
    # ... (same as above)
    networks:
      - default
      - app-network  # Network where your database containers run

networks:
  app-network:
    external: true
```

### Custom Cron Schedule

Edit `crontab.txt` for different schedules:

```
# Every 6 hours
0 */6 * * * PATH=$PATH:/usr/local/bin /usr/local/bin/borgmatic --verbosity -2 --syslog-verbosity 1

# Twice daily at 2 AM and 2 PM
0 2,14 * * * PATH=$PATH:/usr/local/bin /usr/local/bin/borgmatic --verbosity -2 --syslog-verbosity 1

# Every hour (for critical data)
0 * * * * PATH=$PATH:/usr/local/bin /usr/local/bin/borgmatic --verbosity -2 --syslog-verbosity 1
```

After editing, restart the container to apply:

```bash
docker compose restart borgmatic
```

## Backup

Borgmatic is your backup tool, but borgmatic itself needs backing up too. The critical items:

1. **Borg encryption key** — export with `borg key export` and store separately. Without it, all backups are permanently lost.
2. **Borgmatic config** (`config/config.yaml`) — your entire backup configuration.
3. **SSH keys** (`ssh/` directory) — needed for remote repository access.
4. **Passphrase** — store in a password manager. Not recoverable if lost.
5. **Crontab** (`crontab.txt`) — your backup schedule.

Store these in a different location from your borg repository. A password manager entry with the passphrase, a key export, and a copy of `config.yaml` is a solid approach. If you lose the server, you can reconstruct the entire borgmatic setup from these files plus any surviving borg repository.

```bash
# Export the key (run periodically, especially after key changes)
docker compose exec borgmatic borg key export /mnt/borg-repository > /opt/borgmatic/borg-key-backup.txt

# Back up the entire borgmatic config directory
tar czf borgmatic-config-backup.tar.gz /opt/borgmatic/config /opt/borgmatic/ssh /opt/borgmatic/crontab.txt /opt/borgmatic/docker-compose.yml
```

## Troubleshooting

### Repository Lock Error

**Symptom:** `Failed to create/acquire the lock` or `Lock: borg-backup is already running`

**Fix:** A previous borg process was killed or crashed without releasing the lock. Break the lock manually:

```bash
docker compose exec borgmatic borg break-lock /mnt/borg-repository
```

If using a remote repository:

```bash
docker compose exec borgmatic borg break-lock ssh://borg@backup-server.example.com/./borgmatic-repo
```

Only break the lock if you are certain no other borg process is running against that repository.

### Lost Passphrase

**Symptom:** `passphrase supplied in BORG_PASSPHRASE, by BORG_PASSCOMMAND or via BORG_PASSPHRASE_FD is incorrect`

**Fix:** There is no fix. Borg encryption is not recoverable without the correct passphrase. If you have a key export file but forgot the passphrase, the backups are lost. This is by design — it is the same property that protects your data from unauthorized access.

**Prevention:** Store your passphrase in a password manager immediately after creating the repository. Test it periodically by running `borgmatic list` from a fresh environment.

### Slow First Backup

**Symptom:** The initial backup takes hours or seems stuck.

**Fix:** This is normal. The first backup must read, chunk, compress, and encrypt every file. Subsequent backups are dramatically faster because borg only processes changed chunks. Monitor progress with:

```bash
docker compose exec borgmatic borgmatic --verbosity 2
```

For very large datasets (multiple TB), consider doing the first backup to a local repository, then using `borg transfer` or rsync to seed a remote repository.

### Permission Denied Errors

**Symptom:** `Permission denied` when reading source directories or writing to the repository.

**Fix:** The borgmatic container runs as root by default, so permission issues usually involve mount-level restrictions. Check:

```bash
# Verify mounts are accessible inside the container
docker compose exec borgmatic ls -la /mnt/source/
docker compose exec borgmatic ls -la /mnt/borg-repository/
```

If source directories are on NFS or CIFS mounts, ensure the mount options allow root access (`no_root_squash` for NFS, or appropriate uid/gid mapping for CIFS). Alternatively, mount with specific uid/gid options in your Docker Compose file.

### Config Validation Errors

**Symptom:** `borgmatic: error: Problem reading configuration file` or schema validation errors on startup.

**Fix:** Validate your configuration:

```bash
docker compose exec borgmatic borgmatic config validate
```

Common causes: YAML indentation errors, deprecated options from older borgmatic versions, or missing required fields. Borgmatic's configuration schema changes between major versions — check the [configuration reference](https://torsion.org/borgmatic/docs/reference/configuration/) for your installed version.

## Resource Requirements

- **RAM:** 256 MB idle (crond waiting). During backup: 512 MB–1 GB depending on dataset size and chunk cache. Large repositories (multi-TB) can use 2+ GB during integrity checks.
- **CPU:** Low during idle. Moderate during backup (compression and encryption). Single-threaded for most operations — borg does not parallelize within a single backup.
- **Disk:** The borgmatic container itself is small (~150 MB). Repository size depends on your data and retention policy. Deduplication typically achieves 5:1 to 20:1 compression ratios for incremental backups after the first full backup.

## Verdict

Borgmatic is the best way to run BorgBackup in a Docker environment. If you already understand and trust borg's deduplication and encryption (and you should — it is one of the most battle-tested backup engines available), borgmatic removes the operational burden of writing shell scripts, managing cron jobs, and remembering the right flags. The YAML configuration is clear, the built-in scheduling eliminates external cron dependencies, and the notification and database dump integrations make it genuinely hands-off.

Compared to [Duplicati](/apps/duplicati/), borgmatic is more CLI-oriented and lacks a web UI, but it produces dramatically more efficient backup repositories and is far more reliable for large datasets. Duplicati's web interface is friendly but its backup engine has a history of database corruption on long-running backup sets.

Compared to [Restic](/apps/restic/), borgmatic offers more structured automation out of the box. Restic is a fantastic backup engine with broader native backend support (S3, B2, Azure, GCS without rclone), but you need to wrap it in your own scripts and scheduling. If you want a Docker container that handles everything — scheduling, pruning, verification, notifications — borgmatic is the more complete solution.

**Use borgmatic if:** You want automated, encrypted, deduplicated backups running in Docker with minimal ongoing maintenance. You value data integrity and efficient storage over a graphical interface.

**Look elsewhere if:** You need a web UI for backup management ([Duplicati](/apps/duplicati/)), native S3/B2 support without rclone ([Restic](/apps/restic/)), or you are backing up a single machine and prefer a simpler tool.

## Related

- [How to Self-Host BorgBackup](/apps/borgbackup/)
- [How to Self-Host Duplicati with Docker](/apps/duplicati/)
- [How to Self-Host Restic Backup](/apps/restic/)
- [Restic vs BorgBackup: Which Should You Self-Host?](/compare/restic-vs-borgbackup/)
- [Borgmatic vs Restic](/compare/borgmatic-vs-restic/)
- [Best Self-Hosted Backup Solutions](/best/backup/)
- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
