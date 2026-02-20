---
title: "How to Self-Host Jirafeau with Docker Compose"
description: "Deploy Jirafeau with Docker Compose — a lightweight, self-hosted file upload and sharing tool with password protection and expiry."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "file-sharing"
apps:
  - jirafeau
tags:
  - self-hosted
  - jirafeau
  - docker
  - file-sharing
  - file-transfer
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Jirafeau?

[Jirafeau](https://gitlab.com/jirafeau/Jirafeau) is a lightweight, self-hosted file upload and sharing tool written in PHP. Upload a file through the web UI, get a shareable link with optional password protection, download count limit, and time-based expiry. No database required — Jirafeau stores everything on the filesystem.

Jirafeau has been around since 2008, making it one of the oldest self-hosted file sharing tools. It's battle-tested, minimal, and runs on any PHP-capable server. No JavaScript frameworks, no Node.js, no external dependencies.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 256 MB of free RAM (minimum)
- Disk space for uploaded files
- A domain name (optional but recommended)

## Docker Compose Configuration

Create a directory for Jirafeau:

```bash
mkdir -p ~/jirafeau && cd ~/jirafeau
```

Create a `docker-compose.yml` file:

```yaml
services:
  jirafeau:
    image: mojo42/jirafeau:4.5.0
    container_name: jirafeau
    ports:
      - "127.0.0.1:8080:80"
    environment:
      # Admin password — CHANGE THIS
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      # Public-facing URL of your Jirafeau instance
      WEB_ROOT: https://share.example.com/
      # Upload password (optional — set to restrict who can upload)
      UPLOAD_PASSWORD: ""
      # Maximum file size in bytes (default: no limit from Jirafeau, PHP limits apply)
      UPLOAD_MAXSIZE: "0"
    volumes:
      - jirafeau-data:/data
      - jirafeau-media:/jirafeau/media
    restart: unless-stopped

volumes:
  jirafeau-data:
  jirafeau-media:
```

Create a `.env` file:

```bash
# CHANGE THIS — admin panel password
ADMIN_PASSWORD=change_me_to_a_strong_password
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8080` in your browser.
2. The upload interface appears immediately — no setup wizard.
3. Upload a file, optionally set a password and expiry time.
4. Copy the generated download link.
5. Access the admin panel at `http://your-server-ip:8080/admin.php` with your `ADMIN_PASSWORD`.

## Configuration

### Upload Options

When uploading through the web UI:

- **Password:** Optional password to protect the download
- **One-time download:** File deletes after a single download
- **Expiry:** None, minute, hour, day, week, month, quarter, year
- **Preview:** Enable/disable in-browser preview for supported file types

### Upload Restriction

To restrict who can upload (while anyone with a link can still download), set an upload password:

```yaml
environment:
  UPLOAD_PASSWORD: "secret-upload-key"
```

Uploaders must enter this password before the upload form appears. Leave empty for unrestricted uploads.

### Admin Panel

Access `your-domain/admin.php` to:

- View all uploaded files with metadata
- Delete specific files
- Run cleanup to remove expired files
- View storage statistics

## Reverse Proxy

Behind Caddy ([Reverse Proxy Setup](/foundations/reverse-proxy-explained)):

```
share.example.com {
    reverse_proxy localhost:8080
}
```

Update `WEB_ROOT` to match your public URL. For large file uploads with Nginx, increase the body size limit:

```nginx
client_max_body_size 500m;
```

## Backup

Jirafeau stores all data (files + metadata) on the filesystem:

- **jirafeau-data** — Uploaded files and link metadata
- **jirafeau-media** — Additional media (if any)

```bash
docker run --rm -v jirafeau-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/jirafeau-backup-$(date +%Y%m%d).tar.gz /data
```

See [Backup Strategy](/foundations/backup-strategy) for a complete approach.

## Troubleshooting

### Upload fails with "file too large"

**Symptom:** PHP returns a file size error.
**Fix:** Set `UPLOAD_MAXSIZE: "0"` (unlimited) in the environment and increase PHP limits. Create a custom PHP config or override `upload_max_filesize` and `post_max_size` in the container.

### Expired files not deleted

**Symptom:** Files past their expiry date remain accessible.
**Fix:** Jirafeau checks expiry on download, not on a schedule. Run manual cleanup from the admin panel, or set up a cron job to call the cleanup script.

### Admin panel returns 403

**Symptom:** Can't access `admin.php`.
**Fix:** Verify `ADMIN_PASSWORD` is set. If the password is empty or unset, the admin panel is disabled.

## Resource Requirements

- **RAM:** ~30-50 MB idle
- **CPU:** Low
- **Disk:** ~20 MB for the application, plus storage for uploaded files

## Verdict

Jirafeau is the grandparent of self-hosted file sharing. It works, it's stable, and it has zero external dependencies. If you want a minimal PHP-based upload tool that runs on anything, Jirafeau is a safe choice.

That said, it's showing its age. The UI is functional but dated compared to [PicoShare](/apps/picoshare) or [Gokapi](/apps/gokapi). It lacks features like API uploads, S3 storage, or end-to-end encryption. For new deployments, [Gokapi](/apps/gokapi) or [PicoShare](/apps/picoshare) offer a more modern experience with similar simplicity.

## Frequently Asked Questions

### Does Jirafeau require a database?
No. All data is stored on the filesystem. No MySQL, PostgreSQL, or SQLite needed.

### Can I restrict downloads to specific people?
Yes. Set a password on individual uploads. Only users with the password can download the file.

### Is Jirafeau still actively maintained?
Yes, but development is slow. The project is stable and mature — it receives security updates and occasional feature additions, but don't expect frequent releases.

## Related

- [How to Self-Host Gokapi](/apps/gokapi)
- [How to Self-Host PicoShare](/apps/picoshare)
- [How to Self-Host Send](/apps/send)
- [PairDrop vs Send](/compare/pairdrop-vs-send)
- [Best Self-Hosted File Sharing Tools](/best/file-sharing)
- [Self-Hosted Alternatives to WeTransfer](/replace/wetransfer)
- [Docker Compose Basics](/foundations/docker-compose-basics)
