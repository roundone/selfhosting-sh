---
title: "How to Self-Host qBittorrent with Docker Compose"
description: "Complete guide to self-hosting qBittorrent with Docker Compose, including web UI, VPN integration, and download management."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "download-management"
apps:
  - qbittorrent
tags:
  - self-hosted
  - download-management
  - qbittorrent
  - docker
  - torrent
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is qBittorrent?

[qBittorrent](https://www.qbittorrent.org) is a free, open-source BitTorrent client with a built-in web UI. It's the most popular self-hosted torrent client — lightweight, feature-rich, and widely supported by the *arr stack (Sonarr, Radarr, Lidarr). qBittorrent replaces paid or ad-supported clients like uTorrent and BitTorrent, with better privacy and full control over your downloads.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 512 MB of RAM minimum
- Storage for downloads
- A VPN (strongly recommended for privacy)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  qbittorrent:
    image: lscr.io/linuxserver/qbittorrent:5.1.4
    container_name: qbittorrent
    restart: unless-stopped
    ports:
      - "8080:8080"     # Web UI
      - "6881:6881"     # Torrent traffic (TCP)
      - "6881:6881/udp" # Torrent traffic (UDP)
    environment:
      PUID: "1000"           # Your user ID (run: id -u)
      PGID: "1000"           # Your group ID (run: id -g)
      TZ: "America/New_York" # Your timezone
      WEBUI_PORT: "8080"     # Web UI port (must match ports mapping)
    volumes:
      - qbittorrent-config:/config
      - /path/to/downloads:/downloads   # CHANGE THIS to your downloads directory
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  qbittorrent-config:
```

**Important:** Replace `/path/to/downloads` with your actual downloads directory.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open the web UI at `http://your-server-ip:8080`
2. Log in with:
   - **Username:** `admin`
   - **Password:** Check container logs for the temporary password:
   ```bash
   docker logs qbittorrent 2>&1 | grep "temporary password"
   ```
3. **Change the password immediately:** Go to **Tools > Options > Web UI > Authentication**
4. Set your preferred download location under **Tools > Options > Downloads > Default Save Path** to `/downloads`

## Configuration

### Download Categories

Set up categories for organized downloads — especially useful with the *arr stack:

1. Go to **Tools > Options > Downloads**
2. Under **Default Torrent Management Mode**, select "Automatic"
3. Create categories (right-click in the left panel > **New Category**):
   - `movies` → Save path: `/downloads/movies`
   - `tv` → Save path: `/downloads/tv`
   - `music` → Save path: `/downloads/music`

### Speed Limits and Scheduling

Under **Tools > Options > Speed**:
- Set global upload/download limits
- Enable **Alternative Rate Limits** for scheduled slowdowns (e.g., business hours)
- Set a schedule under **Alternative Rate Limits > Schedule**

### Connection Settings

Under **Tools > Options > Connection**:
- **Listening port:** 6881 (default, matches Docker port mapping)
- **Max connections:** 500 (default, increase for faster connections)
- **Enable UPnP:** Disable in Docker (port mapping handles this)

### *arr Stack Integration

qBittorrent is the preferred download client for [Sonarr](/apps/sonarr/), [Radarr](/apps/radarr/), and [Lidarr](/apps/lidarr/). In each *arr app:

1. Go to **Settings > Download Clients > Add > qBittorrent**
2. Set:
   - Host: `qbittorrent` (Docker service name) or your server IP
   - Port: `8080`
   - Username: `admin`
   - Password: your password
   - Category: `tv` (for Sonarr), `movies` (for Radarr), `music` (for Lidarr)

## Advanced Configuration (Optional)

### VPN Integration with Gluetun

Route qBittorrent traffic through a VPN for privacy. Use [Gluetun](https://github.com/qdm12/gluetun) as a VPN container:

```yaml
services:
  gluetun:
    image: qmcgaw/gluetun:v3.40.0
    container_name: gluetun
    restart: unless-stopped
    cap_add:
      - NET_ADMIN
    devices:
      - /dev/net/tun:/dev/net/tun
    ports:
      - "8080:8080"     # qBittorrent Web UI (exposed via gluetun)
      - "6881:6881"
      - "6881:6881/udp"
    environment:
      VPN_SERVICE_PROVIDER: "your-vpn-provider"  # e.g., mullvad, nordvpn, pia
      VPN_TYPE: "wireguard"                       # or openvpn
      # Provider-specific credentials:
      # WIREGUARD_PRIVATE_KEY: "your-key"
      # WIREGUARD_ADDRESSES: "10.x.x.x/32"
    volumes:
      - gluetun-data:/gluetun

  qbittorrent:
    image: lscr.io/linuxserver/qbittorrent:5.1.4
    container_name: qbittorrent
    restart: unless-stopped
    network_mode: "service:gluetun"  # Route ALL traffic through VPN
    environment:
      PUID: "1000"
      PGID: "1000"
      TZ: "America/New_York"
      WEBUI_PORT: "8080"
    volumes:
      - qbittorrent-config:/config
      - /path/to/downloads:/downloads
    depends_on:
      - gluetun

volumes:
  qbittorrent-config:
  gluetun-data:
```

With `network_mode: "service:gluetun"`, all qBittorrent traffic goes through the VPN. Ports are exposed on the Gluetun container, not qBittorrent.

### Bind to VPN Interface Only

In qBittorrent web UI, go to **Tools > Options > Advanced > Network interface** and select `tun0` (WireGuard) or `tun0` (OpenVPN). This prevents any traffic leaking outside the VPN even if the tunnel drops.

## Reverse Proxy

Behind [Nginx Proxy Manager](/apps/nginx-proxy-manager/):

1. Forward your domain to `http://your-server-ip:8080`
2. In qBittorrent, go to **Tools > Options > Web UI** and add your domain to **Optional: Trusted reverse proxy headers**
3. Set `Host header validation` to your domain

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

## Backup

The `/config` volume contains qBittorrent settings, categories, and torrent resume data:

```bash
docker compose stop qbittorrent
docker run --rm \
  -v qbittorrent-config:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/qbittorrent-config-backup.tar.gz /data
docker compose start qbittorrent
```

Your downloaded files are in `/downloads` — back those up separately. See [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Web UI not accessible

**Symptom:** Cannot reach `http://server:8080`.

**Fix:**
1. Check the container is running: `docker ps | grep qbittorrent`
2. Check logs for errors: `docker logs qbittorrent`
3. If using VPN integration, check Gluetun is connected: `docker logs gluetun`
4. Verify `WEBUI_PORT` matches the port mapping

### Downloads stuck at 0%

**Symptom:** Torrents add but never start downloading.

**Fix:**
1. Check port 6881 is accessible (port forwarding or VPN port forward)
2. Verify the torrent has seeders (check the tracker tab)
3. If using VPN, ensure the VPN provider allows port forwarding
4. Check disk space: `df -h /path/to/downloads`

### "Unauthorized" error on web UI

**Symptom:** Login page shows "Unauthorized" immediately.

**Fix:** This happens when accessing via an IP not in the whitelist. Either:
1. Access via `localhost` or the container's network
2. Set `WebUI\AuthSubnetWhitelist=0.0.0.0/0` in `/config/qBittorrent/qBittorrent.conf` (less secure)
3. Use a reverse proxy that adds proper headers

### VPN kill switch not working

**Symptom:** Downloads continue when VPN disconnects.

**Fix:** Using `network_mode: "service:gluetun"` is the kill switch — if Gluetun stops, qBittorrent loses all network access. Additionally, bind to the VPN interface (`tun0`) in qBittorrent's advanced settings.

## Resource Requirements

- **RAM:** 100-200 MB idle, 300-500 MB with active downloads
- **CPU:** Low. CPU usage increases with many simultaneous connections.
- **Disk:** Minimal for the application. Storage depends entirely on your download habits.

## Frequently Asked Questions

### Is qBittorrent safe to use?

qBittorrent itself is safe — it's open source and widely audited. The safety concern is with what you download and your ISP monitoring torrent traffic. Use a VPN (see VPN integration above) for privacy.

### qBittorrent vs Transmission — which should I use?

qBittorrent has a more feature-rich web UI, better *arr stack integration, and more configuration options. [Transmission](/apps/transmission/) is simpler and lighter on resources. For most self-hosters using the *arr stack, qBittorrent is the better choice.

### Do I need port forwarding?

Not strictly, but downloads will be slower without it. Port forwarding (6881) allows other peers to connect to you directly. If using a VPN, check if your provider supports port forwarding (Mullvad, PIA do; NordVPN does not).

## Verdict

qBittorrent is the go-to torrent client for self-hosters. The web UI is clean and fully featured, the *arr stack integration is excellent, and the Docker setup is straightforward. Pair it with Gluetun for VPN protection and you have a solid, private download setup. The only reason to look elsewhere is if you want something simpler — in that case, Transmission is lighter and easier.

## Related

- [How to Self-Host Sonarr](/apps/sonarr/)
- [How to Self-Host Radarr](/apps/radarr/)
- [qBittorrent vs Transmission](/compare/qbittorrent-vs-transmission/)
- [Best Self-Hosted Download Management](/best/download-management/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
- [VPN & Remote Access](/best/vpn/)
- [Docker Networking](/foundations/docker-networking/)
