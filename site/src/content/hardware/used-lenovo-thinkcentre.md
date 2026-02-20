---
title: "Lenovo ThinkCentre as a Home Server"
description: "How to use a used Lenovo ThinkCentre Tiny as a home server. Best models, pricing, and comparison with Dell OptiPlex for self-hosting."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "lenovo-thinkcentre", "used-hardware", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

**The Lenovo ThinkCentre M720q Tiny or M920q Tiny with an i5-8500T is the best used Lenovo for self-hosting.** Expect to pay $90-150 on eBay. It's comparable to a [Dell OptiPlex Micro](/hardware/used-dell-optiplex) — same generation CPUs, similar size, same use case. Buy whichever is cheaper on the day you order.

## Best Models for Self-Hosting

| Model | Gen | CPU Options | Max RAM | Storage | Price (eBay) |
|-------|-----|-----------|---------|---------|-------------|
| **M720q Tiny** | 8th | i3-8100T, i5-8400T, i5-8500T | 64 GB DDR4 | M.2 NVMe + 2.5" SATA | $90-140 |
| **M920q Tiny** | 8th/9th | i5-8500T, i5-9500T, i7-9700T | 64 GB DDR4 | M.2 NVMe + 2.5" SATA | $110-170 |
| **M910q Tiny** | 7th | i5-7500T, i7-7700T | 32 GB DDR4 | M.2 NVMe + 2.5" SATA | $80-120 |
| **M920x Tiny** | 8th/9th | i5-8500T, i5-9500T | 64 GB DDR4 | M.2 NVMe + 2.5" SATA + PCIe x16 | $150-200 |
| **M70q Gen 2** | 11th | i5-11500T | 64 GB DDR4 | M.2 NVMe + 2.5" SATA | $170-250 |

**Recommended:** M720q Tiny with i5-8500T (6C/6T). Best value. Same CPU as the Dell OptiPlex 5060 Micro.

**Notable:** The M920x Tiny has a PCIe x16 slot — unique among Tiny form factor PCs. You can install a low-profile GPU, 10 GbE NIC, or HBA card. This makes it the only used mini PC that supports PCIe expansion.

## ThinkCentre vs OptiPlex

Both are enterprise mini desktops with the same CPUs, similar specs, and comparable pricing. The differences are minor:

| Feature | ThinkCentre Tiny | OptiPlex Micro |
|---------|-----------------|---------------|
| Build quality | Excellent | Excellent |
| Form factor | 1L (179 x 182 x 34.5mm) | 1.2L (182 x 178 x 36mm) |
| RAM slots | 2x SO-DIMM | 2x SO-DIMM |
| Max RAM | 64 GB (M720q/M920q) | 32-64 GB (varies by model) |
| M.2 NVMe | Yes | Yes |
| 2.5" bay | Yes | Yes |
| Intel vPro/AMT | Select models | Select models |
| PCIe slot | M920x only (x16) | None on Micro |
| USB ports | 5-6 (varies) | 5-6 (varies) |
| Dual display | 2x DisplayPort (some have HDMI) | DisplayPort + HDMI |
| VESA mount | Optional bracket | Optional bracket |
| Used market availability | Good | Excellent (more units) |
| Price range | $90-170 | $80-180 |

**Buy whichever is cheaper.** If prices are equal, the ThinkCentre M720q/M920q supports 64 GB RAM (vs 32 GB on many OptiPlex models), which is useful for Proxmox or heavy workloads.

## Setup Guide

Setup is identical to the [Dell OptiPlex server setup](/hardware/used-dell-optiplex) — they use the same Intel CPUs and standard components.

### BIOS Configuration

Press **F1** during boot (Lenovo uses F1, not F2 like Dell):

- **Power → After Power Loss:** Set to "Power On" for automatic restart after outages
- **Security → Intel VT-x:** Enable
- **Security → Intel VT-d:** Enable
- **Devices → Intel AMT:** Enable (if available)

### Install Linux + Docker

```bash
# Flash Ubuntu Server 24.04 LTS or Debian 12 to USB
# Boot from USB (press F12 for boot menu)
# Install to internal NVMe SSD

# After installation, install Docker:
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### Quick Sync for Media Transcoding

Same as any Intel system — pass through `/dev/dri`:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    devices:
      - /dev/dri:/dev/dri
```

8th gen Intel (Coffee Lake) supports H.264, HEVC, and VP9 hardware transcoding. Handles 2-3 simultaneous 1080p transcodes.

## Power Consumption

Measured on M720q Tiny with i5-8500T, 16 GB RAM, NVMe SSD:

| State | Power Draw |
|-------|-----------|
| Off (standby) | 1W |
| Idle (headless) | 12-16W |
| Light Docker containers | 18-22W |
| Moderate load | 25-32W |
| Full CPU load | 48-55W |

Essentially identical to the Dell OptiPlex Micro with the same CPU. Annual cost at typical server load (~20W): ~$21/year at $0.12/kWh.

## What You Can Run

Same as the [Dell OptiPlex](/hardware/used-dell-optiplex) — the hardware is equivalent. With i5-8500T and 16 GB RAM:

- [Pi-hole](/apps/pi-hole), [Nextcloud](/apps/nextcloud), [Jellyfin](/apps/jellyfin), [Vaultwarden](/apps/vaultwarden)
- [Home Assistant](/apps/home-assistant), [Uptime Kuma](/apps/uptime-kuma), [Nginx Proxy Manager](/apps/nginx-proxy-manager)
- [Immich](/apps/immich), [Paperless-ngx](/apps/paperless-ngx), [Syncthing](/apps/syncthing)
- 20+ Docker containers simultaneously

With 32-64 GB RAM (M720q/M920q support this):
- Proxmox with 3-5 VMs
- Heavy applications like [GitLab CE](/apps/gitlab) or [Matrix](/apps/matrix)

## The M920x: The PCIe Exception

The ThinkCentre M920x Tiny is unique — it has a PCIe x16 slot in a 1L form factor. This opens up possibilities no other used mini PC offers:

- **Low-profile GPU:** For hardware transcoding beyond Quick Sync (NVIDIA T400/T600 for Plex with tone mapping)
- **10 GbE NIC:** Mellanox ConnectX-3 for high-speed NAS access
- **HBA card:** For direct-attach SATA/SAS connectivity (niche use)

The M920x is $40-60 more than the M920q but worth it if you need PCIe expansion.

## FAQ

### ThinkCentre or OptiPlex — which should I buy?

Whichever is cheaper with the specs you want. They're functionally interchangeable for self-hosting. If you need 64 GB RAM, the ThinkCentre M720q/M920q is the better choice. If you want the most models to choose from, Dell OptiPlex has more units on the used market.

### Is the M710q (7th gen) worth buying?

Only if it's under $80. The i5-7500T (4C/4T) is noticeably less capable than the i5-8500T (6C/6T). The generational jump from 7th to 8th gen Intel added 50% more cores — it's a significant difference for containerized workloads.

### Can I cluster multiple ThinkCentres?

Yes. Some homelab users run 2-3 ThinkCentre/OptiPlex Micros as a Proxmox cluster. At $100-120 each, 3 nodes cost less than a single used rack server and draw far less power. Stack them with a small switch for a compact HA cluster.

## Related

- [Dell OptiPlex as a Home Server](/hardware/used-dell-optiplex)
- [Best Mini PCs for Home Servers](/hardware/best-mini-pc)
- [Intel N100: The Self-Hoster's Best Friend](/hardware/intel-n100-mini-pc)
- [Home Server Power Consumption Guide](/hardware/power-consumption-guide)
- [Best UPS for Home Servers](/hardware/best-ups-home-server)
- [Docker Compose Basics](/foundations/docker-compose-basics)
