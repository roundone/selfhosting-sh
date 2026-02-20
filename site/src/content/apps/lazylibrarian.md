---
title: "How to Self-Host LazyLibrarian with Docker"
description: "Step-by-step guide to self-hosting LazyLibrarian with Docker Compose for automated ebook, audiobook, and magazine management."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "media-organization"
apps: ["lazylibrarian"]
tags: ["self-hosted", "lazylibrarian", "docker", "ebooks", "audiobooks", "magazines"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is LazyLibrarian?

[LazyLibrarian](https://gitlab.com/LazyLibrarian/LazyLibrarian) is a self-hosted book manager that automates ebook, audiobook, and magazine discovery and downloading. You add authors or book titles, and LazyLibrarian monitors Usenet and torrent indexers for new releases, grabs them, and organizes your library. It pulls metadata from Goodreads and LibraryThing, tracks series, and can convert formats via Calibre integration.

Think of it as the Sonarr/Radarr equivalent for books — but with magazine support and deeper library metadata features.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM
- Storage for your book collection
- At least one download client (SABnzbd, NZBGet, qBittorrent, Transmission)
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/lazylibrarian && cd /opt/lazylibrarian
```

Create a `docker-compose.yml` file:

```yaml
services:
  lazylibrarian:
    image: lscr.io/linuxserver/lazylibrarian:version-dada182d
    container_name: lazylibrarian
    environment:
      # User/group for file permissions
      - PUID=1000
      - PGID=1000
      # Timezone
      - TZ=America/New_York
      # Optional: Add Calibre and FFmpeg mods
      # Calibre mod enables calibredb import for ebook format conversion
      # FFmpeg mod enables audiobook format conversion
      - DOCKER_MODS=linuxserver/mods:lazylibrarian-calibre|linuxserver/mods:lazylibrarian-ffmpeg
    volumes:
      # Application configuration and database
      - lazylibrarian-config:/config
      # Download directory (must match your download client's output path)
      - /path/to/downloads:/downloads
      # Book library
      - /path/to/books:/books
    ports:
      # Web UI
      - "5299:5299"
    restart: unless-stopped

volumes:
  lazylibrarian-config:
```

Replace `/path/to/downloads` and `/path/to/books` with your actual paths.

**Note:** LazyLibrarian uses rolling version tags (e.g., `version-dada182d`) rather than semantic versioning. The `latest` tag always points to the most recent stable build.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:5299/home`
2. Go to **Config** → **Providers** and add your indexers:
   - **Usenet:** Add your Newznab-compatible indexer URLs and API keys
   - **Torrent:** Add Torznab URLs (from Jackett or Prowlarr)
3. Go to **Config** → **Downloaders** and add your download client:
   - SABnzbd, NZBGet, qBittorrent, Transmission, Deluge, or rTorrent
4. Go to **Config** → **Processing** and set your library paths:
   - Ebook library: `/books`
   - Download folder: `/downloads`
5. Search for an author and add them — LazyLibrarian will track their catalog and monitor for new releases

## Configuration

### Metadata Sources

LazyLibrarian pulls book metadata from multiple sources:

- **Goodreads:** The primary source. Provides author info, book descriptions, covers, ratings, and series data. Requires a Goodreads API key (free from goodreads.com/api).
- **LibraryThing:** Secondary source for additional metadata. Requires a LibraryThing developer key.
- **Google Books:** Fallback source. No API key required for basic searches.

Configure these under **Config** → **Sources**.

### Calibre Integration

With the `lazylibrarian-calibre` Docker mod installed, you can:

- Import downloaded books directly into your Calibre library
- Convert between ebook formats (EPUB → MOBI, PDF → EPUB, etc.)
- Use Calibre's metadata scraping alongside LazyLibrarian's

Set the converter path to `/usr/bin/calibredb` in **Config** → **Processing**.

### Audiobook Support

With the `lazylibrarian-ffmpeg` Docker mod:

- Convert audiobook formats (M4B → MP3, OGG, etc.)
- Organize audiobooks separately from ebooks
- Track audiobook series alongside ebook series

### Magazine Support

LazyLibrarian is the only *arr-style tool that handles magazines:

1. Go to **Magazines** → **Add Magazine**
2. Search for the magazine title
3. LazyLibrarian monitors indexers for new issues automatically

## Reverse Proxy

For remote access, put LazyLibrarian behind a reverse proxy:

- **Scheme:** `http`
- **Forward Hostname:** `lazylibrarian` (or your server IP)
- **Forward Port:** `5299`

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Back up the config volume to preserve your database, authors list, and settings:

```bash
docker compose stop lazylibrarian
tar -czf lazylibrarian-backup-$(date +%Y%m%d).tar.gz -C /var/lib/docker/volumes lazylibrarian-config
docker compose start lazylibrarian
```

Your book library should be backed up separately. See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Books not downloading

**Symptom:** LazyLibrarian finds books on indexers but downloads fail.
**Fix:** Check **Config** → **Downloaders**. Verify the download client URL and API key. If using Docker, make sure the download client container is on the same network and use the container name as the hostname (e.g., `http://sabnzbd:8080`), not `localhost`.

### Goodreads API key errors

**Symptom:** "Goodreads API error" when searching for authors.
**Fix:** Goodreads API access has become more restricted. If your key doesn't work, try using Google Books as the primary source, or use LibraryThing as a fallback.

### Downloaded books not importing

**Symptom:** Books are downloaded but don't appear in the library.
**Fix:** Check that the download directory volume mount matches your download client's output path. Both containers must see the files at the same path. Verify PUID/PGID permissions match between LazyLibrarian and your download client.

### Calibre mod not loading

**Symptom:** `calibredb` command not found after enabling the Docker mod.
**Fix:** The mod is installed at container startup. Restart the container and check logs:
```bash
docker restart lazylibrarian
docker logs lazylibrarian 2>&1 | grep -i calibre
```
The mod requires x86_64 architecture — it's not available on ARM.

## Resource Requirements

- **RAM:** ~80-120 MB idle, ~150 MB during searches
- **CPU:** Low
- **Disk:** ~50 MB for config, plus your library size
- **Additional:** Calibre mod adds ~200 MB to the image. FFmpeg mod adds ~100 MB.

## Verdict

LazyLibrarian is the most feature-complete self-hosted book manager. Magazine support, Goodreads integration, and Calibre conversion make it uniquely capable for dedicated book collectors. The trade-off is a dated UI and a less polished experience compared to the *arr apps.

If you're already in the *arr ecosystem and only need ebooks, [Readarr](/apps/readarr) is the smoother choice. If you want magazine tracking, audiobook conversion, or deep Goodreads/Calibre integration, LazyLibrarian is worth the rougher interface.

## FAQ

### LazyLibrarian or Readarr?

Use Readarr if you run the *arr stack and only need ebooks/audiobooks. Use LazyLibrarian if you need magazine support, Goodreads integration, or Calibre format conversion. See our [full comparison](/compare/readarr-vs-lazylibrarian).

### Does LazyLibrarian work with Prowlarr?

Not natively. LazyLibrarian doesn't integrate with Prowlarr's sync feature. You can manually add Prowlarr's Torznab/Newznab URLs to LazyLibrarian's provider settings, which works but requires manual indexer management.

### Can LazyLibrarian send books to my Kindle?

Not directly, but with Calibre integration enabled, you can convert books to Kindle-compatible formats (MOBI/AZW3) and use Calibre's email sending feature or manual transfer.

## Related

- [Readarr vs LazyLibrarian](/compare/readarr-vs-lazylibrarian)
- [How to Self-Host Readarr](/apps/readarr)
- [Kavita vs Calibre-Web](/compare/kavita-vs-calibre-web)
- [How to Self-Host Calibre-Web](/apps/calibre-web)
- [Best Self-Hosted Ebooks & Reading](/best/ebooks-reading)
- [Best Self-Hosted Media Organization](/best/media-organization)
- [*arr Stack Setup Guide](/foundations/arr-stack-setup)
- [Docker Compose Basics](/foundations/docker-compose-basics)
