---
title: "Lychee vs Piwigo: Which Should You Self-Host?"
description: "Detailed comparison of Lychee and Piwigo for self-hosted photo galleries — features, UI, plugins, setup complexity, and use cases."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "photo-management"
apps:
  - lychee
  - piwigo
tags: ["comparison", "lychee", "piwigo", "photos", "self-hosted", "gallery"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

**Lychee is the better choice for most people who want a modern photo gallery.** It has a cleaner UI, simpler setup, and OAuth/SSO support out of the box. Choose Piwigo if you manage a very large collection (500K+ photos), need granular multi-user permissions, or want extensive customization through Piwigo's plugin ecosystem with 350+ extensions.

## Overview

**Lychee** is a modern, open-source photo gallery built with Laravel and FrankenPHP. It focuses on clean presentation, drag-and-drop uploading, and easy sharing. Lychee v7 added OAuth/SSO support (GitHub, Google, Keycloak, Authentik), WebAuthn/passkey authentication, and a redesigned backend. It's designed for individuals and small groups who want a beautiful way to share photo albums.

**Piwigo** is a veteran open-source photo gallery with over 23 years of active development (since 2002). It focuses on organization at scale — albums, tags, batch operations, user permissions, and a plugin ecosystem with 350+ extensions. Piwigo is used by organizations, photographers, and families managing large collections. It has official iOS and Android apps with auto-upload.

Both are gallery and sharing tools, not Google Photos replacements. Neither does AI search, face recognition, or CLIP-based smart search. They organize and display photos — they just approach it differently.

## Feature Comparison

| Feature | Lychee | Piwigo |
|---------|--------|--------|
| UI design | Modern, minimal, clean | Functional, traditional |
| Upload method | Drag-and-drop web UI | Web UI + FTP sync + CLI tool |
| Album organization | Albums (nested) | Albums/Categories (nested, hierarchical) |
| Tagging | Yes | Yes (extensive batch tagging) |
| Batch operations | Basic | Extensive (Batch Manager plugin) |
| User permissions | Basic (public/private albums) | Granular (per-album, per-user, per-group) |
| Multi-user | Yes (user accounts) | Yes (users, groups, roles) |
| OAuth/SSO | Yes (GitHub, Google, Keycloak, Authentik) | No (plugin-based, limited) |
| Mobile apps | No (responsive web UI) | Yes (iOS + Android with auto-upload) |
| Plugin ecosystem | Limited | Extensive (350+ plugins) |
| Themes | Limited | Dozens of community themes |
| Video support | Basic playback | Via Video.js plugin |
| EXIF display | Yes | Yes |
| Map view | Yes (from GPS data) | Via OpenStreetMap plugin |
| Sharing | Public links, password-protected albums | Public links, user-based access |
| API | REST API | REST API |
| License | MIT | GPL-2.0 |
| Database | MariaDB/MySQL/PostgreSQL | MariaDB/MySQL |
| Docker image | `ghcr.io/lycheeorg/lychee` | `lscr.io/linuxserver/piwigo` (LSIO) |

## Installation Complexity

**Lychee** runs as two services: Lychee (FrankenPHP with Laravel) and MariaDB. You must generate an `APP_KEY` (via `openssl rand -base64 32`) before first start. The v7 migration changed the default port from 80 to 8000 and switched the backend from nginx+PHP-FPM to FrankenPHP. Optional Redis and background worker containers add functionality but aren't required.

**Piwigo** runs as two services: the LinuxServer.io Piwigo image and MariaDB. Setup is straightforward but has an unusual quirk: the database connection is configured through the web UI setup wizard, not via environment variables. This means you run the containers, then complete setup in the browser — unlike most Docker apps where everything is configured before first start.

**Winner: Lychee** (slightly). Both are similar in complexity, but Lychee's configuration is more standard. Piwigo's web-based database setup is unusual.

## Performance and Resource Usage

| Resource | Lychee | Piwigo |
|----------|--------|--------|
| RAM (idle) | ~150 MB (app + DB) | ~200 MB (app + DB) |
| RAM (upload/processing) | 300-500 MB | 500 MB |
| CPU (idle) | Low | Low |
| CPU (upload) | Moderate (thumbnail generation) | Moderate (thumbnail generation) |
| Disk (application) | ~200 MB | ~150 MB |
| Large library handling | Good (tested to 50K+) | Excellent (tested to 500K+) |

Piwigo has a significant edge in handling very large libraries. Its database-driven architecture is specifically optimized for 100K-500K+ photo collections. Lychee performs well up to ~50K photos but hasn't been tested as extensively at massive scale.

**Winner: Piwigo** (for large libraries). Tie for typical use (under 50K photos).

## Community and Support

| Metric | Lychee | Piwigo |
|--------|--------|--------|
| GitHub stars | 3,500+ | 3,000+ |
| Project age | 2013 (original), 2018 (v4 rewrite) | 2002 (23+ years) |
| Release frequency | Regular (monthly) | Regular |
| Community | GitHub, Discord | Forums, GitHub |
| Documentation | Good (official docs) | Extensive (23 years of documentation) |
| Plugin ecosystem | Small | 350+ plugins |
| Theme ecosystem | Limited | Dozens of themes |

Piwigo's longevity is remarkable — 23 years of continuous development. Its plugin and theme ecosystem dwarfs Lychee's. Lychee has a more modern development workflow and a growing community.

**Winner: Piwigo** (for ecosystem maturity and plugin breadth). **Lychee** wins for modern development practices.

## Use Cases

### Choose Lychee If...

- You want a modern, clean gallery with minimal UI
- You need OAuth/SSO integration (GitHub, Google, Keycloak)
- You're sharing photos casually (portfolio, family events, travel)
- You want drag-and-drop uploading with a simple workflow
- You prefer a MIT-licensed project
- Your library is under 50,000 photos
- You want WebAuthn/passkey authentication

### Choose Piwigo If...

- You manage a very large library (100K-500K+ photos)
- You need granular user and group permissions
- You want extensive customization through plugins
- You need batch operations for organizing large collections
- You want mobile apps with auto-upload from camera roll
- You need theme customization for a specific look
- You're an organization or photographer managing client galleries

## Final Verdict

**Lychee wins for casual use and modern deployments.** Its clean UI, OAuth support, and straightforward Docker setup make it the better choice for individuals and small groups sharing photo galleries. If you want a portfolio site, family photo sharing, or a simple album browser, Lychee is cleaner and easier.

**Piwigo wins for serious photo management at scale.** If you have hundreds of thousands of photos, need granular user permissions, or want to customize extensively through plugins, Piwigo's 23 years of development show. It's battle-tested, scalable, and extensible in ways Lychee isn't.

For AI-powered photo management with mobile upload, skip both and use [Immich](/apps/immich/). For smart browsing of an existing library, use [PhotoPrism](/apps/photoprism/). Lychee and Piwigo are galleries — they display and share photos, not manage or classify them.

## FAQ

### Can either replace Google Photos?

No. Neither has mobile auto-upload (Piwigo's mobile app supports it, but it's limited compared to Google Photos), AI search, face recognition, or smart organization. For a Google Photos replacement, use [Immich](/apps/immich/). Lychee and Piwigo are gallery tools for displaying and sharing photos.

### Which is better for a photography portfolio?

Lychee. Its modern, minimal design is better suited for showcasing photography. Piwigo can work with the right theme, but Lychee's default presentation is more portfolio-ready.

### Can I migrate between Lychee and Piwigo?

There's no direct migration tool. Both work with standard photo files, so the photos themselves transfer easily. Album structure, tags, and user accounts would need to be recreated. Export photos from one, organize them in directories, and import into the other.

### Does Piwigo support SSO?

Not natively. There are community plugins for LDAP and external authentication, but they're less robust than Lychee's built-in OAuth support for GitHub, Google, Keycloak, and Authentik.

### Which handles RAW files better?

Piwigo has broader RAW format support through its longer development history and plugin ecosystem. Lychee supports common RAW formats but processing is less mature. For RAW-heavy workflows, consider [PhotoPrism](/apps/photoprism/), which has the best RAW handling.

## Related

- [How to Self-Host Lychee](/apps/lychee/)
- [How to Self-Host Piwigo](/apps/piwigo/)
- [How to Self-Host Immich](/apps/immich/)
- [How to Self-Host PhotoPrism](/apps/photoprism/)
- [Immich vs PhotoPrism](/compare/immich-vs-photoprism/)
- [Best Self-Hosted Photo Management](/best/photo-management/)
- [Self-Hosted Google Photos Alternatives](/replace/google-photos/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
