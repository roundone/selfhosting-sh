---
title: "How to Self-Host Piwigo with Docker Compose"
description: "Step-by-step guide to self-hosting Piwigo with Docker Compose — an open-source photo gallery with 23 years of development and a plugin ecosystem."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "photo-management"
apps:
  - piwigo
tags: ["self-hosted", "piwigo", "photos", "docker", "gallery"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Piwigo?

[Piwigo](https://piwigo.org/) is an open-source photo gallery application with over 23 years of active development (since 2002). It manages and shares photo collections through albums, tags, batch operations, user permissions, and a plugin ecosystem with 350+ extensions. Piwigo is used by organizations, photographers, and families who need a reliable, battle-tested photo gallery that can handle libraries of 500,000+ photos.

Piwigo is a gallery and sharing tool, not a Google Photos replacement. It doesn't do AI search, face recognition, or mobile auto-upload. What it does do — organize, tag, share, and display large photo collections — it does extremely well after two decades of refinement.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB RAM minimum
- Disk space for your photo library
- A domain name (optional, for remote access)

## Docker Compose Configuration

Piwigo requires a MariaDB or MySQL database. The LinuxServer.io image is the most widely used Docker image for Piwigo.

Create a project directory:

```bash
mkdir -p /opt/piwigo && cd /opt/piwigo
```

Create a `docker-compose.yml`:

```yaml
services:
  piwigo:
    image: lscr.io/linuxserver/piwigo:16.2.0
    container_name: piwigo
    environment:
      # User/group IDs — match your host directory ownership
      - PUID=1000
      - PGID=1000
      # Timezone — https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
      - TZ=Etc/UTC
    volumes:
      # Configuration, PHP settings, SSL keys, and Piwigo application files
      - /opt/piwigo/config:/config
      # Photo storage — all uploaded images go here
      - /opt/piwigo/gallery:/gallery
    ports:
      - "8085:80"
    depends_on:
      piwigo_db:
        condition: service_healthy
    restart: unless-stopped

  piwigo_db:
    image: mariadb:10
    container_name: piwigo-db
    restart: unless-stopped
    environment:
      # CHANGE THESE — use strong passwords
      - MYSQL_ROOT_PASSWORD=change-this-root-password
      - MYSQL_DATABASE=piwigo
      - MYSQL_USER=piwigo
      - MYSQL_PASSWORD=change-this-db-password
    volumes:
      - piwigo-db:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s

volumes:
  piwigo-db:
```

Start the stack:

```bash
mkdir -p /opt/piwigo/{config,gallery}
docker compose up -d
```

## Initial Setup

1. Wait for both containers to be healthy: `docker compose ps`
2. Open `http://your-server:8085` in a browser
3. The Piwigo installation wizard appears on first access
4. Fill in the database connection:
   - **Host:** `piwigo_db` (the Docker service name)
   - **User:** `piwigo`
   - **Password:** the password you set in `MYSQL_PASSWORD`
   - **Database name:** `piwigo`
   - **Table prefix:** `piwigo_` (default is fine)
5. Create your admin account
6. Click **Start Installation**
7. After installation, log in and start uploading photos

**Note:** Unlike most Docker apps, Piwigo's database connection is configured through the web UI during setup, not via environment variables on the container itself. The credentials are stored in `/config/www/piwigo/local/config/database.inc.php`.

## Configuration

### Uploading Photos

Upload photos through the web UI under **Administration** → **Photos** → **Add**. Piwigo supports:
- Web upload (drag and drop)
- FTP upload (place files in `/gallery` and sync via Admin → Photos → Synchronize)
- Batch upload with the [piwigo-cli](https://github.com/Piwigo/piwigo-cli) tool

### Albums and Categories

Create albums (called "Categories" in Piwigo) to organize photos. Albums can be nested for hierarchical organization:

```
Nature/
  ├── Mountains/
  ├── Oceans/
  └── Forests/
Events/
  ├── Wedding 2024/
  └── Birthday Party/
```

### Plugins

Piwigo's plugin ecosystem is a major differentiator. Install plugins from **Administration** → **Plugins**. Popular plugins:

- **Batch Manager** — bulk edit, tag, and move photos
- **Auto Upload** — watch a directory for new photos
- **OpenStreetMap** — map view for geotagged photos
- **Guest Policy** — fine-grained access control
- **Video.js** — video playback support

### Themes

Customize the gallery appearance under **Administration** → **Themes**. Piwigo has dozens of community themes. The default "Modus" theme is clean and responsive.

### User Permissions

Piwigo has a granular permission system:
- **Groups** — assign users to groups
- **Albums** — set per-album visibility by user or group
- **Upload rights** — control who can upload photos
- **Guest access** — allow or restrict unauthenticated browsing

## Reverse Proxy

Forward traffic to port 8085 (or whatever port you mapped).

### Nginx Proxy Manager

- **Scheme:** `http`
- **Forward Hostname:** `your-server-ip`
- **Forward Port:** `8085`
- Enable SSL with Let's Encrypt

See [Reverse Proxy Setup](/foundations/reverse-proxy) for detailed instructions.

## Backup

Critical data to back up:

- **Gallery directory:** `/opt/piwigo/gallery` — all uploaded photos
- **Config directory:** `/opt/piwigo/config` — Piwigo config files, plugins, themes, and the database connection file
- **MariaDB database:** Contains album structure, tags, user accounts, and all metadata

```bash
# Database backup
docker compose exec piwigo_db mysqldump -u piwigo -p piwigo > piwigo-db-backup-$(date +%Y%m%d).sql

# Files backup
tar czf piwigo-backup-$(date +%Y%m%d).tar.gz /opt/piwigo/config /opt/piwigo/gallery
```

See [Backup Strategy](/foundations/backup-strategy) for a comprehensive backup approach.

## Troubleshooting

### "Cannot connect to database" during setup

**Symptom:** The installation wizard can't reach the database.
**Fix:** Ensure `piwigo_db` is running and healthy: `docker compose ps`. The database host must be the Docker service name (`piwigo_db`), not `localhost`. Wait for the MariaDB health check to pass before attempting setup.

### Photos not appearing after FTP upload

**Symptom:** Files placed in `/gallery` don't show in the web UI.
**Fix:** Piwigo requires a manual sync after FTP uploads. Go to **Administration** → **Photos** → **Synchronize** → select "Directories + files" → click **Submit**. This is by design — Piwigo doesn't auto-detect new files.

### Permission denied on upload

**Symptom:** Upload fails with a permission error.
**Fix:** Ensure `PUID` and `PGID` match the ownership of `/opt/piwigo/gallery` on the host. Run `ls -la /opt/piwigo/gallery/` and update the env vars if needed.

### Self-signed SSL certificate warning

**Symptom:** Browser shows "Your connection is not private" when accessing Piwigo.
**Fix:** The LinuxServer image generates self-signed SSL keys in `/config/keys` on first run. These are not trusted by browsers. Use a reverse proxy with Let's Encrypt for proper SSL instead of the built-in self-signed certificates.

## Resource Requirements

- **RAM:** ~200 MB idle, 500 MB during batch uploads
- **CPU:** Low. Piwigo generates thumbnails on upload but doesn't do heavy processing.
- **Disk:** Minimal for the application. Photo storage depends on your library size.

## Verdict

Piwigo is the most mature and battle-tested photo gallery in the self-hosted space. With 23 years of development and a rich plugin ecosystem, it handles large collections (500,000+ photos) reliably. It's the right choice for organizations, photographers, or anyone who needs granular permissions, extensive customization, and proven stability.

For personal photo management with AI features, use [Immich](/apps/immich). For a modern, minimal gallery for sharing, use [Lychee](/apps/lychee). For a rock-solid gallery with maximum customizability and a proven track record, use Piwigo.

## FAQ

### How does Piwigo handle very large libraries?

Piwigo is specifically designed for large collections. Users report smooth operation with 500,000+ photos. The database-driven approach scales better than filesystem-based alternatives for browsing and searching at this scale.

### Does Piwigo support video?

Not natively. The Video.js plugin adds video playback support, but Piwigo is primarily a photo gallery. For video, use [Jellyfin](/apps/jellyfin) or [Plex](/apps/plex).

### Can I import from Google Photos or Flickr?

Piwigo offers import scripts and community tools for Google Takeout exports and Flickr archives. Export your photos, place them in the gallery directory, and use the Synchronize feature to import.

### Is there a mobile app?

Piwigo has official iOS and Android apps for browsing and uploading. The apps support auto-upload from your camera roll — one of Piwigo's advantages over some competitors.

## Related

- [Lychee vs Piwigo](/compare/lychee-vs-piwigo)
- [PhotoPrism vs Piwigo](/compare/photoprism-vs-piwigo)
- [How to Self-Host Immich](/apps/immich)
- [How to Self-Host Lychee](/apps/lychee)
- [Best Self-Hosted Photo Management](/best/photo-management)
- [Self-Hosted Google Photos Alternatives](/replace/google-photos)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
