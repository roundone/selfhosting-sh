---
title: "Best Self-Hosted Photo Management in 2026"
description: "Compare the best self-hosted photo management apps including Immich, PhotoPrism, LibrePhotos, Lychee, and more."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "photo-management"
apps:
  - immich
  - photoprism
  - librephotos
  - lychee
  - photoview
  - piwigo
tags:
  - best
  - self-hosted
  - photo-management
  - google-photos-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Picks

| Use Case | Best Choice | Why |
|----------|-------------|-----|
| Best overall | Immich | Closest to Google Photos — mobile auto-upload, ML search, face recognition, maps, 90K+ GitHub stars |
| Best for AI features | PhotoPrism | Mature AI classification, RAW support, stable codebase |
| Best fully free (FOSS) | LibrePhotos | MIT license, no paid tier, face recognition included |
| Best for photographers | Lychee | Beautiful gallery UI, public sharing, album-focused |
| Best lightweight | Photoview | Read-only gallery, ~1 GB RAM, scans existing folders |
| Best for large collections | Piwigo | 23 years mature, handles 500K+ photos, 350+ plugins |

## The Full Ranking

### 1. Immich — Best Overall

[Immich](https://immich.app) is the best self-hosted photo management app for most people. It is the closest thing to a self-hosted Google Photos that exists. Native iOS and Android apps with automatic background upload, CLIP-based smart search (search "dog on beach" and it works), facial recognition with person grouping, a map view, shared albums, partner sharing, and a fast, polished web UI. With 90,000+ GitHub stars, it is one of the most popular self-hosted projects on the internet.

Immich runs four containers: the main server, a machine learning service, PostgreSQL with pgvecto.rs, and Valkey (Redis-compatible cache). It needs 4 GB of RAM minimum and 8 GB if you want responsive ML processing. The setup is straightforward with Docker Compose and an `.env` file.

**Pros:**
- Native mobile apps with auto-upload (iOS and Android)
- CLIP smart search — describe what you want in natural language
- Facial recognition with person grouping
- Map view with GPS data
- Shared albums and partner sharing
- Timeline view identical to Google Photos
- External library support (scan existing folders)
- Very active development — weekly releases
- 90,000+ GitHub stars, massive community

**Cons:**
- Under active development — breaking changes between versions
- Higher resource usage (4–8 GB RAM with ML)
- No RAW file support in the web viewer (thumbnails work)
- No plugin system
- Requires PostgreSQL with vector extensions (not a generic Postgres)

**Best for:** Anyone replacing Google Photos, iCloud Photos, or Amazon Photos. Families, individuals, anyone who wants mobile auto-upload with smart search.

[Read our full guide: How to Self-Host Immich](/apps/immich)

### 2. PhotoPrism — Best for AI Features

[PhotoPrism](https://www.photoprism.app) is the most mature AI-powered photo management app in the self-hosted space. It indexes your existing library and applies TensorFlow-based classification, facial recognition, location mapping, and color analysis. Excellent RAW file support (including DNG, CR2, ARW), live photo playback, panorama viewing, and automatic album creation by subject, location, and date.

PhotoPrism is written in Go and uses MariaDB for its database. It needs 4 GB of RAM minimum and 4 GB of swap for indexing large libraries. The Essentials edition is free for personal use; the Plus edition adds advanced features for sponsors.

**Pros:**
- Mature AI classification and tagging
- Excellent RAW file support
- Automatic albums (by subject, place, date, camera)
- Live photo and panorama support
- Face recognition with clustering
- WebDAV access for direct file management
- Stable, well-tested codebase
- Good documentation

**Cons:**
- No mobile app with auto-upload (web-only, or use third-party sync)
- Some advanced features require sponsorship (Plus edition)
- Slower indexing on large libraries than Immich
- Higher disk usage from thumbnail generation (~50% of library size)
- Written in Go — harder to contribute to than Python/JS projects

**Best for:** Photographers with large existing libraries who want AI tagging, RAW support, and a stable platform. Users who don't need mobile auto-upload.

[Read our full guide: How to Self-Host PhotoPrism](/apps/photoprism)

### 3. LibrePhotos — Best Fully Free Option

[LibrePhotos](https://github.com/LibrePhotos/librephotos) is a fully open-source (MIT license) photo management app with face recognition, auto-tagging, location browsing, and timeline views. It is a fork of the discontinued OwnPhotos project, built with Django on the backend and React on the frontend. Every feature is free — there is no paid tier.

LibrePhotos runs four containers: a Django backend, a React frontend, PostgreSQL, and Nginx. It requires 4 GB of RAM minimum and 8 GB for comfortable face recognition processing.

**Pros:**
- Fully free and open source (MIT license)
- Face recognition and grouping
- Auto-tagging with object detection
- Location-based browsing with map view
- Timeline view
- No paid tier — everything is included
- Multi-user support

**Cons:**
- Slower development pace than Immich or PhotoPrism
- No native mobile app (web only)
- No mobile auto-upload
- Indexing is slow on large libraries
- Smaller community (~7K GitHub stars)
- UI is less polished than Immich or PhotoPrism
- Documentation is sparse in places

**Best for:** Users who want a fully FOSS photo management solution with face recognition and don't need mobile auto-upload or cutting-edge AI features.

[Read our full guide: How to Self-Host LibrePhotos](/apps/librephotos)

### 4. Lychee — Best for Photographers

[Lychee](https://lycheeorg.github.io/) is a self-hosted photo management app focused on gallery presentation and sharing rather than AI-powered library management. It excels at organizing albums, presenting photos with a clean minimal UI, generating public sharing links, and displaying EXIF metadata. Lychee v7 runs on FrankenPHP with Laravel Octane for fast performance.

Lychee needs just 2 GB of RAM and runs three containers (app, MariaDB, optional Redis). It is the best option for anyone who wants to present and share curated collections rather than manage a personal photo dump.

**Pros:**
- Beautiful, minimal gallery UI
- Public sharing with custom URLs
- Album-based organization
- EXIF data display
- Multi-user with permissions
- Lightweight (2 GB RAM)
- Smart albums (by tag, date, star rating)
- Import from Flickr, URL, or filesystem

**Cons:**
- No face recognition or AI features
- No mobile app
- No auto-upload from phone
- No map view
- Not designed for massive personal libraries
- No video management features

**Best for:** Photographers sharing portfolios, event photography galleries, curated collections meant for viewing. Not for personal photo library management.

[Read our full guide: How to Self-Host Lychee](/apps/lychee)

### 5. Photoview — Best Lightweight Gallery

[Photoview](https://photoview.github.io/) is a lightweight, read-only photo gallery that scans existing folders on your filesystem and presents them through a clean web UI. It generates thumbnails, detects faces, reads EXIF data for map views, and supports multi-user access with per-user media directories. It never moves or modifies your original files.

Photoview needs just 1 GB of RAM (2 GB recommended for face detection) and runs two containers (the app and MariaDB). It is the simplest option on this list — point it at your existing photo directories and browse.

**Pros:**
- Extremely lightweight (1 GB RAM)
- Scans existing folder structure — no import needed
- Never modifies original files
- Basic face detection
- Map view from EXIF GPS data
- Multi-user with per-user directories
- Fast thumbnail generation
- Simple setup

**Cons:**
- Read-only — cannot upload, edit, or organize through the UI
- No mobile app
- No smart search or AI tagging
- No sharing features
- No album creation (follows folder structure only)
- Smaller community, slower development
- Limited video support

**Best for:** Users who already have photos organized in folders on a NAS or server and want a fast gallery viewer without moving files. Ideal companion to Syncthing or Nextcloud file sync.

[Read our full guide: How to Self-Host Photoview](/apps/photoview)

### 6. Piwigo — Best for Large Collections

[Piwigo](https://piwigo.org/) is the veteran of self-hosted photo management with over 23 years of active development (since 2002). It is a gallery and organization tool built for managing and sharing large photo collections. With 350+ plugins, batch operations, granular user permissions, and proven scalability to 500,000+ photos, Piwigo is the enterprise-grade option.

Piwigo needs just 1 GB of RAM and runs two containers (the LinuxServer.io image and MariaDB). It is rock-solid and well-understood, but it is a traditional photo gallery — no AI features, no mobile auto-upload, no face recognition.

**Pros:**
- 23 years of development — extremely mature and stable
- 350+ plugins (watermarks, slideshows, themes, import tools)
- Handles 500,000+ photos without issues
- Batch upload and batch editing
- Granular user and group permissions
- Mobile-responsive web UI
- API for external integrations
- Low resource usage (1 GB RAM)

**Cons:**
- No AI features (no face recognition, no smart search)
- No mobile app with auto-upload
- UI feels dated compared to modern alternatives
- Plugin quality varies (community-maintained)
- PHP-based — some performance limitations at extreme scale
- No map view without plugins

**Best for:** Organizations, photography clubs, or large family archives that need proven reliability, fine-grained access control, and plugin extensibility. Not a Google Photos replacement.

[Read our full guide: How to Self-Host Piwigo](/apps/piwigo)

## Full Comparison Table

| Feature | Immich | PhotoPrism | LibrePhotos | Lychee | Photoview | Piwigo |
|---------|--------|------------|-------------|--------|-----------|--------|
| Primary purpose | Google Photos replacement | AI photo management | FOSS photo management | Photo gallery & sharing | Lightweight gallery viewer | Traditional photo gallery |
| Mobile app | Native iOS + Android | None (web only) | None (web only) | None (web only) | None (web only) | None (web only) |
| Auto-upload from phone | Yes (background sync) | No (use Syncthing) | No | No | No | No |
| Face recognition | Yes (ML-powered) | Yes (TensorFlow) | Yes (basic) | No | Basic detection | No |
| Smart search | CLIP (natural language) | TensorFlow classification | Auto-tagging | Tags only | No | Tags + plugins |
| RAW file support | Thumbnails only | Full (DNG, CR2, ARW+) | Limited | Limited | Yes | Via plugins |
| Map view | Yes | Yes | Yes | No | Yes | Via plugins |
| Public sharing | Shared albums, links | Link sharing | No | Yes (public galleries) | No | Yes (granular) |
| Plugin system | No | No | No | No | No | Yes (350+) |
| RAM (minimum) | 4 GB | 4 GB | 4 GB | 2 GB | 1 GB | 1 GB |
| Database | PostgreSQL + pgvecto.rs | MariaDB | PostgreSQL | MariaDB | MariaDB/SQLite | MariaDB |
| License | AGPL-3.0 | AGPL-3.0 (Essentials free) | MIT | MIT | AGPL-3.0 | GPL-2.0 |
| GitHub stars | 90K+ | 36K+ | 7K+ | 3.5K+ | 5K+ | 3K+ |
| Development pace | Very active (weekly) | Active (monthly) | Slow | Active | Slow | Stable (maintenance) |

## How We Evaluated

We ranked each app on six criteria:

1. **Google Photos parity** — How close does it come to replacing Google Photos? Mobile app, auto-upload, smart search, and face recognition are the table stakes.
2. **Setup and maintenance** — How many containers, how much RAM, how complex is the initial configuration? Self-hosting should not require a weekend of debugging.
3. **Feature depth** — AI capabilities, sharing options, multi-user support, external library scanning, video handling.
4. **Resource efficiency** — RAM, CPU, and disk requirements matter when you are running multiple services on one server.
5. **Community and longevity** — GitHub activity, documentation quality, community size, release cadence. A dead project is worse than a limited one.
6. **Use case fit** — Not everyone needs a Google Photos clone. Photographers, families, organizations, and minimalists have different needs. We reward apps that serve their target audience well.

Immich wins because it is the only self-hosted app that genuinely competes with Google Photos on the dimensions that matter most: mobile auto-upload, smart search, and a polished daily-use experience. PhotoPrism is the best alternative for users who prioritize AI maturity and RAW support over mobile convenience.

## Related

- [How to Self-Host Immich](/apps/immich)
- [How to Self-Host PhotoPrism](/apps/photoprism)
- [How to Self-Host LibrePhotos](/apps/librephotos)
- [How to Self-Host Lychee](/apps/lychee)
- [How to Self-Host Photoview](/apps/photoview)
- [How to Self-Host Piwigo](/apps/piwigo)
- [Immich vs PhotoPrism](/compare/immich-vs-photoprism)
- [Immich vs LibrePhotos](/compare/immich-vs-librephotos)
- [PhotoPrism vs LibrePhotos](/compare/photoprism-vs-librephotos)
- [Lychee vs Piwigo](/compare/lychee-vs-piwigo)
- [Immich vs Google Photos](/compare/immich-vs-google-photos)
- [PhotoPrism vs Piwigo](/compare/photoprism-vs-piwigo)
- [Self-Hosted Alternatives to Google Photos](/replace/google-photos)
- [Self-Hosted Alternatives to iCloud Photos](/replace/icloud-photos)
- [Self-Hosted Alternatives to Amazon Photos](/replace/amazon-photos)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
- [Backup Strategy](/foundations/backup-strategy)
