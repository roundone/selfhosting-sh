---
title: "How to Self-Host NZBGet with Docker Compose"
description: "Set up NZBGet with Docker Compose for Usenet downloading. Configuration, integration with Sonarr and Radarr, and optimization tips."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "download-management"
apps:
  - nzbget
tags:
  - self-hosted
  - nzbget
  - docker
  - usenet
  - arr-stack
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is NZBGet?

NZBGet is a Usenet downloader optimized for performance. It downloads NZB files from Usenet providers, unpacks them, and integrates with Sonarr and Radarr for automated media management. Written in C++, it's one of the fastest and most resource-efficient Usenet clients available. [Official site](https://nzbget.com/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 1 GB of free disk space (plus download storage)
- 256 MB of RAM (minimum)
- A Usenet provider subscription
- A Usenet indexer (or [Prowlarr](/apps/prowlarr/) for indexer management)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  nzbget:
    image: lscr.io/linuxserver/nzbget:24.8
    container_name: nzbget
    environment:
      - PUID=1000                   # User ID for file permissions
      - PGID=1000                   # Group ID for file permissions
      - TZ=America/New_York         # Your timezone
      - NZBOP_TEMPDIR=/downloads/incomplete  # Temp directory for active downloads
    ports:
      - "6789:6789"                 # Web UI
    volumes:
      - nzbget-config:/config       # Configuration and logs
      - /path/to/downloads:/downloads   # Download destination
    restart: unless-stopped

volumes:
  nzbget-config:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server:6789` in your browser
2. Default credentials: **nzbget** / **tegbzn6789**
3. **Change the password immediately** under **Settings → Security**
4. Configure your Usenet provider under **Settings → News-Servers**:
   - **Host:** Your provider's server (e.g., `news.your-provider.com`)
   - **Port:** 563 (SSL) or 119 (plain)
   - **Encryption:** Yes (use SSL)
   - **Username/Password:** Your Usenet account credentials
   - **Connections:** Check your provider's limit (typically 20-50)
5. Set download paths under **Settings → Paths**:
   - **MainDir:** `/downloads`
   - **TempDir:** `/downloads/incomplete`
   - **DestDir:** `/downloads/complete`

## Configuration

### Usenet Provider Settings

Under **Settings → News-Servers**, add your providers:

- **Primary provider:** Unlimited accounts (Newshosting, Eweka, UsenetExpress)
- **Fill/backup provider (optional):** Block accounts (Tweaknews, Blocknews) for articles missing from primary

Configure retention priority: primary server first, backup servers as fallback.

### Category Setup

Categories sort downloads into directories. Under **Settings → Categories**:

| Category | DestDir | Used By |
|----------|---------|---------|
| Movies | `/downloads/complete/movies` | Radarr |
| Series | `/downloads/complete/tv` | Sonarr |
| Music | `/downloads/complete/music` | Lidarr |
| Books | `/downloads/complete/books` | Readarr |

### Integration with Sonarr/Radarr

In Sonarr or Radarr, add NZBGet as a download client:

1. Go to **Settings → Download Clients → +**
2. Select **NZBGet**
3. **Host:** `nzbget` (container name) or your server IP
4. **Port:** 6789
5. **Username/Password:** Your NZBGet credentials
6. **Category:** `Series` (Sonarr) or `Movies` (Radarr)
7. Test the connection

### Performance Tuning

Under **Settings → Download**:

- **ArticleCache:** Set to 250-500 MB for better write performance (reduces disk I/O by batching writes)
- **DirectWrite:** Enable for SSDs, disable for HDDs
- **WriteBuffer:** 1024 KB for HDDs, 0 for SSDs with DirectWrite

Under **Settings → Connection**:

- **Connections per server:** Match your provider's limit
- **CrcCheck:** Keep enabled to verify article integrity

## Advanced Configuration (Optional)

### Running with Sonarr and Radarr on the same network

```yaml
services:
  nzbget:
    image: lscr.io/linuxserver/nzbget:24.8
    container_name: nzbget
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
    ports:
      - "6789:6789"
    volumes:
      - nzbget-config:/config
      - /path/to/downloads:/downloads
    networks:
      - arr-network
    restart: unless-stopped

networks:
  arr-network:
    external: true

volumes:
  nzbget-config:
```

### Post-Processing Scripts

NZBGet supports post-processing scripts for notifications, cleanup, and integration:

- **Extension Manager:** Built-in extension manager in v24+ for installing scripts
- **Scripts directory:** Mount a scripts volume at `/config/scripts`
- Configure under **Settings → Extension Manager**

## Reverse Proxy

NZBGet works behind a reverse proxy on port 6789. For more options, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

## Backup

Back up the config volume:

```bash
docker compose stop nzbget
tar -czf nzbget-backup-$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/nzbget-config/
docker compose start nzbget
```

The config directory contains settings and download history. See [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Downloads failing with "article not found"

**Symptom:** Downloads fail with missing articles.
**Fix:** This usually means the articles have been removed (DMCA takedown) or are outside your provider's retention. Add a backup/fill server with different retention. Enable **Settings → News-Servers → Backup** on your secondary provider.

### Slow download speeds

**Symptom:** Not hitting your connection's maximum speed.
**Fix:** Increase connections (up to provider limit). Enable SSL (port 563). Check **ArticleCache** — set to at least 250 MB. If on a slow disk, enable **DirectWrite** and increase **WriteBuffer**.

### Permission denied errors on downloads

**Symptom:** NZBGet downloads but Sonarr/Radarr can't move files.
**Fix:** Ensure PUID/PGID match across all containers. NZBGet, Sonarr, and Radarr must run as the same user/group to access shared download directories.

## Resource Requirements

- **RAM:** ~100-250 MB idle, ~300-500 MB while downloading (depends on ArticleCache)
- **CPU:** Low-moderate (unpacking is CPU-intensive, downloading is not)
- **Disk:** Application ~100 MB, plus space for downloads and temporary files

## Verdict

NZBGet is the performance-oriented choice for Usenet downloading. It's faster and lighter than SABnzbd while providing all the features needed for a complete *arr stack integration. The C++ codebase makes it significantly faster at unpacking large archives.

If you use Usenet, NZBGet plus [Prowlarr](/apps/prowlarr/) plus [Sonarr](/apps/sonarr/)/[Radarr](/apps/radarr/) is a proven automation stack.

## FAQ

### NZBGet vs SABnzbd?

NZBGet is faster (C++ vs Python) and uses less RAM. SABnzbd has a more polished web UI. For *arr stack integration, both work equally well. Choose NZBGet if performance matters, SABnzbd if you prefer the UI.

### Do I need both NZBGet and qBittorrent?

Only if you use both Usenet and torrents. Many people run both — NZBGet for Usenet and [qBittorrent](/apps/qbittorrent/) for torrents — to maximize download availability.

### Is NZBGet still maintained?

Yes. NZBGet was briefly abandoned in 2023 but was forked and revived. The current maintainers release regular updates.

## Related

- [How to Self-Host Sonarr](/apps/sonarr/)
- [How to Self-Host Radarr](/apps/radarr/)
- [How to Self-Host Prowlarr](/apps/prowlarr/)
- [Prowlarr vs Jackett](/compare/prowlarr-vs-jackett/)
- [How to Self-Host qBittorrent](/apps/qbittorrent/)
- [How to Self-Host SABnzbd](/apps/sabnzbd/)
- [Best Self-Hosted Download Management](/best/download-management/)
