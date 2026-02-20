---
title: "How to Self-Host Radarr with Docker Compose"
description: "Step-by-step guide to self-hosting Radarr with Docker Compose for automated movie downloading, organizing, and quality management."
date: 2026-02-16
dateUpdated: 2026-02-19
category: "download-management"
apps:
  - radarr
tags:
  - docker
  - radarr
  - download-management
  - media-automation
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Radarr?

Radarr is an automated movie collection manager that searches indexers, grabs releases from Usenet or BitTorrent, and organizes your movie library. It's a fork of [Sonarr](/apps/sonarr) adapted for movies instead of TV shows. If you want new movies downloaded automatically the moment they're available in your preferred quality, Radarr handles it. [Official site](https://radarr.video/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of free disk space (plus storage for media)
- 512 MB of RAM (minimum)
- A download client like [qBittorrent](/apps/qbittorrent) or SABnzbd
- An indexer or indexer manager like [Prowlarr](/apps/prowlarr)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  radarr:
    image: lscr.io/linuxserver/radarr:6.0.4
    container_name: radarr
    environment:
      - PUID=1000          # Your user ID (run `id -u` to find it)
      - PGID=1000          # Your group ID (run `id -g` to find it)
      - TZ=America/New_York # Your timezone
    volumes:
      - radarr_config:/config          # Radarr database and configuration
      - /path/to/movies:/movies        # Movie library
      - /path/to/downloads:/downloads  # Download client output directory
    ports:
      - "7878:7878"        # Web UI
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:7878/ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  radarr_config:
```

**Path mapping tip:** For hardlinks to work (saving disk space by not copying files), your download client and Radarr must share a common root path. Map volumes like this:

```yaml
    volumes:
      - radarr_config:/config
      - /data/media/movies:/data/media/movies
      - /data/downloads:/data/downloads
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:7878` in your browser
2. Radarr requires authentication — configure a username and password under **Settings → General → Authentication**
3. Set authentication to `Forms (Login Page)`

### Connect a Download Client

Go to **Settings → Download Clients → Add**:

- **qBittorrent:** Host `qbittorrent` (container name on same Docker network), port `8080`
- **Transmission:** Host `transmission`, port `9091`
- **SABnzbd:** Host `sabnzbd`, port `8080`, API key from SABnzbd settings

### Connect an Indexer

Go to **Settings → Indexers → Add**, or use [Prowlarr](/apps/prowlarr) to sync indexers automatically across all your *arr apps.

## Configuration

### Media Management

Under **Settings → Media Management**:

- **Rename Movies:** Enable. Recommended format: `{Movie CleanTitle} ({Release Year}) [{Quality Full}]`
- **Root Folders:** Add your movie library path (e.g., `/movies`)
- **Import Extra Files:** Enable for subtitles (`.srt`, `.sub`)
- **Use Hardlinks:** Enable if your download and movie directories share the same filesystem

### Quality Profiles

Under **Settings → Profiles**:

- **HD-1080p** works for most setups
- Set a quality cutoff — Radarr will keep upgrading files until it hits this ceiling
- For 4K setups, create a separate quality profile with **Bluray-2160p** as the cutoff

### Custom Formats

Custom formats let you score releases by attributes:

- Prefer specific codecs (x265/HEVC for smaller files)
- Avoid bad release groups
- Prefer or require HDR/DV metadata
- Filter by streaming service source

Assign scores to custom formats in your quality profile to automate quality decisions.

## Advanced Configuration (Optional)

### Lists for Automatic Discovery

Radarr supports lists that automatically add movies:

- **Trakt:** Popular movies, trending, watchlists
- **IMDb:** Import from IMDb lists or watchlist
- **TMDb:** Discover movies by genre, year, or popularity

Configure under **Settings → Lists → Add**.

### Multiple Root Folders

Use separate root folders for different quality tiers:

- `/movies/4k` for UHD content
- `/movies/hd` for standard HD content

Each movie's root folder can be set individually.

### API Integration

Radarr's REST API is available on port 7878. API key is under **Settings → General → Security**. Common integrations:

- **Overseerr/Jellyseerr:** Users request movies through a web UI, Radarr handles the rest
- **Tautulli:** Track what's been watched
- **Notifiarr:** Discord/Slack notifications for grabs and imports

## Reverse Proxy

For [Nginx Proxy Manager](/apps/nginx-proxy-manager):

- **Scheme:** `http`
- **Forward Hostname:** `radarr` (container name) or server IP
- **Forward Port:** `7878`
- Enable **Websockets Support**

If running under a subpath, set **Settings → General → URL Base** (e.g., `/radarr`).

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for detailed configuration.

## Backup

Radarr stores everything in the `/config` volume:

- `radarr.db` — Main database (movies, history, blocklist)
- `config.xml` — Application settings and API key
- `logs/` — Application logs

Radarr creates automatic backups under **System → Backup**. These zip files contain the database and config — store them off-server.

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Movies Download but Don't Import

**Symptom:** Download completes in your client but the movie stays in the downloads folder.
**Fix:** Check that the download path visible to Radarr matches the actual download location. If using separate containers, add a Remote Path Mapping under **Settings → Download Clients** to translate between container paths.

### "Movie Not Found" When Adding Movies

**Symptom:** Search returns no results or wrong movies.
**Fix:** Radarr uses TMDb for movie metadata. Verify the movie exists on [themoviedb.org](https://www.themoviedb.org). Check that Radarr can reach the internet — DNS resolution issues inside containers are common.

### Disk Space Warnings

**Symptom:** Radarr warns about low disk space on root folder.
**Fix:** Verify your volume mounts are correct and the mounted filesystem has free space. Run `df -h` on the host to check. Radarr checks available space before downloading.

### Permission Denied on Import

**Symptom:** "Access to path is denied" errors during file import or rename.
**Fix:** Set `PUID` and `PGID` to match the owner of your media directories. Both your download client and Radarr must run as the same user, or the directories must have appropriate group permissions.

### Radarr Shows "Unmonitored" for Added Movies

**Symptom:** Newly added movies are not being searched.
**Fix:** When adding movies, ensure "Start search for missing movie" is checked. For bulk imports, select movies and use **Movie Editor → Monitored → True**.

## Resource Requirements

- **RAM:** ~200 MB idle, 400-600 MB during searches with large libraries
- **CPU:** Low (spikes during RSS sync and automated searches)
- **Disk:** ~100 MB for the application, plus your movie library

## Verdict

Radarr is the definitive tool for automated movie management. It's the movie counterpart to [Sonarr](/apps/sonarr), and together they form the backbone of any self-hosted media automation stack. The v6 release migrated from Mono to .NET, improving performance and stability. Pair it with [Prowlarr](/apps/prowlarr) for centralized indexer management, a download client like [qBittorrent](/apps/qbittorrent), and a media server like [Jellyfin](/apps/jellyfin) for a complete end-to-end pipeline.

## FAQ

### How is Radarr different from Sonarr?

[Sonarr](/apps/sonarr) manages TV series (seasons, episodes, series packs). Radarr manages individual movies. They share the same architecture and UI paradigm but are separate applications. Run both for complete media automation.

### Can Radarr handle 4K and 1080p copies of the same movie?

Yes. Run two Radarr instances — one for 4K, one for 1080p — with different root folders and quality profiles. Use different ports (e.g., 7878 and 7879) and separate config volumes.

### Does Radarr work with Plex and Jellyfin?

Radarr doesn't interact directly with media servers. It downloads and organizes files into your movie library folder. [Plex](/apps/plex) and [Jellyfin](/apps/jellyfin) monitor that same folder and pick up new content automatically.

## Related

- [How to Self-Host Sonarr](/apps/sonarr)
- [How to Self-Host qBittorrent](/apps/qbittorrent)
- [How to Self-Host Prowlarr](/apps/prowlarr)
- [How to Self-Host Bazarr](/apps/bazarr)
- [How to Self-Host Jellyfin](/apps/jellyfin)
- [Sonarr vs Radarr](/compare/sonarr-vs-radarr)
- [Best Self-Hosted Media Servers](/best/media-servers)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
