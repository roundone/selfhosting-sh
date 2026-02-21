---
title: "How to Self-Host Homarr with Docker Compose"
description: "Deploy Homarr with Docker Compose — a modern self-hosted dashboard to manage and monitor your home server applications."
date: 2026-02-16
dateUpdated: 2026-02-19
category: "dashboards"
apps:
  - homarr
tags:
  - self-hosted
  - homarr
  - docker
  - dashboard
  - homepage
  - home-server
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Homarr?

[Homarr](https://homarr.dev/) is a self-hosted dashboard for your home server. It gives you a single page to access all your services, monitor their status, and manage integrations. Homarr has a modern drag-and-drop UI, deep integrations with Docker, *arr apps (Sonarr, Radarr, etc.), torrent clients, and media servers. It supports widgets for weather, RSS, calendar, system stats, and more. Think of it as a customizable homepage that's also a lightweight monitoring panel.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 256 MB of free RAM
- 500 MB of free disk space
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  homarr:
    image: ghcr.io/homarr-labs/homarr:v1.53.1
    container_name: homarr
    restart: unless-stopped
    ports:
      - "7575:7575"
    environment:
      TZ: "America/New_York"               # Your timezone
      SECRET_ENCRYPTION_KEY: ""            # CHANGE THIS — must be a 64-char hex string. Generate with: openssl rand -hex 32
    volumes:
      - ./homarr/appdata:/appdata
      - /var/run/docker.sock:/var/run/docker.sock:ro    # Optional: Docker integration
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:7575/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  homarr_appdata:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:7575` in your browser
2. Create your admin account
3. Start adding apps to your dashboard:
   - Click **+** to add a new app
   - Enter the app name, URL, and select an icon
   - Drag to rearrange

## Configuration

### Adding Apps

For each self-hosted service:
1. Click the **+** button
2. Fill in:
   - **Name:** Display name
   - **URL (Internal):** Docker network URL (e.g., `http://jellyfin:8096`)
   - **URL (External):** Public-facing URL
   - **Icon:** Search built-in icons or use a URL
3. Save and drag to position

### Docker Integration

Mounting the Docker socket enables:
- Automatic container discovery
- Container status monitoring (running, stopped, health)
- Start/stop/restart containers from the dashboard

**Security note:** Docker socket access grants root-equivalent access. Only expose it on trusted networks.

### Widgets

Homarr includes built-in widgets:
- **System Info:** CPU, RAM, disk usage
- **Weather:** Current conditions and forecast
- **RSS:** Feed reader widget
- **Calendar:** iCal/CalDAV integration
- **Media Requests:** Overseerr/Jellyseerr integration
- **Torrent:** qBittorrent/Transmission status
- ***Arr:** Sonarr/Radarr queue and activity

### Integrations

Homarr has deep integrations with:
- **Media:** Jellyfin, Plex, Emby, Overseerr
- **Downloads:** qBittorrent, Transmission, SABnzbd, NZBGet
- **Management:** Sonarr, Radarr, Lidarr, Readarr, Prowlarr
- **DNS:** Pi-hole, AdGuard Home
- **Monitoring:** Uptime Kuma

Configure under **Settings → Integrations**.

## Advanced Configuration (Optional)

### Multiple Boards

Create different dashboard layouts for different use cases (e.g., a "Media" board, a "Networking" board).

### Authentication

Homarr supports:
- Built-in user management (default)
- LDAP/Active Directory
- OIDC (Keycloak, Authentik, etc.)

Configure under **Settings → Authentication**.

### Custom CSS

Apply custom styling under **Settings → Customization → Custom CSS**.

## Reverse Proxy

Nginx Proxy Manager config:
- **Scheme:** http
- **Forward Hostname:** homarr
- **Forward Port:** 7575
- **Enable WebSocket Support:** Yes

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for full configuration.

## Backup

```bash
docker run --rm -v homarr_appdata:/data -v $(pwd):/backup alpine \
  tar czf /backup/homarr-backup-$(date +%Y%m%d).tar.gz /data
```

The `appdata` volume contains your dashboard configuration, user data, and settings.

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a complete backup approach.

## Troubleshooting

### Docker Containers Not Showing

**Symptom:** Docker integration enabled but no containers appear.
**Fix:** Verify the Docker socket is mounted correctly: `/var/run/docker.sock:/var/run/docker.sock:ro`. Check that the Homarr container user has permissions to read the socket.

### Widgets Showing "Error" or "N/A"

**Symptom:** Integration widgets show errors instead of data.
**Fix:** Check that the integration URL is correct and reachable from the Homarr container. Use Docker service names (e.g., `http://sonarr:8989`) for containers on the same Docker network.

### Slow Dashboard Loading

**Symptom:** Dashboard takes several seconds to load.
**Fix:** Reduce the number of integrations that poll frequently. Increase the polling interval in widget settings. Disable unused widgets.

## Resource Requirements

- **RAM:** ~100-200 MB
- **CPU:** Very low — static dashboard with periodic API calls
- **Disk:** ~100 MB for the application and configuration

## Verdict

Homarr is the best self-hosted dashboard for home server management. The drag-and-drop UI is polished, the integrations with *arr apps and Docker are excellent, and it looks great out of the box. If you want something simpler and more minimal, [Homepage](/apps/homepage/) is lighter and faster. If you want maximum customizability with YAML configuration, [Dashy](/apps/dashy/) gives you more control. For most home server users who want a visual dashboard with real integrations, Homarr is the top pick.

## Related

- [Best Self-Hosted Dashboards](/best/dashboards/)
- [Homarr vs Homepage](/compare/homarr-vs-homepage/)
- [Homarr vs Dashy](/compare/homarr-vs-dashy/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [How to Self-Host Portainer](/apps/portainer/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
