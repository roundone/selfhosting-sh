---
title: "How to Self-Host Audiobookshelf with Docker"
description: "Step-by-step guide to self-hosting Audiobookshelf with Docker Compose — manage and stream your audiobook and podcast library from any device."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "media-servers"
apps:
  - audiobookshelf
tags: ["self-hosted", "audiobookshelf", "audiobooks", "podcasts", "docker", "audible-alternative"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Audiobookshelf?

[Audiobookshelf](https://www.audiobookshelf.org/) is a self-hosted audiobook and podcast server. It streams your audiobook collection to native Android and iOS apps, tracks listening progress across devices, automatically fetches metadata and cover art from Audible and other providers, and manages podcast subscriptions with automatic episode downloads. It's the best self-hosted alternative to Audible for people who own audiobook files.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 1 GB RAM minimum
- Disk space for your audiobook/podcast library
- A domain name (optional, for remote access)

## Docker Compose Configuration

Audiobookshelf runs as a single container with an embedded SQLite database. No external database or cache is needed.

Create a project directory:

```bash
mkdir -p /opt/audiobookshelf && cd /opt/audiobookshelf
```

Create a `docker-compose.yml`:

```yaml
services:
  audiobookshelf:
    image: ghcr.io/advplyr/audiobookshelf:2.32.1
    container_name: audiobookshelf
    ports:
      # Web UI — internal port 80 mapped to 13378 on the host
      - "13378:80"
    volumes:
      # Your audiobook library directory
      - /path/to/audiobooks:/audiobooks
      # Your podcast library directory
      - /path/to/podcasts:/podcasts
      # Application config and SQLite database
      # IMPORTANT: Must be on a local filesystem (not NFS/SMB) since v2.3.x
      - /opt/audiobookshelf/config:/config
      # Metadata cache, covers, streams, backups, and logs
      - /opt/audiobookshelf/metadata:/metadata
    environment:
      # Timezone — https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
      - TZ=Etc/UTC
    restart: unless-stopped
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server:13378` in a browser
2. Create your admin account — there are no default credentials; you set them on first launch
3. Click **Add Library** in the sidebar:
   - Set the library type to **Audiobook** or **Podcast**
   - Set the folder path to `/audiobooks` or `/podcasts` (the container paths)
   - Choose your preferred metadata provider (Audible is recommended for audiobooks)
4. Audiobookshelf scans the library and fetches metadata, cover art, and descriptions automatically
5. Install the mobile app (iOS or Android) and connect using your server URL

## Configuration

### Library Organization

Audiobookshelf expects a specific directory structure for best results:

```
/audiobooks/
  Author Name/
    Book Title/
      audiofile.m4b
  Author Name/
    Series Name/
      Book 1/
        audiofile.mp3
```

Single-file audiobooks (`.m4b`) are ideal. Multi-file audiobooks (multiple `.mp3` files in one folder) are supported — Audiobookshelf merges them into a single listening experience.

### Podcast Management

Add podcast feeds through the web UI. Audiobookshelf downloads episodes automatically based on your settings:

- **Auto-download new episodes** — enable per podcast
- **Download schedule** — customize the check interval
- **Max episodes to keep** — automatically remove old episodes

### Mobile App

Install the [Audiobookshelf app](https://www.audiobookshelf.org/docs#mobile-apps) for iOS or Android. Features include:

- Stream or download audiobooks for offline listening
- Automatic progress sync across devices
- Sleep timer
- Playback speed adjustment
- Chapter navigation

Connect the app to your server using `http://your-server:13378` (or your domain with HTTPS).

### Multiple Libraries

You can create multiple libraries (e.g., Fiction, Non-Fiction, Kids, Podcasts). Each library maps to a different host directory. Add volume mounts for each:

```yaml
    volumes:
      - /mnt/fiction:/fiction
      - /mnt/nonfiction:/nonfiction
      - /mnt/kids-audiobooks:/kids
```

**Volume paths must be separate directories, not nested within each other.**

## Advanced Configuration

### Reverse Proxy with WebSocket Support

Audiobookshelf **requires WebSocket connections** for real-time sync and playback tracking. Your reverse proxy must explicitly support WebSockets.

#### Nginx Proxy Manager

- **Scheme:** `http`
- **Forward Hostname:** `your-server-ip`
- **Forward Port:** `13378`
- Enable **WebSockets Support** (toggle in the proxy host settings)
- Enable SSL with Let's Encrypt

#### Caddy

```
audiobooks.yourdomain.com {
    reverse_proxy localhost:13378
}
```

Caddy supports WebSockets by default — no extra configuration needed.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for detailed instructions.

### Running on a Subfolder

If you need to run Audiobookshelf behind a reverse proxy on a subfolder, the path must be exactly `/audiobookshelf`. This is hardcoded and not configurable.

### Security Settings

Optional environment variables for hardening:

```yaml
    environment:
      - TZ=Etc/UTC
      # Rate limit auth attempts (default: 40 per 10 minutes)
      - RATE_LIMIT_AUTH_MAX=40
      - RATE_LIMIT_AUTH_WINDOW=600000
      # Token expiry (seconds)
      - ACCESS_TOKEN_EXPIRY=3600
      - REFRESH_TOKEN_EXPIRY=2592000
```

## Backup

Audiobookshelf includes a built-in backup feature accessible from **Settings** → **Backups**. These backups include the database and library metadata.

Manual backup of critical data:

- **Config directory:** `/opt/audiobookshelf/config` — contains the SQLite database (users, books, progress, settings)
- **Metadata directory:** `/opt/audiobookshelf/metadata` — contains covers, cache, and server backups
- **Audiobook files:** Your audiobook/podcast library directories

```bash
# Back up the database and metadata
tar czf audiobookshelf-backup-$(date +%Y%m%d).tar.gz /opt/audiobookshelf/config /opt/audiobookshelf/metadata
```

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a comprehensive backup approach.

## Troubleshooting

### Books not appearing after scan

**Symptom:** Library scan completes but books are missing.
**Fix:** Check the directory structure. Audiobookshelf expects each audiobook in its own folder. Loose audio files in the root of the library directory are not detected. Verify the container can read the files: `docker compose exec audiobookshelf ls /audiobooks/`

### Progress not syncing between devices

**Symptom:** Listening position resets or differs between devices.
**Fix:** Ensure WebSocket connections are working. If behind a reverse proxy, verify WebSocket support is enabled. Check the browser console for WebSocket connection errors. Without WebSockets, real-time sync fails silently.

### Config directory on network storage causes crashes

**Symptom:** Container crashes with database errors or "SQLITE_BUSY" errors.
**Fix:** Since v2.3.x, the config directory (which holds the SQLite database) **must be on a local filesystem**. NFS and SMB mounts cause SQLite locking issues. Move `/config` to a local path.

### Mobile app can't connect

**Symptom:** The app shows "Unable to connect" or times out.
**Fix:** Ensure the server URL includes the port (`http://your-server:13378`). For remote access outside your LAN, set up a reverse proxy with SSL or use a VPN like [Tailscale](/apps/tailscale/). Check that port 13378 is not blocked by your firewall.

### Metadata not found for some books

**Symptom:** Cover art and descriptions missing for certain audiobooks.
**Fix:** Audiobookshelf matches against Audible and other providers by title and author. If the folder or filename doesn't include the correct title and author, matching fails. Rename the folder to match the exact title. You can also manually search and match metadata from the book's detail page.

## Resource Requirements

- **RAM:** ~150 MB idle, 300-500 MB during library scanning
- **CPU:** Low. Audiobookshelf doesn't transcode audio — it streams files directly.
- **Disk:** Minimal for the application (~100 MB). Metadata cache grows based on library size. Your audiobook library is the main storage requirement.

## Verdict

Audiobookshelf is the best self-hosted audiobook server available. The mobile apps are excellent — progress sync works seamlessly, the UI is clean, and the listening experience rivals Audible. Podcast management is a nice bonus if you want to consolidate media servers.

Setup is trivially simple (single container, no database), metadata fetching is reliable, and the developer is actively maintaining the project. If you have a collection of audiobook files, Audiobookshelf is the clear choice. There's no real competitor in the self-hosted audiobook space.

## FAQ

### What audio formats does Audiobookshelf support?

MP3, M4B, M4A, FLAC, OGG, WMA, AAC, and OPUS. M4B is the ideal format for audiobooks because it supports chapters natively. Multi-file MP3 audiobooks are also handled well — Audiobookshelf merges them into a single book.

### Can I import from Audible?

Audiobookshelf doesn't directly import from Audible. However, tools like [OpenAudible](https://openaudible.org/) can download and convert your Audible library to M4B files. Place the converted files in your library directory and Audiobookshelf picks them up.

### Does it support multiple users?

Yes. Create user accounts under **Settings** → **Users**. Each user gets their own listening progress, bookmarks, and library access permissions. Useful for families sharing a server.

### Can I stream over the internet?

Yes. Set up a reverse proxy with SSL for secure remote access, or use [Tailscale](/apps/tailscale/) for a VPN-based approach. The mobile apps work over any network connection once the server is reachable.

### How does it compare to Plex for audiobooks?

Plex treats audiobooks as music, which creates problems — no chapter support, no progress tracking per book, and poor metadata matching. Audiobookshelf is purpose-built for audiobooks with proper chapter navigation, book-level progress tracking, and Audible metadata integration. Use Audiobookshelf for audiobooks and [Jellyfin](/apps/jellyfin/) or [Plex](/apps/plex/) for video.

## Related

- [Self-Hosted Audible Alternatives](/replace/audible/)
- [How to Self-Host Jellyfin](/apps/jellyfin/)
- [How to Self-Host Navidrome](/apps/navidrome/)
- [Best Self-Hosted Media Servers](/best/media-servers/)
- [Self-Hosted Spotify Alternatives](/replace/spotify/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
