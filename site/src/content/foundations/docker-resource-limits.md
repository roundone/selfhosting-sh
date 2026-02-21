---
title: "Docker Resource Limits Explained"
description: "Set CPU, memory, and storage limits on Docker containers to prevent runaway services from crashing your self-hosted server."
date: "2026-02-17"
dateUpdated: "2026-02-17"
category: "foundations"
apps: []
tags: ["docker", "resources", "memory", "cpu", "self-hosted"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are Docker Resource Limits?

Docker containers share your host's CPU, memory, and disk I/O by default. Without limits, a single misbehaving container can consume all available RAM and crash every service on your server — including SSH, making remote recovery impossible.

Resource limits let you cap what each container can use. They're essential for any self-hosted server running multiple services.

## Prerequisites

- Docker Engine 20.10+ installed ([Docker Compose Basics](/foundations/docker-compose-basics/))
- A running Linux server ([Getting Started](/foundations/getting-started/))
- Basic understanding of Docker Compose files ([YAML Basics](/foundations/yaml-basics/))

## Memory Limits

Memory limits are the most important resource constraint. A container that exceeds its memory limit gets killed by the OOM (Out of Memory) killer — which is better than it taking down your entire server.

### Setting Memory Limits in Docker Compose

```yaml
services:
  nextcloud:
    image: nextcloud:29.0
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    restart: unless-stopped
```

- **`limits.memory`** — Hard ceiling. Container is killed if it exceeds this.
- **`reservations.memory`** — Soft guarantee. Docker tries to reserve this much for the container. Used for scheduling decisions.

### Memory Limit Formats

| Format | Meaning |
|--------|---------|
| `512M` | 512 megabytes |
| `1G` | 1 gigabyte |
| `2048M` | 2048 megabytes (2 GB) |
| `256K` | 256 kilobytes (rarely useful for containers) |

### What Happens When a Container Exceeds Its Memory Limit

Docker sends a SIGKILL to the container process. The container exits with code 137. If you have `restart: unless-stopped` set, Docker restarts it immediately.

Check if a container was OOM-killed:

```bash
docker inspect --format='{{.State.OOMKilled}}' container_name
```

## CPU Limits

CPU limits prevent a single container from monopolizing all processor cores. This is especially important on low-power hardware like mini PCs or Raspberry Pis where CPU is scarce.

### Setting CPU Limits in Docker Compose

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.9.6
    deploy:
      resources:
        limits:
          cpus: "2.0"
        reservations:
          cpus: "0.5"
    restart: unless-stopped
```

- **`limits.cpus`** — Maximum CPU cores the container can use. `"2.0"` means two full cores.
- **`reservations.cpus`** — Minimum CPU guaranteed to the container.

### CPU Limit Examples

| Value | Meaning |
|-------|---------|
| `"0.5"` | Half of one CPU core |
| `"1.0"` | One full core |
| `"2.0"` | Two full cores |
| `"0.25"` | Quarter of one core |

Unlike memory limits, exceeding a CPU limit doesn't kill the container. Docker throttles it — the container slows down but keeps running.

### CPU Shares (Relative Priority)

For relative CPU priority instead of hard limits, use `cpu_shares`:

```yaml
services:
  # Higher priority — gets more CPU when contested
  homeassistant:
    image: ghcr.io/home-assistant/home-assistant:2024.2
    cpu_shares: 1024
    restart: unless-stopped

  # Lower priority — yields CPU to higher-priority containers
  freshrss:
    image: freshrss/freshrss:1.24.1
    cpu_shares: 256
    restart: unless-stopped
```

CPU shares only matter when containers compete for CPU. If no contention exists, both containers can use as much CPU as they need. The default value is 1024.

## Storage Limits

Docker doesn't natively limit per-container disk usage through Compose in the same way as CPU and memory. But you can control storage growth:

### Limit Container Log Size

Container logs are the most common source of unexpected disk growth. Limit them globally in `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Or per-service in Docker Compose:

```yaml
services:
  myapp:
    image: myapp:1.0
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped
```

This keeps a maximum of 3 log files at 10 MB each — 30 MB total per container.

### Limit Temporary Storage

Use `tmpfs` mounts with size limits for temporary data:

```yaml
services:
  myapp:
    image: myapp:1.0
    tmpfs:
      - /tmp:size=100M
    restart: unless-stopped
```

## Practical Sizing Guide for Self-Hosted Apps

These are starting points. Monitor actual usage and adjust.

| App | Memory Limit | Memory Reservation | CPU Limit |
|-----|-------------|-------------------|-----------|
| Vaultwarden | 128M | 64M | 0.5 |
| Pi-hole | 256M | 128M | 0.5 |
| Nextcloud | 512M | 256M | 1.0 |
| Jellyfin (no transcoding) | 1G | 512M | 1.0 |
| Jellyfin (with transcoding) | 4G | 1G | 4.0 |
| Home Assistant | 512M | 256M | 1.0 |
| Immich | 2G | 1G | 2.0 |
| PostgreSQL | 512M | 256M | 1.0 |
| Redis | 128M | 64M | 0.25 |
| Nginx Proxy Manager | 256M | 128M | 0.5 |

## Monitoring Resource Usage

Check real-time container resource usage:

```bash
docker stats
```

Output shows CPU %, memory usage/limit, network I/O, and disk I/O for every running container.

For a single container:

```bash
docker stats nextcloud
```

For a snapshot (non-streaming):

```bash
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

Use this data to tune your limits. Set memory limits to roughly 150% of observed peak usage to allow for spikes without unnecessary kills.

## Common Mistakes

### Setting Limits Too Low

If you set a memory limit below what the application actually needs, the container enters a restart loop — it starts, allocates memory, gets OOM-killed, restarts, repeat. Check `docker inspect` for OOM kills if a container keeps restarting.

### Forgetting Database Containers

App containers are rarely the memory hog. PostgreSQL or MariaDB running alongside your app often consume more memory. Always set limits on database containers too.

### Using `deploy` Without Docker Compose v3+

The `deploy.resources` syntax requires Compose file format version 3+. If you're using version 2 format, use the legacy syntax:

```yaml
# Compose v2 syntax (legacy)
services:
  myapp:
    image: myapp:1.0
    mem_limit: 512m
    cpus: 1.0
```

With `docker compose` (v2 CLI), both syntaxes work. Use the `deploy.resources` syntax for consistency.

### Not Setting Log Limits

A single noisy container can fill your disk with log data overnight. Always configure log rotation either globally in `daemon.json` or per-service.

## Next Steps

- Monitor your containers with [Monitoring Basics](/foundations/monitoring-basics/) to find the right limits
- Learn about [Docker Compose Basics](/foundations/docker-compose-basics/) if you're new to Compose
- Set up [Docker Healthchecks](/foundations/docker-healthchecks/) to detect containers that are running but unresponsive
- Review [Docker Performance Tuning](/foundations/docker-performance-tuning/) for more optimization techniques

## FAQ

### Do resource limits work with Docker Compose v2?

Yes. The `docker compose` CLI (v2) supports both the `deploy.resources` syntax and the legacy `mem_limit`/`cpus` syntax. Use `deploy.resources` for new projects.

### Will my container crash if it hits the CPU limit?

No. CPU limits throttle the container — it runs slower but stays alive. Only memory limits cause the container to be killed when exceeded.

### Should I set resource limits on every container?

Yes. At minimum, set memory limits on every container. A single container without limits can consume all available RAM and crash your entire server. CPU limits are less critical but recommended for compute-heavy services like media transcoding.

### How do I know what limits to set?

Run `docker stats` for a few days under normal usage. Set memory limits to 150% of peak observed usage. Set CPU limits based on how many cores you want to dedicate to each service.

### Do resource reservations guarantee resources?

Reservations are soft guarantees. Docker uses them for scheduling decisions but doesn't strictly enforce them on a single-host setup. They're more meaningful in Docker Swarm mode.

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Performance Tuning](/foundations/docker-performance-tuning/)
- [Monitoring Basics](/foundations/monitoring-basics/)
- [Docker Troubleshooting](/foundations/docker-troubleshooting/)
- [Container Logging](/foundations/container-logging/)
- [Log Management](/foundations/log-management/)
- [Docker Volumes](/foundations/docker-volumes/)
