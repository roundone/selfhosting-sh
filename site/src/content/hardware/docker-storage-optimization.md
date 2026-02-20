---
title: "Docker Storage Optimization for Home Servers"
description: "Optimize Docker storage on your home server. Manage images, volumes, overlay2, and disk space for efficient self-hosted container workloads."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "docker", "storage", "optimization"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## The Problem

Docker accumulates disk space silently. Old images, dangling volumes, build caches, and container logs grow until your server's storage is full and containers start crashing. On a home server with limited SSD space, this happens faster than you'd expect.

A typical self-hosting setup with 15–20 containers uses 5–15 GB for images alone. Add application data volumes, database files, and logs, and you can easily consume 50–100 GB before you realize it.

## Understanding Docker's Disk Usage

Docker stores data in several locations:

| Component | Default Location | Typical Size |
|-----------|-----------------|-------------|
| Images | `/var/lib/docker/overlay2/` | 200 MB–2 GB per image |
| Containers (writable layer) | `/var/lib/docker/overlay2/` | 10 MB–1 GB per container |
| Volumes | `/var/lib/docker/volumes/` | Varies (databases can be 1–50+ GB) |
| Build cache | `/var/lib/docker/buildkit/` | 0–10+ GB |
| Container logs | `/var/lib/docker/containers/*/` | 0–10+ GB (unbounded by default) |
| Networks | `/var/lib/docker/network/` | Negligible |

Check your current usage:

```bash
docker system df
```

Output example:

```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          45        20        12.5GB    6.8GB (54%)
Containers      20        20        1.2GB     0B (0%)
Local Volumes   25        20        48.3GB    5.1GB (10%)
Build Cache     15        0         3.2GB     3.2GB (100%)
```

The "RECLAIMABLE" column shows how much space you can free right now.

## Quick Wins: Reclaim Space Now

### 1. Remove unused images, containers, and networks

```bash
docker system prune -a
```

This removes:
- All stopped containers
- All networks not used by at least one container
- All images without at least one container associated to them
- All build cache

Add `--volumes` to also remove unused volumes (careful — this deletes data):

```bash
docker system prune -a --volumes
```

### 2. Remove dangling volumes

Dangling volumes are volumes not associated with any container. They accumulate when you remove containers without removing their volumes:

```bash
docker volume ls -f dangling=true
docker volume prune
```

### 3. Clear build cache

If you build custom images:

```bash
docker builder prune -a
```

## Container Log Management

This is the most common storage surprise on home servers. Docker captures all stdout/stderr from containers into JSON log files at `/var/lib/docker/containers/<id>/<id>-json.log`. By default, there's **no size limit** — a chatty container can fill your disk.

### Set global log limits

Edit or create `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

This limits each container to 3 log files of 10 MB each (30 MB max per container). Restart Docker to apply:

```bash
sudo systemctl restart docker
```

**This only applies to new containers.** Existing containers retain their old log configuration. Recreate them to pick up the new defaults:

```bash
docker compose down && docker compose up -d
```

### Per-container log limits in Docker Compose

```yaml
services:
  myapp:
    image: myapp:latest
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

### Find which containers are using the most log space

```bash
sudo du -sh /var/lib/docker/containers/*/
```

Or more readable:

```bash
for container in $(docker ps -aq); do
  name=$(docker inspect --format '{{.Name}}' $container | sed 's/\///')
  size=$(docker inspect --format '{{.LogPath}}' $container | xargs sudo du -sh 2>/dev/null | awk '{print $1}')
  echo "$size $name"
done | sort -rh
```

## Choosing the Right Storage Driver

Docker's default storage driver on modern Linux is `overlay2`, which is the right choice for most setups. Check yours:

```bash
docker info | grep "Storage Driver"
```

If you see `devicemapper`, `aufs`, or `vfs`, switch to `overlay2` — it's faster and more space-efficient. In `/etc/docker/daemon.json`:

```json
{
  "storage-driver": "overlay2"
}
```

**For ZFS users:** If your Docker root is on a ZFS filesystem, use the `zfs` storage driver for better integration with ZFS snapshots and copy-on-write:

```json
{
  "storage-driver": "zfs"
}
```

## Moving Docker's Data Directory

By default, Docker stores everything in `/var/lib/docker/`. If your boot drive is a small SSD, move Docker to a larger drive.

### Option 1: Change Docker's root directory

In `/etc/docker/daemon.json`:

```json
{
  "data-root": "/mnt/storage/docker"
}
```

Then stop Docker, move the data, and restart:

```bash
sudo systemctl stop docker
sudo rsync -aP /var/lib/docker/ /mnt/storage/docker/
sudo systemctl start docker
```

Verify:

```bash
docker info | grep "Docker Root Dir"
```

### Option 2: Symlink (simpler but less clean)

```bash
sudo systemctl stop docker
sudo mv /var/lib/docker /mnt/storage/docker
sudo ln -s /mnt/storage/docker /var/lib/docker
sudo systemctl start docker
```

## Volume Storage Strategies

### Bind mounts vs. named volumes

**Bind mounts** map a specific host directory into the container:

```yaml
volumes:
  - /mnt/data/nextcloud:/var/www/html
```

**Named volumes** are managed by Docker:

```yaml
volumes:
  - nextcloud_data:/var/www/html

volumes:
  nextcloud_data:
```

**For home servers, prefer bind mounts.** Named volumes are harder to back up, inspect, and migrate. Bind mounts let you point directly to your storage drive and organize data in a predictable directory structure.

### Recommended directory structure

```
/mnt/data/
├── appdata/           # Application configuration
│   ├── nextcloud/
│   ├── jellyfin/
│   ├── vaultwarden/
│   └── ...
├── media/             # Large media files
│   ├── movies/
│   ├── music/
│   └── photos/
├── databases/         # Database data directories
│   ├── postgres/
│   └── mariadb/
└── backups/           # Backup destinations
```

### Separate boot SSD from data storage

The ideal home server storage layout:

| Drive | Role | Filesystem |
|-------|------|-----------|
| NVMe SSD (256–512 GB) | Boot drive, Docker images, containers, app configs | ext4 or ZFS |
| SATA SSD or HDD (1–8 TB) | Application data, media, databases | ext4, XFS, or ZFS |
| External/NAS (optional) | Backups, cold storage | Varies |

Keep Docker's image cache (`/var/lib/docker/`) on the fast SSD for container startup performance. Store application data volumes on the larger drive.

## Automated Cleanup

### Weekly cleanup cron job

```bash
# /etc/cron.weekly/docker-cleanup
#!/bin/bash
docker image prune -a --filter "until=168h" --force
docker container prune --force
docker network prune --force
docker builder prune -a --force
```

This removes images older than 7 days that aren't in use, plus stopped containers, unused networks, and all build cache. Make it executable:

```bash
sudo chmod +x /etc/cron.weekly/docker-cleanup
```

### Monitor disk usage

Set up a simple alert when Docker storage exceeds a threshold:

```bash
# /etc/cron.daily/docker-disk-check
#!/bin/bash
THRESHOLD=85
USAGE=$(df /var/lib/docker | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$USAGE" -gt "$THRESHOLD" ]; then
    echo "Docker storage at ${USAGE}% on $(hostname)" | \
    mail -s "ALERT: Docker disk space low" admin@example.com
fi
```

## Image Size Optimization

If you build custom Docker images, keep them small:

### Use Alpine-based images

```dockerfile
# Instead of:
FROM node:20          # ~350 MB

# Use:
FROM node:20-alpine   # ~50 MB
```

### Multi-stage builds

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

### Pin image versions and clean up old ones

After updating a service's image tag in your Docker Compose file:

```bash
docker compose pull
docker compose up -d
docker image prune -f
```

The `prune` removes the old version of the image that's no longer in use.

## Storage Hardware Recommendations

| Use Case | Recommended Hardware | Why |
|----------|---------------------|-----|
| Boot + Docker images | 256–512 GB NVMe SSD | Fast container startup, overlay2 performance |
| App data + databases | 1–4 TB SATA SSD | Reliable, fast random I/O for databases |
| Media storage | 4–16 TB HDD | Cost-effective for large files |
| Backups | External USB or NAS | Physical separation from primary storage |

For specific drive recommendations, see our [Best SSDs for Home Servers](/hardware/best-ssd-home-server) and [Best Hard Drives for NAS](/hardware/best-hard-drives-nas) guides.

## FAQ

### How much SSD space do I need for Docker?
For a typical 15–20 container self-hosting setup: 30–50 GB for Docker images and overlay2, plus whatever your application data needs. A 256 GB SSD is comfortable for most setups. A 512 GB SSD gives plenty of headroom.

### Can I run Docker on an HDD?
Yes, but container startup and image pull times will be noticeably slower. overlay2 layer operations benefit significantly from SSD random I/O. Use an SSD for Docker's data root, and store large application data on HDDs.

### Should I use ZFS for Docker volumes?
If your server runs ZFS, using the ZFS storage driver integrates well — you get snapshots, compression, and checksumming for your container layers. But it's not required. ext4 on ZFS datasets works fine with the default overlay2 driver.

### How do I find what's using disk space in Docker?
`docker system df` for an overview. `docker system df -v` for per-image and per-volume breakdowns. For container logs: `sudo du -sh /var/lib/docker/containers/*/`.

## Related

- [Best SSDs for Home Servers](/hardware/best-ssd-home-server)
- [Best Hard Drives for NAS](/hardware/best-hard-drives-nas)
- [HDD vs SSD for Home Servers](/hardware/hdd-vs-ssd-home-server)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Volumes](/foundations/docker-volumes)
- [Backup Strategy](/foundations/backup-strategy)
- [NVMe vs SATA SSD](/hardware/nvme-vs-sata-ssd)
