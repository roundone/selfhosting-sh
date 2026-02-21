---
title: "How to Self-Host Transmission with Docker"
description: "Set up Transmission BitTorrent client with Docker Compose — lightweight, clean web UI, and easy integration with Sonarr and Radarr."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "download-management"
apps:
  - transmission
tags:
  - self-hosted
  - transmission
  - docker
  - bittorrent
  - download-management
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Transmission?

[Transmission](https://transmissionbt.com) is a lightweight, open-source BitTorrent client known for its minimal resource footprint and clean interface. It replaces bloated desktop torrent clients like uTorrent and BitTorrent with a self-hosted web UI you can access from any browser. Transmission focuses on doing one thing well — downloading torrents — without the feature bloat that heavier clients carry.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 256 MB of free RAM (minimum)
- Storage for downloads
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  transmission:
    image: lscr.io/linuxserver/transmission:4.0.6
    container_name: transmission
    restart: unless-stopped
    ports:
      - "9091:9091"       # Web UI
      - "51413:51413"     # Peer connections (TCP)
      - "51413:51413/udp" # Peer connections (UDP)
    environment:
      PUID: ${PUID:-1000}             # Your user ID (run: id -u)
      PGID: ${PGID:-1000}             # Your group ID (run: id -g)
      TZ: ${TZ:-America/New_York}     # Your timezone
      PEERPORT: "51413"               # Must match the port mapping above
      USER: ${TRANSMISSION_USER}      # Web UI username (set in .env)
      PASS: ${TRANSMISSION_PASS}      # Web UI password (set in .env)
    volumes:
      - transmission-config:/config           # Settings, resume data, stats
      - ${DOWNLOAD_DIR:-/srv/downloads}:/downloads  # Completed and in-progress downloads
      - ${WATCH_DIR:-/srv/watch}:/watch       # Drop .torrent files here to auto-add
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9091/transmission/web/"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  transmission-config:
```

Create a `.env` file alongside it:

```bash
# User/Group IDs — run 'id' to find yours
PUID=1000
PGID=1000

# Timezone — find yours at https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
TZ=America/New_York

# Web UI credentials — CHANGE THESE
TRANSMISSION_USER=admin
TRANSMISSION_PASS=change-me-to-a-strong-password

# Download directory on the host — CHANGE THIS
DOWNLOAD_DIR=/srv/downloads

# Watch directory — drop .torrent files here to auto-add them
WATCH_DIR=/srv/watch
```

Create the host directories and start the stack:

```bash
sudo mkdir -p /srv/downloads /srv/watch
sudo chown 1000:1000 /srv/downloads /srv/watch
docker compose up -d
```

## Initial Setup

1. Open the web UI at `http://your-server-ip:9091`
2. Log in with the username and password you set in `.env`
3. The default web UI is functional but minimal — you can swap it out for a better one (see Advanced Configuration below)
4. Test by adding a torrent: click the **Open Torrent** button (folder icon) or paste a magnet link

The `/watch` directory is pre-configured as a watch folder. Drop any `.torrent` file into `/srv/watch` on the host and Transmission picks it up automatically.

## Configuration

### Download Paths

Transmission uses three internal directories by default:

| Path | Purpose |
|------|---------|
| `/downloads/complete` | Finished downloads |
| `/downloads/incomplete` | In-progress downloads |
| `/watch` | Watch folder for auto-adding .torrent files |

To customize, edit `/config/settings.json` while the container is stopped:

```bash
docker compose stop transmission
```

Key fields in `settings.json`:

```json
{
  "download-dir": "/downloads/complete",
  "incomplete-dir": "/downloads/incomplete",
  "incomplete-dir-enabled": true,
  "watch-dir": "/watch",
  "watch-dir-enabled": true
}
```

Start the container again after editing:

```bash
docker compose start transmission
```

**Important:** Always stop Transmission before editing `settings.json`. The running process overwrites the file on shutdown, discarding your changes.

### Speed Limits

Configure speed limits in `settings.json` or through the web UI:

```json
{
  "speed-limit-down": 10000,
  "speed-limit-down-enabled": false,
  "speed-limit-up": 500,
  "speed-limit-up-enabled": true,
  "alt-speed-enabled": false,
  "alt-speed-down": 2000,
  "alt-speed-up": 200,
  "alt-speed-time-enabled": true,
  "alt-speed-time-begin": 540,
  "alt-speed-time-end": 1020,
  "alt-speed-time-day": 62
}
```

- `speed-limit-*`: Global limits in KB/s
- `alt-speed-*`: "Turtle mode" limits, useful for scheduling slower speeds during work hours
- `alt-speed-time-begin`/`end`: Minutes from midnight (540 = 9:00 AM, 1020 = 5:00 PM)
- `alt-speed-time-day`: Bitmask for days (62 = Monday through Friday)

### Authentication

Authentication is set via the `USER` and `PASS` environment variables. To restrict access further, use these optional environment variables in your `docker-compose.yml`:

```yaml
environment:
  WHITELIST: "192.168.1.*,10.0.0.*"      # IP whitelist (comma-separated)
  HOST_WHITELIST: "transmission.example.com"  # Hostname whitelist for reverse proxy
```

If you lock yourself out, stop the container and edit `/config/settings.json`:

```json
{
  "rpc-authentication-required": false
}
```

Start the container, log in, set a new password, then re-enable authentication.

### Peer Connection Settings

In `settings.json`:

```json
{
  "peer-port": 51413,
  "peer-port-random-on-start": false,
  "peer-limit-global": 200,
  "peer-limit-per-torrent": 50,
  "encryption": 1,
  "dht-enabled": true,
  "pex-enabled": true,
  "lpd-enabled": false
}
```

- `encryption`: 0 = prefer unencrypted, 1 = prefer encrypted, 2 = require encrypted
- `dht-enabled`: Distributed hash table for finding peers without trackers
- `pex-enabled`: Peer exchange — learn about new peers from connected peers

## Advanced Configuration (Optional)

### Alternative Web UIs

Transmission's built-in web UI is basic. Swap it for a modern interface by setting the `TRANSMISSION_WEB_HOME` environment variable.

**Flood for Transmission** (recommended):

```yaml
environment:
  TRANSMISSION_WEB_HOME: /flood-for-transmission/
```

The LinuxServer.io image bundles Flood automatically. Set the environment variable and restart:

```bash
docker compose up -d
```

Flood gives you a modern, responsive UI with better sorting, filtering, and a cleaner layout. Other options include Combustion (`/combustion-release/`) and Kettu (`/kettu/`), but Flood is the most actively maintained.

### Connecting to Sonarr and Radarr

Transmission integrates directly with the *arr stack as a download client.

In [Sonarr](/apps/sonarr/) or [Radarr](/apps/radarr/):

1. Go to **Settings > Download Clients > Add > Transmission**
2. Configure:
   - **Host:** `transmission` (if on the same Docker network) or your server IP
   - **Port:** `9091`
   - **Username:** your `USER` value from `.env`
   - **Password:** your `PASS` value from `.env`
   - **Category:** `tv` (Sonarr) or `movies` (Radarr)
   - **Directory:** Leave blank to use default, or set `/downloads/complete/tv` for Sonarr, `/downloads/complete/movies` for Radarr
3. Click **Test** to verify the connection, then **Save**

For category-based sorting, create subdirectories on the host:

```bash
mkdir -p /srv/downloads/complete/tv /srv/downloads/complete/movies
```

If [Prowlarr](/apps/prowlarr/) manages your indexers, it syncs them to Sonarr and Radarr automatically — no manual indexer setup needed in each app.

### VPN Integration

For privacy, route Transmission traffic through a VPN using [Gluetun](https://github.com/qdm12/gluetun):

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
      - "9091:9091"       # Transmission Web UI (exposed via Gluetun)
      - "51413:51413"
      - "51413:51413/udp"
    environment:
      VPN_SERVICE_PROVIDER: "mullvad"    # Your VPN provider
      VPN_TYPE: "wireguard"
      # WIREGUARD_PRIVATE_KEY: "your-key"
      # WIREGUARD_ADDRESSES: "10.x.x.x/32"
    volumes:
      - gluetun-data:/gluetun

  transmission:
    image: lscr.io/linuxserver/transmission:4.0.6
    container_name: transmission
    restart: unless-stopped
    network_mode: "service:gluetun"   # All traffic routes through VPN
    depends_on:
      - gluetun
    environment:
      PUID: "1000"
      PGID: "1000"
      TZ: "America/New_York"
      PEERPORT: "51413"
      USER: "admin"
      PASS: "change-me-to-a-strong-password"
    volumes:
      - transmission-config:/config
      - /srv/downloads:/downloads
      - /srv/watch:/watch

volumes:
  transmission-config:
  gluetun-data:
```

With `network_mode: "service:gluetun"`, all Transmission traffic goes through the VPN tunnel. If the VPN drops, Transmission loses all network access — this is your kill switch. Ports are exposed on the Gluetun container, not on Transmission.

### Blocklists

Transmission supports IP blocklists to block known bad peers. In `settings.json`:

```json
{
  "blocklist-enabled": true,
  "blocklist-url": "https://github.com/Naunter/BT_BlockLists/raw/master/bt_blocklists.gz"
}
```

Transmission downloads and applies the blocklist automatically. Update it periodically through the web UI or by restarting the container.

## Reverse Proxy

Behind [Nginx Proxy Manager](/apps/nginx-proxy-manager/) or another reverse proxy, forward your domain to `http://your-server-ip:9091`.

Add your domain to the `HOST_WHITELIST` environment variable:

```yaml
environment:
  HOST_WHITELIST: "transmission.example.com"
```

For Caddy, a minimal config:

```
transmission.example.com {
    reverse_proxy localhost:9091
}
```

Transmission requires the `X-Forwarded-Host` header to be passed correctly. Most reverse proxies handle this by default.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for full configuration guides.

## Backup

The `/config` volume contains Transmission settings, torrent resume data, and statistics. Back it up:

```bash
docker compose stop transmission
docker run --rm \
  -v transmission-config:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/transmission-config-backup.tar.gz /data
docker compose start transmission
```

To restore:

```bash
docker compose stop transmission
docker run --rm \
  -v transmission-config:/data \
  -v $(pwd):/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/transmission-config-backup.tar.gz -C /"
docker compose start transmission
```

Your downloaded files in `/srv/downloads` should be backed up separately. See [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Web UI returns "403: Forbidden"

**Symptom:** Browsing to `http://server:9091` returns a 403 error.

**Fix:** Transmission blocks connections from IPs not in its whitelist when accessed via a hostname. Either:
1. Access by IP address directly instead of hostname
2. Add your hostname to `HOST_WHITELIST` in the environment variables
3. Stop the container and set `"rpc-host-whitelist-enabled": false` in `/config/settings.json` (less secure)

### Downloads stuck at 0% with no peers

**Symptom:** Torrents are added but show 0 peers and never start.

**Fix:**
1. Verify port 51413 is forwarded to your server (check with a port checker tool)
2. Check that `PEERPORT` in your environment matches your port mapping
3. If using a VPN, confirm your provider supports port forwarding and the port is active
4. Enable DHT and PEX in settings if disabled — these help find peers without trackers
5. Check disk space: `df -h /srv/downloads`

### Settings changes not persisting

**Symptom:** You edit `settings.json` but changes revert after restart.

**Fix:** Transmission writes its in-memory settings to `settings.json` on shutdown. If you edit the file while the container is running, your changes are overwritten. Always:
1. Stop the container: `docker compose stop transmission`
2. Edit the file
3. Start the container: `docker compose start transmission`

### Permission denied errors on downloads

**Symptom:** Torrents fail with "Permission denied" or downloaded files are owned by root.

**Fix:**
1. Verify `PUID` and `PGID` match the owner of your download directory: `ls -la /srv/downloads`
2. Fix ownership: `sudo chown -R 1000:1000 /srv/downloads`
3. Ensure the download directory exists and is writable before starting the container

### Watch folder not picking up .torrent files

**Symptom:** Dropping `.torrent` files into `/srv/watch` does nothing.

**Fix:**
1. Confirm the volume mount is correct: `docker inspect transmission | grep watch`
2. Check that the watch directory is enabled in `settings.json`: `"watch-dir-enabled": true`
3. Verify file permissions: the `PUID`/`PGID` user must be able to read files in the watch directory
4. Check logs for errors: `docker logs transmission | grep watch`

## Resource Requirements

- **RAM:** 50-100 MB idle, 150-300 MB with active downloads
- **CPU:** Very low. Transmission is one of the lightest torrent clients available.
- **Disk:** ~20 MB for the application. Storage depends entirely on your download volume.

Transmission is measurably lighter than [qBittorrent](/apps/qbittorrent/) — expect roughly half the memory usage at idle. This makes it a strong choice for low-resource servers like a Raspberry Pi.

## Verdict

Transmission is the best torrent client for self-hosters who want something lightweight and reliable. It does exactly what a torrent client should — downloads torrents efficiently with minimal resource overhead. The built-in web UI is basic but functional, and swapping in Flood makes it genuinely good-looking.

The trade-off versus [qBittorrent](/apps/qbittorrent/) is feature depth. qBittorrent has a richer web UI out of the box, more granular configuration options, and slightly better *arr stack integration (category management, sequential downloading). If you are running a full *arr stack and want maximum control, qBittorrent is the better pick. If you want something simpler, lighter, and just as reliable for basic downloading, Transmission is the way to go.

For a complete download setup, pair Transmission with [Sonarr](/apps/sonarr/) for TV, [Radarr](/apps/radarr/) for movies, and [Prowlarr](/apps/prowlarr/) for indexer management.

## Related

- [How to Self-Host qBittorrent](/apps/qbittorrent/)
- [How to Self-Host Sonarr](/apps/sonarr/)
- [How to Self-Host Radarr](/apps/radarr/)
- [How to Self-Host Prowlarr](/apps/prowlarr/)
- [Sonarr vs Radarr](/compare/sonarr-vs-radarr/)
- [Best Self-Hosted Download Management](/best/download-management/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
- [Docker Networking](/foundations/docker-networking/)
