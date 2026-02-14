---
title: "How to Self-Host Dockge with Docker Compose"
type: "app-guide"
app: "dockge"
category: "docker-management"
difficulty: "beginner"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up Dockge, a lightweight Docker Compose stack manager with a beautiful web UI."
officialUrl: "https://dockge.kuma.pet"
githubUrl: "https://github.com/louislam/dockge"
defaultPort: 5001
minRam: "128MB"
---

## What is Dockge?

Dockge (pronounced "dockey") is a stack-focused Docker Compose manager from the creator of Uptime Kuma. Unlike Portainer, Dockge is laser-focused on managing Docker Compose stacks. It stores your compose files as standard `docker-compose.yml` files on disk — not in a database. This means your stack definitions are always accessible, portable, and version-controllable.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- Any server

## Docker Compose Configuration

```yaml
# docker-compose.yml for Dockge
# Tested with Dockge 1.4+

services:
  dockge:
    container_name: dockge
    image: louislam/dockge:1
    ports:
      - "5001:5001"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./data:/app/data
      # Where your compose stacks will be stored
      - /opt/stacks:/opt/stacks
    environment:
      - DOCKGE_STACKS_DIR=/opt/stacks
    restart: unless-stopped
```

## Step-by-Step Setup

1. **Create necessary directories:**
   ```bash
   mkdir -p ~/dockge /opt/stacks
   cd ~/dockge
   ```

2. **Create the `docker-compose.yml`** with the config above.

3. **Start the container:**
   ```bash
   docker compose up -d
   ```

4. **Access the web UI** at `http://your-server-ip:5001`

5. **Create your account** on first visit.

6. **Create your first stack:** Click "Compose," paste a docker-compose.yml, name it, and click "Deploy."

## Configuration Tips

- **Stack directory:** All stacks are stored as real `docker-compose.yml` files in `/opt/stacks/`. You can edit them directly on disk and they'll appear in Dockge.
- **Interactive terminal:** Dockge shows real-time logs and provides a terminal for each stack.
- **Update containers:** Dockge can pull new images and recreate containers with one click.
- **Convert existing stacks:** Move existing docker-compose.yml files into `/opt/stacks/[stack-name]/` and they'll appear in the Dockge UI.
- **Agents:** Connect Dockge to multiple servers by deploying Dockge agents on remote machines.

## Backup & Migration

- **Backup:** Back up `/opt/stacks/` (your compose files) and `./data` (Dockge settings). Since stacks are standard compose files, you can run them with `docker compose` directly — no lock-in.

## Alternatives

[Portainer](/apps/portainer/) is more full-featured with container-level management, image management, and templates. See [Portainer vs Dockge](/compare/portainer-vs-dockge/) or the full [Best Docker Management Tools](/best/docker-management/) roundup.

## Verdict

Dockge is the ideal Docker Compose manager. It respects the compose file format, stores stacks on disk where they belong, and adds a beautiful UI on top. If you manage your services with Docker Compose (and you should), Dockge makes it visual without adding complexity.
