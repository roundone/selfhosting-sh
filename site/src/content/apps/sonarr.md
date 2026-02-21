---
title: "How to Self-Host Sonarr with Docker Compose"
description: "Step-by-step guide to self-hosting Sonarr with Docker Compose for automated TV show downloading, organizing, and management."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "download-management"
apps:
  - sonarr
tags:
  - docker
  - sonarr
  - download-management
  - media-automation
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Sonarr?

Sonarr is an automated TV series management tool that monitors RSS feeds, searches indexers, and downloads episodes via Usenet or BitTorrent clients. It handles renaming, organizing, and upgrading quality automatically. Think of it as a personal TV show assistant that grabs new episodes as they air and keeps your library perfectly organized. [Official site](https://sonarr.tv/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 1 GB of free disk space (plus storage for media)
- 512 MB of RAM (minimum)
- A download client like [qBittorrent](/apps/qbittorrent/) or SABnzbd
- An indexer or indexer manager like [Prowlarr](/apps/prowlarr/)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  sonarr:
    image: lscr.io/linuxserver/sonarr:4.0.16
    container_name: sonarr
    environment:
      - PUID=1000          # Your user ID (run `id -u` to find it)
      - PGID=1000          # Your group ID (run `id -g` to find it)
      - TZ=America/New_York # Your timezone
    volumes:
      - sonarr_config:/config          # Sonarr database and configuration
      - /path/to/tv:/tv                # TV shows library
      - /path/to/downloads:/downloads  # Download client output directory
    ports:
      - "8989:8989"        # Web UI
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8989/ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  sonarr_config:
```

**Important:** The `/tv` and `/downloads` paths must match what your download client uses. If Sonarr and your download client share a common root path (e.g., `/data/tv` and `/data/downloads`), hardlinks work and save disk space. Map them accordingly:

```yaml
    volumes:
      - sonarr_config:/config
      - /data/media/tv:/data/media/tv
      - /data/downloads:/data/downloads
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8989` in your browser
2. Sonarr v4 requires authentication on first access — set up a username and password under **Settings → General → Authentication**
3. Set the authentication method to `Forms (Login Page)` for web-based access

### Connect a Download Client

Go to **Settings → Download Clients → Add**:

- **qBittorrent:** Host `localhost` (or container name if on the same Docker network), port `8080`, username/password from your qBittorrent setup
- **Transmission:** Host `localhost`, port `9091`
- **SABnzbd:** Host `localhost`, port `8080`, API key from SABnzbd settings

### Connect an Indexer

Go to **Settings → Indexers → Add**, or use [Prowlarr](/apps/prowlarr/) to manage indexers centrally and sync them to Sonarr automatically.

## Configuration

### Media Management

Under **Settings → Media Management**:

- **Rename Episodes:** Enable this. Set your preferred naming format. Recommended: `{Series TitleYear} - S{season:00}E{episode:00} - {Episode CleanTitle} [{Quality Full}]`
- **Root Folders:** Add your TV library path (e.g., `/tv`)
- **Import Extra Files:** Enable for subtitles (`.srt`, `.sub`)

### Quality Profiles

Under **Settings → Profiles**:

- **HD-1080p** is a good default for most users
- Set cutoff to your preferred maximum quality — Sonarr will upgrade files until it reaches this cutoff
- Drag quality items to set preference order

### Download Client Path Mapping

If your download client runs in a separate container with different volume paths, configure **Settings → Download Clients → Remote Path Mappings** to translate between the two.

## Advanced Configuration (Optional)

### Custom Formats

Sonarr v4 supports custom formats for granular quality filtering:

- Filter by release group, codec (x265/HEVC), HDR format, or streaming service
- Create scoring profiles to prefer certain attributes
- Useful for preferring specific encoders or avoiding poor-quality releases

### API Integration

Sonarr exposes a REST API on the same port (8989). Find your API key under **Settings → General → Security**. Use it for integration with [Prowlarr](/apps/prowlarr/), Overseerr, or custom scripts.

### Connecting to Prowlarr

[Prowlarr](/apps/prowlarr/) can manage all your indexers in one place and push them to Sonarr:

1. In Prowlarr, go to **Settings → Apps → Add → Sonarr**
2. Enter Sonarr's URL and API key
3. Prowlarr syncs indexers to Sonarr automatically

## Reverse Proxy

Nginx Proxy Manager configuration:

- **Scheme:** `http`
- **Forward Hostname:** `sonarr` (container name) or server IP
- **Forward Port:** `8989`
- Enable **Websockets Support**

For [Nginx Proxy Manager](/apps/nginx-proxy-manager/) or other reverse proxies, set the base URL under **Settings → General → URL Base** if running under a subpath (e.g., `/sonarr`).

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for detailed configuration.

## Backup

Sonarr stores all configuration in the `/config` volume:

- `sonarr.db` — Main database (series, episodes, history)
- `config.xml` — Application settings
- `logs/` — Application logs

Back up the entire `/config` volume. Sonarr also has a built-in backup under **System → Backup** that creates zip archives on a schedule.

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a comprehensive approach.

## Troubleshooting

### Sonarr Can't Connect to Download Client

**Symptom:** "Unable to connect to qBittorrent" or similar error in Settings.
**Fix:** Ensure both containers are on the same Docker network. Use the container name as the hostname (e.g., `qbittorrent`), not `localhost`. Verify port and credentials match.

### Downloads Complete but Don't Import

**Symptom:** Episodes download but stay in the download client, not imported to the TV library.
**Fix:** Check path mappings. The path Sonarr sees must match where the download client puts files. If using separate containers, configure Remote Path Mappings under **Settings → Download Clients**.

### Permission Denied Errors

**Symptom:** Sonarr logs show "Access to path is denied" when trying to move or rename files.
**Fix:** Ensure `PUID` and `PGID` match the owner of your media and download directories. Run `ls -la /path/to/tv` to check ownership, then set the matching UID/GID in your Docker Compose.

### High CPU or Memory Usage

**Symptom:** Sonarr consuming excessive resources during RSS sync or search.
**Fix:** Reduce the number of monitored series. Increase RSS sync interval under **Settings → Indexers → RSS Sync Interval** (default 15 minutes). Consider limiting concurrent searches.

### API Key Not Working

**Symptom:** External tools can't connect to Sonarr's API.
**Fix:** Verify the API key under **Settings → General → Security**. Ensure authentication is not blocking API access — set **Authentication Required** to `Disabled for Local Addresses` if Sonarr is behind a reverse proxy on the same network.

## Resource Requirements

- **RAM:** ~256 MB idle, 400-600 MB under heavy search/import activity
- **CPU:** Low (spikes during RSS sync and search operations)
- **Disk:** ~100 MB for the application, plus your media library

## Verdict

Sonarr is the standard tool for automated TV show management and the centerpiece of any *arr stack. It's mature, well-maintained, and has an enormous community. If you download and organize TV shows, Sonarr is non-negotiable — nothing else comes close for this specific job. Pair it with [Prowlarr](/apps/prowlarr/) for indexer management and [Radarr](/apps/radarr/) for movies to build a complete media automation pipeline.

## FAQ

### What's the difference between Sonarr and Radarr?

Sonarr manages TV series (episodes, seasons, series monitoring). [Radarr](/apps/radarr/) manages movies. They share the same codebase architecture and UI design but are separate applications. Most users run both.

### Can Sonarr work without a VPN?

Sonarr itself doesn't download files — it tells your download client what to grab. If you need VPN protection, configure it on your download client (e.g., [qBittorrent with Gluetun](/apps/qbittorrent/)), not on Sonarr.

### Does Sonarr support Usenet and BitTorrent?

Yes, both. Sonarr works with Usenet clients (SABnzbd, NZBGet) and BitTorrent clients ([qBittorrent](/apps/qbittorrent/), [Transmission](/apps/transmission/), Deluge). You can use multiple download clients simultaneously.

### How do I add anime to Sonarr?

Enable **Settings → Media Management → Episode Naming → Standard Episode Format** with absolute numbering support, or use a separate Sonarr instance with anime-specific indexers and naming conventions.

## Related

- [How to Self-Host Radarr](/apps/radarr/)
- [How to Self-Host qBittorrent](/apps/qbittorrent/)
- [How to Self-Host Prowlarr](/apps/prowlarr/)
- [How to Self-Host Bazarr](/apps/bazarr/)
- [How to Self-Host Jellyfin](/apps/jellyfin/)
- [Sonarr vs Radarr](/compare/sonarr-vs-radarr/)
- [Sonarr vs Prowlarr](/compare/sonarr-vs-prowlarr/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
