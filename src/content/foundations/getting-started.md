---
title: "How to Start Self-Hosting: Complete Beginner's Guide"
type: "foundation"
topic: "getting-started"
difficulty: "beginner"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Everything you need to know to start self-hosting. Hardware, software, and your first apps."
prerequisites: []
---

## Why Self-Host?

Self-hosting means running services on hardware you control instead of paying cloud companies. Here's why thousands of people are doing it:

- **Save money.** $10/month for Google One + $10/month for a password manager + $15/month for Plex Pass + ... adds up. A $200 mini PC replaces all of them.
- **Own your data.** Your photos, passwords, documents, and messages stay on your hardware. No one can mine them, sell them, or lock you out.
- **Learn.** Self-hosting teaches you networking, Linux, Docker, and systems administration. These are real, marketable skills.
- **No rug pulls.** Cloud services shut down, change pricing, or remove features. Your self-hosted apps work as long as you want them to.

## What You Need

### Hardware

You need a computer that stays on 24/7. Options from cheapest to most capable:

| Option | Cost | Good For |
|--------|------|----------|
| **Raspberry Pi 4/5** | $50-80 | Pi-hole, lightweight apps |
| **Used Dell OptiPlex/Lenovo Tiny** | $50-150 | Most self-hosted apps |
| **Intel N100 mini PC** | $150-250 | Best balance of power and efficiency |
| **NAS (Synology, etc.)** | $200-500+ | File storage + apps |

**Our recommendation for beginners:** An Intel N100 mini PC. ~$200, fanless, sips power (6-15W), and handles everything from Immich to Jellyfin with hardware transcoding. See our [best mini PC guide](/hardware/best-mini-pc/) for specific models.

### Software

Install a Linux distribution on your hardware:

1. **Ubuntu Server 24.04 LTS** — the most beginner-friendly option with the largest community
2. **Debian 12** — more stable, slightly less hand-holding

Then install Docker — it's how you'll run 99% of self-hosted apps.

### Network Basics

- **Give your server a static IP** on your local network (e.g., 192.168.1.100). See our [static IP guide](/foundations/static-ip/).
- **Optional: Get a domain name** if you want to access services by name instead of IP addresses.
- **Optional: Set up a reverse proxy** for HTTPS and clean URLs. See our [reverse proxy guide](/foundations/reverse-proxy/).

## Install Docker

Docker lets you run apps in isolated containers. Almost every self-hosted app provides a Docker image.

```bash
# Install Docker on Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in, then verify:
docker --version
docker compose version
```

Learn more: [Docker Compose Basics](/foundations/docker-compose-basics/)

## Your First Apps

Start with these — they're easy to set up and immediately useful:

### 1. Pi-hole (ad blocking)
Block ads on every device on your network. 10-minute setup, immediate impact.
[Pi-hole setup guide →](/apps/pihole/)

### 2. Uptime Kuma (monitoring)
Monitor your services and get alerts when something goes down. 5-minute setup.
[Uptime Kuma setup guide →](/apps/uptime-kuma/)

### 3. Vaultwarden (passwords)
Self-hosted password manager compatible with Bitwarden apps. Replace LastPass/1Password.
[Vaultwarden setup guide →](/apps/vaultwarden/)

### 4. Immich (photos)
Replace Google Photos with auto-backup from your phone.
[Immich setup guide →](/apps/immich/)

### 5. Jellyfin (media)
Stream your movies and music to any device.
[Jellyfin setup guide →](/apps/jellyfin/)

## Common Beginner Mistakes

1. **Starting too complex.** Don't try to set up Nextcloud, a reverse proxy, and SSL certificates all at once. Start with Pi-hole, get comfortable, then add more.
2. **Not backing up.** Set up backups before you need them. See our [backup strategy guide](/foundations/backup-strategy/).
3. **Exposing services to the internet without security.** Use a VPN ([WireGuard](/apps/wireguard/)) or Cloudflare Tunnel before port forwarding.
4. **Using `:latest` tags in Docker.** Pin specific version tags so updates don't break your setup unexpectedly.
5. **Not using `restart: unless-stopped`.** Without it, your containers won't restart after a reboot.

## What Next?

Once you're comfortable with the basics:

1. **Add a reverse proxy** ([Nginx Proxy Manager](/apps/nginx-proxy-manager/)) to access services over HTTPS with clean URLs.
2. **Set up remote access** with [WireGuard](/apps/wireguard/) or [Tailscale](/apps/tailscale/) to reach your services from anywhere.
3. **Explore more apps** — see our [category roundups](/best/) for the best app in every category.
4. **Manage your containers** with [Portainer](/apps/portainer/) for a visual Docker dashboard.

Welcome to self-hosting.
