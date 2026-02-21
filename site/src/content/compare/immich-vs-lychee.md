---
title: "Immich vs Lychee: Which Should You Self-Host?"
description: "Compare Immich and Lychee for self-hosted photo management. Features, Docker setup complexity, mobile apps, and use cases compared."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "photo-management"
apps:
  - immich
  - lychee
tags: ["comparison", "immich", "lychee", "self-hosted", "photos"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Immich is the better choice for most people who want a Google Photos replacement with mobile auto-upload, AI-powered search, and a polished app experience. Lychee is a better fit if you want a lightweight photo gallery to showcase and share curated albums — think portfolio site, not phone backup.

## Overview

**Immich** is a full-featured, Google Photos-style self-hosted photo and video management platform. It offers mobile apps with background upload, facial recognition, map view, and machine learning-powered search. It's one of the fastest-growing self-hosted projects, backed by an active development team.

**Lychee** is a self-hosted photo gallery and management tool with a clean, minimal web interface. It focuses on album organization, sharing, and presentation rather than being a phone backup solution. Lychee v7 introduced a modern FrankenPHP backend and WebAuthn support.

## Feature Comparison

| Feature | Immich | Lychee |
|---------|--------|--------|
| Mobile app | Native iOS & Android with background upload | No native app (web UI only) |
| Auto-upload from phone | Yes (background sync) | No |
| AI facial recognition | Yes (built-in) | No |
| AI object/scene search | Yes (CLIP-based) | No |
| Map view (GPS) | Yes | Yes |
| Album sharing | Yes (links, users) | Yes (links, passwords) |
| Video support | Full (playback, thumbnails, transcoding) | Basic (playback only) |
| EXIF data display | Yes | Yes |
| OAuth/SSO | OIDC support | GitHub, Google, Keycloak, Nextcloud |
| Multi-user | Yes | Yes |
| External library support | Yes (watch folders) | Yes (import from server) |
| API | REST API | REST API |
| Docker complexity | High (6+ containers) | Low (2-3 containers) |
| RAM usage | 2-4 GB minimum | 256-512 MB |
| License | AGPL-3.0 (source-available, see note) | MIT |

## Installation Complexity

**Immich** requires a multi-container stack: the server, microservices (ML processing), machine learning container, Redis, and PostgreSQL with pgvecto.rs extension. The official Docker Compose file has 5-6 services. First-time setup involves downloading large ML models (~1.5 GB). It demands at least 4 GB of RAM for comfortable operation.

**Lychee** is significantly simpler. You need Lychee itself and a MariaDB database — two containers total. Optionally add Redis for caching. The FrankenPHP backend in v7 eliminated the need for a separate nginx container. It runs comfortably on 512 MB of RAM.

If setup simplicity matters to you, Lychee wins by a wide margin.

## Performance and Resource Usage

| Resource | Immich | Lychee |
|----------|--------|--------|
| Idle RAM | ~1.5 GB | ~150 MB |
| Active RAM | 2-4 GB+ | 256-512 MB |
| CPU (idle) | Low-moderate | Very low |
| CPU (indexing) | High (ML processing) | Low-moderate |
| Disk (app) | ~2 GB (ML models) | ~100 MB |
| Minimum viable server | 4 GB RAM, 2 cores | 1 GB RAM, 1 core |

Immich is resource-hungry because of its machine learning stack. The tradeoff is powerful features like facial recognition and smart search. Lychee is lightweight enough to run on a Raspberry Pi 4.

## Community and Support

**Immich** has explosive growth — 60,000+ GitHub stars, very active Discord, frequent releases (often weekly), and strong documentation. The development pace is among the fastest in the self-hosted ecosystem.

**Lychee** has a mature, stable community — 3,500+ GitHub stars, active GitHub discussions, and consistent releases. Development is steady but not as rapid as Immich. The v7 release was a major modernization.

## Use Cases

### Choose Immich If...

- You want to replace Google Photos entirely
- Mobile auto-upload from your phone is essential
- You want facial recognition and AI-powered search
- You have 4+ GB of RAM available
- You manage a large photo library (10,000+ photos)
- You want a polished, app-like experience

### Choose Lychee If...

- You want a photo gallery to share and showcase albums
- You need a lightweight solution for a low-resource server
- You don't need mobile auto-upload
- You want a simple 2-container Docker setup
- You prefer MIT-licensed software
- You want a portfolio or photography showcase site

## Final Verdict

**Immich is the better choice for personal photo management.** It does what Google Photos does — auto-upload, search, sharing, memories — but on your own hardware. The resource requirements are higher, but the feature set justifies it.

**Lychee is the better choice for photo presentation.** If you're a photographer who wants to share albums, or you want a lightweight gallery for curated collections, Lychee is elegant and simple. It's not trying to replace your phone's photo backup — it's a gallery tool.

For most self-hosters looking to move away from cloud photo services, Immich is the answer. For a lightweight photo showcase, Lychee delivers.

## Frequently Asked Questions

### Can Lychee auto-upload photos from my phone?
No. Lychee has no native mobile app and no background upload feature. You'd need to manually upload through the web interface or use a tool like Syncthing to sync photos to a folder, then import them. For auto-upload, use [Immich](/apps/immich/).

### Does Immich work on a Raspberry Pi?
Technically yes, but performance is poor. The ML models need significant RAM and CPU. A Raspberry Pi 4 with 8 GB can run Immich with ML disabled, but you lose the best features. Lychee runs well on a Pi 4.

### Can I migrate from Lychee to Immich later?
There's no direct migration tool, but both store original files. You can point Immich's external library feature at your Lychee photo directories, and Immich will index them. Metadata (albums, tags) won't transfer automatically.

## Related

- [How to Self-Host Immich](/apps/immich/)
- [How to Self-Host Lychee](/apps/lychee/)
- [Immich vs PhotoPrism](/compare/immich-vs-photoprism/)
- [Lychee vs Piwigo](/compare/lychee-vs-piwigo/)
- [Best Self-Hosted Photo Management](/best/photo-management/)
- [Self-Hosted Google Photos Alternatives](/replace/google-photos/)
