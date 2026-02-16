---
title: "How to Self-Host Photoview with Docker Compose"
description: "Step-by-step guide to self-hosting Photoview with Docker Compose — a lightweight, fast photo gallery with face detection and map view."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "photo-management"
apps:
  - photoview
tags: ["self-hosted", "photoview", "photos", "docker", "gallery"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Photoview?

[Photoview](https://photoview.github.io/) is a lightweight, self-hosted photo gallery designed to organize and browse existing photo libraries on your filesystem. It scans directories, generates thumbnails, detects faces, reads EXIF data for map views, and presents everything in a clean, fast web UI. It's built for people who already have photos organized in folders and want a gallery layer on top — without moving or duplicating files.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB RAM minimum (2 GB recommended for face detection)
- Disk space for your photo library plus ~20% for thumbnail cache
- A domain name (optional, for remote access)

## Docker Compose Configuration

Photoview needs a database backend. MariaDB is the recommended and best-supported option. SQLite is available for small libraries but lacks performance at scale.

Create a project directory:

```bash
mkdir -p /opt/photoview && cd /opt/photoview
```

Create a `docker-compose.yml`:

```yaml
services:
  photoview:
    image: photoview/photoview:2.4.0
    container_name: photoview
    ports:
      - "8200:80"
    environment:
      # Database connection — must match the MariaDB credentials below
      - PHOTOVIEW_DATABASE_DRIVER=mysql
      - PHOTOVIEW_MYSQL_URL=photoview:change-this-db-password@tcp(photoview-db:3306)/photoview
      # REQUIRED: Photoview must listen on 0.0.0.0, not 127.0.0.1
      - PHOTOVIEW_LISTEN_IP=0.0.0.0
      - PHOTOVIEW_LISTEN_PORT=80
      # Media cache — where thumbnails and converted media are stored
      - PHOTOVIEW_MEDIA_CACHE=/app/cache
      # Enable face detection (uses ~500 MB extra RAM during scan)
      - PHOTOVIEW_FACE_RECOGNITION_ENABLED=1
    volumes:
      # Thumbnail and media cache
      - photoview-cache:/app/cache
      # Your photo library — mount as read-only since Photoview doesn't modify originals
      - /path/to/your/photos:/photos:ro
    depends_on:
      photoview-db:
        condition: service_healthy
    restart: unless-stopped

  photoview-db:
    image: mariadb:10.11
    container_name: photoview-db
    restart: unless-stopped
    environment:
      # CHANGE THESE — use strong passwords
      - MYSQL_ROOT_PASSWORD=change-this-root-password
      - MYSQL_DATABASE=photoview
      - MYSQL_USER=photoview
      - MYSQL_PASSWORD=change-this-db-password
    volumes:
      - photoview-db:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s

volumes:
  photoview-cache:
  photoview-db:
```

**Important:** Change `/path/to/your/photos` to your actual photo directory. Update both database passwords (they must match between the `PHOTOVIEW_MYSQL_URL` and `MYSQL_PASSWORD`).

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Wait for both containers to be healthy: `docker compose ps`
2. Open `http://your-server:8200` in a browser
3. Create your admin account on the first-run screen
4. Add your photo directory:
   - Go to **Settings** → **Users** → click your user
   - Under **Photo paths**, add `/photos` (the container path)
5. Photoview begins scanning automatically — thumbnails generate in the background
6. Face detection runs as a separate pass after thumbnail generation

**Note:** The initial scan can take significant time on large libraries. A 50,000 photo library takes roughly 1-2 hours depending on hardware.

## Configuration

### Photo Library Structure

Photoview reads your existing directory structure as albums. No reorganization needed:

```
/photos/
  ├── 2024/
  │   ├── January/
  │   │   ├── IMG_0001.jpg
  │   │   └── IMG_0002.jpg
  │   └── February/
  ├── Vacations/
  │   ├── Italy 2023/
  │   └── Japan 2024/
  └── Family/
```

Each directory becomes an album. Nested directories become nested albums. Photoview reads EXIF metadata from your files for dates, locations, and camera info.

### Supported Formats

Photoview supports JPEG, PNG, GIF, TIFF, BMP, and WebP for images. RAW formats (CR2, NEF, ARW, DNG, and others) are supported via LibRaw — RAW files are converted to JPEG thumbnails during scanning.

Video support includes MP4, MOV, AVI, and WebM. Photoview uses FFmpeg for video thumbnails and transcoding.

### Multi-User Setup

Photoview supports multiple users, each with their own photo paths. Useful for families:

- Go to **Settings** → **Users** → **Add User**
- Assign each user their own photo directories
- Users only see photos from their assigned paths
- Albums can be shared between users via sharing links

### Face Detection

Face detection is enabled by default with `PHOTOVIEW_FACE_RECOGNITION_ENABLED=1`. After the initial scan:

1. Go to the **People** tab in the sidebar
2. Photoview shows detected face clusters
3. Label each person by clicking their face group
4. Merge duplicate groups by selecting faces and clicking **Merge**

Face detection uses ~500 MB of additional RAM during scanning. On low-memory systems, disable it by setting the environment variable to `0`.

### Map View

Photoview automatically shows geotagged photos on a map. No configuration needed — if your photos have GPS coordinates in EXIF data, the map populates automatically. Access it from the **Places** tab in the sidebar.

## Reverse Proxy

Forward traffic to port 8200 (or whatever port you mapped).

### Nginx Proxy Manager

- **Scheme:** `http`
- **Forward Hostname:** `your-server-ip`
- **Forward Port:** `8200`
- Enable SSL with Let's Encrypt

### Caddy

```
photos.yourdomain.com {
    reverse_proxy localhost:8200
}
```

See [Reverse Proxy Setup](/foundations/reverse-proxy) for detailed instructions.

## Backup

Critical data to back up:

- **Media cache volume:** `photoview-cache` — contains all generated thumbnails. Can be regenerated but takes time.
- **MariaDB database:** Contains album structure, user accounts, face detection data, and scan metadata.
- **Photo originals:** Your source photo directory. This is the most important data.

```bash
# Database backup
docker compose exec photoview-db mysqldump -u photoview -p photoview > photoview-db-backup-$(date +%Y%m%d).sql

# Cache backup (optional — can be regenerated)
docker run --rm -v photoview-cache:/data -v $(pwd):/backup alpine tar czf /backup/photoview-cache-$(date +%Y%m%d).tar.gz /data
```

See [Backup Strategy](/foundations/backup-strategy) for a comprehensive backup approach.

## Troubleshooting

### Photoview can't connect to database

**Symptom:** Container crashes with MySQL connection errors on startup.
**Fix:** Verify that `PHOTOVIEW_MYSQL_URL` matches your database credentials exactly. The format is `user:password@tcp(hostname:port)/database`. Ensure the database container is healthy before Photoview starts — the `depends_on` with health check handles this, but verify with `docker compose ps`.

### Photos not appearing after scan

**Symptom:** Scan completes but albums are empty.
**Fix:** Check that the photo path is correctly assigned to your user under **Settings** → **Users**. The path must match the container mount (`/photos`, not the host path). Also verify file permissions — run `docker compose exec photoview ls /photos/` to confirm the container can read your files.

### Face detection not working

**Symptom:** People tab is empty even after full scan.
**Fix:** Ensure `PHOTOVIEW_FACE_RECOGNITION_ENABLED=1` is set. Face detection runs as a second pass after thumbnail generation — it won't start until the initial scan completes. Check container logs: `docker compose logs photoview | grep -i face`.

### High memory usage during scanning

**Symptom:** Server runs out of memory during initial scan.
**Fix:** Face detection is the primary memory consumer. If your server has less than 2 GB RAM, disable face detection (`PHOTOVIEW_FACE_RECOGNITION_ENABLED=0`). You can re-enable it later and trigger a re-scan.

### RAW files not displaying

**Symptom:** RAW photos (CR2, NEF, ARW) don't show thumbnails.
**Fix:** Photoview uses LibRaw and Darktable for RAW processing. If RAW thumbnails aren't generating, check the container logs for processing errors. Some uncommon RAW formats may not be supported. Ensure you're using the official Docker image, which includes all necessary libraries.

## Resource Requirements

- **RAM:** ~300 MB idle, 800 MB–1.5 GB during scanning with face detection
- **CPU:** Moderate during scanning (thumbnail generation + face detection). Low at idle.
- **Disk:** ~20% of your photo library size for the thumbnail cache. The application itself is under 100 MB.

## Verdict

Photoview is the best lightweight gallery for people who already have organized photo directories. It doesn't try to be a Google Photos replacement — there's no mobile upload, no AI-powered search, no sharing ecosystem. What it does instead is present your existing photo collection beautifully with face detection, map views, and fast browsing. It's read-only by design, which means it never touches your originals.

Choose Photoview if you have a NAS full of photos and want a clean web gallery on top. For a full Google Photos replacement with mobile upload and AI search, use [Immich](/apps/immich). For a smart indexing tool for large existing libraries, use [PhotoPrism](/apps/photoprism). For a simple sharing-focused gallery, use [Lychee](/apps/lychee).

## FAQ

### How does Photoview compare to Immich?

Immich is a full Google Photos replacement with mobile apps, auto-upload, and AI search. Photoview is a read-only gallery viewer for existing photo collections. They solve different problems. If you want to actively manage and upload photos, use Immich. If you have photos on a NAS and just want to browse them, Photoview is lighter and simpler.

### Can Photoview handle large libraries?

Yes. Photoview handles libraries of 100,000+ photos well. The initial scan takes time (expect 1-2 hours for 50K photos), but browsing is fast once thumbnails are generated. The database-driven approach scales better than filesystem-based galleries.

### Does Photoview modify my original files?

No. Photoview is strictly read-only. It generates thumbnails and stores metadata in the database, but never modifies, moves, or deletes your original photos. Mount your photo directory as read-only (`:ro`) for extra safety.

### Can I use SQLite instead of MariaDB?

Yes. Set `PHOTOVIEW_DATABASE_DRIVER=sqlite` and `PHOTOVIEW_SQLITE_PATH=/app/database/photoview.db`. SQLite works for small libraries (under 10,000 photos) but MariaDB performs better at scale and is the recommended option.

### Is there a mobile app?

No native app. The web UI is responsive and works well on mobile browsers. You can add it to your home screen as a PWA for an app-like experience.

## Related

- [How to Self-Host Immich](/apps/immich)
- [How to Self-Host PhotoPrism](/apps/photoprism)
- [How to Self-Host Lychee](/apps/lychee)
- [How to Self-Host Piwigo](/apps/piwigo)
- [Immich vs PhotoPrism](/compare/immich-vs-photoprism)
- [Best Self-Hosted Photo Management](/best/photo-management)
- [Self-Hosted Google Photos Alternatives](/replace/google-photos)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
- [Backup Strategy](/foundations/backup-strategy)
