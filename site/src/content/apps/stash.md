---
title: "How to Self-Host Stash with Docker Compose"
description: "Step-by-step guide to self-hosting Stash with Docker Compose — an organizer and metadata scraper for your personal media collection."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "media-servers"
apps:
  - stash
tags: ["self-hosted", "stash", "media", "docker", "organizer"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Stash?

[Stash](https://stashapp.cc/) is a self-hosted media organizer and metadata scraper built in Go. It scans local video and image files, scrapes metadata from community databases (via Stash-Box instances), generates thumbnails and preview clips, and provides a searchable web interface with tagging, filtering, and scene detection. Stash runs as a single binary with an embedded SQLite database — no external dependencies needed.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB RAM minimum (4 GB recommended for large libraries and transcoding)
- Disk space for your media library plus cache for generated thumbnails/previews
- A domain name (optional, for remote access)

## Docker Compose Configuration

Stash runs as a single container with no external database needed. The embedded SQLite database handles all metadata storage.

Create a project directory:

```bash
mkdir -p /opt/stash && cd /opt/stash
```

Create a `docker-compose.yml`:

```yaml
services:
  stash:
    image: stashapp/stash:v0.30.1
    container_name: stash
    ports:
      # Web UI
      - "9999:9999"
    environment:
      # Internal port configuration
      - STASH_PORT=9999
      # Logging level: Trace, Debug, Info, Warning, Error
      - STASH_STASH=/data/
      - STASH_GENERATED=/generated/
      - STASH_METADATA=/metadata/
      - STASH_CACHE=/cache/
    volumes:
      # Application config and SQLite database
      - /opt/stash/config:/root/.stash
      # Your media library
      - /path/to/your/media:/data:ro
      # Generated thumbnails, sprites, previews, transcodes
      - /opt/stash/generated:/generated
      # Metadata exports and imports
      - /opt/stash/metadata:/metadata
      # Temporary cache for transcoding
      - /opt/stash/cache:/cache
    restart: unless-stopped
```

**Important:** Change `/path/to/your/media` to your actual media directory.

Start the stack:

```bash
mkdir -p /opt/stash/{config,generated,metadata,cache}
docker compose up -d
```

## Initial Setup

1. Open `http://your-server:9999` in a browser
2. The setup wizard launches on first access
3. Configure your paths:
   - **Stash library:** `/data` (your media mount)
   - **Generated content:** `/generated`
   - **Metadata:** `/metadata`
   - **Cache:** `/cache`
4. Set authentication — create a username and password (strongly recommended)
5. Click **Finish** to start the initial scan
6. Stash scans your media directory, generates thumbnails, and creates a searchable index

## Configuration

### Library Scanning

Stash watches your configured directories and can be set to scan automatically:

- **Manual scan:** Click the lightning bolt icon in the top bar → **Scan**
- **Auto-scan:** Enable under **Settings** → **System** → **Scan on startup**
- **Generate content:** After scanning, run **Generate** to create thumbnails, preview clips, and sprite sheets

### Metadata Scraping

Stash can match your files against community metadata databases (Stash-Box instances):

1. Go to **Settings** → **Metadata Providers**
2. Add a Stash-Box endpoint URL and your API key
3. Use **Tagger** view to match files with metadata records
4. Matched entries get titles, descriptions, tags, and cover images

### Tagging and Organization

Stash has a flexible tagging system:

- **Tags:** Free-form labels on any item
- **Studios:** Group content by source/studio
- **Performers:** Track individual performers across scenes
- **Markers:** Bookmark specific timestamps within videos
- **Galleries:** Organize image collections

### Plugins and Scrapers

Stash has a plugin ecosystem accessible via **Settings** → **Plugins**. Community plugins extend functionality:

- Custom scrapers for additional metadata sources
- Automated tagging based on file paths or names
- Integration with external tools
- Duplicate detection

Install plugins from the community repository directly through the web UI.

## Reverse Proxy

Forward traffic to port 9999.

### Nginx Proxy Manager

- **Scheme:** `http`
- **Forward Hostname:** `your-server-ip`
- **Forward Port:** `9999`
- Enable SSL with Let's Encrypt

### Caddy

```
stash.yourdomain.com {
    reverse_proxy localhost:9999
}
```

See [Reverse Proxy Setup](/foundations/reverse-proxy) for detailed instructions.

## Backup

Critical data to back up:

- **Config directory:** `/opt/stash/config` — contains the SQLite database (all metadata, tags, performers, settings) and configuration
- **Metadata directory:** `/opt/stash/metadata` — metadata exports
- **Generated directory:** `/opt/stash/generated` — thumbnails and previews (can be regenerated but takes time)
- **Media files:** Your original media directory

```bash
# Back up database and config
tar czf stash-backup-$(date +%Y%m%d).tar.gz /opt/stash/config /opt/stash/metadata

# Export metadata as JSON (via the API or Settings → Tasks → Export)
```

Stash also has a built-in backup feature under **Settings** → **System** → **Backup** that creates database snapshots.

See [Backup Strategy](/foundations/backup-strategy) for a comprehensive backup approach.

## Troubleshooting

### Files not appearing after scan

**Symptom:** Scan completes but the library is empty.
**Fix:** Verify the container can read your media directory: `docker compose exec stash ls /data/`. Check that the path in Settings matches your volume mount. Stash scans recursively, so files in subdirectories should be detected.

### Thumbnails not generating

**Symptom:** Items show placeholder images instead of thumbnails.
**Fix:** Run a **Generate** task from the lightning bolt menu. Thumbnail generation is separate from scanning. Check logs for FFmpeg errors — the Docker image includes FFmpeg, but corrupted media files can cause generation failures for specific items.

### High disk usage from generated content

**Symptom:** The generated directory grows very large.
**Fix:** Preview clips and sprite sheets consume significant disk space. Under **Settings** → **System** → **Preview Generation**, reduce the preview segment duration or disable preview generation entirely. Thumbnails alone use much less space.

### Cannot connect after enabling authentication

**Symptom:** Locked out after setting up authentication.
**Fix:** Delete the `config.yml` file in `/opt/stash/config/` and restart the container. This resets all settings including authentication. Reconfigure from the setup wizard.

### Slow performance on large libraries

**Symptom:** Web UI is sluggish with 10,000+ items.
**Fix:** Ensure the config directory is on a fast local filesystem (SSD recommended), not network storage. SQLite performance degrades on NFS/SMB. Run **Optimize Database** from the Tasks menu periodically.

## Resource Requirements

- **RAM:** ~200 MB idle, 500 MB–1 GB during scanning and thumbnail generation
- **CPU:** Moderate during scanning (FFmpeg for thumbnails/previews). Low at idle.
- **Disk:** ~100 MB for the application. Generated content (thumbnails, previews) varies — expect 5-15% of your library size.

## Verdict

Stash is a capable media organizer with strong metadata scraping and tagging features. The plugin system and community scraper ecosystem add flexibility. The single-container deployment with embedded SQLite keeps setup trivially simple.

Stash fills a specific niche — if you need a metadata-driven organizer with tagging, filtering, and scene detection, it does that well. For general video streaming to multiple devices, use [Jellyfin](/apps/jellyfin) or [Plex](/apps/plex). For music, use [Navidrome](/apps/navidrome).

## FAQ

### Does Stash transcode video for streaming?

Stash can transcode on the fly for browser playback, but it's not a full media server like Jellyfin or Plex. It generates preview clips during scanning but primarily serves original files. For multi-device streaming with transcoding, use a dedicated media server.

### Can multiple users access Stash?

Stash has basic authentication (single username/password) but no multi-user system with separate libraries or permissions. It's designed as a single-user application.

### What video formats are supported?

Stash supports any format FFmpeg can handle — MP4, MKV, AVI, MOV, WMV, FLV, WebM, and more. The Docker image ships with FFmpeg pre-installed.

### How does Stash detect scenes and generate chapters?

Stash uses FFmpeg to analyze video files and generate sprite sheets (thumbnail grids) for timeline scrubbing. Scene markers are user-created bookmarks at specific timestamps — they're not auto-detected.

### Can I run Stash alongside Jellyfin?

Yes. Stash and Jellyfin serve different purposes and can point to the same media directory. Stash provides metadata scraping and organization; Jellyfin provides streaming with transcoding and multi-user support.

## Related

- [How to Self-Host Jellyfin](/apps/jellyfin)
- [How to Self-Host Plex](/apps/plex)
- [How to Self-Host Emby](/apps/emby)
- [Jellyfin vs Plex](/compare/jellyfin-vs-plex)
- [Best Self-Hosted Media Servers](/best/media-servers)
- [Self-Hosted Netflix Alternatives](/replace/netflix)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
- [Backup Strategy](/foundations/backup-strategy)
