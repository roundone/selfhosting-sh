---
title: "Best Self-Hosted Backup Solutions in 2026"
description: "Compare the best self-hosted backup tools including Restic, BorgBackup, Kopia, Duplicati, and Borgmatic for reliable data protection."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "backup"
apps:
  - restic
  - borgbackup
  - kopia
tags:
  - best
  - self-hosted
  - backup
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Picks

| Use Case | Best Choice | Why |
|----------|-------------|-----|
| Best overall | [Restic](/apps/restic/) | Fast, encrypted, supports 20+ storage backends (S3, B2, SFTP, local). The community standard. |
| Best deduplication | [BorgBackup](/apps/borgbackup/) | Superior compression ratios. Best for large, slowly-changing datasets. |
| Best modern alternative | Kopia | Restic-like features plus a web UI, policies, and snapshot management. |
| Best with GUI | Duplicati | Web-based GUI for scheduling and configuring backups. Best for non-CLI users. |
| Best Borg automation | Borgmatic | YAML-configured wrapper around BorgBackup. Automates the 3-2-1 rule. |

## The Full Ranking

### 1. Restic — Best Overall

[Restic](/apps/restic/) is the most versatile self-hosted backup tool. It encrypts all data by default (AES-256), deduplicates at the content level, and supports more storage backends than any alternative — local directories, SFTP, S3-compatible storage (AWS, Backblaze B2, MinIO, Wasabi), Azure Blob, Google Cloud Storage, and REST servers.

Backups are fast thanks to content-defined chunking. Restores are straightforward. The community is large and active. If you're choosing one backup tool, choose Restic.

**Pros:**
- 20+ storage backends (most of any backup tool)
- AES-256 encryption by default — all data encrypted at rest
- Content-defined chunking for efficient deduplication
- Fast incremental backups
- Cross-platform (Linux, macOS, Windows, BSD)
- Single static binary — no dependencies
- Active development with regular releases
- Large community, extensive documentation

**Cons:**
- CLI-only — no built-in GUI or web UI
- No built-in scheduler — needs cron or systemd timers
- Compression added relatively recently (v0.16.0+)
- Cannot exclude files from an existing snapshot retroactively
- Repository repair tools are limited

**Best for:** Anyone who wants reliable, encrypted backups to any storage backend. The default recommendation for self-hosters.

[Read our full guide: How to Set Up Restic](/apps/restic/)

### 2. BorgBackup — Best for Storage Efficiency

[BorgBackup](/apps/borgbackup/) excels at compression and deduplication. For datasets with many similar files (VMs, databases, Docker volumes), Borg achieves smaller backup sizes than Restic. The authenticated encryption is solid, and append-only mode provides protection against ransomware.

**Pros:**
- Best-in-class compression (lz4, zstd, zlib, lzma)
- Excellent deduplication ratios
- Append-only mode for ransomware protection
- Mountable backups (FUSE) — browse archives like a filesystem
- Mature and battle-tested (10+ years)

**Cons:**
- SSH-only for remote backups — no native S3/cloud support
- Requires BorgBackup installed on both client AND server
- Slower than Restic for initial backups
- No Windows support
- No built-in scheduler
- **CRITICAL:** Losing the encryption key means permanent data loss — export with `borg key export`

**Best for:** Users backing up to another Linux server via SSH who need maximum storage efficiency.

[Read our full guide: How to Set Up BorgBackup](/apps/borgbackup/)

### 3. Kopia — Best Modern Alternative

Kopia is the newest serious contender in the backup space. It combines Restic's multi-backend support with a built-in web UI, snapshot policies, and retention management. Think of it as "Restic with a GUI and better policy management."

**Pros:**
- Built-in web UI (server mode on port 51515)
- Policy-based retention (global, per-directory, per-host)
- S3, B2, SFTP, local, GCS, Azure, Rclone backends
- AES-256-GCM encryption
- Content-defined chunking (like Restic)
- Snapshot browsing via FUSE mount
- Active development, growing community

**Cons:**
- Newer project — less battle-tested than Restic or Borg
- Docker setup requires privileged mode for FUSE support
- Web UI is functional but not polished
- Smaller community means fewer guides and troubleshooting resources
- Documentation is improving but still gaps exist

**Best for:** Users who want Restic's backend flexibility with a web UI and built-in scheduling.

### 4. Duplicati — Best GUI Backup Tool

Duplicati provides a full web-based GUI for configuring, scheduling, and monitoring backups. For users who don't want to touch the command line, it's the only real option. Supports encryption, S3/B2/OneDrive/Google Drive backends, and email notifications.

**Pros:**
- Full web-based GUI — no CLI needed
- Built-in scheduler with retention policies
- Email notifications
- 25+ storage backends including consumer cloud (Google Drive, OneDrive)
- AES-256 encryption
- Runs on .NET (cross-platform)

**Cons:**
- .NET runtime means higher resource usage
- Known reliability issues with large backups (database corruption)
- Slower than Restic or Borg for large datasets
- Restore verification can be unreliable
- Development pace has slowed

**Best for:** Non-technical users who need a GUI. Use with caution for critical data — always verify restores.

### 5. Borgmatic — Best BorgBackup Automation

Borgmatic wraps BorgBackup with YAML-based configuration, making it easy to define backup schedules, retention policies, consistency checks, and hooks — all in a single config file. It turns Borg's manual CLI workflow into an automated system.

**Pros:**
- Simple YAML configuration for complex Borg workflows
- Built-in scheduling, retention, and consistency checks
- Pre/post backup hooks (database dumps, notifications)
- Supports multiple repositories in one config
- Healthcheck integration (Healthchecks.io, Uptime Kuma)

**Cons:**
- Requires BorgBackup (it's a wrapper, not standalone)
- Inherits Borg's limitations (SSH-only remote, no Windows)
- Adds a layer of abstraction to debug
- No GUI

**Best for:** Users who've chosen BorgBackup and want to automate it properly. The recommended way to run Borg in production.

## Full Comparison Table

| Feature | Restic | BorgBackup | Kopia | Duplicati | Borgmatic |
|---------|--------|------------|-------|-----------|-----------|
| Encryption | AES-256 (default) | AES-256 | AES-256-GCM | AES-256 | Via Borg |
| Deduplication | Content-defined | Content-defined | Content-defined | Block-level | Via Borg |
| Compression | zstd (v0.16+) | lz4/zstd/zlib/lzma | Multiple | Zip/7z | Via Borg |
| S3/cloud backends | Yes (20+) | No (SSH only) | Yes (many) | Yes (25+) | No (SSH only) |
| GUI | No | No | Web UI | Web UI | No |
| Built-in scheduler | No | No | Yes (policies) | Yes | Yes (cron) |
| Windows support | Yes | No | Yes | Yes | No |
| FUSE mount | Yes | Yes | Yes | No | Via Borg |
| Append-only mode | No | Yes | No | No | Via Borg |
| RAM usage | ~100-200 MB | ~200-500 MB | ~200-300 MB | ~300-500 MB | Via Borg |
| Maturity | High | Very High | Medium | Medium | High |
| License | BSD-2 | BSD-3 | Apache-2.0 | LGPL | GPL-3.0 |

## The 3-2-1 Backup Rule

Every self-hoster should follow the 3-2-1 rule:

- **3** copies of your data
- **2** different storage media
- **1** copy offsite

**Example setup with Restic:**
1. Primary data on your server's drives
2. Local backup to a USB drive or NAS: `restic -r /mnt/backup backup /data`
3. Offsite backup to Backblaze B2: `restic -r b2:bucket-name backup /data`

This costs roughly $5-10/month for 1 TB of B2 storage — far less than any managed backup service.

[Read our full guide: Backup Strategy (3-2-1 Rule)](/foundations/backup-strategy/)

## How We Evaluated

We evaluated each tool on: reliability (does restore actually work?), encryption strength, storage efficiency, backend flexibility, ease of automation, resource usage, and community support. Restic ranks #1 because it's the most reliable and versatile. BorgBackup ranks #2 for its superior compression. Kopia ranks #3 as the best modern alternative with a GUI.

## Related

- [How to Set Up Restic](/apps/restic/)
- [How to Set Up BorgBackup](/apps/borgbackup/)
- [Restic vs BorgBackup](/compare/restic-vs-borgbackup/)
- [Replace Backblaze](/replace/backblaze/)
- [Replace CrashPlan](/replace/crashplan/)
- [Backup Strategy (3-2-1 Rule)](/foundations/backup-strategy/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Volumes & Bind Mounts](/foundations/docker-volumes/)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
