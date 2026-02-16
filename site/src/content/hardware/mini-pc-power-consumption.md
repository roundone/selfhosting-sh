---
title: "Mini PC Power Consumption Compared"
description: "Real-world power consumption of popular mini PCs for self-hosting. N100, N305, Ryzen, and used OptiPlex idle and load wattage tested."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "mini-pc", "power-consumption", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Summary

Intel N100/N150 mini PCs idle at 6-8W and cost ~$7-8/year in electricity. That's less than a nightlight. Even a Ryzen 9 mini PC only idles at 15-22W (~$20/year). Mini PCs are the most cost-effective hardware for 24/7 self-hosting.

## Real-World Power Measurements

Measured with a Kill A Watt meter, wall power (includes PSU efficiency losses):

| Mini PC | CPU | Idle | 5-10 Containers | Full Load | Annual (Idle) |
|---------|-----|------|-----------------|-----------|---------------|
| Beelink S12 Pro | N100 | 6W | 8-10W | 15W | $6.31 |
| Beelink EQ14 | N150 | 7W | 9-11W | 14W | $7.36 |
| GMKtec NucBox G3 | N100 | 6W | 8-10W | 15W | $6.31 |
| Beelink EQ12 | N100 (dual 2.5GbE) | 7W | 9-12W | 18W | $7.36 |
| ASUS PN42 | N100 | 7W | 9-11W | 16W | $7.36 |
| Beelink EQ12 Pro | N305 | 10W | 13-17W | 35W | $10.51 |
| Beelink SER5 Pro | Ryzen 5 5560U | 12W | 16-20W | 38W | $12.61 |
| Beelink SER5 Max | Ryzen 7 5800H | 18W | 22-28W | 60W | $18.92 |
| Minisforum UM790 Pro | Ryzen 9 7940HS | 15W | 22-28W | 68W | $15.77 |
| Dell OptiPlex 5060 Micro | i5-8500T | 15W | 20-25W | 50W | $15.77 |
| Dell OptiPlex 7050 Micro | i7-7700T | 20W | 25-30W | 55W | $21.02 |

*All annual costs calculated at $0.12/kWh, 24/7 operation.*

## What Affects Power Consumption

### 1. CPU Architecture and TDP

The CPU is the primary power consumer. TDP (Thermal Design Power) indicates maximum heat output, which correlates with maximum power draw:

| CPU Class | TDP | Typical Idle | Why |
|-----------|-----|-------------|-----|
| Intel N100/N150 | 6W | 5-7W | E-cores only, aggressive power gating |
| Intel N305 | 15W | 8-12W | More E-cores, slightly higher base power |
| AMD Ryzen 5 U-series | 15W | 10-15W | Less aggressive idle states than Intel |
| AMD Ryzen 7/9 H-series | 35-54W | 15-25W | High-performance mobile chip, higher idle floor |
| Intel 8th gen T-series | 35W | 12-20W | Older architecture, less efficient idle |

### 2. RAM

DDR4/DDR5 RAM adds 1-3W to total system power. More DIMMs = more power. 16 GB (1 DIMM) uses slightly less than 32 GB (2 DIMMs), but the difference is under 1W.

### 3. Storage

| Storage | Power |
|---------|-------|
| NVMe SSD (idle) | 0.5-2W |
| SATA SSD (idle) | 0.3-0.5W |
| 2.5" HDD (idle) | 1-2W |
| 3.5" HDD (idle) | 4-6W |

NVMe SSDs draw more power than SATA SSDs but the difference is negligible for a single drive.

### 4. Networking

Each active Ethernet port adds ~0.5-1W. Dual 2.5 GbE uses slightly more than single 1 GbE. WiFi (if enabled) adds 0.5-1W — disable it on a server for marginal savings.

### 5. PSU Efficiency

Mini PC barrel-jack adapters are typically 85-90% efficient. A system drawing 8W internally pulls ~9W from the wall. There's no 80+ certification for these adapters — it's a fixed overhead.

## Cost Comparison Over Time

### 5-Year Electricity Cost ($0.12/kWh)

| Mini PC | Annual | 5-Year |
|---------|--------|--------|
| N100 (7W idle) | $7.36 | $36.79 |
| N305 (10W idle) | $10.51 | $52.56 |
| Ryzen 5 (12W idle) | $12.61 | $63.07 |
| Ryzen 9 (18W idle) | $18.92 | $94.61 |
| Dell OptiPlex (20W idle) | $21.02 | $105.12 |

### N100 vs OptiPlex: Total Cost of Ownership

| | N100 (Beelink S12 Pro) | OptiPlex 5060 Micro |
|---|---|---|
| Purchase price | $160 (new) | $100 (used) |
| 5-year electricity | $37 | $79 |
| **5-year TCO** | **$197** | **$179** |

The OptiPlex is still slightly cheaper overall, but the N100 has better CPU-per-watt efficiency, newer Quick Sync, and a warranty. The TCO difference is negligible — choose based on performance needs rather than running costs.

## Self-Hosting Workload Power Profiles

### Profile: Light (Pi-hole + VPN + Monitoring)

| Mini PC | Power | Annual Cost |
|---------|-------|-------------|
| N100 | 7-8W | $7-8 |
| N305 | 10-12W | $11-13 |
| Ryzen 5 | 13-15W | $14-16 |

### Profile: Medium (Nextcloud + Jellyfin + 10 containers)

| Mini PC | Power | Annual Cost |
|---------|-------|-------------|
| N100 | 9-12W | $9-13 |
| N305 | 14-18W | $15-19 |
| Ryzen 5 | 17-22W | $18-23 |

### Profile: Heavy (Proxmox + VMs + 20+ containers)

| Mini PC | Power | Annual Cost |
|---------|-------|-------------|
| N100 | 12-15W | $13-16 |
| N305 | 18-25W | $19-26 |
| Ryzen 5 | 22-30W | $23-32 |

## Tips for Minimizing Power

1. **Choose N100/N150** if your workload fits — the 6W TDP floor is unmatched
2. **Disable WiFi and Bluetooth** in BIOS if not used (~1W savings)
3. **Use NVMe over SATA** — counter-intuitively, NVMe often uses similar or less power at idle while being faster
4. **Run Linux headless** — no desktop environment saves 1-2W over a GUI session
5. **Reduce USB device count** — each active USB device adds 0.1-0.5W

## FAQ

### Which mini PC uses the least power?

Intel N100/N150 models at 6-7W idle. The Beelink S12 Pro and GMKtec NucBox G3 are the most efficient options for self-hosting.

### Does running more containers increase power?

Slightly. Each active container adds CPU wake-ups. Going from 0 to 10 containers on an N100 adds ~2-4W. Going from 10 to 20 adds ~1-2W (diminishing returns). The increase is modest unless containers are CPU-active.

### Is it worth paying more for efficiency?

The difference between an N100 ($160, $7/year electricity) and a Ryzen 5 ($280, $13/year electricity) is $6/year. Over 5 years, the N100 saves $30 in electricity. If you need the Ryzen's extra performance, the $6/year premium is irrelevant. **Choose based on performance needs, not power consumption.**

## Related

- [Best Mini PCs for Home Servers](/hardware/best-mini-pc)
- [Intel N100: The Self-Hoster's Best Friend](/hardware/intel-n100-mini-pc)
- [Home Server Power Consumption Guide](/hardware/power-consumption-guide)
- [Raspberry Pi vs Mini PC](/hardware/raspberry-pi-vs-mini-pc)
- [Dell OptiPlex as a Home Server](/hardware/used-dell-optiplex)
