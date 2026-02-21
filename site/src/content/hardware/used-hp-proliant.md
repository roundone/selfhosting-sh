---
title: "Used HP ProLiant for Home Server"
description: "Used HP ProLiant servers for self-hosting and homelab. DL360, DL380, ML310, ML350 compared. What to buy, what to avoid, and real-world costs."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "hardware"
apps: []
tags: ["hardware", "hp-proliant", "used-server", "homelab", "enterprise"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

**The HP ProLiant DL360 Gen10 is the best used enterprise server for most homelabs.** 1U rack-mount, dual Xeon sockets, up to 1.5TB DDR4, iLO remote management, and prices starting around $200-400 on eBay. The trade-off: enterprise servers are loud and power-hungry compared to [mini PCs](/hardware/best-mini-pc/). Only buy one if you need the compute density, ECC RAM, or iLO remote management.

## Why Buy Used Enterprise Hardware?

Used enterprise servers offer extreme value:
- **8-24 cores / 16-48 threads** for $200-500 (new equivalent: $1,000+)
- **ECC RAM** for data integrity (critical for ZFS pools)
- **iLO/iDRAC remote management** — full KVM and power control from any browser
- **Dual power supplies** with hot-swap capability
- **Redundant everything** — fans, drives, NICs, PSUs
- **Built for 24/7 operation** in datacenter environments

The downside: noise, power consumption, and size. A DL360 Gen10 idles at 80-150W and sounds like a hairdryer under load. Plan accordingly.

## Which ProLiant Generation to Buy

| Generation | Year | CPU | RAM Type | iLO | Price Range | Recommendation |
|-----------|------|-----|----------|-----|-------------|---------------|
| **Gen8** | 2012 | Xeon E5 v1/v2 | DDR3 | iLO 4 | $50-150 | Avoid (old, power hungry) |
| **Gen9** | 2014 | Xeon E5 v3/v4 | DDR4 | iLO 4 | $100-250 | Budget option only |
| **Gen10** | 2017 | Xeon Scalable (1st/2nd gen) | DDR4 | iLO 5 | $200-500 | **Best value (recommended)** |
| **Gen10 Plus** | 2020 | Xeon Scalable (3rd gen) | DDR4 | iLO 5 | $400-800 | Premium option |
| **Gen11** | 2022 | Xeon Scalable (4th gen) | DDR5 | iLO 6 | $800+ | Too new/expensive for homelab |

**Buy Gen10.** It hits the sweet spot: DDR4 RAM (cheap and available), modern iLO 5, PCIe Gen3, reasonable power efficiency, and prices that have dropped to homelab-friendly levels. Gen9 is acceptable for tight budgets but uses more power per core.

**Avoid Gen8.** DDR3 RAM is increasingly expensive, the CPUs are power-inefficient by modern standards, and the platform is 13 years old. The electricity savings of a Gen10 pay for the price difference within a year.

## ProLiant Models Compared

### Rack-Mount Servers

| Model | Form Factor | Drive Bays | Max CPUs | Max RAM | Use Case |
|-------|------------|-----------|----------|---------|----------|
| **DL360 Gen10** | 1U | 4-10 SFF (2.5") | 2x Xeon | 1.5TB DDR4 | Compute-dense, most versatile |
| **DL380 Gen10** | 2U | 8-24 SFF or 12 LFF (3.5") | 2x Xeon | 1.5TB DDR4 | Storage-heavy (NAS, media server) |
| **DL20 Gen10** | 1U | 2-4 SFF | 1x Xeon E-2200 | 64GB DDR4 | Small/quiet, lower power |

### Tower Servers

| Model | Form Factor | Drive Bays | Max CPUs | Max RAM | Use Case |
|-------|------------|-----------|----------|---------|----------|
| **ML110 Gen10** | Tower | 4-8 LFF | 1x Xeon | 192GB DDR4 | Quiet(er) homelab, closet install |
| **ML350 Gen10** | Tower | 8-24 SFF/LFF | 2x Xeon | 1.5TB DDR4 | Full-featured tower server |

### Best Choices

**For most homelabs: DL360 Gen10.** Compact 1U, dual socket, plenty of RAM and PCIe slots. Runs Proxmox, TrueNAS, or bare Docker beautifully. $200-400 on eBay with a single CPU and 32-64GB RAM.

**For storage-heavy setups: DL380 Gen10.** The 2U chassis fits 12 LFF (3.5") drives for massive storage arrays. Ideal as a TrueNAS server. $250-500 on eBay.

**For noise-sensitive environments: DL20 Gen10 or ML110 Gen10.** The DL20 uses a single lower-TDP Xeon E-2200 series and is the quietest rack-mount option. The ML110 tower design disperses fan noise better than rack servers.

## What to Buy on eBay

### Shopping Checklist

When buying used ProLiant servers, verify these before purchasing:

- **Generation:** Gen10 minimum. Confirm by model number (e.g., DL360 **Gen10**, P19777-B21)
- **CPU included:** Some listings are barebones (no CPU). Confirm at least one Xeon is installed
- **RAM included:** Get at least 32GB. 64-128GB is cheap — negotiate for more
- **Drive caddies included:** Servers often ship without drive trays. HP caddies cost $10-15 each separately. Confirm they're included
- **iLO license:** Standard iLO is free. iLO Advanced enables remote console and virtual media — some used servers include it activated
- **Power supply count:** Dual PSU is standard. Confirm both are included
- **Rails:** Rack rails are expensive new ($50-100). Ask if included

### Typical Pricing (eBay, Feb 2026)

| Configuration | DL360 Gen10 | DL380 Gen10 |
|--------------|-------------|-------------|
| Barebones (no CPU/RAM/drives) | $100-150 | $120-180 |
| 1x Xeon Silver 4110 + 32GB | $200-300 | $250-350 |
| 2x Xeon Silver 4114 + 64GB | $300-450 | $350-500 |
| 2x Xeon Gold 6130 + 128GB | $400-600 | $450-650 |

Add $50-100 for drives (used enterprise SSDs) or use your own.

### Recommended CPU Choices

| CPU | Cores/Threads | Base/Boost | TDP | Price (used) | Notes |
|-----|--------------|-----------|-----|-------------|-------|
| **Silver 4110** | 8C/16T | 2.1/3.0 GHz | 85W | $10-20 | Budget option, adequate |
| **Silver 4114** | 10C/20T | 2.2/3.0 GHz | 85W | $15-25 | Sweet spot for single CPU |
| **Silver 4116** | 12C/24T | 2.1/3.0 GHz | 85W | $20-35 | Great multi-threaded perf |
| **Gold 6130** | 16C/32T | 2.1/3.7 GHz | 125W | $30-50 | Power user, dual socket |
| **Gold 6132** | 14C/28T | 2.6/3.7 GHz | 140W | $40-60 | Higher clocks, good single-thread |

Used Xeon Scalable CPUs are incredibly cheap. A 16-core Gold 6130 costs less than a takeout meal.

## Power Consumption

This is the biggest drawback of enterprise servers for home use.

| Configuration | Idle | Moderate Load | Full Load | Annual Cost ($0.12/kWh) |
|--------------|------|--------------|-----------|------------------------|
| DL360 Gen10 (1x Silver 4110, 32GB) | 80-100W | 120-160W | 200-250W | $84-105/yr idle |
| DL360 Gen10 (2x Silver 4114, 64GB) | 110-140W | 180-240W | 300-400W | $116-147/yr idle |
| DL380 Gen10 (1x Silver, 4 drives) | 100-130W | 160-200W | 250-350W | $105-137/yr idle |
| DL380 Gen10 (2x Gold, 12 drives) | 160-200W | 250-350W | 500-600W | $168-210/yr idle |

**Compare to alternatives:**
| Hardware | Idle | Annual Cost |
|----------|------|------------|
| Intel N100 mini PC | 6-8W | $6-8 |
| Intel N305 mini PC | 9-11W | $9-12 |
| Synology DS923+ (4 drives) | 30-40W | $32-42 |
| **DL360 Gen10 (1 CPU)** | **80-100W** | **$84-105** |

An enterprise server costs $75-100/year MORE in electricity than a mini PC. Over 3 years, that's $225-300 — enough to buy a mini PC. Factor this into your decision.

## Noise

Enterprise servers are designed for datacenters, not living rooms. Expect:

- **Boot/POST:** Very loud (all fans spin to max for 30-60 seconds)
- **Idle:** 35-50 dBA for rack servers (comparable to a loud fridge or desk fan)
- **Load:** 50-65+ dBA (you'll hear it through walls)

**Noise mitigation:**
- Place in a basement, garage, closet, or utility room
- A [server rack](/hardware/home-server-rack/) with acoustic foam panels helps
- Fan speed can be adjusted on some models via iLO (at your own risk — don't let CPUs overheat)
- The DL20 Gen10 and ML-series towers are the quietest ProLiant options
- Consider replacing fans with Noctua equivalents (common homelab mod, voids warranty)

## iLO Remote Management

iLO (Integrated Lights-Out) is HP's out-of-band management system. It's one of the strongest reasons to buy enterprise hardware:

- **Remote KVM console** — see the server's display from any browser, including BIOS/boot screens
- **Remote power control** — power on, off, reset without physical access
- **Virtual media** — mount ISOs remotely to install an OS without a USB drive
- **Hardware monitoring** — CPU temp, fan speed, PSU status, drive health
- **Alerts** — email notifications for hardware failures

iLO has its own dedicated Ethernet port and runs even when the server is powered off (standby power).

**iLO Standard** (free) gives you remote power control and hardware monitoring. **iLO Advanced** (included on many used servers) adds remote console and virtual media.

## What Can You Run on a ProLiant?

An HP ProLiant Gen10 with dual Xeons and 128GB RAM is a legitimate datacenter-class machine. You can run:

- **Proxmox** with dozens of VMs and hundreds of containers
- **TrueNAS** with a massive ZFS pool (DL380 with 12 drives)
- **Kubernetes cluster** (single node or multi-node with VMs)
- **Full CI/CD pipeline** (GitLab, Jenkins, artifact storage)
- **Multiple media servers** ([Plex](/apps/plex/), [Jellyfin](/apps/jellyfin/)) with software transcoding
- **Database servers** (PostgreSQL, MySQL) with ECC-protected memory
- **Anything a mini PC can run** — but with 10x the headroom

## ProLiant vs Other Used Enterprise Servers

| Server | Pros | Cons | Price |
|--------|------|------|-------|
| **HP ProLiant DL360/380** | iLO, huge used market, well documented | Loud, power hungry | $200-500 |
| [Dell PowerEdge R630/R730](/hardware/used-enterprise-servers/) | iDRAC, equally good, slightly cheaper | Similar noise/power | $150-450 |
| [Dell OptiPlex Micro](/hardware/used-dell-optiplex/) | Quiet, low power, desktop-class | No ECC, limited expansion | $100-300 |
| [Lenovo ThinkCentre](/hardware/used-lenovo-thinkcentre/) | Quiet, low power, compact | No ECC, limited expansion | $100-250 |

**HP ProLiant vs Dell PowerEdge** is largely personal preference. Both have excellent remote management (iLO vs iDRAC), similar pricing, and equivalent performance. Buy whichever has a better deal in your market.

**ProLiant vs mini PC/desktop** is a fundamentally different choice. Enterprise servers are for when you genuinely need 16+ cores, 128GB+ RAM, ECC memory, or 8+ drive bays. If a mini PC handles your workload, it's the better choice due to power and noise.

## Who Should Buy a Used ProLiant

**Buy a ProLiant if:**
- You need 64GB+ RAM with ECC (ZFS, databases, many VMs)
- You're running Proxmox with 10+ VMs
- You need 8+ drive bays for a TrueNAS storage server
- Remote management (iLO) is important (server in a remote location)
- You want enterprise-grade redundancy (dual PSU, hot-swap drives)
- You have a basement, garage, or closet to absorb the noise

**Skip the ProLiant if:**
- Your workload fits in 16-32GB RAM (use a [mini PC](/hardware/best-mini-pc/))
- Noise is a dealbreaker (use a [fanless mini PC](/hardware/fanless-mini-pc/) or [silent build](/hardware/silent-fanless-home-server/))
- Power costs concern you (use a [low-power server](/hardware/low-power-home-server/))
- You only need file storage (use a [NAS](/hardware/best-nas/))
- You're starting your homelab (start with a mini PC, upgrade later if needed)

## FAQ

### Which generation should I buy?
Gen10. It uses DDR4 (cheap), has modern iLO 5, and prices have dropped into the $200-500 range. Gen9 is acceptable for tight budgets. Gen8 and older are not worth the electricity.

### How loud are these servers really?
At idle, a DL360 Gen10 is 35-50 dBA — roughly a loud air conditioner. Under load, 50-65 dBA. You will not want this in a bedroom or living room. Basement, garage, or dedicated closet with the door closed.

### Can I use desktop drives in a ProLiant?
Yes, but use drive caddies designed for the server (HP SmartDrive caddies). Desktop drives work physically but lack TLER — see our [NAS vs desktop drives](/hardware/nas-vs-desktop-drives/) guide. Enterprise SSDs (used Intel DC S3610/S4610, Samsung PM883) are cheap on eBay and ideal.

### Is the iLO license worth paying for?
If your server came without iLO Advanced, you can buy a license for ~$30-50 (used keys on eBay). It's worth it for the remote KVM console alone — being able to install an OS remotely without connecting a monitor is invaluable.

### How much electricity will this cost me?
A single-CPU DL360 Gen10 idles at ~80-100W. At $0.12/kWh, that's $84-105/year. A dual-CPU config idles at ~110-140W ($116-147/year). Budget $8-12/month for electricity.

## Related

- [Used Dell OptiPlex Home Server](/hardware/used-dell-optiplex/)
- [Used Lenovo ThinkCentre](/hardware/used-lenovo-thinkcentre/)
- [Used Enterprise Servers](/hardware/used-enterprise-servers/)
- [Best Mini PC for Home Server](/hardware/best-mini-pc/)
- [Home Server Rack Setup](/hardware/home-server-rack/)
- [Power Consumption Guide](/hardware/power-consumption-guide/)
- [Best Hard Drives for NAS](/hardware/best-hard-drives-nas/)
- [ECC vs Non-ECC RAM](/hardware/ecc-vs-non-ecc-ram/)
