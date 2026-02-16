---
title: "LibrePhotos vs Lychee: Which Should You Self-Host?"
description: "Compare LibrePhotos and Lychee for self-hosted photo management. AI features vs lightweight gallery — setup, resources, and use cases compared."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "photo-management"
apps:
  - librephotos
  - lychee
tags: ["comparison", "librephotos", "lychee", "self-hosted", "photos"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

LibrePhotos is the better choice if you want AI-powered photo organization with facial recognition and scene detection on your own server. Lychee is better if you want a simple, beautiful photo gallery with uploads, sharing, and OAuth support — without the complexity and resource demands of machine learning.

## Overview

**LibrePhotos** is a self-hosted Google Photos alternative with machine learning features. It scans your photo directories and uses AI for facial recognition, scene classification, object detection, and automatic tagging. It's a fork of OwnPhotos, built with Django and React.

**Lychee** is a self-hosted photo gallery and management tool. It provides a clean web interface for uploading, organizing albums, sharing with passwords, and browsing photos. Lychee v7 modernized the backend with FrankenPHP and added WebAuthn/passkey authentication.

## Feature Comparison

| Feature | LibrePhotos | Lychee |
|---------|-------------|--------|
| AI facial recognition | Yes | No |
| AI scene/object detection | Yes | No |
| Auto-tagging | Yes | No |
| Photo upload | Via directory scan | Yes (web UI) |
| Album management | Manual + auto-generated | Manual (nested albums) |
| Password-protected sharing | No | Yes |
| Public galleries | Yes | Yes |
| OAuth/SSO | No (username/password only) | GitHub, Google, Keycloak, Nextcloud |
| WebAuthn/Passkeys | No | Yes (v7+) |
| Map view (GPS) | Yes | Yes |
| Multi-user | Yes | Yes |
| Video support | Basic | Basic |
| EXIF display | Yes | Yes |
| API | REST API | REST API |
| Docker complexity | High (5+ containers) | Low (2-3 containers) |
| RAM usage | 2-4 GB | 256-512 MB |
| Development pace | Slow-moderate | Active |
| License | MIT | MIT |

## Installation Complexity

**LibrePhotos** has a complex Docker deployment: the frontend, backend, proxy, PostgreSQL, Redis, and ML worker — 5+ containers. Configuration is via a `.env` file with many variables. Initial photo scanning with ML processing takes hours for large libraries.

**Lychee** needs just the app and MariaDB. Optionally add Redis for caching. The v7 image (`ghcr.io/lycheeorg/lychee:v7.3.3`) runs on port 8000 and requires generating an `APP_KEY` with `openssl rand -base64 32`. Total setup: under 10 minutes.

## Performance and Resource Usage

| Resource | LibrePhotos | Lychee |
|----------|-------------|--------|
| Idle RAM | ~800 MB | ~150 MB |
| Active RAM | 2-4 GB | 256-512 MB |
| Disk (app + models) | ~1.5 GB | ~100 MB |
| Minimum server | 4 GB RAM, 2 cores | 1 GB RAM, 1 core |
| Scan time (10K photos) | Hours (ML) | Minutes (metadata) |

The resource difference is dramatic. Lychee runs on a Raspberry Pi; LibrePhotos needs a proper server. If your hardware is limited, Lychee is the only viable option.

## Community and Support

**LibrePhotos:** ~7,000 GitHub stars. Development has slowed — the last stable release was November 2025. Dev builds continue but the release cadence is inconsistent.

**Lychee:** ~3,500 stars. More active development — v7 was a major release modernizing the entire stack. Regular updates and responsive maintainers.

Lychee has the healthier project trajectory right now.

## Use Cases

### Choose LibrePhotos If...

- AI-powered organization (faces, scenes, objects) is important to you
- You have 4+ GB RAM available for ML processing
- You want automatic photo categorization without manual effort
- You prefer scan-based indexing (photos stay on filesystem)
- You don't need OAuth/SSO or WebAuthn

### Choose Lychee If...

- You want a simple, polished photo gallery
- Upload and album management through the web UI matter
- Password-protected sharing is needed
- OAuth/SSO or WebAuthn authentication is important
- Your server has limited resources
- Active, ongoing development matters

## Final Verdict

**LibrePhotos wins on AI features.** If machine learning-powered organization is your primary requirement, LibrePhotos provides it. The cost is complexity, resource usage, and a slower development pace.

**Lychee wins on everything else.** It's simpler, lighter, more actively maintained, has better authentication options, and provides a more polished user experience. For most users who don't specifically need AI, Lychee is the better gallery.

If you want AI features AND active development AND mobile apps, [Immich](/apps/immich) is the strongest option — but it's even more resource-intensive than LibrePhotos.

## Frequently Asked Questions

### Can Lychee import photos from server directories like LibrePhotos?
Yes, but differently. Lychee can import from server paths, but it copies files into its own storage. LibrePhotos indexes photos in place without moving them. If filesystem organization is sacred to you, LibrePhotos respects it better.

### Is LibrePhotos still being maintained?
Yes, but development has slowed. Dev builds are still published to Docker Hub, but stable releases are infrequent. The project isn't abandoned but isn't as actively developed as Lychee or Immich.

### Both use MIT license — is there a difference in practice?
No practical difference. Both are permissive MIT licenses. You can use, modify, and distribute either project freely.

## Related

- [How to Self-Host LibrePhotos](/apps/librephotos)
- [How to Self-Host Lychee](/apps/lychee)
- [Immich vs LibrePhotos](/compare/immich-vs-librephotos)
- [Immich vs Lychee](/compare/immich-vs-lychee)
- [PhotoPrism vs LibrePhotos](/compare/photoprism-vs-librephotos)
- [Best Self-Hosted Photo Management](/best/photo-management)
