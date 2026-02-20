---
title: "Nextcloud Sync Not Working: Fix Guide"
description: "Fix Nextcloud desktop and mobile sync issues including file locking, WebDAV errors, slow uploads, and reverse proxy configuration problems."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "file-sync"
apps:
  - nextcloud
tags: ["troubleshooting", "nextcloud", "sync", "webdav", "docker"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## The Problem

Nextcloud sync issues are some of the most frustrating problems in self-hosting because the failure modes are varied and the error messages are often vague. The desktop client shows a yellow warning icon, the mobile app refuses to upload photos, or files silently fail to sync.

Most Nextcloud sync failures come from one of three areas: upload size limits (the most common), reverse proxy misconfiguration, or PHP performance settings. This guide covers all eight common failure modes with exact fixes.

---

## Quick Diagnostic Checklist

Before going through each issue in detail, check these basics:

```bash
# 1. Is the Nextcloud container healthy?
docker ps | grep nextcloud

# 2. Check Nextcloud's built-in status
curl -s https://your-nextcloud-domain.com/status.php | python3 -m json.tool

# 3. Check Nextcloud logs for errors
docker exec <nextcloud_container> cat /var/www/html/data/nextcloud.log | tail -50

# 4. Run Nextcloud's built-in OCC check
docker exec -u www-data <nextcloud_container> php occ status
docker exec -u www-data <nextcloud_container> php occ maintenance:repair --include-expensive
```

The `nextcloud.log` file is your primary diagnostic tool. Every sync failure writes an entry there with specific error codes and context.

---

## Issue 1: "Server replied 413" — Upload Size Limit

### Symptom

The desktop client or web UI shows:

```
Error transferring <filename> - server replied: 413 Request Entity Too Large
```

Or uploads silently fail for files above a certain size (often 2 MB, 10 MB, or 512 MB depending on which limit is hit).

### The Cause

There are **four separate upload size limits** that all need to be configured consistently. If any one of them is lower than the file you are uploading, you get a 413 error:

1. **PHP `upload_max_filesize`** — default 2 MB
2. **PHP `post_max_size`** — default 8 MB
3. **Nextcloud's own limit** — usually inherited from PHP settings
4. **Reverse proxy client body size limit** — Nginx defaults to 1 MB

All four must allow your desired maximum upload size.

### The Fix

**Step 1: Increase PHP limits inside the Nextcloud container.**

If using the official `nextcloud` Docker image, create or edit the PHP configuration:

```bash
docker exec <nextcloud_container> bash -c 'cat > /usr/local/etc/php/conf.d/upload-limit.ini << EOF
upload_max_filesize = 16G
post_max_size = 16G
memory_limit = 1G
max_input_time = 3600
max_execution_time = 3600
EOF'
```

Then restart the container:

```bash
docker compose restart nextcloud
```

For persistence across container recreations, mount this file as a volume:

```yaml
services:
  nextcloud:
    image: nextcloud:29.0.8-apache
    volumes:
      - ./nextcloud-data:/var/www/html
      - ./php-upload-limit.ini:/usr/local/etc/php/conf.d/upload-limit.ini:ro
    restart: unless-stopped
```

Create `php-upload-limit.ini` alongside your Compose file:

```ini
upload_max_filesize = 16G
post_max_size = 16G
memory_limit = 1G
max_input_time = 3600
max_execution_time = 3600
```

**Step 2: Increase the reverse proxy limit.**

For Nginx Proxy Manager, add to the **Advanced** tab of the proxy host:

```nginx
client_max_body_size 16G;
proxy_request_buffering off;
```

For Traefik, add a middleware:

```yaml
labels:
  - "traefik.http.middlewares.nextcloud-body.buffering.maxRequestBodyBytes=17179869184"  # 16 GB
```

For Caddy:

```
nextcloud.example.com {
    reverse_proxy nextcloud:80
    request_body {
        max_size 16GB
    }
}
```

**Step 3: Verify the limits are active.**

```bash
# Check PHP settings inside the container
docker exec <nextcloud_container> php -i | grep -E "upload_max|post_max|memory_limit"
```

Expected output:

```
upload_max_filesize => 16G => 16G
post_max_size => 16G => 16G
memory_limit => 1G => 1G
```

**Important:** `post_max_size` must be greater than or equal to `upload_max_filesize`. If `post_max_size` is smaller, PHP silently truncates the upload.

---

## Issue 2: "File is locked" Error

### Symptom

The desktop client shows:

```
The file is locked
```

Or the web UI shows "This file is locked" when trying to edit or delete a file. The lock persists even after closing all clients.

### The Cause

Nextcloud uses file locking to prevent conflicts when multiple clients edit the same file. Locks should be released automatically when the editing session ends. Stale locks occur when:

- A client crashed or lost connection during an upload
- The Nextcloud container was restarted during an active sync
- The database has accumulated orphaned lock entries
- Redis (if used for file locking) lost data

### The Fix

**Step 1: Clear file locks using the OCC command.**

```bash
# Clear all file locks
docker exec -u www-data <nextcloud_container> php occ maintenance:mode --on
docker exec -u www-data <nextcloud_container> php occ files:scan --all
docker exec -u www-data <nextcloud_container> php occ maintenance:mode --off
```

**Step 2: If locks persist, clear them from the database directly.**

For PostgreSQL:

```bash
docker exec <postgres_container> psql -U nextcloud -d nextcloud -c "DELETE FROM oc_file_locks WHERE 1=1;"
```

For MySQL/MariaDB:

```bash
docker exec <db_container> mysql -u nextcloud -p<password> nextcloud -e "DELETE FROM oc_file_locks WHERE 1=1;"
```

**Step 3: Switch to Redis for file locking (recommended).**

Database-based locking is slow and prone to orphaned locks. Redis is significantly better:

Add Redis to your Compose file:

```yaml
services:
  nextcloud:
    image: nextcloud:29.0.8-apache
    environment:
      - REDIS_HOST=redis
    depends_on:
      - redis
    volumes:
      - ./nextcloud-data:/var/www/html
    restart: unless-stopped

  redis:
    image: redis:7.4-alpine
    volumes:
      - redis-data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  redis-data:
```

Then configure Nextcloud to use Redis for locking. Edit `config/config.php` inside the Nextcloud data volume:

```php
'memcache.locking' => '\OC\Memcache\Redis',
'redis' => array(
    'host' => 'redis',
    'port' => 6379,
),
```

Or run:

```bash
docker exec -u www-data <nextcloud_container> php occ config:system:set memcache.locking --value='\OC\Memcache\Redis'
docker exec -u www-data <nextcloud_container> php occ config:system:set redis host --value='redis'
docker exec -u www-data <nextcloud_container> php occ config:system:set redis port --value=6379 --type=integer
```

---

## Issue 3: WebDAV Connection Failed

### Symptom

The desktop client shows:

```
Network error: 401 Unauthorized
```

Or:

```
Error accessing the server: Server replied "207 Multi-Status" to "PROPFIND"
```

Or the client cannot connect at all, showing a generic connection error.

### The Cause

The reverse proxy is not passing the required WebDAV headers to Nextcloud. Nextcloud's sync protocol uses WebDAV, which requires specific HTTP methods (PROPFIND, MKCOL, MOVE, COPY, LOCK, UNLOCK) and headers that some proxy configurations strip or block.

### The Fix

**For Nginx Proxy Manager:**

Add to the **Advanced** tab of the proxy host:

```nginx
client_max_body_size 16G;
proxy_request_buffering off;
fastcgi_buffers 64 4K;

# Required for WebDAV
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header Host $host;

# Allow WebDAV methods
proxy_set_header X-Forwarded-Host $host;

# Disable buffering for streaming/WebDAV
proxy_buffering off;

# Required for CalDAV/CardDAV
location /.well-known/carddav {
    return 301 $scheme://$host/remote.php/dav;
}
location /.well-known/caldav {
    return 301 $scheme://$host/remote.php/dav;
}
location /.well-known/webfinger {
    return 301 $scheme://$host/index.php/.well-known/webfinger;
}
location /.well-known/nodeinfo {
    return 301 $scheme://$host/index.php/.well-known/nodeinfo;
}
```

**For Traefik:**

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.nextcloud.rule=Host(`nextcloud.example.com`)"
  - "traefik.http.routers.nextcloud.entrypoints=websecure"
  - "traefik.http.routers.nextcloud.tls.certresolver=letsencrypt"
  - "traefik.http.routers.nextcloud.middlewares=nextcloud-headers,nextcloud-redirects"
  # Headers middleware
  - "traefik.http.middlewares.nextcloud-headers.headers.customFrameOptionsValue=SAMEORIGIN"
  - "traefik.http.middlewares.nextcloud-headers.headers.stsSeconds=31536000"
  - "traefik.http.middlewares.nextcloud-headers.headers.stsIncludeSubdomains=true"
  - "traefik.http.middlewares.nextcloud-headers.headers.stsPreload=true"
  # CalDAV/CardDAV redirects
  - "traefik.http.middlewares.nextcloud-redirects.redirectregex.permanent=true"
  - "traefik.http.middlewares.nextcloud-redirects.redirectregex.regex=https://(.*)/.well-known/(?:card|cal)dav"
  - "traefik.http.middlewares.nextcloud-redirects.redirectregex.replacement=https://$${1}/remote.php/dav"
```

**For Caddy:**

```
nextcloud.example.com {
    reverse_proxy nextcloud:80

    redir /.well-known/carddav /remote.php/dav 301
    redir /.well-known/caldav /remote.php/dav 301
    redir /.well-known/webfinger /index.php/.well-known/webfinger 301
    redir /.well-known/nodeinfo /index.php/.well-known/nodeinfo 301

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    }

    request_body {
        max_size 16GB
    }
}
```

---

## Issue 4: Sync Pauses or Hangs

### Symptom

Sync starts but stalls partway through. The desktop client shows "Sync paused" or a spinner that never completes. Large files get stuck at a percentage. The Nextcloud log may show:

```
PHP Fatal error: Allowed memory size of 134217728 bytes exhausted
```

Or:

```
Script execution timed out
```

### The Cause

PHP is running out of memory or hitting execution time limits. Nextcloud's sync process for large files requires sufficient PHP memory and time to complete chunked uploads. The default PHP limits (128 MB memory, 30 seconds execution time) are too low for a file sync server.

### The Fix

**Step 1: Increase PHP memory and execution limits.**

Create or update the PHP configuration file (see Issue 1 for the volume mount approach):

```ini
memory_limit = 1G
max_execution_time = 3600
max_input_time = 3600
upload_max_filesize = 16G
post_max_size = 16G
output_buffering = 0
```

**Step 2: Configure PHP OPcache for performance.**

Add to the same configuration file or a separate one:

```ini
opcache.enable = 1
opcache.interned_strings_buffer = 16
opcache.max_accelerated_files = 10000
opcache.memory_consumption = 256
opcache.save_comments = 1
opcache.revalidate_freq = 1
```

**Step 3: Increase PHP-FPM workers (if using the FPM image variant).**

If you are using `nextcloud:fpm` instead of `nextcloud:apache`, you need to tune the FPM pool:

```ini
; /usr/local/etc/php-fpm.d/www.conf overrides
pm = dynamic
pm.max_children = 20
pm.start_servers = 5
pm.min_spare_servers = 3
pm.max_spare_servers = 10
pm.max_requests = 500
```

Mount this as a volume:

```yaml
volumes:
  - ./fpm-tuning.conf:/usr/local/etc/php-fpm.d/zz-tuning.conf:ro
```

**Step 4: Enable chunked uploads (if not already).**

Verify chunked uploading is enabled:

```bash
docker exec -u www-data <nextcloud_container> php occ config:app:get files max_chunk_size
```

The default is 10 MB chunks. For slow connections, smaller chunks (5 MB) reduce the chance of timeout during upload. For fast local networks, larger chunks (50 MB) reduce overhead:

```bash
docker exec -u www-data <nextcloud_container> php occ config:app:set files max_chunk_size --value=52428800
```

---

## Issue 5: "Trusted Domain" Error

### Symptom

Accessing Nextcloud shows:

```
Access through untrusted domain
Please contact your administrator. If you are an administrator, edit the "trusted_domains" setting in config/config.php.
```

Or the desktop client cannot connect, showing an "untrusted" or "not found" error.

### The Cause

Nextcloud restricts access to domains listed in its `trusted_domains` configuration. When accessing via a domain or IP that is not in this list, Nextcloud rejects the connection. This commonly happens when:

- You set up Nextcloud on `localhost` and then access it through a domain name
- Your reverse proxy forwards the original host header but it is not in the trusted list
- You changed your domain or added a second domain

### The Fix

**Option A: Set trusted domains via environment variables in Compose.**

```yaml
services:
  nextcloud:
    image: nextcloud:29.0.8-apache
    environment:
      - NEXTCLOUD_TRUSTED_DOMAINS=nextcloud.example.com cloud.example.com localhost
      - TRUSTED_PROXIES=172.16.0.0/12 192.168.0.0/16 10.0.0.0/8
      - OVERWRITEPROTOCOL=https
      - OVERWRITEHOST=nextcloud.example.com
      - OVERWRITECLIURL=https://nextcloud.example.com
    restart: unless-stopped
```

**Important environment variables for reverse proxy setups:**

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXTCLOUD_TRUSTED_DOMAINS` | Domains allowed to access Nextcloud (space-separated) | `nextcloud.example.com localhost` |
| `TRUSTED_PROXIES` | IP ranges of reverse proxies (so Nextcloud trusts forwarded headers) | `172.16.0.0/12` |
| `OVERWRITEPROTOCOL` | Force HTTPS in generated URLs | `https` |
| `OVERWRITEHOST` | Set the canonical hostname | `nextcloud.example.com` |
| `OVERWRITECLIURL` | Full URL for CLI-generated links | `https://nextcloud.example.com` |

**Option B: Edit config.php directly.**

```bash
docker exec -u www-data <nextcloud_container> php occ config:system:set trusted_domains 0 --value='localhost'
docker exec -u www-data <nextcloud_container> php occ config:system:set trusted_domains 1 --value='nextcloud.example.com'
docker exec -u www-data <nextcloud_container> php occ config:system:set trusted_domains 2 --value='cloud.example.com'
docker exec -u www-data <nextcloud_container> php occ config:system:set trusted_proxies 0 --value='172.16.0.0/12'
docker exec -u www-data <nextcloud_container> php occ config:system:set overwriteprotocol --value='https'
docker exec -u www-data <nextcloud_container> php occ config:system:set overwritehost --value='nextcloud.example.com'
docker exec -u www-data <nextcloud_container> php occ config:system:set overwrite.cli.url --value='https://nextcloud.example.com'
```

---

## Issue 6: Slow Sync Speed

### Symptom

Sync works but is painfully slow. Uploading files to Nextcloud is significantly slower than direct file transfer (SCP, rsync) to the same server. Download speed is normal but upload crawls.

### The Cause

Nextcloud's default PHP configuration is not optimized for performance. Without caching and proper tuning, every file operation hits the database and filesystem without any caching layer. The main bottlenecks are:

1. No memory caching (APCu for local cache, Redis for distributed cache)
2. PHP OPcache not configured
3. Database not optimized
4. PHP memory too low, causing frequent garbage collection

### The Fix

**Step 1: Add Redis for distributed caching.**

If you have not already added Redis (see Issue 2 for the Compose setup), do that first. Then configure Nextcloud to use it for both file locking and caching:

```bash
docker exec -u www-data <nextcloud_container> php occ config:system:set memcache.local --value='\OC\Memcache\APCu'
docker exec -u www-data <nextcloud_container> php occ config:system:set memcache.distributed --value='\OC\Memcache\Redis'
docker exec -u www-data <nextcloud_container> php occ config:system:set memcache.locking --value='\OC\Memcache\Redis'
docker exec -u www-data <nextcloud_container> php occ config:system:set redis host --value='redis'
docker exec -u www-data <nextcloud_container> php occ config:system:set redis port --value=6379 --type=integer
```

**Step 2: Enable APCu for local caching.**

Ensure APCu is configured in PHP:

```ini
apc.enable_cli = 1
apc.shm_size = 128M
```

Add this to your PHP configuration volume mount.

**Step 3: Optimize the database.**

Run Nextcloud's database optimization commands:

```bash
docker exec -u www-data <nextcloud_container> php occ db:add-missing-indices
docker exec -u www-data <nextcloud_container> php occ db:add-missing-columns
docker exec -u www-data <nextcloud_container> php occ db:add-missing-primary-keys
docker exec -u www-data <nextcloud_container> php occ db:convert-filecache-bigint
```

These commands add database indices that Nextcloud needs for efficient queries but does not create automatically during installation.

**Step 4: Use PostgreSQL instead of SQLite or MySQL.**

If you are using SQLite (the default for the Docker image when no database is configured), switch to PostgreSQL. SQLite does not handle concurrent access well and becomes the bottleneck with more than a few hundred files.

```yaml
services:
  nextcloud:
    image: nextcloud:29.0.8-apache
    environment:
      - POSTGRES_HOST=db
      - POSTGRES_DB=nextcloud
      - POSTGRES_USER=nextcloud
      - POSTGRES_PASSWORD=changeme_strong_password
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=nextcloud
      - POSTGRES_USER=nextcloud
      - POSTGRES_PASSWORD=changeme_strong_password
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nextcloud"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  db-data:
```

**Step 5: Disable unnecessary apps.**

Each enabled Nextcloud app adds overhead to every request. Disable apps you do not use:

```bash
# List enabled apps
docker exec -u www-data <nextcloud_container> php occ app:list --enabled

# Disable unused apps (examples)
docker exec -u www-data <nextcloud_container> php occ app:disable weather_status
docker exec -u www-data <nextcloud_container> php occ app:disable recommendations
docker exec -u www-data <nextcloud_container> php occ app:disable survey_client
```

---

## Issue 7: Desktop Client "Unsolvable Conflict"

### Symptom

The desktop client shows a yellow warning icon with:

```
Unsolvable conflict: <filename>
```

The file appears in both the local and server versions, and the client refuses to sync it in either direction.

### The Cause

The same file was modified on both the client and the server (or another client) between sync cycles. The sync client detected that both versions changed and cannot determine which version is correct. This is not a bug — it is the client protecting you from data loss.

### The Fix

**Step 1: Check what happened.**

Right-click the file in the Nextcloud sync client and select **Open in web browser**. Compare the server version with your local version.

**Step 2: Resolve the conflict.**

The desktop client creates a conflict copy with a timestamp:

```
document.docx                    # Server version (or last synced)
document (conflicted copy 2026-02-16 143022).docx  # Your local version
```

Compare both files. Keep the one you want. Delete the other. The sync client will resolve the conflict automatically once only one version remains.

**Step 3: Force sync a specific direction.**

If you want to force the local version to the server:

1. Move the server version to trash (via Nextcloud web UI)
2. Wait for the sync client to upload the local version

If you want the server version:

1. Delete the local file
2. Wait for the sync client to download the server version

**Step 4: Prevent future conflicts.**

Conflicts happen most often with files edited simultaneously on multiple devices. To reduce them:

- Increase sync frequency: In the desktop client, go to **Settings > General** and reduce the sync interval (default is 30 seconds, which is reasonable)
- Avoid editing the same file on multiple devices simultaneously
- Use Nextcloud's built-in collaborative editing (Collabora or OnlyOffice) for documents — this handles concurrent editing at the application layer

---

## Issue 8: Mobile Auto-Upload Not Working

### Symptom

The Nextcloud mobile app is configured for auto-upload of photos, but new photos are not being uploaded. The app shows no errors, and manual uploads work fine.

### The Cause

On Android, aggressive battery optimization and background activity restrictions kill the Nextcloud app before it can upload. This is an Android OS behavior, not a Nextcloud bug. Manufacturers like Samsung, Xiaomi, Huawei, and OnePlus are particularly aggressive about killing background apps.

On iOS, background app refresh must be enabled and the app needs location permissions (used to trigger uploads when you move to a new location).

### Fix for Android

**Step 1: Disable battery optimization for Nextcloud.**

Go to **Settings > Apps > Nextcloud > Battery** and set to **Unrestricted** (or "Don't optimize" on some devices).

Alternatively:

**Settings > Battery > Battery optimization > All apps > Nextcloud > Don't optimize**

The exact path varies by manufacturer and Android version.

**Step 2: Disable any manufacturer-specific app killers.**

| Manufacturer | Setting to Disable |
|-------------|-------------------|
| Samsung | Settings > Battery > Background usage limits > Never sleeping apps > Add Nextcloud |
| Xiaomi | Settings > Battery > App battery saver > Nextcloud > No restrictions |
| Huawei | Settings > Battery > App launch > Nextcloud > Manage manually > Enable all three toggles |
| OnePlus | Settings > Battery > Battery optimization > Nextcloud > Don't optimize |

**Step 3: Enable persistent notification.**

In the Nextcloud app, go to **Settings > Auto upload** and enable **"Use a foreground service"** or **"Show notification"**. This keeps the app alive by showing a persistent notification, which prevents Android from killing it.

**Step 4: Disable Data Saver for Nextcloud.**

If Android's Data Saver is enabled, it may block Nextcloud's background uploads:

**Settings > Network > Data Saver > Unrestricted data > Enable for Nextcloud**

### Fix for iOS

**Step 1: Enable Background App Refresh.**

**Settings > General > Background App Refresh > Nextcloud > On**

**Step 2: Grant location permissions.**

The Nextcloud iOS app uses significant location changes as a trigger to wake up and upload photos. Go to **Settings > Nextcloud > Location** and set to **Always**.

This uses minimal battery (it uses cell tower changes, not GPS) but significantly improves upload reliability.

**Step 3: Keep the app in memory.**

Avoid force-closing the Nextcloud app. iOS only allows background refresh for apps that are in memory (suspended, not terminated).

---

## Performance Tuning Summary

For a well-performing Nextcloud instance that syncs reliably, apply all of these:

```yaml
# Complete optimized docker-compose.yml
services:
  nextcloud:
    image: nextcloud:29.0.8-apache
    environment:
      - POSTGRES_HOST=db
      - POSTGRES_DB=nextcloud
      - POSTGRES_USER=nextcloud
      - POSTGRES_PASSWORD=changeme_strong_password
      - REDIS_HOST=redis
      - NEXTCLOUD_TRUSTED_DOMAINS=nextcloud.example.com
      - TRUSTED_PROXIES=172.16.0.0/12
      - OVERWRITEPROTOCOL=https
      - OVERWRITEHOST=nextcloud.example.com
      - OVERWRITECLIURL=https://nextcloud.example.com
      - PHP_MEMORY_LIMIT=1G
      - PHP_UPLOAD_LIMIT=16G
    volumes:
      - nextcloud-html:/var/www/html
      - ./data:/var/www/html/data
      - ./php-tuning.ini:/usr/local/etc/php/conf.d/zz-tuning.ini:ro
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=nextcloud
      - POSTGRES_USER=nextcloud
      - POSTGRES_PASSWORD=changeme_strong_password
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nextcloud"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7.4-alpine
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  nextcloud-html:
  db-data:
  redis-data:
```

The `php-tuning.ini` file:

```ini
; Upload limits
upload_max_filesize = 16G
post_max_size = 16G

; Memory and execution
memory_limit = 1G
max_execution_time = 3600
max_input_time = 3600
output_buffering = 0

; OPcache
opcache.enable = 1
opcache.interned_strings_buffer = 16
opcache.max_accelerated_files = 10000
opcache.memory_consumption = 256
opcache.save_comments = 1
opcache.revalidate_freq = 1

; APCu
apc.enable_cli = 1
apc.shm_size = 128M
```

After deployment, run the optimization commands:

```bash
docker exec -u www-data <nextcloud_container> php occ db:add-missing-indices
docker exec -u www-data <nextcloud_container> php occ db:add-missing-columns
docker exec -u www-data <nextcloud_container> php occ db:add-missing-primary-keys
docker exec -u www-data <nextcloud_container> php occ db:convert-filecache-bigint
docker exec -u www-data <nextcloud_container> php occ config:system:set memcache.local --value='\OC\Memcache\APCu'
docker exec -u www-data <nextcloud_container> php occ config:system:set memcache.distributed --value='\OC\Memcache\Redis'
docker exec -u www-data <nextcloud_container> php occ config:system:set memcache.locking --value='\OC\Memcache\Redis'
```

---

## Prevention

1. **Set PHP limits during initial deployment, not after.** The defaults are too low for a file sync server. Configure them from day one.
2. **Always use PostgreSQL + Redis.** SQLite is only for testing. MySQL works but PostgreSQL performs better for Nextcloud's access patterns.
3. **Configure your reverse proxy for Nextcloud specifically.** The generic proxy config is insufficient — Nextcloud needs WebDAV headers, large body sizes, and proper forwarding.
4. **Run `occ maintenance:repair` periodically.** It catches and fixes common issues before they cause sync failures:
   ```bash
   docker exec -u www-data <nextcloud_container> php occ maintenance:repair
   ```
5. **Monitor the Nextcloud log.** Set up log rotation and check `/var/www/html/data/nextcloud.log` regularly for warnings that precede failures.
6. **Keep Nextcloud updated.** Many sync bugs are fixed in point releases. Pin to a specific version for stability, but update regularly.

## Related

- [How to Self-Host Nextcloud](/apps/nextcloud)
- [Best Self-Hosted File Sync Solutions](/best/file-sync)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Docker Compose Common Errors](/troubleshooting/docker-compose-common-errors)
- [Reverse Proxy 502 Bad Gateway](/troubleshooting/reverse-proxy-502-bad-gateway)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Volumes](/foundations/docker-volumes)
