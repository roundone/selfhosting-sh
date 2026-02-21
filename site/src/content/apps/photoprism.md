---
title: "How to Self-Host PhotoPrism with Docker"
description: "Set up PhotoPrism with Docker Compose and MariaDB for AI-powered photo management with face recognition and smart search."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "photo-management"
apps:
  - photoprism
tags:
  - self-hosted
  - photos
  - photoprism
  - docker
  - google-photos-alternative
  - ai
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is PhotoPrism?

[PhotoPrism](https://www.photoprism.app) is a self-hosted photo management application with AI-powered features including facial recognition, object classification, location mapping, and smart search. It indexes your existing photo library and provides a polished web interface for browsing, searching, and sharing. PhotoPrism is a strong alternative to Google Photos for users who want AI features without cloud dependency. It supports RAW files, videos, live photos, and panoramas.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 4 GB of RAM minimum (AI features are memory-hungry)
- At least 4 GB of swap space (required for indexing RAW files and panoramas)
- Storage for your photo library plus ~50% extra for thumbnails and cache
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a directory and `docker-compose.yml`:

```bash
mkdir -p ~/photoprism && cd ~/photoprism
```

```yaml
services:
  photoprism:
    image: photoprism/photoprism:251130-b3068414c
    container_name: photoprism
    restart: unless-stopped
    stop_grace_period: 15s
    depends_on:
      - mariadb
    security_opt:
      - seccomp:unconfined
      - apparmor:unconfined
    ports:
      - "2342:2342"
    environment:
      # Admin credentials
      PHOTOPRISM_ADMIN_USER: "admin"
      PHOTOPRISM_ADMIN_PASSWORD: "change-this-min-8-chars"  # Minimum 8 characters
      PHOTOPRISM_AUTH_MODE: "password"
      # Site
      PHOTOPRISM_SITE_URL: "http://localhost:2342/"  # Change to your domain
      PHOTOPRISM_SITE_TITLE: "PhotoPrism"
      # Database
      PHOTOPRISM_DATABASE_DRIVER: "mysql"  # Use "mysql" for MariaDB
      PHOTOPRISM_DATABASE_SERVER: "mariadb:3306"
      PHOTOPRISM_DATABASE_NAME: "photoprism"
      PHOTOPRISM_DATABASE_USER: "photoprism"
      PHOTOPRISM_DATABASE_PASSWORD: "change-this-db-password"  # Must match MariaDB
      # Features
      PHOTOPRISM_DISABLE_TLS: "true"       # Disable if behind a reverse proxy
      PHOTOPRISM_DEFAULT_TLS: "false"
      PHOTOPRISM_HTTP_COMPRESSION: "gzip"
      PHOTOPRISM_LOG_LEVEL: "info"
      PHOTOPRISM_READONLY: "false"
      PHOTOPRISM_EXPERIMENTAL: "false"
      PHOTOPRISM_DISABLE_WEBDAV: "false"
      PHOTOPRISM_DISABLE_TENSORFLOW: "false"
      PHOTOPRISM_DISABLE_FACES: "false"
      PHOTOPRISM_DISABLE_CLASSIFICATION: "false"
      PHOTOPRISM_DISABLE_RAW: "false"
      PHOTOPRISM_SIDECAR_YAML: "true"
      PHOTOPRISM_DETECT_NSFW: "false"
      # Indexing
      PHOTOPRISM_AUTO_INDEX: 300          # Re-index every 5 minutes
      PHOTOPRISM_AUTO_IMPORT: -1          # Disable auto-import (-1)
      PHOTOPRISM_ORIGINALS_LIMIT: 5000    # Max file size in MB
      PHOTOPRISM_UPLOAD_LIMIT: 5000       # Max upload size in MB
      # Backups
      PHOTOPRISM_BACKUP_ALBUMS: "true"
      PHOTOPRISM_BACKUP_DATABASE: "true"
      PHOTOPRISM_BACKUP_SCHEDULE: "daily"
      # Initialization
      PHOTOPRISM_INIT: "https tensorflow"
    working_dir: "/photoprism"
    volumes:
      - /path/to/photos:/photoprism/originals    # Your photo library
      - photoprism-storage:/photoprism/storage    # Config, cache, thumbnails
      # Optional: import staging folder
      # - /path/to/import:/photoprism/import

  mariadb:
    image: mariadb:11
    container_name: photoprism-db
    restart: unless-stopped
    stop_grace_period: 15s
    security_opt:
      - seccomp:unconfined
      - apparmor:unconfined
    command: >-
      --innodb-buffer-pool-size=512M
      --transaction-isolation=READ-COMMITTED
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --max-connections=512
      --innodb-rollback-on-timeout=OFF
      --innodb-lock-wait-timeout=120
    volumes:
      - photoprism-db:/var/lib/mysql
    environment:
      MARIADB_AUTO_UPGRADE: "1"
      MARIADB_INITDB_SKIP_TZINFO: "1"
      MARIADB_DATABASE: "photoprism"
      MARIADB_USER: "photoprism"
      MARIADB_PASSWORD: "change-this-db-password"  # Must match PhotoPrism
      MARIADB_ROOT_PASSWORD: "change-this-root-password"

volumes:
  photoprism-storage:
  photoprism-db:
```

**Important:**
- Replace `/path/to/photos` with the actual path to your photo library
- Change all passwords. `PHOTOPRISM_DATABASE_PASSWORD` must match `MARIADB_PASSWORD`
- `PHOTOPRISM_ADMIN_PASSWORD` must be at least 8 characters
- MariaDB passwords cannot be changed after first initialization. If you need to change them, delete the database volume and start fresh
- Dollar signs (`$`) in passwords must be escaped as `$$` in YAML

**Note on version pinning:** PhotoPrism does not publish semver tags on Docker Hub. The `:latest` tag points to the current stable release (build 251130-b3068414c as of November 2025). This is the officially recommended tag.

Ensure you have at least 4 GB of swap:

```bash
# Check current swap
free -h

# If swap is less than 4 GB, add more
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

Start the stack:

```bash
docker compose up -d
```

The first startup is slower — PhotoPrism downloads TLS certificates and TensorFlow models as part of `PHOTOPRISM_INIT`.

## Initial Setup

1. Open PhotoPrism at `http://your-server-ip:2342`
2. Log in with username `admin` and the password you set in `PHOTOPRISM_ADMIN_PASSWORD`
3. Go to **Library** and click **Start** to index your originals folder
4. Wait for indexing to complete — this can take hours for large libraries (it's hashing every file with SHA-1 and running AI classification)
5. Browse your library. Face recognition clusters appear automatically after indexing.

## Configuration

### Adding Photos

Three ways to add photos:

1. **Mount a volume** — add photos directly to the host path mounted at `/photoprism/originals`. PhotoPrism auto-indexes every 5 minutes (configurable via `PHOTOPRISM_AUTO_INDEX`).
2. **Web upload** — drag and drop in the web UI
3. **WebDAV** — connect via WebDAV client at `http://your-server:2342/originals/`. Use your PhotoPrism credentials.

### Multiple Photo Directories

Mount additional directories as subdirectories of originals:

```yaml
volumes:
  - /path/to/photos:/photoprism/originals
  - /path/to/more-photos:/photoprism/originals/more-photos
  - /path/to/phone-backup:/photoprism/originals/phone
```

### Import Folder

Enable the import folder for batch processing. Photos placed here get organized by year/month and moved to originals:

```yaml
volumes:
  - /path/to/import:/photoprism/import
environment:
  PHOTOPRISM_AUTO_IMPORT: 300  # Check every 5 minutes
```

**Never place the import folder inside originals** — this creates an indexing loop.

### Read-Only Mode

Prevent PhotoPrism from modifying your originals:

```yaml
environment:
  PHOTOPRISM_READONLY: "true"
```

Or use a read-only volume mount: `/path/to/photos:/photoprism/originals:ro`

### Disabling AI Features

To reduce resource usage on low-powered hardware:

```yaml
environment:
  PHOTOPRISM_DISABLE_TENSORFLOW: "true"
  PHOTOPRISM_DISABLE_FACES: "true"
  PHOTOPRISM_DISABLE_CLASSIFICATION: "true"
```

## Advanced Configuration (Optional)

### Hardware Transcoding

#### Intel Quick Sync

```yaml
services:
  photoprism:
    # ... existing config ...
    environment:
      PHOTOPRISM_FFMPEG_ENCODER: "intel"
      PHOTOPRISM_INIT: "intel https tensorflow"
    devices:
      - "/dev/dri:/dev/dri"
```

#### NVIDIA GPU

```yaml
services:
  photoprism:
    # ... existing config ...
    environment:
      PHOTOPRISM_FFMPEG_ENCODER: "nvidia"
      NVIDIA_VISIBLE_DEVICES: "all"
      NVIDIA_DRIVER_CAPABILITIES: "all"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```

Requires the NVIDIA Container Toolkit installed on the host.

### Running as Non-Root

PhotoPrism supports specific UID/GID ranges:

```yaml
environment:
  PHOTOPRISM_UID: "1000"
  PHOTOPRISM_GID: "1000"
```

Supported ranges: 0, 33, 50-99, 500-600, 900-1250, 2000-2100. Ensure file permissions match.

## Reverse Proxy

With [Nginx Proxy Manager](/apps/nginx-proxy-manager):

1. Add a proxy host for `photos.yourdomain.com` → `http://photoprism:2342`
2. Enable SSL
3. Enable WebSocket support
4. Update `PHOTOPRISM_SITE_URL` to `https://photos.yourdomain.com/`
5. Set `PHOTOPRISM_DISABLE_TLS: "true"` to avoid double TLS termination

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for details.

## Backup

PhotoPrism has built-in daily backups (`PHOTOPRISM_BACKUP_SCHEDULE: "daily"`), stored in `/photoprism/storage/backup/`. Additionally:

```bash
# Database backup
docker compose exec mariadb mysqldump -u photoprism -p'your-password' photoprism > photoprism-db-backup.sql

# Storage backup (config, cache, thumbnails, backups)
docker compose stop
docker run --rm -v photoprism-storage:/storage -v $(pwd):/backup alpine tar czf /backup/photoprism-storage-backup.tar.gz /storage
docker compose start
```

Your originals are the most critical data — back them up separately with your regular backup strategy. The storage volume contains thumbnails (regenerable), sidecar files, and the built-in backups. See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### PhotoPrism killed during indexing

**Symptom:** Container stops or restarts during photo indexing

**Fix:** Insufficient memory or swap. PhotoPrism needs at least 4 GB of swap for indexing RAW files and panoramas:
```bash
free -h  # Check current swap
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
```

Also ensure Docker has at least 4 GB memory allocated (relevant for Docker Desktop; Linux native Docker uses all available memory).

### Faces not detected

**Symptom:** No face clusters appear after indexing

**Fix:** Verify TensorFlow is enabled and initialized:
1. Check `PHOTOPRISM_DISABLE_FACES` is `"false"`
2. Check `PHOTOPRISM_DISABLE_TENSORFLOW` is `"false"`
3. Ensure `PHOTOPRISM_INIT` includes `"tensorflow"`
4. Face recognition runs during indexing — re-index if needed

### Slow initial indexing

**Symptom:** Indexing takes days for a large library

**Fix:** This is normal for large libraries. PhotoPrism hashes every file and runs AI classification on each image. Speed up with:
- Hardware transcoding for videos (Intel Quick Sync or NVIDIA)
- SSD for the storage volume (thumbnails are I/O-intensive)
- More RAM (reduces swap usage during indexing)

### WebDAV not working

**Symptom:** Cannot connect to WebDAV endpoint

**Fix:**
1. Verify `PHOTOPRISM_DISABLE_WEBDAV` is `"false"`
2. WebDAV often requires HTTPS. If behind a reverse proxy, ensure TLS is configured
3. Check the WebDAV URL: `https://your-domain/originals/`

### Database connection failed

**Symptom:** PhotoPrism can't connect to MariaDB on startup

**Fix:** MariaDB may not be ready yet. Wait 30-60 seconds and restart PhotoPrism:
```bash
docker compose restart photoprism
```

Verify MariaDB is healthy:
```bash
docker compose logs mariadb | tail -20
```

## Resource Requirements

- **RAM:** 1 GB idle (with TensorFlow loaded), 2-4 GB during indexing
- **CPU:** Low during browsing. High during initial indexing and AI classification. Hardware transcoding offloads video processing.
- **Disk:** ~200 MB for the application, plus thumbnails (~50% of originals size for large libraries) and cache

## Frequently Asked Questions

### Is PhotoPrism free?

PhotoPrism is open source under the AGPL-3.0 license. All features are available for free. An optional "Essentials" membership supports development and provides early access to new features.

### Can I run PhotoPrism on a Raspberry Pi?

The Pi 4 with 4 GB RAM can run PhotoPrism, but indexing is very slow and face recognition is limited. An Intel N100 mini PC provides dramatically better performance for AI features.

### How does PhotoPrism compare to Immich?

[Immich](/apps/immich) is designed as a mobile-first Google Photos replacement with native apps and automatic backup. PhotoPrism focuses on indexing and managing an existing library. Use Immich if mobile auto-upload is critical. Use PhotoPrism if you have an existing library you want to organize with AI. See our [Immich vs PhotoPrism comparison](/compare/immich-vs-photoprism).

### Can PhotoPrism use SQLite instead of MariaDB?

Yes. Set `PHOTOPRISM_DATABASE_DRIVER: "sqlite"` and remove the MariaDB service. SQLite works for small libraries but is slower for large collections and doesn't support concurrent access well. MariaDB is recommended for production use.

## Verdict

PhotoPrism is the best self-hosted photo manager for users with existing libraries who want AI-powered organization without uploading to the cloud. Its facial recognition, location mapping, and smart search are genuinely useful and improve as the library grows. The trade-off is higher resource usage — TensorFlow needs RAM, and initial indexing is slow. For a mobile-first experience with auto-backup from phones, [Immich](/apps/immich) is the better choice. For pure photo organizing with AI, PhotoPrism is excellent.

## Related

- [How to Self-Host Immich](/apps/immich)
- [Best Self-Hosted Photo Management](/best/photo-management)
- [Immich vs PhotoPrism](/compare/immich-vs-photoprism)
- [PhotoPrism vs Lychee](/compare/photoprism-vs-lychee)
- [PhotoPrism vs PhotoView](/compare/photoprism-vs-photoview)
- [PhotoPrism vs Google Photos](/compare/photoprism-vs-google-photos)
- [Replace Google Photos](/replace/google-photos)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [Docker Volumes and Storage](/foundations/docker-volumes)
