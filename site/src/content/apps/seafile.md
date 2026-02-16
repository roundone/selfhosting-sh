---
title: "How to Self-Host Seafile with Docker"
description: "Set up Seafile file sync and share server with Docker Compose including MariaDB for a fast, reliable Dropbox alternative."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "file-sync-storage"
apps:
  - seafile
tags:
  - self-hosted
  - file-sync
  - seafile
  - docker
  - dropbox-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Seafile?

[Seafile](https://www.seafile.com) is a self-hosted file sync and share server built for speed and reliability. It syncs files faster than any other self-hosted solution — including Nextcloud — because it uses a custom data model based on block-level deduplication rather than whole-file sync. Seafile replaces Dropbox, Google Drive, and OneDrive with a private server you control. It supports file versioning, client-side encryption, and collaborative editing through SeaDoc. The server is open source under the AGPL-3.0 license and has been actively developed since 2012.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB of RAM minimum
- 10 GB of free disk space for the application, plus storage for your files
- A domain name (recommended for remote access and mobile/desktop sync clients)

## Docker Compose Configuration

Create a directory for the Seafile stack:

```bash
mkdir -p ~/seafile && cd ~/seafile
```

Create a `.env` file with your configuration:

```bash
# MariaDB root password — used during initial database creation only
INIT_SEAFILE_MYSQL_ROOT_PASSWORD=change-me-strong-root-password

# Seafile database credentials
SEAFILE_MYSQL_DB_PASSWORD=change-me-strong-db-password

# Seafile admin account — only used on first run
INIT_SEAFILE_ADMIN_EMAIL=admin@example.com
INIT_SEAFILE_ADMIN_PASSWORD=change-me-strong-admin-password

# Server hostname — set to your domain or server IP
SEAFILE_SERVER_HOSTNAME=seafile.example.com

# Protocol — use https if behind a reverse proxy with SSL
SEAFILE_SERVER_PROTOCOL=http

# Timezone
TIME_ZONE=UTC
```

Create a `docker-compose.yml` file:

```yaml
services:
  db:
    image: mariadb:11.7
    container_name: seafile-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${INIT_SEAFILE_MYSQL_ROOT_PASSWORD}
      MYSQL_LOG_CONSOLE: "true"
    volumes:
      - seafile-db:/var/lib/mysql
    networks:
      - seafile-net
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  seafile:
    image: seafileltd/seafile-mc:13.0.18
    container_name: seafile
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "80:80"
    volumes:
      - seafile-data:/shared/seafile
    environment:
      SEAFILE_MYSQL_DB_HOST: db
      SEAFILE_MYSQL_DB_PORT: "3306"
      SEAFILE_MYSQL_DB_USER: seafile
      SEAFILE_MYSQL_DB_PASSWORD: ${SEAFILE_MYSQL_DB_PASSWORD}
      INIT_SEAFILE_MYSQL_ROOT_PASSWORD: ${INIT_SEAFILE_MYSQL_ROOT_PASSWORD}
      INIT_SEAFILE_ADMIN_EMAIL: ${INIT_SEAFILE_ADMIN_EMAIL}
      INIT_SEAFILE_ADMIN_PASSWORD: ${INIT_SEAFILE_ADMIN_PASSWORD}
      SEAFILE_SERVER_HOSTNAME: ${SEAFILE_SERVER_HOSTNAME}
      SEAFILE_SERVER_PROTOCOL: ${SEAFILE_SERVER_PROTOCOL}
      TIME_ZONE: ${TIME_ZONE}
    networks:
      - seafile-net

volumes:
  seafile-db:
  seafile-data:

networks:
  seafile-net:
```

**Important details:**

- MariaDB must be fully healthy before Seafile starts. The `depends_on` with `condition: service_healthy` enforces this. Seafile will fail to initialize if the database is not ready.
- Seafile runs Nginx internally on port 80. Do not try to put Nginx in front of port 443 on the same host without remapping this port.
- The `INIT_SEAFILE_ADMIN_EMAIL` and `INIT_SEAFILE_ADMIN_PASSWORD` values are only used on the first run to create the admin account. Changing them later has no effect.
- Seafile automatically creates three databases: `ccnet_db`, `seafile_db`, and `seahub_db`.

Start the stack:

```bash
docker compose up -d
```

Watch the logs during first startup to confirm initialization completes:

```bash
docker compose logs -f seafile
```

Wait until you see `Seafile server started` in the output before accessing the web UI.

## Initial Setup

1. Open `http://your-server-ip` (or `http://seafile.example.com` if DNS is configured) in a browser
2. Log in with the admin email and password from your `.env` file
3. Create your first **Library** — this is Seafile's equivalent of a shared folder. Each library is independently versioned and can be encrypted, shared, or synced to desktop/mobile clients.
4. Install the [Seafile desktop client](https://www.seafile.com/en/download/) on your computer. Enter your server URL, log in, and select which libraries to sync locally.
5. For mobile access, install the Seafile app for [Android](https://play.google.com/store/apps/details?id=com.seafile.seadroid2) or [iOS](https://apps.apple.com/app/seafile/id1488498498).

## Configuration

### Server Hostname and Protocol

If you change your domain or switch to HTTPS (via a reverse proxy), update the `.env` file:

```bash
SEAFILE_SERVER_HOSTNAME=seafile.yourdomain.com
SEAFILE_SERVER_PROTOCOL=https
```

Then restart the stack:

```bash
docker compose down && docker compose up -d
```

Alternatively, edit the configuration directly inside the container at `/shared/seafile/conf/seahub_settings.py`:

```python
SERVICE_URL = "https://seafile.yourdomain.com"
FILE_SERVER_ROOT = "https://seafile.yourdomain.com/seafhttp"
```

### File Upload Limits

By default, Seafile limits file uploads to 200 MB via the web interface. To increase this, edit `/shared/seafile/conf/seahub_settings.py` inside the container or mounted volume:

```python
# Maximum upload file size (in MB)
MAX_UPLOAD_FILE_SIZE = 5120  # 5 GB
```

Restart Seafile after changing settings:

```bash
docker compose restart seafile
```

### Timezone

Set the `TIME_ZONE` variable in your `.env` file to your local timezone (e.g., `America/New_York`, `Europe/Berlin`). This affects file modification timestamps and activity logs.

## Advanced Configuration (Optional)

### Memcached for Performance

Add Memcached to your stack for better performance with many users. Add this service to your `docker-compose.yml`:

```yaml
  memcached:
    image: memcached:1.6-alpine
    container_name: seafile-memcached
    restart: unless-stopped
    entrypoint: memcached -m 256
    networks:
      - seafile-net
```

Then edit `/shared/seafile/conf/seahub_settings.py`:

```python
CACHES = {
    'default': {
        'BACKEND': 'django_pylibmc.memcached.PyLibMCCache',
        'LOCATION': 'memcached:11211',
    },
}
```

### Full-Text Search with Elasticsearch

For searching inside file contents across all your libraries, add Elasticsearch:

```yaml
  elasticsearch:
    image: elasticsearch:8.16.2
    container_name: seafile-elasticsearch
    restart: unless-stopped
    environment:
      discovery.type: single-node
      ES_JAVA_OPTS: "-Xms512m -Xmx512m"
      xpack.security.enabled: "false"
    volumes:
      - seafile-es:/usr/share/elasticsearch/data
    networks:
      - seafile-net
```

Add the volume to the `volumes` section:

```yaml
volumes:
  seafile-db:
  seafile-data:
  seafile-es:
```

Configure Seafile to use it by editing `/shared/seafile/conf/seafile.conf`:

```ini
[search]
enabled = true
index_office_pdf = true
```

And in `/shared/seafile/conf/seahub_settings.py`:

```python
OFFICE_CONVERTOR_ROOT = 'http://seafile:80'
```

Elasticsearch adds approximately 512 MB of RAM usage. Only enable it if you have the resources and need content search.

### S3 Backend Storage

Seafile supports storing file data on S3-compatible storage (AWS S3, MinIO, Backblaze B2) instead of local disk. This is useful for large deployments. Configure it in `/shared/seafile/conf/seafile.conf`:

```ini
[commit_object_backend]
name = s3
bucket = seafile-commits
key_id = your-access-key
key = your-secret-key
host = s3.amazonaws.com
use_https = true

[fs_object_backend]
name = s3
bucket = seafile-fs
key_id = your-access-key
key = your-secret-key
host = s3.amazonaws.com
use_https = true

[block_backend]
name = s3
bucket = seafile-blocks
key_id = your-access-key
key = your-secret-key
host = s3.amazonaws.com
use_https = true
```

### LDAP Authentication

For organizations with existing directory services, Seafile supports LDAP/Active Directory. Edit `/shared/seafile/conf/seahub_settings.py`:

```python
ENABLE_LDAP = True
LDAP_SERVER_URL = 'ldap://ldap.example.com'
LDAP_BASE_DN = 'ou=users,dc=example,dc=com'
LDAP_ADMIN_DN = 'cn=admin,dc=example,dc=com'
LDAP_ADMIN_PASSWORD = 'ldap-admin-password'
LDAP_LOGIN_ATTR = 'uid'
```

## Reverse Proxy

Seafile runs Nginx internally on port 80. To serve it over HTTPS using [Nginx Proxy Manager](/apps/nginx-proxy-manager):

1. Add a proxy host for `seafile.yourdomain.com`
2. Forward to `http://seafile:80` (if on the same Docker network) or `http://your-server-ip:80`
3. Enable SSL with Let's Encrypt
4. Under **Advanced**, add these custom Nginx directives:

```nginx
client_max_body_size 0;

proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header Host $http_host;
proxy_redirect off;
```

After configuring the reverse proxy, update your `.env` to use HTTPS:

```bash
SEAFILE_SERVER_PROTOCOL=https
```

Restart the Seafile container for the change to take effect.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for detailed configuration guides.

## Backup

Back up two things: the Seafile data volume and the MariaDB databases.

### Database Backup

```bash
docker exec seafile-db mariadb-dump -u root -p"$INIT_SEAFILE_MYSQL_ROOT_PASSWORD" --all-databases > seafile-db-backup.sql
```

### Data Volume Backup

```bash
docker compose stop seafile
docker run --rm -v seafile-data:/data -v $(pwd):/backup alpine tar czf /backup/seafile-data-backup.tar.gz /data
docker compose start seafile
```

### Automated Backup Script

```bash
#!/bin/bash
BACKUP_DIR=/path/to/backups
DATE=$(date +%Y-%m-%d)

# Database dump
docker exec seafile-db mariadb-dump -u root -p"YOUR_ROOT_PASSWORD" --all-databases > "$BACKUP_DIR/seafile-db-$DATE.sql"

# Data files (stop Seafile for consistency)
docker compose -f ~/seafile/docker-compose.yml stop seafile
docker run --rm -v seafile-data:/data -v "$BACKUP_DIR":/backup alpine tar czf "/backup/seafile-data-$DATE.tar.gz" /data
docker compose -f ~/seafile/docker-compose.yml start seafile

# Retain last 7 backups
find "$BACKUP_DIR" -name "seafile-*" -mtime +7 -delete
```

The `/shared/seafile` volume contains all configuration files (`conf/`), the Seafile data directory, and Nginx config. Losing it means a full reconfiguration. Follow a [3-2-1 backup strategy](/foundations/backup-3-2-1-rule) — keep copies on a separate disk and offsite.

## Troubleshooting

### Database connection refused

**Symptom:** Seafile logs show `Can't connect to MySQL server on 'db'` or the container keeps restarting.

**Fix:** MariaDB must be fully initialized and healthy before Seafile starts. Check MariaDB health:

```bash
docker compose ps
docker compose logs db
```

If MariaDB is still starting, wait for it. If it's crashing, check the root password matches between services. The `INIT_SEAFILE_MYSQL_ROOT_PASSWORD` in Seafile must match `MYSQL_ROOT_PASSWORD` in the MariaDB service. If you changed the password after the first run, the databases still have the old password — you will need to recreate the MariaDB volume or reset the password manually.

### Admin login fails after first setup

**Symptom:** The admin email and password from `.env` do not work at the login screen.

**Fix:** The `INIT_SEAFILE_ADMIN_EMAIL` and `INIT_SEAFILE_ADMIN_PASSWORD` variables only take effect on the very first startup when databases are created. If you changed them after the first run, they are ignored. Reset the admin password manually:

```bash
docker exec -it seafile /opt/seafile/seafile-server-latest/reset-admin.sh
```

Follow the prompts to set a new admin email and password.

### File upload fails or times out

**Symptom:** Large file uploads through the web UI fail, time out, or show a generic error.

**Fix:** Several things can cause this:

1. **Web upload size limit:** Edit `/shared/seafile/conf/seahub_settings.py` and increase `MAX_UPLOAD_FILE_SIZE` (in MB).
2. **Reverse proxy body size limit:** If behind Nginx Proxy Manager or another proxy, set `client_max_body_size 0;` to remove the limit.
3. **Proxy timeout:** For very large files, increase proxy timeout values. In Nginx: `proxy_read_timeout 3600;`

Restart both the reverse proxy and Seafile after changes.

### Sync client cannot connect to server

**Symptom:** The Seafile desktop or mobile client reports "Failed to connect to server" or "Network error."

**Fix:**

1. Verify `SEAFILE_SERVER_HOSTNAME` matches the URL you are using in the client.
2. If behind a reverse proxy, confirm `SEAFILE_SERVER_PROTOCOL` is set to `https` and the proxy is correctly forwarding traffic.
3. Check that port 80 (or 443 via proxy) is accessible from outside your network.
4. Verify the `SERVICE_URL` and `FILE_SERVER_ROOT` values in `seahub_settings.py` match your actual URL:

```python
SERVICE_URL = "https://seafile.yourdomain.com"
FILE_SERVER_ROOT = "https://seafile.yourdomain.com/seafhttp"
```

### Slow performance with many files

**Symptom:** The web UI is sluggish, library browsing is slow, or sync takes longer than expected.

**Fix:**

1. **Add Memcached.** See the Advanced Configuration section — this alone makes a significant difference for the web UI.
2. **Increase MariaDB memory.** Add `innodb_buffer_pool_size = 512M` to the MariaDB configuration for large libraries.
3. **Check disk I/O.** Seafile stores data as blocks on disk. Use an SSD for the data volume if possible.
4. **Check available RAM.** If the server is swapping, performance drops significantly. Monitor with `free -h`.

## Resource Requirements

- **RAM:** ~500 MB for Seafile (Nginx + Seahub + Seafile server), ~200 MB for MariaDB. Total: ~700 MB minimum. Add 512 MB if using Elasticsearch.
- **CPU:** Low to medium. Seafile is I/O-bound, not CPU-bound. Peaks during file indexing and garbage collection.
- **Disk:** ~500 MB for the application. Storage for file data depends entirely on your usage. Seafile's block-level deduplication means duplicate files consume no extra space.

## Frequently Asked Questions

### What is the difference between Seafile and Nextcloud?

Seafile focuses on file sync and share. It is faster at syncing, uses fewer resources, and handles large file libraries more efficiently. [Nextcloud](/apps/nextcloud) is a full cloud platform with calendar, contacts, office document editing, and hundreds of apps. Choose Seafile if you primarily need reliable, fast file sync. Choose Nextcloud if you want an all-in-one cloud workspace. See our [detailed comparison](/compare/nextcloud-vs-seafile).

### Does Seafile have desktop and mobile clients?

Yes. Seafile provides native sync clients for Windows, macOS, and Linux, plus mobile apps for Android and iOS. The desktop client supports selective sync (choose which libraries to sync locally) and virtual drive mode (browse all libraries without downloading everything). The clients are free.

### What is the maximum file size Seafile can handle?

There is no hard limit on individual file size. The default web upload limit is 200 MB, but this is configurable (see Configuration section). The desktop and mobile clients have no practical size limit — they handle multi-gigabyte files without issues because Seafile splits files into blocks and syncs them incrementally.

### Is Seafile free?

The Community Edition is free and open source. It includes file sync, sharing, versioning, client-side encryption, and the web UI. The Professional Edition adds features like full-text search, online document preview, audit logging, and LDAP group sync. The Pro Edition is free for up to 3 users.

## Verdict

Seafile is the fastest self-hosted file sync and share solution available. If your primary need is syncing files between devices and sharing with collaborators, Seafile outperforms [Nextcloud](/apps/nextcloud) in raw sync speed, resource efficiency, and reliability with large file libraries. The block-level deduplication and delta sync mean only changed portions of files transfer, which makes a real difference with large files.

The trade-off is ecosystem. Nextcloud has calendar, contacts, office suites, and hundreds of plugins. Seafile does file sync and does it exceptionally well. If you need a full Google Workspace replacement, use Nextcloud. If you need a fast, reliable Dropbox replacement and nothing else, Seafile is the better choice.

For users coming from [Syncthing](/apps/syncthing) who want a central server with a web interface and user management, Seafile is the natural step up — it adds a proper web UI and multi-user support while keeping sync performance competitive.

## Related

- [Best Self-Hosted File Sync & Storage](/best/file-sync-storage)
- [How to Self-Host Nextcloud](/apps/nextcloud)
- [How to Self-Host Syncthing](/apps/syncthing)
- [Nextcloud vs Seafile](/compare/nextcloud-vs-seafile)
- [Seafile vs Syncthing](/compare/seafile-vs-syncthing)
- [Replace Google Drive](/replace/google-drive)
- [Replace Dropbox](/replace/dropbox)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
