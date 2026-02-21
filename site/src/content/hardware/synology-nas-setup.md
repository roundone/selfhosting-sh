---
title: "Synology NAS Setup Guide for Self-Hosting"
description: "Set up a Synology NAS for self-hosting with Docker. Model recommendations, DSM setup, Container Manager, and reverse proxy config."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "hardware"
apps: []
tags: ["hardware", "synology", "nas", "docker", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

**Synology DS224+ ($300) with two Seagate IronWolf 4 TB drives ($65 each) in SHR.** Total: ~$430 for a turnkey NAS with 4 TB usable storage, Docker support, and Synology's polished DSM interface. It's the easiest path to self-hosting for people who don't want to build their own server.

If you want more performance for Docker containers, the DS423+ ($500) has an Intel Celeron J4125 (4C/4T), 2 GB RAM (expandable to 32 GB), and two NVMe cache slots.

**The catch:** Synology hardware is overpriced compared to DIY. A $200 used OptiPlex + $130 in drives gives you more compute power and the same storage. You're paying a premium for DSM's user experience. For some people, that premium is worth it. For others, it isn't.

## Which Synology to Buy

### For Self-Hosting

| Model | CPU | RAM | Bays | Docker | Price |
|-------|-----|-----|------|--------|-------|
| **DS224+** | Intel Celeron J4125 | 2 GB (max 6 GB) | 2 | Yes | ~$300 |
| **DS423+** | Intel Celeron J4125 | 2 GB (max 32 GB) | 4 | Yes | ~$500 |
| **DS723+** | AMD Ryzen R1600 | 2 GB (max 32 GB) | 2 | Yes | ~$400 |
| **DS923+** | AMD Ryzen R1600 | 4 GB (max 32 GB) | 4 | Yes | ~$550 |
| **DS1522+** | AMD Ryzen R1600 | 8 GB (max 32 GB) | 5 | Yes | ~$700 |

**Key rule: Only "+" models support Docker.** The value series (DS223, DS423, etc. without "+") runs ARM processors and cannot run Docker containers. If self-hosting is your goal, you must buy a "+" model.

### Best Value: DS224+

Two bays, Intel Celeron, Docker support. Handles Pi-hole, Vaultwarden, Home Assistant, Uptime Kuma, and a handful of lightweight containers. The 2 GB base RAM is tight — upgrade to 6 GB ($15 for a 4 GB DDR4 SODIMM) immediately.

### Best Performance: DS923+

AMD Ryzen R1600 (2C/4T) is faster than the Celeron J4125 in the DS224+. Four bays for storage expansion. 32 GB RAM maximum. 10GbE-ready via expansion card. This is the model for people who want to run 15+ Docker containers alongside NAS duties.

### Skip These

- **DS223** — ARM CPU, no Docker
- **DS124** — Single bay, ARM CPU, no Docker
- **Any J-series (DS220j, DS420j)** — ARM, no Docker, underpowered

## Initial DSM Setup

### 1. Physical Setup

1. Insert drives (Seagate IronWolf or WD Red Plus recommended — see [Best Hard Drives for NAS](/hardware/best-hard-drives-nas/))
2. Connect Ethernet to your router/switch
3. Connect power and press the power button
4. Wait 2–3 minutes for boot

### 2. Find Your NAS

Open a browser and go to `http://find.synology.com`. It discovers your NAS on the local network. Alternatively, try `http://diskstation:5000`.

### 3. DSM Installation

1. Click **Install Now** to install DiskStation Manager
2. Create your admin account (use a strong password)
3. Set up QuickConnect (skip if you plan to use your own domain + reverse proxy)
4. Choose **SHR (Synology Hybrid RAID)** for storage — it's the best default for most users
5. Choose **Btrfs** as the filesystem (snapshots, checksums, better data protection than ext4)
6. Wait for drive initialization (can take hours for large drives)

### 4. Post-Install Essentials

1. **Update DSM** — Control Panel → Update & Restore → Download and install
2. **Enable SSH** — Control Panel → Terminal & SNMP → Enable SSH service
3. **Change default ports** — Control Panel → Login Portal → change HTTP port from 5000 (commonly scanned)
4. **Enable 2FA** — Control Panel → Security → 2-Factor Authentication → Enforce for all users
5. **Disable QuickConnect** if you'll use your own domain — Control Panel → QuickConnect → disable

## Setting Up Docker (Container Manager)

Synology calls Docker "Container Manager" in DSM 7.2+.

### Install Container Manager

1. Open **Package Center**
2. Search for **Container Manager**
3. Click **Install**

### Create a Shared Folder for Docker

1. Control Panel → Shared Folder → Create
2. Name: `docker`
3. Location: Volume 1
4. Disable recycle bin (containers don't need it)

### Using Docker Compose

Container Manager supports Docker Compose projects directly:

1. Open **Container Manager** → **Project**
2. Click **Create**
3. Name your project (e.g., `pihole`)
4. Paste your `docker-compose.yml` content
5. Click **Apply**

Alternatively, SSH into the NAS and use the command line:

```bash
# SSH into the NAS
ssh admin@your-nas-ip

# Navigate to your docker folder
cd /volume1/docker

# Create a project directory
mkdir pihole && cd pihole

# Create docker-compose.yml
nano docker-compose.yml

# Start the stack
sudo docker compose up -d
```

### Volume Paths on Synology

Synology's Docker volumes map to `/volume1/docker/` on the filesystem. When writing Docker Compose files for Synology, use:

```yaml
volumes:
  - /volume1/docker/appname/config:/config
  - /volume1/docker/appname/data:/data
```

Not the standard Linux paths like `/opt/` or `/home/user/docker/`.

## Example: Running Pi-hole on Synology

```yaml
version: "3"
services:
  pihole:
    container_name: pihole
    image: pihole/pihole:2024.07.0
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "8080:80/tcp"
    environment:
      TZ: "America/New_York"
      WEBPASSWORD: "change-this-password"
    volumes:
      - /volume1/docker/pihole/etc-pihole:/etc/pihole
      - /volume1/docker/pihole/etc-dnsmasq.d:/etc/dnsmasq.d
    restart: unless-stopped
```

**Note:** Port 80 conflicts with DSM's web interface. Map Pi-hole's HTTP to 8080 instead.

## Synology Reverse Proxy

DSM has a built-in reverse proxy. Use it instead of installing Nginx Proxy Manager:

1. Control Panel → Login Portal → Advanced → Reverse Proxy
2. Click **Create**
3. Set:
   - Source: `https://pihole.yourdomain.com`, port 443
   - Destination: `http://localhost`, port 8080
4. Enable HSTS

For SSL certificates, use DSM's built-in Let's Encrypt:
1. Control Panel → Security → Certificate → Add → Get a certificate from Let's Encrypt
2. Enter your domain name and email
3. DSM handles renewal automatically

## RAM Upgrade (Do This First)

The DS224+ ships with 2 GB — barely enough for DSM itself. Docker containers will swap to disk constantly.

1. Power off the NAS
2. Open the drive bay panel
3. Locate the RAM slot (bottom of the unit, behind the drives)
4. Insert a **4 GB DDR4 SODIMM** (2666 MHz, non-ECC) — Crucial CT4G4SFS8266 works
5. Boot up — DSM auto-detects the new RAM

Total: 6 GB (2 GB soldered + 4 GB added). Enough for 10–15 Docker containers.

For the DS923+/DS1522+, max out at 32 GB (2x16 GB DDR4 ECC SODIMM) if you plan heavy Docker usage.

## Synology vs DIY vs Mini PC

| Factor | Synology DS224+ | DIY NAS | Mini PC + USB Drive |
|--------|----------------|---------|---------------------|
| Price (with 2x4TB) | ~$430 | ~$350 | ~$230 |
| Setup time | 30 min | 2–4 hours | 1 hour |
| Docker performance | Adequate | Better | Better |
| Storage expansion | 2 bays | 4–6+ bays | USB only |
| Power draw | 15–25W | 30–50W | 8–12W |
| Management UI | DSM (excellent) | TrueNAS/Unraid | SSH + Portainer |
| Noise | Quiet | Depends on case | Silent |

**Choose Synology if:** You value a polished UI, want hardware RAID without thinking about it, and don't mind paying more. Good for people who want a NAS first and a Docker host second.

**Choose DIY if:** You want maximum performance per dollar, more storage bays, and full control. Good for people comfortable with Linux.

**Choose Mini PC if:** You want Docker containers first and storage second. Cheapest and lowest power. Pair with a USB drive or NAS-mounted shares for storage.

For detailed comparisons, see [Synology vs TrueNAS](/hardware/synology-vs-truenas/) and [Synology vs Unraid](/hardware/synology-vs-unraid/).

## Limitations of Synology for Self-Hosting

Be aware of these before buying:

1. **Weak CPUs.** The J4125 and R1600 are adequate but not powerful. Don't expect Plex 4K transcoding or running 20+ containers smoothly.
2. **Proprietary ecosystem.** DSM is Linux-based but heavily modified. Some Docker containers behave differently than on standard Ubuntu/Debian.
3. **Expensive RAM and expansion.** Synology-branded RAM costs 3–5x market price. Use compatible third-party modules instead.
4. **No Proxmox/VMs.** Synology's Virtual Machine Manager is limited. If you want full virtualization, use Proxmox on dedicated hardware.
5. **Vendor lock-in.** If your Synology dies, you can't easily move the drives to a different platform without reformatting (SHR is Synology-specific, though it's based on mdadm/LVM).

## FAQ

### Can I run Plex on a Synology NAS?

Yes, but transcoding performance is limited. The DS224+'s J4125 handles 1–2 1080p transcodes via Quick Sync. It cannot transcode 4K. If you primarily direct-play media, Synology works fine. For heavy transcoding, use a mini PC or dedicated server.

### How many Docker containers can a DS224+ run?

With 6 GB RAM (after upgrade): 8–12 lightweight containers comfortably. Services like Pi-hole, Vaultwarden, Home Assistant, Uptime Kuma, Nginx Proxy Manager — no problem. Heavy apps like Nextcloud, GitLab, or Matrix will strain it.

### Is Synology worth the price premium?

If you value your time and want a turnkey experience: yes. DSM is genuinely the best NAS operating system. But if you're comfortable with Linux and Docker, a DIY build gives you 2–3x the performance for the same money.

## Related

- [Best NAS for Home Server](/hardware/best-nas/)
- [Synology vs TrueNAS](/hardware/synology-vs-truenas/)
- [Synology vs Unraid](/hardware/synology-vs-unraid/)
- [Best Hard Drives for NAS](/hardware/best-hard-drives-nas/)
- [DIY NAS Build Guide](/hardware/diy-nas-build/)
- [RAID Levels Explained](/hardware/raid-explained/)
- [Home Server Build Guide](/hardware/home-server-build-guide/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
