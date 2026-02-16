---
title: "PhotoPrism vs Lychee: Which Should You Self-Host?"
description: "Compare PhotoPrism and Lychee for self-hosted photo management. AI features, resource usage, Docker setup, and use cases compared."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "photo-management"
apps:
  - photoprism
  - lychee
tags: ["comparison", "photoprism", "lychee", "self-hosted", "photos"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

PhotoPrism is the better choice if you want AI-powered photo organization with facial recognition, object detection, and automatic categorization. Lychee is better if you want a simple, lightweight photo gallery for sharing curated albums without the overhead of machine learning.

## Overview

**PhotoPrism** is an AI-powered, self-hosted photo management application. It uses TensorFlow for facial recognition, object detection, and automatic labeling. It indexes your photo library and provides smart search, map views, and automatic album creation based on detected content.

**Lychee** is a clean, minimalist self-hosted photo gallery. It focuses on album organization, sharing, and presentation. Lychee v7 modernized the stack with FrankenPHP and added WebAuthn support. It doesn't include AI features — organization is manual and intentional.

## Feature Comparison

| Feature | PhotoPrism | Lychee |
|---------|------------|--------|
| AI facial recognition | Yes (TensorFlow) | No |
| AI object/scene detection | Yes (automatic labels) | No |
| Smart search | Yes (natural language) | Basic (title, tags) |
| Map view (GPS) | Yes | Yes |
| Mobile app | Progressive Web App | No native app |
| Auto-upload from phone | Via WebDAV or Syncthing | No |
| Album management | Manual + auto-generated | Manual |
| Public sharing | Yes (links) | Yes (links, passwords) |
| OAuth/SSO | Via reverse proxy | GitHub, Google, Keycloak, Nextcloud |
| Multi-user | Limited (admin + viewers) | Yes (full multi-user) |
| Video support | Yes (playback, thumbnails) | Basic |
| RAW photo support | Yes (extensive) | Yes |
| Plugin system | No | No |
| Docker complexity | Medium (2-3 containers) | Low (2-3 containers) |
| RAM usage | 2-4 GB (4 GB swap recommended) | 256-512 MB |
| License | AGPL-3.0 | MIT |

## Installation Complexity

**PhotoPrism** needs the app container and a MariaDB database. The setup is simpler than Immich but has gotchas: you need 4 GB of swap space (or OOM killer terminates indexing), `seccomp:unconfined` and `apparmor:unconfined` security options, and the first startup is slow as it downloads TensorFlow models. PhotoPrism doesn't publish semver Docker tags — `:latest` is the stable release, which makes version pinning difficult.

**Lychee** requires just the app and MariaDB. Optionally add Redis for caching. The v7 image (`ghcr.io/lycheeorg/lychee:v7.3.3`) uses FrankenPHP, eliminating the need for a separate web server. Port changed from 80 to 8000 in v7. Clean, predictable setup.

## Performance and Resource Usage

| Resource | PhotoPrism | Lychee |
|----------|------------|--------|
| Idle RAM | ~500 MB | ~150 MB |
| Indexing RAM | 2-4 GB+ | Low |
| Minimum swap | 4 GB (required) | None special |
| Disk (app + models) | ~1 GB | ~100 MB |
| Minimum server | 4 GB RAM + 4 GB swap | 1 GB RAM |
| Indexing time (10K photos) | Hours (ML processing) | Minutes (metadata only) |

PhotoPrism's ML processing is resource-intensive, especially during initial indexing. The 4 GB swap requirement is non-negotiable — without it, Linux's OOM killer will terminate the indexing process. Lychee has no such requirements.

## Community and Support

**PhotoPrism:** 36,000+ GitHub stars, active community, regular updates. The project has a dual licensing model (AGPL + commercial). Documentation is solid but some advanced features require paid subscriptions.

**Lychee:** 3,500+ GitHub stars, active development, consistent releases. Fully open-source under MIT license. Community is smaller but engaged.

## Use Cases

### Choose PhotoPrism If...

- You want AI to automatically organize your photos
- Facial recognition and object detection are valuable to you
- You have a server with 4+ GB RAM and can configure swap
- You want smart, natural-language search across your library
- RAW photo support is important
- You don't mind `:latest` Docker tags

### Choose Lychee If...

- You want a simple photo gallery for sharing albums
- You prefer manual, intentional organization
- Your server has limited resources (1-2 GB RAM)
- You want a quick, lightweight setup
- MIT licensing matters to you
- Built-in OAuth/SSO support is useful (GitHub, Google, Keycloak)

## Final Verdict

**PhotoPrism wins for AI-powered photo organization.** If you have a large library and want the software to help you find and categorize photos automatically, PhotoPrism delivers. The resource requirements are higher, but the intelligence justifies it.

**Lychee wins for lightweight photo sharing.** If you want a clean gallery to share photos with family, clients, or publicly — without the overhead of ML models — Lychee is elegant and efficient. It does less, but what it does, it does well.

For a Google Photos-like experience, look at [Immich](/apps/immich) instead — it combines PhotoPrism's AI with mobile auto-upload that neither PhotoPrism nor Lychee fully provides.

## Frequently Asked Questions

### Can I use PhotoPrism without the AI features?
Technically you can disable some ML features, but the AI is deeply integrated into PhotoPrism's value proposition. With AI disabled, PhotoPrism becomes a more complex Lychee without Lychee's simplicity. If you don't want AI, use Lychee.

### Does Lychee support RAW photos?
Yes, Lychee can display RAW photos by generating JPEG previews. PhotoPrism has more extensive RAW format support and better RAW processing, but both handle the common formats.

### Which has better mobile support?
Neither has a native mobile app. PhotoPrism offers a Progressive Web App (PWA) that works well on mobile browsers. Lychee's web UI is responsive. For native mobile apps with auto-upload, use [Immich](/apps/immich).

## Related

- [How to Self-Host PhotoPrism](/apps/photoprism)
- [How to Self-Host Lychee](/apps/lychee)
- [PhotoPrism vs LibrePhotos](/compare/photoprism-vs-librephotos)
- [Lychee vs Piwigo](/compare/lychee-vs-piwigo)
- [Best Self-Hosted Photo Management](/best/photo-management)
- [Self-Hosted Google Photos Alternatives](/replace/google-photos)
