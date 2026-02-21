---
title: "How to Self-Host Dim with Docker Compose"
description: "Set up Dim with Docker Compose — a self-hosted media manager that organizes and streams your movie and TV library with a clean web UI."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "media-servers"
apps:
  - dim
tags: ["self-hosted", "dim", "docker", "media-server", "streaming"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Dim?

[Dim](https://github.com/Dusk-Labs/dim) is a self-hosted media manager that organizes and streams your movie and TV show collections through a clean web interface. With minimal setup, Dim scans your media directories, fetches metadata (posters, descriptions, ratings), and provides a browseable, searchable library you can stream from any device with a web browser.

Dim is built with Rust (backend) and React (frontend), supports hardware-accelerated transcoding via FFmpeg, and aims to be a lightweight alternative to [Jellyfin](/apps/jellyfin/) and [Plex](/apps/plex/).

**Note:** Dim is a smaller project compared to Jellyfin, Plex, or Emby. Development activity has been intermittent, and there are no stable versioned releases — only `dev` and `master` branch builds. Consider Dim if you want a lightweight, minimal media server, but for a production home media setup, [Jellyfin](/apps/jellyfin/) or [Plex](/apps/plex/) are more mature choices.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 1 GB RAM minimum (2 GB recommended for transcoding)
- Media files on accessible storage
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/dim && cd /opt/dim
```

Create a `docker-compose.yml` file:

```yaml
services:
  dim:
    image: ghcr.io/dusk-labs/dim:dev
    container_name: dim
    ports:
      # Web UI
      - "8000:8000"
    volumes:
      # Application config and database
      - ./config:/opt/dim/config
      # Your media library — mount as many directories as needed
      - /path/to/movies:/media/movies:ro
      - /path/to/tvshows:/media/tvshows:ro
    # Optional: hardware transcoding (Intel QuickSync/VAAPI)
    # devices:
    #   - /dev/dri/renderD128:/dev/dri/renderD128
    restart: unless-stopped
```

The `:ro` (read-only) flag on media mounts prevents Dim from modifying your original files.

To enable hardware-accelerated transcoding with Intel QuickSync or VAAPI, uncomment the `devices` section. For NVIDIA GPUs, use the NVIDIA container runtime instead.

Start Dim:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8000` in your browser
2. Create your admin account on the first-run page
3. Add media libraries:
   - Navigate to settings
   - Add a new library pointing to your mounted media path (e.g., `/media/movies`)
   - Choose the library type (Movies or TV Shows)
   - Dim will scan the directory and fetch metadata automatically
4. Organize your media in the standard format for best detection:

**Movies:**
```
/media/movies/
  Movie Name (2024)/
    Movie Name (2024).mkv
```

**TV Shows:**
```
/media/tvshows/
  Show Name/
    Season 01/
      Show Name - S01E01.mkv
      Show Name - S01E02.mkv
```

## Configuration

### Library Management

Dim auto-detects movies and TV shows from folder structure and filenames. Key behaviors:

- **Metadata fetching** — pulls posters, descriptions, cast info, and ratings from TMDb
- **File format support** — MKV, MP4, AVI, and other common video formats via FFmpeg
- **Subtitle support** — reads embedded subtitles and external .srt/.ass files

### Transcoding

Dim uses FFmpeg for transcoding when a client device can't direct-play the source format. Hardware transcoding significantly reduces CPU load:

- **Intel QuickSync/VAAPI** — mount `/dev/dri/renderD128`
- **NVIDIA NVENC** — requires NVIDIA Container Toolkit

Without hardware acceleration, transcoding is CPU-intensive and limited to one or two simultaneous streams on typical hardware.

### Multi-User Support

Dim supports multiple user accounts. Each user gets:
- Independent watch history and progress
- Personal watchlist
- Separate session management

## Reverse Proxy

Standard reverse proxy configuration. Point your proxy to port 8000. Ensure WebSocket support is enabled for real-time playback updates.

[Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

## Backup

Back up the `config/` directory, which contains Dim's SQLite database (library metadata, user accounts, watch history):

```bash
tar -czf dim-backup-$(date +%Y%m%d).tar.gz /opt/dim/config/
```

Your media files are stored on the host and should be part of your regular [backup strategy](/foundations/backup-strategy/).

## Troubleshooting

### Media not appearing after scan

**Symptom:** Dim shows an empty library after adding a directory.
**Fix:** Check volume mounts — the library path must use the container-side path (e.g., `/media/movies`). Verify your folder structure follows the `Movie Name (Year)/` or `Show Name/Season XX/` convention. Check container logs: `docker logs dim`.

### Transcoding fails or stutters

**Symptom:** Playback fails with transcoding errors.
**Fix:** Ensure FFmpeg is working inside the container: `docker exec dim ffmpeg -version`. If using hardware transcoding, verify the device is mounted correctly: `docker exec dim ls /dev/dri/`. Without hardware acceleration, reduce the transcoding quality or limit simultaneous streams.

### High CPU usage during playback

**Symptom:** CPU usage spikes to 100% during streaming.
**Fix:** This happens during software transcoding. Enable hardware transcoding (see Configuration above) or ensure clients direct-play your media format. MKV with H.264 video and AAC audio is the most widely compatible format.

### Metadata not fetching

**Symptom:** Movies/shows appear without posters or descriptions.
**Fix:** Dim uses TMDb for metadata. Ensure your server can reach the internet. Also verify filenames include the year in parentheses for movies: `Movie Name (2024).mkv`.

## Resource Requirements

- **RAM:** ~150 MB idle, 500 MB - 2 GB during transcoding
- **CPU:** Low for direct play. High for software transcoding (one 1080p transcode uses ~one full CPU core)
- **Disk:** ~20 MB for the application, plus metadata cache (varies by library size)

## Verdict

Dim is an interesting lightweight media server, but it's not ready to replace Jellyfin or Plex for most users. Development has been inconsistent, there are no stable releases, and the feature set is limited compared to the established alternatives. The client ecosystem is web-only — no native mobile or TV apps.

**Use Dim if:** You want the simplest possible media server with minimal resource usage and don't need mobile apps, DLNA, or a large plugin ecosystem.

**Otherwise, choose:** [Jellyfin](/apps/jellyfin/) for a fully free, feature-rich alternative. [Plex](/apps/plex/) for the most polished client ecosystem. [Emby](/apps/emby/) for a middle ground between the two.

## FAQ

### Is Dim actively maintained?

Development has been intermittent. There are no stable versioned releases. Check the [GitHub repository](https://github.com/Dusk-Labs/dim) for recent commit activity before deploying.

### Does Dim have mobile apps?

No. Dim is web-only. You access it through a browser on any device. For native mobile apps, use Jellyfin or Plex.

### Can Dim handle 4K content?

Yes, for direct play. Transcoding 4K requires significant CPU power or hardware acceleration. For 4K, ensure your client supports direct play of the source format.

### How does Dim compare to Jellyfin?

Jellyfin is more mature, has native mobile/TV apps, supports music and books, has a plugin ecosystem, and has a larger community. Dim is lighter and simpler. For most use cases, Jellyfin is the better choice. See our [Jellyfin guide](/apps/jellyfin/).

## Related

- [How to Self-Host Jellyfin](/apps/jellyfin/)
- [How to Self-Host Plex](/apps/plex/)
- [How to Self-Host Emby](/apps/emby/)
- [Jellyfin vs Plex](/compare/jellyfin-vs-plex/)
- [Stash vs Dim](/compare/stash-vs-dim/)
- [Best Self-Hosted Media Servers](/best/media-servers/)
- [Self-Hosted Netflix Alternatives](/replace/netflix/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-strategy/)
