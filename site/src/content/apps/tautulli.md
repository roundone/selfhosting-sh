---
title: "How to Self-Host Tautulli with Docker"
description: "Set up Tautulli with Docker Compose for Plex media server monitoring. Track viewing history, get notifications, and monitor server health."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "download-management"
apps:
  - tautulli
tags:
  - self-hosted
  - tautulli
  - docker
  - plex
  - monitoring
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Tautulli?

Tautulli is a monitoring and tracking tool for Plex Media Server. It shows you who's watching what, viewing history, server statistics, and library analytics. It can also send notifications when users start streaming, when new content is added, or when your server has issues. [Official site](https://tautulli.com/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 500 MB of free disk space
- 256 MB of RAM (minimum)
- A running Plex Media Server

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  tautulli:
    image: lscr.io/linuxserver/tautulli:2.15.2
    container_name: tautulli
    environment:
      - PUID=1000                   # User ID for file permissions
      - PGID=1000                   # Group ID for file permissions
      - TZ=America/New_York         # Your timezone
    ports:
      - "8181:8181"                 # Web UI
    volumes:
      - tautulli-config:/config     # Configuration and database
    restart: unless-stopped

volumes:
  tautulli-config:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server:8181` in your browser
2. Follow the setup wizard
3. **Connect to Plex:** Enter your Plex server URL (e.g., `http://plex-ip:32400`) and your Plex authentication token
4. To get your Plex token: In Plex Web, open any media item → Get Info → View XML → look for `X-Plex-Token` in the URL
5. Tautulli will start syncing viewing history — historical data import can take a while for large libraries

## Configuration

### Getting Your Plex Token

The easiest method:

1. Sign in to [plex.tv/claim](https://www.plex.tv/claim/) (not used here, but helpful)
2. In Plex Web UI, open a browser developer tools (F12)
3. Go to any media item page
4. In the Network tab, find a request to your Plex server
5. Look for the `X-Plex-Token` parameter in the URL

Or use the Plex API:

```bash
curl -X POST 'https://plex.tv/users/sign_in.json' \
  -H 'X-Plex-Client-Identifier: tautulli' \
  -d 'user[login]=YOUR_PLEX_EMAIL&user[password]=YOUR_PLEX_PASSWORD'
```

### Notifications

Tautulli supports 20+ notification agents:

- **Discord** — webhook URL
- **Telegram** — bot token + chat ID
- **Email** — SMTP settings
- **Slack** — webhook URL
- **Pushover/Pushbullet** — API keys
- **Gotify** — server URL + app token
- **Webhook** — custom HTTP requests

Configure under **Settings → Notification Agents**. Each agent supports customizable triggers:

- Playback start/stop/pause/resume
- New content added to library
- Server down/up
- Plex updates available
- Concurrent stream limit reached

### Newsletter

Tautulli can generate HTML newsletters showing recently added content. Configure under **Settings → Newsletters**. Send via email or Discord.

## Advanced Configuration (Optional)

### Accessing Plex on the same Docker network

If Plex runs in Docker, add Tautulli to the same network:

```yaml
services:
  tautulli:
    image: lscr.io/linuxserver/tautulli:2.15.2
    container_name: tautulli
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
    ports:
      - "8181:8181"
    volumes:
      - tautulli-config:/config
    networks:
      - media-network
    restart: unless-stopped

networks:
  media-network:
    external: true

volumes:
  tautulli-config:
```

Use `http://plex:32400` as the Plex URL in Tautulli settings.

### Custom Scripts

Tautulli can run custom scripts on events. Under **Settings → Notification Agents → Script**, configure:

- **Script folder:** Mount a volume with your scripts
- **Triggers:** Same as notifications (playback start, new content, etc.)
- **Arguments:** Tautulli passes media metadata as script arguments

Common use cases: auto-kill transcodes over a certain quality, notify specific users about new content in their favorite genres, track bandwidth usage.

## Reverse Proxy

Tautulli works behind a reverse proxy on port 8181. Enable **Settings → Web Interface → HTTP Root** if hosting under a subpath.

For more reverse proxy options, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

## Backup

Back up the config volume:

```bash
docker compose stop tautulli
tar -czf tautulli-backup-$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/tautulli-config/
docker compose start tautulli
```

The config directory contains the SQLite database with all viewing history. Losing this means losing your statistics.

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a complete approach.

## Troubleshooting

### Tautulli not connecting to Plex

**Symptom:** "Could not connect to Plex server" error.
**Fix:** Verify your Plex URL and token. If both are in Docker, ensure they share a network. Test with `curl http://plex-ip:32400/identity` from inside the Tautulli container.

### Viewing history not showing

**Symptom:** Dashboard shows no activity, but Plex is actively being used.
**Fix:** Check that the Plex token hasn't expired. Re-authenticate under **Settings → Plex Media Server**. Also check that Tautulli's IP is allowed in Plex's **Settings → Network → List of IP addresses and networks that are allowed without auth**.

### High CPU usage during initial sync

**Symptom:** CPU spikes when first connecting to Plex.
**Fix:** This is normal during the initial history import. Let it complete. For servers with years of history, this can take 30-60 minutes. CPU usage drops to near zero after sync.

## Resource Requirements

- **RAM:** ~80-150 MB idle, ~200 MB during sync
- **CPU:** Very low — near zero during normal operation
- **Disk:** ~100 MB for application, database grows with history (typically 50-200 MB for years of data)

## Verdict

Tautulli is essential if you run Plex. It answers questions Plex can't: who's watching the most, which libraries get the most use, when your server is busiest, and whether specific media is actually worth keeping. The notification system is flexible enough to automate almost any Plex-related alert.

The only catch: Tautulli only works with Plex. If you use Jellyfin, look at Jellystat or the built-in Jellyfin dashboard instead.

## FAQ

### Does Tautulli work with Jellyfin?

No. Tautulli is Plex-only. For Jellyfin monitoring, check out Jellystat or the built-in Jellyfin Playback Reporting Plugin.

### Does Tautulli affect Plex performance?

No. Tautulli reads data from Plex's API — it doesn't modify anything or intercept streams. The impact on Plex is negligible.

### Can I see what was watched before installing Tautulli?

Yes. During initial setup, Tautulli imports Plex's built-in viewing history. The depth depends on Plex's `X-Plex-Container-Size` and how much history Plex retains.

## Related

- [How to Self-Host Plex](/apps/plex/)
- [Jellyfin vs Plex](/compare/jellyfin-vs-plex/)
- [How to Self-Host Sonarr](/apps/sonarr/)
- [How to Self-Host Radarr](/apps/radarr/)
- [How to Self-Host Jellyseerr](/apps/jellyseerr/)
- [Overseerr vs Jellyseerr](/compare/overseerr-vs-jellyseerr/)
- [Best Self-Hosted Media Servers](/best/media-servers/)
- [Best Self-Hosted Download Management](/best/download-management/)
