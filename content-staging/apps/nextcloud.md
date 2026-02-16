---
title: "How to Self-Host Nextcloud with Docker"
description: "Deploy Nextcloud with Docker Compose for self-hosted cloud storage with file sync, calendar, contacts, notes, and collaborative document editing."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "file-sync-storage"
apps:
  - nextcloud
tags: ["self-hosted", "cloud-storage", "nextcloud", "docker", "file-sync"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Nextcloud?

[Nextcloud](https://nextcloud.com) is a self-hosted cloud platform that replaces Google Drive, Dropbox, OneDrive, Google Calendar, Google Contacts, and Google Docs in a single application. It handles file sync and sharing, calendar (CalDAV), contacts (CardDAV), notes, tasks, talk (video calls), and collaborative document editing. It is the Swiss Army knife of self-hosting — no other app covers this much ground from one install.

Nextcloud is open source (AGPL-3.0), backed by a commercial company (Nextcloud GmbH), and has one of the largest self-hosting communities on the internet. If you only self-host one thing, this is a strong candidate.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([Docker Compose Basics](/foundations/docker-compose-basics))
- 2 GB of RAM minimum (4 GB recommended for daily use)
- 10 GB of free disk space for the application, plus storage for your files
- A domain name (required for desktop and mobile sync clients to work reliably)

## Docker Compose Configuration

This stack runs Nextcloud with PostgreSQL (faster and more reliable than SQLite or MySQL for Nextcloud) and Redis (required for transactional file locking and a significant performance improvement).

Create a project directory:

```bash
mkdir -p ~/nextcloud && cd ~/nextcloud
```

Create a `docker-compose.yml` file:

```yaml
services:
  nextcloud:
    image: nextcloud:32.0.6-apache
    container_name: nextcloud-app
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - nextcloud-html:/var/www/html
      - nextcloud-data:/var/www/html/data
      - nextcloud-config:/var/www/html/config
      - nextcloud-apps:/var/www/html/custom_apps
    environment:
      # Database
      POSTGRES_HOST: nextcloud-db
      POSTGRES_DB: nextcloud
      POSTGRES_USER: nextcloud
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

      # Admin account — created on first run
      NEXTCLOUD_ADMIN_USER: ${NEXTCLOUD_ADMIN_USER}
      NEXTCLOUD_ADMIN_PASSWORD: ${NEXTCLOUD_ADMIN_PASSWORD}

      # Redis — enables file locking and memory caching
      REDIS_HOST: nextcloud-redis

      # Reverse proxy settings — set your actual domain
      NEXTCLOUD_TRUSTED_DOMAINS: ${NEXTCLOUD_TRUSTED_DOMAINS}
      OVERWRITEPROTOCOL: https
      OVERWRITECLIURL: ${OVERWRITECLIURL}

      # Trusted proxies — required if behind a reverse proxy
      APACHE_DISABLE_REWRITE_IP: 1
      TRUSTED_PROXIES: ${TRUSTED_PROXIES:-172.16.0.0/12}

      # PHP tuning
      PHP_MEMORY_LIMIT: 1G
      PHP_UPLOAD_LIMIT: 10G
    depends_on:
      nextcloud-db:
        condition: service_healthy
      nextcloud-redis:
        condition: service_started
    networks:
      - nextcloud-net

  nextcloud-db:
    image: postgres:17.4-alpine
    container_name: nextcloud-db
    restart: unless-stopped
    volumes:
      - nextcloud-db-data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: nextcloud
      POSTGRES_USER: nextcloud
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nextcloud -d nextcloud"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - nextcloud-net

  nextcloud-redis:
    image: redis:7.2.4-alpine
    container_name: nextcloud-redis
    restart: unless-stopped
    command: redis-server --save 60 1 --loglevel warning
    volumes:
      - nextcloud-redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - nextcloud-net

  nextcloud-cron:
    image: nextcloud:32.0.6-apache
    container_name: nextcloud-cron
    restart: unless-stopped
    entrypoint: /cron.sh
    volumes:
      - nextcloud-html:/var/www/html
      - nextcloud-data:/var/www/html/data
      - nextcloud-config:/var/www/html/config
      - nextcloud-apps:/var/www/html/custom_apps
    depends_on:
      - nextcloud
    networks:
      - nextcloud-net

volumes:
  nextcloud-html:
  nextcloud-data:
  nextcloud-db-data:
  nextcloud-redis-data:
  nextcloud-config:
  nextcloud-apps:

networks:
  nextcloud-net:
    driver: bridge
```

Create a `.env` file alongside your `docker-compose.yml`:

```bash
# Database password — change this to a strong random string
POSTGRES_PASSWORD=CHANGE_ME_to_a_strong_random_password

# Nextcloud admin account — created on first startup only
NEXTCLOUD_ADMIN_USER=admin
NEXTCLOUD_ADMIN_PASSWORD=CHANGE_ME_to_a_strong_password

# Your domain(s) — space-separated if multiple
NEXTCLOUD_TRUSTED_DOMAINS=cloud.example.com

# Full URL for CLI operations and email links
OVERWRITECLIURL=https://cloud.example.com

# Trusted proxy subnet — default covers Docker bridge networks
# Change to your reverse proxy IP or subnet if needed
TRUSTED_PROXIES=172.16.0.0/12
```

**You must change** `POSTGRES_PASSWORD`, `NEXTCLOUD_ADMIN_PASSWORD`, `NEXTCLOUD_TRUSTED_DOMAINS`, and `OVERWRITECLIURL` before starting. The defaults will not work.

Start the stack:

```bash
docker compose up -d
```

First startup takes 1-2 minutes while Nextcloud initializes the database and installs default apps. Watch the logs:

```bash
docker compose logs -f nextcloud
```

Wait until you see `Apache/2.4.x (Debian) configured` in the output.

## Initial Setup

Open `http://your-server-ip:8080` in a browser. If you set `NEXTCLOUD_ADMIN_USER` and `NEXTCLOUD_ADMIN_PASSWORD` in your `.env`, the admin account is already created and you can log in directly.

After logging in, go to **Administration Settings** (click your avatar in the top right, then **Administration settings**). The **Overview** page will show security and setup warnings. Common warnings and how to fix them:

**"The database is missing some indexes"** — Run inside the container:

```bash
docker exec -u www-data nextcloud-app php occ db:add-missing-indices
```

**"Some columns in the database are missing a conversion to big int"** — Run:

```bash
docker exec -u www-data nextcloud-app php occ db:convert-filecache-bigint
```

**"The "Strict-Transport-Security" HTTP header is not set"** — This is handled by your reverse proxy. Configure HSTS there, not in Nextcloud.

**"Your installation has no default phone region set"** — Add to your Nextcloud config. Run:

```bash
docker exec -u www-data nextcloud-app php occ config:system:set default_phone_region --value="US"
```

Replace `US` with your [ISO 3166-1 alpha-2 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2).

## Configuration

### Desktop and Mobile Sync Clients

Install the Nextcloud client for your platform:

- **Desktop:** [nextcloud.com/install/#install-clients](https://nextcloud.com/install/#install-clients) — available for Linux, macOS, Windows
- **Mobile:** Nextcloud app on [Google Play](https://play.google.com/store/apps/details?id=com.nextcloud.client), [F-Droid](https://f-droid.org/packages/com.nextcloud.client/), or [Apple App Store](https://apps.apple.com/app/nextcloud/id1125420102)

In the client, enter your server URL (e.g., `https://cloud.example.com`). Log in through the browser flow. The client supports selective sync — choose which folders to keep on your device.

For the best experience, enable end-to-end encryption in the client settings if you want zero-knowledge encryption for specific folders.

### Calendar and Contacts (CalDAV/CardDAV)

Calendar and Contacts apps are installed by default. To connect external clients:

**iOS/macOS:** Go to Settings > Calendar > Accounts > Add Account > Other > CalDAV. Enter:
- Server: `https://cloud.example.com/remote.php/dav`
- Username and password: your Nextcloud credentials

Contacts uses the same server URL under CardDAV.

**Android:** Install [DAVx5](https://www.davx5.com/) from F-Droid or Play Store. Add a new account with your Nextcloud URL. DAVx5 auto-discovers calendars and contacts.

**Thunderbird:** Add a new CalDAV calendar:
- URL: `https://cloud.example.com/remote.php/dav/calendars/USERNAME/personal/`
- For contacts: `https://cloud.example.com/remote.php/dav/addressbooks/users/USERNAME/contacts/`

### Collabora Online / OnlyOffice Integration

For in-browser document editing (like Google Docs), add a document server. Collabora CODE is the recommended option for Nextcloud.

Add this service to your `docker-compose.yml`:

```yaml
  collabora:
    image: collabora/code:24.04.12.2.1
    container_name: nextcloud-collabora
    restart: unless-stopped
    environment:
      - aliasgroup1=https://cloud.example.com:443
      - extra_params=--o:ssl.enable=false --o:ssl.termination=true
    cap_add:
      - MKNOD
    networks:
      - nextcloud-net
```

After starting the Collabora container, install the **Nextcloud Office** app from the Nextcloud App Store (Administration settings > Apps). Then go to **Administration settings > Nextcloud Office** and set the Collabora server URL to `http://collabora:9980` (internal Docker network address).

Point your reverse proxy to the Collabora container for the path `/cool/`, `/lool/`, and `/hosting/` on a separate subdomain or the same domain.

### Background Jobs

By default, Nextcloud uses AJAX for background tasks, which only run when a user loads a page. This is unreliable. The `nextcloud-cron` container in our Compose file already handles this — it runs the built-in `/cron.sh` entrypoint that executes background jobs every 5 minutes.

Verify it is working: go to **Administration settings > Basic settings**. Under **Background jobs**, select **Cron** and confirm the last execution time is recent.

### Email Notifications

Go to **Administration settings > Basic settings > Email server**. Configure SMTP:

You can also set these via environment variables in your `docker-compose.yml`:

```yaml
SMTP_HOST: smtp.example.com
SMTP_SECURE: tls
SMTP_PORT: 587
SMTP_AUTHTYPE: LOGIN
SMTP_NAME: notifications@example.com
SMTP_PASSWORD: your-smtp-password
MAIL_FROM_ADDRESS: nextcloud
MAIL_DOMAIN: example.com
```

Click **Send email** to test the configuration.

## Advanced Configuration

### External Storage

Nextcloud supports mounting external storage as folders visible to users. Enable the **External storage support** app in Administration settings > Apps.

Supported backends:

- **SMB/CIFS:** Mount Windows shares or NAS shares. Requires `smbclient` (included in the official Docker image).
- **NFS:** Mount NFS shares by bind-mounting the NFS path on the host into the container.
- **S3-compatible storage:** Amazon S3, MinIO, Wasabi, Backblaze B2. Configure in Administration settings > External storage.
- **WebDAV:** Mount other WebDAV servers, including other Nextcloud instances.

For S3 as primary storage (all files stored in S3 instead of local disk), set the `OBJECTSTORE_S3_*` environment variables in your Compose file. This replaces the local data directory entirely.

### LDAP/SSO

For enterprise environments, Nextcloud supports:

- **LDAP/Active Directory:** Enable the **LDAP user and group backend** app. Configure in Administration settings > LDAP/AD integration. Supports user and group mapping, login filters, and attribute mapping.
- **SAML/SSO:** Enable the **SSO & SAML authentication** app. Supports Keycloak, Authentik, ADFS, and other SAML 2.0 identity providers.
- **OIDC:** The **OpenID Connect** app supports OAuth2/OIDC providers like Authentik, Authelia, and Keycloak.

### Performance Tuning

Redis is already configured in our Compose stack for file locking. To use it for local and distributed caching as well, run:

```bash
docker exec -u www-data nextcloud-app php occ config:system:set memcache.local --value='\OC\Memcache\APCu'
docker exec -u www-data nextcloud-app php occ config:system:set memcache.distributed --value='\OC\Memcache\Redis'
docker exec -u www-data nextcloud-app php occ config:system:set memcache.locking --value='\OC\Memcache\Redis'
```

OPcache is enabled by default in the official Docker image. Verify it is active:

```bash
docker exec nextcloud-app php -i | grep opcache.enable
```

If `PHP_MEMORY_LIMIT` is set to `1G` (as in our Compose file), this is sufficient for most deployments. Increase to `2G` if you have 50+ users or heavy Office document usage.

For large file uploads, `PHP_UPLOAD_LIMIT` is set to `10G` in our configuration. Adjust this based on your needs and make sure your reverse proxy also allows large uploads (Nginx defaults to 1 MB — you need `client_max_body_size 10G;` in your proxy config).

## Reverse Proxy

Nextcloud is sensitive to reverse proxy configuration. Incorrect settings cause infinite redirects, broken sync clients, and CalDAV/CardDAV failures.

The critical settings are already in our Compose file:
- `OVERWRITEPROTOCOL: https` tells Nextcloud the end user connects via HTTPS
- `OVERWRITECLIURL` sets the canonical URL for CLI commands and email links
- `APACHE_DISABLE_REWRITE_IP: 1` prevents Apache from overwriting client IP headers
- `TRUSTED_PROXIES` tells Nextcloud which IPs to trust for forwarded headers

### Nginx Proxy Manager Configuration

In Nginx Proxy Manager, create a proxy host:

- **Domain:** `cloud.example.com`
- **Scheme:** `http`
- **Forward Hostname/IP:** `nextcloud-app` (or the server IP if NPM runs outside Docker)
- **Forward Port:** `8080`
- **Websockets Support:** Enabled
- **SSL:** Request a new certificate, force SSL

In the **Advanced** tab, add this custom Nginx configuration:

```nginx
client_max_body_size 10G;
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header Host $host;

location /.well-known/carddav {
    return 301 $scheme://$host/remote.php/dav;
}
location /.well-known/caldav {
    return 301 $scheme://$host/remote.php/dav;
}
```

The `.well-known` redirects are required for CalDAV/CardDAV auto-discovery to work on iOS, macOS, and DAVx5.

For other reverse proxy setups, see the [Reverse Proxy Setup](/foundations/reverse-proxy-explained) foundation guide.

## Backup

Nextcloud requires backing up three things:

1. **Database** — the PostgreSQL database contains user accounts, file metadata, calendar/contact data, and app settings
2. **Data directory** — your actual files
3. **Config directory** — `config.php` and app configurations

### Database Backup

```bash
docker exec nextcloud-db pg_dump -U nextcloud nextcloud > nextcloud-db-$(date +%Y%m%d).sql
```

### Data and Config Backup

If using named Docker volumes (as in our Compose file):

```bash
# Find volume paths
docker volume inspect nextcloud-data --format '{{ .Mountpoint }}'
docker volume inspect nextcloud-config --format '{{ .Mountpoint }}'

# Back up with rsync or tar
docker run --rm -v nextcloud-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/nextcloud-data-$(date +%Y%m%d).tar.gz -C /data .

docker run --rm -v nextcloud-config:/config -v $(pwd):/backup alpine \
  tar czf /backup/nextcloud-config-$(date +%Y%m%d).tar.gz -C /config .
```

Enable maintenance mode before backing up to prevent file changes during the process:

```bash
docker exec -u www-data nextcloud-app php occ maintenance:mode --on
# Run backups here
docker exec -u www-data nextcloud-app php occ maintenance:mode --off
```

For a full backup strategy, see [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Sync Client Shows "Server Replied 302"

**Symptom:** Desktop or mobile sync client fails to connect. Logs show repeated 302 redirects.

**Fix:** This is almost always a reverse proxy misconfiguration. Verify:
1. `OVERWRITEPROTOCOL` is set to `https` in your Compose file
2. `OVERWRITECLIURL` matches your actual domain (including `https://`)
3. Your reverse proxy forwards `X-Forwarded-Proto` header correctly
4. Your domain is listed in `NEXTCLOUD_TRUSTED_DOMAINS`

### Slow Performance / High CPU

**Symptom:** Web interface is sluggish. Pages take 3-5 seconds to load.

**Fix:**
1. Verify Redis is connected: check Administration settings > Overview for caching warnings
2. Switch background jobs to Cron (confirm `nextcloud-cron` container is running)
3. Increase `PHP_MEMORY_LIMIT` to `1G` or `2G`
4. Run `docker exec -u www-data nextcloud-app php occ db:add-missing-indices`
5. If you have many files, run a manual scan: `docker exec -u www-data nextcloud-app php occ files:scan --all`

### Admin Overview Warnings

**Symptom:** Yellow/red warnings on the Administration settings > Overview page.

**Fix:** Most common warnings and their solutions:

- **"No memory cache configured"** — Redis is configured in our stack. If you still see this, verify `REDIS_HOST` is set and the Redis container is running.
- **"Server has no maintenance window start time configured"** — Run: `docker exec -u www-data nextcloud-app php occ config:system:set maintenance_window_start --type=integer --value=1` (sets maintenance window to 1 AM UTC).
- **"Your installation has no default phone region set"** — See the Initial Setup section above.
- **"The reverse proxy header configuration is incorrect"** — Verify `TRUSTED_PROXIES` includes your proxy's IP or subnet.

### CalDAV/CardDAV Not Working on Mobile

**Symptom:** iOS or DAVx5 cannot discover calendars or contacts. Error: "Service discovery failed."

**Fix:** The `.well-known` URLs must redirect correctly. Verify your reverse proxy includes the redirects:
```
/.well-known/carddav -> /remote.php/dav
/.well-known/caldav -> /remote.php/dav
```
Test manually: `curl -I https://cloud.example.com/.well-known/caldav` should return a 301 redirect to `/remote.php/dav`.

### File Locked Errors

**Symptom:** "File is locked" errors when editing or syncing. Files stuck in locked state.

**Fix:** File locking uses Redis in our configuration. If locks get stuck:

```bash
# Clear all file locks
docker exec -u www-data nextcloud-app php occ files:scan --all
docker exec nextcloud-redis redis-cli FLUSHDB
```

If this happens frequently, check that only one sync client is connected per account and that the `nextcloud-cron` container is running (stale locks are cleaned by background jobs).

### Upload Fails for Large Files

**Symptom:** Uploads fail silently or with a timeout for files over 1 MB or 512 MB.

**Fix:** Multiple layers need to allow large uploads:
1. `PHP_UPLOAD_LIMIT` in Docker Compose (set to `10G` in our config)
2. Reverse proxy: Nginx needs `client_max_body_size 10G;` — the default is 1 MB
3. If using Cloudflare proxy: free tier limits uploads to 100 MB. Use DNS-only mode or upgrade to a paid plan for larger uploads.

## Resource Requirements

- **RAM:** ~300 MB idle, 512 MB-1 GB under normal use, 2 GB+ with Office integration and many concurrent users
- **CPU:** Low-Medium. Background jobs and file indexing can spike CPU briefly. A 2-core machine handles 5-10 users comfortably.
- **Disk:** ~500 MB for the application itself, plus all your user data. PostgreSQL adds ~100 MB for the database. Plan your storage based on how much data you intend to sync.

## Verdict

Nextcloud is the most feature-complete self-hosted cloud platform available. It replaces more cloud services than any other single application — files, calendar, contacts, notes, tasks, video calls, and document editing. For someone who wants one app to break free from Google or Microsoft, Nextcloud is the obvious choice.

The trade-off is complexity. Nextcloud is heavier and more finicky than single-purpose alternatives. It requires more RAM, more tuning, and more attention to reverse proxy configuration. The admin interface throws warnings that take time to resolve. Performance out of the box is mediocre without Redis and proper caching configuration.

If you only need file sync, [Seafile](/apps/seafile) is faster and lighter. If you want peer-to-peer sync with no server at all, [Syncthing](/apps/syncthing) is simpler. But if you want the full cloud platform experience under your own roof, Nextcloud is it. Start with our Docker Compose stack above — it includes PostgreSQL and Redis from the start, which avoids most of the performance complaints new users hit.

## Related

- [Best Self-Hosted File Sync & Storage](/best/file-sync-storage)
- [Nextcloud vs Seafile](/compare/nextcloud-vs-seafile)
- [Nextcloud vs Syncthing](/compare/nextcloud-vs-syncthing)
- [Replace Google Drive](/replace/google-drive)
- [Replace Dropbox](/replace/dropbox)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [Getting Started with Self-Hosting](/foundations/getting-started)
