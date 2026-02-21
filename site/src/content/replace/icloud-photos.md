---
title: "Self-Hosted iCloud Photos Alternatives"
description: "The best self-hosted alternatives to iCloud Photos — replace Apple's photo storage with Immich, PhotoPrism, or LibrePhotos on your own server."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "photo-management"
apps:
  - immich
  - photoprism
  - librephotos
tags: ["replace", "alternative", "icloud-photos", "photos", "self-hosted", "apple"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Replace iCloud Photos?

**Cost:** Apple gives you 5 GB free, which is laughable for a photo library. The 200 GB plan costs $2.99/month ($36/year), and the 2 TB plan costs $9.99/month ($120/year). A family with multiple devices can easily hit the 2 TB tier. Over five years, that's $600+ — more than enough to buy a mini PC and a 4 TB drive that gives you unlimited storage forever.

**Vendor lock-in:** iCloud Photos is deeply tied to the Apple ecosystem. If you switch to Android or want to access your library from a Linux desktop, you're stuck with the iCloud web interface — which is slow and limited. Your photos are trapped inside Apple's walled garden.

**Privacy:** Apple scans your photos for CSAM detection (even on-device in some configurations) and stores your photos on Apple's servers. While Apple encrypts data at rest with Advanced Data Protection, you're still trusting a third party with your most personal media.

**Storage limits:** Even the 12 TB maximum iCloud+ plan has a ceiling. Self-hosting has no limit beyond your hardware.

**Control:** You cannot customize how iCloud organizes, processes, or indexes your photos. Self-hosted alternatives give you full control over metadata, face recognition, search, and file organization.

## Best Alternatives

### 1. Immich — Best Overall Replacement

[Immich](/apps/immich/) is the closest thing to a self-hosted iCloud Photos experience. It has native iOS and Android apps with background auto-upload, facial recognition, CLIP-based smart search, shared albums, timeline view, and a map view — nearly everything iCloud Photos offers, running on your own server.

**Why it's the best iCloud Photos replacement:**
- The iOS app feels familiar to iCloud Photos users — auto-upload just works
- Face recognition groups people automatically, like iCloud
- Smart search lets you find photos by description ("beach sunset," "birthday cake")
- Shared albums work for family photo sharing
- Partner sharing gives full library access to family members

**Setup difficulty:** Medium. Four Docker containers, 15 minutes to deploy. See our [full Immich guide](/apps/immich/).

**Minimum hardware:** 4 GB RAM, 4-core CPU, SSD for database.

### 2. PhotoPrism — Best for Existing Libraries

[PhotoPrism](/apps/photoprism/) excels at indexing and browsing large existing photo libraries. It scans your photos, extracts metadata, detects faces, and provides a clean browsing interface. It's more of a photo library browser than a full iCloud replacement.

**Why choose PhotoPrism:**
- Excellent at scanning and organizing existing photo directories
- Face detection and location browsing
- Lighter resource requirements than Immich
- Mature, stable codebase

**Where it falls short vs iCloud:**
- No native mobile app (web-only)
- No auto-upload from phone (you'd need a separate tool like Syncthing)
- No shared albums
- Development has slowed

**Setup difficulty:** Medium. Three Docker containers. See our [full PhotoPrism guide](/apps/photoprism/).

### 3. LibrePhotos — Best Fully Open-Source Option

[LibrePhotos](/apps/librephotos/) is a fully MIT-licensed photo manager with face recognition, auto-tagging, and timeline views. It's the best option if open-source licensing matters to you.

**Why choose LibrePhotos:**
- MIT license — fully open, no restrictions
- Face recognition and auto-tagging
- Lighter on resources than Immich
- Simple scan-and-browse workflow

**Where it falls short vs iCloud:**
- No mobile app
- No auto-upload
- No CLIP search
- Slower development velocity

**Setup difficulty:** Medium. Four Docker containers. See our [full LibrePhotos guide](/apps/librephotos/).

## Migration Guide

### Exporting from iCloud Photos

1. **Download originals from iCloud:** On macOS, open Photos → Preferences → iCloud → check "Download Originals to this Mac." Wait for the download to complete (this can take days for large libraries).

2. **Export from Photos app:** Select All (Cmd+A) → File → Export → Export Unmodified Originals. Choose a destination folder. This preserves original file formats, EXIF data, and creation dates.

3. **Alternative — iCloud.com bulk download:** Go to icloud.com/photos, select photos, and download. This is slower and limited to 1,000 photos per batch.

4. **Alternative — Apple Data & Privacy portal:** Request a copy of your data at privacy.apple.com. Apple provides download links for your entire photo library. This takes days to process but includes everything.

### Importing into Immich

1. Copy your exported photos to your Immich server's upload location or a separate directory.
2. Add the directory as an external library mount in `docker-compose.yml`:
   ```yaml
   immich-server:
     volumes:
       - /path/to/icloud-export:/mnt/icloud-library:ro
   ```
3. In Immich, go to Administration → External Libraries → add a new library pointing to `/mnt/icloud-library`.
4. Immich indexes the files, generates thumbnails, and runs face/object detection automatically.
5. HEIC files from iPhones are supported natively — no conversion needed.

### Importing into PhotoPrism or LibrePhotos

Copy your exported photos into the configured scan directory and trigger a rescan from the web UI. Both apps read EXIF data and organize photos by date automatically.

### What Transfers

- Original photos and videos (all formats including HEIC, Live Photos as separate HEIC+MOV)
- EXIF metadata (dates, GPS coordinates, camera info)
- File names and directory structure

### What Doesn't Transfer

- iCloud-specific edits (filters, crops applied in Photos app) — only if you export originals
- Album organization — you'll need to recreate albums manually
- Shared album memberships
- Face names — you'll need to re-identify people in the new app
- Memories/featured photos

## Cost Comparison

| | iCloud Photos (2 TB) | Self-Hosted (Immich) |
|---|---|---|
| Monthly cost | $9.99/month | ~$5/month electricity |
| Annual cost | $119.88/year | ~$60/year electricity |
| 3-year cost | $359.64 | ~$380 (hardware + electricity) |
| 5-year cost | $599.40 | ~$500 (electricity only after hardware) |
| Storage | 2 TB (shared with other iCloud data) | Unlimited (your hardware) |
| Storage upgrade | $9.99→$29.99 for 6 TB, $59.99 for 12 TB | Buy another $60 HDD |
| Privacy | Apple-managed encryption | Full control |
| Mobile auto-upload | Yes | Yes (Immich) |
| AI features | On-device (Apple Silicon) | On your server |

**Break-even point:** Around 2-3 years for a mini PC + HDD setup. After that, self-hosting is cheaper every year while iCloud costs compound. The savings accelerate dramatically if you would need the 6 TB or 12 TB tier.

## What You Give Up

**Seamless Apple integration:** iCloud Photos is deeply integrated into iOS, macOS, and Apple TV. Photos sync silently across all Apple devices without configuration. Self-hosted alternatives require setting up an app and a server URL.

**On-device ML (Apple Silicon):** Apple runs face detection and search entirely on-device using the Neural Engine. Self-hosted alternatives run ML on your server — requiring more server resources but giving you control over the process.

**iCloud Shared Library:** Apple's Shared Library feature lets family members contribute to a single shared library with intelligent suggestions. Immich has shared albums and partner sharing, but it's not quite as seamless.

**Zero maintenance:** iCloud just works with zero server management. Self-hosting requires occasional updates, monitoring, and backup management.

**Handoff convenience:** Features like viewing recent screenshots across devices, AirDrop integration, and iMessage photo sharing are iCloud-specific. These workflows need manual alternatives.

**Honest assessment:** If you're fully embedded in the Apple ecosystem and have no privacy or cost concerns, iCloud Photos is genuinely convenient. The case for self-hosting is strongest when you hit storage limits, care about privacy, want cross-platform access, or simply object to paying a recurring subscription for storage you could own.

## FAQ

### Can I still use the iPhone Photos app with Immich?

You keep the iPhone Photos app for on-device photo management. Immich runs alongside it — the Immich app uploads copies to your server. You can disable iCloud Photos sync and use Immich as your sole cloud backup, or run both in parallel during a transition period.

### Do Live Photos work with self-hosted alternatives?

Live Photos export as a HEIC image + MOV video pair. Immich supports Live Photos natively — they display with the motion effect in the web UI and mobile app. PhotoPrism and LibrePhotos import both files but don't play them back as Live Photos.

### What about HEIC format support?

All three recommended alternatives support HEIC natively. Immich and PhotoPrism generate JPEG thumbnails for web display while preserving the original HEIC files. No manual conversion needed.

### Can I share albums with non-technical family members?

Immich supports shared albums with a shareable link. Recipients don't need an account to view shared albums (configurable). For family members who want to contribute photos, create user accounts and use Immich's shared album or partner sharing features.

## Related

- [Self-Hosted Google Photos Alternatives](/replace/google-photos/)
- [How to Self-Host Immich](/apps/immich/)
- [How to Self-Host PhotoPrism](/apps/photoprism/)
- [How to Self-Host LibrePhotos](/apps/librephotos/)
- [Best Self-Hosted Photo Management](/best/photo-management/)
- [Immich vs PhotoPrism](/compare/immich-vs-photoprism/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
