---
title: "Best Hardware for Unraid in 2026"
description: "Hardware recommendations for Unraid — CPUs, RAM, storage controllers, and complete builds for NAS and Docker self-hosting."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "hardware"
apps: []
tags: ["hardware", "unraid", "nas", "home-server", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

**Used Dell OptiPlex 5080 SFF ($150–$200) + Unraid Basic ($59).** The i5-10500 handles Plex transcoding and Docker containers, you get 128 GB RAM max, and the SFF case fits two 3.5" drives plus an NVMe boot drive. Add a USB SATA dock for extra drives. Total build: ~$350 with 8 TB of storage.

For a dedicated NAS build with 4+ drive bays, pair an Intel i3-12100 ($100) or i5-12400 ($130) with a Fractal Design Node 304 case ($80) and a motherboard with 4+ SATA ports. Total: ~$450 before drives.

## What Unraid Needs from Hardware

Unraid is unique among NAS operating systems. Understanding its architecture tells you exactly what hardware to buy.

### How Unraid Storage Works

Unraid doesn't use traditional RAID. Instead:
- Each drive in the array is an independent filesystem (XFS or Btrfs)
- A **parity drive** protects against single-drive failure (or two failures with dual parity)
- Drives can be different sizes and brands — no matching required
- Only the drive being accessed spins up, saving power and wear

This means:
- **You don't need a hardware RAID controller.** In fact, don't use one — Unraid manages drives directly via the motherboard's SATA/HBA controller.
- **SATA ports matter more than RAID support.** Count the SATA ports on your motherboard. Each port = one array drive.
- **The parity drive should be the largest drive.** Equal to or larger than any data drive in the array.

### CPU Requirements

Unraid itself is lightweight — it runs from a USB flash drive and barely touches the CPU. Your CPU choice depends on what you'll run on top of Unraid:

| Use Case | CPU Recommendation |
|----------|-------------------|
| NAS only (file serving) | Any modern CPU — even an N100 works |
| NAS + Docker containers | Intel i3/i5 or Ryzen 5 with QuickSync/AMF |
| NAS + Docker + Plex transcoding | Intel i5+ with QuickSync (mandatory for HW transcode) |
| NAS + Docker + VMs | Intel i5-12400+ or Ryzen 5 5600 (6+ cores) |
| NAS + Docker + VMs + GPU passthrough | Intel i5-13500 or Ryzen 7 5700X with discrete GPU |

**Intel QuickSync is the deciding factor** for Plex/Jellyfin users. AMD CPUs work fine for everything else, but Intel's hardware transcoding is significantly better supported in media server containers on Unraid.

For CPU details, see [Best CPUs for Home Server](/hardware/best-cpu-home-server) and [Intel vs AMD](/hardware/intel-vs-amd-home-server).

### RAM Requirements

| Workload | Minimum | Recommended |
|----------|---------|-------------|
| NAS only | 4 GB | 8 GB |
| NAS + Docker (5–10 containers) | 8 GB | 16 GB |
| NAS + Docker (15+ containers) | 16 GB | 32 GB |
| NAS + Docker + VMs | 32 GB | 64 GB |

Unraid doesn't require ECC RAM (unlike ZFS-based systems). Standard DDR4/DDR5 is fine. ECC works if your platform supports it but isn't necessary.

For RAM recommendations, see [Best RAM for Home Server](/hardware/best-ram-home-server).

### Storage Controller

**Use the motherboard's SATA ports** for up to 4–6 drives. For more drives, add an HBA (Host Bus Adapter):

| Controller | Ports | Interface | Price (Used) |
|-----------|-------|-----------|-------------|
| **LSI 9207-8i** | 8 SAS/SATA | PCIe x8 | $25–$40 |
| **Dell H310** (flashed to IT mode) | 8 SAS/SATA | PCIe x8 | $15–$25 |
| **LSI 9211-8i** | 8 SAS/SATA | PCIe x8 | $20–$35 |
| **Broadcom 9500-8i** | 8 SAS/SATA | PCIe x8 Gen4 | $80–$120 |

**Flash to IT mode.** These cards often ship in RAID mode (IR firmware). Unraid needs direct disk access, which requires IT (Initiator Target) firmware. Search "flash LSI 9207-8i IT mode" for your specific card.

**SAS breakout cables** ($10–$15 each) connect the SFF-8087 connector on the HBA to individual SATA drives. You need one cable per 4 drives.

### Boot Drive

Unraid boots from a USB flash drive — not an SSD or HDD. The USB drive holds the Unraid OS and license key.

**Use a quality USB 2.0 or 3.0 flash drive.** USB 2.0 is actually preferred — it's more reliable for the constant small writes Unraid does. Recommended: SanDisk Ultra Fit 32 GB ($8).

**The cache drive** (separate from the boot USB) is where Docker containers, VMs, and app data live. This should be a fast NVMe SSD:
- **500 GB NVMe** for Docker containers and VM images
- **1 TB NVMe** if you use the cache for writes before they move to the array

Recommended: Samsung 970 EVO Plus 500 GB ($40) or WD Black SN770 500 GB ($35).

## Recommended Builds

### Budget Build ($300–$400)

NAS + lightweight Docker (Pi-hole, Vaultwarden, Home Assistant).

| Component | Recommendation | Price |
|-----------|---------------|-------|
| CPU + Board | Used Dell OptiPlex 5060 SFF (i5-8500) | $100 |
| RAM | 16 GB DDR4 (2x8) — usually included | $0–$20 |
| Boot USB | SanDisk Ultra Fit 32 GB | $8 |
| Cache SSD | WD Black SN770 500 GB NVMe | $35 |
| Storage | 2x Seagate IronWolf 4 TB | $130 |
| Unraid license | Basic (6 devices) | $59 |
| **Total** | | **~$352** |

**Limitations:** Only 2 SATA ports available after the SSD (SFF has 3 total bays). Expand via USB SATA dock if needed.

### Mid-Range Build ($500–$700)

NAS + Docker + Plex transcoding. The sweet spot.

| Component | Recommendation | Price |
|-----------|---------------|-------|
| CPU | Intel i3-12100 | $100 |
| Motherboard | ASRock B660M-HDV (4 SATA, M.2) | $80 |
| RAM | 16 GB DDR4-3200 (2x8) | $30 |
| Boot USB | SanDisk Ultra Fit 32 GB | $8 |
| Cache SSD | Samsung 970 EVO Plus 500 GB NVMe | $40 |
| Case | Fractal Design Node 304 (6x 3.5" bays) | $80 |
| PSU | Corsair CX450M | $45 |
| Storage | 3x Seagate IronWolf 4 TB (1 parity + 2 data) | $195 |
| Unraid license | Plus (12 devices) | $89 |
| **Total** | | **~$667** |

**Usable storage:** 8 TB (2 data drives) with single parity protection.

### High-End Build ($800–$1,200)

NAS + Docker + VMs + GPU passthrough. Full homelab.

| Component | Recommendation | Price |
|-----------|---------------|-------|
| CPU | Intel i5-13500 | $180 |
| Motherboard | ASUS Prime B760M-A (4 SATA, 2x M.2, 2.5GbE) | $120 |
| RAM | 64 GB DDR4-3200 (2x32) | $80 |
| Boot USB | SanDisk Ultra Fit 32 GB | $8 |
| Cache pool | 2x WD Black SN770 500 GB NVMe (RAID 1) | $70 |
| Case | Fractal Design Define Mini C | $80 |
| PSU | Corsair RM650 (80+ Gold) | $80 |
| HBA | LSI 9207-8i (IT mode, used) | $30 |
| Storage | 5x Seagate IronWolf 8 TB (1 parity + 4 data) | $650 |
| Unraid license | Pro (unlimited) | $129 |
| **Total** | | **~$1,427** |

**Usable storage:** 32 TB (4 data drives) with single parity protection.

## Unraid-Specific Considerations

### Drive Sleep and Power

Unraid only spins up drives that are being accessed. A 6-drive array with one active drive draws less power than a RAID array where all drives must spin together.

Expect:
- Cache SSD + boot USB: 3–5W
- Each spinning 3.5" HDD: 6–8W active, 0.5W spun down
- System idle (CPU + board + 1 SSD): 15–30W depending on CPU

A typical mid-range build with most drives spun down: 20–30W. All drives active: 50–70W.

### Parity Checks

Unraid runs monthly parity checks — reading every drive to verify data integrity. This takes 12–24 hours and all drives spin up simultaneously. Schedule it for a time when noise and power draw don't matter (e.g., Tuesday 3 AM).

### Docker Storage: Cache vs Array

Docker containers and their data should **always** live on the cache SSD, not the array. The array is slow (single-drive speed, not striped). Configuration:
1. Set Docker image location to `/mnt/cache/docker/`
2. Set Docker appdata to `/mnt/cache/appdata/`
3. Set VM storage to `/mnt/cache/vms/`

The array is for bulk data: media files, backups, documents.

### Community Applications (App Store)

Install the **Community Applications** plugin — it's Unraid's app store. One-click installs for:
- Plex, Jellyfin, Emby
- Nextcloud, Vaultwarden, Home Assistant
- Pi-hole, AdGuard Home
- All the popular self-hosted apps

Each app is a pre-configured Docker template. Easier than writing Docker Compose files manually.

## Unraid License Tiers

| Tier | Devices | Price | Best For |
|------|---------|-------|----------|
| Basic | 6 | $59 | Small NAS (2–3 data + 1 parity + 1 cache + 1 USB) |
| Plus | 12 | $89 | Mid-range NAS with room to grow |
| Pro | Unlimited | $129 | Large arrays, future-proof |

"Devices" includes all storage devices: array drives, parity drives, cache drives, and the boot USB. It does **not** count VMs or Docker containers.

**Recommendation:** Buy Plus ($89). Six devices fills up fast once you add parity + cache + boot USB. The $30 difference between Basic and Plus is worth the headroom.

## FAQ

### Do I need ECC RAM for Unraid?

No. Unraid doesn't use ZFS (which benefits from ECC). Unraid uses XFS or Btrfs per-drive with parity protection. Standard DDR4 is fine. ECC works if your platform supports it but adds no meaningful protection for Unraid's architecture.

### Can I mix drive sizes?

Yes — this is Unraid's biggest advantage. The only rule: the parity drive must be equal to or larger than the largest data drive. So if you have 4 TB, 8 TB, and 12 TB data drives, your parity drive must be at least 12 TB.

### SSD array or HDD array?

Unraid's array is designed for HDDs — single-drive performance is fine for bulk storage. SSDs in the array are wasted because Unraid doesn't stripe data across drives. Use SSDs for cache only. Use HDDs for the array.

### How does Unraid compare to TrueNAS and Synology?

See [Synology vs Unraid](/hardware/synology-vs-unraid) and [TrueNAS vs Unraid](/hardware/truenas-vs-unraid).

## Related

- [TrueNAS vs Unraid](/hardware/truenas-vs-unraid)
- [Synology vs Unraid](/hardware/synology-vs-unraid)
- [Best NAS for Home Server](/hardware/best-nas)
- [DIY NAS Build Guide](/hardware/diy-nas-build)
- [Best Hard Drives for NAS](/hardware/best-hard-drives-nas)
- [Best CPUs for Home Server](/hardware/best-cpu-home-server)
- [Best RAM for Home Server](/hardware/best-ram-home-server)
- [RAID Levels Explained](/hardware/raid-explained)
- [Home Server Build Guide](/hardware/home-server-build-guide)
- [Power Consumption Guide](/hardware/power-consumption-guide)
