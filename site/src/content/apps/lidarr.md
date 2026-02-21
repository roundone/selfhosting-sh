---
title: "How to Self-Host Lidarr with Docker Compose"
description: "Step-by-step guide to self-hosting Lidarr with Docker Compose for automated music collection management and downloading."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "download-management"
apps:
  - lidarr
tags:
  - docker
  - music
  - download-management
  - arr-stack
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Lidarr?

Lidarr is a music collection manager that automatically monitors, downloads, and organizes music. It's the music equivalent of [Sonarr](/apps/sonarr/) (TV shows) and [Radarr](/apps/radarr/) (movies) — part of the *arr stack. You add artists, Lidarr tracks their discography, and downloads albums through Usenet or torrent clients. [Official site](https://lidarr.audio/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 1 GB of free disk space (plus storage for music)
- 512 MB of RAM minimum
- A download client: [SABnzbd](/apps/sabnzbd/) (Usenet) or [qBittorrent](/apps/qbittorrent/) (torrents)
- An indexer manager: [Prowlarr](/apps/prowlarr/) (recommended)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  lidarr:
    image: lscr.io/linuxserver/lidarr:2.11.2
    container_name: lidarr
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
    volumes:
      - ./config:/config
      - /path/to/music:/music          # Your music library
      - /path/to/downloads:/downloads  # Download client output
    ports:
      - "8686:8686"
    restart: unless-stopped
```

**Environment variables:**

| Variable | Purpose | Required |
|----------|---------|----------|
| `PUID` | User ID for file permissions | Yes |
| `PGID` | Group ID for file permissions | Yes |
| `TZ` | Timezone | Yes |

**Volume mounts:**

| Container Path | Purpose |
|---------------|---------|
| `/config` | Lidarr configuration and database |
| `/music` | Your music library root |
| `/downloads` | Shared download directory with your download client |

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8686`
2. Set up authentication under **Settings → General → Security** — Lidarr has no default password
3. Add a root folder: **Settings → Media Management → Root Folders** → add `/music`
4. Connect your download client: **Settings → Download Clients**
5. Add indexers via [Prowlarr](/apps/prowlarr/) or manually under **Settings → Indexers**

## Configuration

### Media Management

- **Settings → Media Management → File Management**
- Set naming format: `{Artist Name}/{Album Title} ({Release Year})/{track:00} - {Track Title}`
- Enable **Rename Tracks** for consistent naming
- Set quality profiles under **Settings → Profiles** — "Any" for maximum compatibility or specific quality tiers

### Quality Profiles

Lidarr lets you prioritize audio quality:

- **Lossless:** FLAC, ALAC (best quality, ~30-50 MB per album)
- **High Quality Lossy:** MP3 320kbps, AAC 256kbps (~10-15 MB per album)
- **Standard:** MP3 VBR V0 (~8-12 MB per album)

Set your preferred quality under **Settings → Profiles** and Lidarr will upgrade files when better quality becomes available.

### Metadata Profiles

Control what Lidarr monitors per artist:

- **Standard:** Albums only (most users want this)
- **None:** Monitor nothing by default — add specific albums manually
- Create custom profiles to include singles, EPs, or compilations

## Advanced Configuration (Optional)

### *arr Stack Integration

For the complete automated music setup:

```yaml
services:
  lidarr:
    image: lscr.io/linuxserver/lidarr:2.11.2
    container_name: lidarr
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
    volumes:
      - ./lidarr-config:/config
      - /data/media/music:/music
      - /data/downloads:/downloads
    ports:
      - "8686:8686"
    restart: unless-stopped
    networks:
      - arr

  prowlarr:
    image: lscr.io/linuxserver/prowlarr:2.3.0.5236
    container_name: prowlarr
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
    volumes:
      - ./prowlarr-config:/config
    ports:
      - "9696:9696"
    restart: unless-stopped
    networks:
      - arr

networks:
  arr:
    driver: bridge
```

Connect [Prowlarr](/apps/prowlarr/) to Lidarr: in Prowlarr, go to **Settings → Apps → Add → Lidarr**, enter `http://lidarr:8686` and Lidarr's API key.

### Import Existing Library

If you already have a music collection:

1. **Library → Import** (mass import)
2. Point to your music directory
3. Lidarr matches folders to artists using MusicBrainz
4. Review matches and import

## Reverse Proxy

Example Nginx Proxy Manager configuration:

- **Scheme:** http
- **Forward Hostname:** lidarr
- **Forward Port:** 8686

Set a URL base under **Settings → General** if running under a subdirectory. [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

## Backup

Back up the `/config` volume — it contains your database, settings, and history:

```bash
docker compose stop lidarr
tar -czf lidarr-backup-$(date +%Y%m%d).tar.gz ./config
docker compose start lidarr
```

Lidarr also has built-in backups under **System → Backup**. [Backup Strategy](/foundations/backup-3-2-1-rule/)

## Troubleshooting

### Artist Not Found or Wrong Match

**Symptom:** Adding an artist returns no results or the wrong artist.
**Fix:** Lidarr uses MusicBrainz for metadata. Search by MusicBrainz ID if the name is ambiguous. Less popular artists may not be in MusicBrainz — you'll need to add them there first.

### Downloads Complete but Don't Import

**Symptom:** Download client finishes but Lidarr doesn't move files to the library.
**Fix:** Ensure the download path in Lidarr matches the download client's output path. Both containers must see the same files at the same path. Check **Activity → Queue** for import errors.

### High CPU Usage

**Symptom:** Lidarr constantly uses 50%+ CPU.
**Fix:** Large libraries with many monitored artists cause frequent RSS checks. Increase RSS sync interval under **Settings → Indexers → Advanced → RSS Sync Interval**. Reduce the number of monitored artists.

### Quality Upgrades Not Working

**Symptom:** Lidarr doesn't replace lower-quality files with better ones.
**Fix:** Under **Settings → Profiles**, ensure your quality profile has the desired qualities ranked with cutoff set appropriately. Enable **Completed Download Handling** under **Settings → Download Clients**.

## Resource Requirements

- **RAM:** ~200 MB idle, 300-500 MB with large libraries (1000+ artists)
- **CPU:** Low (spikes during RSS sync and import processing)
- **Disk:** ~100 MB for application data, plus your music library

## Verdict

Lidarr fills the music gap in the *arr stack. If you already run Sonarr and Radarr, adding Lidarr is a no-brainer for automating music downloads. The MusicBrainz dependency means metadata quality varies — mainstream artists work great, niche genres less so. For most music automation needs, Lidarr is the only real option in the self-hosted space.

## FAQ

### Does Lidarr work with Spotify or streaming services?

No. Lidarr manages downloaded music files (FLAC, MP3, etc.), not streaming. Use [Navidrome](/apps/navidrome/) to stream your downloaded collection.

### Can Lidarr download from YouTube?

Not directly. Lidarr uses Usenet and torrent indexers. For YouTube music downloading, look at yt-dlp — but that's a separate tool, not integrated with Lidarr.

### Lidarr vs Headphones?

Lidarr replaced Headphones. Headphones is no longer actively maintained. Lidarr has a modern UI, better *arr stack integration, and active development.

## Related

- [How to Self-Host Sonarr](/apps/sonarr/)
- [How to Self-Host Radarr](/apps/radarr/)
- [How to Self-Host Prowlarr](/apps/prowlarr/)
- [How to Self-Host Navidrome](/apps/navidrome/)
- [How to Self-Host qBittorrent](/apps/qbittorrent/)
- [Best Self-Hosted Download Management](/best/download-management/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
