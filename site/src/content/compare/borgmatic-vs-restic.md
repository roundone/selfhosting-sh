---
title: "Borgmatic vs Restic: Which Backup Tool to Use?"
description: "Borgmatic (BorgBackup) vs Restic comparison for self-hosting. Deduplication, encryption, performance, and which CLI backup tool is better."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "backup"
apps:
  - borgmatic
  - restic
tags:
  - comparison
  - borgmatic
  - restic
  - borgbackup
  - backup
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Both are excellent CLI backup tools. Restic is faster, supports more backends natively (S3, B2, Azure, GCS), and is easier to learn. Borgmatic (wrapping BorgBackup) has better compression, more mature deduplication, and Docker-native scheduling via cron. Choose Restic for cloud backups, Borgmatic for local/SSH backups.

## Overview

Borgmatic is a configuration wrapper around BorgBackup that adds YAML-based config, scheduling, and hooks. BorgBackup is a deduplicating archiver focused on efficiency and security. Restic is a standalone backup tool with similar goals — deduplication, encryption, and speed — but supports more storage backends natively.

## Feature Comparison

| Feature | Borgmatic (BorgBackup) | Restic |
|---------|----------------------|--------|
| Configuration | YAML config file | CLI flags / env vars |
| Docker support | Official image with cron | CLI tool (script + cron) |
| Storage backends | Local, SSH/SFTP only | Local, SFTP, S3, B2, Azure, GCS, REST |
| Encryption | AES-256 (repokey or keyfile) | AES-256 (always on) |
| Compression | LZ4, zstd, zlib, lzma | zstd (since v0.16) |
| Deduplication | Content-defined chunking | Content-defined chunking |
| Incremental backups | Yes | Yes (snapshots) |
| Mount backups | Yes (FUSE) | Yes (FUSE) |
| Pre/post hooks | Yes (database dumps, notifications) | Via scripts |
| Healthcheck integration | Yes (healthchecks.io, Apprise) | Via scripts |
| Database dump hooks | Built-in (PostgreSQL, MySQL, MongoDB) | Via scripts |
| Backup verification | `borg check` | `restic check` |
| Pruning/retention | Built-in (keep-daily, keep-weekly, etc.) | Built-in (--keep-daily, etc.) |
| Speed | Fast | Faster (especially restores) |
| RAM usage | Moderate | Moderate |
| Key management | CRITICAL — export with `borg key export` | Password-only (simpler) |

## Installation Complexity

**Borgmatic** has an official Docker image (`ghcr.io/borgmatic-collective/borgmatic:1.9.14`) that includes BorgBackup, cron scheduling, and a YAML config file. Mount your config, your SSH keys (for remote repos), and your source data. The YAML config is well-documented and supports hooks for database dumps before backup.

**Restic** is typically installed as a system package (`apt install restic`) and scheduled via cron or systemd timers. The Docker image exists but is less commonly used since Restic is a one-shot CLI tool, not a daemon.

Borgmatic's Docker approach is more self-contained. Restic's system-level approach is simpler but requires more manual setup for scheduling and hooks.

## Performance and Resource Usage

Restic is generally faster, especially for restores. Both use content-defined chunking for deduplication, but Restic's implementation is slightly more efficient for large file changes.

BorgBackup has better compression options — it supports LZ4 (fast), zstd (balanced), zlib, and lzma (maximum compression). Restic added zstd compression in v0.16 but offers fewer options.

For backups over SSH (the primary use case for BorgBackup), performance is comparable. Restic's advantage shows more with cloud storage backends.

## Community and Support

Both are mature, well-maintained projects with active communities. BorgBackup has been around longer (fork of Attic, 2015). Restic started in 2014 and has gained significant momentum in the self-hosting community.

## Use Cases

### Choose Borgmatic If...
- Your backup destination is another server over SSH
- You want built-in database dump hooks (PostgreSQL, MySQL)
- You want Docker-native backup scheduling with cron
- You need the best possible compression ratios
- You want YAML-based configuration (no scripts needed)
- You use healthchecks.io or Apprise for monitoring

### Choose Restic If...
- You're backing up to S3, Backblaze B2, or cloud storage
- You want the fastest restore performance
- You prefer CLI simplicity over config files
- You're already familiar with Restic's interface
- You need multiple storage backends for 3-2-1 backups
- You want the simplest possible password-based encryption

## Final Verdict

**Restic wins for cloud storage backups.** Native S3 and B2 support, faster performance, and simpler encryption (password-only, no key export needed) make it the better choice for cloud-based backup strategies.

**Borgmatic wins for SSH-based backups.** The Docker image with built-in cron, YAML config, database dump hooks, and notification integrations make it the most turnkey backup solution for server-to-server backups.

Both are excellent. The biggest factor is your backup destination: cloud storage → Restic, SSH server → Borgmatic.

## Related

- [How to Self-Host Borgmatic](/apps/borgmatic)
- [How to Self-Host Restic](/apps/restic)
- [How to Self-Host BorgBackup](/apps/borgbackup)
- [How to Self-Host Duplicati](/apps/duplicati)
- [Duplicati vs Borgmatic](/compare/duplicati-vs-borgmatic)
- [Duplicati vs Restic](/compare/duplicati-vs-restic)
- [Best Self-Hosted Backup Tools](/best/backup)
- [Backup Strategy (3-2-1 Rule)](/foundations/backup-3-2-1-rule)
