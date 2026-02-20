---
title: "Raspberry Pi Docker Setup Guide"
description: "How to install and run Docker on a Raspberry Pi 5. Complete setup guide with Docker Compose, ARM64 images, and performance tips."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "hardware"
apps: []
tags: ["hardware", "raspberry-pi", "docker", "arm64", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Prerequisites

- Raspberry Pi 4 (4 GB+) or Pi 5 (recommended)
- 64-bit Raspberry Pi OS Lite installed (see our [Pi home server guide](/hardware/raspberry-pi-home-server))
- NVMe SSD via HAT or USB SSD (avoid microSD for Docker)
- SSH access to your Pi

**Important:** You must be running **64-bit** Raspberry Pi OS. 32-bit will not work with most Docker images. Verify:

```bash
uname -m
# Should output: aarch64
```

If it shows `armv7l`, you're on 32-bit. Reflash with Raspberry Pi OS Lite (64-bit).

## Install Docker

The official convenience script is the easiest method:

```bash
curl -fsSL https://get.docker.com | sh
```

Add your user to the Docker group (avoids needing `sudo` for every Docker command):

```bash
sudo usermod -aG docker $USER
```

Log out and back in for the group change to take effect, then verify:

```bash
docker version
docker compose version
```

Both should show version information. Docker Compose v2 is included automatically.

## ARM64 Image Compatibility

The Pi runs ARM64 (aarch64) architecture. Most popular self-hosted apps publish multi-arch Docker images that include ARM64 builds. When you `docker pull`, Docker automatically selects the correct architecture.

### Guaranteed ARM64 Support

These apps publish official ARM64 images:

- [Pi-hole](/apps/pi-hole) — `pihole/pihole`
- [AdGuard Home](/apps/adguard-home) — `adguard/adguardhome`
- [Home Assistant](/apps/home-assistant) — `ghcr.io/home-assistant/home-assistant`
- [Vaultwarden](/apps/vaultwarden) — `vaultwarden/server`
- [Nextcloud](/apps/nextcloud) — `nextcloud`
- [Uptime Kuma](/apps/uptime-kuma) — `louislam/uptime-kuma`
- [Jellyfin](/apps/jellyfin) — `jellyfin/jellyfin`
- [FreshRSS](/apps/freshrss) — `freshrss/freshrss`
- [Syncthing](/apps/syncthing) — `syncthing/syncthing`
- [Traefik](/apps/traefik) — `traefik`
- [Caddy](/apps/caddy) — `caddy`
- [Gitea](/apps/gitea) / Forgejo — `gitea/gitea`
- [Paperless-ngx](/apps/paperless-ngx) — `ghcr.io/paperless-ngx/paperless-ngx`
- PostgreSQL, MariaDB, Redis, Nginx — all official images support ARM64

**LinuxServer.io images** are a safe bet — LSIO builds all their images for ARM64.

### Checking Image Compatibility

Before pulling an image, check if it supports ARM64:

```bash
docker manifest inspect <image>:<tag> | grep architecture
# Look for "arm64" in the output
```

Or check Docker Hub — the image page shows supported architectures under "OS/ARCH".

### If an Image Doesn't Support ARM64

You have three options:

1. **Find an alternative image.** Search Docker Hub for `<app-name> arm64` — community builds often exist.
2. **Build from source.** If the app provides a Dockerfile, clone the repo and build locally:
   ```bash
   git clone https://github.com/org/app.git
   cd app
   docker build -t app:local .
   ```
3. **QEMU emulation.** Docker can run x86 images on ARM via QEMU, but performance drops 5-10x. Not viable for production:
   ```bash
   docker run --platform linux/amd64 <x86-only-image>
   ```

## Docker Compose Example

Create a project directory and a `docker-compose.yml`:

```bash
mkdir -p ~/docker && cd ~/docker
```

Example stack for a Pi-based home server:

```yaml
services:
  pihole:
    image: pihole/pihole:2025.03.0
    container_name: pihole
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "8080:80/tcp"
    environment:
      TZ: "America/New_York"
      WEBPASSWORD: "changeme"
    volumes:
      - pihole_data:/etc/pihole
      - pihole_dnsmasq:/etc/dnsmasq.d
    restart: unless-stopped

  vaultwarden:
    image: vaultwarden/server:1.32.7
    container_name: vaultwarden
    ports:
      - "8081:80"
    environment:
      DOMAIN: "https://vault.yourdomain.com"
    volumes:
      - vaultwarden_data:/data
    restart: unless-stopped

  uptime-kuma:
    image: louislam/uptime-kuma:1.23.16
    container_name: uptime-kuma
    ports:
      - "3001:3001"
    volumes:
      - uptime_kuma_data:/app/data
    restart: unless-stopped

volumes:
  pihole_data:
  pihole_dnsmasq:
  vaultwarden_data:
  uptime_kuma_data:
```

Start the stack:

```bash
docker compose up -d
```

Check status:

```bash
docker compose ps
```

## Performance Tips

### 1. Use NVMe or USB SSD Storage

Docker's overlay2 filesystem generates heavy random I/O. On microSD, container startup takes 5-15 seconds. On NVMe, it takes 1-2 seconds. See the storage section in our [Pi home server guide](/hardware/raspberry-pi-home-server).

### 2. Use Active Cooling

Docker containers under load will push the Pi 5's CPU to sustained workloads. Without active cooling, the CPU throttles from 2.4 GHz to ~1.8 GHz. An active cooler ($5-10) or the official Pi 5 fan maintains full performance.

### 3. Limit Container Resource Usage

On a 4-8 GB RAM system, set memory limits to prevent one container from starving others:

```yaml
services:
  nextcloud:
    image: nextcloud:30.0.6
    deploy:
      resources:
        limits:
          memory: 1G
```

### 4. Use `tmpfs` for Temporary Data

Mount `/tmp` as tmpfs in containers that write heavy temporary data (build tools, transcoding). This keeps temporary writes in RAM instead of wearing the SSD:

```yaml
services:
  app:
    tmpfs:
      - /tmp
```

### 5. Monitor Resources

Install `ctop` for a real-time container resource monitor:

```bash
docker run --rm -ti \
  --name ctop \
  -v /var/run/docker.sock:/var/run/docker.sock \
  quay.io/vektorlab/ctop:latest
```

Or use `docker stats` for a quick overview:

```bash
docker stats --no-stream
```

## Automatic Container Updates

Use Watchtower to automatically update containers when new images are published:

```yaml
services:
  watchtower:
    image: containrrr/watchtower:1.7.1
    container_name: watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      WATCHTOWER_CLEANUP: "true"
      WATCHTOWER_SCHEDULE: "0 0 4 * * *"  # Check at 4 AM daily
    restart: unless-stopped
```

**Caution:** Watchtower updates ALL containers automatically. For production setups, prefer manual updates or pin image versions and update deliberately.

## Troubleshooting

### "no matching manifest for linux/arm64"

The image doesn't support ARM64. Find an alternative image, build from source, or skip this app. Don't use QEMU emulation for production.

### Container runs out of memory

Check current usage with `docker stats`. Add memory limits. Consider upgrading to a [mini PC](/hardware/best-mini-pc) with 16 GB RAM if you consistently need more than 6 GB for containers.

### Docker Compose command not found

You may have Docker Compose v1 (`docker-compose`) instead of v2 (`docker compose`). Reinstall Docker using the official script to get v2.

### Slow container startup

Almost always a storage issue. microSD is too slow for Docker. Move to NVMe SSD. Verify:

```bash
# Test random write speed
fio --name=test --rw=randwrite --bs=4k --size=100M --numjobs=1 --runtime=10
# NVMe: 50,000+ IOPS
# microSD: 1,000-3,000 IOPS
```

## FAQ

### Can I run Docker on a Raspberry Pi 3?

Technically yes (64-bit OS required), but with only 1 GB RAM and a much slower CPU, it's limited to 1-2 very lightweight containers. Not recommended for self-hosting. Get at least a Pi 4 with 4 GB.

### Docker on Pi vs Docker on mini PC — what's different?

Architecture (ARM64 vs x86_64) affects image compatibility. Performance is lower on the Pi (fewer IOPS, less RAM, slower CPU). Docker commands and Compose files are identical. See our [Pi vs Mini PC comparison](/hardware/raspberry-pi-vs-mini-pc).

### Should I use Portainer or Dockge on a Pi?

Both work on ARM64. [Dockge](/apps/dockge) is lighter (~50 MB RAM) and manages Docker Compose files directly. [Portainer](/apps/portainer) is more feature-rich (~150 MB RAM). On a RAM-limited Pi, Dockge is the better choice.

## Related

- [Raspberry Pi as a Home Server](/hardware/raspberry-pi-home-server)
- [Raspberry Pi vs Mini PC](/hardware/raspberry-pi-vs-mini-pc)
- [Best Mini PCs for Home Servers](/hardware/best-mini-pc)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Home Server Power Consumption Guide](/hardware/power-consumption-guide)
- [Getting Started with Self-Hosting](/foundations/getting-started)
