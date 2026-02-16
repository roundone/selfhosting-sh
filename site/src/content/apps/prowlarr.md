---
title: "How to Self-Host Prowlarr with Docker"
description: "Deploy Prowlarr with Docker Compose as a centralized indexer manager for Sonarr, Radarr, and the complete arr stack."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "download-management"
apps:
  - prowlarr
tags:
  - docker
  - arr-stack
  - indexer
  - usenet
  - torrents
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Prowlarr?

Prowlarr is a centralized indexer manager that integrates with the entire *arr stack — [Sonarr](/apps/sonarr), [Radarr](/apps/radarr), Lidarr, Readarr, and more. Instead of manually adding and maintaining indexers in each application separately, you configure them once in Prowlarr and it syncs everything automatically. It supports both torrent trackers and Usenet indexers. [Official site](https://prowlarr.com/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 500 MB of free disk space
- 256 MB of RAM (minimum)
- At least one *arr app to connect to, such as [Sonarr](/apps/sonarr) or [Radarr](/apps/radarr)
- Indexer accounts (public or private torrent trackers, Usenet indexers, or both)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  prowlarr:
    image: lscr.io/linuxserver/prowlarr:2.3.0.5236
    container_name: prowlarr
    environment:
      - PUID=1000          # Your user ID (run `id -u` to find it)
      - PGID=1000          # Your group ID (run `id -g` to find it)
      - TZ=America/New_York # Your timezone (find yours: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
    volumes:
      - prowlarr_config:/config  # Prowlarr database, settings, and logs
    ports:
      - "9696:9696"              # Web UI
    restart: unless-stopped

volumes:
  prowlarr_config:
    driver: local
```

Start the stack:

```bash
docker compose up -d
```

Prowlarr's web UI is now available at `http://your-server-ip:9696`.

## Initial Setup

### 1. Set Up Authentication

On first launch, Prowlarr requires you to configure authentication. Navigate to **Settings > General > Security** and set:

- **Authentication Method:** Forms (Login Page)
- **Username:** Choose a username
- **Password:** Choose a strong password

Save and restart the container if prompted.

### 2. Add Indexers

Go to **Indexers > Add Indexer**. Prowlarr ships with definitions for hundreds of public and private indexers. Search for your preferred indexer by name and click it.

For each indexer, fill in the required fields:

- **Name:** A label for your reference
- **URL:** Usually pre-filled for public trackers
- **API Key / Username / Password:** Required for private trackers and Usenet indexers
- **Categories:** Which content categories to search (TV, Movies, Music, etc.)

Click **Test** to verify the connection, then **Save**.

### 3. Connect to Sonarr and Radarr

This is where Prowlarr earns its place in your stack. Go to **Settings > Apps > Add Application**.

For [Sonarr](/apps/sonarr):

- **Sync Level:** Full Sync (recommended — pushes all indexers and syncs changes automatically)
- **Prowlarr Server:** `http://prowlarr:9696` (if on the same Docker network) or `http://your-server-ip:9696`
- **Sonarr Server:** `http://sonarr:8989` (if on the same Docker network) or `http://your-server-ip:8989`
- **API Key:** Found in Sonarr under **Settings > General > API Key**

For [Radarr](/apps/radarr):

- **Sync Level:** Full Sync
- **Prowlarr Server:** `http://prowlarr:9696`
- **Radarr Server:** `http://radarr:7878`
- **API Key:** Found in Radarr under **Settings > General > API Key**

Click **Test** on each, then **Save**. Prowlarr immediately pushes all configured indexers to the connected apps.

### Shared Docker Network

If your *arr apps run in separate Compose files, create a shared network so they can communicate by container name:

```bash
docker network create arr-network
```

Then add this to each service's Compose file:

```yaml
services:
  prowlarr:
    # ... existing config ...
    networks:
      - arr-network

networks:
  arr-network:
    external: true
```

Do the same for Sonarr, Radarr, [qBittorrent](/apps/qbittorrent), and any other *arr stack containers.

## Configuration

### Indexer Sync Profiles

Under **Settings > Apps**, each connected application uses a **Sync Profile** that controls which indexers sync to it. The default profile pushes all indexers, but you can create custom profiles:

1. Go to **Settings > Sync Profiles > Add**
2. Name the profile (e.g., "TV Only" or "Movies Only")
3. Enable or disable specific indexer categories
4. Assign the profile to the relevant app connection

This is useful if you have indexers that only carry certain content types — no reason to push a movie-only indexer to Sonarr.

### Indexer Proxies

Under **Settings > Indexers**, you can configure proxies for indexers that require them:

- **HTTP Proxy:** For indexers behind a firewall or geo-restriction
- **Flaresolverr:** For indexers protected by Cloudflare challenges (see Advanced Configuration)
- **SOCKS5:** For routing through a VPN or tunnel

### Download Client Integration

Prowlarr can also manage download clients for manual searches. Go to **Settings > Download Clients** and add your client:

- **qBittorrent:** `http://qbittorrent:8080` with username/password
- **Transmission:** `http://transmission:9091`
- **SABnzbd:** `http://sabnzbd:8080` with API key
- **NZBGet:** `http://nzbget:6789` with username/password

This lets you grab releases directly from Prowlarr's search interface without going through Sonarr or Radarr.

### Tags

Tags let you control which indexers sync to which apps at a granular level:

1. Create a tag under **Settings > Tags** (e.g., "anime")
2. Apply the tag to specific indexers
3. Apply the same tag to the relevant app connection
4. Only indexers with matching tags sync to that app

## Advanced Configuration

### Flaresolverr Integration

Many indexer sites use Cloudflare protection. Flaresolverr acts as a proxy that solves Cloudflare challenges so Prowlarr can access these sites.

Add Flaresolverr to your `docker-compose.yml`:

```yaml
services:
  prowlarr:
    image: lscr.io/linuxserver/prowlarr:2.3.0.5236
    container_name: prowlarr
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
    volumes:
      - prowlarr_config:/config
    ports:
      - "9696:9696"
    restart: unless-stopped

  flaresolverr:
    image: ghcr.io/flaresolverr/flaresolverr:v3.3.21
    container_name: flaresolverr
    environment:
      - LOG_LEVEL=info
      - TZ=America/New_York
    ports:
      - "8191:8191"
    restart: unless-stopped

volumes:
  prowlarr_config:
    driver: local
```

Then in Prowlarr, go to **Settings > Indexers > Add Indexer Proxy > FlareSolverr** and set the host to `http://flaresolverr:8191`.

Indexers that need Cloudflare solving will automatically route through Flaresolverr.

### API Access

Prowlarr exposes a REST API for automation. Find your API key under **Settings > General > API Key**.

Example — search all indexers programmatically:

```bash
curl "http://localhost:9696/api/v1/search?query=ubuntu&type=search" \
  -H "X-Api-Key: your-api-key-here"
```

Useful API endpoints:

| Endpoint | Purpose |
|----------|---------|
| `/api/v1/indexer` | List all configured indexers |
| `/api/v1/search` | Search across indexers |
| `/api/v1/indexerstats` | Indexer performance statistics |
| `/api/v1/health` | Health check for monitoring |

### Custom Category Mappings

Some indexers use non-standard category IDs. You can override the default mappings per indexer:

1. Edit the indexer under **Indexers**
2. Scroll to **Mapped Categories**
3. Adjust which Prowlarr categories map to which indexer-specific category IDs

This is mainly needed for niche private trackers with unusual category schemes.

## Reverse Proxy

To access Prowlarr securely over HTTPS with a domain name, put it behind a reverse proxy. Prowlarr's web UI listens on port 9696.

Example Nginx location block:

```nginx
location / {
    proxy_pass http://127.0.0.1:9696;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

If using a URL base (subfolder), set it under **Settings > General > URL Base** before configuring the reverse proxy.

For full reverse proxy setup instructions, see our [Reverse Proxy guide](/foundations/reverse-proxy-explained).

## Backup

Prowlarr stores all its data in the `/config` volume:

- **prowlarr.db** — Main database (indexers, app connections, settings)
- **logs/** — Application logs
- **Backups/** — Prowlarr's built-in backup files

### Built-in Backups

Prowlarr automatically creates backups under **System > Backup**. By default it keeps 7 daily backups. You can trigger a manual backup from this page or adjust retention under **Settings > General > Backups**.

### Manual Backup

To back up the entire config volume:

```bash
docker compose stop prowlarr
tar -czf prowlarr-backup-$(date +%Y%m%d).tar.gz -C /var/lib/docker/volumes/prowlarr_config/_data .
docker compose start prowlarr
```

### Restore

To restore from a built-in backup:

1. Stop Prowlarr
2. Copy the `.zip` backup file into the config volume
3. Start Prowlarr and go to **System > Backup**
4. Click **Restore** on the backup file

For a comprehensive backup strategy, see our [Backup 3-2-1 Rule guide](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Indexer Test Fails with "Unable to connect"

**Symptom:** Adding an indexer and clicking Test returns "Unable to connect to indexer" or a timeout error.

**Fix:** Verify the indexer site is actually online by visiting it in a browser. If it is online, the issue is usually DNS or firewall-related on your server. Check that your container can resolve external DNS:

```bash
docker exec prowlarr nslookup example.com
```

If DNS resolution fails, ensure your Docker daemon has proper DNS configuration in `/etc/docker/daemon.json`:

```json
{
  "dns": ["1.1.1.1", "8.8.8.8"]
}
```

Restart Docker after changing this file.

### Indexers Not Syncing to Sonarr/Radarr

**Symptom:** You added indexers and connected Sonarr/Radarr, but no indexers appear in the connected apps.

**Fix:** Check three things in order:

1. **Sync Level** — Under **Settings > Apps**, verify the app connection uses "Full Sync," not "Disabled."
2. **API Key** — Re-enter the API key from the target app. A wrong key silently fails.
3. **Network connectivity** — If apps are in separate Docker networks, they cannot reach each other by container name. Use the shared network approach described in the Initial Setup section, or use the host IP instead.

Check **System > Tasks > Sync Indexers** and run it manually to trigger an immediate sync.

### Cloudflare-Protected Indexers Return 403

**Symptom:** Some indexers fail with HTTP 403 or "Cloudflare challenge" errors.

**Fix:** These indexers require Flaresolverr. Follow the Flaresolverr setup in the Advanced Configuration section. After adding Flaresolverr as an indexer proxy, re-test the failing indexers.

If Flaresolverr itself is having issues, check its logs:

```bash
docker logs flaresolverr
```

Common Flaresolverr issues include running out of memory (it uses a headless browser) — allocate at least 512 MB of RAM for it.

### High CPU Usage During Searches

**Symptom:** Prowlarr spikes CPU usage when running searches, especially with many indexers configured.

**Fix:** Reduce the number of simultaneous indexer queries. Under **Settings > Indexers**, check the **Maximum Simultaneous Requests** setting per indexer and lower it. Also remove any indexers you no longer use — every configured indexer gets queried on every search.

### App Connection Shows "Unable to connect" After Working Previously

**Symptom:** A previously working Sonarr or Radarr connection now shows an error.

**Fix:** The target app likely restarted and its API key or IP changed. Verify:

1. The target app is running: `docker ps | grep sonarr`
2. The API key has not changed (check in the target app's Settings)
3. The container IP has not changed (use container names instead of IPs to avoid this)

If you are using container names, ensure both containers share the same Docker network.

## Resource Requirements

- **RAM:** 150 MB idle, 300 MB during active searches (add 512 MB if running Flaresolverr)
- **CPU:** Low — spikes briefly during searches but negligible at idle
- **Disk:** Under 100 MB for application data (config, database, logs)

Prowlarr is one of the lightest apps in the *arr stack. It runs comfortably on a Raspberry Pi 4 or any low-power server.

## Verdict

Prowlarr is a must-have if you run more than one *arr app. The moment you have both [Sonarr](/apps/sonarr) and [Radarr](/apps/radarr), managing indexers individually becomes tedious — add Prowlarr and you configure each indexer exactly once. It syncs everything to all connected apps automatically, and adding a new indexer takes seconds instead of repeating the same setup across multiple services.

If you only run a single *arr app, Prowlarr is still worth it for the cleaner indexer management interface and the Flaresolverr integration. But the real payoff comes at scale: add Lidarr for music, Readarr for books, and [Bazarr](/apps/bazarr) for subtitles, and Prowlarr keeps all of them fed with indexers without any extra work.

Skip Prowlarr only if you exclusively use a single *arr app with one or two indexers that never change. Everyone else should deploy it.

## Related

- [How to Self-Host Sonarr with Docker Compose](/apps/sonarr)
- [How to Self-Host Radarr with Docker Compose](/apps/radarr)
- [How to Self-Host qBittorrent with Docker](/apps/qbittorrent)
- [How to Self-Host Bazarr with Docker](/apps/bazarr)
- [Sonarr vs Radarr](/compare/sonarr-vs-radarr)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [Docker Networking](/foundations/docker-networking)
