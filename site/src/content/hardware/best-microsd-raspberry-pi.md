---
title: "Best microSD Cards for Raspberry Pi Servers"
description: "The best microSD cards for Raspberry Pi home servers. Ranked by endurance, speed, and reliability for 24/7 self-hosting."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "hardware"
apps: []
tags: ["hardware", "raspberry-pi", "microsd", "storage", "home-server"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

**Samsung PRO Endurance 128 GB.** It's designed for 24/7 write-heavy workloads (dashcams, security cameras — same write pattern as a server). Rated for 140,160 hours of continuous recording. Costs about $18. It's the only microSD card you should consider for a Raspberry Pi server.

If your budget allows, skip microSD entirely and boot from a USB 3.0 SSD. A 256 GB SATA SSD in a USB enclosure ($30–$40 total) is faster, more reliable, and lasts longer. See the "Skip microSD" section below.

## Why microSD Choice Matters

Raspberry Pi servers write constantly — Docker logs, database writes, temp files, application state. Consumer microSD cards are designed for cameras: write once, read many. A server workload is the opposite: write constantly, read occasionally.

A cheap microSD card in a Pi server will:
- Slow down under sustained writes (write speed drops to 2–5 MB/s)
- Wear out in months (consumer cards have low TBW endurance)
- Corrupt silently (no wear-leveling, no power-loss protection)

The right card handles 24/7 writes for years. The wrong one kills your data in weeks.

## Best microSD Cards for Raspberry Pi Servers

### 1. Samsung PRO Endurance — Best Overall

| Spec | Value |
|------|-------|
| Capacity | 32 / 64 / 128 / 256 GB |
| Speed Class | U1, V10, Class 10 |
| Sequential Read | Up to 100 MB/s |
| Sequential Write | Up to 40 MB/s |
| Endurance | 140,160 hours (128 GB model) |
| Price (128 GB) | ~$18 |

The PRO Endurance is purpose-built for continuous recording. Samsung rates the 128 GB model at 140,160 hours — that's 16 years of 24/7 writing. It has power-loss protection to prevent corruption on unexpected shutdowns.

**Buy the 128 GB.** The price difference between 64 GB and 128 GB is negligible, and Docker images eat space faster than you'd expect.

### 2. Samsung PRO Plus — Best Performance

| Spec | Value |
|------|-------|
| Capacity | 128 / 256 / 512 GB |
| Speed Class | U3, V30, A2, Class 10 |
| Sequential Read | Up to 180 MB/s |
| Sequential Write | Up to 130 MB/s |
| Random Read (IOPS) | 14,000 |
| Random Write (IOPS) | 12,000 |
| Price (128 GB) | ~$15 |

Faster than the PRO Endurance (A2 rating = better random I/O), but lower endurance rating. Good choice if your Pi server does more reading than writing — like serving a static website or running Pi-hole (mostly reads from blocklists).

### 3. SanDisk MAX Endurance — Runner-Up

| Spec | Value |
|------|-------|
| Capacity | 32 / 64 / 128 / 256 GB |
| Speed Class | U3, V30, Class 10 |
| Sequential Read | Up to 100 MB/s |
| Sequential Write | Up to 40 MB/s |
| Endurance | 120,000 hours (128 GB model) |
| Price (128 GB) | ~$20 |

SanDisk's equivalent to the Samsung PRO Endurance. Slightly lower endurance rating (120,000 vs 140,160 hours) and slightly higher price. A solid alternative if Samsung is out of stock.

### 4. Kingston High Endurance — Budget Pick

| Spec | Value |
|------|-------|
| Capacity | 32 / 64 / 128 GB |
| Speed Class | U1, A1, Class 10 |
| Sequential Read | Up to 95 MB/s |
| Sequential Write | Up to 30 MB/s |
| Endurance | 24,000 hours (128 GB model) |
| Price (128 GB) | ~$14 |

Lower endurance than Samsung or SanDisk (24,000 hours — about 3 years of 24/7 use), but cheaper. Acceptable for lightweight Pi servers (Pi-hole, Home Assistant) that don't write heavily.

## Cards to Avoid

- **SanDisk Ultra** — No endurance rating, no power-loss protection. The #1 cause of Pi SD card corruption posts on Reddit.
- **Samsung EVO Select** — Decent card for phones/cameras, but no endurance focus. Will wear out under server workloads.
- **Any card without an endurance rating** — If the manufacturer doesn't publish a TBW or endurance hours figure, it's not designed for 24/7 writes.
- **Any card under $10** — Cheap cards use low-quality NAND with minimal wear-leveling. They will fail.

## Comparison Table

| Card | Read | Write | Endurance (128GB) | A-Rating | Price |
|------|------|-------|-------------------|----------|-------|
| Samsung PRO Endurance | 100 MB/s | 40 MB/s | 140,160 hours | A1 | ~$18 |
| Samsung PRO Plus | 180 MB/s | 130 MB/s | Not rated | A2 | ~$15 |
| SanDisk MAX Endurance | 100 MB/s | 40 MB/s | 120,000 hours | — | ~$20 |
| Kingston High Endurance | 95 MB/s | 30 MB/s | 24,000 hours | A1 | ~$14 |

## Skip microSD: Boot from USB SSD

The best microSD card is no microSD card. Raspberry Pi 4 and Pi 5 support USB boot natively. A USB SSD is:

- **5–10x faster** in random I/O (the bottleneck for server workloads)
- **100x more endurance** (consumer SSDs handle 100+ TBW vs <1 TBW for microSD)
- **More reliable** (proper wear leveling, DRAM cache, power-loss protection)

### How to Set Up USB Boot

1. Buy a 256 GB SATA SSD ($20–$25) and a USB 3.0 to SATA enclosure ($10–$15). Total: ~$35.
2. Flash Raspberry Pi OS or Ubuntu Server to the SSD using Raspberry Pi Imager.
3. On Pi 5: USB boot works out of the box. Plug in the SSD and power on.
4. On Pi 4: Update the bootloader first. Boot from a microSD with Raspberry Pi OS, run `sudo raspi-config` → Advanced → Boot Order → USB Boot. Then shut down, remove the microSD, plug in the SSD, and boot.

Recommended SSDs for USB boot:
- **Samsung 870 EVO 250 GB** (~$25) — reliable, fast, endurance rated at 150 TBW
- **Kingston A400 240 GB** (~$20) — budget option, no DRAM cache but adequate for Pi workloads
- **Crucial BX500 240 GB** (~$22) — good middle ground

For more, see [Raspberry Pi Home Server](/hardware/raspberry-pi-home-server/) and [USB Boot Guide](/hardware/usb-boot-home-server/).

## Extending microSD Life

If you're sticking with microSD, these practices reduce write wear:

### 1. Move Logs to tmpfs

Docker and system logs generate constant writes. Move them to RAM:

```bash
# Add to /etc/fstab
tmpfs /var/log tmpfs defaults,noatime,nosuid,mode=0755,size=64m 0 0
tmpfs /tmp tmpfs defaults,noatime,nosuid,size=128m 0 0
```

Trade-off: logs are lost on reboot. For a home server, this is usually acceptable.

### 2. Reduce Docker Logging

```bash
# /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### 3. Disable Swap

Swap on microSD is extremely destructive — it writes constantly to the slowest, least durable storage:

```bash
sudo dphys-swapfile swapoff
sudo dphys-swapfile uninstall
sudo systemctl disable dphys-swapfile
```

If you need swap, use a zram swap (compressed RAM) instead.

### 4. Mount with noatime

Disable access time updates to halve metadata writes:

```bash
# In /etc/fstab, add noatime to the root partition options
/dev/mmcblk0p2  /  ext4  defaults,noatime  0  1
```

## FAQ

### How long will a microSD card last in a Pi server?

With a Samsung PRO Endurance 128 GB: 3–5+ years under typical server workloads. With a cheap consumer card: 3–12 months. The endurance rating is the best predictor.

### A2 vs A1 — does it matter?

A2 cards have higher random I/O specifications (4,000 IOPS read, 2,000 IOPS write vs 1,500/500 for A1). For server workloads (lots of small random reads/writes), A2 is noticeably faster. In practice, the difference is less dramatic than spec sheets suggest because many A2 cards only sustain those speeds in bursts.

### Should I use ext4 or f2fs?

f2fs (Flash-Friendly File System) is designed for NAND storage and can extend microSD lifespan. However, ext4 is better supported and more stable for Docker workloads. Use ext4 unless you have a specific reason to use f2fs.

### Can I RAID microSD cards?

Don't. It's technically possible (USB readers + mdadm) but practically useless. The USB bus is the bottleneck, and microSD cards fail in correlated ways (heat, power loss). If you need redundancy, use a USB SSD with scheduled backups.

## Related

- [Raspberry Pi Home Server](/hardware/raspberry-pi-home-server/)
- [Raspberry Pi Docker Setup](/hardware/raspberry-pi-docker/)
- [Raspberry Pi vs Mini PC](/hardware/raspberry-pi-vs-mini-pc/)
- [USB Boot Guide](/hardware/usb-boot-home-server/)
- [Best SSDs for Home Server](/hardware/best-ssd-home-server/)
- [HDD vs SSD for Home Server](/hardware/hdd-vs-ssd-home-server/)
- [Home Server Build Guide](/hardware/home-server-build-guide/)
