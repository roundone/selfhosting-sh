---
title: "How to Self-Host LibrePhotos with Docker"
description: "Complete guide to self-hosting LibrePhotos with Docker Compose — a free, open-source photo management system with face recognition and auto-tagging."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "photo-management"
apps:
  - librephotos
tags: ["self-hosted", "photos", "librephotos", "docker", "google-photos-alternative"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is LibrePhotos?

[LibrePhotos](https://github.com/LibrePhotos/librephotos) is a self-hosted, open-source photo management service with face recognition, auto-tagging, timeline views, and location-based browsing. It's a fork of the discontinued OwnPhotos project, built with a Django backend and React frontend.

LibrePhotos scans your photo library, detects faces, groups them, extracts location data, and provides a clean web interface for browsing everything. It's fully free (MIT license) with no paid tier — every feature is available to everyone. If you want a FOSS-only photo management solution, LibrePhotos is one of the best options.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 4 GB RAM minimum (8 GB recommended for face recognition)
- 10 GB free disk space for application data and ML models, plus storage for your photo library
- A domain name (optional, for remote access)

## Docker Compose Configuration

LibrePhotos runs as four services: a backend (Django API + ML processing), a frontend (React web UI), a PostgreSQL database, and an Nginx proxy that ties everything together.

Create a project directory:

```bash
mkdir -p /opt/librephotos && cd /opt/librephotos
```

Create a `.env` file:

```bash
# /opt/librephotos/.env

# Path to your photo library on the host machine
scanDirectory=/opt/librephotos/pictures

# Internal data storage (thumbnails, cache, ML models)
data=/opt/librephotos/data

# Port to access LibrePhotos web UI
httpPort=3000

# Image tag — use 'latest' for stable or 'dev' for development builds
# LibrePhotos does not publish pinnable semver tags
tag=latest

# Number of API worker processes (increase for more concurrent users)
gunniWorkers=2

# PostgreSQL database settings
dbName=librephotos
dbUser=docker
dbPass=change-this-strong-password
dbHost=db

# CSRF trusted origins — set to your domain if using a reverse proxy
# Example: https://photos.example.com
csrfTrustedOrigins=
```

Create a `docker-compose.yml`:

```yaml
services:
  proxy:
    image: reallibrephotos/librephotos-proxy:${tag}
    container_name: librephotos-proxy
    restart: unless-stopped
    ports:
      - "${httpPort}:80"
    depends_on:
      - backend
      - frontend

  db:
    image: postgres:16-alpine
    container_name: librephotos-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${dbUser}
      POSTGRES_PASSWORD: ${dbPass}
      POSTGRES_DB: ${dbName}
    volumes:
      - librephotos-db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${dbUser} -d ${dbName}"]
      interval: 10s
      timeout: 5s
      retries: 5

  frontend:
    image: reallibrephotos/librephotos-frontend:${tag}
    container_name: librephotos-frontend
    restart: unless-stopped

  backend:
    image: reallibrephotos/librephotos:${tag}
    container_name: librephotos-backend
    restart: unless-stopped
    volumes:
      - ${scanDirectory}:/data:ro
      - ${data}/protected_media:/protected_media
      - ${data}/logs:/logs
      - ${data}/cache:/root/.cache
    environment:
      SECRET_KEY: change-this-to-a-random-64-char-string
      BACKEND_HOST: backend
      ADMIN_EMAIL: admin@example.com
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: change-this-admin-password
      DB_BACKEND: postgresql
      DB_NAME: ${dbName}
      DB_USER: ${dbUser}
      DB_PASS: ${dbPass}
      DB_HOST: ${dbHost}
      DB_PORT: 5432
      MAPBOX_API_KEY: ""
      WEB_CONCURRENCY: ${gunniWorkers}
      SKIP_PATTERNS: ""
      ALLOW_UPLOAD: "true"
      CSRF_TRUSTED_ORIGINS: ${csrfTrustedOrigins}
    depends_on:
      db:
        condition: service_healthy

volumes:
  librephotos-db:
```

Start the stack:

```bash
docker compose up -d
```

First startup takes several minutes as the backend downloads ML models for face recognition and auto-tagging.

## Initial Setup

1. Wait 2-3 minutes for all services to initialize. Check logs with `docker compose logs -f backend`
2. Open `http://your-server:3000` in your browser
3. Log in with the admin credentials you set in the `.env` file (`ADMIN_USERNAME` / `ADMIN_PASSWORD`)
4. Go to **Settings** → **Library** and verify your scan directory is detected
5. Click **Scan Photos** to start indexing your library
6. Face detection and auto-tagging run automatically during the scan

## Configuration

### Adding Photos

Place photos in the directory you configured as `scanDirectory`. LibrePhotos mounts this as read-only (`/data:ro`) — it reads your photos but never modifies originals. Thumbnails and processed data go to the `protected_media` volume.

After adding new photos, trigger a rescan from the web UI or wait for the next scheduled scan.

### User Management

LibrePhotos supports multiple users. Each user can have their own photo scan directory. Create users from **Settings** → **User Management** in the admin panel.

### Map View

To enable the map feature, get a free [Mapbox API key](https://www.mapbox.com/) and set it in `MAPBOX_API_KEY`. Without it, the map view is disabled but everything else works.

### Upload Support

Set `ALLOW_UPLOAD=true` (default) to enable uploading photos through the web UI. Uploaded photos go to the `protected_media` volume, not the scan directory.

## Advanced Configuration

### Hardware-Accelerated Face Detection

LibrePhotos uses CPU-based face detection by default. For GPU acceleration, use the GPU-enabled backend image:

```yaml
  backend:
    image: reallibrephotos/librephotos-gpu:${tag}
    # Add GPU access
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

This requires NVIDIA Container Toolkit installed on the host.

### Increasing Worker Count

For servers with more CPU cores and multiple concurrent users, increase `WEB_CONCURRENCY` (mapped from `gunniWorkers`). A good rule: set it to `(2 * CPU_CORES) + 1`.

## Reverse Proxy

LibrePhotos already includes an Nginx proxy in its stack, so you're proxying to the proxy container's port (default 3000).

Nginx Proxy Manager configuration:
- **Scheme:** `http`
- **Forward Hostname:** `your-server-ip`
- **Forward Port:** `3000`
- Enable SSL with Let's Encrypt
- Set `csrfTrustedOrigins` in `.env` to your full domain URL (e.g., `https://photos.example.com`)

See [Reverse Proxy Setup](/foundations/reverse-proxy) for detailed instructions.

## Backup

Critical data to back up:

- **PostgreSQL database:** `docker compose exec db pg_dump -U docker librephotos > backup.sql`
- **Protected media:** The `${data}/protected_media` directory contains thumbnails and processed data
- **Original photos:** Your `scanDirectory` — this is your most important data
- **Environment file:** `.env` and `docker-compose.yml`

The ML models and cache can be regenerated from a rescan, so they're lower priority for backup.

See [Backup Strategy](/foundations/backup-strategy) for a comprehensive backup approach.

## Troubleshooting

### Backend container keeps restarting

**Symptom:** `docker compose ps` shows the backend in a restart loop.
**Fix:** Check logs with `docker compose logs backend`. Common causes:
- Database not ready yet — wait 30 seconds and check again
- Invalid `SECRET_KEY` — must be a non-empty string
- Database password mismatch — ensure `.env` values match across services

### Photos not appearing after scan

**Symptom:** Scan completes but no photos show in the UI.
**Fix:** Verify the scan directory contains supported formats (JPEG, PNG, HEIC, RAW). Check that the volume mount path is correct and the backend container can read the files: `docker compose exec backend ls /data/`

### Face detection not working

**Symptom:** Photos indexed but no faces detected.
**Fix:** Face detection requires ML models to download on first run. Check `docker compose logs backend` for download progress. Ensure the container has internet access. Allow 5-10 minutes on first startup.

### Out of memory during scan

**Symptom:** Backend container killed during large library scan.
**Fix:** Increase Docker memory limit or add swap space. LibrePhotos needs 4 GB+ RAM for face detection on large libraries. Add 4 GB swap: `sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`

### CSRF errors when accessing via domain

**Symptom:** "Forbidden (403) CSRF verification failed" when logging in.
**Fix:** Set `csrfTrustedOrigins` in `.env` to your full URL including protocol: `https://photos.example.com`. Restart the stack.

## Resource Requirements

- **RAM:** ~1 GB idle, 2-4 GB during face detection and indexing
- **CPU:** Low idle, high during scanning (ML inference is CPU-intensive)
- **Disk:** ~5 GB for ML models and application data, plus your photo library
- **Network:** Only needed for initial ML model download and optional Mapbox tiles

## Verdict

LibrePhotos is a solid choice for users who want a fully open-source, no-paid-tier photo management solution with face recognition and auto-tagging. It does the basics well: scan a library, detect faces, browse by timeline and location.

However, it trails behind [Immich](/apps/immich) in features (no native mobile app, no auto-upload, no CLIP search) and behind [PhotoPrism](/apps/photoprism) in maturity and polish. Development has slowed — the last major release was late 2025. If you specifically value the MIT license and fully FOSS approach, LibrePhotos delivers. If you want the most features or the most active development, Immich is the better pick.

**Recommended for:** Users who prioritize fully open-source software with no paid tiers. Users with existing libraries who want face grouping and timeline browsing without the complexity of Immich's multi-service stack.

## FAQ

### How does LibrePhotos compare to Immich?

Immich has native mobile apps, auto-upload, CLIP-based smart search, and much faster development. LibrePhotos has a simpler architecture and is fully MIT-licensed with no paid tier. For most users, Immich is the better choice. See our [Immich vs LibrePhotos comparison](/compare/immich-vs-librephotos).

### Does LibrePhotos modify my original photos?

No. The scan directory is mounted read-only (`:ro`). LibrePhotos reads EXIF data and generates thumbnails, but originals are never touched.

### Can I upload photos through the web UI?

Yes, set `ALLOW_UPLOAD=true` in the backend environment. Uploaded photos go to the `protected_media` volume, separate from your scan directory.

### Does it support RAW files?

Yes. LibrePhotos supports JPEG, PNG, HEIC, and common RAW formats (CR2, NEF, ARW, DNG). RAW processing may be slower than JPEG.

### Can multiple users share the same library?

Yes. You can create multiple users and assign each user a scan directory. Users can share the same directory or have separate ones.

## Related

- [Immich vs LibrePhotos](/compare/immich-vs-librephotos)
- [PhotoPrism vs LibrePhotos](/compare/photoprism-vs-librephotos)
- [Self-Hosted Google Photos Alternatives](/replace/google-photos)
- [Best Self-Hosted Photo Management](/best/photo-management)
- [How to Self-Host Immich](/apps/immich)
- [How to Self-Host PhotoPrism](/apps/photoprism)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
- [Backup Strategy](/foundations/backup-strategy)
