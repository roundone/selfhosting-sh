---
title: "How to Self-Host Kavita with Docker Compose"
description: "Set up Kavita with Docker Compose — a fast, self-hosted digital library for manga, comics, ebooks, and light novels with OPDS support."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "media-servers"
apps:
  - kavita
tags: ["self-hosted", "kavita", "docker", "ebooks", "manga", "comics", "reading"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Kavita?

[Kavita](https://www.kavitareader.com/) is a self-hosted digital library server for manga, comics, ebooks, and light novels. It provides a polished web-based reader with series tracking, reading progress sync, user management, and OPDS support for third-party reader apps. Kavita handles CBZ/CBR/CB7 (comics), EPUB (ebooks), PDF, and image-based formats natively. It's built with .NET and Angular, and is one of the fastest self-hosted readers for large libraries.

If you have a collection of manga, comics, or ebooks and want a clean way to read them on any device with progress tracking, Kavita is the top choice.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB RAM minimum (1 GB recommended for large libraries)
- Storage for your book/manga collection
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/kavita && cd /opt/kavita
```

Create a `docker-compose.yml` file:

```yaml
services:
  kavita:
    image: jvmilazz0/kavita:0.8.9.1
    container_name: kavita
    ports:
      # Web UI and API
      - "5000:5000"
    volumes:
      # Application config and database
      - ./config:/kavita/config
      # Mount your library directories — add as many as needed
      - /path/to/manga:/manga
      - /path/to/comics:/comics
      - /path/to/ebooks:/ebooks
    environment:
      # Set your timezone (https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
      - TZ=America/New_York
    restart: unless-stopped
```

Adjust the volume mounts to point at your actual library directories on the host. You can mount as many library paths as needed — each one becomes a separate library in Kavita.

Start Kavita:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:5000` in your browser
2. Create your admin account on the first-run wizard
3. Go to **Server Settings → Libraries** and add your library directories:
   - Click **Add Library**
   - Choose the library type (Manga, Comic, Book, or Light Novel)
   - Select the mounted path (e.g., `/manga`, `/comics`, `/ebooks`)
   - Kavita will scan and index the library automatically
4. The scanner organizes files by folder structure — group series into folders for best results

**Recommended folder structure:**

```
/manga/
  Series Name/
    Volume 01.cbz
    Volume 02.cbz
/ebooks/
  Author Name/
    Book Title.epub
```

## Configuration

### Library Management

Kavita auto-detects file types and organizes content into series. Key settings under **Server Settings**:

- **Scan interval** — how often Kavita checks for new files (default: every 24 hours)
- **Metadata downloading** — Kavita can fetch cover art and metadata from online sources
- **File format support** — CBZ, CBR, CB7, ZIP, RAR, 7Z, EPUB, PDF, raw images (JPG, PNG, WebP)

### User Management

Create accounts for family members under **Server Settings → Users**. Each user gets:
- Independent reading progress per series
- Personal bookmarks and collections
- Age-based content restriction levels
- Per-library access control (e.g., kids can't see mature content)

### OPDS Support

Kavita exposes an OPDS feed at `http://your-server:5000/api/opds/{api-key}`. Use this with third-party reader apps like:
- **Panels** (iOS) — best OPDS client for manga/comics
- **Librera** (Android) — full-featured ebook reader
- **KOReader** — open-source reader for e-ink devices

Get your OPDS API key from **User Settings → 3rd Party Clients**.

## Advanced Configuration (Optional)

### Authentication with API Keys

Kavita generates per-user API keys for third-party app integration. Access them under **User Settings → 3rd Party Clients**. This avoids sharing passwords with OPDS readers.

### Custom Themes

Kavita supports custom CSS themes. Place theme files in the `config/themes/` directory. The community maintains several themes on the [Kavita GitHub Discussions](https://github.com/Kareadita/Kavita/discussions).

### Kavita+

Kavita+ is an optional paid feature ($20/year or $50 lifetime) that adds:
- External metadata fetching from AniList, MyAnimeList, and other sources
- MAL/AniList scrobbling (sync reading progress)
- Smart recommendations

Kavita+ is entirely optional — the core server is fully functional without it.

## Reverse Proxy

Kavita works behind a reverse proxy with no special configuration needed. Point your proxy to port 5000.

Example Nginx Proxy Manager setup:
- **Scheme:** http
- **Forward Hostname:** kavita (or container IP)
- **Forward Port:** 5000
- Enable **Websockets Support** for real-time reading progress

[Reverse Proxy Setup](/foundations/reverse-proxy-explained)

## Backup

Back up the `config/` directory, which contains:
- `kavita.db` — the SQLite database (user data, reading progress, library metadata)
- `config/` subdirectories — themes, cache, covers

```bash
# Simple backup script
tar -czf kavita-backup-$(date +%Y%m%d).tar.gz /opt/kavita/config/
```

Your actual book/manga files are stored on the host and should be part of your regular [backup strategy](/foundations/backup-strategy).

## Troubleshooting

### Library scan finds no files

**Symptom:** Kavita shows 0 series after adding a library.
**Fix:** Check your volume mounts. The path in Kavita's library settings must match the container-side path (e.g., `/manga`), not the host path. Also verify file permissions — Kavita runs as UID 0 by default inside the container.

### Comics/manga display in wrong order

**Symptom:** Chapters or volumes appear out of order.
**Fix:** Kavita sorts by parsed volume/chapter numbers from filenames. Use consistent naming: `Series Name Vol 01.cbz`, `Series Name Vol 02.cbz`. Avoid special characters in filenames.

### OPDS feed not working in reader app

**Symptom:** Third-party reader can't connect to OPDS.
**Fix:** Ensure you're using the full OPDS URL including your API key: `http://server:5000/api/opds/{your-api-key}`. If behind a reverse proxy, use the external URL. Some apps need the trailing slash removed.

### High memory usage during scanning

**Symptom:** Memory spikes when scanning large libraries.
**Fix:** This is normal during initial scan of large collections (10,000+ files). Memory returns to normal after scanning completes. For very large libraries, scan one library at a time.

### Cover images not generating

**Symptom:** Series show placeholder covers instead of extracted art.
**Fix:** Kavita extracts covers from the first page of each file. Ensure files aren't corrupted. For EPUB files, verify the cover image is properly embedded in the metadata.

## Resource Requirements

- **RAM:** ~150 MB idle, 300-500 MB during library scans, up to 1 GB for very large libraries (50,000+ files)
- **CPU:** Low — spikes during scanning and cover generation
- **Disk:** ~50 MB for the application, plus your book/manga collection. Kavita's database and cover cache grow to roughly 1-5 GB for a 10,000+ file library.

## Verdict

Kavita is the best self-hosted reader for manga and comics, and a strong option for ebooks. The web reader is fast and responsive, series tracking works well, and OPDS support means you can use your preferred reading app. It handles large libraries (50,000+ files) without breaking a sweat.

If your primary focus is manga and comics, choose Kavita. If you need a more traditional ebook library manager with Calibre integration, look at [Calibre-Web](/apps/calibre-web). If you want a comics-only solution with deeper metadata scraping, [Komga](/apps/komga) is the alternative.

## FAQ

### Can Kavita replace Calibre?

Kavita is a reader and server, not a library management tool. It doesn't convert formats, edit metadata, or manage DRM. Use Calibre for library management and Kavita for reading and serving.

### Does Kavita support e-ink devices?

Not directly via the web interface (no e-ink optimized mode). Use the OPDS feed with a reader like KOReader on your e-ink device for the best experience.

### Can multiple users read the same series?

Yes. Each user has independent reading progress. Multiple people can read the same series simultaneously without interfering with each other's bookmarks.

### Does Kavita support audiobooks?

No. Kavita is for visual reading only (text and images). For audiobooks, use [Audiobookshelf](/apps/audiobookshelf).

### How does Kavita compare to Komga?

Kavita supports more formats (EPUB, PDF in addition to comics) and has a built-in web reader. Komga focuses specifically on comics/manga with better metadata scraping. See our [Kavita vs Komga comparison](/compare/kavita-vs-komga).

## Related

- [How to Self-Host Calibre-Web](/apps/calibre-web)
- [How to Self-Host Komga](/apps/komga)
- [How to Self-Host Audiobookshelf](/apps/audiobookshelf)
- [Kavita vs Calibre-Web](/compare/kavita-vs-calibre-web)
- [Kavita vs Komga](/compare/kavita-vs-komga)
- [Best Self-Hosted Media Servers](/best/media-servers)
- [Self-Hosted Kindle Alternatives](/replace/kindle)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-strategy)
