---
title: "Duplicati vs Borgmatic: Which Backup Tool?"
description: "Duplicati vs Borgmatic compared for self-hosted backups — GUI vs CLI, cloud support, deduplication, and which fits your needs."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "backup"
apps:
  - duplicati
  - borgmatic
tags:
  - comparison
  - duplicati
  - borgmatic
  - backup
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Borgmatic is the better backup tool for most self-hosters. Its deduplication is genuinely superior, it handles large datasets faster, and its YAML config files are version-controllable and reproducible. Duplicati wins if you need a web UI or native cloud storage support (S3, B2, Google Drive) without extra tooling. If you are comfortable with the command line, pick Borgmatic. If you want to click through a GUI and back up directly to cloud storage, pick Duplicati.

## Overview

Duplicati is a GUI-first backup tool written in C#/.NET. It runs a web interface on port 8200 where you configure backup jobs, select sources, choose destinations, and set schedules. It supports a wide range of cloud backends natively — Amazon S3, Backblaze B2, Google Drive, OneDrive, SFTP, and more. Encryption uses AES-256, and backups are incremental and block-based.

Borgmatic is a Python wrapper around BorgBackup. It replaces Borg's verbose CLI with a clean YAML configuration file. You define your source directories, repositories, retention policies, and hooks in a single `config.yaml`, then borgmatic handles the rest — creating archives, pruning old ones, and running consistency checks. Borg's deduplication engine is content-defined chunking, which means identical data across different files or backups is stored only once. Remote backups go over SSH to any server running Borg.

Both tools run well in Docker. Duplicati uses the LinuxServer.io image (`lscr.io/linuxserver/duplicati`), while Borgmatic uses the official image from the borgmatic-collective (`ghcr.io/borgmatic-collective/borgmatic`). Both can be scheduled — Duplicati through its web UI scheduler, Borgmatic through cron (typically configured inside the container).

## Feature Comparison

| Feature | Duplicati | Borgmatic |
|---------|-----------|-----------|
| Interface | Web UI (port 8200) | CLI + YAML config |
| Underlying engine | Custom C#/.NET | BorgBackup (Python/C) |
| Deduplication | Block-level incremental | Content-defined chunking (superior) |
| Encryption | AES-256 | AES-256-CTR (via Borg) |
| Compression | Zip, 7z, no compression | LZ4, zstd, lzma, none |
| Cloud backends | S3, B2, Google Drive, OneDrive, SFTP, WebDAV, 20+ | SSH/SFTP (native); cloud via rclone mount |
| Remote protocol | Varies by backend | SSH with Borg server |
| Scheduling | Built-in UI scheduler | Cron (inside or outside container) |
| Restore method | Web UI or CLI | CLI (`borgmatic extract`) |
| Configuration | Database + web UI settings | Single YAML file (version-controllable) |
| Docker image | `lscr.io/linuxserver/duplicati` | `ghcr.io/borgmatic-collective/borgmatic` |
| Cross-platform | Windows, macOS, Linux | Linux, macOS (Borg requirement) |

## Installation Complexity

**Duplicati** is simpler to get running. Pull the LinuxServer.io image, map your volumes, and open the web UI. Everything is configured through the browser — source folders, destination, schedule, encryption passphrase, retention. No config files to write. A complete Docker Compose setup:

```yaml
services:
  duplicati:
    image: lscr.io/linuxserver/duplicati:2.0.9.3
    container_name: duplicati
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
    volumes:
      - duplicati-config:/config
      - /path/to/backups:/backups
      - /path/to/source:/source:ro
    ports:
      - "8200:8200"
    restart: unless-stopped

volumes:
  duplicati-config:
```

Start it, open `http://your-server:8200`, and click through the wizard to create your first backup job.

**Borgmatic** requires writing a YAML configuration file before anything runs. You need to define repositories, source directories, retention policy, and optionally encryption and hooks. The Docker setup mounts this config file and your SSH keys (for remote repos) into the container:

```yaml
services:
  borgmatic:
    image: ghcr.io/borgmatic-collective/borgmatic:1.9.5
    container_name: borgmatic
    environment:
      - TZ=America/New_York
      - BORG_PASSPHRASE=your-strong-passphrase-here
    volumes:
      - ./borgmatic/config.yaml:/etc/borgmatic/config.yaml:ro
      - ./borgmatic/ssh:/root/.ssh:ro
      - borg-cache:/root/.cache/borg
      - /path/to/source:/source:ro
      - /path/to/local-repo:/repository
    restart: unless-stopped

volumes:
  borg-cache:
```

You also need to initialize the Borg repository before the first backup (`borgmatic init --encryption repokey-blake2`), and set up cron inside the container or use the image's built-in cron support. More steps, but the result is a fully declarative, reproducible setup.

**Winner: Duplicati** for ease of setup. If you have never configured backups before, Duplicati's web UI walks you through every step. Borgmatic assumes you know what a Borg repository is and how SSH keys work.

## Performance and Resource Usage

This is where Borgmatic pulls ahead decisively.

**Deduplication efficiency.** Borg uses content-defined chunking (CDC), which means it splits files into variable-size chunks based on content boundaries. When a file changes, only the modified chunks are stored. Duplicati uses fixed-block incremental backups, which is less efficient — small insertions at the beginning of a file can cause most blocks to shift, resulting in more data stored. For large, frequently-changing datasets (databases, mail stores, VM images), Borg's deduplication can use 30-50% less storage than Duplicati over time.

**Backup speed.** Borgmatic/Borg is faster on subsequent backups because its deduplication index makes it efficient at identifying unchanged data. Duplicati can be slower on large datasets because its block-based comparison and database operations add overhead. Users with multi-terabyte backup sets consistently report Borgmatic completing in a fraction of the time Duplicati takes.

**Resource usage.** Duplicati's web UI and C#/.NET runtime consume more RAM at idle (typically 200-400 MB). Borgmatic is lighter — Borg itself uses modest memory during backups (100-300 MB depending on dataset size) and nothing between runs since it is cron-triggered, not a persistent daemon.

**Restore speed.** Borgmatic restores are fast because Borg stores deduplicated chunks that can be reassembled quickly. Duplicati restores from cloud backends can be slow due to the number of small encrypted files it creates and the reassembly process.

**Winner: Borgmatic.** Superior deduplication, faster backups on large datasets, lower resource usage. Duplicati is adequate for small backup sets (under 500 GB) but struggles at scale.

## Community and Support

**Duplicati** has a large user base, particularly among Windows and cross-platform users. The project has been in development since 2008, though the 2.x version has been in beta for years (a common criticism). The forum is active, and the GUI makes it accessible to a broader audience. GitHub activity has slowed in recent years, with long gaps between releases.

- GitHub stars: ~11,000+
- Forum: Active community forum
- Docker pulls: High (via LinuxServer.io)
- Release cadence: Irregular; 2.x has been "beta" for a long time
- Documentation: Decent, mostly community-contributed

**Borgmatic** benefits from BorgBackup's strong reputation in the Linux sysadmin community. Borg itself is mature, well-audited, and actively maintained. Borgmatic adds a user-friendly configuration layer on top. The borgmatic documentation is excellent — clear, comprehensive, and well-organized.

- GitHub stars: ~7,000+ (borgmatic) + ~11,000+ (BorgBackup)
- Community: Strong in Linux/sysadmin circles, Borg mailing list
- Docker pulls: Growing (official borgmatic-collective image)
- Release cadence: Regular updates for both borgmatic and Borg
- Documentation: Excellent (borgmatic docs are a model of clarity)

**Winner: Borgmatic.** More actively maintained, better documentation, and backed by the rock-solid BorgBackup project. Duplicati's perpetual beta status is a concern for a tool you trust with your data.

## Use Cases

### Choose Duplicati If...

- You want a web UI for configuring and monitoring backups
- You need to back up directly to cloud storage (S3, B2, Google Drive, OneDrive) without additional tools
- You are on Windows or need cross-platform support
- You are new to self-hosted backups and want a guided setup experience
- Your backup set is under 500 GB and you value convenience over performance
- You want to restore individual files through a browser interface

### Choose Borgmatic If...

- You are comfortable with the command line and YAML configuration
- You have large datasets (1 TB+) where deduplication efficiency matters
- You want version-controllable, reproducible backup configurations
- You back up to a remote server over SSH (a common self-hosting pattern)
- You want the best deduplication and compression available
- You value stability and active maintenance over GUI convenience
- You run Linux servers and want a tool built for that environment
- You want to integrate backups with other automation (hooks for pre/post backup scripts)

## Final Verdict

**Borgmatic is the better choice for self-hosters.** The typical self-hosting setup is a Linux server backing up to another Linux server (or a local repository), and that is exactly what Borgmatic is built for. Borg's deduplication is best-in-class, the YAML config is clean and auditable, and the project is actively maintained by people who care about data integrity.

Duplicati is not a bad tool — its cloud backend support is genuinely useful if you need to push backups to Google Drive or Backblaze B2 without setting up rclone. And the web UI removes friction for users who do not want to write config files. But the perpetual beta status, slower performance on large datasets, and higher resource usage make it the weaker choice for serious self-hosted infrastructure.

If you are managing a homelab with Docker containers and want reliable, efficient, automated backups — set up Borgmatic, write a `config.yaml`, and forget about it. Your data will be safer for it.

## Related

- [How to Self-Host Duplicati](/apps/duplicati)
- [How to Self-Host Borgmatic](/apps/borgmatic)
- [How to Self-Host Restic](/apps/restic)
- [Restic vs BorgBackup](/compare/restic-vs-borgbackup)
- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule)
- [Best Self-Hosted Backup Solutions](/best/backup)
- [Docker Compose Basics](/foundations/docker-compose-basics)
