---
title: "How to Self-Host Dockge with Docker Compose"
description: "Set up Dockge for managing Docker Compose stacks through a clean web UI. Lightweight Portainer alternative focused on Compose."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "docker-management"
apps:
  - dockge
tags:
  - self-hosted
  - docker
  - docker-management
  - compose
  - containers
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Dockge?

[Dockge](https://github.com/louislam/dockge) is a Docker Compose stack manager with a web UI, created by the developer behind Uptime Kuma. Unlike [Portainer](/apps/portainer), which manages individual containers and has a complex feature set, Dockge focuses exclusively on Docker Compose stacks. You create, edit, start, stop, and update `compose.yaml` files through a clean interface — and the files stay on disk as standard Compose files you can use anywhere. It is lightweight, opinionated, and ideal if your self-hosting workflow revolves around Docker Compose.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 256 MB of free RAM (Dockge is very lightweight)
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create the required directories and the `docker-compose.yml`:

```bash
mkdir -p /opt/stacks /opt/dockge
cd /opt/dockge
```

```yaml
services:
  dockge:
    image: louislam/dockge:1.5.0
    container_name: dockge
    restart: unless-stopped
    ports:
      - "5001:5001"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./data:/app/data
      - /opt/stacks:/opt/stacks
    environment:
      DOCKGE_STACKS_DIR: "/opt/stacks"
```

Start it:

```bash
docker compose up -d
```

**Critical:** The stacks directory volume mount must use the same absolute path on both sides (`/opt/stacks:/opt/stacks`). The `DOCKGE_STACKS_DIR` environment variable must also match this path. If any of these three values differ, stacks will not be detected or data will be written to the wrong location.

## Initial Setup

1. Open the web UI at `http://your-server-ip:5001`
2. On first visit, create your admin account (username and password). There are no default credentials — you set them on first access.
3. You're ready to manage stacks.

## Configuration

### Creating a New Stack

1. Click **+ Compose** in the web UI
2. Enter a stack name (this becomes the directory name under `/opt/stacks/`)
3. Write or paste your `compose.yaml` in the editor
4. Click **Deploy**

Dockge writes the file to `/opt/stacks/[stack-name]/compose.yaml` and runs `docker compose up -d` in that directory.

### Importing Existing Stacks

If you already have Compose stacks on your server, move them into `/opt/stacks/`:

```bash
mv ~/my-existing-stack /opt/stacks/my-existing-stack
```

Each stack must be in its own subdirectory with a `compose.yaml` or `docker-compose.yaml` file. Restart Dockge and it will detect the stacks automatically.

### Converting Docker Run Commands

Dockge includes a built-in converter: paste a `docker run` command and it generates the equivalent `compose.yaml`. Access it via the **+ Compose** button and the "Convert" tab.

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DOCKGE_STACKS_DIR` | `/opt/stacks` | Where stacks are stored and discovered |
| `DOCKGE_PORT` | `5001` | Web UI port (inside container) |
| `DOCKGE_HOSTNAME` | `0.0.0.0` | Bind address |
| `DOCKGE_DATA_DIR` | `./data/` | Internal data (user accounts, settings) |
| `DOCKGE_ENABLE_CONSOLE` | `false` | In-browser terminal (disabled by default since v1.5.0 for security) |
| `TZ` | System default | Timezone for log timestamps |

### Enabling the Console

The in-browser terminal was disabled by default in v1.5.0 for security reasons. To re-enable it:

```yaml
environment:
  DOCKGE_STACKS_DIR: "/opt/stacks"
  DOCKGE_ENABLE_CONSOLE: "true"
```

Only enable this on trusted networks — the console provides shell access to the host via the Docker socket.

## Advanced Configuration (Optional)

### SSL/TLS

Dockge supports built-in HTTPS:

```yaml
environment:
  DOCKGE_SSL_KEY: "/app/data/ssl/key.pem"
  DOCKGE_SSL_CERT: "/app/data/ssl/cert.pem"
volumes:
  - ./data:/app/data
  - ./ssl:/app/data/ssl
```

For most setups, it's simpler to put Dockge behind [Nginx Proxy Manager](/apps/nginx-proxy-manager) and let it handle SSL.

### Private Registry Authentication

If pulling images from private registries (GitHub Container Registry, self-hosted registry, etc.), mount your Docker auth config:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
  - ./data:/app/data
  - /opt/stacks:/opt/stacks
  - /root/.docker/:/root/.docker
```

### Multi-Host Management (Agents)

Dockge supports managing remote Docker hosts via agent nodes. Deploy a Dockge agent on the remote host and connect it to your primary instance. See the [Dockge documentation](https://github.com/louislam/dockge) for agent setup.

## Reverse Proxy

With [Nginx Proxy Manager](/apps/nginx-proxy-manager):

1. Add a proxy host for `dockge.yourdomain.com`
2. Forward to `http://your-server-ip:5001`
3. Enable SSL and WebSocket support

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for the full configuration.

## Backup

Back up the data directory (user accounts, settings) and your stacks:

```bash
# Backup Dockge internal data
tar czf dockge-data-backup.tar.gz /opt/dockge/data

# Backup all stacks (compose files + .env files)
tar czf dockge-stacks-backup.tar.gz /opt/stacks
```

The stacks directory contains your `compose.yaml` files and any `.env` files — this is the most important backup. The data directory stores user accounts and Dockge settings. See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Stacks showing as "Inactive" but detected

**Symptom:** Stacks appear in the UI but show as inactive even though they're running

**Fix:** This can happen with uppercase or capitalized directory names. Use lowercase directory names for all stacks:
```bash
mv /opt/stacks/MyStack /opt/stacks/mystack
```

### `.env` files not being read

**Symptom:** Environment variables defined in `.env` files are not applied to containers

**Fix:** This is a known issue. Define environment variables directly in the `compose.yaml` under the `environment:` section instead of using `.env` files.

### "Permission denied" when managing containers

**Symptom:** Dockge cannot start/stop containers

**Fix:** Ensure the Docker socket is mounted correctly and the Dockge container has access:
```bash
ls -la /var/run/docker.sock
# Should show srw-rw---- 1 root docker ...
```

### Cannot set CPU/memory limits

**Symptom:** The UI doesn't have fields for resource limits

**Fix:** Dockge's UI does not support resource limits. Add them manually in the compose YAML editor:
```yaml
services:
  myapp:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"
```

## Resource Requirements

- **RAM:** ~30 MB idle
- **CPU:** Minimal — Dockge is a Node.js app with very low overhead
- **Disk:** <50 MB for the application, plus whatever your stacks use

## Frequently Asked Questions

### Is Dockge free?

Yes. Dockge is fully open source under the MIT license.

### Should I use Dockge or Portainer?

Use Dockge if you work exclusively with Docker Compose and want a simple, focused tool. Use [Portainer](/apps/portainer) if you need to manage individual containers, Docker Swarm, Kubernetes, or need a more comprehensive management interface. See our [Dockge vs Portainer comparison](/compare/dockge-vs-portainer).

### Can I run Dockge on a Raspberry Pi?

Yes. Dockge supports arm64 and armv7. It runs comfortably on a Raspberry Pi 4 with 2+ GB RAM.

### Does Dockge modify my compose files?

Dockge reads and writes standard `compose.yaml` files. You can edit them outside Dockge with any text editor. However, note that Dockge may reformat YAML when saving through the UI (indentation, ordering).

## Verdict

Dockge is the best Docker Compose management UI for self-hosters who want simplicity. It does one thing — manage Compose stacks — and does it well. The files stay on disk as standard Compose files, so you're never locked in. For users who need more than Compose management (individual containers, Swarm, Kubernetes), [Portainer](/apps/portainer) is the better choice. For everyone else, Dockge is the right tool.

## Related

- [How to Self-Host Portainer](/apps/portainer)
- [Best Self-Hosted Docker Management](/best/docker-management)
- [Dockge vs Portainer](/compare/dockge-vs-portainer)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Volumes and Storage](/foundations/docker-volumes)
- [Docker Networking](/foundations/docker-networking)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
