---
title: "Immich vs LibrePhotos: Which Should You Self-Host?"
description: "Immich vs LibrePhotos compared — features, mobile apps, AI search, Docker setup complexity, and which self-hosted photo manager is right for you."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "photo-management"
apps:
  - immich
  - librephotos
tags: ["comparison", "immich", "librephotos", "photos", "self-hosted", "google-photos-alternative"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Immich is the better choice for most people. It has native mobile apps with auto-upload, CLIP-based smart search, faster development velocity, and a more polished UI. LibrePhotos is a viable option if you specifically need a fully MIT-licensed, no-paid-tier solution and don't need a mobile app — but Immich leads in nearly every other dimension.

## Overview

**[Immich](https://immich.app)** is a self-hosted photo and video management platform built as a direct Google Photos replacement. It launched in 2022 and has grown to 90,000+ GitHub stars, making it one of the fastest-growing self-hosted projects. Immich ships native iOS and Android apps, AI-powered search, facial recognition, and a polished web timeline. It runs on a multi-service Docker stack (server, ML, PostgreSQL with vector extensions, Valkey).

**[LibrePhotos](https://github.com/LibrePhotos/librephotos)** is a fork of the discontinued OwnPhotos project. It provides face recognition, auto-tagging, timeline views, and location-based browsing through a Django/React web application. LibrePhotos is fully MIT-licensed with no paid tier. It also runs as a multi-service Docker stack (backend, frontend, proxy, PostgreSQL), but development velocity has slowed significantly compared to Immich.

## Feature Comparison

| Feature | Immich | LibrePhotos |
|---------|--------|-------------|
| Native mobile apps | iOS + Android (excellent) | None (web only) |
| Auto-upload from phone | Yes (background upload) | No |
| Face recognition | Yes (fast, accurate) | Yes (slower, decent) |
| Smart search (CLIP) | Yes ("dog on beach" queries) | No |
| Object detection/tagging | Yes | Yes (basic) |
| Map view | Yes | Yes (requires Mapbox API key) |
| Timeline view | Yes (smooth, fast) | Yes (functional) |
| Video support | Full (transcoding, thumbnails) | Limited |
| Shared albums | Yes | No |
| Partner/family sharing | Yes | Limited (multi-user) |
| OAuth/SSO support | Yes (OIDC) | No |
| External library import | Yes (read-only mounts) | Yes (scan directory) |
| GPU acceleration | Yes (NVIDIA, Intel, ARM) | Yes (NVIDIA only) |
| License | AGPL-3.0 | MIT |
| Paid tier | None (fully free) | None (fully free) |
| GitHub stars | 90,000+ | 7,000+ |
| Active development | Very active (weekly releases) | Slow (months between releases) |
| API | REST API (documented) | REST API (limited docs) |

## Installation Complexity

Both apps require multi-container Docker setups, but the experience differs.

**Immich** runs four containers: server, machine learning, PostgreSQL (custom image with vector extensions), and Valkey (Redis-compatible). The official `.env` template makes setup straightforward — define paths, set a database password, and run `docker compose up -d`. The custom PostgreSQL image is non-negotiable; you cannot substitute a generic Postgres image because Immich requires vector search extensions.

**LibrePhotos** also runs four containers: backend, frontend, Nginx proxy, and PostgreSQL. Configuration is more scattered — you need a `.env` file with 15+ variables, including separate settings for the scan directory, data directory, CSRF origins, and admin credentials. The proxy layer adds a component that Immich handles internally.

**Winner: Immich.** Slightly cleaner setup with better-documented defaults. LibrePhotos has more configuration knobs to get right before first startup.

## Performance and Resource Usage

| Metric | Immich | LibrePhotos |
|--------|--------|-------------|
| RAM (idle) | ~2 GB | ~1 GB |
| RAM (ML processing) | 4-8 GB | 2-4 GB |
| CPU (idle) | Low | Low |
| CPU (initial scan) | High (but faster) | High (slower) |
| Disk (app + ML models) | ~20 GB | ~5 GB |
| Minimum recommended RAM | 4 GB (8 GB with ML) | 4 GB |

Immich is heavier on resources but processes photos faster. Its ML pipeline is more sophisticated (CLIP embeddings, face recognition, object detection all run simultaneously) and benefits significantly from GPU acceleration. LibrePhotos is lighter but slower to process large libraries.

For a library of 50,000 photos: Immich processes the full library in 12-24 hours on a 4-core CPU; LibrePhotos can take 2-3 days for face detection alone.

## Community and Support

**Immich** has a massive, active community. The GitHub repo sees multiple commits daily, weekly releases, and active Discussions and Discord channels. Bug reports get triaged quickly. Documentation is comprehensive and kept current.

**LibrePhotos** has a smaller community. Development has slowed — the last significant feature release was in late 2025. Issues and PRs accumulate without resolution for longer periods. Documentation exists but is less polished than Immich's.

**Winner: Immich** by a wide margin. The development velocity difference is stark.

## Use Cases

### Choose Immich If...

- You want mobile auto-upload (the #1 reason people switch from Google Photos)
- You want smart search ("find photos of my cat at the beach")
- You share albums with family members
- You want the most actively developed option
- You have 8 GB+ RAM available
- You want GPU-accelerated video transcoding

### Choose LibrePhotos If...

- You specifically need an MIT-licensed solution (Immich is AGPL-3.0)
- You only browse photos from a desktop/laptop browser
- You have limited server resources (4 GB RAM, no GPU)
- You want a simpler architecture to maintain
- You don't need smart search or shared albums
- You want a "set and forget" tool that scans an existing directory

## Final Verdict

Immich is the clear winner for the vast majority of self-hosting users. The mobile app alone makes it the obvious choice — the entire point of replacing Google Photos is seamless photo backup from your phone, and LibrePhotos simply cannot do that.

Beyond mobile, Immich's CLIP-based smart search is genuinely useful (searching "sunset" or "birthday party" actually returns relevant results), its sharing features work well for families, and the development team ships improvements at a pace that matches commercial products.

LibrePhotos fills a niche for users who prioritize the MIT license, want a lighter-weight solution, or only need desktop photo browsing with face grouping. It's a functional tool that does the basics well. But if you're choosing between the two for a new deployment, start with Immich.

## FAQ

### Can I migrate from LibrePhotos to Immich?

There's no direct migration tool. Both apps read photos from a directory, so the simplest approach is to point Immich at the same photo library using an external library mount. You'll lose face-name assignments from LibrePhotos and need to re-identify people in Immich, but the photos and their EXIF metadata transfer automatically.

### Is Immich's AGPL license a problem?

For personal self-hosting, no. AGPL-3.0 requires source code distribution only if you modify Immich and offer it as a service to others. Running it on your own server for personal use has no licensing obligations beyond what any open-source license requires.

### Can I run both to test them?

Yes. Run them on different ports and point both at the same photo directory (read-only). This lets you compare the UI, face recognition accuracy, and search capabilities side by side before committing to one.

### Which handles RAW files better?

Both support RAW formats (CR2, NEF, ARW, DNG). Immich generates JPEG previews and extracts embedded thumbnails faster. LibrePhotos handles RAW but processing is slower. Neither modifies the original RAW files.

## Related

- [How to Self-Host Immich](/apps/immich)
- [How to Self-Host LibrePhotos](/apps/librephotos)
- [Immich vs PhotoPrism](/compare/immich-vs-photoprism)
- [Self-Hosted Google Photos Alternatives](/replace/google-photos)
- [Best Self-Hosted Photo Management](/best/photo-management)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
