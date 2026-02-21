---
title: "RAID Levels Explained for Home Servers"
description: "RAID 0, 1, 5, 6, 10, and ZFS RAID-Z explained simply. Which RAID level to use for your NAS and home server with practical examples."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "raid", "nas", "storage", "zfs"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Guide

| RAID Level | Min Drives | Usable Space | Drives Can Fail | Best For |
|-----------|-----------|-------------|----------------|----------|
| RAID 0 | 2 | 100% | 0 (any failure = total loss) | Scratch/temp data only |
| RAID 1 | 2 | 50% | 1 | 2-drive NAS, boot mirrors |
| RAID 5 | 3 | (N-1)/N | 1 | 3-4 drive NAS |
| RAID 6 | 4 | (N-2)/N | 2 | 4+ drive NAS |
| RAID 10 | 4 | 50% | 1 per mirror pair | Databases, high-performance |
| ZFS RAID-Z1 | 3 | (N-1)/N | 1 | TrueNAS, 3-4 drives |
| ZFS RAID-Z2 | 4 | (N-2)/N | 2 | TrueNAS, 4+ drives |
| SHR | 2 | Varies (optimized) | 1 | Synology NAS |

**For most home servers: RAID 1 (2 drives) or RAID 5/RAID-Z1 (3-4 drives).** If you have 4+ drives and your data is irreplaceable, use RAID 6/RAID-Z2 for double redundancy.

## RAID Is Not Backup

**RAID protects against drive failure. It does NOT protect against:**
- Accidental deletion (you delete a file → it's deleted on all RAID drives)
- Ransomware (encrypts files → encrypted on all RAID drives)
- Fire/flood/theft (destroys the NAS → destroys all RAID drives)
- Controller failure (can corrupt the entire array)
- Human error (wrong rebuild, wrong drive pulled)

**You need both RAID (for uptime) and backups (for data protection).** See our [Backup Strategy guide](/foundations/backup-strategy/).

## RAID Levels in Detail

### RAID 0 — Striping (No Redundancy)

Data is split across drives. Two 8 TB drives give you 16 TB usable and roughly 2x read/write speed.

```
Drive 1: [A1][A3][A5][A7]
Drive 2: [A2][A4][A6][A8]
```

**If ANY drive fails, ALL data is lost.** RAID 0 doubles your failure risk — two drives means twice the chance of losing everything.

**Use for:** Temporary data, scratch disks, video editing cache. **Never use for** anything you want to keep.

### RAID 1 — Mirroring

Data is duplicated on both drives. Two 8 TB drives give you 8 TB usable. Either drive can fail and you lose nothing.

```
Drive 1: [A1][A2][A3][A4]
Drive 2: [A1][A2][A3][A4]  (identical copy)
```

**Pros:** Simple, fast reads (can read from both drives simultaneously), fast rebuilds. **Cons:** 50% space efficiency — you buy 2x the storage you can use.

**Best for:** 2-drive NAS setups (Synology DS224+), boot drive mirrors, any setup where you only have 2 drives.

### RAID 5 — Striping with Single Parity

Data and parity are distributed across 3+ drives. Parity allows reconstruction of any single failed drive's data.

```
Drive 1: [A1][B2][C_parity]
Drive 2: [A2][B_parity][C1]
Drive 3: [A_parity][B1][C2]
```

With 3x 8 TB drives: 16 TB usable. With 4x 8 TB: 24 TB usable. Formula: (N-1) × drive size.

**Pros:** Good space efficiency (67-94% depending on drive count). Survives one drive failure. Distributed parity means no single bottleneck drive.

**Cons:** Rebuild times are long for large drives — a 12 TB drive can take 12-24 hours to rebuild. During rebuild, performance is degraded and a second failure means total loss.

**Best for:** 3-4 drive NAS arrays where you want a balance of capacity and redundancy.

### RAID 6 — Striping with Double Parity

Like RAID 5 but with two parity blocks per stripe. Survives any two simultaneous drive failures.

With 4x 8 TB: 16 TB usable. With 6x 8 TB: 32 TB usable. Formula: (N-2) × drive size.

**Pros:** Survives two drive failures — much safer during rebuilds (a second failure doesn't kill the array). **Cons:** 2 drives of overhead. Write performance is slower than RAID 5 due to double parity calculation.

**Best for:** 4+ drive arrays with large drives (8 TB+). As drives get larger, rebuild times get longer, increasing the risk of a second failure during rebuild. RAID 6 mitigates this.

### RAID 10 — Mirrored Stripes

Combines RAID 1 (mirroring) and RAID 0 (striping). Data is mirrored in pairs, then the pairs are striped.

```
Pair 1: Drive 1 [A1][A3] ↔ Drive 2 [A1][A3]  (mirror)
Pair 2: Drive 3 [A2][A4] ↔ Drive 4 [A2][A4]  (mirror)
         └── striped across pairs ──┘
```

With 4x 8 TB: 16 TB usable (50% efficiency). Survives one failure per mirror pair.

**Pros:** Excellent read and write performance. Fast rebuilds (only one drive to copy, not the full array). **Cons:** 50% space efficiency — same as RAID 1 regardless of drive count.

**Best for:** Database servers, high-performance workloads where speed matters more than capacity. Rarely used in home NAS setups due to poor space efficiency.

## ZFS RAID Levels

ZFS implements its own RAID, integrated with the filesystem. ZFS RAID is superior to traditional hardware/software RAID because it checksums all data and can self-heal corruption.

### RAID-Z1 (ZFS equivalent of RAID 5)

Single parity. Survives one drive failure. Same capacity formula as RAID 5: (N-1) × drive size.

**Advantage over RAID 5:** ZFS checksums detect silent data corruption. If a block is corrupt, ZFS uses the parity data to reconstruct the correct block automatically. Traditional RAID 5 doesn't know if data is corrupt — it just serves whatever's on disk.

### RAID-Z2 (ZFS equivalent of RAID 6)

Double parity. Survives two drive failures. Capacity: (N-2) × drive size.

**Recommended for most TrueNAS builds with 4+ drives.** The safety margin of surviving two failures is worth the extra drive of overhead.

### RAID-Z3 (Triple parity)

Survives three simultaneous drive failures. Capacity: (N-3) × drive size.

**Use for:** Very large arrays (8+ drives) with very large drives (16+ TB) where rebuild times are measured in days.

### ZFS Mirror

Identical to RAID 1 but with ZFS checksumming and self-healing. Best for 2-drive setups on TrueNAS.

## Synology SHR

Synology Hybrid RAID is Synology's proprietary RAID implementation built on top of Linux mdraid + LVM. Its key feature: **it optimizes usable space when drives are different sizes.**

### SHR vs Traditional RAID with Mixed Drives

**Traditional RAID 5 with 2x 8 TB + 2x 4 TB:**
All drives are treated as 4 TB (the smallest). Usable: 3 × 4 TB = 12 TB. The extra 4 TB per larger drive is **wasted**.

**SHR with 2x 8 TB + 2x 4 TB:**
SHR creates optimized RAID volumes. Usable: ~20 TB. The extra capacity of the larger drives is utilized.

### SHR-2

Like SHR but with double redundancy (equivalent to RAID 6). Survives two drive failures. Requires 4+ drives.

**SHR-2 is recommended for:** 4+ bay Synology NAS with drives larger than 8 TB. Larger drives = longer rebuilds = higher risk of second failure during rebuild.

## How to Choose

### 2 Drives

**RAID 1 / Mirror / SHR.** No other option for redundancy with 2 drives. 50% space efficiency.

### 3 Drives

**RAID 5 / RAID-Z1 / SHR.** 67% space efficiency, 1 drive fault tolerance. Acceptable for most home use.

### 4 Drives

| Priority | Choose | Usable Space | Fault Tolerance |
|----------|--------|-------------|-----------------|
| Balance | RAID 5 / RAID-Z1 | 75% (3 drives) | 1 drive |
| Safety | RAID 6 / RAID-Z2 | 50% (2 drives) | 2 drives |
| Performance | RAID 10 | 50% (2 drives) | 1 per pair |

**Recommendation:** RAID-Z2 / RAID 6 / SHR-2 with 4 drives. Losing 1 extra drive of capacity for the safety of surviving 2 failures is worth it when each drive is 8-16 TB.

### 6+ Drives

RAID-Z2 / RAID 6 / SHR-2. Double parity is strongly recommended for large arrays. Rebuild times for a 12+ TB drive can exceed 24 hours — during which a second failure is a real risk.

### 8+ Drives

Consider splitting into two vdevs (TrueNAS) or using RAID-Z3 for triple parity. Some homelab wisdom suggests keeping vdevs to 4-6 drives for faster rebuilds.

## Rebuild Times

This is the hidden risk of RAID. When a drive fails, the array must rebuild using parity data. During rebuild:

| Drive Size | RAID 5/Z1 Rebuild | RAID 6/Z2 Rebuild |
|-----------|-------------------|-------------------|
| 4 TB | 4-8 hours | 4-8 hours |
| 8 TB | 8-16 hours | 8-16 hours |
| 12 TB | 12-24 hours | 12-24 hours |
| 16 TB | 16-36 hours | 16-36 hours |
| 20 TB | 24-48 hours | 24-48 hours |

During a RAID 5 rebuild with large drives, your array runs without redundancy for 12-48 hours. If a second drive fails during this window, you lose everything. This is why **RAID 6/RAID-Z2 is recommended for drives 8 TB and larger.**

## FAQ

### Does RAID replace backups?

No. RAID protects against drive failure. Backups protect against deletion, corruption, ransomware, and disasters. You need both. See our [Backup Strategy guide](/foundations/backup-strategy/).

### Should I use hardware or software RAID?

Software RAID. Hardware RAID controllers are expensive, create vendor lock-in, and if the controller dies, you need an identical replacement to read your drives. ZFS, mdraid (Linux), and Synology SHR are all software RAID and work excellently. Hardware RAID is a legacy approach.

### Can I add a drive to an existing RAID array?

- **Synology SHR:** Yes. Add a drive and the volume expands.
- **Unraid:** Yes. Add any drive at any time.
- **TrueNAS ZFS:** Not to an existing vdev. You must add a new vdev (another set of drives) to the pool.
- **Traditional RAID 5/6:** Depends on the controller/software. Often possible but requires a lengthy reshape operation.

### What happens when a RAID drive fails?

The array continues operating in "degraded" mode. All data is still accessible, but performance is reduced and you have no redundancy until you replace the failed drive and rebuild. **Replace failed drives immediately.**

### Is JBOD (Just a Bunch of Disks) ever appropriate?

Only if every drive contains data that's also backed up elsewhere. JBOD has zero redundancy — each drive is independent. One failure loses that drive's data. Unraid's parity system is a better version of this concept — independent drives with parity protection.

## Related

- [Best Hard Drives for NAS](/hardware/best-hard-drives-nas/)
- [Best NAS for Home Servers](/hardware/best-nas/)
- [DIY NAS Build Guide](/hardware/diy-nas-build/)
- [Synology vs TrueNAS](/hardware/synology-vs-truenas/)
- [HDD vs SSD for Home Servers](/hardware/hdd-vs-ssd-home-server/)
- [Backup Strategy](/foundations/backup-strategy/)
