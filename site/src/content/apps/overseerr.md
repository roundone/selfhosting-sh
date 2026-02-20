---
title: "How to Self-Host Overseerr with Docker"
description: "Set up Overseerr with Docker Compose for Plex media requests. Note: project archived — use Jellyseerr instead for active development."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "download-management"
apps:
  - overseerr
tags:
  - self-hosted
  - overseerr
  - docker
  - plex
  - media-requests
  - deprecated
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

> **Overseerr is archived and no longer maintained.** The GitHub repository was archived in 2024. No new features, bug fixes, or security patches will be released. Use [Jellyseerr](/apps/jellyseerr) instead — it's the actively developed fork that adds Jellyfin and Emby support while maintaining full Plex compatibility. See our [Overseerr vs Jellyseerr comparison](/compare/overseerr-vs-jellyseerr) for details.

## What Is Overseerr?

Overseerr is a media request management tool for Plex. It provides a clean interface for users to browse and request movies and TV shows, which are then sent to Sonarr and Radarr for downloading. While Overseerr's development has stopped, it remains functional and many installations are still running. [GitHub (archived)](https://github.com/sctx/overseerr)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of free disk space
- 512 MB of RAM (minimum)
- A running Plex Media Server
- Sonarr and/or Radarr for automated downloads

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  overseerr:
    image: lscr.io/linuxserver/overseerr:1.33.2
    container_name: overseerr
    environment:
      - PUID=1000                   # User ID for file permissions
      - PGID=1000                   # Group ID for file permissions
      - TZ=America/New_York         # Your timezone
    ports:
      - "5055:5055"                 # Web UI
    volumes:
      - overseerr-config:/config    # Configuration and database
    restart: unless-stopped

volumes:
  overseerr-config:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server:5055` in your browser
2. Sign in with your Plex account
3. Select your Plex server
4. Overseerr syncs your existing Plex library
5. Configure Sonarr/Radarr connections under **Settings → Services**
6. Set up user access permissions

## Configuration

Configuration is identical to [Jellyseerr](/apps/jellyseerr) — the fork maintained the same settings interface. Refer to the Jellyseerr guide for detailed configuration.

Key settings:

- **Settings → Services:** Add Sonarr (port 8989) and Radarr (port 7878) with their API keys
- **Settings → Users:** Configure auto-approval rules, request quotas, and permissions
- **Settings → Notifications:** Set up Discord, Slack, email, or webhook notifications

## Reverse Proxy

Overseerr works behind a reverse proxy on port 5055. Enable WebSocket support for real-time updates.

For more options, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

```bash
docker compose stop overseerr
tar -czf overseerr-backup-$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/overseerr-config/
docker compose start overseerr
```

See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Should I migrate to Jellyseerr?

**Yes.** Overseerr won't receive security patches. [Jellyseerr](/apps/jellyseerr) imports Overseerr's database — migration preserves your request history and user accounts.

### Overseerr can't connect to Plex

**Symptom:** "Could not connect to Plex server" after Plex update.
**Fix:** Re-authenticate your Plex account under Settings. Since Overseerr is archived, compatibility with future Plex API changes is not guaranteed.

## Resource Requirements

- **RAM:** ~150-200 MB idle
- **CPU:** Low
- **Disk:** ~200 MB for application

## Verdict

**Do not install Overseerr for new deployments.** Use [Jellyseerr](/apps/jellyseerr) instead. This guide exists because Overseerr remains a common search term and many existing installations are still running. If you're currently running Overseerr, plan a migration to Jellyseerr — it's a straightforward database import.

## Related

- [Overseerr vs Jellyseerr](/compare/overseerr-vs-jellyseerr)
- [How to Self-Host Jellyseerr](/apps/jellyseerr)
- [How to Self-Host Sonarr](/apps/sonarr)
- [How to Self-Host Radarr](/apps/radarr)
- [How to Self-Host Plex](/apps/plex)
- [Jellyfin vs Plex](/compare/jellyfin-vs-plex)
- [Best Self-Hosted Download Management](/best/download-management)
