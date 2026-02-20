---
title: "How to Self-Host Nextcloud with Docker"
description: "Complete guide to self-hosting Nextcloud with Docker Compose, PostgreSQL, and Redis — your own Dropbox and Google Drive replacement."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "file-sync"
apps:
  - nextcloud
tags:
  - self-hosted
  - cloud-storage
  - nextcloud
  - docker
  - dropbox-alternative
  - google-drive-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Nextcloud?

[Nextcloud](https://nextcloud.com) is a self-hosted cloud platform that replaces Dropbox, Google Drive, and Google Workspace. It provides file sync, sharing, calendar, contacts, office document editing, and a plugin ecosystem with hundreds of apps. Nextcloud is the most well-known self-hosted cloud solution, used by governments, universities, and millions of individuals. It is fully open source under the AGPL-3.0 license.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB of RAM minimum (4 GB recommended)
- 10 GB of free disk space for the application, plus storage for your files
- A domain name (strongly recommended for remote access and mobile apps)

## Docker Compose Configuration

Create a directory and `docker-compose.yml`:

```bash
mkdir -p ~/nextcloud && cd ~/nextcloud
```

```yaml
services:
  db:
    image: postgres:17-alpine
    container_name: nextcloud-db
    restart: unless-stopped
    volumes:
      - nextcloud-db:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: nextcloud
      POSTGRES_USER: nextcloud
      POSTGRES_PASSWORD: "change-this-db-password"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nextcloud"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: nextcloud-redis
    restart: unless-stopped

  app:
    image: nextcloud:32.0.6-apache
    container_name: nextcloud
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - nextcloud-html:/var/www/html
    environment:
      # Database
      POSTGRES_HOST: db
      POSTGRES_DB: nextcloud
      POSTGRES_USER: nextcloud
      POSTGRES_PASSWORD: "change-this-db-password"  # Must match db service
      # Cache
      REDIS_HOST: redis
      # Admin account (first run only)
      NEXTCLOUD_ADMIN_USER: admin
      NEXTCLOUD_ADMIN_PASSWORD: "change-this-admin-password"
      # Access
      NEXTCLOUD_TRUSTED_DOMAINS: "localhost your-domain.com"
      # PHP tuning
      PHP_MEMORY_LIMIT: "512M"
      PHP_UPLOAD_LIMIT: "16G"
      APACHE_BODY_LIMIT: "0"  # No limit — let PHP handle it
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  cron:
    image: nextcloud:32.0.6-apache
    container_name: nextcloud-cron
    restart: unless-stopped
    volumes:
      - nextcloud-html:/var/www/html
    entrypoint: /cron.sh
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

volumes:
  nextcloud-db:
  nextcloud-html:
```

**Important:** Replace all passwords with strong, unique values. The `POSTGRES_PASSWORD` must match in both the `db` and `app` services. Set `NEXTCLOUD_TRUSTED_DOMAINS` to your actual domain.

The `cron` service uses the same Nextcloud image and volume but runs background tasks (file scanning, notifications, cleanup) instead of the web server.

Start the stack:

```bash
docker compose up -d
```

The first startup takes 1-2 minutes while Nextcloud initializes the database and installs default apps.

## Initial Setup

1. Open Nextcloud at `http://your-server-ip:8080`
2. If you set `NEXTCLOUD_ADMIN_USER` and `NEXTCLOUD_ADMIN_PASSWORD`, you're logged in as admin automatically
3. If not, the web installer appears — create your admin account and select PostgreSQL as the database
4. Install recommended apps when prompted (Calendar, Contacts, Talk, etc.)

## Configuration

### Trusted Domains

If you access Nextcloud from a domain not in `NEXTCLOUD_TRUSTED_DOMAINS`, you'll see "Access through untrusted domain." Fix it:

```bash
docker compose exec -u www-data app php occ config:system:set trusted_domains 2 --value="new-domain.com"
```

### Reverse Proxy Settings

When behind a reverse proxy (strongly recommended for HTTPS), configure Nextcloud to trust it:

```bash
docker compose exec -u www-data app php occ config:system:set overwriteprotocol --value="https"
docker compose exec -u www-data app php occ config:system:set trusted_proxies 0 --value="172.16.0.0/12"
```

Without `overwriteprotocol`, Nextcloud enters a redirect loop when accessed via HTTPS.

### Email (SMTP)

Add SMTP environment variables for notifications and password resets:

```yaml
environment:
  # ... existing vars ...
  SMTP_HOST: "smtp.gmail.com"
  SMTP_SECURE: "tls"
  SMTP_PORT: "587"
  SMTP_NAME: "your-email@gmail.com"
  SMTP_PASSWORD: "your-app-password"
  MAIL_FROM_ADDRESS: "nextcloud"
  MAIL_DOMAIN: "yourdomain.com"
```

### Background Jobs

Verify the cron container is handling background tasks:

```bash
docker compose exec -u www-data app php occ background:cron
```

In the admin panel under **Administration > Basic settings**, confirm "Background jobs" is set to "Cron."

### External Storage

For large file libraries, mount external storage directly:

```yaml
volumes:
  - nextcloud-html:/var/www/html
  - /mnt/storage/nextcloud-data:/var/www/html/data
```

**Warning:** Set this before first run. Moving data after installation requires `occ maintenance:data-fingerprint` and manual directory moves.

## Advanced Configuration (Optional)

### Office Document Editing

Install Collabora Online or OnlyOffice for real-time document editing:

```bash
docker compose exec -u www-data app php occ app:install richdocuments
```

Then deploy a Collabora container alongside Nextcloud and configure the WOPI URL in Settings > Office.

### S3 Object Storage

For scalable storage with S3-compatible backends:

```yaml
environment:
  OBJECTSTORE_S3_BUCKET: "nextcloud-data"
  OBJECTSTORE_S3_REGION: "us-east-1"
  OBJECTSTORE_S3_HOST: "s3.amazonaws.com"
  OBJECTSTORE_S3_KEY: "your-access-key"
  OBJECTSTORE_S3_SECRET: "your-secret-key"
```

**Note:** S3 storage replaces local file storage entirely. Configure before first run — migration is complex.

### Performance Tuning

For larger installations (10+ users):

```yaml
environment:
  PHP_MEMORY_LIMIT: "1G"
  PHP_UPLOAD_LIMIT: "16G"
  PHP_OPCACHE_MEMORY_CONSUMPTION: "256"
```

## Reverse Proxy

With [Nginx Proxy Manager](/apps/nginx-proxy-manager):

1. Add a proxy host for `cloud.yourdomain.com` → `http://nextcloud:80` (or `your-server-ip:8080`)
2. Enable SSL with Let's Encrypt
3. In the **Advanced** tab, add:
   ```nginx
   client_max_body_size 16G;
   proxy_set_header Host $host;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   proxy_set_header X-Forwarded-Proto $scheme;
   ```
4. Configure Nextcloud's trusted proxy and overwrite settings (see above)

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for detailed instructions.

## Backup

Back up both the application data and the database:

```bash
# Database backup (portable SQL dump)
docker compose exec nextcloud-db pg_dump -U nextcloud nextcloud > nextcloud-db-backup.sql

# Application data backup
docker compose stop
docker run --rm -v nextcloud-html:/data -v $(pwd):/backup alpine tar czf /backup/nextcloud-data-backup.tar.gz /data
docker compose start
```

The `/var/www/html` volume contains user files, configuration, and installed apps. The database contains user accounts, file metadata, sharing permissions, and calendar/contacts data. Both are critical. See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### "Access through untrusted domain"

**Symptom:** Error page saying the domain is not trusted

**Fix:** Add the domain to trusted domains:
```bash
docker compose exec -u www-data app php occ config:system:set trusted_domains 2 --value="your-domain.com"
```

### Redirect loop with HTTPS

**Symptom:** Browser shows "too many redirects" when accessing via HTTPS through a reverse proxy

**Fix:** Set the overwrite protocol:
```bash
docker compose exec -u www-data app php occ config:system:set overwriteprotocol --value="https"
docker compose exec -u www-data app php occ config:system:set trusted_proxies 0 --value="172.16.0.0/12"
```

### Large file uploads failing

**Symptom:** Uploads fail for files larger than 512 MB

**Fix:** Increase limits in all layers:
1. Set `PHP_UPLOAD_LIMIT: "16G"` in the Nextcloud environment
2. Set `APACHE_BODY_LIMIT: "0"` to disable the Apache limit
3. If using a reverse proxy, set `client_max_body_size 16G;` in the proxy config
4. The effective limit is the **smallest** value across all layers

### "PHP memory limit below recommended"

**Symptom:** Admin panel shows a warning about PHP memory

**Fix:** Set `PHP_MEMORY_LIMIT: "512M"` (or higher). Verify:
```bash
docker compose exec app php -i | grep memory_limit
```

### Slow performance

**Symptom:** Page loads are slow, especially with many files

**Fix:**
1. Ensure Redis is running and connected (check admin panel > Overview)
2. Increase OPcache: `PHP_OPCACHE_MEMORY_CONSUMPTION: "256"`
3. Ensure cron is running (not AJAX-based background jobs)
4. Use PostgreSQL, not SQLite

## Resource Requirements

- **RAM:** 512 MB idle, 1-2 GB under active use with Redis and PostgreSQL
- **CPU:** Low for file storage. Medium for document editing, video preview generation.
- **Disk:** 1 GB for the application, plus all user file storage

## Frequently Asked Questions

### Is Nextcloud free?

Yes. Nextcloud is fully open source under AGPL-3.0. Nextcloud GmbH sells enterprise support, but the software is identical.

### Can I run Nextcloud on a Raspberry Pi?

Yes, but performance is limited. A Pi 4 with 4 GB RAM and an SSD works for 1-3 users. For more users, use an Intel N100 mini PC.

### Should I use PostgreSQL or MariaDB?

PostgreSQL is recommended for new installations. It handles concurrent access better. MariaDB also works well and has a larger community of Nextcloud users.

### How does Nextcloud compare to Seafile?

Nextcloud is a full cloud platform (files, calendar, contacts, office, apps). [Seafile](/apps/seafile) focuses purely on file sync with better performance for large libraries. Use Nextcloud for an all-in-one platform. Use Seafile for fast file sync only.

## Verdict

Nextcloud is the default recommendation for anyone wanting a self-hosted cloud platform. It replaces Dropbox, Google Drive, Google Calendar, Google Contacts, and more. The app ecosystem is massive, the community is the largest in self-hosting, and it's backed by a company with a sustainable business model. The downside is complexity — Nextcloud has more moving parts than simpler alternatives, and performance tuning requires attention. For users who only need file sync, [Syncthing](/apps/syncthing) or [Seafile](/apps/seafile) are lighter.

## Related

- [How to Self-Host Syncthing](/apps/syncthing)
- [Best Self-Hosted File Sync & Storage](/best/file-sync)
- [Nextcloud vs Seafile](/compare/nextcloud-vs-seafile)
- [Syncthing vs Nextcloud](/compare/syncthing-vs-nextcloud)
- [Replace Dropbox](/replace/dropbox)
- [Replace Google Drive](/replace/google-drive)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
