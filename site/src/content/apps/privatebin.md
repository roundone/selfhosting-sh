---
title: "How to Self-Host PrivateBin with Docker Compose"
description: "Deploy PrivateBin with Docker Compose — a self-hosted encrypted pastebin where the server has zero knowledge of pasted data."
date: 2026-02-16
dateUpdated: 2026-02-19
category: "pastebin-snippets"
apps:
  - privatebin
tags:
  - self-hosted
  - privatebin
  - docker
  - pastebin
  - encrypted
  - zero-knowledge
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is PrivateBin?

[PrivateBin](https://privatebin.info/) is a self-hosted, zero-knowledge encrypted pastebin. Paste text, code, or Markdown, set an expiration time, and share the link. The encryption key is part of the URL fragment (after the `#`) — it never reaches the server. The server stores only encrypted blobs and cannot read your content. It replaces Pastebin.com, GitHub Gists (for temporary sharing), and similar services — with the guarantee that your server admin can't read your pastes.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 128 MB of free RAM
- 200 MB of free disk space
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  privatebin:
    image: privatebin/nginx-fpm-alpine:2.0.3
    container_name: privatebin
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - privatebin_data:/srv/data
    read_only: true
    tmpfs:
      - /tmp
      - /var/tmp
      - /run
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8080/ || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  privatebin_data:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8080` in your browser
2. PrivateBin is immediately ready — no accounts, no setup wizard
3. Paste text, select options (expiration, format, burn-after-reading), and create
4. Share the generated link — the encryption key is in the URL fragment

## Configuration

### Custom Configuration

Create a `conf.php` configuration file:

```php
[main]
name = "My PrivateBin"
basepath = "https://paste.example.com/"
discussion = true
opendiscussion = false
password = true
fileupload = true
burnafterreadingselected = false
defaultformatter = "plaintext"
sizelimit = 10485760

[expire]
default = "1week"

[expire_options]
5min = 300
10min = 600
1hour = 3600
1day = 86400
1week = 604800
1month = 2592000
1year = 31536000
never = 0

[traffic]
limit = 10
header = "X-Forwarded-For"

[purge]
limit = 300
batchsize = 10
```

Mount it:

```yaml
volumes:
  - privatebin_data:/srv/data
  - ./conf.php:/srv/cfg/conf.php:ro
```

### Key Options

| Setting | Default | Description |
|---------|---------|-------------|
| `discussion` | `true` | Allow comments on pastes |
| `password` | `true` | Allow password-protected pastes |
| `fileupload` | `false` | Allow encrypted file attachments |
| `sizelimit` | `10485760` | Max paste size in bytes (10 MB) |
| `burnafterreadingselected` | `false` | Pre-select burn after reading |

### File Uploads

Enable encrypted file uploads by setting `fileupload = true` in the config. Files are encrypted client-side just like text.

### Storage Backends

PrivateBin supports multiple storage backends. In v2.x, you must use the updated class names:

```php
; Filesystem (default — required in v2.x config)
[model]
class = Filesystem

; Google Cloud Storage
[model]
class = GoogleCloudStorage

; S3-compatible storage (new in v2.x)
[model]
class = S3Storage
```

The default filesystem storage works well for most deployments. **If upgrading from v1.x:** Legacy class names (`privatebin_data`, `privatebin_db`, `zerobin_db`) are removed in v2.x. Update your config to use `Filesystem` or `Database`.

## Reverse Proxy

Nginx Proxy Manager config:
- **Scheme:** http
- **Forward Hostname:** privatebin
- **Forward Port:** 8080

If using the `traffic` limiter, set `header = "X-Forwarded-For"` in the config so rate limiting works on real client IPs.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for full configuration.

## Backup

```bash
docker run --rm -v privatebin_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/privatebin-backup-$(date +%Y%m%d).tar.gz /data
```

Note: Backups contain encrypted data that cannot be read without the URL fragments (which only the users have).

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a complete backup approach.

## Troubleshooting

### "Error saving paste" on Large Content

**Symptom:** Saving large pastes fails with an error.
**Fix:** Increase `sizelimit` in the configuration. Also check your reverse proxy's `client_max_body_size` setting.

### Rate Limiting Blocking Users

**Symptom:** Users get "Please wait X seconds" errors too frequently.
**Fix:** Increase `limit` under `[traffic]` in the config (default 10 seconds between pastes). Set `header = "X-Forwarded-For"` behind a reverse proxy to avoid rate limiting all users as one IP.

### Pastes Disappearing Faster Than Expected

**Symptom:** Pastes expire sooner than the selected time.
**Fix:** Check the `[purge]` settings. `limit = 300` means purge runs every 300 seconds (5 minutes). Verify the paste expiration was set correctly — "burn after reading" destroys on first view.

## Resource Requirements

- **RAM:** ~30-50 MB
- **CPU:** Negligible — all encryption happens client-side
- **Disk:** ~50 MB for the application, paste storage varies

## Verdict

PrivateBin is the best self-hosted pastebin. The zero-knowledge encryption means your server genuinely cannot read the pasted content — even if compromised. Setup is dead simple, resource usage is minimal, and the read-only container with tmpfs is security-hardened out of the box. For sharing code snippets or text securely, nothing else comes close.

## Related

- [Best Self-Hosted Pastebins](/best/pastebin)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Security Basics for Self-Hosting](/foundations/security-basics)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
