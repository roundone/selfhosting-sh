---
title: "DIY NAS Build Guide for Self-Hosting"
description: "How to build a DIY NAS for self-hosting. Parts list, case options, OS choice, and step-by-step assembly for a budget home server."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "nas", "diy", "truenas", "unraid", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Recommendation

**Build a Jonsbo N3-based NAS with an Intel N305 ITX motherboard, 32 GB DDR5, and TrueNAS SCALE.** Total cost: ~$450-550 diskless. This gives you 8 hot-swap 3.5" drive bays, 8 cores for Docker containers, ZFS for data integrity, and 2.5 GbE networking — in a compact, attractive enclosure. It outperforms a Synology DS923+ at a lower price with better hardware.

## Why Build Your Own NAS?

### vs Synology/QNAP

| Factor | Pre-built (Synology) | DIY NAS |
|--------|---------------------|---------|
| Price (4-bay, diskless) | $450-600 | $350-500 |
| Price (8-bay, diskless) | $900-1,500 | $450-600 |
| CPU | Celeron J4125 / Ryzen R1600 | N305 (8C/8T) or better |
| RAM | 2-4 GB (upgradeable to 8-32 GB) | 16-64 GB (your choice) |
| Setup time | 20 minutes | 2-4 hours |
| Software | DSM (polished, vendor-locked) | TrueNAS/Unraid/OMV (flexible, open) |
| Repairability | Limited (proprietary parts) | Standard PC components |
| File system | Btrfs/ext4 | ZFS, XFS, Btrfs (your choice) |

**The DIY advantage grows with scale.** A 2-bay NAS? Buy a Synology DS224+. A 4-bay? Synology is still competitive. 6+ bays? DIY saves hundreds of dollars and gives you better hardware.

## Parts List

### The Recommended Build (~$450-550 diskless)

| Component | Recommendation | Price |
|-----------|---------------|-------|
| **Case** | Jonsbo N3 (8-bay hot-swap) | ~$130-150 |
| **Motherboard** | ASRock N305-ITX or Topton N305 ITX | ~$120-150 |
| **RAM** | 32 GB DDR5-4800 SO-DIMM (2x16 GB) | ~$60-70 |
| **Boot drive** | 128-256 GB M.2 NVMe SSD (for OS) | ~$15-20 |
| **PSU** | Included with Jonsbo N3 (modular 250W) | Included |
| **CPU cooler** | Included with motherboard (N305 is fanless or low-profile) | Included |
| **Total** | | **~$450-550** |

Add drives separately — see our [Best Hard Drives for NAS](/hardware/best-hard-drives-nas) guide. Budget $140-190 per 8 TB drive.

### Budget Build (~$250-350 diskless)

| Component | Recommendation | Price |
|-----------|---------------|-------|
| **Case** | Fractal Node 304 (6-bay) or generic ITX case | ~$80-100 |
| **Motherboard** | Topton N100 ITX (4x SATA) | ~$80-100 |
| **RAM** | 16 GB DDR4-3200 SO-DIMM | ~$25-30 |
| **Boot drive** | 128 GB M.2 NVMe SSD | ~$15 |
| **PSU** | Any 80+ Bronze 300W+ | ~$35-50 |
| **Total** | | **~$250-350** |

Good for 4-6 drives. The N100 has 4 cores (sufficient for NAS + light Docker) but fewer SATA ports than the N305 boards.

### High-Performance Build (~$600-800 diskless)

| Component | Recommendation | Price |
|-----------|---------------|-------|
| **Case** | Jonsbo N4 (12-bay) or SilverStone CS381 | ~$150-200 |
| **Motherboard** | ASRock B660M-ITX/ac + Intel i3-12100 | ~$200-250 |
| **RAM** | 64 GB DDR4-3200 ECC (if motherboard supports) | ~$120-150 |
| **Boot drive** | 256 GB M.2 NVMe SSD | ~$20 |
| **HBA card** | LSI SAS 9211-8i (IT mode) for 8 additional SATA ports | ~$30-50 (used) |
| **PSU** | Seasonic 450W 80+ Gold | ~$60-80 |
| **Total** | | **~$600-800** |

For 8-12 drive arrays, heavy ZFS workloads, and VM hosting. ECC RAM is recommended for large ZFS pools.

## Case Options

### Jonsbo N3 — Best Overall (~$130-150)

The most popular DIY NAS case for good reason:
- 8x 3.5" hot-swap bays with backplane
- ITX motherboard compatible
- Compact footprint (similar to a 2-bay Synology in depth, wider)
- Included 250W modular PSU
- Tool-less drive installation
- Dust filters
- Room for 2x 2.5" SSDs on the motherboard tray

**Limitations:** Only ITX motherboards. The included PSU is adequate but not modular-premium. Limited airflow if all 8 bays are populated with 7200 RPM drives — consider replacing the stock fans.

### Fractal Design Node 304 — Best Budget (~$80-100)

- 6x 3.5" drive bays (not hot-swap)
- ITX motherboard
- Excellent airflow design (3x 92mm fans included)
- High build quality
- No included PSU (buy separately)

**Limitations:** 6 bays max. Not hot-swap. Larger than the Jonsbo N3. Drive installation requires removing side panels.

### SilverStone CS381 — Best for Expansion (~$170-200)

- 8x 3.5" hot-swap bays
- Micro-ATX motherboard support (more PCIe slots for HBA cards)
- Room for 10+ drives with creative mounting
- High airflow with 2x 120mm fans

**Limitations:** Micro-ATX means larger footprint. More expensive. Overkill for 4-drive builds.

### Jonsbo N4 — Maximum Density (~$150-180)

- 12x 3.5" hot-swap bays (most in any ITX NAS case)
- ITX motherboard
- Compact for the bay count
- Included PSU

**Limitations:** Very tight cable management. Thermals can be challenging with 12 drives. New model, less community feedback than the N3.

## Choosing a Motherboard

### Intel N305 ITX — Recommended

The Intel i3-N305 is the sweet spot for NAS builds:
- 8 cores / 8 threads at 15W TDP
- Intel Quick Sync for Plex/Jellyfin transcoding
- Low power consumption (10-15W system idle)
- Multiple SATA ports (4-6 depending on board)
- 2x M.2 NVMe slots on most boards
- DDR5 support

**Recommended boards:**
- **ASRock N305-ITX:** 4x SATA, 2x M.2, 2x 2.5 GbE, DDR5 SO-DIMM. Well-supported, widely available.
- **Topton N305 ITX:** Similar specs, often cheaper. Available on AliExpress. Less community support but functional.

### Intel N100 ITX — Budget Option

Same architecture, half the cores (4C/4T). Fine for pure NAS use (file serving, streaming). Gets tight if you want to run heavy Docker workloads alongside NAS duties.

**Key limitation:** Most N100 ITX boards only have 2-4 SATA ports. For 6+ drives, you'll need an HBA card (requires a PCIe slot, which ITX boards have only one of — and you might want it for a 10 GbE NIC instead).

### Intel 12th/13th Gen — High Performance

For builds that need to double as a serious compute server:
- ASRock B660M-ITX/ac + Intel i3-12100 (4C/8T, Quick Sync)
- More PCIe lanes for HBA cards and 10 GbE NICs
- DDR4 ECC support on some boards
- Higher power consumption (30-50W idle with drives)

Only justified if you're running VMs, AI workloads, or have 8+ drives needing an HBA.

## Operating System Options

### TrueNAS SCALE — Recommended

**Best for:** ZFS data integrity, serious storage, Docker support.

TrueNAS SCALE is the recommended OS for DIY NAS builds:
- **ZFS:** Best-in-class data integrity with checksums, scrubs, snapshots, and self-healing
- **Docker:** Native Linux-based, full Docker Compose support
- **Free:** Open source, no license cost
- **Web UI:** Modern, improved significantly in recent versions
- **Replication:** ZFS send/receive for efficient off-site backups

**Downsides:** Steeper learning curve. ZFS pool layout decisions are permanent (can't easily add drives to an existing RAID-Z vdev). Wants 1 GB+ RAM per TB of storage for optimal ARC cache performance.

### Unraid — Best for Flexibility

**Best for:** Mixed drive sizes, gradual expansion, VM hosting.

- **Mixed drives:** Add any size drive at any time without rebuilding
- **Docker:** Native support with a huge Community Applications library
- **VMs:** KVM with GPU passthrough
- **License:** $59-129 (one-time)

**Downsides:** Not ZFS — less data integrity protection. Parity-based writes are slow. Single-parity = single-drive fault tolerance. See our [TrueNAS vs Unraid](/hardware/truenas-vs-unraid) comparison.

### OpenMediaVault — Best for Simplicity

**Best for:** Users who want a simple web-based NAS OS without ZFS complexity.

- **Debian-based:** Install any Linux package, full Docker support
- **Web UI:** Clean, straightforward
- **Free:** Open source
- **Plugin system:** SnapRAID, Mergerfs, Docker, etc.

**Downsides:** No ZFS out of the box (can install manually). SnapRAID + Mergerfs is less robust than ZFS. Smaller community than TrueNAS or Unraid.

### Plain Linux (Ubuntu Server / Debian)

**Best for:** Experienced Linux users who want full control.

Install Ubuntu Server or Debian, set up ZFS manually, configure Samba/NFS shares, run Docker. Maximum flexibility, zero hand-holding. This is what you do if you're already comfortable administering Linux servers.

## Assembly Guide

### Step 1: Prepare Components

Unbox everything. Verify you have:
- Case with included hardware (screws, drive caddies, PSU if included)
- Motherboard + I/O shield
- RAM (SO-DIMM or DIMM depending on board)
- Boot SSD (M.2 NVMe)
- Data drives (3.5" SATA)
- SATA cables (if not included with case backplane)

### Step 2: Install RAM and Boot SSD

With the motherboard outside the case:
1. Insert RAM into SO-DIMM/DIMM slots (align notch, press firmly until clips engage)
2. Insert M.2 NVMe SSD at 30° angle into M.2 slot, press down, secure with screw

### Step 3: Mount Motherboard in Case

1. Install I/O shield in case cutout
2. Align motherboard standoffs with screw holes
3. Secure motherboard with screws (don't overtighten)

### Step 4: Connect Power

1. Connect 24-pin ATX power to motherboard
2. Connect 4/8-pin CPU power
3. Connect SATA power to drive backplane (or individual cables to drives)

### Step 5: Connect SATA Data Cables

1. Connect SATA data cables from motherboard to drive backplane (or individual drives)
2. Route cables cleanly — airflow matters with 4-8 spinning drives

### Step 6: Install Drives

1. Mount drives in caddies (hot-swap) or directly in bays
2. Slide into bays until connectors engage
3. Verify all drives are detected in BIOS before OS installation

### Step 7: Install the OS

1. Flash TrueNAS SCALE ISO to a USB drive using [Balena Etcher](https://etcher.balena.io/)
2. Boot from USB (F11 or F12 for boot menu on most boards)
3. Install TrueNAS to the M.2 boot SSD
4. Reboot, access the web UI at the assigned IP address
5. Create your ZFS pool (see TrueNAS Setup below)

## TrueNAS SCALE Initial Setup

### Create a ZFS Pool

1. Navigate to **Storage → Create Pool**
2. Name your pool (e.g., `tank`)
3. Select drives for your vdev:
   - **2 drives:** Mirror (50% usable, 1 drive redundancy)
   - **3 drives:** RAID-Z1 (67% usable, 1 drive redundancy)
   - **4 drives:** RAID-Z1 (75% usable) or RAID-Z2 (50% usable, 2 drive redundancy)
   - **6+ drives:** RAID-Z2 recommended (better redundancy)
4. Enable **compression:** LZ4 (transparent, nearly free performance)
5. **Record size:** 128K for general use, 1M for large media files

### Create Datasets

Datasets are like folders with their own ZFS properties:
- `tank/media` — for movies, TV, music (record size: 1M)
- `tank/photos` — for photo libraries
- `tank/documents` — for personal files
- `tank/docker` — for Docker container data
- `tank/backups` — for backup targets

### Set Up SMB/NFS Shares

1. Navigate to **Shares → SMB** or **NFS**
2. Create shares pointing to your datasets
3. Configure permissions (user/group or ACL)

### Enable Docker

1. Navigate to **Apps → Settings**
2. Select a pool for Docker storage (use an SSD dataset if available)
3. Docker is now available via CLI (`ssh` in) or the Apps catalog

## Power Consumption

| Build Type | Idle (no drives) | Idle (4x HDD) | Idle (8x HDD) |
|-----------|-----------------|---------------|---------------|
| N100 build | 8-10W | 25-35W | 45-65W |
| N305 build | 10-15W | 28-40W | 48-70W |
| i3-12100 build | 20-30W | 40-55W | 60-85W |

**Annual cost at $0.12/kWh (N305 with 4x HDD):**
- Idle: ~$30-42/year
- Active: ~$40-55/year

Compare to Synology DS423+ with 4x HDD: ~$30-35/year. DIY power consumption is similar for the same drive count.

## Total Cost Examples

### 4-Drive Build (N305 + Jonsbo N3)

| Component | Cost |
|-----------|------|
| Jonsbo N3 case | $140 |
| ASRock N305-ITX | $130 |
| 32 GB DDR5 SO-DIMM | $65 |
| 256 GB NVMe boot SSD | $20 |
| 4x Seagate IronWolf 8 TB | $600 |
| **Total** | **~$955** |

Usable storage: 24 TB (RAID-Z1) with ZFS checksums, 8-core CPU, 32 GB RAM.

**Synology DS423+ equivalent:** $450 (unit) + $600 (drives) + $25 (RAM upgrade to 8 GB) = **$1,075**. Less RAM (8 GB vs 32 GB), weaker CPU (J4125 vs N305), same drive count.

### 8-Drive Build (N305 + Jonsbo N3)

| Component | Cost |
|-----------|------|
| Jonsbo N3 case | $140 |
| ASRock N305-ITX | $130 |
| 32 GB DDR5 SO-DIMM | $65 |
| 256 GB NVMe boot SSD | $20 |
| 8x WD Red Plus 8 TB | $1,120 |
| **Total** | **~$1,475** |

Usable storage: 48 TB (RAID-Z2) with ZFS checksums and 2-drive fault tolerance.

**Synology equivalent (DS1821+, 8-bay):** $1,100 (unit) + $1,120 (drives) = **$2,220**. The DIY build saves $745 and gives you a faster CPU and 4x the RAM.

## FAQ

### Is building a NAS hard?

If you've built a PC before, a NAS build is identical. If you haven't, it's straightforward — there are fewer components than a gaming PC. The OS installation and ZFS setup takes more thought than the hardware assembly.

### How much RAM do I need for TrueNAS/ZFS?

Minimum 8 GB. Recommended 16-32 GB. ZFS uses RAM for its ARC cache — more RAM means more frequently-accessed data is served from memory instead of disk. The old "1 GB per TB of storage" rule is a guideline, not a hard requirement. 16 GB handles most home setups.

### Can I use my old desktop as a NAS?

Yes. If it has an Intel or AMD x86 CPU, 8+ GB RAM, and enough SATA ports (or you add an HBA card), install TrueNAS SCALE or Unraid. The main concern is power consumption — an old desktop draws 50-100W idle vs 15-30W for a purpose-built N305 system.

### Should I use ECC RAM?

For TrueNAS/ZFS: recommended but not required. ECC prevents in-flight data corruption from memory bit-flips. For a home server, the risk of ECC mattering is low, but it's cheap insurance if your motherboard supports it.

### How loud is a DIY NAS?

Depends on fans and drives. 3.5" HDDs produce 25-35 dB of noise. 7200 RPM drives are louder than 5400 RPM. The Jonsbo N3 with its stock fan and 4 WD Red Plus drives (5400 RPM) is about as loud as a quiet desktop — noticeable in a silent room but fine for a closet or utility room.

## Related

- [Best NAS for Home Servers](/hardware/best-nas)
- [Best Hard Drives for NAS](/hardware/best-hard-drives-nas)
- [Synology vs TrueNAS](/hardware/synology-vs-truenas)
- [TrueNAS vs Unraid](/hardware/truenas-vs-unraid)
- [RAID Levels Explained](/hardware/raid-explained)
- [HDD vs SSD for Home Servers](/hardware/hdd-vs-ssd-home-server)
- [Home Server Power Consumption Guide](/hardware/power-consumption-guide)
- [Best Mini PCs for Home Servers](/hardware/best-mini-pc)
- [Docker Compose Basics](/foundations/docker-compose-basics)
