---
title: "Nextcloud Sync Not Working: Complete Fix Guide"
type: "troubleshooting"
app: "nextcloud"
category: "file-sync"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Fix Nextcloud sync issues. Covers desktop client, mobile app, and server-side problems."
symptoms:
  - "Desktop client shows 'Unable to connect'"
  - "Files not syncing between devices"
  - "Sync stuck on 'Checking for changes'"
  - "Conflicts appearing frequently"
  - "Mobile app can't connect to server"
---

## Quick Checks

Before diving in, verify these basics:

1. **Can you access the Nextcloud web UI?** If not, the server is down or unreachable.
2. **Is the server healthy?** Check Settings → Administration → Overview for warnings.
3. **What version are you running?** Check Settings → Administration. Update if outdated.

## Common Causes and Fixes

### 1. Trusted Domains Not Configured

**Symptom:** "Access through untrusted domain" error.

**Fix:** Add your domain/IP to trusted domains in `config.php`:
```php
'trusted_domains' => [
    0 => 'localhost',
    1 => 'cloud.yourdomain.com',
    2 => '192.168.1.100',
],
```

Or set via environment variable:
```yaml
environment:
  - NEXTCLOUD_TRUSTED_DOMAINS=localhost cloud.yourdomain.com 192.168.1.100
```

### 2. Reverse Proxy Misconfiguration

**Symptom:** Redirects loop, mixed content errors, or mobile app can't connect.

**Fix:** Add these to `config.php`:
```php
'overwriteprotocol' => 'https',
'overwritecliurl' => 'https://cloud.yourdomain.com',
'trusted_proxies' => ['172.16.0.0/12'],  // Docker network range
```

### 3. PHP Memory Limit Too Low

**Symptom:** Large file uploads fail, sync drops out mid-transfer.

**Fix:** Increase PHP memory in your Docker environment:
```yaml
environment:
  - PHP_MEMORY_LIMIT=1024M
  - PHP_UPLOAD_LIMIT=16G
```

### 4. Database Lock Issues

**Symptom:** Sync freezes, "file is locked" errors.

**Fix:**
```bash
# Clear file locks
docker exec -u www-data nextcloud php occ maintenance:mode --on
docker exec -u www-data nextcloud php occ files:scan --all
docker exec -u www-data nextcloud php occ maintenance:mode --off
```

### 5. Desktop Client "Checking for Changes" Forever

**Symptom:** Client shows "Checking for changes" indefinitely.

**Fix:**
1. Delete the sync journal: remove `.sync_*.db` files in the sync folder
2. Restart the desktop client
3. Let it rescan (may take a while for large libraries)

### 6. Background Jobs Not Running

**Symptom:** Slow syncing, notifications delayed, previews not generating.

**Fix:** Verify the cron container is running:
```bash
docker compose ps cron
# Should show "Up"

# Or check last cron execution:
docker exec -u www-data nextcloud php occ background:cron
```

In Settings → Administration → Basic settings, ensure "Cron" is selected (not AJAX or Webcron).

## Still Not Working?

1. Check Nextcloud logs: `docker exec nextcloud cat /var/www/html/data/nextcloud.log | tail -50`
2. Check container logs: `docker compose logs nextcloud`
3. Run a server health check: `docker exec -u www-data nextcloud php occ status`

See also: [Nextcloud setup guide](/apps/nextcloud/) | [Nextcloud slow performance](/troubleshooting/nextcloud/slow-performance/) | [Docker Compose Basics](/foundations/docker-compose-basics/)
