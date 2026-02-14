---
title: "How to Self-Host PhotoPrism with Docker Compose"
type: "app-guide"
app: "photoprism"
category: "photo-management"
replaces: "Google Photos"
difficulty: "intermediate"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up PhotoPrism, an AI-powered self-hosted photo management app, with Docker Compose."
officialUrl: "https://www.photoprism.app"
githubUrl: "https://github.com/photoprism/photoprism"
defaultPort: 2342
minRam: "2GB"
---

## What is PhotoPrism?

PhotoPrism is an AI-powered, self-hosted photo management application. It automatically classifies your photos using machine learning — recognizing faces, objects, colors, and locations. The web interface is polished with map views, timeline browsing, and powerful search. It's a mature project (since 2018) with a focus on photo browsing and organization rather than mobile backup.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- A server with at least 2GB RAM, 4GB recommended for large libraries ([best mini PCs for self-hosting](/hardware/best-mini-pc/))
- Storage for your photo library

## Docker Compose Configuration

```yaml
# docker-compose.yml for PhotoPrism
# Tested with PhotoPrism 240915+

services:
  photoprism:
    container_name: photoprism
    image: photoprism/photoprism:latest
    ports:
      - "2342:2342"
    environment:
      PHOTOPRISM_ADMIN_USER: "admin"
      PHOTOPRISM_ADMIN_PASSWORD: "change-this-password"
      PHOTOPRISM_AUTH_MODE: "password"
      PHOTOPRISM_SITE_URL: "http://localhost:2342/"
      PHOTOPRISM_ORIGINALS_LIMIT: 5000        # Max file size in MB
      PHOTOPRISM_HTTP_COMPRESSION: "gzip"
      PHOTOPRISM_DATABASE_DRIVER: "mysql"
      PHOTOPRISM_DATABASE_SERVER: "mariadb:3306"
      PHOTOPRISM_DATABASE_NAME: "photoprism"
      PHOTOPRISM_DATABASE_USER: "photoprism"
      PHOTOPRISM_DATABASE_PASSWORD: "${DB_PASSWORD}"
      PHOTOPRISM_DISABLE_TENSORFLOW: "false"   # Enable AI classification
      PHOTOPRISM_DETECT_NSFW: "false"
      PHOTOPRISM_UPLOAD_NSFW: "true"
    volumes:
      # Your photo library (read-only if you don't want PhotoPrism modifying originals)
      - /path/to/photos:/photoprism/originals:ro
      # Import folder for uploading new photos
      - ./import:/photoprism/import
      # PhotoPrism storage (cache, thumbnails, sidecar files)
      - ./storage:/photoprism/storage
    depends_on:
      - mariadb
    restart: unless-stopped

  mariadb:
    container_name: photoprism_db
    image: mariadb:11
    command: --innodb-buffer-pool-size=512M --transaction-isolation=READ-COMMITTED --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --max-connections=512 --innodb-rollback-on-timeout=OFF --innodb-lock-wait-timeout=120
    volumes:
      - db_data:/var/lib/mysql
    environment:
      MARIADB_AUTO_UPGRADE: "1"
      MARIADB_ROOT_PASSWORD: "${DB_ROOT_PASSWORD}"
      MARIADB_DATABASE: "photoprism"
      MARIADB_USER: "photoprism"
      MARIADB_PASSWORD: "${DB_PASSWORD}"
    restart: unless-stopped

volumes:
  db_data:
```

Create a `.env` file:

```bash
# .env file for PhotoPrism
DB_PASSWORD=change-this-password
DB_ROOT_PASSWORD=change-this-root-password
```

## Step-by-Step Setup

1. **Create a directory:**
   ```bash
   mkdir ~/photoprism && cd ~/photoprism
   ```

2. **Create the `docker-compose.yml` and `.env` files.** Update `/path/to/photos` to your actual photo library location.

3. **Start the containers:**
   ```bash
   docker compose up -d
   ```

4. **Access the web UI** at `http://your-server-ip:2342`

5. **Log in** with the admin credentials you set in the compose file.

6. **Index your library** — go to Library → Index and click "Start." Initial indexing of large libraries can take hours as the AI classifies every photo.

7. **Explore your photos** — browse by timeline, map, faces, or AI-detected labels.

## Configuration Tips

- **Read-only originals:** The `:ro` mount flag prevents PhotoPrism from modifying your original photos. Sidecar files (XMP, JSON) go into the storage volume instead.
- **Import workflow:** Drop new photos into the `import` folder, then use Library → Import in the web UI.
- **Face recognition:** After initial indexing, go to People → Faces to review and name recognized faces.
- **Reverse proxy:** For HTTPS access, put PhotoPrism behind a reverse proxy. Update `PHOTOPRISM_SITE_URL` to your domain. See our [reverse proxy guide](/foundations/reverse-proxy/).
- **Performance:** Initial indexing is CPU-intensive. After that, PhotoPrism is lightweight. If indexing is too slow, consider disabling TensorFlow temporarily and re-enabling after import.

## Backup & Migration

- **Backup:** Back up the `storage` folder (thumbnails, sidecar files, database cache) and the MariaDB database. Your original photos are in a separate mount.
- **Migration from Google Photos:** Use Google Takeout to export, place the files in your originals folder, and re-index.

## Troubleshooting

- **Slow indexing:** Large libraries (50,000+ photos) take time. AI classification is the bottleneck. Consider a machine with a more powerful CPU.
- **Out of memory:** Increase Docker's memory limit or add swap. PhotoPrism's TensorFlow model needs ~1.5GB RAM.
- **Thumbnails not generating:** Check disk space in the storage volume and container logs for errors.

## Alternatives

[Immich](/apps/immich/) is the main alternative — it has mobile apps with auto-backup, which PhotoPrism lacks. See our [Immich vs PhotoPrism comparison](/compare/immich-vs-photoprism/) or the full [Best Self-Hosted Photo Management](/best/photo-management/) roundup.

## Verdict

PhotoPrism is excellent for browsing and organizing an existing photo library. The AI-powered search and face recognition are genuinely useful. But if you need mobile auto-backup (most people do), Immich is the better choice. Use PhotoPrism when you want a polished web gallery for a large, existing collection.
