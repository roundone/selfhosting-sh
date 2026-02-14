---
title: "Docker Compose Basics for Self-Hosting"
type: "foundation"
topic: "docker"
difficulty: "beginner"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Learn Docker Compose fundamentals: the essential skill for self-hosting any app."
prerequisites: []
---

## Why Docker Compose?

Almost every self-hosted app runs in Docker. Docker Compose lets you define your entire app stack — the app itself, its database, cache, and any other services — in a single YAML file. One command starts everything. One command stops it. This is how modern self-hosting works.

## Installing Docker

On Ubuntu/Debian:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

Docker Compose is included with Docker Engine since Docker v2.

## Your First Docker Compose File

Create a file called `docker-compose.yml`:

```yaml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: uptime-kuma
    volumes:
      - ./data:/app/data
    ports:
      - "3001:3001"
    restart: unless-stopped
```

This runs [Uptime Kuma](/apps/uptime-kuma/), a simple monitoring tool. Let's break it down:

- **`image`**: The Docker image to use (from Docker Hub)
- **`container_name`**: A friendly name for the container
- **`volumes`**: Maps a local folder (`./data`) to a folder inside the container — this is where your data persists
- **`ports`**: Maps host port 3001 to container port 3001
- **`restart: unless-stopped`**: Automatically restart after a crash or reboot

## Essential Commands

```bash
# Start all services (in background)
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# Restart a specific service
docker compose restart uptime-kuma

# Pull latest images
docker compose pull

# Update (pull + recreate)
docker compose pull && docker compose up -d
```

## Key Concepts

### Volumes
Volumes persist data outside the container. Without them, your data disappears when the container is recreated. Always use volumes for databases, configs, and user data.

### Environment Variables
Use `.env` files or the `environment` key to configure apps:

```yaml
services:
  app:
    image: some-app:latest
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/app
    env_file:
      - .env
```

### Networks
Docker Compose creates a default network for each project. Services can reach each other by container name. For cross-project communication, create external networks.

## Next Steps

Now that you understand Docker Compose, try setting up your first app:

- [Immich](/apps/immich/) — Google Photos replacement
- [Uptime Kuma](/apps/uptime-kuma/) — Monitoring dashboard
- [Pi-hole](/apps/pihole/) — Network-wide ad blocking

Or learn about [reverse proxies](/foundations/reverse-proxy/) to access your apps over HTTPS.
