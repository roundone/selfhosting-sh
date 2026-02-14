---
title: "How to Self-Host Portainer with Docker Compose"
type: "app-guide"
app: "portainer"
category: "docker-management"
difficulty: "beginner"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up Portainer for visual Docker container management with a web UI."
officialUrl: "https://www.portainer.io"
githubUrl: "https://github.com/portainer/portainer"
defaultPort: 9443
minRam: "256MB"
---

## What is Portainer?

Portainer is a web-based Docker management UI. Instead of running Docker commands in the terminal, you get a visual dashboard showing all your containers, images, volumes, and networks. Start, stop, restart, view logs, open a console — all from your browser. The Community Edition is free and covers everything a home self-hoster needs.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- Any server ([best mini PCs for self-hosting](/hardware/best-mini-pc/))

## Docker Compose Configuration

```yaml
# docker-compose.yml for Portainer CE
# Tested with Portainer 2.21+

services:
  portainer:
    container_name: portainer
    image: portainer/portainer-ce:latest
    ports:
      - "9443:9443"   # HTTPS web UI
      - "8000:8000"   # Edge agent (optional)
    volumes:
      - ./data:/data
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
```

## Step-by-Step Setup

1. **Create a directory:**
   ```bash
   mkdir ~/portainer && cd ~/portainer
   ```

2. **Create the `docker-compose.yml`** with the config above.

3. **Start the container:**
   ```bash
   docker compose up -d
   ```

4. **Access the web UI** at `https://your-server-ip:9443` (note: HTTPS with a self-signed certificate).

5. **Create your admin account** — you have 5 minutes to do this before the instance locks for security.

6. **Select "Get Started"** to connect to your local Docker environment.

## Configuration Tips

- **Stacks:** Use Portainer's Stacks feature to deploy and manage Docker Compose files directly from the UI. You can paste compose files or pull them from Git repositories.
- **App Templates:** Browse and deploy popular self-hosted apps from built-in templates with one click.
- **Container management:** View logs, open a console, inspect environment variables, and restart containers without touching the terminal.
- **Multiple environments:** Manage Docker on multiple servers from a single Portainer instance using Edge Agents.
- **Reverse proxy:** Put Portainer behind a reverse proxy to replace the self-signed certificate. See our [reverse proxy guide](/foundations/reverse-proxy/).

## Backup & Migration

- **Backup:** The `data` folder contains Portainer's configuration database. Back it up to preserve your settings, users, and stack definitions.
- **Note:** Portainer doesn't store your containers' data — it only manages them. Each container's data is wherever you mounted its volumes.

## Troubleshooting

- **"Your Portainer instance timed out":** If you didn't create the admin account within 5 minutes, restart the container.
- **Permission denied on Docker socket:** Ensure the Docker socket is accessible. On some systems, you may need to adjust socket permissions.
- **Can't see containers from other compose projects:** Portainer sees all containers on the Docker daemon, regardless of which compose project created them.

## Alternatives

[Dockge](/apps/dockge/) is a lighter alternative focused purely on Docker Compose stack management. [Yacht](/apps/yacht/) is another option with a simpler interface. See our [Portainer vs Dockge comparison](/compare/portainer-vs-dockge/) or the full [Best Docker Management Tools](/best/docker-management/) roundup.

## Verdict

Portainer is the standard Docker management UI for self-hosting. It makes container management visual and accessible, especially for those less comfortable with the command line. Install it first — it makes managing everything else easier.
