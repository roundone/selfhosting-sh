---
title: "How to Self-Host Kopia with Docker Compose"
description: "Step-by-step guide to self-hosting Kopia with Docker for fast, encrypted, deduplicated backups to any storage backend."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "backup"
apps:
  - kopia
tags:
  - docker
  - backup
  - encryption
  - deduplication
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Kopia?

Kopia is a fast, encrypted backup tool with a web UI. It supports deduplication, compression, and encryption by default, and can back up to local storage, NFS, SFTP, S3, B2, Google Cloud, Azure, and more. Think of it as a modern alternative to [BorgBackup](/apps/borgbackup/) with a graphical interface and cross-platform support. [Official site](https://kopia.io/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 500 MB of free disk space (plus backup storage)
- 512 MB of RAM minimum
- A backup destination (local drive, NAS, S3 bucket, etc.)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  kopia:
    image: kopia/kopia:0.19.0
    container_name: kopia
    command:
      - server
      - start
      - --insecure
      - --address=0.0.0.0:51515
      - --server-control-username=admin
      - --server-control-password=change-this-password
    environment:
      - KOPIA_PASSWORD=change-this-repository-password  # Repository encryption password
      - TZ=America/New_York
    volumes:
      - ./config:/app/config
      - ./cache:/app/cache
      - ./logs:/app/logs
      - ./repository:/repository          # Local backup destination
      - /path/to/data:/data:ro            # Data to back up (read-only)
    ports:
      - "51515:51515"
    restart: unless-stopped
```

**Key parameters:**

| Parameter | Purpose |
|-----------|---------|
| `--server-control-username` | Web UI admin username — **must change** |
| `--server-control-password` | Web UI admin password — **must change** |
| `KOPIA_PASSWORD` | Repository encryption password — **must change and save securely** |

**Volume mounts:**

| Container Path | Purpose |
|---------------|---------|
| `/app/config` | Kopia configuration |
| `/app/cache` | Deduplication cache (improves performance) |
| `/app/logs` | Kopia log files |
| `/repository` | Backup destination (if local) |
| `/data` | Source data to back up (mount read-only) |

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:51515`
2. Log in with the server control credentials
3. **Create a repository:** Choose your storage backend (filesystem, S3, B2, etc.)
4. Set the repository password — this encrypts all backups. **Save this password securely. Without it, your backups are permanently inaccessible.**
5. Create your first snapshot policy: select source directories and set a schedule

## Configuration

### Snapshot Policies

Policies define what to back up and how often:

- **Schedule:** Hourly, daily, weekly, custom cron
- **Retention:** Keep N hourly, daily, weekly, monthly, annual snapshots
- **Compression:** zstd (recommended), gzip, lz4, or none
- **File exclusion:** Glob patterns for files to skip

Example policy via the web UI:
- Source: `/data`
- Schedule: Daily at 2:00 AM
- Retention: 7 daily, 4 weekly, 12 monthly
- Compression: zstd (best balance of speed and ratio)

### Storage Backends

Configure in the web UI when creating a repository:

| Backend | Use Case |
|---------|----------|
| Filesystem | Local drive, NFS, USB |
| S3 | AWS S3, MinIO, Wasabi, any S3-compatible |
| B2 | Backblaze B2 (cheap cloud storage) |
| SFTP | Remote server over SSH |
| Google Cloud Storage | GCS buckets |
| Azure Blob | Azure storage accounts |
| Rclone | Any rclone-supported backend |

### Deduplication

Kopia deduplicates at the block level across all snapshots. If you back up 10 GB and only 100 MB changes, the next snapshot only stores the 100 MB delta. This applies across different source directories too — if two directories contain the same file, it's stored once.

## Advanced Configuration (Optional)

### Backup Multiple Directories

Mount additional directories and create separate policies:

```yaml
volumes:
  - /home:/sources/home:ro
  - /var/lib/docker/volumes:/sources/docker-volumes:ro
  - /etc:/sources/etc:ro
```

Create a snapshot policy for each source directory in the web UI.

### Remote Repository (S3)

For off-site backups to S3-compatible storage:

```yaml
services:
  kopia:
    image: kopia/kopia:0.19.0
    container_name: kopia
    command:
      - server
      - start
      - --insecure
      - --address=0.0.0.0:51515
      - --server-control-username=admin
      - --server-control-password=change-this-password
    environment:
      - KOPIA_PASSWORD=change-this-repository-password
      - AWS_ACCESS_KEY_ID=your-access-key
      - AWS_SECRET_ACCESS_KEY=your-secret-key
      - TZ=America/New_York
    volumes:
      - ./config:/app/config
      - ./cache:/app/cache
      - /path/to/data:/data:ro
    ports:
      - "51515:51515"
    restart: unless-stopped
```

Connect to S3 when creating the repository in the web UI.

### Notification on Failure

Kopia supports webhook notifications. Configure under **Policies → Actions** to run scripts before/after snapshots:

```yaml
# Run after snapshot
after_snapshot_root:
  - /scripts/notify.sh
```

## Reverse Proxy

Example Nginx Proxy Manager configuration:

- **Scheme:** http
- **Forward Hostname:** kopia
- **Forward Port:** 51515

Enable WebSocket support for the real-time dashboard. [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

## Backup

Kopia IS the backup tool. For backing up Kopia's own configuration:

```bash
tar -czf kopia-config-backup-$(date +%Y%m%d).tar.gz ./config
```

**Critical:** Save your repository password separately. Without it, all backups are permanently encrypted and inaccessible. [Backup Strategy](/foundations/backup-3-2-1-rule/)

## Troubleshooting

### "Repository not connected" Error

**Symptom:** Web UI shows repository not connected after restart.
**Fix:** Ensure `KOPIA_PASSWORD` environment variable matches the password used when the repository was created. If the repository is on a network path, check that the mount is available before Kopia starts.

### Slow First Backup

**Symptom:** Initial snapshot takes hours.
**Fix:** The first snapshot must scan and upload all data — this is expected. Subsequent snapshots only process changes and are much faster. Increase cache size to speed up deduplication lookups.

### High Memory Usage During Large Backups

**Symptom:** Kopia uses 1+ GB RAM during backups.
**Fix:** Large backup sets with millions of files use more memory for deduplication indexes. Increase Docker memory limits. For extreme cases, adjust the `--max-cache-size-mb` parameter.

### Cache Growing Too Large

**Symptom:** The cache directory uses several GB.
**Fix:** Set `--max-cache-size-mb=500` in the command to limit cache size. A smaller cache means slightly slower backups but less disk usage.

## Resource Requirements

- **RAM:** ~200 MB idle, 500 MB-1 GB during active backups (depends on dataset size)
- **CPU:** Low idle, moderate during backup (compression and encryption)
- **Disk:** ~100 MB for application, cache varies (500 MB-2 GB default)

## Verdict

Kopia is the best modern backup tool for self-hosters who want a web UI. It combines the technical excellence of BorgBackup (deduplication, compression, encryption) with the accessibility of a graphical interface. The wide range of storage backends means you can back up anywhere. For CLI purists, [BorgBackup](/apps/borgbackup/) with [Borgmatic](/apps/borgmatic/) is the alternative. For a simpler GUI-first approach with more backend integrations (cloud drives), [Duplicati](/apps/duplicati/) is another option.

## FAQ

### Kopia vs BorgBackup?

Both are excellent. Kopia: web UI, cross-platform, S3/cloud native, newer. BorgBackup: CLI-only, Linux/macOS, SSH-only remote, more mature. Kopia is easier to set up; Borg is more battle-tested.

### Kopia vs Restic?

Similar feature sets. Kopia has a web UI, more compression options, and slightly better performance in benchmarks. Restic has broader adoption and more community tooling. Both are solid choices.

### Can Kopia back up Docker volumes?

Yes. Mount Docker volumes read-only into the Kopia container and create snapshot policies for each. Example: `-v /var/lib/docker/volumes:/sources/docker-volumes:ro`.

## Related

- [How to Self-Host Duplicati](/apps/duplicati/)
- [How to Self-Host Borgmatic](/apps/borgmatic/)
- [Duplicati vs Borgmatic](/compare/duplicati-vs-borgmatic/)
- [Kopia vs Restic](/compare/kopia-vs-restic/)
- [Best Self-Hosted Backup Tools](/best/backup/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
- [Disaster Recovery for Self-Hosting](/foundations/disaster-recovery/)
