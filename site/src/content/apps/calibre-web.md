---
title: "How to Self-Host Calibre-Web with Docker"
description: "Set up Calibre-Web with Docker Compose for a self-hosted ebook library with web reading, OPDS feeds, and Kindle send-to-device support."
date: 2026-02-16
dateUpdated: 2026-02-20
category: "media-servers"
apps:
  - calibre-web
tags: ["self-hosted", "calibre-web", "docker", "ebooks", "library", "reading"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Calibre-Web?

[Calibre-Web](https://github.com/janeczku/calibre-web) is a web-based interface for browsing, reading, and downloading books from an existing Calibre database. If you already use Calibre to manage your ebook library, Calibre-Web puts that library on the web — accessible from any device without installing Calibre. It supports EPUB, PDF, MOBI, and other ebook formats, with a built-in web reader, OPDS feed for third-party apps, send-to-Kindle support, and multi-user access control.

Calibre-Web is the most popular way to self-host a Calibre library for family or personal use.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- An existing Calibre library (a directory with `metadata.db` and your ebook files), OR willingness to create one
- 256 MB RAM minimum (512 MB recommended)
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/calibre-web && cd /opt/calibre-web
```

Create a `docker-compose.yml` file:

```yaml
services:
  calibre-web:
    image: lscr.io/linuxserver/calibre-web:0.6.26
    container_name: calibre-web
    ports:
      # Web UI
      - "8083:8083"
    volumes:
      # Application config and database
      - ./config:/config
      # Your existing Calibre library
      - /path/to/calibre/library:/books
    environment:
      # User/group ID for file permissions (run `id` to find yours)
      - PUID=1000
      - PGID=1000
      # Timezone (https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
      - TZ=America/New_York
      # Optional: enable ebook conversion support (adds calibre binaries to container)
      # - DOCKER_MODS=linuxserver/mods:universal-calibre
    restart: unless-stopped
```

**Important:** The `/books` mount must point to a directory containing a valid Calibre `metadata.db` file. If you don't have an existing Calibre library, install Calibre on any computer, create a library, add a few books, then copy the library directory to your server.

Start Calibre-Web:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8083` in your browser
2. Log in with default credentials: **admin** / **admin123**
3. On first login, set the **Calibre database location** to `/books`
4. Click **Save** — Calibre-Web will load your library
5. **Immediately change the admin password** under Admin → Edit Users → admin

### Creating a Calibre Library from Scratch

If you don't have an existing Calibre library:

```bash
# Install Calibre CLI tools on the server
sudo apt install -y calibre

# Create an empty library
calibredb --with-library=/path/to/calibre/library add /dev/null 2>/dev/null
# Remove the dummy entry
calibredb --with-library=/path/to/calibre/library remove 1

# Or: download a free ebook and add it
wget -O sample.epub https://www.gutenberg.org/ebooks/1342.epub.images
calibredb --with-library=/path/to/calibre/library add sample.epub
```

## Configuration

### User Management

Calibre-Web supports multiple users with different access levels:

- **Admin → Edit Users** to create accounts
- Each user can have: download permissions, upload permissions, edit permissions, email (for send-to-device)
- Users can maintain independent reading lists and bookshelves

### Upload Support

Enable uploads under **Admin → Basic Configuration → Feature Configuration → Enable Uploads**. Users with upload permission can add books directly through the web interface. New uploads are automatically added to the Calibre database.

### Email / Send-to-Kindle

Configure SMTP under **Admin → Basic Configuration → Email Settings**:
- Set up an SMTP server (Gmail, Fastmail, or your own mail server)
- Users can then send ebooks directly to their Kindle via the "Send to eReader" button
- Calibre-Web handles format conversion if the DOCKER_MODS calibre mod is enabled

### OPDS Feed

Calibre-Web serves an OPDS catalog at `http://your-server:8083/opds`. Compatible with:
- **KOReader** (e-ink devices)
- **Moon+ Reader** (Android)
- **Librera** (Android)
- **Panels** (iOS)

Enable OPDS under **Admin → Basic Configuration → Feature Configuration → Enable OPDS**.

## Advanced Configuration (Optional)

### Ebook Conversion

To enable on-the-fly ebook conversion (EPUB → MOBI, EPUB → PDF, etc.), uncomment the `DOCKER_MODS` line in your Docker Compose:

```yaml
environment:
  - DOCKER_MODS=linuxserver/mods:universal-calibre
```

This adds Calibre's conversion tools to the container (~500 MB additional space). Once enabled, users can convert and download books in their preferred format.

### Kobo Sync Integration

Calibre-Web supports Kobo eReader sync. Enable it under **Admin → Basic Configuration → Feature Configuration → Enable Kobo Sync**. This lets Kobo devices sync books, reading progress, and bookmarks directly with your server — no Kobo cloud account needed.

### External Authentication

Calibre-Web supports:
- **LDAP** — for enterprise/homelab directory integration
- **Google OAuth** — for Google account login
- **Reverse proxy authentication** — header-based auth (works with Authelia, Authentik)

## Reverse Proxy

Standard reverse proxy setup. Point your proxy to port 8083.

If using Kobo sync behind a reverse proxy, ensure the proxy passes the `X-Forwarded-For` header and supports WebSocket connections.

[Reverse Proxy Setup](/foundations/reverse-proxy-explained)

## Backup

Back up the `config/` directory and your Calibre library:

```bash
# Back up Calibre-Web config
tar -czf calibre-web-config-$(date +%Y%m%d).tar.gz /opt/calibre-web/config/

# Back up the Calibre library (books + metadata.db)
tar -czf calibre-library-$(date +%Y%m%d).tar.gz /path/to/calibre/library/
```

The `metadata.db` file in your library directory is critical — it contains all book metadata, user annotations, and library structure. Include it in every backup.

[Backup Strategy](/foundations/backup-strategy)

## Troubleshooting

### "Database path is not valid" on first setup

**Symptom:** Calibre-Web won't accept the database location.
**Fix:** Ensure the `/books` volume mount points to a directory containing `metadata.db`. Check with: `docker exec calibre-web ls /books/metadata.db`. If the file doesn't exist, you need to create a Calibre library first (see Initial Setup above).

### Permission denied on uploads

**Symptom:** Uploads fail or books can't be added.
**Fix:** Ensure `PUID` and `PGID` match the owner of your Calibre library directory. Check with `ls -ln /path/to/calibre/library/` and match the UID/GID in your Docker Compose.

### Book covers not displaying

**Symptom:** Books show without cover images.
**Fix:** Calibre-Web reads covers from the Calibre library's `cover.jpg` files in each book's directory. If covers are missing, re-fetch them using Calibre's "Download metadata" feature or add covers manually through the web interface.

### Send-to-Kindle not working

**Symptom:** Email delivery fails for send-to-device.
**Fix:** Verify SMTP settings under Admin → Email Settings. If using Gmail, you need an App Password (not your regular password). Also add your server's email address to your Kindle's approved senders list at amazon.com/myk.

### Slow performance with large libraries

**Symptom:** Pages load slowly with 10,000+ books.
**Fix:** Calibre-Web performs well up to ~20,000 books. For larger libraries, ensure the library is on fast storage (SSD preferred for `metadata.db`). Enable caching in the admin settings.

## Resource Requirements

- **RAM:** ~100 MB idle, ~200 MB with the calibre conversion mod active
- **CPU:** Low — minimal processing outside format conversion
- **Disk:** ~50 MB for the application. The Calibre library size depends on your collection. Budget ~1-5 MB per EPUB, 5-50 MB per PDF.

## Verdict

Calibre-Web is the best choice if you already have a Calibre library or want tight integration with Calibre's metadata management. It's mature, lightweight, and the send-to-Kindle feature alone makes it worth setting up for ebook readers.

For manga and comics, [Kavita](/apps/kavita) is a better choice — it has a superior comic reader and handles CBZ/CBR files natively. For comics specifically with metadata scraping, [Komga](/apps/komga) is worth considering. But for a traditional ebook library that the whole family can access, Calibre-Web is the standard.

## FAQ

### Do I need Calibre installed on my server?

No. Calibre-Web reads an existing Calibre database but doesn't require Calibre to be running. You can manage your library with Calibre on your desktop and sync the library directory to your server, or manage everything through Calibre-Web's upload feature.

### Can I use Calibre-Web without an existing library?

Yes, but you need to create an empty Calibre library first (see Initial Setup). Calibre-Web requires a valid `metadata.db` file to start.

### Does Calibre-Web support DRM-protected ebooks?

No. Calibre-Web serves DRM-free ebooks only. It cannot read or convert DRM-protected files.

### Can I sync reading progress across devices?

Calibre-Web tracks reading position in its built-in web reader. For Kobo devices, the Kobo sync feature syncs progress, bookmarks, and annotations. For other devices using OPDS, reading progress depends on the client app.

### How do I add books remotely?

Enable uploads in the admin settings. Users with upload permission can add books through the web interface from any device. Books are automatically processed and added to the Calibre database.

## Related

- [How to Self-Host Kavita](/apps/kavita)
- [How to Self-Host Komga](/apps/komga)
- [How to Self-Host Audiobookshelf](/apps/audiobookshelf)
- [Calibre-Web vs Kavita](/compare/kavita-vs-calibre-web)
- [Calibre-Web vs Komga](/compare/calibre-web-vs-komga)
- [Best Self-Hosted Media Servers](/best/media-servers)
- [Self-Hosted Kindle Alternatives](/replace/kindle)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-strategy)
