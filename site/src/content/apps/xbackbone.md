---
title: "How to Self-Host XBackBone with Docker Compose"
description: "Deploy XBackBone with Docker Compose — a lightweight, self-hosted ShareX upload server with gallery view and user management."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "file-sharing"
apps:
  - xbackbone
tags:
  - self-hosted
  - xbackbone
  - docker
  - file-sharing
  - sharex
  - screenshot-hosting
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is XBackBone?

[XBackBone](https://github.com/SergiX44/XBackBone) is a lightweight, self-hosted file upload server designed for ShareX, Flameshot, and similar screenshot tools. Upload images, files, and screenshots via API, browse them in a clean gallery, and manage multiple users — all backed by SQLite with zero external dependencies.

XBackBone is the minimalist choice. One container, SQLite database, PHP-based. It does file upload hosting well without the extras (no URL shortener, no paste bin, no S3 storage). If you want a simple, reliable upload destination, XBackBone delivers.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 256 MB of free RAM (minimum)
- Disk space for uploaded files
- A domain name (recommended for shareable URLs)

## Docker Compose Configuration

Create a directory for XBackBone:

```bash
mkdir -p ~/xbackbone && cd ~/xbackbone
```

Create a `docker-compose.yml` file:

```yaml
services:
  xbackbone:
    image: lscr.io/linuxserver/xbackbone:3.8.1
    container_name: xbackbone
    environment:
      # LinuxServer.io standard variables
      PUID: "1000"
      PGID: "1000"
      TZ: Etc/UTC
    volumes:
      - ./config:/config
    ports:
      - "127.0.0.1:8080:80"
    restart: unless-stopped
```

That's the entire stack. SQLite database, no external dependencies.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8080` in your browser.
2. The installation wizard appears on first visit.
3. Configure the database:
   - **Connection:** SQLite (default, recommended for most users)
   - **Database path:** Leave default
4. Set the **Base URL** to your domain (e.g., `https://xbackbone.example.com`)
5. Complete the wizard and run database migration when prompted.
6. Log in with default credentials: **admin** / **admin**
7. **Change the admin password immediately** under user settings.

## Configuration

### ShareX Integration

1. Log into XBackBone and go to your profile.
2. Generate an upload token.
3. In ShareX on Windows:
   - Go to **Destinations** → **Custom Uploader Settings**
   - **Request URL:** `https://your-domain.com/upload`
   - **Method:** POST
   - **Headers:** `Token: your-upload-token`
   - **Body:** Form data, file field name: `upload`
   - **URL:** `$json:url$`

### Flameshot Integration (Linux)

```bash
flameshot gui --raw | curl -X POST \
  -H "Token: your-upload-token" \
  -F "upload=@-;filename=screenshot.png" \
  https://your-domain.com/upload | jq -r '.url' | xclip -selection clipboard
```

### User Management

XBackBone supports multiple users, each with their own upload token and gallery:

1. Go to **System** → **Users** → **Add User**
2. Set username, email, password, and role (admin or user)
3. Each user gets a separate gallery and upload token

### PHP Upload Limits

The default upload size limit is set by PHP. To increase it, create or edit `/config/php/php-local.ini`:

```ini
upload_max_filesize = 100M
post_max_size = 100M
```

Restart the container after changing PHP settings:

```bash
docker compose restart xbackbone
```

## Advanced Configuration (Optional)

### MySQL/MariaDB Backend

For larger installations (1000+ files, multiple active users), switch to MySQL:

```yaml
services:
  xbackbone:
    image: lscr.io/linuxserver/xbackbone:3.8.1
    container_name: xbackbone
    environment:
      PUID: "1000"
      PGID: "1000"
      TZ: Etc/UTC
    volumes:
      - ./config:/config
    ports:
      - "127.0.0.1:8080:80"
    depends_on:
      xbackbone-db:
        condition: service_healthy
    restart: unless-stopped

  xbackbone-db:
    image: mariadb:11
    container_name: xbackbone-db
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: xbackbone
      MYSQL_USER: xbackbone
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - xbackbone-db-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  xbackbone-db-data:
```

Then update `/config/www/xbackbone/config.php`:

```php
'db' => [
    'connection' => 'mysql',
    'dsn' => 'mysql:host=xbackbone-db;dbname=xbackbone',
    'username' => 'xbackbone',
    'password' => 'your-db-password',
],
```

### LDAP Authentication

XBackBone supports LDAP for centralized authentication. Configure in `config.php`:

```php
'ldap' => [
    'enabled' => true,
    'host' => 'ldap://your-ldap-server',
    'port' => 389,
    'base_dn' => 'ou=users,dc=example,dc=com',
    'user_attribute' => 'uid',
],
```

## Reverse Proxy

Behind Caddy ([Reverse Proxy Setup](/foundations/reverse-proxy-explained)):

```
xbackbone.example.com {
    reverse_proxy localhost:8080
}
```

After setting up the reverse proxy, update the **Base URL** in XBackBone's settings or directly in `/config/www/xbackbone/config.php`:

```php
'base_url' => 'https://xbackbone.example.com',
```

## Backup

All persistent data lives in the `./config` directory:

- **SQLite database** — at `/config/www/xbackbone/resources/database/xbackbone.db`
- **Uploaded files** — at `/config/www/xbackbone/storage/`
- **Configuration** — at `/config/www/xbackbone/config.php`

```bash
# Full backup
tar czf xbackbone-backup-$(date +%Y%m%d).tar.gz ./config
```

See [Backup Strategy](/foundations/backup-strategy) for a complete approach.

## Troubleshooting

### Upload returns 413 error

**Symptom:** Uploading large files returns HTTP 413 (Request Entity Too Large).
**Fix:** Increase PHP upload limits in `/config/php/php-local.ini`. Also check your reverse proxy's upload limit — Nginx defaults to 1 MB. Set `client_max_body_size 100m;` in Nginx config.

### Gallery shows broken images

**Symptom:** Thumbnails or images don't load in the gallery.
**Fix:** Check that the Base URL in settings matches your actual domain. If you changed domains or switched to HTTPS, update `base_url` in `config.php`.

### Login with default credentials fails

**Symptom:** admin/admin doesn't work on first login.
**Fix:** If you ran the installation wizard previously and it partially completed, the admin password may have been set during setup. Delete the SQLite database and restart: `rm ./config/www/xbackbone/resources/database/xbackbone.db && docker compose restart`.

### File permissions issues

**Symptom:** Uploads fail with permission errors.
**Fix:** Ensure `PUID` and `PGID` match the owner of the `./config` directory. Check permissions: `ls -la ./config`. The LinuxServer.io image runs as the specified UID/GID.

## Resource Requirements

- **RAM:** ~50-80 MB idle
- **CPU:** Low (PHP processes are lightweight)
- **Disk:** ~100 MB for the application, plus storage for uploads

## Verdict

XBackBone is the right choice if you want the simplest possible ShareX upload server. One container, SQLite, zero dependencies, works out of the box. The gallery view is clean, user management is adequate, and LDAP support adds enterprise flexibility.

For more features — URL shortening, paste bin, S3 storage, Discord embeds — use [Zipline](/apps/zipline) instead. XBackBone trades features for simplicity, and that's a valid choice for users who just want a reliable upload destination.

## Frequently Asked Questions

### Can XBackBone handle video uploads?
Yes. XBackBone accepts any file type. Video files are stored and served as downloads — there's no built-in video player or transcoding.

### Does XBackBone support S3 storage?
No. XBackBone supports local storage and FTP only. For S3 support, use [Zipline](/apps/zipline).

### How do I upgrade XBackBone?
Pull the new image and restart: `docker compose pull && docker compose up -d`. The LinuxServer.io image handles database migrations automatically.

## Related

- [Zipline vs XBackBone](/compare/zipline-vs-xbackbone)
- [How to Self-Host Zipline](/apps/zipline)
- [Self-Hosted Alternatives to ShareX Server](/replace/sharex-server)
- [Best Self-Hosted File Sharing Tools](/best/file-sharing)
- [PairDrop vs Send](/compare/pairdrop-vs-send)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
