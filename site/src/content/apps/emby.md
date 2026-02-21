---
title: "How to Self-Host Emby with Docker Compose"
description: "Step-by-step guide to self-hosting Emby Media Server with Docker Compose — stream movies, TV shows, and music to all your devices."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "media-servers"
apps:
  - emby
tags: ["self-hosted", "emby", "media-server", "docker", "streaming"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Emby?

[Emby](https://emby.media/) is a media server that organizes and streams your personal movie, TV, music, and photo collection to any device. It provides a Netflix-like interface with automatic metadata fetching, poster art, episode tracking, and transcoding for remote playback. Emby sits between Jellyfin (fully open-source) and Plex (fully proprietary) — the server is free to use, but some features require an Emby Premiere subscription ($5/month or $119 lifetime).

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB RAM minimum (4 GB recommended for transcoding)
- Disk space for your media library
- A domain name (optional, for remote access)

## Docker Compose Configuration

Emby runs as a single container with no external database — it uses an embedded SQLite database stored in the `/config` volume.

Create a project directory:

```bash
mkdir -p /opt/emby && cd /opt/emby
```

Create a `docker-compose.yml`:

```yaml
services:
  emby:
    image: emby/embyserver:4.9.3.0
    container_name: emby
    environment:
      # User/group ID — set to match your media file ownership
      - UID=1000
      - GID=1000
      # Additional group IDs (comma-separated). Add your 'video' or 'render'
      # group GID here for hardware transcoding (e.g., GIDLIST=1000,44,109)
      - GIDLIST=1000
      # Timezone — https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
      - TZ=Etc/UTC
    volumes:
      # Emby configuration, database, and metadata cache
      # Can grow to 50+ GB for large libraries
      - /opt/emby/config:/config
      # Mount your media directories — add as many as needed
      - /path/to/movies:/mnt/movies:ro
      - /path/to/tvshows:/mnt/tvshows:ro
      - /path/to/music:/mnt/music:ro
    ports:
      # HTTP web UI
      - "8096:8096"
      # HTTPS web UI (requires manual SSL certificate setup in Emby settings)
      - "8920:8920"
    devices:
      # Intel/AMD hardware transcoding (optional — remove if not needed)
      - /dev/dri:/dev/dri
    restart: unless-stopped
```

Start the stack:

```bash
docker compose up -d
```

Verify the container is running:

```bash
docker compose ps
```

## Initial Setup

1. Open `http://your-server:8096` in a browser
2. Select your preferred language
3. Create your admin account with a strong password
4. Add media libraries:
   - Click **Add Library** → select the type (Movies, TV Shows, Music)
   - Set the content folder to the container path (e.g., `/mnt/movies`)
   - Configure metadata language and country
5. Configure remote access settings (enable or disable automatic port mapping)
6. Finish the wizard — Emby begins scanning and fetching metadata for your library

## Configuration

### Media Libraries

Add media libraries through **Settings** → **Library**. Each library maps to a volume mount in your Docker Compose file. Common directory structure:

```
/mnt/movies/
  Movie Name (2024)/
    Movie Name (2024).mkv
/mnt/tvshows/
  Show Name/
    Season 01/
      Show Name - S01E01 - Episode Title.mkv
```

Emby fetches metadata, poster art, and subtitles automatically from online databases (TheMovieDB, TheTVDB). Organize files using the naming conventions above for best results.

### User Accounts

Create user accounts under **Settings** → **Users**. Each user gets their own watch history, profile, and optional restrictions:

- **Parental controls** — restrict content by rating
- **Library access** — limit which libraries each user can see
- **Transcoding policy** — allow or block transcoding per user
- **Remote access** — enable or disable streaming outside your network

### Subtitle Management

Emby supports SRT, ASS/SSA, VobSub, and PGS subtitles. Embedded subtitles are detected automatically. External subtitle files should be placed alongside the media file with matching names:

```
Movie Name (2024).mkv
Movie Name (2024).en.srt
Movie Name (2024).es.srt
```

Enable automatic subtitle downloading under **Settings** → **Subtitles** by configuring Open Subtitles integration.

## Advanced Configuration

### Hardware Transcoding

Hardware transcoding offloads video encoding/decoding to your GPU, dramatically reducing CPU usage and enabling more simultaneous streams.

**Emby Premiere is required for hardware transcoding.** Without Premiere, transcoding is CPU-only.

#### Intel Quick Sync (most common for self-hosting)

The Docker Compose above already includes `/dev/dri:/dev/dri`. Ensure the Emby process can access the render device:

1. Find your render group GID: `stat -c '%g' /dev/dri/renderD128`
2. Add that GID to the `GIDLIST` environment variable: `GIDLIST=1000,109` (replace `109` with your actual render group GID)
3. In Emby, go to **Settings** → **Transcoding** → set hardware acceleration to **VAAPI** or **Quick Sync**

#### NVIDIA GPU

Replace the `devices` section with NVIDIA runtime:

```yaml
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
```

Requires [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) on the host. Then select **NVENC** in Emby's transcoding settings.

### DLNA

Emby includes a DLNA server for older devices (smart TVs, game consoles) that don't have a native Emby client. To use DLNA, Emby needs host networking:

```yaml
    network_mode: host
```

Remove the `ports` section when using host networking. DLNA uses multicast UDP for device discovery, which doesn't work through Docker's bridge network.

### Emby Premiere

Emby Premiere ($5/month or $119 lifetime) unlocks:
- Hardware transcoding
- Offline media sync to mobile devices
- Cinema Mode (trailers before movies)
- Backup and restore
- Cover art and extra features

Purchase at [emby.media/premiere](https://emby.media/premiere.html) and enter the key under **Settings** → **Emby Premiere**.

## Reverse Proxy

Configure your reverse proxy to forward to port 8096. Emby handles large media streams, so increase timeouts and buffer sizes.

### Nginx Proxy Manager

- **Scheme:** `http`
- **Forward Hostname:** `your-server-ip`
- **Forward Port:** `8096`
- Enable SSL with Let's Encrypt
- In the Advanced tab, add:

```nginx
proxy_buffering off;
proxy_read_timeout 600s;
proxy_send_timeout 600s;
```

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for detailed instructions.

## Backup

Critical data to back up:

- **Config directory:** `/opt/emby/config` — contains the database, metadata cache, user settings, and plugins. This is the only persistent volume Emby uses.
- **Media files:** Your movie/TV/music directories — this is your most important data.

```bash
# Stop Emby before backing up the database to ensure consistency
docker compose stop emby
tar czf emby-config-backup-$(date +%Y%m%d).tar.gz /opt/emby/config
docker compose up -d
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive backup approach.

## Troubleshooting

### Library not scanning or metadata missing

**Symptom:** Media added but Emby doesn't detect it, or shows generic titles without poster art.
**Fix:** Verify the volume mount is correct: `docker compose exec emby ls /mnt/movies/`. If files are visible, check the naming convention — Emby matches files against online databases by name and year. Ensure internet access for metadata fetching.

### Hardware transcoding not working

**Symptom:** Transcoding falls back to CPU despite GPU configuration.
**Fix:** Verify device access: `docker compose exec emby ls -la /dev/dri/`. If no devices appear, check the `devices` mapping. Confirm the render group GID is in `GIDLIST`. Verify Emby Premiere is active — hardware transcoding requires it.

### Permission denied errors

**Symptom:** "Access to the path is denied" errors in logs.
**Fix:** Check that `UID` and `GID` match the ownership of your media files on the host. Run `ls -la /path/to/movies/` to see the owner. Update the Docker environment variables to match.

### Remote access not working

**Symptom:** Can access Emby locally but not from outside your network.
**Fix:** Ensure port 8096 is forwarded in your router, or set up a reverse proxy with SSL. Check **Settings** → **Network** → ensure "Allow remote connections" is enabled. If using a reverse proxy, set the external URL under **Settings** → **Network** → **Secure connection mode**.

### High CPU usage during playback

**Symptom:** CPU spikes to 100% when streaming to a device.
**Fix:** The device is likely triggering transcoding. Check **Dashboard** → **Active Streams** to see if transcoding is active. Either set up hardware transcoding (requires Premiere) or configure clients to use "Direct Play" and "Direct Stream" to avoid transcoding.

## Resource Requirements

- **RAM:** ~300 MB idle, 1-2 GB during transcoding
- **CPU:** Low when idle or direct-playing. High during software transcoding (one 1080p transcode ≈ one full CPU core). Hardware transcoding reduces this to near-zero per stream.
- **Disk:** 1-5 GB for the application. Config/metadata cache grows with library size — 50+ GB for very large libraries (100,000+ items).
- **GPU:** Optional but recommended. An Intel CPU with Quick Sync handles 5-10 simultaneous 1080p transcodes.

## Verdict

Emby is a solid media server that sits in the middle ground between Jellyfin and Plex. It offers a clean interface, good client app support, and reliable transcoding — but several key features (hardware transcoding, offline sync, backup) are locked behind the Emby Premiere paywall.

For most self-hosting users, **Jellyfin is the better choice** — it's fully free, open-source, and includes hardware transcoding without a subscription. Choose Emby if you specifically prefer its UI, need its DLNA implementation, or want features like Cinema Mode. Choose Plex if you prioritize the widest client app ecosystem and don't mind cloud authentication.

## FAQ

### Is Emby free?

The server is free to download and use. Most features work without payment. However, hardware transcoding, offline sync, backup/restore, and Cinema Mode require Emby Premiere ($5/month or $119 lifetime).

### How does Emby compare to Jellyfin?

Jellyfin is a fork of Emby from before Emby went proprietary. Jellyfin is fully free and open-source, including hardware transcoding. Emby has a slightly more polished UI and some features Jellyfin lacks (Cinema Mode, offline sync), but requires a paid subscription for hardware transcoding. See our [Jellyfin vs Emby comparison](/compare/jellyfin-vs-emby).

### Can I migrate from Plex to Emby?

There's no direct migration tool. You'll need to set up Emby from scratch, point it at the same media directories, and let it re-scan and fetch metadata. Watch history and playlists don't transfer automatically.

### Does Emby work with Chromecast?

Yes. Emby supports Chromecast casting from the web UI and mobile apps. The Android and iOS Emby apps include built-in Chromecast support.

### What clients are available?

Emby has native apps for Android, iOS, Android TV, Amazon Fire TV, Roku, Apple TV, Samsung TV, LG TV, Xbox, and web browsers. Third-party clients like Infuse (iOS/Apple TV) and Kodi also support Emby.

## Related

- [Jellyfin vs Emby](/compare/jellyfin-vs-emby)
- [Plex vs Emby](/compare/plex-vs-emby)
- [Emby vs Navidrome](/compare/emby-vs-navidrome)
- [Emby vs Plex for Music](/compare/emby-vs-plex-music)
- [Jellyfin vs Plex](/compare/jellyfin-vs-plex)
- [How to Self-Host Jellyfin](/apps/jellyfin)
- [How to Self-Host Plex](/apps/plex)
- [Best Self-Hosted Media Servers](/best/media-servers)
- [Self-Hosted Netflix Alternatives](/replace/netflix)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
