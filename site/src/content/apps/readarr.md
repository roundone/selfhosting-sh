---
title: "How to Self-Host Readarr with Docker Compose"
description: "Step-by-step guide to self-hosting Readarr with Docker Compose for automated ebook and audiobook management."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "download-management"
apps:
  - readarr
tags:
  - docker
  - ebooks
  - audiobooks
  - download-management
  - arr-stack
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Readarr?

Readarr is an ebook and audiobook collection manager in the *arr stack family. Like [Sonarr](/apps/sonarr) for TV and [Radarr](/apps/radarr) for movies, Readarr monitors authors, tracks new releases, and automatically downloads books through Usenet or torrent clients. It uses GoodReads and OpenLibrary for metadata. [Official site](https://readarr.com/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of free disk space (plus storage for books)
- 512 MB of RAM minimum
- A download client: [SABnzbd](/apps/sabnzbd) (Usenet) or [qBittorrent](/apps/qbittorrent) (torrents)
- An indexer manager: [Prowlarr](/apps/prowlarr) (recommended)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  readarr:
    image: lscr.io/linuxserver/readarr:0.4.12-develop
    container_name: readarr
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
    volumes:
      - ./config:/config
      - /path/to/books:/books          # Your book library
      - /path/to/downloads:/downloads  # Download client output
    ports:
      - "8787:8787"
    restart: unless-stopped
```

**Note:** Readarr is still in the `develop` branch — there's no stable release yet. The develop branch is functional and widely used, but expect occasional breaking changes on update.

**Environment variables:**

| Variable | Purpose | Required |
|----------|---------|----------|
| `PUID` | User ID for file permissions | Yes |
| `PGID` | Group ID for file permissions | Yes |
| `TZ` | Timezone | Yes |

**Volume mounts:**

| Container Path | Purpose |
|---------------|---------|
| `/config` | Readarr configuration and database |
| `/books` | Your book library root |
| `/downloads` | Shared download directory |

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8787`
2. Set up authentication: **Settings → General → Security**
3. Add root folders: **Settings → Media Management → Root Folders**
   - Add `/books` for ebooks
   - Optionally add a separate path for audiobooks
4. Connect your download client: **Settings → Download Clients**
5. Add indexers via [Prowlarr](/apps/prowlarr) or manually

## Configuration

### Media Management

- **Settings → Media Management**
- Set book naming: `{Author Name}/{Book Title} ({Release Year})/{Book Title}`
- Enable **Rename Books** for consistent naming
- Enable **Replace Illegal Characters** for filesystem compatibility

### Quality Profiles

Readarr supports both ebooks and audiobooks:

**Ebooks:**
- EPUB (preferred — most compatible with readers)
- MOBI (Kindle-specific, increasingly deprecated)
- PDF (least flexible but sometimes the only option)
- AZW3 (Kindle format)

**Audiobooks:**
- M4B (Apple audiobook format — single file per book)
- MP3 (universal but typically split into chapters)

Set quality preferences under **Settings → Profiles**.

### Metadata Profiles

Control what Readarr monitors:

- **Standard:** All editions of monitored books
- Create custom profiles to filter by language or format

## Advanced Configuration (Optional)

### Calibre Integration

Readarr can send books directly to a Calibre library:

1. Install Calibre Content Server or [Calibre-Web](/apps/calibre-web)
2. In Readarr: **Settings → Download Clients → Add → Calibre**
3. Enter Calibre's host, port, and library path
4. Readarr imports books into Calibre instead of moving files directly

### Separate Ebook and Audiobook Libraries

Use two root folders to keep formats separate:

```yaml
volumes:
  - /path/to/ebooks:/books/ebooks
  - /path/to/audiobooks:/books/audiobooks
  - /path/to/downloads:/downloads
```

Add both as root folders in Readarr. When adding an author, choose which root folder to use.

## Reverse Proxy

Example Nginx Proxy Manager configuration:

- **Scheme:** http
- **Forward Hostname:** readarr
- **Forward Port:** 8787

[Reverse Proxy Setup](/foundations/reverse-proxy-explained)

## Backup

```bash
docker compose stop readarr
tar -czf readarr-backup-$(date +%Y%m%d).tar.gz ./config
docker compose start readarr
```

Readarr has built-in backups under **System → Backup**. [Backup Strategy](/foundations/backup-3-2-1-rule)

## Troubleshooting

### GoodReads Metadata Issues

**Symptom:** Author or book not found, wrong editions matched.
**Fix:** Readarr uses GoodReads for metadata. Search by GoodReads ID for exact matches. Some books have multiple editions — check the correct one is selected under the book's details. GoodReads rate limiting can also cause temporary search failures.

### Downloads Not Importing

**Symptom:** Books download but don't appear in the library.
**Fix:** Check path mapping — the download path must be accessible to both the download client and Readarr at the same path. Look at **Activity → Queue** for specific import errors. Common issue: ebook files inside nested directories that Readarr can't find.

### Duplicate Authors

**Symptom:** Same author appears multiple times.
**Fix:** This happens when GoodReads has multiple entries for the same author. Merge them manually: select the duplicate, note the GoodReads ID, delete it, and add the books to the correct author entry.

### High Disk Usage from Database

**Symptom:** Readarr's config directory grows very large.
**Fix:** The SQLite database can grow with extensive search history. Under **System → Tasks**, run **Clean Up Recycling Bin** and **Housekeeping**. If the database exceeds 1 GB, consider backing up and rebuilding.

## Resource Requirements

- **RAM:** ~150 MB idle, 300 MB with large libraries
- **CPU:** Low
- **Disk:** ~50 MB for application data, plus your book library

## Verdict

Readarr completes the *arr stack for book lovers. If you already use Sonarr and Radarr, adding Readarr is the logical next step for automating ebook and audiobook downloads. The develop-only status means you should expect occasional rough edges, but it's stable enough for daily use. The Calibre integration is a standout feature for anyone with an existing Calibre library.

## FAQ

### Is Readarr stable enough for daily use?

Yes. Despite being on the develop branch, Readarr has been in active use for years. Updates occasionally introduce bugs, but the LSIO image pins to tested versions. Back up your config before updates.

### Can Readarr send books to my Kindle?

Not directly. Use Calibre or Calibre-Web as an intermediary — Calibre can convert formats and email books to your Kindle's Send-to-Kindle address.

### Readarr vs LazyLibrarian?

Readarr. LazyLibrarian is older and has a less polished UI. Readarr's *arr stack integration, modern interface, and active development make it the better choice.

## Related

- [How to Self-Host Sonarr](/apps/sonarr)
- [How to Self-Host Radarr](/apps/radarr)
- [How to Self-Host Prowlarr](/apps/prowlarr)
- [How to Self-Host Calibre-Web](/apps/calibre-web)
- [How to Self-Host Audiobookshelf](/apps/audiobookshelf)
- [Best Self-Hosted Download Management](/best/download-management)
- [Docker Compose Basics](/foundations/docker-compose-basics)
