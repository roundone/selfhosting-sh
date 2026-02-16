---
title: "Lychee vs Photoview: Which Should You Self-Host?"
description: "Compare Lychee and Photoview for self-hosted photo galleries. Album management, sharing, resource usage, and setup complexity compared."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "photo-management"
apps:
  - lychee
  - photoview
tags: ["comparison", "lychee", "photoview", "self-hosted", "photos"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Lychee is the better choice for most lightweight gallery needs — it supports uploads, album management, sharing with passwords, and has active development. Photoview is better if you specifically want a read-only gallery that indexes existing filesystem directories without any file management.

## Overview

**Lychee** is a self-hosted photo gallery and management tool. It provides album creation, photo uploads, password-protected sharing, and a clean web interface. Lychee v7 introduced FrankenPHP as the backend and added WebAuthn/passkey authentication. It's actively maintained under the MIT license.

**Photoview** is a read-only photo gallery that scans directories on your filesystem. It generates thumbnails, extracts EXIF data, and provides a browsable web interface. It doesn't upload, move, or modify files — it's purely a viewer for existing photo collections.

## Feature Comparison

| Feature | Lychee | Photoview |
|---------|--------|-----------|
| Photo upload via web UI | Yes | No |
| Album management | Yes (create, organize, nest) | Read-only (mirrors filesystem) |
| Password-protected sharing | Yes | Share tokens only |
| Public galleries | Yes | Yes |
| Map view (GPS) | Yes | Yes |
| EXIF display | Yes | Yes |
| Face detection | No | Yes (optional, basic) |
| RAW photo support | Yes | Yes |
| Video support | Basic | Basic |
| Multi-user | Yes | Yes (per-user paths) |
| OAuth/SSO | GitHub, Google, Keycloak, Nextcloud, Authentik | No |
| WebAuthn/Passkeys | Yes (v7+) | No |
| API | REST API | GraphQL API |
| Docker complexity | Low (2-3 containers) | Low (2 containers) |
| RAM usage | 256-512 MB | 200-500 MB |
| Development activity | Active (v7 released 2025) | Slow (last release June 2024) |
| License | MIT | GPL-3.0 |

## Installation Complexity

Both are lightweight and simple to set up.

**Lychee** needs the app container and MariaDB. The v7 image runs on port 8000 (changed from 80) and requires generating an `APP_KEY` environment variable with `openssl rand -base64 32`. FrankenPHP handles everything — no separate nginx needed.

**Photoview** needs the app container and MariaDB (or PostgreSQL/SQLite). The critical gotcha is setting `PHOTOVIEW_LISTEN_IP=0.0.0.0` — without it, the container rejects external connections. Mount your photo directories and Photoview scans them automatically.

Both run on minimal hardware — 1 GB RAM, single core, no swap requirements.

## Performance and Resource Usage

| Resource | Lychee | Photoview |
|----------|--------|-----------|
| Idle RAM | ~150 MB | ~100 MB |
| Active RAM | 256-512 MB | 200-500 MB |
| Disk (app) | ~100 MB | ~50 MB |
| Minimum server | 1 GB RAM, 1 core | 1 GB RAM, 1 core |

Nearly identical resource usage. Both are excellent choices for low-power hardware like a Raspberry Pi 4.

Photoview uses more RAM when face detection is enabled (~500 MB extra). Lychee uses more when Redis caching is enabled, but it's optional.

## Community and Support

**Lychee:** 3,500+ GitHub stars, active development, regular releases. v7 was a major modernization. MIT license is permissive. Active community on GitHub Discussions.

**Photoview:** ~5,400 stars, but development has slowed significantly. Last release was June 2024. GitHub shows sporadic commits but no new versions. Functional, not abandoned, but stagnating.

## Use Cases

### Choose Lychee If...

- You want to upload photos through the web interface
- Album organization and management matter
- Password-protected sharing is needed
- You want OAuth/SSO authentication
- Active development and updates matter
- You want a gallery that works as a photo management tool

### Choose Photoview If...

- Your photos are organized on the filesystem and you don't want to re-upload
- You want a purely read-only viewer that never touches your files
- Per-user access to different directories is important
- Basic face detection is useful
- A minimal, no-frills viewer is all you need

## Final Verdict

**Lychee is the better option for most lightweight gallery needs.** It does everything Photoview does (display photos in a web UI) plus more: uploads, album management, password sharing, OAuth. It's actively developed and well-maintained.

**Photoview's only advantage is its read-only, filesystem-first approach.** If you specifically want software that scans directories and never modifies anything, Photoview does that well. But for anything beyond passive viewing, Lychee offers more functionality with comparable resource usage.

Unless the read-only filesystem scanning is a hard requirement, choose Lychee.

## Frequently Asked Questions

### Can Lychee scan existing photo directories like Photoview?
Yes. Lychee can import photos from server directories. However, it copies or moves them into its own storage structure rather than indexing them in place. Photoview indexes photos where they already are without moving them.

### Is Photoview abandoned?
Not officially, but development has slowed dramatically. The last release was v2.4.0 in June 2024. It works well for its intended purpose, but new features are unlikely. Lychee is the safer bet for long-term use.

### Which handles large libraries (50,000+ photos) better?
Both handle large libraries reasonably well. Lychee uses MariaDB for indexing, which scales effectively. Photoview also uses MariaDB/PostgreSQL. The bottleneck for both is thumbnail generation on initial scan, not ongoing browsing.

## Related

- [How to Self-Host Lychee](/apps/lychee)
- [How to Self-Host Photoview](/apps/photoview)
- [Immich vs Lychee](/compare/immich-vs-lychee)
- [Immich vs Photoview](/compare/immich-vs-photoview)
- [Lychee vs Piwigo](/compare/lychee-vs-piwigo)
- [Best Self-Hosted Photo Management](/best/photo-management)
