---
title: "Best Refurbished Thin Clients for Home Servers"
description: "The best refurbished thin clients for self-hosting. HP t640, Dell Wyse 5070, and Fujitsu Futro compared with specs, pricing, and setup tips."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "thin-client", "budget", "refurbished"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

The **HP t640** is the best refurbished thin client for home server use. Its AMD Ryzen Embedded R1505G delivers solid performance at 12W TDP, it supports up to 32 GB of RAM via SO-DIMM slots, and refurbished units go for $50–80 USD. If you want something even cheaper, the **Dell Wyse 5070** with an Intel Pentium J5005 runs $40–70 and handles lightweight Docker workloads without breaking a sweat.

## Why Refurbished Thin Clients?

Thin clients were designed for enterprise VDI deployments — terminal devices that connect to remote desktops. Companies cycle through them every 3–5 years, flooding the refurbished market with capable, low-power machines for a fraction of their original price.

For self-hosting, they check every box:

- **Ultra-low power** — 10–25W TDP means $10–25/year in electricity
- **Tiny form factor** — smaller than most routers
- **Fanless or near-silent** — many models have no moving parts
- **Dirt cheap** — $30–80 for a capable machine
- **Reliable** — built for 24/7 enterprise operation
- **x86 architecture** — runs any Linux distro and Docker without ARM compatibility headaches

The Raspberry Pi shortage and price increases made thin clients the go-to budget alternative in the homelab community.

## Top Picks

### HP t640 — Best Overall

| Spec | Details |
|------|---------|
| CPU | AMD Ryzen Embedded R1505G (2C/4T, 2.4 GHz base, 3.3 GHz boost) |
| TDP | 12W (configurable up to 25W) |
| RAM | 8 GB DDR4 SO-DIMM (upgradeable to 32 GB) |
| Storage | 64 GB eMMC onboard + M.2 2230 NVMe slot |
| Networking | Gigabit Ethernet |
| USB | 2x USB 2.0, 4x USB 3.x, 1x USB-C |
| Display | 3x DisplayPort (4K/60Hz each) |
| GPU | Radeon Vega 3 (integrated) |
| Power Supply | 45W external adapter |
| Dimensions | 213 × 213 × 35 mm |
| Refurb Price | $50–80 USD (as of Feb 2026) |

The t640 punches well above its weight class. The Ryzen Embedded R1505G handles Docker containers, Pi-hole, Home Assistant, Nextcloud, and light Plex transcoding without throttling. The Vega 3 iGPU supports hardware transcoding in Jellyfin — something most thin clients cannot do.

The M.2 2230 slot is a key upgrade path. Swap in a 256 GB or 512 GB NVMe drive and you have a proper boot drive, leaving the eMMC for swap or scratch space. RAM is upgradeable to 32 GB via a single SO-DIMM slot, which is enough for a serious self-hosting setup.

**Pros:**
- Upgradeable RAM and storage
- Hardware video transcoding via Vega 3 iGPU
- USB-C with DisplayPort for flexible connectivity
- Fanless, completely silent
- Solid build quality (enterprise-grade)

**Cons:**
- Only 1 GbE (no 2.5 GbE)
- M.2 2230 form factor limits SSD options
- Only 1 SO-DIMM slot

**Best for:** All-around self-hosting — Docker containers, media streaming, DNS, file sync.

### Dell Wyse 5070 — Best Budget

| Spec | Details |
|------|---------|
| CPU | Intel Pentium Silver J5005 (4C/4T, 1.5 GHz base, 2.8 GHz burst) |
| TDP | 10W |
| RAM | 4–8 GB DDR4 SO-DIMM (upgradeable to 16 GB) |
| Storage | 16–64 GB eMMC + M.2 2242 SATA slot |
| Networking | Gigabit Ethernet |
| USB | 2x USB 2.0, 4x USB 3.1 |
| Display | 2x DisplayPort |
| GPU | Intel UHD 605 (integrated) |
| Power Supply | 24W adapter |
| Dimensions | 185 × 185 × 37 mm |
| Refurb Price | $40–70 USD (as of Feb 2026) |

The Wyse 5070 is the homelab community's darling. The J5005's four cores handle Pi-hole, AdGuard Home, WireGuard, Uptime Kuma, and a handful of Docker containers simultaneously. The 10W TDP means annual electricity costs under $15.

The M.2 2242 SATA slot accepts small SSDs — not NVMe, but sufficient for a boot drive. RAM tops out at 16 GB across two SO-DIMM slots, which is adequate for most lightweight workloads.

**Pros:**
- Extremely low power consumption (10W TDP)
- Two SO-DIMM slots (more flexible than t640)
- Massive community support and documentation
- Available for under $50
- Compact and fanless

**Cons:**
- Weaker CPU than the t640
- No hardware transcoding for modern codecs
- M.2 slot is SATA only, not NVMe
- 16 GB RAM ceiling

**Best for:** Lightweight services — DNS, VPN, monitoring, dashboards, small Docker stacks.

### Fujitsu Futro S740 — Best for Europe

| Spec | Details |
|------|---------|
| CPU | Intel Celeron J4105 (4C/4T, 1.5 GHz base, 2.5 GHz burst) |
| TDP | 10W |
| RAM | 4 GB DDR4 SO-DIMM (upgradeable to 8 GB) |
| Storage | 32–64 GB eMMC + M.2 2242 slot |
| Networking | Gigabit Ethernet |
| USB | 2x USB 2.0, 4x USB 3.0 |
| Display | 2x DisplayPort |
| Power Supply | 19V external adapter |
| Refurb Price | €50–80 (as of Feb 2026) |

The Futro S740 is widely available on European refurbished markets. Performance is comparable to the Dell Wyse 5070. The J4105 is essentially the same generation as the J5005 with slightly lower clock speeds.

**Pros:**
- Readily available in Europe at good prices
- Fanless, reliable
- Standard Fujitsu VESA mount included
- Low power consumption

**Cons:**
- Limited to 8 GB RAM
- Less community documentation than Dell/HP models
- eMMC can be slow for write-heavy workloads

**Best for:** European buyers wanting a budget Pi-hole/Docker host.

### HP t630 — Cheapest Option

| Spec | Details |
|------|---------|
| CPU | AMD GX-420GI (4C/4T, 2.0 GHz) |
| TDP | 25W |
| RAM | 4–8 GB DDR4 SO-DIMM (upgradeable to 16 GB) |
| Storage | 16–32 GB eMMC + M.2 slot |
| Networking | Gigabit Ethernet |
| USB | 4x USB 3.0, 2x USB 2.0 |
| Display | 2x DisplayPort |
| Refurb Price | $30–60 USD (as of Feb 2026) |

The t630 is the cheapest entry point. The AMD GX-420GI is older and draws more power than newer alternatives, but at $30–40 it's hard to argue with the value. Good for running two or three lightweight containers and nothing more.

**Pros:**
- Absolute cheapest option
- Upgradeable RAM

**Cons:**
- Higher power draw than newer models
- Older AMD embedded platform
- Weaker single-thread performance

**Best for:** Absolute minimum budget — Pi-hole, WireGuard, a couple of lightweight containers.

## Full Comparison

| Feature | HP t640 | Dell Wyse 5070 | Fujitsu S740 | HP t630 |
|---------|---------|----------------|--------------|---------|
| CPU | Ryzen R1505G | Pentium J5005 | Celeron J4105 | GX-420GI |
| Cores/Threads | 2C/4T | 4C/4T | 4C/4T | 4C/4T |
| TDP | 12W | 10W | 10W | 25W |
| Max RAM | 32 GB | 16 GB | 8 GB | 16 GB |
| M.2 Slot | 2230 NVMe | 2242 SATA | 2242 | M.2 |
| iGPU Transcoding | Yes (Vega 3) | Limited | Limited | No |
| Typical Price | $50–80 | $40–70 | €50–80 | $30–60 |
| Idle Power | ~8W | ~6W | ~6W | ~12W |
| Annual Electricity | ~$8 | ~$6 | ~$6 | ~$13 |

## What Can You Run?

### On an HP t640 (8–32 GB RAM)
- Proxmox with 2–3 LXC containers
- Jellyfin with hardware transcoding (1–2 simultaneous streams)
- Nextcloud + MariaDB
- Home Assistant
- Pi-hole or AdGuard Home
- WireGuard or Tailscale
- Uptime Kuma + Grafana
- Vaultwarden

### On a Dell Wyse 5070 / Fujitsu S740 (4–16 GB RAM)
- Pi-hole or AdGuard Home
- WireGuard VPN
- Uptime Kuma
- 5–10 lightweight Docker containers
- Home Assistant (with moderate add-ons)
- Nginx Proxy Manager
- FreshRSS or Miniflux

### On an HP t630 (4–8 GB RAM)
- Pi-hole
- WireGuard
- 2–3 lightweight containers
- Basic DNS and network services

## How to Set Up a Thin Client as a Home Server

### 1. Acquire and Upgrade

Buy a refurbished unit from eBay, Amazon Renewed, or local enterprise surplus dealers. Open the case (usually tool-less or 1–2 screws), upgrade the RAM and install an M.2 SSD. Total upgrade cost: $20–40 for RAM + $25–40 for an SSD.

### 2. Install Linux

Flash a USB drive with Ubuntu Server, Debian, or Proxmox VE. Boot from USB (check BIOS for boot order or press F12). Install the OS to the M.2 SSD or eMMC.

Most thin clients ship with a proprietary thin-client OS (HP ThinPro, Dell ThinOS). You'll wipe this entirely — it's not useful for self-hosting.

### 3. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

From here, follow our [Docker Compose Basics](/foundations/docker-compose-basics) guide and start deploying services.

### 4. Power and Placement

Thin clients are designed for VESA mounting behind monitors. For server use, place them on a shelf or mount them to the wall. They run cool enough that airflow isn't a concern for most models.

## Power Consumption and Running Costs

| Model | Idle (W) | Load (W) | Annual Cost (idle, $0.12/kWh) |
|-------|----------|----------|-------------------------------|
| HP t640 | 6–8W | 20–25W | $6–8 |
| Dell Wyse 5070 | 5–7W | 15–18W | $5–7 |
| Fujitsu S740 | 5–7W | 14–17W | $5–7 |
| HP t630 | 10–14W | 25–30W | $11–15 |
| Raspberry Pi 4 | 3–5W | 7–8W | $3–5 |
| Intel N100 Mini PC | 6–10W | 20–30W | $6–11 |

Thin clients cost roughly the same to run as a Raspberry Pi 4 but deliver significantly more performance — especially when you factor in the x86 architecture advantage for Docker compatibility.

## Where to Buy

- **eBay** — Largest selection, filter by "refurbished" condition
- **Amazon Renewed** — Better return policy, slightly higher prices
- **Enterprise surplus dealers** — IT Asset Disposition (ITAD) companies sell bulk lots at steep discounts
- **Local electronics recyclers** — Check for enterprise equipment clearance events

**What to look for:** Units with the highest RAM and storage already installed (saves upgrade cost). Check that the power adapter is included — replacements add $10–15.

## FAQ

### Are refurbished thin clients reliable?
Yes. These were built for enterprise 24/7 operation. They typically ran in climate-controlled offices for 3–5 years before decommissioning. The hardware is designed for reliability, not performance — which is exactly what a home server needs.

### Can I add a second NIC?
Not internally on most thin clients — they lack PCIe slots. Use a USB 3.0 Ethernet adapter for a second NIC. This works fine for services like pfSense/OPNsense, though throughput is limited to USB bandwidth.

### Should I buy a thin client or a Raspberry Pi 5?
Buy a thin client if you want x86 Docker compatibility, more RAM, and NVMe storage. Buy a Pi 5 if you need GPIO pins for hardware projects or want an ARM ecosystem. For pure self-hosting, the thin client wins on price-to-performance.

### Can I run Proxmox on a thin client?
Yes, the HP t640 and Dell Wyse 5070 both run Proxmox VE. The t640 with 32 GB RAM is the better candidate — you can run 3–4 LXC containers and a lightweight VM or two.

## Related

- [Best Mini PCs for Home Servers](/hardware/best-mini-pc)
- [Intel N100 Mini PC Guide](/hardware/intel-n100-mini-pc)
- [Used Dell OptiPlex for Self-Hosting](/hardware/used-dell-optiplex)
- [Used Lenovo ThinkCentre Guide](/hardware/used-lenovo-thinkcentre)
- [Home Server Power Consumption Guide](/hardware/power-consumption-guide)
- [Mini PC Power Consumption](/hardware/mini-pc-power-consumption)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Raspberry Pi vs Mini PC](/hardware/raspberry-pi-vs-mini-pc)
