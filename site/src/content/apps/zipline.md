---
title: "How to Self-Host Zipline with Docker Compose"
description: "Deploy Zipline with Docker Compose — a ShareX-compatible file hosting server with URL shortening, paste bin, and S3 support."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "file-sharing"
apps:
  - zipline
tags:
  - self-hosted
  - zipline
  - docker
  - file-sharing
  - sharex
  - image-hosting
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Zipline?

[Zipline](https://zipline.diced.sh/) is a self-hosted, ShareX-compatible file hosting server. Upload screenshots, images, videos, and files through ShareX, Flameshot, or the web dashboard, and get shareable links with custom embed metadata. Zipline also includes a built-in URL shortener and paste bin.

Built with Next.js and PostgreSQL, Zipline offers a modern dashboard with user management, invite codes, gallery view, chunked uploads, S3 storage support, and Discord/Twitter embed previews. It replaces Imgur, ShareX hosting services, and dedicated screenshot servers.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of free RAM (minimum)
- Disk space for uploaded files (or S3 storage)
- A domain name (recommended for shareable URLs)

## Docker Compose Configuration

Create a directory for Zipline:

```bash
mkdir -p ~/zipline && cd ~/zipline
```

Create a `docker-compose.yml` file:

```yaml
services:
  zipline:
    image: ghcr.io/diced/zipline:v4.4.2
    container_name: zipline
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      # REQUIRED: Secret for signing cookies — generate with: openssl rand -base64 32
      CORE_SECRET: ${CORE_SECRET}
      # REQUIRED: PostgreSQL connection string
      DATABASE_URL: postgres://zipline:${POSTGRES_PASSWORD}@zipline-db:5432/zipline
      # Server settings
      CORE_PORT: "3000"
      CORE_HOSTNAME: "0.0.0.0"
      # Storage — local by default
      DATASOURCE_TYPE: local
      DATASOURCE_LOCAL_DIRECTORY: /zipline/uploads
    volumes:
      - ./uploads:/zipline/uploads
      - ./public:/zipline/public
      - ./themes:/zipline/themes
    depends_on:
      zipline-db:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://0.0.0.0:3000/api/healthcheck"]
      interval: 15s
      timeout: 2s
      retries: 3

  zipline-db:
    image: postgres:16-alpine
    container_name: zipline-db
    environment:
      POSTGRES_USER: zipline
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: zipline
    volumes:
      - zipline-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "zipline"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  zipline-db-data:
```

Create a `.env` file:

```bash
# CHANGE THESE VALUES

# Core secret — generate with: openssl rand -base64 32
CORE_SECRET=change_me_to_a_random_base64_string

# PostgreSQL password — generate with: openssl rand -hex 16
POSTGRES_PASSWORD=change_me_to_a_strong_password
```

Create the required directories and start:

```bash
mkdir -p uploads public themes
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:3000` in your browser.
2. Create your admin account on the setup page (username, password).
3. Log in to the dashboard.
4. Go to **Settings** → **Upload** to get your upload token for ShareX integration.
5. Configure your domain under **Settings** → **URLs** if using a reverse proxy.

## Configuration

### ShareX Integration

1. In Zipline dashboard, go to **Settings** → copy your **Upload Token**
2. In ShareX, go to **Destinations** → **Custom Uploader Settings**
3. Create a new uploader:
   - **Request URL:** `https://your-domain.com/api/upload`
   - **Method:** POST
   - **Headers:** `Authorization: your-upload-token`
   - **Body:** Form data, file field name: `file`
   - **URL:** `$json:files[0]$`

### Flameshot Integration

```bash
flameshot gui --raw | curl -X POST \
  -H "Authorization: your-upload-token" \
  -F "file=@-;filename=screenshot.png" \
  https://your-domain.com/api/upload | jq -r '.files[0]' | xclip -selection clipboard
```

### URL Shortener

Zipline includes a built-in URL shortener accessible from the dashboard. Create short links, track click counts, and set expiry dates.

### Paste Bin

The built-in paste bin supports syntax highlighting. Create pastes from the dashboard or via API.

### User Management

- Create invite codes to let others register
- Set per-user upload limits and permissions
- Manage uploads across all users from the admin panel

## Advanced Configuration (Optional)

### S3 Storage Backend

Store uploads in any S3-compatible storage (AWS S3, MinIO, Backblaze B2, Wasabi):

```yaml
environment:
  DATASOURCE_TYPE: s3
  DATASOURCE_S3_ACCESS_KEY_ID: your-access-key
  DATASOURCE_S3_SECRET_ACCESS_KEY: your-secret-key
  DATASOURCE_S3_BUCKET: zipline-uploads
  DATASOURCE_S3_REGION: us-east-1
  DATASOURCE_S3_ENDPOINT: https://s3.us-east-1.amazonaws.com
  DATASOURCE_S3_FORCE_PATH_STYLE: "false"
```

For MinIO or Backblaze B2, set `DATASOURCE_S3_FORCE_PATH_STYLE: "true"` and use their endpoint URL.

### Custom Themes

Zipline supports custom themes. Place theme files in the `./themes` directory and select them from the dashboard settings.

## Reverse Proxy

Behind Caddy ([Reverse Proxy Setup](/foundations/reverse-proxy)):

```
zipline.example.com {
    reverse_proxy localhost:3000
}
```

For [Nginx Proxy Manager](/apps/nginx-proxy-manager), create a proxy host pointing to `localhost:3000` with SSL. Increase the upload size limit if you handle large files:

```nginx
client_max_body_size 100m;
```

## Backup

Back up these directories and volumes:

- **zipline-db-data** — PostgreSQL database (user accounts, file metadata, URL shortener data)
- **./uploads** — Uploaded files (skip if using S3)
- **./themes** — Custom themes

```bash
# Database backup
docker exec zipline-db pg_dump -U zipline zipline > zipline_backup_$(date +%Y%m%d).sql

# Uploads backup (if using local storage)
tar czf zipline-uploads-$(date +%Y%m%d).tar.gz ./uploads
```

See [Backup Strategy](/foundations/backup-strategy) for a complete approach.

## Troubleshooting

### Upload fails with "unauthorized"

**Symptom:** ShareX or API uploads return 401.
**Fix:** Verify your upload token matches the one in Zipline's Settings. Tokens are per-user — make sure you're using the correct user's token.

### Images don't generate thumbnails

**Symptom:** Gallery shows broken thumbnail images.
**Fix:** Ensure the `./public` directory is writable. Zipline generates thumbnails and stores them in the public directory. Check permissions: `chmod -R 777 ./public` (for debugging; tighten in production).

### Database connection errors on startup

**Symptom:** Zipline container exits with PostgreSQL connection errors.
**Fix:** Wait for PostgreSQL to be healthy before Zipline starts — the `depends_on` with `condition: service_healthy` handles this. If it persists, check that `POSTGRES_PASSWORD` matches between the `.env` file and the database service.

### Embed previews not working

**Symptom:** Discord/Twitter don't show image previews for shared links.
**Fix:** Ensure your Zipline instance is publicly accessible over HTTPS. Set the correct domain in Zipline's **Settings** → **URLs**. Embed metadata requires the URL to be reachable by Discord/Twitter's crawlers.

### High disk usage

**Symptom:** Uploads directory grows indefinitely.
**Fix:** Zipline doesn't auto-delete files by default. Use the admin panel to set per-user storage quotas or periodically clean old files. For unlimited storage, use the S3 backend with lifecycle policies.

## Resource Requirements

- **RAM:** ~150-200 MB (Zipline + PostgreSQL)
- **CPU:** Low-Medium (thumbnail generation is the main CPU consumer)
- **Disk:** ~200 MB for the application, plus storage proportional to uploads

## Verdict

Zipline is the best self-hosted ShareX server available. The feature set is comprehensive — file hosting, URL shortener, paste bin, multi-user support, S3 storage, embed metadata — all in a modern, well-maintained package. If you use ShareX (or Flameshot on Linux), Zipline is the obvious server-side companion.

For simpler needs (just upload and share, no dashboard), consider [XBackBone](/apps/xbackbone). For ephemeral, encrypted file sharing via links, use [Send](/apps/send). For AirDrop-style local transfers, use [PairDrop](/apps/pairdrop).

## Frequently Asked Questions

### Does Zipline work with Flameshot on Linux?
Yes. Zipline's API is compatible with any HTTP client. Pipe Flameshot's output through curl with the upload token header.

### Can I use Zipline without ShareX?
Yes. Zipline has a web dashboard for uploading files directly in the browser. ShareX integration is a feature, not a requirement.

### How do I migrate from another ShareX server?
No direct migration tool exists. Re-upload files to Zipline or manually copy them into the uploads directory and recreate database entries.

## Related

- [Zipline vs XBackBone](/compare/zipline-vs-xbackbone)
- [How to Self-Host XBackBone](/apps/xbackbone)
- [Self-Hosted Alternatives to ShareX Server](/replace/sharex-server)
- [Best Self-Hosted File Sharing Tools](/best/file-sharing)
- [PairDrop vs Send](/compare/pairdrop-vs-send)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
- [Backup Strategy](/foundations/backup-strategy)
