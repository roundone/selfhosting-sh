---
title: "How to Self-Host Jellyfin with Docker"
description: "Set up Jellyfin — a free, open-source media server for movies, TV shows, music, and books. Complete Docker guide."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "media-servers"
apps:
  - jellyfin
tags: ["self-hosted", "media-server", "jellyfin", "docker", "streaming"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Jellyfin?

[Jellyfin](https://jellyfin.org/) is a free, open-source media server that lets you stream your own movies, TV shows, music, books, and photos to any device. It started as a fork of Emby after Emby went partially closed-source, and has since grown into one of the most active self-hosted projects on GitHub.

There are no paid tiers, no tracking, no telemetry, and no "phone home" behavior. You own every piece of the stack. Client apps exist for Android, iOS, Android TV, Fire TV, Roku, Kodi, and web browsers. If you want a media server with zero strings attached, Jellyfin is it.

Jellyfin replaces [Plex](https://plex.tv) (proprietary, paid features gated behind Plex Pass) and [Emby](https://emby.media) (partially open-source, premium tier required for hardware transcoding).

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 2 GB of RAM minimum (4 GB+ recommended if you plan to transcode)
- Media files on accessible storage (local drives, NAS mounts, or external USB)
- A domain name (optional, for remote access via reverse proxy)

## Docker Compose Configuration

Create a directory for your Jellyfin stack:

```bash
mkdir -p /opt/jellyfin
cd /opt/jellyfin
```

Create a `docker-compose.yml` file:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.11.6
    container_name: jellyfin
    user: "1000:1000"  # Change to match your host user's UID:GID
    group_add:
      - "122"  # Render group ID for hardware transcoding — run: getent group render | cut -d: -f3
    ports:
      - "8096:8096/tcp"   # Web UI
      - "7359:7359/udp"   # Client auto-discovery on local network
    volumes:
      - jellyfin-config:/config        # Jellyfin configuration and database
      - jellyfin-cache:/cache          # Transcoding cache and image cache
      - /path/to/movies:/media/movies:ro       # Your movie library (read-only)
      - /path/to/tv:/media/tv:ro               # Your TV show library (read-only)
      - /path/to/music:/media/music:ro         # Your music library (read-only)
    environment:
      - JELLYFIN_PublishedServerUrl=http://your-server-ip:8096  # Used for auto-discovery — set to your LAN IP or domain
    devices:
      - /dev/dri/renderD128:/dev/dri/renderD128  # Intel/AMD GPU for hardware transcoding (remove if not using)
    restart: unless-stopped

volumes:
  jellyfin-config:
  jellyfin-cache:
```

**Key configuration notes:**

- **`user: "1000:1000"`** — Run the container as your host user instead of root. Find your UID and GID with `id`. Your media files must be readable by this user.
- **`group_add: "122"`** — Required for GPU access. Get your system's render group ID by running `getent group render | cut -d: -f3`. If the group doesn't exist, remove this line and the `devices` section.
- **Media volumes are read-only (`:ro`)** — Jellyfin never needs to write to your media directories. This protects your files from accidental modification.
- **`JELLYFIN_PublishedServerUrl`** — Set this to your server's LAN IP address (e.g., `http://192.168.1.50:8096`) or your domain. This is used by client apps for auto-discovery.
- **`devices`** — Passes through the Intel/AMD GPU render device for hardware transcoding. Remove this line entirely if your server has no GPU or you don't need transcoding.

Start the stack:

```bash
docker compose up -d
```

Verify it's running:

```bash
docker compose logs -f jellyfin
```

You should see Jellyfin start up and report that it's listening on port 8096.

## Initial Setup

Open your browser and go to `http://your-server-ip:8096`. The setup wizard walks you through:

1. **Language** — Select your preferred language.
2. **Create admin user** — Pick a strong username and password. This is the only account with full admin access.
3. **Add media libraries** — Click "Add Media Library" for each content type:
   - **Movies** → Content type: Movies → Folder: `/media/movies`
   - **TV Shows** → Content type: Shows → Folder: `/media/tv`
   - **Music** → Content type: Music → Folder: `/media/music`
4. **Metadata language** — Set your preferred metadata language and country for media matching.
5. **Remote access** — Enable "Allow remote connections to this server" if you plan to access Jellyfin outside your LAN. Leave the port at 8096.
6. **Finish** — Complete the wizard and log in with your admin credentials.

Jellyfin immediately begins scanning your libraries and downloading metadata. Large libraries (10,000+ files) may take a few hours for the initial scan.

## Configuration

### Media Libraries

Jellyfin relies on consistent file naming to match your media with metadata. Follow these conventions:

**Movies:**
```
/media/movies/
  Movie Name (2024)/
    Movie Name (2024).mkv
```

**TV Shows:**
```
/media/tv/
  Show Name (2020)/
    Season 01/
      Show Name S01E01.mkv
      Show Name S01E02.mkv
```

**Music:**
```
/media/music/
  Artist Name/
    Album Name (2023)/
      01 - Track Name.flac
```

Consistent naming eliminates 90% of metadata matching problems. If Jellyfin can't identify a file, check the filename first.

### Metadata and Artwork

Jellyfin pulls metadata from TMDb (movies/TV), MusicBrainz (music), and other providers by default. You can configure the provider priority per library:

1. Go to **Dashboard → Libraries** → select a library → **Manage Library**.
2. Under **Metadata Downloaders**, drag providers into your preferred order.
3. Enable **NFO file support** if you have existing `.nfo` sidecar files from other tools.

For subtitles, install the **Open Subtitles** plugin (see Plugins section below) to automatically download subtitles in your preferred languages.

### Users and Access Control

Go to **Dashboard → Users** to manage accounts:

- **Create accounts** for family members. Each user gets their own watch history, favorites, and playback position.
- **Restrict library access** per user — hide certain libraries from specific users (e.g., keep adult content invisible to child accounts).
- **Parental controls** — Set maximum parental rating per user and block unrated content.
- **Disable transcoding** per user — If a user's device always supports direct play, disabling transcoding saves server resources.

### Playback Settings

Under **Dashboard → Playback → Transcoding**:

- **Hardware acceleration** — Select your GPU type (VAAPI for Intel/AMD, NVENC for NVIDIA). Covered in detail below.
- **Thread count** — Leave at 0 (auto-detect) unless you want to limit CPU usage.
- **Throttle transcoding** — Enable this to reduce CPU load during transcoding. Jellyfin transcodes just enough to stay ahead of playback instead of transcoding the entire file at once.

Per-user bitrate limits can be set under each user's profile. This is useful for remote users on slow connections — cap them at 8 Mbps instead of letting them transcode at full quality.

## Advanced Configuration

### Hardware Transcoding

Software transcoding uses the CPU and is slow and power-hungry. Hardware transcoding offloads the work to a GPU and is dramatically faster at a fraction of the power cost. Jellyfin supports three main GPU types.

#### Intel QuickSync (VAAPI) — Recommended

Intel integrated GPUs (found in most Intel CPUs, including N100 mini PCs) offer the best value for transcoding. The Docker Compose example above already includes the necessary device passthrough.

Verify the GPU is accessible inside the container:

```bash
docker exec -it jellyfin ls -la /dev/dri/
```

You should see `renderD128` listed. Then enable VAAPI in the Jellyfin dashboard:

1. Go to **Dashboard → Playback → Transcoding**.
2. Set **Hardware acceleration** to `Video Acceleration API (VAAPI)`.
3. Set **VA-API Device** to `/dev/dri/renderD128`.
4. Enable the codecs your GPU supports (H.264 and HEVC are supported on most Intel GPUs from Haswell onward).
5. Enable **Hardware encoding** and **Tone mapping** if your GPU supports it (Intel 10th gen+).

#### NVIDIA NVENC

If your server has an NVIDIA GPU, replace the `devices` and `group_add` sections in your `docker-compose.yml` with:

```yaml
services:
  jellyfin:
    # ... other config stays the same ...
    runtime: nvidia
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```

You must install the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) on the host first. After starting the container, verify GPU access:

```bash
docker exec -it jellyfin nvidia-smi
```

In the dashboard, set hardware acceleration to **NVIDIA NVENC**.

#### AMD AMF

AMD GPUs use the same VAAPI device passthrough as Intel (`/dev/dri/renderD128`). In the dashboard, select **Video Acceleration API (VAAPI)** and enable the codecs your AMD GPU supports. AMD transcoding support is less mature than Intel or NVIDIA — Intel QuickSync is the better choice for a dedicated transcoding setup.

### Plugins

Install plugins from **Dashboard → Plugins → Catalog**. The most useful ones:

- **Open Subtitles** — Automatic subtitle downloads. Requires a free [opensubtitles.org](https://www.opensubtitles.org) account. Configure your preferred languages after installation.
- **Fanart** — Higher-quality artwork from fanart.tv.
- **Bookshelf** — Adds eBook and audiobook support with metadata from Google Books and Open Library.
- **Intro Skipper** — Detects and marks TV show intros so users can skip them. Requires a one-time analysis pass over your library.
- **LDAP Authentication** — Integrate with an existing LDAP/Active Directory server for centralized user management.

### Live TV and DVR

Jellyfin supports live TV through HDHomeRun tuners and IPTV/M3U streams:

1. Go to **Dashboard → Live TV** and add a tuner (HDHomeRun auto-discovers on the network, or paste an M3U URL for IPTV).
2. Add an EPG (Electronic Program Guide) data source — XMLTV format. Free EPG sources are available for many regions.
3. Once configured, Live TV appears as a library with a channel guide, recording scheduler, and DVR functionality.

### Networking

For remote access, put Jellyfin behind a [reverse proxy](/foundations/reverse-proxy-explained/) rather than exposing port 8096 directly to the internet.

Jellyfin uses **WebSockets** for SyncPlay (synchronized playback across multiple clients). Your reverse proxy must support WebSocket connections, or SyncPlay will not work. Both Nginx Proxy Manager and Caddy handle this without extra configuration. For Nginx directly, ensure you include `proxy_set_header Upgrade $http_upgrade` and `proxy_set_header Connection "upgrade"` in your config.

## Reverse Proxy

Jellyfin works behind any standard reverse proxy. The key requirement is WebSocket support for SyncPlay and real-time dashboard updates.

For Caddy (simplest option):

```
jellyfin.yourdomain.com {
    reverse_proxy localhost:8096
}
```

For Nginx Proxy Manager, add a new proxy host pointing to `http://your-server-ip:8096` with WebSocket support enabled.

After setting up the reverse proxy, update `JELLYFIN_PublishedServerUrl` in your `docker-compose.yml` to your public domain (e.g., `https://jellyfin.yourdomain.com`) and restart the container.

See the full [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) guide for detailed instructions.

## Backup

The `/config` volume contains everything Jellyfin needs: the database, user accounts, watch history, playback positions, library metadata, and server settings. Back up this volume and you can restore a complete Jellyfin instance.

The `/cache` volume is expendable — it contains transcoding artifacts and cached images that Jellyfin regenerates automatically.

Your media files should be backed up separately as part of your overall [backup strategy](/foundations/backup-3-2-1-rule/).

To back up the config volume:

```bash
docker compose stop jellyfin
tar czf jellyfin-config-backup-$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/jellyfin-config/
docker compose start jellyfin
```

Stop the container before backing up to avoid database corruption. For zero-downtime backups, use a filesystem snapshot tool.

## Troubleshooting

### Buffering During Playback

**Symptom:** Video pauses to buffer frequently, especially on remote clients.

**Fix:** Open the Jellyfin dashboard while playing content. If the "Transcode Reasons" section shows active transcoding, the server is struggling to keep up. Enable [hardware transcoding](#hardware-transcoding) to fix this. If transcoding is already hardware-accelerated, check your network bandwidth — a single 4K transcode needs 20+ Mbps. Consider setting per-user bitrate limits under **Dashboard → Users → [user] → Playback**.

### Metadata Not Matching

**Symptom:** Movies or TV shows show wrong metadata, no poster, or don't appear in the library at all.

**Fix:** Verify your file naming follows the conventions in the [Media Libraries](#media-libraries) section. For stubborn files, right-click the item → **Identify** to manually search and match. Check that your metadata provider order hasn't been changed. TMDb should be the primary provider for movies and TV.

### Hardware Transcoding Not Working

**Symptom:** Jellyfin falls back to software transcoding despite GPU configuration.

**Fix:** Verify the device is passed through correctly:
```bash
docker exec -it jellyfin ls -la /dev/dri/
```
If `renderD128` is missing, check your `docker-compose.yml` devices section. If the device is present but transcoding still fails, verify the `group_add` value matches your host's render group ID (`getent group render | cut -d: -f3`). Restart the container after any changes.

### Remote Access Not Working

**Symptom:** Clients outside the local network cannot connect.

**Fix:** If using a reverse proxy, verify `JELLYFIN_PublishedServerUrl` matches your public URL. Check that your reverse proxy is forwarding WebSocket connections. If exposing directly (not recommended), verify port 8096 is forwarded in your router and allowed through your firewall (`sudo ufw allow 8096/tcp`).

### High CPU During Transcoding

**Symptom:** CPU usage spikes to 100% during playback.

**Fix:** This means software transcoding is active. Enable hardware transcoding (see above). If hardware transcoding is already enabled, check that it's actually being used in the dashboard's active streams view. For libraries with many incompatible formats, consider pre-transcoding with [Tdarr](https://tdarr.io/) to convert files to a format most clients can direct-play (H.264 in MP4 is the safest choice).

For more detailed troubleshooting, see:
- [Jellyfin Transcoding Not Working: Fix Guide](/troubleshooting/jellyfin-transcoding-issues/)

## Resource Requirements

- **RAM:** ~500 MB idle, 1-2 GB during software transcoding, 800 MB-1 GB during hardware transcoding
- **CPU:** Low (direct play), very high (software transcoding), low (hardware transcoding)
- **Disk:** ~500 MB for application and config data, plus your media library size. The transcoding cache can grow to several GB during active use — allocate at least 10 GB of free space for the cache volume.

## Verdict

Jellyfin is the best self-hosted media server for most people. It is completely free with no paid tiers, no telemetry, and no features locked behind a subscription. Plex still has a slight edge in client app polish and automatic media matching, but Jellyfin has closed the gap substantially — and Plex's increasing push toward ad-supported content and account-required playback makes it harder to recommend every year.

Hardware transcoding with Intel QuickSync works excellently in Jellyfin and requires nothing more than a $100 N100 mini PC. The client app ecosystem covers every major platform. The plugin system is extensible without being overwhelming.

If you want a media server that you fully own and control, Jellyfin is the answer. Start here, and only look at [Plex](/compare/jellyfin-vs-plex/) or [Emby](/compare/jellyfin-vs-emby/) if you hit a specific limitation that Jellyfin can't solve.

## Related

- [Best Self-Hosted Media Servers](/best/media-servers/)
- [Jellyfin vs Plex](/compare/jellyfin-vs-plex/)
- [Jellyfin vs Emby](/compare/jellyfin-vs-emby/)
- [Dim vs Jellyfin](/compare/dim-vs-jellyfin/)
- [Jellyfin vs Navidrome for Music](/compare/jellyfin-vs-navidrome-music/)
- [Jellyfin vs Plex for Music](/compare/jellyfin-vs-plex-music/)
- [Jellyfin Transcoding Not Working: Fix Guide](/troubleshooting/jellyfin-transcoding-issues/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
