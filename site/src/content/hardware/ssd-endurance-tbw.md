---
title: "SSD Endurance and TBW Explained"
description: "What TBW means for SSDs, how long your SSD will last in a home server, and which SSDs have the best endurance for 24/7 NAS and server use."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "ssd", "endurance", "tbw", "storage"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Recommendation

**Don't worry about SSD endurance for a home server.** A typical 1 TB consumer NVMe SSD is rated for 600 TBW (terabytes written). A home server writing 20 GB/day (which is a lot) would take 82 years to exhaust that. Even Docker's logging, database writes, and container updates don't come close to stressing a modern SSD.

Buy any reputable 1 TB NVMe SSD ($50–60) for your home server. You'll replace it because it's too small or too slow long before endurance is a concern.

**Exception:** If you're using SSDs as ZFS SLOG/L2ARC cache or running a write-heavy database (PostgreSQL with high throughput), buy a higher-endurance drive.

## What Is TBW?

TBW (Terabytes Written) is the manufacturer's rated endurance — how much total data you can write before the SSD is expected to start degrading. It's a warranty metric, not a hard limit. Most SSDs survive well beyond their TBW rating.

| SSD | Capacity | TBW Rating | Write Warranty |
|-----|----------|-----------|----------------|
| Samsung 870 EVO (SATA) | 1 TB | 600 TBW | 5 years |
| Samsung 990 Pro (NVMe) | 1 TB | 600 TBW | 5 years |
| WD Black SN770 (NVMe) | 1 TB | 600 TBW | 5 years |
| Crucial P3 (NVMe) | 1 TB | 220 TBW | 5 years |
| WD Red SN700 (NAS NVMe) | 1 TB | 2,000 TBW | 5 years |
| Samsung 983 DCT (Enterprise) | 960 GB | 1,366 TBW | 5 years |

### TBW per TB Comparison

A more useful metric — TBW normalized per TB of capacity:

| Category | TBW per TB | Examples |
|----------|-----------|----------|
| Budget consumer | 150–300 | Crucial P3, Kingston NV2 |
| Mainstream consumer | 600 | Samsung 870/990, WD SN770 |
| NAS-optimized | 1,300–2,000 | WD Red SN700, Seagate IronWolf 525 |
| Enterprise | 1,400–3,600 | Samsung PM893, Micron 5400 |

## How Much Does a Home Server Write?

### Typical Write Loads

| Activity | Daily Writes | Monthly Writes |
|----------|-------------|----------------|
| Docker container logs | 100 MB – 1 GB | 3–30 GB |
| Nextcloud sync (personal) | 500 MB – 2 GB | 15–60 GB |
| Plex/Jellyfin metadata updates | 50–200 MB | 1.5–6 GB |
| Pi-hole/AdGuard DNS logs | 50–200 MB | 1.5–6 GB |
| Database operations (SQLite/Postgres) | 200 MB – 2 GB | 6–60 GB |
| System updates + temp files | 100–500 MB | 3–15 GB |
| ZFS SLOG (if used) | 5–50 GB | 150 GB – 1.5 TB |
| Surveillance camera recording | 20–100 GB | 600 GB – 3 TB |

### Typical Total Daily Writes

| Server Type | Daily Writes | Annual Writes | Years on 600 TBW Drive |
|-------------|-------------|--------------|----------------------|
| Light (Pi-hole, RSS, bookmarks) | 1–3 GB | 365 GB – 1 TB | 600–1,600 years |
| Medium (Nextcloud, Plex, 10 containers) | 5–15 GB | 1.8–5.5 TB | 109–333 years |
| Heavy (database-intensive, CI/CD) | 20–50 GB | 7.3–18.3 TB | 33–82 years |
| ZFS SLOG cache | 20–100 GB | 7.3–36.5 TB | 16–82 years |
| Surveillance NVR | 50–200 GB | 18.3–73 TB | 8–33 years |

**Bottom line:** Unless you're running a write-intensive NVR or ZFS SLOG, SSD endurance is a non-issue for home servers. Even the cheapest consumer SSDs will outlast the useful life of the hardware.

## NAND Types Explained

| NAND Type | Bits per Cell | Endurance | Speed | Cost | Best For |
|-----------|-------------|-----------|-------|------|----------|
| SLC | 1 | Highest (100,000 P/E) | Fastest | $$$$ | Enterprise cache |
| MLC | 2 | High (10,000 P/E) | Fast | $$$ | Enterprise, prosumer |
| TLC | 3 | Good (3,000 P/E) | Good | $$ | Consumer, most servers |
| QLC | 4 | Lower (1,000 P/E) | Slower writes | $ | Read-heavy, cold storage |

**P/E cycles** = program/erase cycles per cell. More bits per cell = cheaper per GB but fewer P/E cycles.

**For home servers:** TLC is the default. High enough endurance for any home use case, good performance, reasonable price. QLC is fine for read-heavy workloads (media storage, static file serving). Avoid QLC for write-heavy workloads (databases, ZFS SLOG).

## When Endurance Actually Matters

### ZFS SLOG (Synchronous Write Log)

ZFS SLOG devices receive every synchronous write (NFS, iSCSI, databases with `sync=always`). This can mean 20–100 GB of writes per day on a busy NAS. For SLOG:

- **Recommended:** WD Red SN700 (2,000 TBW/TB), Optane (near-unlimited endurance)
- **Acceptable:** Samsung 970 EVO Plus (600 TBW/TB)
- **Avoid:** QLC drives, budget consumer NVMe

**SLOG size:** 8–16 GB is sufficient. ZFS SLOG only buffers 5–10 seconds of writes. A larger drive wastes capacity — buy for endurance, not capacity.

### ZFS L2ARC (Level 2 Adaptive Replacement Cache)

L2ARC is a read cache — much lower write load than SLOG. Any consumer SSD works. The L2ARC populates gradually and mostly reads after warmup.

### Database Servers

If your home server runs a write-heavy PostgreSQL or MySQL instance (unlikely for most self-hosters but possible with Nextcloud at scale, Gitea with CI/CD, etc.):

- Calculate actual daily writes: `iostat -x 1` and watch the `wkB/s` column
- Multiply by 365 to get annual writes
- Compare against TBW

In practice, even a heavy home database writes less than 10 GB/day — 3.65 TB/year, or 164 years on a 600 TBW drive.

### Surveillance / NVR

Continuous video recording is the one home use case that can stress SSD endurance:
- 4 cameras at 1080p, 24/7: ~100 GB/day
- 8 cameras at 4K, 24/7: ~800 GB/day

For NVR: use HDDs for long-term recording, SSDs only for the live buffer or database. Purpose-built NVR SSDs (WD Purple SN580) are designed for this workload.

## How to Monitor SSD Health

```bash
# Install smartmontools
sudo apt install smartmontools

# Check SSD health (NVMe)
sudo smartctl -a /dev/nvme0n1

# Key fields to look at:
# - Percentage Used: how much of TBW has been consumed (0-100%)
# - Data Units Written: total data written (multiply by 512 bytes × 1000)
# - Available Spare: remaining spare NAND blocks (100% = fresh)
# - Media and Data Integrity Errors: should be 0

# Check SSD health (SATA)
sudo smartctl -a /dev/sda
# Key fields:
# - Wear_Leveling_Count: percentage of life remaining
# - Total_LBAs_Written: total writes in 512-byte sectors
```

### Automated Monitoring

Set up email alerts with smartd:

```bash
# Edit smartd config
sudo nano /etc/smartd.conf

# Add monitoring for NVMe
/dev/nvme0n1 -a -o on -S on -n standby,q -s (S/../.././02|L/../../6/03) -W 0,0,45 -m admin@yourserver.home

# Restart smartd
sudo systemctl restart smartd
```

Or use [Netdata](/apps/netdata) or [Grafana](/apps/grafana) with [Prometheus](/apps/prometheus) for visual dashboards of SSD health metrics.

## Best SSDs by Use Case

### Boot Drive (Low Writes)

Any reputable 256 GB+ NVMe SSD. The cheapest option from Samsung, WD, Crucial, or Kingston is fine. Don't overspend — a boot drive barely writes.

**Pick:** Kingston NV2 250 GB (~$20) or Crucial P3 500 GB (~$30).

### General Server (VM Storage, Docker)

Mainstream consumer TLC NVMe. 1 TB for room to grow. 600 TBW is more than enough.

**Pick:** WD Black SN770 1 TB (~$55) or Samsung 990 EVO 1 TB (~$60).

### NAS Cache (ZFS SLOG/L2ARC)

Higher-endurance NVMe rated for NAS/write-intensive workloads.

**Pick:** WD Red SN700 500 GB (~$45) — 1,000 TBW for the 500 GB model.

### Enterprise/Heavy Write

If you genuinely need enterprise endurance (you probably don't):

**Pick:** Samsung PM893 960 GB (~$100 used) — 1,366 TBW, power-loss protection capacitors.

## FAQ

### What happens when an SSD reaches its TBW rating?

The SSD doesn't die at exactly TBW. The rating is conservative — most SSDs survive 2–5x their rated TBW. After TBW is reached, the manufacturer's warranty no longer covers the drive. The SSD may start to slow down or develop bad blocks, but immediate data loss is rare. Monitor SMART data and replace proactively.

### Is TBW or DWPD more useful?

DWPD (Drive Writes Per Day) tells you how many times you can write the full capacity per day over the warranty period. For a 1 TB drive with 1 DWPD and a 5-year warranty: 1 TB × 365 × 5 = 1,825 TBW. DWPD is more common in enterprise specs. For home use, TBW is easier to reason about.

### Should I use TRIM on my server SSD?

Yes. TRIM tells the SSD which blocks are no longer in use, improving performance and endurance. Most Linux filesystems (ext4, XFS) support TRIM. Enable periodic TRIM:

```bash
sudo systemctl enable fstrim.timer
```

### Can I use a used/refurbished SSD for a home server?

Check the SMART data first. If Percentage Used is under 30% and Available Spare is above 80%, it has plenty of life left. Used enterprise SSDs are excellent value — they're built for write-heavy workloads and are often pulled from service with 90%+ life remaining.

## Related

- [Best SSDs for Home Servers](/hardware/best-ssd-home-server)
- [HDD vs SSD for Home Servers](/hardware/hdd-vs-ssd-home-server)
- [Best Hard Drives for NAS](/hardware/best-hard-drives-nas)
- [RAID Levels Explained](/hardware/raid-explained)
- [DIY NAS Build Guide](/hardware/diy-nas-build)
- [NVMe Enclosures Guide](/hardware/nvme-enclosures)
