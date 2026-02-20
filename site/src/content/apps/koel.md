---
title: "How to Self-Host Koel with Docker Compose"
description: "Step-by-step guide to self-hosting Koel music streaming server with Docker Compose, including Spotify integration and library setup."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "music-streaming"
apps:
  - koel
tags:
  - self-hosted
  - koel
  - docker
  - music
  - streaming
  - spotify-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Koel?

[Koel](https://koel.dev/) is a self-hosted music streaming server with a polished, Spotify-like web interface. Built with Laravel (PHP) and Vue.js, it streams your local music library through a clean web UI that includes smart playlists, equalizer, visualizer, Last.fm scrobbling, and optional Spotify integration. Koel focuses on the web listening experience — it's what you'd use if you want your music library to feel like a modern streaming service.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB+ of free RAM
- MariaDB or MySQL database
- FFmpeg (included in the Docker image)
- A music library in FLAC, MP3, AAC, OGG, or WAV format
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  koel:
    image: phanan/koel:v8.3.0
    container_name: koel
    restart: unless-stopped
    ports:
      - "8050:80"  # Web UI
    depends_on:
      koel-db:
        condition: service_healthy
    environment:
      DB_CONNECTION: mysql
      DB_HOST: koel-db
      DB_PORT: 3306
      DB_DATABASE: koel
      DB_USERNAME: koel
      DB_PASSWORD: your-secure-db-password    # CHANGE: Use a strong password
      APP_KEY: "base64:GENERATE_THIS_KEY"     # CHANGE: Generate with command below
      APP_URL: http://localhost:8050           # CHANGE: Your actual URL
      FORCE_HTTPS: "false"                    # Set to true behind HTTPS reverse proxy
      MEMORY_LIMIT: 512                       # PHP memory limit in MB
      MEDIA_PATH: /music                      # Internal path to music files
    volumes:
      - /path/to/music:/music:ro              # CHANGE: Your music library path
      - koel-covers:/var/www/html/public/img/covers
      - koel-search:/var/www/html/storage/search-indexes
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

  koel-db:
    image: mariadb:11
    container_name: koel-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: your-root-password     # CHANGE: Use a strong password
      MYSQL_DATABASE: koel
      MYSQL_USER: koel
      MYSQL_PASSWORD: your-secure-db-password     # CHANGE: Must match DB_PASSWORD above
    volumes:
      - koel-db-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  koel-covers:
  koel-search:
  koel-db-data:
```

**Generate the APP_KEY before starting:**

```bash
# Generate a Laravel application key
docker run --rm phanan/koel:v8.3.0 php artisan key:generate --show
```

Copy the output (starts with `base64:`) and replace `GENERATE_THIS_KEY` in docker-compose.yml.

**Configuration notes:**

- **`APP_KEY`** is required for Laravel session encryption. Without it, Koel won't start properly.
- **`APP_URL`** must match the URL users access. Mismatch causes CORS and asset loading issues.
- **Mount music as read-only** (`:ro`) — Koel reads but doesn't modify your music files.
- **MariaDB 11** is recommended. MySQL 8.x also works.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Run the initialization command to create the database schema and admin user:

```bash
docker exec -it koel php artisan koel:init --no-interaction
```

2. Create the admin account:

```bash
docker exec -it koel php artisan koel:admin:create
```

Follow the prompts to set the admin email and password.

3. Scan your music library:

```bash
docker exec koel php artisan koel:scan
```

This reads ID3 tags from your music files and indexes them in the database. First scan of a large library (10,000+ tracks) may take several minutes.

4. Open `http://your-server:8050` and log in with the admin credentials you just created.

## Configuration

### Library Scanning

Koel scans your music directory and reads metadata from ID3 tags. Set up automatic scanning:

```bash
# Manual scan
docker exec koel php artisan koel:scan

# Watch for changes (runs in foreground)
docker exec koel php artisan koel:scan --watch
```

For automated periodic scanning, add a cron job on the host:

```bash
# Scan every hour
0 * * * * docker exec koel php artisan koel:scan > /dev/null 2>&1
```

### Smart Playlists

Koel supports rule-based smart playlists:

1. Click **New Playlist** → **Smart Playlist**
2. Define rules:
   - Title/Artist/Album contains/matches
   - Play count greater/less than
   - Last played before/after
   - Genre is/contains
3. Rules can be combined with AND/OR logic

### Last.fm Integration

1. Register a Last.fm API application at https://www.last.fm/api/account/create
2. In Koel's `.env` or environment variables, set:
   ```
   LASTFM_API_KEY=your-lastfm-api-key
   LASTFM_API_SECRET=your-lastfm-api-secret
   ```
3. Restart the container
4. Users can connect their Last.fm accounts in their profile settings

### Spotify Integration

Koel can search and play tracks from Spotify alongside your local library:

1. Create a Spotify Developer application at https://developer.spotify.com/dashboard
2. Set the environment variables:
   ```
   SPOTIFY_CLIENT_ID=your-spotify-client-id
   SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
   ```
3. Restart the container
4. Spotify search results will appear alongside local library results

## Advanced Configuration (Optional)

### Transcoding

Koel uses FFmpeg for on-the-fly transcoding. Configure the transcode bitrate:

```yaml
environment:
  OUTPUT_BIT_RATE: 256  # Bitrate in kbps for transcoded streams
```

This is useful if you store FLAC files but want to stream at a lower bitrate to save bandwidth on mobile connections.

### Storage Backend

By default, Koel reads from a local filesystem. It also supports S3-compatible storage:

```yaml
environment:
  STORAGE_DRIVER: s3
  AWS_ACCESS_KEY_ID: your-access-key
  AWS_SECRET_ACCESS_KEY: your-secret-key
  AWS_ENDPOINT: https://your-s3-endpoint
  AWS_REGION: us-east-1
  AWS_BUCKET: your-music-bucket
```

### Multi-User

Koel supports multiple users. Create additional users via the admin panel or CLI:

```bash
docker exec -it koel php artisan koel:admin:create
```

Each user has their own playlists, favorites, and listening history.

## Reverse Proxy

For Nginx Proxy Manager:

```
Scheme: http
Forward Hostname: koel
Forward Port: 80
WebSocket Support: OFF
```

If serving over HTTPS, set `FORCE_HTTPS=true` and `APP_URL=https://music.yourdomain.com` in the environment variables.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for detailed instructions.

## Backup

Critical data to back up:

- **MariaDB database:** Contains user accounts, playlists, play counts, settings
- **`/var/www/html/public/img/covers/`:** Album artwork cache
- **`/var/www/html/storage/search-indexes/`:** Search index (can be rebuilt)

```bash
# Backup database
docker exec koel-db mysqldump -u koel -p'your-password' koel > koel-backup.sql

# Backup covers
docker cp koel:/var/www/html/public/img/covers ./koel-covers-backup/
```

Your music files are mounted read-only — back them up separately.

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive backup approach.

## Troubleshooting

### "Invalid APP_KEY" or blank page on load

**Symptom:** Koel shows a blank page or Laravel error about encryption keys.
**Fix:** Generate a valid APP_KEY:
```bash
docker run --rm phanan/koel:v8.3.0 php artisan key:generate --show
```
Set this value in your docker-compose environment and restart the container.

### Music not appearing after scan

**Symptom:** Scan completes but library shows no tracks.
**Fix:** Verify the music volume is mounted correctly and the container can read the files:
```bash
docker exec koel ls -la /music/
```
Check that your music files have proper ID3 tags — Koel relies on metadata tags, not filenames.

### Slow library scan

**Symptom:** Scanning 10,000+ files takes very long.
**Fix:** The first scan is always slower as it reads all metadata. Subsequent scans are incremental (only new/changed files). Increase PHP memory if you get out-of-memory errors:
```yaml
environment:
  MEMORY_LIMIT: 1024  # 1 GB
```

### Audio playback stutters or stops

**Symptom:** Tracks start playing then stutter or cut out.
**Fix:** Check network connectivity between browser and server. If behind a reverse proxy, ensure the proxy doesn't timeout on long-lived HTTP connections. Increase the Nginx proxy timeout:
```nginx
proxy_read_timeout 300s;
proxy_send_timeout 300s;
```

## Resource Requirements

- **RAM:** 200-400 MB (Koel + PHP-FPM). Plus 200-400 MB for MariaDB. Total: ~400-800 MB.
- **CPU:** Low for streaming. Moderate during library scans and transcoding.
- **Disk:** Application data is small (~100 MB for covers and search index). Your music library is the main storage consumer.

## Verdict

Koel offers the best web listening experience among self-hosted music servers. Its Spotify-like UI with visualizer, equalizer, and smart playlists makes it feel like a premium music service. The Spotify integration is a unique feature — mixing local and Spotify content in one interface.

The trade-off is heavier resource usage (PHP/Laravel + MariaDB vs Navidrome's single Go binary) and limited mobile app support. There's no Subsonic API, so you're limited to the web UI, PWA, or the paid iOS app ($5). For mobile-first usage with multiple client options, [Navidrome](/apps/navidrome) is the better choice. For the best web experience with your local library, Koel is excellent.

## Frequently Asked Questions

### Does Koel work with Subsonic mobile apps?

No. Koel has its own API and doesn't implement the Subsonic protocol. Mobile options are the web PWA (save to home screen), the paid Koel iOS app, or the web interface in a mobile browser.

### Can I use Koel without Spotify integration?

Yes. Spotify integration is entirely optional. Without it, Koel works as a standalone local music server. Set it up later if you want it.

### How does Koel compare to Navidrome?

Koel has a better web UI and Spotify integration. Navidrome is lighter (10x less RAM), has Subsonic API for mobile apps, and is more actively developed. See our [Koel vs Navidrome](/compare/koel-vs-navidrome) comparison for details.

## Related

- [Koel vs Navidrome](/compare/koel-vs-navidrome)
- [How to Self-Host Navidrome](/apps/navidrome)
- [Navidrome vs Funkwhale](/compare/navidrome-vs-funkwhale)
- [Best Self-Hosted Music Streaming](/best/music-streaming)
- [Replace Spotify](/replace/spotify)
- [Replace Apple Music](/replace/apple-music)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
