---
title: "How to Self-Host Plex with Docker Compose"
description: "Complete guide to running Plex Media Server with Docker Compose, including hardware transcoding, library setup, and remote access."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "media-servers"
apps:
  - plex
tags:
  - self-hosted
  - media-server
  - plex
  - docker
  - streaming
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Plex?

[Plex](https://www.plex.tv) is a media server that organizes your personal video, music, and photo libraries and streams them to any device. It automatically fetches metadata, artwork, and subtitles, and provides apps for virtually every platform — smart TVs, mobile devices, game consoles, and web browsers. Plex is the most popular self-hosted media server, though it is not fully open source (the server is proprietary, the client apps are free with optional Plex Pass subscription).

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 2 GB of RAM minimum (4 GB+ recommended for transcoding)
- Storage for your media library (external drives, NAS, or local disks)
- A Plex account at [plex.tv](https://www.plex.tv) (free)
- A claim token from [plex.tv/claim](https://www.plex.tv/claim) (for first-time setup)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  plex:
    image: lscr.io/linuxserver/plex:1.43.0
    container_name: plex
    network_mode: host
    restart: unless-stopped
    environment:
      PUID: "1000"       # Your user ID (run: id -u)
      PGID: "1000"       # Your group ID (run: id -g)
      TZ: "America/New_York"
      VERSION: "docker"  # Use "docker" to match image version
      PLEX_CLAIM: ""     # Get from https://plex.tv/claim — expires in 4 minutes
    volumes:
      - plex-config:/config
      - /path/to/movies:/movies
      - /path/to/tv:/tv
      - /path/to/music:/music

volumes:
  plex-config:
```

**Important:** Replace `/path/to/movies`, `/path/to/tv`, and `/path/to/music` with the actual paths to your media directories. You can add as many media volumes as you need.

Get a claim token from [plex.tv/claim](https://www.plex.tv/claim), paste it into `PLEX_CLAIM`, and start the stack within 4 minutes:

```bash
docker compose up -d
```

The claim token is only needed on first run to link the server to your Plex account. After the initial setup, you can remove it from the config.

### Bridge Networking (Alternative)

Host networking is recommended because it simplifies discovery and remote access. If you need bridge networking instead:

```yaml
services:
  plex:
    image: lscr.io/linuxserver/plex:1.43.0
    container_name: plex
    restart: unless-stopped
    ports:
      - "32400:32400"     # Primary access
      - "1900:1900/udp"   # DLNA discovery
      - "8324:8324"       # Roku companion
      - "32410:32410/udp" # GDM network discovery
      - "32412:32412/udp" # GDM network discovery
      - "32413:32413/udp" # GDM network discovery
      - "32414:32414/udp" # GDM network discovery
      - "32469:32469"     # DLNA access
    environment:
      PUID: "1000"
      PGID: "1000"
      TZ: "America/New_York"
      VERSION: "docker"
      PLEX_CLAIM: ""
      ADVERTISE_IP: "http://your-server-ip:32400/"  # Required for bridge mode
    volumes:
      - plex-config:/config
      - /path/to/movies:/movies
      - /path/to/tv:/tv
      - /path/to/music:/music

volumes:
  plex-config:
```

## Initial Setup

1. Open the Plex web UI at `http://your-server-ip:32400/web`
2. If you used a claim token, the server is already linked to your account. If not, sign in.
3. Name your server and configure sharing preferences
4. Add your media libraries:
   - Click **Add Library**
   - Choose the type (Movies, TV Shows, Music, Photos)
   - Browse to the mounted path (e.g., `/movies`, `/tv`)
   - Configure the library agent (Plex Movie or Plex TV Series agents are recommended)
5. Plex will scan and match your media automatically

**Headless server tip:** If you cannot access port 32400 directly, use an SSH tunnel:
```bash
ssh -L 32400:localhost:32400 user@your-server -N
```
Then open `http://localhost:32400/web` in your local browser.

## Configuration

### Remote Access

Enable remote access under **Settings > Remote Access**. Plex will attempt automatic port mapping via UPnP. If it fails:

1. Manually forward port 32400 on your router to your server's IP
2. Or use [Tailscale](/apps/tailscale/) / [Cloudflare Tunnel](/apps/cloudflare-tunnel/) for secure remote access without port forwarding

### Library Organization

Plex expects a specific directory structure:

```
/movies/
  Movie Name (2024)/
    Movie Name (2024).mkv
/tv/
  Show Name/
    Season 01/
      Show Name - S01E01 - Episode Title.mkv
/music/
  Artist Name/
    Album Name/
      01 - Track Name.flac
```

Follow the [Plex naming conventions](https://support.plex.tv/articles/naming-and-organizing-your-movie-media-files/) for best metadata matching.

### Transcoding

Plex transcodes media when the client device doesn't support the original format. By default, Plex transcodes using CPU, which is slow on low-powered hardware. Enable hardware transcoding for dramatically better performance (requires Plex Pass).

## Advanced Configuration (Optional)

### Hardware Transcoding (Plex Pass Required)

#### Intel Quick Sync (most common for self-hosters)

Add the GPU device to your Docker Compose:

```yaml
services:
  plex:
    image: lscr.io/linuxserver/plex:1.43.0
    # ... other config ...
    devices:
      - /dev/dri:/dev/dri  # Intel Quick Sync
```

Verify your server has Intel Quick Sync:
```bash
ls -la /dev/dri
# You should see renderD128 and card0
```

#### NVIDIA GPU

1. Install the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) on the host
2. Add to your Docker Compose:

```yaml
services:
  plex:
    image: lscr.io/linuxserver/plex:1.43.0
    # ... other config ...
    runtime: nvidia
    environment:
      NVIDIA_VISIBLE_DEVICES: "all"
```

After starting the container, enable hardware transcoding in **Settings > Transcoder > Use hardware acceleration when available**.

### Plex Pass Features

Plex Pass ($5/month, $40/year, or $120 lifetime) adds:
- Hardware transcoding
- Mobile sync (downloads for offline)
- Skip Intro
- Lyrics
- Live TV and DVR support with a compatible tuner

### Custom SSL

Place your certificates in the `/config` directory and configure under **Settings > Network > Custom certificate location**.

## Reverse Proxy

If using a reverse proxy like [Nginx Proxy Manager](/apps/nginx-proxy-manager/):

- Forward `your-plex-domain.com` to `http://your-server-ip:32400`
- Enable WebSocket support
- The reverse proxy handles SSL; Plex communicates over HTTP internally

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for the full configuration.

## Backup

The critical data lives in `/config`:

```bash
docker compose stop plex
docker run --rm -v plex-config:/config -v $(pwd):/backup alpine tar czf /backup/plex-config-backup.tar.gz /config
docker compose start plex
```

**What's in `/config`:**
- `Library/` — database, metadata, artwork (can be very large — 50 GB+ for large libraries)
- `Preferences.xml` — server settings

Your media files are not in `/config` — back those up separately. See [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Plex cannot find media files

**Symptom:** Library scan finds no media or shows "This library appears to be empty"

**Fix:** Check volume mounts and file permissions:
```bash
# Verify the mount exists inside the container
docker exec plex ls -la /movies

# Check file ownership matches PUID/PGID
ls -la /path/to/movies
```

### Remote access not working

**Symptom:** "Not available outside your network" in Settings > Remote Access

**Fix:**
1. Check port 32400 is forwarded on your router
2. If using bridge networking, ensure `ADVERTISE_IP` is set correctly
3. Test with: `curl http://your-public-ip:32400/web` from outside your network

### Transcoding stuttering or failing

**Symptom:** Playback buffers constantly or fails with "server is not powerful enough"

**Fix:**
- Enable hardware transcoding (Plex Pass required) with GPU passthrough
- Reduce the streaming quality in client settings to avoid transcoding
- Use direct play compatible media formats (H.264 MP4 is the safest)
- Mount a fast SSD or tmpfs for the transcode directory

### High CPU usage during library scan

**Symptom:** CPU at 100% for hours after adding media

**Fix:** This is normal during initial scan, especially with large libraries. Plex is generating thumbnails, analyzing audio, and fetching metadata. Scheduled maintenance tasks will cause periodic CPU spikes — configure these under **Settings > Scheduled Tasks**.

### Database corruption

**Symptom:** Plex won't start or libraries are missing

**Fix:** Do not store the `/config` volume on SMB/NFS — these filesystems don't support the file locking SQLite requires. Move the config to a local filesystem.

## Resource Requirements

- **RAM:** 512 MB idle, 2-4 GB during transcoding
- **CPU:** Low without transcoding; high during software transcoding. Hardware transcoding offloads to GPU.
- **Disk:** 1-2 GB for the application, 10-100+ GB for metadata and thumbnails depending on library size

## Frequently Asked Questions

### Is Plex free?

The server is free. The Plex Pass subscription ($5/month or $120 lifetime) adds hardware transcoding, mobile sync, Skip Intro, and DVR support. Most users can start free and decide if the extras are worth it.

### Should I use Plex or Jellyfin?

Use [Jellyfin](/apps/jellyfin/) if you want fully open source and free hardware transcoding. Use Plex if you want the most polished client apps across every platform, or if you share libraries with non-technical family members. See our [Plex vs Jellyfin comparison](/compare/jellyfin-vs-plex/).

### Can I run Plex on a Raspberry Pi?

Technically yes, but transcoding is very limited. A Pi 4 can handle direct play of most content but struggles with transcoding. For transcoding, use an Intel N100 mini PC with Quick Sync instead.

## Verdict

Plex remains the most polished and widely supported media server. Its client apps are available on everything, the interface is intuitive, and features like Skip Intro and automatic metadata matching work well. The downside is the proprietary nature — hardware transcoding requires a paid Plex Pass, and Plex the company has added features like ad-supported streaming and rentals that dilute the self-hosted focus. For a fully open alternative, use [Jellyfin](/apps/jellyfin/). For most users sharing media with family, Plex's app ecosystem is hard to beat.

## Related

- [How to Self-Host Jellyfin](/apps/jellyfin/)
- [Best Self-Hosted Media Servers](/best/media-servers/)
- [Plex vs Jellyfin](/compare/jellyfin-vs-plex/)
- [Plex vs Emby for Music](/compare/plex-vs-emby-music/)
- [Plex vs Navidrome](/compare/plex-vs-navidrome/)
- [Replace Netflix with Self-Hosted Media](/replace/netflix/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
- [Docker Volumes and Storage](/foundations/docker-volumes/)
