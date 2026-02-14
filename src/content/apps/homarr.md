---
title: "How to Self-Host Homarr with Docker Compose"
type: "app-guide"
app: "homarr"
category: "dashboards"
difficulty: "beginner"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up Homarr, a modern self-hosted dashboard, to organize all your services in one place."
officialUrl: "https://homarr.dev"
githubUrl: "https://github.com/ajnart/homarr"
defaultPort: 7575
minRam: "256MB"
---

## What is Homarr?

Homarr is a modern, customizable dashboard for your self-hosted services. It provides a single page with widgets showing the status of all your apps, quick launch links, and integrations with popular services like Sonarr, Radarr, and Overseerr. Think of it as a homepage for your homelab.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- Self-hosted services to add to your dashboard

## Docker Compose Configuration

```yaml
# docker-compose.yml for Homarr
# Tested with Homarr 0.15+

services:
  homarr:
    container_name: homarr
    image: ghcr.io/ajnart/homarr:latest
    ports:
      - "7575:7575"
    volumes:
      - ./configs:/app/data/configs
      - ./icons:/app/public/icons
      - ./data:/data
      - /var/run/docker.sock:/var/run/docker.sock:ro
    restart: unless-stopped
```

## Step-by-Step Setup

1. **Create a directory:**
   ```bash
   mkdir ~/homarr && cd ~/homarr
   ```

2. **Create the `docker-compose.yml`** with the config above.

3. **Start the container:**
   ```bash
   docker compose up -d
   ```

4. **Access the dashboard** at `http://your-server-ip:7575`

5. **Add your services:** Click Edit Mode, add apps with their URLs, icons, and integration settings.

6. **Configure widgets:** Add status, calendar, weather, and service-specific widgets.

## Configuration Tips

- **Docker integration:** With the Docker socket mounted, Homarr can show container status and let you start/stop containers from the dashboard.
- **Service integrations:** Connect services like Sonarr, Radarr, Jellyfin, and others to show real-time data in widgets.
- **Custom icons:** Upload icons to the `icons` folder or use Dashboard Icons.
- **Multiple boards:** Create different dashboards for different purposes or family members.
- **Reverse proxy:** Access your dashboard from a clean URL. See our [reverse proxy guide](/foundations/reverse-proxy/).

## Backup & Migration

- **Backup:** The `configs` and `data` folders contain all your dashboard settings. Back them up.

## Alternatives

[Homepage](/apps/homepage/) is a config-file-based alternative with a clean design and strong service integrations. [Dashy](/apps/dashy/) is highly customizable with a different design approach. See [Homarr vs Homepage](/compare/homarr-vs-homepage/) or the full [Best Self-Hosted Dashboards](/best/dashboards/) roundup.

## Verdict

Homarr is the best dashboard for self-hosters who want a visual, widget-rich experience. The Docker integration and service widgets give you a proper command center for your homelab. Set it as your browser's homepage.
