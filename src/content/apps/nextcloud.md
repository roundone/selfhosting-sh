---
title: "How to Self-Host Nextcloud with Docker Compose"
type: "app-guide"
app: "nextcloud"
category: "file-sync"
replaces: "Google Drive"
difficulty: "intermediate"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up Nextcloud, the most popular self-hosted cloud platform, with a production-ready Docker Compose config."
officialUrl: "https://nextcloud.com"
githubUrl: "https://github.com/nextcloud/server"
defaultPort: 8080
minRam: "2GB"
---

## What is Nextcloud?

Nextcloud is the Swiss Army knife of self-hosting. It replaces Google Drive, Google Calendar, Google Contacts, and dozens of other cloud services with a single platform you control. File sync, document editing, video calls, task management — it does it all. It's the most popular self-hosted cloud platform, backed by a commercial company with an active open-source community.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- A server with at least 2GB RAM ([best mini PCs for self-hosting](/hardware/best-mini-pc/))
- A domain name pointing to your server (recommended for SSL)
- Sufficient storage for your files

## Docker Compose Configuration

```yaml
# docker-compose.yml for Nextcloud
# Tested with Nextcloud 29+

services:
  nextcloud:
    container_name: nextcloud
    image: nextcloud:29-apache
    ports:
      - "8080:80"
    volumes:
      - nextcloud_data:/var/www/html
      - ./data:/var/www/html/data
    environment:
      - MYSQL_HOST=db
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_PASSWORD=${DB_PASSWORD}
      - NEXTCLOUD_ADMIN_USER=${ADMIN_USER}
      - NEXTCLOUD_ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - NEXTCLOUD_TRUSTED_DOMAINS=${TRUSTED_DOMAINS}
      # Performance tuning
      - PHP_MEMORY_LIMIT=1024M
      - PHP_UPLOAD_LIMIT=16G
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  db:
    container_name: nextcloud_db
    image: mariadb:11
    volumes:
      - db_data:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_PASSWORD=${DB_PASSWORD}
    command: --transaction-isolation=READ-COMMITTED --log-bin=binlog --binlog-format=ROW
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    container_name: nextcloud_redis
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: redis-cli ping || exit 1
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  cron:
    container_name: nextcloud_cron
    image: nextcloud:29-apache
    volumes:
      - nextcloud_data:/var/www/html
      - ./data:/var/www/html/data
    entrypoint: /cron.sh
    depends_on:
      - nextcloud
    restart: unless-stopped

volumes:
  nextcloud_data:
  db_data:
  redis_data:
```

Create a `.env` file:

```bash
# .env file for Nextcloud
DB_PASSWORD=change-this-secure-password
DB_ROOT_PASSWORD=change-this-root-password
ADMIN_USER=admin
ADMIN_PASSWORD=change-this-admin-password
TRUSTED_DOMAINS=localhost your-domain.com
```

## Step-by-Step Setup

1. **Create a directory for Nextcloud:**
   ```bash
   mkdir ~/nextcloud && cd ~/nextcloud
   ```

2. **Create the `docker-compose.yml` and `.env` files** with the configs above. Change all passwords.

3. **Start the containers:**
   ```bash
   docker compose up -d
   ```

4. **Wait for initialization** — first startup takes 1-2 minutes while the database is configured.

5. **Access the web UI** at `http://your-server-ip:8080`

6. **Enable Redis caching** — go to Settings → Administration → Basic settings and verify Redis is detected. If not, edit `config.php`:
   ```php
   'memcache.local' => '\\OC\\Memcache\\APCu',
   'memcache.distributed' => '\\OC\\Memcache\\Redis',
   'memcache.locking' => '\\OC\\Memcache\\Redis',
   'redis' => [
       'host' => 'redis',
       'port' => 6379,
   ],
   ```

7. **Install the desktop and mobile sync clients** from [nextcloud.com/install](https://nextcloud.com/install/#install-clients).

## Configuration Tips

- **Increase upload limits:** The config above already sets `PHP_UPLOAD_LIMIT=16G`. Verify in Settings → Administration.
- **Background jobs:** The `cron` container handles background tasks automatically. Verify it's set to "Cron" in Settings → Administration → Basic settings.
- **Reverse proxy:** Put Nextcloud behind a reverse proxy for HTTPS. See our [reverse proxy guide](/foundations/reverse-proxy/). You'll need to set `overwriteprotocol` to `https` in `config.php`.
- **Collabora/OnlyOffice:** Add document editing by installing the Collabora Online or OnlyOffice app from the Nextcloud app store.

## Backup & Migration

- **Backup:** Back up the `data` folder (your files), the MariaDB database (`docker exec nextcloud_db mysqldump --single-transaction -u root -p nextcloud > backup.sql`), and the `config.php` file.
- **Migration from Google Drive:** Use Google Takeout to export your files, then upload them through the Nextcloud web interface or sync client.

## Troubleshooting

- **Sync not working:** Check that the trusted domains setting includes your actual domain/IP. See our [Nextcloud sync troubleshooting guide](/troubleshooting/nextcloud/sync-not-working/).
- **Slow performance:** Enable Redis caching (see step 6), increase PHP memory limit, and consider [Nextcloud performance optimization](/troubleshooting/nextcloud/slow-performance/).
- **502 Bad Gateway behind reverse proxy:** Check the `overwriteprotocol`, `overwritecliurl`, and `trusted_proxies` settings in `config.php`.

## Alternatives

If you only need file sync (without calendars, contacts, and apps), consider [Syncthing](/apps/syncthing/) (peer-to-peer, no server needed) or [Seafile](/apps/seafile/) (faster sync for large libraries). See our [Nextcloud vs Syncthing comparison](/compare/nextcloud-vs-syncthing/) or the full [Best Self-Hosted File Sync](/best/file-sync/) roundup.

## Verdict

Nextcloud is the default choice for self-hosted cloud storage. No other platform comes close to its breadth of features. The tradeoff is complexity — it's heavier than single-purpose tools and needs tuning for good performance. But if you want one platform to replace Google Workspace, Nextcloud is it.
