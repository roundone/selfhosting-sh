---
title: "How to Self-Host PicoShare with Docker Compose"
description: "Deploy PicoShare with Docker Compose — a minimal, self-hosted file sharing app with expiring links and no external dependencies."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "file-sharing"
apps:
  - picoshare
tags:
  - self-hosted
  - picoshare
  - docker
  - file-sharing
  - file-transfer
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is PicoShare?

[PicoShare](https://github.com/mtlynch/picoshare) is a minimalist, self-hosted file sharing service. Upload a file, get a shareable link with optional expiry. That's it — no accounts for recipients, no complicated configuration, no JavaScript frameworks. Just a Go binary, a SQLite database, and a clean web UI.

PicoShare is built by Michael Lynch (mtlynch), known for writing clear, well-engineered software. It's designed for simplicity: one container, one volume, one environment variable to get started. It replaces quick file sharing needs without the overhead of a full platform like [Nextcloud](/apps/nextcloud/).

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 256 MB of free RAM (minimum)
- Disk space for uploaded files
- A domain name (optional but recommended)

## Docker Compose Configuration

Create a directory for PicoShare:

```bash
mkdir -p ~/picoshare && cd ~/picoshare
```

Create a `docker-compose.yml` file:

```yaml
services:
  picoshare:
    image: mtlynch/picoshare:1.4.2
    container_name: picoshare
    ports:
      - "127.0.0.1:4001:4001"
    environment:
      # Shared secret for authentication — CHANGE THIS
      PS_SHARED_SECRET: ${PS_SHARED_SECRET}
      # Port (default 4001)
      PORT: "4001"
    volumes:
      - picoshare-data:/data
    restart: unless-stopped

volumes:
  picoshare-data:
```

Create a `.env` file:

```bash
# CHANGE THIS — use a strong passphrase or generate with: openssl rand -hex 24
PS_SHARED_SECRET=change_me_to_a_strong_secret
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:4001` in your browser.
2. Enter the shared secret you configured in `PS_SHARED_SECRET` to authenticate.
3. Upload a file via the web UI.
4. Copy the generated link and share it — recipients don't need to authenticate.

No user accounts, no setup wizard. The shared secret is the admin password.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PS_SHARED_SECRET` | (required) | Authentication passphrase for the admin UI |
| `PORT` | `4001` | Server listen port |

PicoShare is intentionally minimal on configuration. File expiry is set per-upload through the web UI — there's no global default.

### Upload Options

When uploading a file, you can set:

- **Expiry:** Never, or a specific time (1 hour to 1 year)
- **Label:** Optional human-readable name for the link
- **Guest links:** Create temporary upload URLs for others to upload files to your instance

### Guest Upload Links

PicoShare supports guest upload links — generate a temporary URL that allows someone to upload files to your instance without knowing the shared secret:

1. Log in to PicoShare
2. Click **Guest Links** → **Create**
3. Set an expiry and optional upload limit
4. Share the guest link — the recipient can upload files through it

## Reverse Proxy

Behind Caddy ([Reverse Proxy Setup](/foundations/reverse-proxy-explained/)):

```
share.example.com {
    reverse_proxy localhost:4001
}
```

For large file uploads, ensure your reverse proxy doesn't impose a body size limit. Caddy has no limit by default. For Nginx, add `client_max_body_size 0;` to disable the limit.

## Backup

PicoShare stores everything (database + files) in a single SQLite database at `/data`:

```bash
# Backup the data volume
docker run --rm -v picoshare-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/picoshare-backup-$(date +%Y%m%d).tar.gz /data
```

See [Backup Strategy](/foundations/backup-strategy/) for a complete approach.

## Troubleshooting

### Authentication fails

**Symptom:** Entering the shared secret returns "invalid credentials."
**Fix:** Ensure `PS_SHARED_SECRET` is set correctly in your `.env` file. The value is case-sensitive. Restart the container after changes: `docker compose up -d`.

### Large file uploads fail

**Symptom:** Uploads over a few hundred MB fail or timeout.
**Fix:** PicoShare itself has no upload limit. Check your reverse proxy — Nginx defaults to 1 MB body size. Set `client_max_body_size 0;` for unlimited. Also check for timeout settings on the proxy.

### Files not persisting after restart

**Symptom:** Uploaded files disappear when the container restarts.
**Fix:** Ensure the `picoshare-data` volume is configured correctly. Don't use `docker compose down -v` (the `-v` flag deletes volumes).

## Resource Requirements

- **RAM:** ~20-50 MB idle
- **CPU:** Low
- **Disk:** ~20 MB for the application, plus storage for uploaded files (embedded in SQLite)

## Verdict

PicoShare is the most minimal file sharing tool you can self-host. One container, one env var, zero dependencies. It's perfect for quick "here's a file" sharing without the overhead of [Send](/apps/send/) (which adds Redis and end-to-end encryption) or [Zipline](/apps/zipline/) (which adds PostgreSQL and a full dashboard).

The trade-off is features — no end-to-end encryption, no ShareX integration, no multi-user support. If you need those, look at [Send](/apps/send/) or [Zipline](/apps/zipline/). If you just want to share files with minimal setup, PicoShare is hard to beat.

## Frequently Asked Questions

### Does PicoShare encrypt files?
No. Files are stored unencrypted in the SQLite database. For end-to-end encryption, use [Send](/apps/send/).

### Can multiple people share files through PicoShare?
There's one shared admin account (via the shared secret). Guest upload links let others upload without the admin password, but there's no multi-user management.

### How large can uploaded files be?
PicoShare has no built-in file size limit. The constraint is your server's disk space and any reverse proxy limits.

## Related

- [How to Self-Host Send](/apps/send/)
- [How to Self-Host Gokapi](/apps/gokapi/)
- [PairDrop vs Send](/compare/pairdrop-vs-send/)
- [Self-Hosted Alternatives to WeTransfer](/replace/wetransfer/)
- [Best Self-Hosted File Sharing Tools](/best/file-sharing/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
