---
title: "How to Self-Host Komga with Docker Compose"
description: "Set up Komga with Docker Compose — a self-hosted comics and manga server with OPDS support, metadata scraping, and a web reader."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "media-servers"
apps:
  - komga
tags: ["self-hosted", "komga", "docker", "comics", "manga", "reading"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Komga?

[Komga](https://komga.org/) is a self-hosted comics and manga media server with a web-based reader, metadata management, and OPDS support. It scans your library of CBZ, CBR, PDF, and EPUB files, organizes them into series and collections, and serves them through a clean web interface or via OPDS to third-party reader apps. Komga focuses specifically on comics and manga — it does one thing and does it well.

Komga's standout features are its metadata scraping capabilities, read progress tracking across devices, and excellent API that powers a rich ecosystem of third-party apps.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 512 MB RAM minimum (1 GB recommended for large libraries)
- A Java-compatible filesystem for the config directory (local, not NFS/CIFS)
- Storage for your comic/manga collection
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/komga && cd /opt/komga
```

Create a `docker-compose.yml` file:

```yaml
services:
  komga:
    image: gotson/komga:1.24.1
    container_name: komga
    ports:
      # Web UI and API
      - "25600:25600"
    volumes:
      # Config and database — MUST be local filesystem, not NFS/CIFS
      - ./config:/config
      # Your comics/manga library
      - /path/to/comics:/data
    environment:
      # Set your timezone
      - TZ=America/New_York
    # Run as your user to avoid permission issues
    user: "1000:1000"
    restart: unless-stopped
```

**Important:** The `/config` volume must be on a local filesystem. Komga's embedded H2 database does not work reliably on network shares (NFS, CIFS). Your library files in `/data` can be on any filesystem.

Start Komga:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:25600` in your browser
2. Create your admin account on the first-run page
3. Go to **Server Settings → Libraries** and add your library:
   - Click the **+** button
   - Give the library a name (e.g., "Manga", "Comics")
   - Set the root folder to your mounted path (e.g., `/data` or a subdirectory)
   - Komga will scan the directory and organize content into series
4. Komga auto-detects series from folder structure:

```
/data/
  Marvel/
    Spider-Man/
      Spider-Man 001.cbz
      Spider-Man 002.cbz
    X-Men/
      X-Men 001.cbr
  Manga/
    One Piece/
      One Piece v01.cbz
      One Piece v02.cbz
```

## Configuration

### Library Settings

Each library can be configured independently:

- **Scan interval** — automatic rescan frequency (default: every 6 hours)
- **Scanner** — deep scan detects file changes; quick scan checks only new/removed files
- **Metadata** — choose whether to use embedded metadata from files
- **Hashing** — enables deduplication detection (CPU-intensive on first run)

### User Management

Create users under **Server Settings → Users**:
- Each user gets independent read progress and bookmarks
- Restrict library access per user (e.g., kids can't see mature content)
- Set content age restrictions by user
- Users can create personal collections and reading lists

### OPDS Support

Komga serves an OPDS feed at `http://your-server:25600/opds/v1.2/catalog`. Compatible readers:

- **Tachiyomi/Mihon** (Android) — best manga reader, has a Komga extension
- **Panels** (iOS) — excellent OPDS comic reader
- **CDisplayEx** (Windows) — desktop comic viewer
- **KOReader** (e-ink) — for reading on Kindle/Kobo/e-ink devices

### Tachiyomi/Mihon Integration

Komga has first-class Tachiyomi (now Mihon) support:
1. Install the Komga extension in Mihon
2. Enter your server URL and credentials
3. All your libraries, series, and read progress sync automatically

This makes Komga + Mihon the best self-hosted manga reading setup on Android.

## Advanced Configuration (Optional)

### Metadata Scraping

Komga can read metadata from:
- **ComicInfo.xml** — standard comic metadata format embedded in CBZ files
- **comic-vine** — third-party tools like ComicTagger can embed metadata before import
- **EPUB metadata** — reads standard EPUB metadata fields

For best results, tag your files with [ComicTagger](https://github.com/comictagger/comictagger) before importing.

### Memory Tuning

For large libraries (10,000+ files), increase Java heap memory:

```yaml
environment:
  - JAVA_TOOL_OPTIONS=-Xmx2g
```

Default heap is 256 MB, which handles ~5,000 files. Scale up proportionally for larger collections.

### API Access

Komga has a comprehensive REST API documented at `http://your-server:25600/swagger-ui.html`. The API enables:
- Programmatic library management
- Custom integrations and automations
- Third-party app development

## Reverse Proxy

Standard reverse proxy configuration. Point your proxy to port 25600.

```
# Nginx example location block
location / {
    proxy_pass http://komga:25600;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

[Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

## Backup

Back up the `config/` directory, which contains Komga's H2 database:

```bash
# Stop Komga before backing up to ensure database consistency
docker compose stop komga
tar -czf komga-backup-$(date +%Y%m%d).tar.gz /opt/komga/config/
docker compose start komga
```

The database stores: user accounts, reading progress, collections, metadata overrides, and thumbnails. Your actual comic/manga files are on the host filesystem and should be part of your regular [backup strategy](/foundations/backup-strategy/).

## Troubleshooting

### Library scan shows 0 series

**Symptom:** Komga finds no content after scanning.
**Fix:** Verify volume mounts are correct — the path in library settings must be the container-side path (`/data`). Check file permissions: the `user` directive in Docker Compose must match the UID/GID that owns the files. Run `id` on the host to find your UID/GID.

### "Database is locked" errors

**Symptom:** Komga throws database lock errors or becomes unresponsive.
**Fix:** The `/config` volume is likely on NFS or CIFS. Move it to local storage. Komga's H2 database requires a local filesystem for file locking to work correctly.

### Slow scanning on first run

**Symptom:** Initial library scan takes hours.
**Fix:** First scan is always slowest because Komga generates thumbnails and hashes for every file. Disable hashing in library settings if you don't need deduplication. Subsequent scans are much faster.

### Tachiyomi/Mihon can't connect

**Symptom:** Mihon extension fails to connect to Komga.
**Fix:** Ensure the server URL includes the port (e.g., `http://192.168.1.100:25600`). If behind a reverse proxy, use the external URL. Check that the user account exists and has access to at least one library.

### Out of memory errors

**Symptom:** Komga crashes with Java heap space errors.
**Fix:** Add `JAVA_TOOL_OPTIONS=-Xmx1g` (or higher) to the environment variables. The default 256 MB heap is too small for libraries over 5,000 files.

## Resource Requirements

- **RAM:** ~200 MB idle (default heap), 500 MB-2 GB for large libraries. Configure via `JAVA_TOOL_OPTIONS`.
- **CPU:** Low during normal use. Moderate during initial scan and thumbnail generation.
- **Disk:** ~30 MB for the application. Database and thumbnail cache grows to 500 MB-2 GB depending on library size.

## Verdict

Komga is the best self-hosted option for comics and manga if you value metadata management, a great API, and Tachiyomi/Mihon integration. The web reader is solid, the OPDS feed works well, and the organized library view makes browsing large collections easy.

If you also need ebook (EPUB) support with a built-in reader, [Kavita](/apps/kavita/) covers more formats. If you want ebook management with Calibre integration and send-to-Kindle, [Calibre-Web](/apps/calibre-web/) is the better fit. For manga + comics specifically, Komga and Kavita are both excellent — Komga has better metadata capabilities, while Kavita has a better built-in reader.

## FAQ

### Komga vs Kavita — which should I use?

Komga has better metadata scraping and Tachiyomi integration. Kavita supports more formats (EPUB, PDF natively) and has a superior built-in reader. If you primarily use a mobile reader like Mihon, choose Komga. If you read in the browser, choose Kavita. See our [detailed comparison](/compare/kavita-vs-komga/).

### Can Komga serve ebooks?

Komga supports EPUB and PDF files, but its reader is optimized for comics and manga. For a better ebook reading experience, use [Calibre-Web](/apps/calibre-web/) or [Kavita](/apps/kavita/).

### Does Komga work with Kindle?

Not directly. Komga's OPDS feed works with KOReader on jailbroken Kindles. For standard Kindles, Calibre-Web's send-to-Kindle feature is a better option.

### Can I import my existing Calibre library?

No. Komga manages its own library structure based on folders. It doesn't read Calibre's `metadata.db`. If you want to serve a Calibre library, use Calibre-Web instead.

### How do I add metadata to my comics?

Use [ComicTagger](https://github.com/comictagger/comictagger) to embed ComicInfo.xml metadata into your CBZ files before importing. Komga reads this metadata automatically during scanning.

## Related

- [How to Self-Host Kavita](/apps/kavita/)
- [How to Self-Host Calibre-Web](/apps/calibre-web/)
- [How to Self-Host Audiobookshelf](/apps/audiobookshelf/)
- [Komga vs Kavita](/compare/kavita-vs-komga/)
- [Komga vs Calibre-Web](/compare/calibre-web-vs-komga/)
- [Komga vs Calibre-Web](/compare/komga-vs-calibre-web/)
- [Best Self-Hosted Media Servers](/best/media-servers/)
- [Self-Hosted Kindle Alternatives](/replace/kindle/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-strategy/)
- [Kavita vs Calibre-Web vs Komga](/compare/kavita-vs-calibre-web-vs-komga/)
