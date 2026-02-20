---
title: "How to Self-Host AzuraCast with Docker Compose"
description: "Step-by-step guide to self-hosting AzuraCast internet radio with Docker, including station setup, autodj, and live broadcasting."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "music-streaming"
apps:
  - azuracast
tags:
  - self-hosted
  - azuracast
  - docker
  - radio
  - music
  - streaming
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is AzuraCast?

[AzuraCast](https://www.azuracast.com/) is a self-hosted internet radio management suite. It provides everything you need to run one or more internet radio stations: automated playlists (AutoDJ), live DJ broadcasting, listener statistics, request systems, podcasting, and a public-facing station page. AzuraCast wraps Icecast/SHOUTcast and Liquidsoap into a polished web interface, making internet radio accessible without command-line audio server configuration.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB+ of free RAM (4 GB recommended for multiple stations)
- Music files to upload or a live audio source
- Ports 80, 443, and 8000-8999 available
- A domain name (optional but recommended for public stations)

## Docker Compose Configuration

AzuraCast provides an official Docker installer that generates the configuration. The recommended approach:

```bash
# Download and run the AzuraCast Docker installer
mkdir -p /opt/azuracast
cd /opt/azuracast
curl -fsSL https://raw.githubusercontent.com/AzuraCast/AzuraCast/main/docker.sh > docker.sh
chmod +x docker.sh
./docker.sh install
```

The installer creates a `docker-compose.yml` with all required services. For manual setup, here's the core configuration:

```yaml
services:
  web:
    image: ghcr.io/azuracast/azuracast:0.23.1
    container_name: azuracast
    restart: unless-stopped
    ports:
      - "80:80"       # Web UI
      - "443:443"     # HTTPS
      - "2022:2022"   # SFTP for file uploads
      - "8000:8000"   # Icecast streaming (station 1)
      - "8010:8010"   # Icecast streaming (station 2)
      - "8005:8005"   # HLS streaming (station 1)
      - "8006:8006"   # Liquidsoap telnet (station 1)
    environment:
      AZURACAST_DC_REVISION: 15
      AZURACAST_VERSION: latest
      AZURACAST_SFTP_PORT: 2022
      LETSENCRYPT_HOST: radio.yourdomain.com  # CHANGE: Your domain (optional)
      LETSENCRYPT_EMAIL: admin@yourdomain.com # CHANGE: Your email (optional)
    volumes:
      - azuracast-station-data:/var/azuracast/stations
      - azuracast-uploads:/var/azuracast/uploads
      - azuracast-backups:/var/azuracast/backups
      - azuracast-db-data:/var/lib/mysql
      - azuracast-acme:/var/azuracast/acme
      - azuracast-shoutcast2:/var/azuracast/servers/shoutcast2
      - azuracast-geolite:/var/azuracast/geoip
      - azuracast-sftpgo:/var/azuracast/sftpgo/persist
      - azuracast-tmp:/var/azuracast/www_tmp
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/api/status"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  azuracast-station-data:
  azuracast-uploads:
  azuracast-backups:
  azuracast-db-data:
  azuracast-acme:
  azuracast-shoutcast2:
  azuracast-geolite:
  azuracast-sftpgo:
  azuracast-tmp:
```

**Configuration notes:**

- **AzuraCast is an all-in-one container** — it includes Nginx, MariaDB, Redis, PHP, Icecast, Liquidsoap, and SHOUTcast in a single image.
- **Port 8000+** is for streaming. Each station gets its own port (8000, 8010, 8020, etc.).
- **SFTP (port 2022)** allows uploading music files via SFTP clients — useful for bulk library management.
- **Let's Encrypt is built-in.** Set the domain and email variables for automatic SSL certificates.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server` in your browser
2. The setup wizard walks you through:
   - **Create admin account:** Set email and password
   - **Station setup:** Create your first radio station
   - **Upload music:** Upload tracks via the web interface or SFTP
3. Create a station:
   - **Name:** Your station name (e.g., "My Radio")
   - **Frontend:** Icecast (recommended) or SHOUTcast
   - **Backend:** Liquidsoap (recommended)
   - **Encoding:** MP3 128kbps for compatibility, or AAC/OGG for better quality
4. Upload music to the station's media library
5. Create a playlist and assign it to AutoDJ
6. Start the station — it begins broadcasting immediately

## Configuration

### AutoDJ Playlists

AutoDJ automatically plays music when no live DJ is connected:

1. Go to Station → Playlists → Add Playlist
2. Configure:
   - **Type:** Default (weighted rotation), Once Per Hour, Scheduled, Advanced
   - **Weight:** Higher = more frequent play (for default playlists)
   - **Schedule:** Set specific time slots for scheduled playlists
3. Assign media files to the playlist
4. Enable AutoDJ in station settings

Playlist types:
- **Default:** Continuous rotation with weight-based selection
- **Once Per X Songs:** Play one track from this playlist every N songs
- **Once Per Hour:** Play at a specific minute each hour (good for station IDs, jingles)
- **Scheduled:** Active only during specific times (morning show playlist, night music)
- **Advanced:** Custom Liquidsoap code for complex scheduling

### Live Broadcasting

Allow DJs to broadcast live:

1. Go to Station → Streamers → Add Streamer
2. Set DJ username and password
3. The DJ connects using:
   - **Software:** BUTT, Mixxx, OBS, or any Icecast-compatible encoder
   - **Server:** Your server hostname
   - **Port:** Station's DJ port (shown in station settings)
   - **Mount/Password:** As configured
4. When a live DJ connects, AutoDJ automatically pauses. When they disconnect, AutoDJ resumes.

### Listener Statistics

AzuraCast tracks:
- Current listener count (real-time)
- Peak listeners (daily/weekly/monthly)
- Listening time per track
- Geographic distribution (with GeoIP database)
- User agents (player/browser breakdown)

Access statistics from Station → Reports.

### Request System

Let listeners request songs:

1. Enable song requests in Station → Settings
2. Set minimum time between requests per listener
3. The public station page shows a request form
4. Requested songs are queued and played by AutoDJ

## Advanced Configuration (Optional)

### Custom Mount Points

Create multiple mount points per station for different quality levels:

1. Station → Mount Points → Add Mount Point
2. Configure:
   - `/radio.mp3` — MP3 128kbps (widest compatibility)
   - `/radio-hd.mp3` — MP3 320kbps (high quality)
   - `/radio.ogg` — Ogg Vorbis (open format)
   - `/radio.aac` — AAC (best quality-to-size ratio)

### HLS Streaming

Enable HTTP Live Streaming for adaptive bitrate:

1. Go to Station → Settings → HLS
2. Enable HLS output
3. Listeners can access the HLS stream at `http://your-server:8005/listen/station_name/hls.m3u8`

### Podcasting

AzuraCast includes a built-in podcast hosting platform:

1. Go to Station → Podcasts → Create Podcast
2. Upload episodes
3. AzuraCast generates an RSS feed compatible with Apple Podcasts, Spotify, and other directories

### Webhooks

Send notifications when events occur (song change, DJ connect, listener threshold):

1. Station → Webhooks → Add Webhook
2. Types: Discord, Telegram, generic HTTP, Twitter, TuneIn AIR
3. Configure triggers and templates

## Reverse Proxy

AzuraCast includes its own Nginx and handles SSL via Let's Encrypt. Running it behind another reverse proxy requires special configuration:

1. Set `AZURACAST_HTTP_PORT` and `AZURACAST_HTTPS_PORT` to non-standard ports
2. Configure your reverse proxy to forward both HTTP and streaming ports
3. Ensure your proxy passes the `X-Forwarded-Proto` header

For Nginx Proxy Manager, forward to the AzuraCast container's HTTP port and add the streaming ports as separate stream entries.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for detailed instructions.

## Backup

AzuraCast has built-in backup functionality:

```bash
# Create a backup
./docker.sh backup

# Restore from backup
./docker.sh restore
```

Backups include station configurations, playlists, user accounts, and optionally media files. Backup files are stored in the `azuracast-backups` volume.

For manual backup:

```bash
# Backup database
docker exec azuracast mysqldump -u azuracast azuracast > azuracast-backup.sql

# Backup station data (large — includes all uploaded media)
docker cp azuracast:/var/azuracast/stations ./stations-backup/
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive backup approach.

## Troubleshooting

### Station won't start

**Symptom:** Station shows as "offline" after clicking Start.
**Fix:** Check the station's logs in Station → Logs. Common issues:
- Port conflict: another service is using the station's streaming port
- Icecast configuration error: check mount point settings
- Liquidsoap error: often caused by invalid playlist configuration

### No audio in stream

**Symptom:** Station is running but listeners hear silence.
**Fix:** Verify that media files are uploaded and assigned to an active playlist. Check that AutoDJ is enabled. Verify the audio files are valid:
```bash
docker exec azuracast ffprobe /var/azuracast/stations/station_name/media/song.mp3
```

### Can't connect as live DJ

**Symptom:** DJ software shows connection refused or authentication failed.
**Fix:** Verify the DJ port is exposed in docker-compose.yml. Check that the streamer credentials match. Ensure no firewall blocks the DJ port. Test with BUTT (Broadcast Using This Tool) — it's the simplest DJ client.

### High CPU usage

**Symptom:** Container uses 100% CPU with multiple stations.
**Fix:** Each station runs its own Liquidsoap and Icecast process. Reduce the number of active stations, lower encoding bitrate, or upgrade to a more powerful server. AAC encoding is more CPU-efficient than MP3 at the same quality.

## Resource Requirements

- **RAM:** 1-2 GB for a single station. 4+ GB for multiple stations with many listeners.
- **CPU:** 1-2 cores per station (encoding is CPU-intensive). More for high-quality streams.
- **Disk:** Depends on music library size. 10 GB for a small station, 100+ GB for large libraries.
- **Network:** 128kbps per listener for MP3 streams. 100 concurrent listeners = ~12.5 Mbps.

## Verdict

AzuraCast is the best self-hosted internet radio solution. It wraps complex audio streaming software (Icecast, Liquidsoap) into an accessible web interface that handles everything: automated playlists, live DJs, listener stats, requests, podcasts, and multi-station management. The all-in-one Docker deployment makes getting started surprisingly easy for such a feature-rich platform.

If you want to run an internet radio station — whether for personal listening, a community station, or a small broadcaster — AzuraCast is the answer. There's nothing else in the self-hosted space that comes close.

## Frequently Asked Questions

### Can I use AzuraCast for personal music streaming?

Technically yes, but it's overkill. AzuraCast is designed for broadcasting to listeners, not personal library streaming. For personal music, use [Navidrome](/apps/navidrome) or [Koel](/apps/koel). Use AzuraCast when you want a radio station.

### How many listeners can AzuraCast handle?

Depends on your server and network bandwidth. A typical VPS with 2 cores and 100 Mbps can handle 500+ concurrent listeners at 128kbps MP3. Scale with a CDN (via Icecast relay) for larger audiences.

### Does AzuraCast support Spotify or Apple Music content?

No. AzuraCast streams your own uploaded audio files. You cannot stream content from commercial streaming services — that would violate their terms of service and likely copyright law.

## Related

- [How to Self-Host Navidrome](/apps/navidrome)
- [Navidrome vs Funkwhale](/compare/navidrome-vs-funkwhale)
- [How to Self-Host Funkwhale](/apps/funkwhale)
- [Best Self-Hosted Music Streaming](/best/music-streaming)
- [Replace Spotify](/replace/spotify)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
