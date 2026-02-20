---
title: "How to Self-Host Jellyseerr with Docker"
description: "Set up Jellyseerr with Docker Compose for media request management. Works with Jellyfin, Plex, and Emby plus Sonarr and Radarr."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "download-management"
apps:
  - jellyseerr
tags:
  - self-hosted
  - jellyseerr
  - docker
  - media-requests
  - arr-stack
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Jellyseerr?

Jellyseerr is a media request management tool that gives your users a polished interface to browse and request movies and TV shows. It integrates with Jellyfin, Plex, and Emby for library awareness, and with Sonarr and Radarr for automated downloading. It's the actively maintained fork of Overseerr, which was archived in 2024. [Official site](https://github.com/Fallenbagel/jellyseerr)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of free disk space
- 512 MB of RAM (minimum)
- A running media server (Jellyfin, Plex, or Emby)
- Sonarr and/or Radarr running for automated downloads

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  jellyseerr:
    image: fallenbagel/jellyseerr:2.5.0
    container_name: jellyseerr
    environment:
      - TZ=America/New_York         # Your timezone
      - LOG_LEVEL=info              # Options: debug, info, warn, error
    ports:
      - "5055:5055"                 # Web UI
    volumes:
      - jellyseerr-config:/app/config  # Configuration and database
    restart: unless-stopped

volumes:
  jellyseerr-config:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server:5055` in your browser
2. Choose your media server type: **Jellyfin**, **Plex**, or **Emby**
3. For **Jellyfin**: Enter your Jellyfin server URL (e.g., `http://jellyfin:8096` if on the same Docker network) and sign in with an admin account
4. For **Plex**: Sign in with your Plex account and select your server
5. Jellyseerr will sync your existing library — this can take a few minutes for large libraries
6. Configure Sonarr and Radarr connections under **Settings → Services**:
   - Add your Sonarr URL (e.g., `http://sonarr:8989`)
   - Add the API key from Sonarr's **Settings → General**
   - Select quality profiles and root folders
   - Repeat for Radarr (default port 7878)
7. Configure user access under **Settings → Users**

## Configuration

### Connecting to Sonarr/Radarr

Under **Settings → Services**, add each *arr app:

- **Hostname/IP:** Use the Docker service name if on the same network (e.g., `sonarr`), or the host IP with port
- **Port:** 8989 (Sonarr), 7878 (Radarr)
- **API Key:** Found in each app's Settings → General
- **Quality Profile:** Select the default profile for new requests
- **Root Folder:** Where media files are stored

You can add multiple Sonarr/Radarr instances — useful for separating 4K and 1080p libraries.

### User Permissions

Jellyseerr supports granular user permissions:

- **Auto-approve movies/TV** — skip the approval queue
- **Request limits** — quota per user per week
- **Advanced requests** — let users pick quality profiles
- **Manage issues** — allow users to report problems

### Notifications

Under **Settings → Notifications**, configure alerts for:

- Discord webhooks
- Slack
- Email (SMTP)
- Telegram
- Pushover
- Gotify
- Webhook (custom)

## Advanced Configuration (Optional)

### Running on the same Docker network as your stack

For direct container-to-container communication, add Jellyseerr to your *arr stack network:

```yaml
services:
  jellyseerr:
    image: fallenbagel/jellyseerr:2.5.0
    container_name: jellyseerr
    environment:
      - TZ=America/New_York
    ports:
      - "5055:5055"
    volumes:
      - jellyseerr-config:/app/config
    networks:
      - arr-network
    restart: unless-stopped

networks:
  arr-network:
    external: true

volumes:
  jellyseerr-config:
```

This lets you reference Sonarr, Radarr, and Jellyfin by container name instead of IP address.

### Custom CSS

Jellyseerr supports custom CSS for theming. Add custom styles under **Settings → General → Custom CSS**.

## Reverse Proxy

Jellyseerr works behind a reverse proxy. Use the internal port 5055. Example Nginx Proxy Manager config:

- **Scheme:** http
- **Forward Hostname/IP:** jellyseerr (or your server IP)
- **Forward Port:** 5055
- **WebSocket support:** Enable (required for real-time updates)

For more reverse proxy options, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Back up the config volume, which contains the SQLite database and all settings:

```bash
docker compose stop jellyseerr
tar -czf jellyseerr-backup-$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/jellyseerr-config/
docker compose start jellyseerr
```

For named volumes, use `docker run --rm -v jellyseerr-config:/data -v $(pwd):/backup alpine tar -czf /backup/jellyseerr-backup.tar.gz /data`.

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a complete approach.

## Troubleshooting

### Library not syncing

**Symptom:** Jellyseerr shows 0 items in your library after setup.
**Fix:** Go to **Settings → [Your media server]** and click **Sync Libraries**. Ensure the correct libraries are checked. If using Jellyfin, verify the admin account has access to all libraries.

### Requests not being sent to Sonarr/Radarr

**Symptom:** Requests show as "pending" but nothing appears in Sonarr/Radarr.
**Fix:** Check the API key and URL under **Settings → Services**. Test the connection. If using Docker networking, ensure both containers are on the same network. Check Jellyseerr logs: `docker logs jellyseerr`.

### "Unable to connect" errors

**Symptom:** Jellyseerr can't reach your media server or *arr apps.
**Fix:** If using container names, verify all services are on the same Docker network. If using IP addresses, use the host's IP (not `localhost` or `127.0.0.1`, which refer to the Jellyseerr container itself).

### Users can't see the request page

**Symptom:** Users see a blank page or permission denied.
**Fix:** Check user permissions under **Settings → Users**. New users may need to be imported from your media server first. For Jellyfin, users must exist in Jellyfin before they can sign into Jellyseerr.

## Resource Requirements

- **RAM:** ~100-200 MB idle, ~300 MB under load (large library sync)
- **CPU:** Low — minimal processing outside of library syncs
- **Disk:** ~200 MB for application, database grows with request history

## Verdict

Jellyseerr is the best media request management tool available. It provides a clean, user-friendly interface that makes sharing your media server with family and friends painless. The Sonarr/Radarr integration means requests automatically turn into downloads with zero manual intervention.

If you run Jellyfin, Jellyseerr is your only good option — Overseerr never supported Jellyfin and is now archived. For Plex users, Jellyseerr is also the right choice since it's the actively maintained successor.

## FAQ

### Does Jellyseerr replace Overseerr?

Yes. Overseerr is archived and no longer maintained. Jellyseerr is the actively developed fork with the same features plus Jellyfin and Emby support.

### Can I use Jellyseerr with Plex?

Yes. Jellyseerr supports Plex, Jellyfin, and Emby. You don't need Jellyfin to use it.

### Does Jellyseerr require Sonarr and Radarr?

Technically you can run it standalone as a media discovery/request tracker, but the main value is automated downloading through Sonarr (TV) and Radarr (movies). Without them, you'd have to manually fulfill requests.

## Related

- [Overseerr vs Jellyseerr](/compare/overseerr-vs-jellyseerr)
- [How to Self-Host Sonarr](/apps/sonarr)
- [How to Self-Host Radarr](/apps/radarr)
- [How to Self-Host Jellyfin](/apps/jellyfin)
- [Prowlarr vs Jackett](/compare/prowlarr-vs-jackett)
- [Sonarr vs Radarr](/compare/sonarr-vs-radarr)
- [Jellyfin vs Plex](/compare/jellyfin-vs-plex)
- [Best Self-Hosted Download Management](/best/download-management)
