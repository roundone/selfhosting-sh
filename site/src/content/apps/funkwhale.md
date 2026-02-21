---
title: "How to Self-Host Funkwhale with Docker Compose"
description: "Step-by-step guide to self-hosting Funkwhale with Docker Compose — a federated music server with ActivityPub, playlists, and podcast support."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "media-servers"
apps: ["funkwhale"]
tags: ["self-hosted", "funkwhale", "docker", "music", "fediverse", "spotify-alternative"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Funkwhale?

[Funkwhale](https://funkwhale.audio/) is a self-hosted, federated music server. It lets you upload your music library, stream it from any device, create playlists, and — uniquely — share music across instances using ActivityPub (the same protocol behind Mastodon). It also supports podcast subscriptions. Think of it as a self-hosted Spotify for your own music collection, with social features built in.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 2 GB of RAM minimum (4 GB recommended)
- A dedicated domain or subdomain (e.g., `music.example.com`) — Funkwhale cannot run in a subdirectory
- Ports 80 and 443 accessible (required for federation)
- A domain name with DNS configured

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/funkwhale && cd /opt/funkwhale
```

Create a `.env` file:

```bash
# REQUIRED: Your Funkwhale domain (no protocol, no trailing slash)
FUNKWHALE_HOSTNAME=music.example.com

# REQUIRED: Secret key for Django (generate with: openssl rand -base64 45)
DJANGO_SECRET_KEY=CHANGE_ME_GENERATE_WITH_OPENSSL

# Database credentials
POSTGRES_USER=funkwhale
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD
POSTGRES_DB=funkwhale

# Optional: Federation (enabled by default)
# FUNKWHALE_DISABLE_FEDERATION=false

# Optional: Signup (disabled by default)
# FUNKWHALE_OPEN_REGISTRATIONS=false
```

**Generate the secret key:**

```bash
openssl rand -base64 45
```

Create a `docker-compose.yml` file:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: funkwhale-db
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - funkwhale-db:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: funkwhale-redis
    volumes:
      - funkwhale-redis:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    image: funkwhale/api:1.4.0
    container_name: funkwhale-api
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      - FUNKWHALE_HOSTNAME=${FUNKWHALE_HOSTNAME}
      - DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - CACHE_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/0
      # Reverse proxy settings
      - FUNKWHALE_PROTOCOL=https
      - NESTED_PROXY=1
    volumes:
      # Music library
      - /path/to/music:/srv/funkwhale/data/music:ro
      # Uploaded content and media
      - funkwhale-media:/srv/funkwhale/data/media
      # Static files
      - funkwhale-static:/srv/funkwhale/data/static
    restart: unless-stopped

  frontend:
    image: funkwhale/frontend:1.4.0
    container_name: funkwhale-frontend
    depends_on:
      - api
    environment:
      - FUNKWHALE_API_HOST=api
      - FUNKWHALE_API_PORT=5000
    ports:
      # Web UI (put behind a reverse proxy for HTTPS)
      - "5000:80"
    volumes:
      - funkwhale-static:/usr/share/nginx/html/staticfiles:ro
    restart: unless-stopped

volumes:
  funkwhale-db:
  funkwhale-redis:
  funkwhale-media:
  funkwhale-static:
```

Replace `/path/to/music` with the actual path to your music library.

Run database migrations before first start:

```bash
docker compose run --rm api funkwhale-manage migrate
```

Create your admin (superuser) account:

```bash
docker compose run --rm api funkwhale-manage fw users create --superuser
```

Follow the prompts to set username, email, and password.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:5000` (or your domain with HTTPS configured)
2. Log in with the superuser account you created
3. Go to **Settings** → **Libraries** → **Create a library**
4. Add a new music folder pointing to `/srv/funkwhale/data/music`
5. Trigger a library scan to import your music

Funkwhale reads ID3 tags from your files for metadata. Ensure your music files are properly tagged before importing.

## Configuration

### Music Import

Funkwhale imports music by reading ID3/Vorbis tags. It supports:
- MP3, FLAC, OGG, OPUS, AAC, M4A, WAV
- Automatic album art extraction from file tags
- Artist, album, track metadata from tags

### Federation

Funkwhale federates with other Funkwhale instances (and technically with Mastodon/Pleroma) via ActivityPub. Users on other instances can follow your libraries, listen to shared tracks, and interact with your content.

To enable federation, ensure ports 80 and 443 are open and your domain has valid HTTPS. Federation is enabled by default.

### Podcasts

Funkwhale doubles as a podcast player. Users can subscribe to podcast RSS feeds directly in the web UI. Episodes are streamed, not downloaded.

## Advanced Configuration (Optional)

### Subsonic API Compatibility

Funkwhale supports the Subsonic API, which means it works with Subsonic-compatible mobile apps like DSub (Android) and play:Sub (iOS). Enable it in your Funkwhale settings — no additional configuration needed.

### S3 Storage

For large music libraries, Funkwhale supports S3-compatible storage backends (MinIO, Wasabi, AWS S3) for media files. Set `AWS_*` environment variables in the API service.

## Reverse Proxy

Funkwhale requires HTTPS for federation. Example Nginx Proxy Manager setup:

- **Scheme:** `http`
- **Forward Hostname:** `funkwhale-frontend` (or your server IP)
- **Forward Port:** `5000` (the frontend's mapped port)
- **SSL:** Enable Let's Encrypt
- **WebSocket Support:** Enable

**Important:** Funkwhale must run on a dedicated domain or subdomain. It does not support subdirectory installations (e.g., `example.com/funkwhale` will not work).

For other reverse proxy options, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

## Backup

Critical data to back up:

1. **PostgreSQL database:**
```bash
docker compose exec postgres pg_dump -U funkwhale funkwhale > funkwhale-db-$(date +%Y%m%d).sql
```

2. **Media volume** (uploaded content, album art):
```bash
docker run --rm -v funkwhale-media:/data -v $(pwd):/backup alpine tar czf /backup/funkwhale-media-$(date +%Y%m%d).tar.gz -C /data .
```

3. **Your music library** — back up as part of your general storage strategy

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a comprehensive approach.

## Troubleshooting

### Music files not appearing after scan

**Symptom:** Library scan completes but some or all tracks are missing.
**Fix:** Funkwhale reads ID3 tags, not filenames. Files without proper tags won't import. Use a tagger like MusicBrainz Picard to fix tags:
```bash
# Check if files have tags
docker compose exec api python -c "import mutagen; print(mutagen.File('/srv/funkwhale/data/music/path/to/file.mp3').tags)"
```

### Federation not working

**Symptom:** Other instances can't find your server.
**Fix:** Verify HTTPS is configured correctly and `FUNKWHALE_HOSTNAME` matches your actual domain. Check that `/.well-known/webfinger` returns a valid response:
```bash
curl https://music.example.com/.well-known/webfinger?resource=acct:admin@music.example.com
```

### High memory usage

**Symptom:** The API container uses excessive RAM.
**Fix:** Funkwhale's API (Django + Celery) can use 500 MB-1 GB under load. If memory is tight, limit Celery workers:
```yaml
environment:
  - CELERYD_CONCURRENCY=2
```

### Database connection errors on startup

**Symptom:** API fails with "could not connect to server."
**Fix:** The `depends_on` with healthcheck should handle this. If it persists, increase the healthcheck retries or add a delay:
```yaml
api:
  depends_on:
    postgres:
      condition: service_healthy
```

## Resource Requirements

- **RAM:** 1-2 GB for the full stack (API + PostgreSQL + Redis + Frontend)
- **CPU:** Low-Medium (transcoding increases CPU usage)
- **Disk:** Database ~100 MB, plus your music library size
- **Network:** Ports 80/443 required for federation

## Verdict

Funkwhale is the most feature-rich self-hosted music server if you want social/federation features. The ActivityPub integration, podcast support, and Subsonic API compatibility make it uniquely versatile.

The trade-off is complexity. Four containers, a required dedicated domain, and federation configuration make Funkwhale heavier to set up and run than [Navidrome](/apps/navidrome/), which is a simpler, lighter alternative for pure music streaming. If you just want to play your music collection with a clean UI, Navidrome is the better fit. If you want a social music platform with federation, Funkwhale is the only self-hosted option.

## FAQ

### How is Funkwhale different from Navidrome?

Navidrome is a lightweight music streamer — it plays your files with a clean UI. Funkwhale adds federation (share music across instances), podcast support, user channels, and social features. Navidrome is simpler; Funkwhale is more ambitious.

### Can I use Funkwhale with mobile apps?

Yes. Funkwhale supports the Subsonic API, so it works with DSub (Android), play:Sub (iOS), Ultrasonic, and other Subsonic-compatible apps. The web UI also works well on mobile browsers.

### Does Funkwhale transcode music?

Yes. Funkwhale can transcode on-the-fly for streaming at lower bitrates. This uses CPU — if you're on low-power hardware, consider pre-transcoding your library or streaming at original quality.

## Related

- [Funkwhale vs Navidrome](/compare/funkwhale-vs-navidrome/)
- [How to Self-Host Navidrome](/apps/navidrome/)
- [How to Self-Host Jellyfin](/apps/jellyfin/)
- [Navidrome vs Jellyfin](/compare/navidrome-vs-jellyfin/)
- [Self-Hosted Spotify Alternatives](/replace/spotify/)
- [Best Self-Hosted Media Servers](/best/media-servers/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
