---
title: "How to Self-Host Librum with Docker Compose"
description: "Step-by-step guide to self-hosting Librum with Docker Compose — a modern ebook reader and library manager with cloud sync and AI features."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "media-servers"
apps: ["librum"]
tags: ["self-hosted", "librum", "docker", "ebooks", "reading"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Librum?

[Librum](https://librumreader.com/) is a self-hosted ebook reader and library manager with a native desktop client. Upload your ebook collection to the Librum server, and read from any device with the client app. It supports EPUB, PDF, CBZ, and other formats, with features like highlights, bookmarks, notes, and cross-device sync.

Unlike [Calibre-Web](/apps/calibre-web) (browser-based), Librum uses a dedicated desktop/mobile client for reading. The server handles storage, sync, and user management.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of free RAM
- Storage for your ebook collection
- The [Librum client app](https://librumreader.com/) installed on your reading devices
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/librum && cd /opt/librum
```

Create a `docker-compose.yml` file:

```yaml
services:
  librum:
    # No versioned tags published — :latest is the only option
    image: ghcr.io/librum-reader/librum-server:latest
    container_name: librum
    depends_on:
      librum-db:
        condition: service_healthy
    ports:
      # API server
      - "5000:5000"
    environment:
      # Database connection (must match MariaDB credentials below)
      - DBConnectionString=Server=librum-db;port=3306;Database=librum;Uid=librum;Pwd=CHANGE_ME_DB_PASSWORD;
      # Admin account credentials — set before first run
      - AdminEmail=admin@example.com
      - AdminPassword=CHANGE_ME_ADMIN_PASSWORD
      # JWT authentication
      - JWTKey=CHANGE_ME_GENERATE_LONG_RANDOM_STRING
      - JWTValidIssuer=librum-self-hosted
      # Self-hosted mode
      - LIBRUM_SELFHOSTED=true
      # Optional: Email notifications (SMTP)
      # - SMTPEndpoint=smtp.example.com:587
      # - SMTPUsername=your-email@example.com
      # - SMTPPassword=your-email-password
      # - SMTPMailFrom=noreply@example.com
      # Optional: OpenAI integration
      # - OpenAIToken=sk-...
    volumes:
      # Book storage
      - librum-data:/var/lib/librum-server/librum_storage
    restart: unless-stopped

  librum-db:
    image: mariadb:11.7
    container_name: librum-db
    environment:
      - MARIADB_USER=librum
      - MARIADB_PASSWORD=CHANGE_ME_DB_PASSWORD
      - MARIADB_DATABASE=librum
      - MARIADB_ROOT_PASSWORD=CHANGE_ME_ROOT_PASSWORD
    volumes:
      - librum-db:/var/lib/mysql
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mariadb-admin", "ping", "-u", "librum", "-pCHANGE_ME_DB_PASSWORD"]
      interval: 20s
      timeout: 40s
      retries: 3
      start_period: 30s

volumes:
  librum-data:
  librum-db:
```

**Before starting:** Change all `CHANGE_ME` values:
- `CHANGE_ME_DB_PASSWORD` — strong database password (use in both services and the healthcheck)
- `CHANGE_ME_ADMIN_PASSWORD` — your admin login password
- `CHANGE_ME_GENERATE_LONG_RANDOM_STRING` — generate with `openssl rand -base64 45`
- `CHANGE_ME_ROOT_PASSWORD` — MariaDB root password

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Download and install the [Librum client app](https://librumreader.com/) on your computer
2. In the client, go to **Settings** → **Server** and enter your server URL: `http://your-server-ip:5000`
3. Log in with the admin email and password you set in `AdminEmail` / `AdminPassword`
4. Upload books through the client app — they sync to your server

Librum reads these formats: EPUB, PDF, MOBI, CBZ, CBR, DJVU, TXT, DOC, DOCX, PPT, PPTX.

## Configuration

### User Management

The admin account is created from the `AdminEmail`/`AdminPassword` environment variables on first startup. Additional users can be created through the API or the client app's admin panel.

### SMTP (Email Notifications)

To enable password resets and email notifications, configure SMTP:

```yaml
environment:
  - SMTPEndpoint=smtp.example.com:587
  - SMTPUsername=your-email@example.com
  - SMTPPassword=your-email-password
  - SMTPMailFrom=noreply@example.com
```

Without SMTP configured, users cannot reset passwords — you'll need to reset them manually via the database or API.

### AI Features (Optional)

Librum supports OpenAI integration for features like book summaries and content analysis. Add your OpenAI API key:

```yaml
environment:
  - OpenAIToken=sk-your-openai-key
```

This is entirely optional and has no effect on core functionality.

## Reverse Proxy

Put Librum behind a reverse proxy for HTTPS access:

- **Scheme:** `http`
- **Forward Hostname:** `librum` (or your server IP)
- **Forward Port:** `5000`

The client app connects to the API endpoint, so ensure the proxy passes through properly.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Critical data to back up:

1. **Book storage volume:**
```bash
docker run --rm -v librum-data:/data -v $(pwd):/backup alpine tar czf /backup/librum-data-$(date +%Y%m%d).tar.gz -C /data .
```

2. **MariaDB database:**
```bash
docker compose exec librum-db mariadb-dump -u librum -pYOUR_DB_PASSWORD librum > librum-db-$(date +%Y%m%d).sql
```

See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Client can't connect to server

**Symptom:** Librum client shows "Connection failed" when trying to log in.
**Fix:** Verify the server URL in the client matches your server's address and port (e.g., `http://192.168.1.100:5000`). Check that port 5000 is not blocked by a firewall. Test with:
```bash
curl http://your-server-ip:5000
```

### Admin account not working

**Symptom:** Can't log in with the credentials from environment variables.
**Fix:** Admin credentials are set only on first database initialization. If you changed them after the first run, the change has no effect. To reset, either drop the database and recreate it, or update the password through the API.

### Books not syncing

**Symptom:** Books uploaded from one device don't appear on another.
**Fix:** Verify both devices are connected to the same Librum server URL. Check that the server's storage volume is working:
```bash
docker exec librum ls /var/lib/librum-server/librum_storage
```

### Database connection errors

**Symptom:** Librum server logs show "Unable to connect to database."
**Fix:** Ensure the `DBConnectionString` credentials exactly match the MariaDB environment variables. The database service must be healthy before the API starts — the `depends_on` with healthcheck handles this. Check MariaDB health:
```bash
docker compose exec librum-db mariadb-admin ping -u librum -pYOUR_DB_PASSWORD
```

## Resource Requirements

- **RAM:** ~300-500 MB for both containers (server + MariaDB)
- **CPU:** Low
- **Disk:** ~100 MB for application + database, plus your ebook library size

## Verdict

Librum is a solid choice if you want a dedicated ebook reader with cloud sync. The native client app provides a better reading experience than browser-based alternatives like Calibre-Web. Cross-device sync, highlights, and bookmarks work seamlessly.

The main trade-off is the client requirement — you need the Librum app installed on every device. Browser-based alternatives like [Calibre-Web](/apps/calibre-web) or [Kavita](/apps/kavita) offer immediate access from any browser without installing anything. Librum also doesn't publish versioned Docker tags, which makes reproducible deployments harder.

For dedicated readers who want the best reading experience, Librum is worth it. For casual access to your ebook library, stick with Calibre-Web or Kavita.

## FAQ

### Is Librum free?

Yes. The self-hosted server and client are free. Librum also offers a managed cloud plan, but self-hosting gives you the same features at no cost.

### Can I use Librum in a browser?

No. Librum requires the desktop or mobile client app. For browser-based reading, use [Calibre-Web](/apps/calibre-web) or [Kavita](/apps/kavita).

### Does Librum support Kindle files?

Yes. Librum reads MOBI files (the Kindle format). It also supports EPUB, PDF, CBZ, and several other formats.

## Related

- [How to Self-Host Calibre-Web](/apps/calibre-web)
- [How to Self-Host Kavita](/apps/kavita)
- [Kavita vs Calibre-Web](/compare/kavita-vs-calibre-web)
- [Readarr vs LazyLibrarian](/compare/readarr-vs-lazylibrarian)
- [Best Self-Hosted Ebooks & Reading](/best/ebooks-reading)
- [Self-Hosted Kindle Unlimited Alternatives](/replace/kindle-unlimited)
- [Docker Compose Basics](/foundations/docker-compose-basics)
