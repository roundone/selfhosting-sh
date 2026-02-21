---
title: "How to Self-Host Ampache with Docker Compose"
description: "Step-by-step guide to self-hosting Ampache music server with Docker Compose, including catalog setup, Subsonic API, and multi-user config."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "music-streaming"
apps:
  - ampache
tags:
  - self-hosted
  - ampache
  - docker
  - music
  - streaming
  - subsonic
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Ampache?

[Ampache](https://ampache.org/) is a web-based audio/video streaming application and file manager. It's one of the oldest self-hosted music servers, first released in 2001. Ampache supports multiple music catalogs, the Subsonic API for mobile clients, podcast management, video streaming, and multi-user access with granular permissions. It's PHP-based and uses MySQL/MariaDB for metadata storage.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 512 MB+ of free RAM
- A music library in common audio formats
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  ampache:
    image: ampache/ampache:7.9.0
    container_name: ampache
    restart: unless-stopped
    ports:
      - "8080:80"  # Web UI
    environment:
      TZ: America/New_York  # CHANGE: Your timezone
    volumes:
      - ampache-config:/var/www/config
      - ampache-data:/media
      - ampache-log:/var/log/ampache
      - /path/to/music:/media/music:ro  # CHANGE: Your music library
    depends_on:
      ampache-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

  ampache-db:
    image: mariadb:11
    container_name: ampache-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: your-root-password      # CHANGE: Use a strong password
      MYSQL_DATABASE: ampache
      MYSQL_USER: ampache
      MYSQL_PASSWORD: your-secure-db-password      # CHANGE: Use a strong password
    volumes:
      - ampache-db-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  ampache-config:
  ampache-data:
  ampache-log:
  ampache-db-data:
```

**Configuration notes:**

- **Ampache v7.9.0** is the latest stable release (Feb 19, 2026). PHP 8.4 support included.
- **MariaDB** is required for catalog metadata, user accounts, playlists, and play statistics.
- **Mount music as read-only** (`:ro`) — Ampache reads but doesn't modify your music files.
- **Multiple catalog directories** can be added via the web UI after initial setup.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server:8080` in your browser
2. The web installer will guide you through setup:
   - **Choose Language:** Select your preferred language
   - **Database Connection:**
     - Type: MySQL/MariaDB
     - Host: `ampache-db`
     - Port: `3306`
     - Database: `ampache`
     - Username: `ampache`
     - Password: Your `MYSQL_PASSWORD` from docker-compose
   - **Create Admin Account:** Set username and password
   - **Ampache Configuration:** Set site name, catalog paths
3. After setup, log in with your admin credentials
4. Add a music catalog:
   - Go to **Admin** → **Catalogs** → **Add Catalog**
   - **Catalog Type:** Local
   - **Path:** `/media/music` (the mount point from docker-compose)
   - Click **Add Catalog** then **Run Catalog Update**
5. The catalog scan reads ID3 tags and indexes your library

## Configuration

### Subsonic API

Ampache supports the Subsonic API, enabling use with mobile apps like DSub, Symfonium, play:Sub, and Substreamer:

1. Go to **Admin** → **System Settings** → **Subsonic**
2. Enable the Subsonic backend
3. Each user needs a Subsonic API password (separate from their Ampache password):
   - Go to user settings → set Subsonic API password
4. Connect mobile apps with:
   - **Server:** `http://your-server:8080`
   - **Username:** Ampache username
   - **Password:** Subsonic API password

### Multiple Catalogs

Ampache supports multiple music catalogs — useful for separating different collections:

- Go to **Admin** → **Catalogs** → **Add Catalog**
- Add catalogs for different directories (music, podcasts, audiobooks, videos)
- Each catalog can have different scan settings and access permissions

### User Management

Create users with different access levels:

| Access Level | Permissions |
|-------------|-------------|
| Guest | Stream only, no library browsing |
| User | Browse, stream, create playlists |
| Manager | User + manage catalogs |
| Admin | Full administrative access |

Go to **Admin** → **Users** to manage accounts.

### Transcoding

Ampache can transcode audio on the fly using FFmpeg:

1. Verify FFmpeg is available:
```bash
docker exec ampache ffmpeg -version
```
2. Go to **Admin** → **Transcoding** → configure transcode profiles
3. Set default bitrate for streaming (128kbps, 192kbps, 320kbps)
4. Enable per-user transcode settings if users have different bandwidth

## Advanced Configuration (Optional)

### External Catalogs

Ampache supports remote catalogs:

- **Subsonic Remote:** Connect to another Subsonic/Ampache server
- **Seafile:** Stream from a Seafile library
- **WebDAV:** Mount remote storage as a catalog

### Podcast Support

1. Go to **Browse** → **Podcasts** → **Add Podcast**
2. Enter the podcast RSS feed URL
3. Ampache downloads and manages episodes
4. Set auto-download preferences per podcast

### Video Support

Ampache can catalog and stream video files:

1. Add a catalog pointing to a video directory
2. Set catalog type to "Video"
3. Videos appear in Browse → Video and can be streamed through the web UI

### Smart Playlists

Create dynamic playlists based on rules:

1. Go to **Playlists** → **Smart Playlists** → **Create**
2. Set rules (genre, year, play count, rating, recently added)
3. Smart playlists update automatically as your library changes

## Reverse Proxy

For Nginx Proxy Manager:

```
Scheme: http
Forward Hostname: ampache
Forward Port: 80
```

No special configuration needed. Ensure your `ampache.cfg.php` has the correct `web_path` and `http_host` settings if behind a reverse proxy.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for detailed instructions.

## Backup

Critical data to back up:

- **MariaDB database:** Catalog metadata, users, playlists, play counts, ratings
- **`/var/www/config/`:** Ampache configuration (ampache.cfg.php)

```bash
# Backup database
docker exec ampache-db mysqldump -u ampache -p'your-password' ampache > ampache-backup.sql

# Backup config
docker cp ampache:/var/www/config ./ampache-config-backup/
```

Your music files are mounted read-only — back them up separately.

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a comprehensive backup approach.

## Troubleshooting

### Catalog scan finds no files

**Symptom:** Catalog update completes but library shows zero tracks.
**Fix:** Verify the music path is mounted correctly inside the container:
```bash
docker exec ampache ls -la /media/music/
```
Check that files have proper ID3 tags. Ampache relies on metadata — files without tags may be skipped. Verify the catalog path matches exactly.

### Subsonic API not working

**Symptom:** Mobile apps can't connect or show empty library.
**Fix:** Ensure the Subsonic backend is enabled in Admin settings. Verify the user has a Subsonic API password set (it's separate from the login password). Check that the API URL includes the correct port.

### Slow catalog scan

**Symptom:** Scanning 10,000+ files takes a very long time.
**Fix:** This is normal for the first scan. Subsequent incremental scans are much faster. Increase PHP memory limit if you get timeout errors. Check that the disk containing your music library has good read performance.

### Album art not displaying

**Symptom:** Albums show generic placeholder art.
**Fix:** Ampache reads embedded album art from ID3 tags. If your files don't have embedded art, Ampache can fetch it from external sources. Go to Admin → Settings → enable art fetching from Last.fm, MusicBrainz, or folder images.

## Resource Requirements

- **RAM:** 200-400 MB (Ampache + PHP). Plus 200-400 MB for MariaDB. Total: ~400-800 MB.
- **CPU:** Low for streaming. Moderate during catalog scans and transcoding.
- **Disk:** Application data is small. Your music library is the main storage consumer.

## Verdict

Ampache is a veteran music server with features that newer alternatives lack: video support, podcast management, remote catalogs, and granular user permissions. Its Subsonic API support gives you access to the mobile app ecosystem. The 20+ years of development show in the breadth of features.

However, the web UI feels dated compared to Koel or Navidrome's interfaces, and the PHP/MySQL stack is heavier than Navidrome's Go binary. For most self-hosters who just want to stream their music library, [Navidrome](/apps/navidrome/) is the simpler, lighter choice. Choose Ampache if you need its specific features: video catalogs, podcast management, remote catalogs, or detailed user permission controls.

## Frequently Asked Questions

### How does Ampache compare to Navidrome?

Ampache has more features (video, podcasts, remote catalogs) but is heavier and has an older UI. Navidrome is lighter, faster, and has a cleaner interface. Both support the Subsonic API. See [Koel vs Navidrome](/compare/koel-vs-navidrome/) for a related comparison.

### Can Ampache stream video?

Yes. Ampache can catalog and stream video files through its web UI. This is a unique feature — most self-hosted music servers are audio-only. For dedicated video, [Jellyfin](/apps/jellyfin/) is more capable.

### Is Ampache still actively developed?

Yes. Ampache v7.9.0 was released February 19, 2026 with PHP 8.5 support and new API features. The project has been continuously maintained since 2001.

## Related

- [How to Self-Host Navidrome](/apps/navidrome/)
- [Koel vs Navidrome](/compare/koel-vs-navidrome/)
- [Navidrome vs Airsonic](/compare/navidrome-vs-airsonic/)
- [Best Self-Hosted Music Streaming](/best/music-streaming/)
- [Replace Spotify](/replace/spotify/)
- [How to Self-Host Jellyfin](/apps/jellyfin/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
