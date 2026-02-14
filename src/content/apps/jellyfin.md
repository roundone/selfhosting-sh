---
title: "How to Self-Host Jellyfin with Docker Compose"
type: "app-guide"
app: "jellyfin"
category: "media-servers"
replaces: "Netflix (personal media)"
difficulty: "beginner"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up Jellyfin, the best free self-hosted media server, with Docker Compose and hardware transcoding."
officialUrl: "https://jellyfin.org"
githubUrl: "https://github.com/jellyfin/jellyfin"
defaultPort: 8096
minRam: "1GB"
---

## What is Jellyfin?

Jellyfin is a free, open-source media server that lets you stream your movies, TV shows, music, and photos to any device. Think of it as your own private Netflix. Unlike Plex, Jellyfin is fully free with no premium tier — every feature, including hardware transcoding, is available to everyone.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- A server or mini PC ([best mini PCs for self-hosting](/hardware/best-mini-pc/))
- Media files (movies, TV shows, music) organized in folders
- Optional: Intel CPU with Quick Sync for hardware transcoding

## Docker Compose Configuration

```yaml
# docker-compose.yml for Jellyfin
# Tested with Jellyfin 10.9+

services:
  jellyfin:
    container_name: jellyfin
    image: jellyfin/jellyfin:latest
    ports:
      - "8096:8096"
      # Optional: DLNA discovery
      # - "1900:1900/udp"
      # - "7359:7359/udp"
    volumes:
      - ./config:/config
      - ./cache:/cache
      # Mount your media libraries
      - /path/to/movies:/data/movies:ro
      - /path/to/tvshows:/data/tvshows:ro
      - /path/to/music:/data/music:ro
    # Intel Quick Sync hardware transcoding
    # Uncomment the following for Intel GPUs:
    # devices:
    #   - /dev/dri:/dev/dri
    # NVIDIA hardware transcoding:
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: all
    #           capabilities: [gpu]
    environment:
      - JELLYFIN_PublishedServerUrl=http://your-server-ip:8096
    restart: unless-stopped
```

## Step-by-Step Setup

1. **Create a directory for Jellyfin:**
   ```bash
   mkdir ~/jellyfin && cd ~/jellyfin
   ```

2. **Create the `docker-compose.yml`** — update the media paths to point to your actual files.

3. **Start the container:**
   ```bash
   docker compose up -d
   ```

4. **Access the setup wizard** at `http://your-server-ip:8096`

5. **Create your admin account.**

6. **Add your media libraries:**
   - Movies → `/data/movies`
   - TV Shows → `/data/tvshows`
   - Music → `/data/music`

7. **Configure metadata providers** — Jellyfin will automatically download movie posters, descriptions, and ratings.

8. **Install client apps** — available for Android, iOS, Android TV, Roku, Fire TV, and web browsers.

## Configuration Tips

- **Hardware transcoding (Intel Quick Sync):** Uncomment the `devices` section in the compose file. Then in Jellyfin Dashboard → Playback → Transcoding, select "Intel QuickSync (QSV)" and enable the codecs your hardware supports.
- **Hardware transcoding (NVIDIA):** Install the NVIDIA Container Toolkit first, then uncomment the NVIDIA section. Select "NVIDIA NVENC" in transcoding settings.
- **Folder structure:** Jellyfin works best with organized media. Use `Movies/Movie Name (Year)/Movie Name (Year).mkv` and `TV Shows/Show Name/Season 01/Show Name S01E01.mkv`.
- **Reverse proxy:** For remote access over HTTPS, see our [reverse proxy guide](/foundations/reverse-proxy/).
- **Subtitles:** Install the Open Subtitles plugin from the plugin catalog for automatic subtitle downloads.

## Backup & Migration

- **Backup:** The `config` folder contains all your settings, user accounts, and metadata. Back it up regularly.
- **Migration from Plex:** There's no direct migration tool, but Jellyfin will re-scan your same media libraries and re-download metadata. Watch history doesn't transfer easily.

## Troubleshooting

- **Transcoding failures:** Check that hardware acceleration is configured correctly. See our [Jellyfin transcoding troubleshooting guide](/troubleshooting/jellyfin/transcoding/).
- **Remote access not working:** Ensure port 8096 is forwarded or use a reverse proxy/VPN. See our [remote access guide](/foundations/remote-access/).
- **Metadata not loading:** Check your internet connection from the container and verify metadata providers are enabled in library settings.

## Alternatives

Plex is the main alternative — it has a more polished interface and better client apps, but requires a Plex Pass ($120 lifetime) for hardware transcoding. See our [Jellyfin vs Plex comparison](/compare/jellyfin-vs-plex/) or the [Best Self-Hosted Media Servers](/best/media-servers/) roundup.

## Verdict

Jellyfin is the best self-hosted media server for most people. It's completely free, supports hardware transcoding out of the box, and has a growing ecosystem of clients and plugins. If you have a media library, Jellyfin is the way to stream it.
