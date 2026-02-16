---
title: "Restic vs BorgBackup: Which Backup Tool to Use?"
description: "Restic vs BorgBackup compared — encryption, deduplication, storage backends, performance, and which is better for self-hosted backups."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "backup"
apps:
  - restic
  - borgbackup
tags:
  - comparison
  - restic
  - borgbackup
  - self-hosted
  - backup
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Restic is the better choice for most people. It supports more storage backends (S3, B2, SFTP, Azure, GCS, local), runs on every platform including Windows, and has a larger community. BorgBackup wins on compression efficiency and is the better choice if you're backing up via SSH to another Linux server and want the smallest possible backup size.

## Overview

**Restic** (2015) is a Go-based backup tool focused on simplicity, security, and broad backend support. It encrypts everything by default, deduplicates with content-defined chunking, and can back up to 20+ storage backends.

**BorgBackup** (2015, forked from Attic) is a Python-based backup tool focused on storage efficiency. It has the best compression options in the backup space (lz4, zstd, zlib, lzma) and pioneered content-addressed deduplication for backups.

Both emerged around the same time and solve the same problem. The differences are in the details.

## Feature Comparison

| Feature | Restic | BorgBackup |
|---------|--------|------------|
| Language | Go | Python/C |
| Encryption | AES-256-CTR + Poly1305 (default, always on) | AES-256-CTR + HMAC-SHA256 (optional) |
| Deduplication | Content-defined chunking (CDC) | Content-defined chunking (CDC) |
| Compression | zstd (since v0.16, 2023) | lz4, zstd, zlib, lzma (always supported) |
| S3-compatible backends | Yes (AWS, B2, Wasabi, MinIO, etc.) | No |
| SFTP/SSH | Yes | Yes (primary remote method) |
| Local filesystem | Yes | Yes |
| Rclone integration | Yes | No |
| Windows support | Yes | No (Linux, macOS, BSD only) |
| FUSE mount | Yes | Yes |
| Append-only mode | No | Yes |
| Lock-free | No (uses lock files) | No (uses lock files) |
| Key management | Password + repository key | Password + key file (`borg key export`) |
| Installation | Single static binary | pip install / package manager |
| RAM usage (typical) | 100-200 MB | 200-500 MB |

## Storage Backends

This is the biggest practical difference between the two tools.

**Restic** supports:
- Local directories
- SFTP
- REST server (Restic's own protocol)
- Amazon S3 (and any S3-compatible: Backblaze B2, Wasabi, MinIO, DigitalOcean Spaces)
- Azure Blob Storage
- Google Cloud Storage
- Rclone (adding 50+ backends indirectly)

**BorgBackup** supports:
- Local directories
- SSH (requires Borg installed on the remote server)

That's it. Borg's remote backup requires BorgBackup installed on both the client and the server. This means you need a Linux server with SSH access as your backup target. You can't back up directly to S3, B2, or any cloud storage provider.

**Workaround:** You can mount cloud storage via `rclone mount` or FUSE and point Borg at it, but this is fragile and not officially supported. If you need cloud storage backends, use Restic.

## Performance

### Initial Backup Speed

Restic is generally faster for initial backups because:
- Go's concurrency model parallelizes chunking and uploading
- Content-defined chunking is well-optimized in Go
- Multiple concurrent upload connections to cloud backends

BorgBackup can be slower initially but performs well for subsequent incremental backups.

### Incremental Backup Speed

Both tools are fast for incremental backups. They only process changed files and deduplicate at the chunk level. In practice, the difference is negligible for typical self-hosted workloads.

### Compression Efficiency

BorgBackup wins here. It has supported compression from the beginning with multiple algorithms:
- **lz4**: Fastest, moderate compression
- **zstd**: Good balance of speed and ratio (recommended)
- **zlib**: Higher compression, slower
- **lzma**: Best compression, slowest

Restic added zstd compression in v0.16 (2023). It works well, but Borg offers more compression options and typically achieves slightly better ratios due to its longer compression heritage and tuning options.

**For most workloads**, the compression difference is 5-15% — meaningful for multi-terabyte datasets, negligible for typical home server backups.

## Encryption

Both encrypt all backup data. Neither stores anything in plaintext.

**Restic:** Encryption is mandatory. Uses AES-256-CTR for data, Poly1305 for authentication. Every repository is encrypted. No opt-out.

**BorgBackup:** Encryption is optional (but strongly recommended). Modes: `repokey` (key in repo), `keyfile` (key on client), or `none`. The `repokey` mode is the default and recommended. **Critical:** If you lose the key AND the passphrase, your backups are permanently irrecoverable. Always run `borg key export`.

Both tools handle encryption well. Restic's "always encrypted" approach is safer because there's no way to accidentally create an unencrypted repository.

## Installation Complexity

**Restic:** Download a single static binary. No dependencies. Works immediately.

```bash
# Install on Debian/Ubuntu
apt install restic
# Or download directly
wget https://github.com/restic/restic/releases/download/v0.18.1/restic_0.18.1_linux_amd64.bz2
```

**BorgBackup:** Python package with C extensions. Requires Python 3.9+, libacl, liblz4, libzstd.

```bash
# Install on Debian/Ubuntu
apt install borgbackup
# Or via pip
pip install borgbackup
```

Both are straightforward on Linux, but Restic's single binary is simpler for unusual environments (containers, minimal images, cross-compilation).

## Use Cases

### Choose Restic If...
- You want to back up to cloud storage (S3, B2, Wasabi)
- You need Windows support
- You want the simplest possible installation
- You're setting up backups for the first time
- You use multiple operating systems
- You want the largest community and most documentation

### Choose BorgBackup If...
- You're backing up to another Linux server via SSH
- Storage efficiency is your top priority (multi-TB datasets)
- You want append-only repositories (ransomware protection)
- You want the most mature compression options
- You only use Linux/macOS
- You're comfortable with `borg key export` key management

## Automation

Neither tool has a built-in scheduler. Both need external automation.

**For Restic:** Use [Resticprofile](https://github.com/creativeprojects/resticprofile), [Autorestic](https://autorestic.vercel.app/), or simple cron/systemd timers.

**For BorgBackup:** Use [Borgmatic](/apps/borgmatic) — a YAML-configured wrapper that handles scheduling, retention, consistency checks, and pre/post hooks. Borgmatic is the recommended way to run Borg in production.

## Final Verdict

**Restic** is the right choice for most self-hosters. Its broad backend support means you can back up to any storage provider. The single-binary installation is dead simple. The community is massive. It does everything well.

**BorgBackup** is the right choice if you have a dedicated backup server with SSH access and want the best possible compression ratios. Pair it with Borgmatic for automation.

If you're unsure, start with Restic. You can always switch later — both tools produce standard backup formats that can be migrated.

## Related

- [How to Set Up Restic](/apps/restic)
- [How to Set Up BorgBackup](/apps/borgbackup)
- [Best Self-Hosted Backup Solutions](/best/backup)
- [Replace Backblaze](/replace/backblaze)
- [Backup Strategy (3-2-1 Rule)](/foundations/backup-strategy)
- [Docker Volumes & Bind Mounts](/foundations/docker-volumes)
