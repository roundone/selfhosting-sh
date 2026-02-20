---
title: "How to Build a Home Server in 2026"
description: "Complete guide to building a home server for self-hosting. Hardware selection, assembly, OS install, and your first Docker containers."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "build-guide", "self-hosting", "docker"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

**Don't build from scratch unless you need more than a mini PC can provide.** A Beelink EQ14 (Intel N150, ~$160) handles a dozen Docker containers, Plex, Nextcloud, Pi-hole, and Home Assistant at 6–10W idle. That covers 90% of self-hosters.

Build your own server when you need: more than 16 GB RAM, multiple drive bays for bulk storage, ECC memory for ZFS, GPU passthrough, or 10GbE networking. If any of those apply, read on.

## Choosing Your Path

There are three approaches to getting a home server, ranked by effort:

| Approach | Cost | Effort | Best For |
|----------|------|--------|----------|
| **Mini PC** | $150–$400 | Plug and play | Most self-hosters |
| **Used office PC** | $100–$250 | Minor upgrades | Budget builds with more RAM/storage |
| **Custom build** | $300–$1,500+ | Full assembly | NAS builds, Proxmox labs, heavy workloads |

This guide covers all three, with exact component recommendations.

## Option 1: Mini PC (Recommended for Most People)

### Best Mini PC Picks

| Model | CPU | RAM | Storage | Price | Power |
|-------|-----|-----|---------|-------|-------|
| **Beelink EQ14** | Intel N150 (4C) | 16 GB | 500 GB SSD | ~$160 | 6–10W |
| **Beelink EQ12 Pro** | Intel N305 (8C) | 16 GB | 500 GB SSD | ~$350 | 10–25W |
| **Beelink SER5 Max** | Ryzen 7 5800H (8C) | 16–32 GB | 500 GB NVMe | ~$400 | 25–45W |

The EQ14 is the right choice for most people. You plug it in, install a Linux distro, set up Docker, and start deploying containers. Done.

For a detailed breakdown, see [Best Mini PCs for Home Servers](/hardware/best-mini-pc) and [Intel N100 Mini PC Guide](/hardware/intel-n100-mini-pc).

### Mini PC Setup

1. Unbox and connect power, Ethernet, monitor, keyboard
2. Boot from USB installer (Ubuntu Server 24.04 LTS recommended)
3. Install the OS, create your user, enable SSH
4. Install Docker and Docker Compose ([Docker Compose Basics](/foundations/docker-compose-basics))
5. Deploy your first containers

That's it. No assembly required.

## Option 2: Used Office PC

Used Dell OptiPlex and Lenovo ThinkCentre machines are the best-kept secret in self-hosting. You get enterprise-grade hardware for a fraction of the price.

### Best Used Office PCs

| Model | CPU | Max RAM | Form Factor | Price |
|-------|-----|---------|-------------|-------|
| **Dell OptiPlex 7050 Micro** | i5-7500T | 32 GB DDR4 | Ultra-small | $80–$120 |
| **Dell OptiPlex 7060 Micro** | i5-8500T | 64 GB DDR4 | Ultra-small | $100–$150 |
| **Dell OptiPlex 5080 SFF** | i5-10500 | 128 GB DDR4 | Small form factor | $150–$200 |
| **Lenovo ThinkCentre M720q** | i5-8500T | 64 GB DDR4 | Tiny | $90–$130 |
| **Lenovo ThinkCentre M920q** | i5-9500T | 64 GB DDR4 | Tiny | $120–$160 |

### Why Used Office PCs Work

- **Cheap.** A 7060 Micro with an i5 costs $120 on eBay. That same $120 buys you a low-end Raspberry Pi kit with less performance.
- **Upgradeable.** Swap in 32–64 GB of DDR4 for $40–$60. Add an NVMe drive for $30.
- **Quiet.** These were designed for office environments. The Micro and Tiny form factors are near-silent.
- **Low power.** 15–25W idle for the T-series (low-power) CPUs.
- **Reliable.** Enterprise hardware with enterprise quality control.

For detailed guides, see [Dell OptiPlex Home Server](/hardware/used-dell-optiplex) and [Lenovo ThinkCentre Home Server](/hardware/used-lenovo-thinkcentre).

### Recommended Upgrades

1. **RAM:** Upgrade to 32 GB DDR4 ($30–$50). Essential for Proxmox or running many containers.
2. **Storage:** Add a 1 TB NVMe SSD ($60–$80) for OS and containers. Add a USB 3.0 external drive for media storage.
3. **Network:** The built-in 1GbE is fine for most setups. Add a USB 3.0 to 2.5GbE adapter ($15) if you need more throughput.

## Option 3: Custom Build

Build from scratch when you need something a mini PC or office PC can't provide.

### When to Build Custom

- **NAS with 4+ drive bays** — you need a case with drive cages and a board with enough SATA ports
- **Proxmox lab with 64+ GB RAM** — most mini PCs max out at 16–32 GB
- **GPU passthrough** — you need a PCIe slot and proper IOMMU support
- **10GbE networking** — you need a PCIe slot for a 10GbE NIC
- **ECC memory for ZFS** — only certain platforms support ECC

### Budget NAS Build ($300–$400)

This is the sweet spot for a DIY NAS running TrueNAS or Unraid.

| Component | Recommendation | Price |
|-----------|---------------|-------|
| **CPU** | Intel i3-12100 (4C/8T, QuickSync, 60W TDP) | $100 |
| **Motherboard** | ASRock B660M-HDV (mATX, 4 SATA, M.2) | $80 |
| **RAM** | 16 GB DDR4-3200 (2x8 GB) | $30 |
| **Boot drive** | 256 GB NVMe SSD | $25 |
| **Case** | Fractal Design Node 304 (6 drive bays, mITX) or Jonsbo N2 (5 bays) | $80 |
| **PSU** | Corsair CX450M (450W, 80+ Bronze) | $45 |
| **Total** | | **~$360** |

Add your storage drives separately. For drive recommendations, see [Best Hard Drives for NAS](/hardware/best-hard-drives-nas) and [HDD vs SSD for Home Server](/hardware/hdd-vs-ssd-home-server).

### Performance Build ($600–$800)

For Proxmox with multiple VMs, Plex 4K transcoding, or heavy compute.

| Component | Recommendation | Price |
|-----------|---------------|-------|
| **CPU** | Intel i5-13500 (14C/20T, QuickSync, 65W) | $180 |
| **Motherboard** | ASUS Prime B760M-A WiFi (mATX, 4 SATA, 2x M.2) | $120 |
| **RAM** | 64 GB DDR4-3200 (2x32 GB) | $80 |
| **Boot drive** | 1 TB NVMe SSD | $60 |
| **Case** | Fractal Design Define Mini C (mATX, 3x 3.5" + 2x 2.5") | $80 |
| **PSU** | Corsair RM650 (650W, 80+ Gold) | $80 |
| **Total** | | **~$600** |

### Assembly Tips

1. **Install the CPU first.** Align the triangle on the CPU with the triangle on the socket. Zero force — if it doesn't drop in, it's not aligned.
2. **Apply thermal paste.** A pea-sized dot in the center. The cooler pressure spreads it.
3. **Mount the cooler.** Stock coolers are fine for home servers. Don't buy an aftermarket cooler unless noise matters to you.
4. **Install RAM.** Check your motherboard manual for dual-channel slots (usually slots 2 and 4). Press until both clips click.
5. **Install the M.2 SSD.** Insert at a 30° angle, press flat, secure with the screw.
6. **Mount the motherboard.** Install standoffs first. Line up the I/O shield. Secure with 9 screws.
7. **Connect power.** 24-pin ATX, 8-pin CPU, SATA power to drives.
8. **Connect front panel.** Power button, USB, audio. Check the motherboard manual for pin layout.
9. **Install drives.** Mount in drive cages, connect SATA data and power cables.
10. **Cable management.** Route cables behind the motherboard tray. This improves airflow and makes maintenance easier.

## Operating System

Once hardware is ready, install an OS. These are the best options for self-hosting:

| OS | Best For | Learning Curve |
|-----|----------|---------------|
| **Ubuntu Server 24.04 LTS** | Docker-based self-hosting | Low |
| **Debian 12 Bookworm** | Stability, minimal overhead | Low-Medium |
| **Proxmox VE 8.x** | Running VMs + containers | Medium |
| **TrueNAS Scale** | NAS-first with Docker/VMs | Medium |
| **Unraid** | Mixed NAS + Docker + VMs | Low (but paid: $59+) |

For most self-hosters running Docker containers, **Ubuntu Server 24.04 LTS** is the right choice. It has the widest documentation coverage and the easiest Docker installation.

For NAS-focused builds, [TrueNAS vs Unraid](/hardware/truenas-vs-unraid) compares the two best options.

For virtualization, see [Proxmox Hardware Guide](/hardware/proxmox-hardware-guide).

## First Steps After Build

1. **Install the OS** from a USB drive (use Balena Etcher or Rufus to flash the ISO)
2. **Update everything:** `sudo apt update && sudo apt upgrade -y`
3. **Enable SSH:** `sudo systemctl enable ssh`
4. **Set a static IP** in your router's DHCP settings or via netplan
5. **Install Docker and Docker Compose** ([guide](/foundations/docker-compose-basics))
6. **Install your first app** — we recommend [Portainer](/apps/portainer) for a Docker management GUI, then [Pi-hole](/apps/pihole) as your first real service
7. **Set up a reverse proxy** — [Nginx Proxy Manager](/apps/nginx-proxy-manager) is the easiest. See our [Reverse Proxy Setup guide](/foundations/reverse-proxy)
8. **Configure backups** — [Backup Strategy](/foundations/backup-strategy)

## Power Consumption and Running Costs

| Build Type | Idle Power | Annual Electricity (at $0.12/kWh) |
|------------|-----------|-----------------------------------|
| Mini PC (N100/N150) | 6–10W | $6–$11/year |
| Used Office PC (i5-T) | 15–25W | $16–$26/year |
| Budget NAS build | 30–50W | $32–$53/year |
| Performance build | 40–80W | $42–$84/year |

Compare that to cloud hosting: a basic VPS costs $5–$20/month ($60–$240/year), with limited storage. A home server pays for itself in electricity savings within the first year.

For more detail, see [Home Server Power Consumption Guide](/hardware/power-consumption-guide) and [Self-Hosting vs Cloud Costs](/hardware/self-hosting-vs-cloud-costs).

## What Can You Run?

### On a Mini PC (N100, 16 GB RAM)
Pi-hole, Nextcloud, Vaultwarden, Home Assistant, Uptime Kuma, Jellyfin (1 transcode), Nginx Proxy Manager, Portainer, a few more lightweight containers. This covers a typical household.

### On 32 GB RAM (Office PC or Custom)
Everything above plus: Plex with multiple transcodes, Matrix/Synapse, GitLab CE, n8n, Grafana + Prometheus, multiple game servers, WordPress.

### On 64+ GB RAM (Custom Build)
Run Proxmox with multiple VMs. Dedicate resources to a NAS VM, a Docker VM, a gaming VM with GPU passthrough. This is homelab territory.

For app-specific resource requirements, check individual [app guides](/apps/).

## Common Mistakes

1. **Buying too much hardware.** Most self-hosters never use more than 8 GB of RAM. Start small, upgrade when you actually hit limits.
2. **Ignoring power consumption.** A used enterprise rack server draws 200–400W idle. At $0.12/kWh, that's $210–$420/year in electricity. A mini PC does the same job at $10/year.
3. **Skipping backups.** Your server will fail eventually. RAID is not a backup. Set up automated backups before you put data on the server. See [Backup Strategy](/foundations/backup-strategy).
4. **Using Wi-Fi instead of Ethernet.** Self-hosted services need reliable, low-latency connections. Run an Ethernet cable. See [Network Cables Guide](/hardware/network-cables-guide).
5. **No UPS.** A $50 UPS protects against power surges and gives you time for a clean shutdown. See [Best UPS for Home Server](/hardware/best-ups-home-server).

## FAQ

### How much does it cost to run a home server?

Electricity is the main ongoing cost. A mini PC costs $6–$11/year. A custom build costs $30–$80/year. Internet is a cost you already pay. There are no subscription fees for self-hosted software.

### Do I need a dedicated server room?

No. A mini PC sits on a shelf. A small tower fits in a closet. You only need dedicated space (and cooling) for rack-mounted equipment. Most home self-hosters run their server in an office, closet, or utility room.

### Is a Raspberry Pi good enough?

The Raspberry Pi 5 (8 GB) can run lightweight containers — Pi-hole, Vaultwarden, Home Assistant. But it struggles with anything storage-heavy (Nextcloud, Jellyfin) due to USB-based storage and limited RAM. A $160 mini PC is faster, has NVMe storage, and costs the same as a fully-kitted Pi. See [Raspberry Pi vs Mini PC](/hardware/raspberry-pi-vs-mini-pc).

### Should I use Proxmox or just Docker?

If you only want to run containers, skip Proxmox. Install Ubuntu Server and Docker directly. Proxmox adds value when you need VMs — for testing different OSes, isolating workloads, or GPU passthrough. See [Proxmox Hardware Guide](/hardware/proxmox-hardware-guide).

### How much RAM do I actually need?

- **8 GB:** Enough for 5–10 lightweight containers
- **16 GB:** Comfortable for 15–20 containers including Nextcloud and Jellyfin
- **32 GB:** Room for databases, multiple heavy apps, or light VM use
- **64+ GB:** Proxmox with multiple VMs, or running everything

Start with 16 GB. Upgrade to 32 if you feel constrained.

## Related

- [Best Mini PCs for Home Servers](/hardware/best-mini-pc)
- [Intel N100 Mini PC Guide](/hardware/intel-n100-mini-pc)
- [Dell OptiPlex Home Server](/hardware/used-dell-optiplex)
- [Lenovo ThinkCentre Home Server](/hardware/used-lenovo-thinkcentre)
- [Best NAS for Home Server](/hardware/best-nas)
- [DIY NAS Build Guide](/hardware/diy-nas-build)
- [Home Server Power Consumption](/hardware/power-consumption-guide)
- [Self-Hosting vs Cloud Costs](/hardware/self-hosting-vs-cloud-costs)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Getting Started with Self-Hosting](/foundations/getting-started)
- [Raspberry Pi vs Mini PC](/hardware/raspberry-pi-vs-mini-pc)
- [Proxmox Hardware Guide](/hardware/proxmox-hardware-guide)
- [Backup Strategy](/foundations/backup-strategy)
