---
title: "How to Self-Host Send with Docker Compose"
description: "Deploy Send with Docker Compose — a self-hosted Firefox Send fork for encrypted, expiring file transfers via shareable links."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "file-sharing"
apps:
  - send
tags:
  - self-hosted
  - send
  - docker
  - file-sharing
  - wetransfer-alternative
  - encrypted-file-transfer
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Send?

[Send](https://github.com/timvisee/send) is a self-hosted, end-to-end encrypted file sharing service — a maintained fork of the discontinued Firefox Send. Upload a file through the web UI, get a link with configurable download limits and expiry. Files are encrypted in your browser before upload using AES-GCM, so the server only stores encrypted blobs it cannot read.

Send replaces [WeTransfer](/replace/wetransfer), Dropbox Transfer, and other cloud file sharing services. Your files stay on your server, encrypted at rest, and automatically delete after the link expires.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM (minimum)
- Disk space for stored files (depends on your upload limits)
- A domain name (required — Send needs `BASE_URL` for encryption to work)

## Docker Compose Configuration

Create a directory for Send:

```bash
mkdir -p ~/send && cd ~/send
```

Create a `docker-compose.yml` file:

```yaml
services:
  send:
    image: registry.gitlab.com/timvisee/send:v3.4.27
    container_name: send
    ports:
      - "127.0.0.1:1443:1443"
    environment:
      # REQUIRED: Your public-facing URL (no trailing slash)
      BASE_URL: https://send.example.com
      # Production mode
      NODE_ENV: production
      # Server port
      PORT: "1443"
      # File storage inside the container
      FILE_DIR: /uploads
      # Redis connection
      REDIS_HOST: send-redis
      REDIS_PORT: "6379"
      # Upload limits
      MAX_FILE_SIZE: "5368709120"           # 5 GB max file size
      MAX_FILES_PER_ARCHIVE: "64"
      # Expiry defaults
      MAX_EXPIRE_SECONDS: "604800"          # 7 days maximum
      DEFAULT_EXPIRE_SECONDS: "86400"       # 24 hours default
      # Download limits
      MAX_DOWNLOADS: "100"
      DEFAULT_DOWNLOADS: "5"
      # Download count options shown in UI (JSON array)
      DOWNLOAD_COUNTS: "[1,2,5,10,20,50,100]"
      # Expiry time options shown in UI (JSON array, in seconds)
      EXPIRE_TIMES_SECONDS: "[300,3600,86400,604800]"
    volumes:
      - send-uploads:/uploads
    depends_on:
      - send-redis
    restart: unless-stopped

  send-redis:
    image: redis:7-alpine
    container_name: send-redis
    volumes:
      - send-redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  send-uploads:
  send-redis-data:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Ensure your domain (e.g., `send.example.com`) points to your server.
2. Set up a reverse proxy with SSL — Send requires HTTPS for the browser-side encryption to work correctly.
3. Open `https://send.example.com` in your browser.
4. Upload a file. You'll get an encrypted link with your configured default expiry and download limit.
5. Share the link. The recipient clicks it and downloads the file — no account needed.

There's no admin panel or user accounts. Send is designed as a simple upload → link → download workflow.

## Configuration

### Upload and Expiry Settings

All configuration is via environment variables. Key tuning options:

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_FILE_SIZE` | `2684354560` (2.5 GB) | Maximum file upload size in bytes |
| `MAX_EXPIRE_SECONDS` | `604800` (7 days) | Maximum expiry time |
| `DEFAULT_EXPIRE_SECONDS` | `86400` (24 hours) | Default expiry shown in UI |
| `MAX_DOWNLOADS` | `100` | Maximum download limit |
| `DEFAULT_DOWNLOADS` | `1` | Default download limit in UI |
| `MAX_FILES_PER_ARCHIVE` | `64` | Maximum files in a single upload |

### Custom Branding

Send supports branding customization via environment variables:

```yaml
environment:
  CUSTOM_TITLE: "YourCompany File Share"
  CUSTOM_DESCRIPTION: "Secure file sharing for our team"
  UI_COLOR_PRIMARY: "#0a84ff"
  UI_COLOR_ACCENT: "#003eaa"
```

### Disk Space Management

Expired files are automatically deleted by Send's cleanup process. Disk usage depends on your `MAX_FILE_SIZE` and `MAX_EXPIRE_SECONDS` settings. With 5 GB max file size and 24-hour default expiry, budget 20-50 GB of disk for moderate usage.

Monitor disk usage:

```bash
docker exec send du -sh /uploads
```

## Reverse Proxy

Send **requires** HTTPS. The browser-side encryption depends on a secure context. Behind Caddy ([Reverse Proxy Setup](/foundations/reverse-proxy-explained)):

```
send.example.com {
    reverse_proxy localhost:1443
}
```

For [Nginx Proxy Manager](/apps/nginx-proxy-manager), create a proxy host pointing to `localhost:1443` with SSL enabled. Enable WebSocket support.

**Important:** Set `BASE_URL` in your environment to match the exact public URL including `https://`. Mismatched URLs break the encryption key derivation.

## Backup

Send's data is intentionally ephemeral — files expire and delete automatically. For disaster recovery:

- **send-redis-data** — Redis stores file metadata and expiry information
- **send-uploads** — Encrypted file blobs

```bash
# Backup Redis data
docker exec send-redis redis-cli BGSAVE
docker cp send-redis:/data/dump.rdb ./send-redis-backup-$(date +%Y%m%d).rdb

# Backup uploads (encrypted blobs)
docker run --rm -v send-uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/send-uploads-$(date +%Y%m%d).tar.gz /data
```

In practice, most Send deployments don't need regular backups — the data is ephemeral by design. See [Backup Strategy](/foundations/backup-strategy) for general guidance.

## Troubleshooting

### Upload fails immediately

**Symptom:** File upload starts but fails with a generic error.
**Fix:** Check `BASE_URL` matches your actual domain exactly (including `https://`). Mismatched URLs break the encryption. Also verify Redis is running: `docker compose logs send-redis`.

### "File has expired" error on fresh upload

**Symptom:** Newly uploaded file shows as expired immediately.
**Fix:** Redis may have stale data. Restart Redis: `docker compose restart send-redis`. If persistent, clear Redis: `docker exec send-redis redis-cli FLUSHALL` (this removes all pending file metadata).

### Large file uploads timeout

**Symptom:** Files over 1 GB fail to upload.
**Fix:** Check your reverse proxy's upload size limit. Nginx default is 1 MB. For Nginx Proxy Manager, increase the **Custom Nginx Configuration** with `client_max_body_size 6g;`. For Caddy, no limit by default.

### Files not auto-deleting

**Symptom:** Expired files remain on disk.
**Fix:** Send uses Redis TTLs to trigger cleanup. If Redis data was lost, orphaned files may remain. Manual cleanup: `docker exec send find /uploads -mtime +7 -delete` (deletes files older than 7 days).

### Encryption errors in browser

**Symptom:** "Error encrypting file" or blank page after upload.
**Fix:** Send requires a secure context (HTTPS). Ensure your reverse proxy provides SSL. Also check that the browser supports the Web Crypto API — very old browsers may not.

## Resource Requirements

- **RAM:** ~50-80 MB for Send, ~30 MB for Redis. Total ~80-110 MB idle.
- **CPU:** Low (encryption happens client-side, server just stores blobs)
- **Disk:** Proportional to upload volume. Budget based on `MAX_FILE_SIZE × average concurrent uploads`.

## Verdict

Send is the best self-hosted solution for link-based file sharing. End-to-end encryption, configurable expiry, download limits, zero accounts — it does exactly what WeTransfer does, minus the ads and privacy concerns. The Firefox Send heritage means the UI is clean and battle-tested.

For local device-to-device transfers (AirDrop-style), use [PairDrop](/apps/pairdrop) instead. For permanent file sharing and sync, use [Nextcloud](/apps/nextcloud) or [Seafile](/apps/seafile). Send is purpose-built for "here's a file, download it before the link expires."

## Frequently Asked Questions

### Are files truly end-to-end encrypted?
Yes. Encryption happens in the sender's browser using AES-GCM. The decryption key is part of the URL fragment (after #), which browsers never send to the server. The server stores only encrypted blobs.

### Does Send require user accounts?
No. Anyone with access to your Send instance can upload files. Recipients don't need accounts either — just the link.

### Can I restrict who can upload?
Not natively. Send has no authentication. To restrict access, put it behind a reverse proxy with basic auth or a VPN like [Tailscale](/apps/tailscale).

## Related

- [PairDrop vs Send](/compare/pairdrop-vs-send)
- [Send vs WeTransfer](/compare/send-vs-wetransfer)
- [How to Self-Host PairDrop](/apps/pairdrop)
- [Self-Hosted Alternatives to WeTransfer](/replace/wetransfer)
- [Self-Hosted Alternatives to AirDrop](/replace/airdrop)
- [Best Self-Hosted File Sharing Tools](/best/file-sharing)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
