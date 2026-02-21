---
title: "Getting Started with Self-Hosting"
description: "Everything you need to start self-hosting — hardware, software, your first app, and the mindset shift from cloud to self-hosted."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "getting-started", "self-hosting", "beginners"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Self-Host?

You are paying monthly fees for services you could run yourself on hardware you already own. Google One storage is $30/year for 100 GB, $100/year for 2 TB. iCloud runs $36-$130/year. 1Password costs $36/year per person. A family of four on these services spends $300-$500/year before you add Spotify, cloud backups, or a VPN.

A single mini PC running in a closet replaces all of them for a one-time cost of $150-$300 plus a few dollars a month in electricity. After the first year, you are saving money every month with no cap on storage, no price increases, and no terms of service changes.

But cost is only one reason. Self-hosting gives you three things cloud services never will:

**Privacy.** Your photos, passwords, documents, and browsing data stay on hardware you physically control. No scanning, no training AI models on your data, no third-party access.

**Control.** No service can shut down, change its pricing, or remove features you depend on. Your data is in standard formats on your own disks.

**Understanding.** Running your own infrastructure teaches you how the internet actually works. That knowledge compounds every time you deploy a new service.

## What You Need

### Hardware

You do not need a rack-mounted server or a dedicated homelab room. Self-hosting runs on surprisingly modest hardware.

**Your options, from cheapest to best:**

| Hardware | Cost | Pros | Cons |
|----------|------|------|------|
| Old laptop or desktop | $0 (already own it) | Free, good enough to start | Power hungry, loud, may die soon |
| Raspberry Pi 4/5 | $60-$100 | Tiny, silent, low power | ARM architecture limits some apps, slow storage |
| Intel N100 mini PC | $150-$250 | Silent, 6W idle, x86 compatible, fast enough for 20+ containers | No ECC RAM, limited expansion |
| Used Dell/Lenovo micro PC | $80-$150 | Cheap, x86, widely available | Older CPUs, higher idle power than N100 |
| NAS (Synology, etc.) | $300-$800 | Built for storage, runs Docker | Expensive, proprietary OS, weaker CPU |
| Dedicated server | $500+ | Maximum performance | Overkill for most people, loud, power hungry |

**The recommendation:** An Intel N100 mini PC is the best starting point for most people. It draws 6-10W at idle (roughly $1/month in electricity), runs silent, supports every Docker container you will want, and has enough power for 20+ services simultaneously. Pair it with a 1 TB SSD for the OS and apps, plus an external USB drive or NAS for media storage if needed. See our [hardware guide](/hardware/best-mini-pc/) for specific models.

If you just want to experiment before spending money, use any old computer you have. A 10-year-old laptop with 8 GB of RAM and an SSD runs self-hosted apps perfectly well.

### Software

You need three things installed on your server:

**1. Linux.** Use Ubuntu Server 24.04 LTS. It has the largest community, the most tutorials, and five years of security updates. Do not use a desktop version -- a server has no GUI overhead, and you will manage it over SSH. If you are new to Linux, read our [Linux basics guide](/foundations/linux-basics-self-hosting/).

**2. Docker.** Every self-hosted app in this guide runs in a Docker container. Containers isolate apps from each other and from the host system, making installs clean, updates simple, and removal trivial. Install Docker Engine using the official instructions for Ubuntu.

**3. Docker Compose.** Compose lets you define multi-container applications in a single YAML file. You will use it for every app you deploy. It is included with Docker Engine as of Docker 24+. Read our [Docker Compose Basics](/foundations/docker-compose-basics/) guide for a thorough introduction.

### Network

Your server needs a stable local IP address and, optionally, a way to access services from outside your home.

**Static IP or DHCP reservation.** Log into your router and either assign a static IP to your server or create a DHCP reservation. This prevents the server's IP from changing, which would break bookmarks and DNS records.

**Port forwarding.** If you want to access services remotely, you need to forward ports 80 and 443 from your router to your server. This is only necessary for services you want available outside your home. Many people start with local-only access and add remote access later.

**Domain name.** A domain ($10-$15/year) is optional but highly recommended. It gives you clean URLs like `photos.yourdomain.com` instead of `192.168.1.50:2283`, and it is required for HTTPS certificates. Cloudflare is the best registrar for self-hosters -- free DNS, free proxy, and Cloudflare Tunnels for secure remote access without port forwarding.

**Reverse proxy.** Once you run multiple services, a reverse proxy routes traffic to the right container based on the domain name. We cover this in detail in our [reverse proxy guide](/foundations/reverse-proxy-explained/).

## Your First Self-Hosted App

Start with [Pi-hole](/apps/pi-hole/). It is the perfect first app because:

- **Immediately useful.** It blocks ads and trackers across every device on your network -- phones, tablets, smart TVs, everything -- without installing anything on those devices.
- **Simple to deploy.** A single container, minimal configuration, works out of the box.
- **Low resources.** Uses roughly 50 MB of RAM and negligible CPU.
- **Visible results.** Within minutes of setup, you see ads disappearing from websites and your Pi-hole dashboard shows exactly how many queries it is blocking. That feedback loop is motivating.

The concept is straightforward: Pi-hole acts as a DNS server. You point your router's DNS settings at your server's IP, and Pi-hole intercepts DNS queries, blocking known ad and tracking domains before they load. No browser extensions, no per-device configuration.

Once Pi-hole is running and you have experienced the satisfaction of deploying your own infrastructure, you are ready for more.

**Great second apps:**

- [Vaultwarden](/apps/vaultwarden/) -- a self-hosted password manager compatible with Bitwarden clients. Replaces a $36/year 1Password or Bitwarden subscription. Your passwords live on your hardware.
- [Immich](/apps/immich/) -- a Google Photos replacement with automatic mobile backup, face recognition, and search. This is the app that convinces most people self-hosting is worth it. See our [photo management roundup](/best/photo-management/) for alternatives.
- [Jellyfin](/apps/jellyfin/) -- a free media server for your movies, TV shows, and music. Works on every device. No subscription, no library limits, no ads.

## The Self-Hosting Mindset

When you self-host, you become the sysadmin. That comes with responsibilities you did not have as a cloud customer.

**Backups are your problem now.** If your drive dies, your data is gone unless you have backups. Follow the 3-2-1 rule: three copies, two different media types, one offsite. This is non-negotiable for any data you care about. Read our [backup strategy guide](/foundations/backup-3-2-1-rule/) before you put anything important on your server.

**Security is your problem now.** An internet-exposed server without basic hardening is a target. At minimum: disable password SSH login and use keys only (see our [SSH setup guide](/foundations/ssh-setup/)), enable a firewall (see our [UFW guide](/foundations/firewall-ufw/)), and keep your system updated. These three steps block the vast majority of attacks.

**Updates are your problem now.** Docker makes this easier -- `docker compose pull && docker compose up -d` updates most apps -- but you still need to check changelogs for breaking changes before updating. Pin your image versions to specific tags so you control when updates happen.

**Uptime is your problem now.** Your server will occasionally go offline. Power outages, failed drives, botched updates. For personal services, this is a minor inconvenience. For services shared with family, set expectations and invest in a UPS.

This sounds like a lot. It is not, once you build habits. A well-configured server needs 15 minutes a week of maintenance. And the skills you build transfer to every technical endeavor you pursue.

## Essential Skills to Learn

Self-hosting draws on a handful of core skills. You do not need to master them all before starting -- learn as you go -- but knowing what to study gives you direction.

**Linux command line.** Navigating directories, editing files, managing services, reading logs. You do not need to be a Linux expert, but you need to be comfortable in a terminal. Our [Linux basics guide](/foundations/linux-basics-self-hosting/) covers everything you need.

**Docker and Docker Compose.** Understanding images, containers, volumes, and networks is essential. Every app you deploy uses Docker. Start with our [Docker Compose Basics](/foundations/docker-compose-basics/) guide, then learn about [Docker networking](/foundations/docker-networking/) and [Docker volumes](/foundations/docker-volumes/) as you add more services.

**Networking fundamentals.** Ports, DNS, DHCP, and subnets. You need to understand what a port is, how DNS resolution works, and how devices find each other on a network. Most self-hosting problems are networking problems.

**Reverse proxies.** Once you run multiple services, a reverse proxy is essential for routing traffic and managing SSL certificates. Read our [reverse proxy guide](/foundations/reverse-proxy-explained/).

**Backup strategies.** Knowing how to back up your data and, more importantly, how to restore it. Our [backup guide](/foundations/backup-3-2-1-rule/) covers this thoroughly.

## Common Mistakes Beginners Make

**Using `:latest` Docker image tags.** Pin to specific versions like `v1.99.0`. The `:latest` tag can pull a breaking update without warning, and you will have no idea what version you were running before.

**No backups until it is too late.** Set up backups before you store anything you care about. Not after. Not "next weekend." Before.

**Exposing services to the internet without a reverse proxy or firewall.** Running apps on open ports with no authentication is asking for trouble. Use a reverse proxy with HTTPS, and only expose what you need to.

**Running everything as root.** Create a non-root user for daily operations. Use `sudo` when needed. Root access means one typo can destroy your system.

**Overcomplicating the first setup.** Start with one app. Get it working. Then add another. Do not try to deploy 15 services on day one. You will get frustrated debugging multiple broken things at once.

**Ignoring log files.** When something breaks, the answer is almost always in the logs. Run `docker compose logs -f [service]` to watch a container's output in real time. Read the logs before asking for help.

**Skipping the documentation.** Most self-hosted apps have solid documentation. Read the README, check the example `docker-compose.yml`, and look at the `.env.example` file before deploying. Five minutes of reading saves an hour of debugging.

## What to Self-Host First

This order is deliberate. Each app builds on skills from the previous one.

**Tier 1: Start here**
- [Pi-hole](/apps/pi-hole/) -- network-wide ad blocking. Teaches you DNS concepts, Docker basics, and how container networking works. One container, minimal config.

**Tier 2: Add after a week**
- [Vaultwarden](/apps/vaultwarden/) -- password manager. Introduces HTTPS requirements (passwords must be encrypted in transit), reverse proxy configuration, and the importance of backups. Two containers (app + database).

**Tier 3: Add when comfortable**
- [Immich](/apps/immich/) -- photo management. A multi-container stack (app server, microservices, database, Redis, machine learning). Teaches you Docker Compose at scale, volume management, and resource monitoring. Or [Jellyfin](/apps/jellyfin/) if media streaming is more useful to you.

This progression works because each tier introduces new concepts while building on what you already know. By the time you deploy Immich, Docker Compose files with five services feel manageable instead of intimidating.

## Next Steps

You have the overview. Here is the concrete path forward:

1. **Get hardware.** Use what you have or buy an [N100 mini PC](/hardware/best-mini-pc/).
2. **Install Ubuntu Server 24.04 LTS** and configure [SSH access](/foundations/ssh-setup/).
3. **Harden the basics.** Set up [UFW firewall](/foundations/firewall-ufw/) and disable password authentication.
4. **Install Docker** and read [Docker Compose Basics](/foundations/docker-compose-basics/).
5. **Deploy Pi-hole.** Follow our [Pi-hole guide](/apps/pi-hole/).
6. **Set up backups.** Read the [3-2-1 backup strategy](/foundations/backup-3-2-1-rule/) and implement it before adding more services.
7. **Add more apps.** Work through the tier 2 and tier 3 recommendations above.

Every guide on this site assumes you have completed steps 1 through 4. Start there, and everything else follows.

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)
- [Docker Networking](/foundations/docker-networking/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [SSH Setup](/foundations/ssh-setup/)
- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/)
- [Firewall Setup with UFW](/foundations/firewall-ufw/)
- [How to Self-Host Pi-hole](/apps/pi-hole/)
- [How to Self-Host Vaultwarden](/apps/vaultwarden/)
- [How to Self-Host Immich](/apps/immich/)
- [How to Self-Host Jellyfin](/apps/jellyfin/)
- [Best Self-Hosted Photo Management](/best/photo-management/)
- [Best Mini PCs for Self-Hosting](/hardware/best-mini-pc/)
