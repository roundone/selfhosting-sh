---
title: "How to Self-Host Lychee with Docker Compose"
description: "Complete guide to self-hosting Lychee with Docker Compose — a beautiful, open-source photo management and sharing platform for your server."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "photo-management"
apps:
  - lychee
tags: ["self-hosted", "lychee", "photos", "docker", "gallery"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Lychee?

[Lychee](https://lycheeorg.github.io/) is a self-hosted photo management application with a clean, minimal UI focused on photo sharing and gallery presentation. It supports albums, tags, public sharing links, EXIF data display, and multi-user access. Lychee v7 runs on FrankenPHP (Laravel Octane) for significantly better performance than the legacy nginx+PHP stack. It's MIT-licensed and completely free.

Unlike Immich or PhotoPrism which focus on personal photo library management with AI features, Lychee excels at presenting and sharing curated photo galleries — making it a better fit for photographers, portfolios, or public-facing photo collections.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB RAM minimum
- Disk space for your photo library
- A domain name (recommended for public sharing)

## Docker Compose Configuration

Lychee requires a database backend. MariaDB is the default and recommended option. The stack runs three containers: the Lychee application (FrankenPHP), MariaDB for data storage, and optionally Redis for caching.

Create a project directory:

```bash
mkdir -p /opt/lychee && cd /opt/lychee
```

Create a `.env` file:

```bash
# /opt/lychee/.env

# Application key — REQUIRED. Generate with:
# openssl rand -base64 32
# Then prefix with "base64:" — example: base64:AbCdEfGh1234567890...
APP_KEY=

# Full URL where Lychee will be accessed (include protocol)
APP_URL=http://localhost:8000

# User/group IDs — match your host directory ownership
PUID=1000
PGID=1000

# Timezone
TIMEZONE=Etc/UTC

# Database configuration
DB_CONNECTION=mysql
DB_HOST=lychee_db
DB_PORT=3306
DB_DATABASE=lychee
DB_USERNAME=lychee
# CHANGE THIS — use a strong password. Enclose special chars in quotes.
DB_PASSWORD=change-this-strong-password

# MariaDB root password — CHANGE THIS
DB_ROOT_PASSWORD=change-this-root-password
```

Generate the application key and update the `.env`:

```bash
APP_KEY_VALUE=$(openssl rand -base64 32)
echo "Generated APP_KEY: base64:${APP_KEY_VALUE}"
# Copy this value and set APP_KEY=base64:... in your .env file
```

Create a `docker-compose.yml`:

```yaml
services:
  lychee:
    image: ghcr.io/lycheeorg/lychee:v7.3.3
    container_name: lychee
    restart: unless-stopped
    env_file:
      - .env
    environment:
      PUID: "${PUID:-1000}"
      PGID: "${PGID:-1000}"
      APP_KEY: "${APP_KEY}"
      APP_NAME: "Lychee"
      APP_ENV: "production"
      APP_DEBUG: "false"
      APP_TIMEZONE: "${TIMEZONE:-UTC}"
      APP_URL: "${APP_URL:-http://localhost:8000}"
      DB_CONNECTION: "${DB_CONNECTION:-mysql}"
      DB_HOST: "${DB_HOST:-lychee_db}"
      DB_PORT: "${DB_PORT:-3306}"
      DB_DATABASE: "${DB_DATABASE:-lychee}"
      DB_USERNAME: "${DB_USERNAME:-lychee}"
      DB_PASSWORD: "${DB_PASSWORD}"
    ports:
      - "8000:8000"
    volumes:
      # Photo uploads — this is where all uploaded photos are stored
      - /opt/lychee/uploads:/app/public/uploads
      # Application logs
      - /opt/lychee/logs:/app/storage/logs
      # Temporary upload storage
      - /opt/lychee/tmp:/app/storage/tmp
    depends_on:
      lychee_db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/up"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  lychee_db:
    image: mariadb:10
    container_name: lychee-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: "${DB_ROOT_PASSWORD}"
      MYSQL_DATABASE: "${DB_DATABASE:-lychee}"
      MYSQL_USER: "${DB_USERNAME:-lychee}"
      MYSQL_PASSWORD: "${DB_PASSWORD}"
    volumes:
      - lychee-db:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s

volumes:
  lychee-db:
```

Create the upload directories and start the stack:

```bash
mkdir -p /opt/lychee/{uploads,logs,tmp}
docker compose up -d
```

## Initial Setup

1. Wait for the health checks to pass: `docker compose ps` — both services should show "healthy"
2. Open `http://your-server:8000` in a browser
3. Create your admin account on the first-visit setup screen
4. Start uploading photos or creating albums through the web UI

## Configuration

### Albums and Sharing

Lychee organizes photos into albums. Each album can be:
- **Private** — only visible to logged-in users
- **Public** — accessible via a shareable link without login
- **Password-protected** — public link with a password gate

Create albums from the web UI, then drag and drop photos or use the upload button. Public album links are ideal for sharing event photos with friends or displaying a portfolio.

### Multi-User Support

Lychee supports multiple users with different permission levels. Admin users can manage all albums; regular users can manage their own albums.

### Import from Server

If you have photos already on the server, Lychee can import them from the local filesystem. Place photos in a directory accessible to the container and use the import feature in Settings.

### EXIF and Metadata

Lychee reads EXIF data from uploaded photos and displays camera model, exposure settings, GPS coordinates, and capture date. Photos can be filtered and sorted by these metadata fields.

## Advanced Configuration

### Redis Caching (Optional)

For better performance on large galleries, add Redis:

```yaml
  lychee_cache:
    image: redis:alpine
    container_name: lychee-cache
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "redis-cli ping || exit 1"]
    volumes:
      - lychee-cache:/data

volumes:
  lychee-db:
  lychee-cache:
```

Update the Lychee environment to use Redis:

```yaml
    environment:
      # ... existing env vars ...
      CACHE_STORE: "redis"
      REDIS_HOST: "lychee_cache"
```

### Background Worker (Optional)

For large uploads and better responsiveness, enable the queue worker. Add to your compose file:

```yaml
  lychee_worker:
    image: ghcr.io/lycheeorg/lychee:v7.3.3
    container_name: lychee-worker
    restart: unless-stopped
    env_file:
      - .env
    environment:
      PUID: "${PUID:-1000}"
      PGID: "${PGID:-1000}"
      APP_KEY: "${APP_KEY}"
      APP_ENV: "production"
      APP_TIMEZONE: "${TIMEZONE:-UTC}"
      DB_CONNECTION: "${DB_CONNECTION:-mysql}"
      DB_HOST: "${DB_HOST:-lychee_db}"
      DB_PORT: "${DB_PORT:-3306}"
      DB_DATABASE: "${DB_DATABASE:-lychee}"
      DB_USERNAME: "${DB_USERNAME:-lychee}"
      DB_PASSWORD: "${DB_PASSWORD}"
      # This activates worker mode
      LYCHEE_MODE: worker
      QUEUE_CONNECTION: database
    volumes:
      - /opt/lychee/uploads:/app/public/uploads
      - /opt/lychee/logs:/app/storage/logs
      - /opt/lychee/tmp:/app/storage/tmp
    depends_on:
      lychee_db:
        condition: service_healthy
      lychee:
        condition: service_healthy
```

### OAuth/SSO

Lychee supports OAuth login via GitHub, Google, Mastodon, Keycloak, Authentik, Authelia, and more. Configure under Settings or via environment variables. See the [Lychee docs](https://lycheeorg.github.io/docs/) for provider-specific setup.

## Reverse Proxy

Forward traffic to port 8000 (not port 80 — this changed in Lychee v7).

### Nginx Proxy Manager

- **Scheme:** `http`
- **Forward Hostname:** `your-server-ip`
- **Forward Port:** `8000`
- Enable SSL with Let's Encrypt

After setting up the proxy, update `APP_URL` in your `.env` to the full HTTPS URL and restart the container.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for detailed instructions.

## Backup

Critical data to back up:

- **Photo uploads:** `/opt/lychee/uploads` — this is your photo library
- **MariaDB database:** Contains album structure, user accounts, metadata, and settings

```bash
# Database backup
docker compose exec lychee_db mysqldump -u lychee -p lychee > lychee-db-backup-$(date +%Y%m%d).sql

# Photo backup
tar czf lychee-uploads-backup-$(date +%Y%m%d).tar.gz /opt/lychee/uploads
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive backup approach.

## Troubleshooting

### "APP_KEY is not set" error on startup

**Symptom:** Lychee fails to start with an encryption key error.
**Fix:** The `APP_KEY` environment variable is mandatory. Generate it with `openssl rand -base64 32` and set it in `.env` as `APP_KEY=base64:your-generated-key`. This key encrypts session data — losing it invalidates all existing sessions.

### Permission errors on uploads

**Symptom:** "Permission denied" when uploading photos.
**Fix:** Ensure `PUID` and `PGID` in your `.env` match the ownership of the upload directory on the host. Check with `ls -la /opt/lychee/uploads/` and adjust the env vars to match.

### Database connection refused

**Symptom:** "Connection refused" or "SQLSTATE[HY000]" errors in logs.
**Fix:** Ensure `lychee_db` is running and healthy: `docker compose ps`. Verify that `DB_HOST` matches the database service name (`lychee_db`). If `DB_PASSWORD` contains special characters, enclose it in quotes in the `.env` file.

### Port 80 not working

**Symptom:** Lychee not accessible on port 80 after upgrading from v6.
**Fix:** Lychee v7 changed from port 80 (nginx) to port 8000 (FrankenPHP). Update your port mapping to `8000:8000` and reverse proxy configs to forward to port 8000.

## Resource Requirements

- **RAM:** ~200 MB idle, up to 2 GB during large uploads
- **CPU:** Low for browsing. Moderate during upload processing (thumbnail generation, EXIF extraction)
- **Disk:** Minimal for the application. Photo storage depends on your library size.

## Verdict

Lychee is the best self-hosted option for photo sharing and gallery presentation. Its clean, minimal UI is ideal for portfolios, event photography, and sharing curated collections via public links. The v7 rewrite on FrankenPHP delivers 3-4x better performance than the legacy version.

Lychee is **not** a Google Photos replacement — it doesn't have mobile auto-upload, AI search, or face recognition. For those features, use [Immich](/apps/immich). Use Lychee when your primary goal is presenting and sharing beautiful photo galleries.

## FAQ

### How does Lychee compare to Immich?

Different tools for different purposes. Immich replaces Google Photos (mobile upload, AI search, face recognition). Lychee is a photo gallery (albums, sharing links, public galleries). Immich is for managing your personal photo library. Lychee is for presenting photos to others.

### Does Lychee support RAW files?

Lychee supports JPEG, PNG, GIF, and WebP natively. RAW file support depends on the server's image processing capabilities. For RAW editing and management, consider [PhotoPrism](/apps/photoprism) instead.

### Can I import from Google Photos?

Export your photos using Google Takeout, then upload the JPEG files to Lychee. Album structure doesn't transfer — you'll need to organize albums manually in Lychee.

### Is the legacy (nginx) image still available?

Yes. Use `ghcr.io/lycheeorg/lychee:v7.3.3-legacy` for the nginx+PHP-FPM variant. The FrankenPHP image is recommended for new installations.

## Related

- [Lychee vs Piwigo](/compare/lychee-vs-piwigo)
- [Lychee vs PhotoView](/compare/lychee-vs-photoview)
- [Immich vs Lychee](/compare/immich-vs-lychee)
- [PhotoPrism vs Lychee](/compare/photoprism-vs-lychee)
- [LibrePhotos vs Lychee](/compare/librephotos-vs-lychee)
- [How to Self-Host Immich](/apps/immich)
- [How to Self-Host PhotoPrism](/apps/photoprism)
- [Best Self-Hosted Photo Management](/best/photo-management)
- [Self-Hosted Google Photos Alternatives](/replace/google-photos)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
