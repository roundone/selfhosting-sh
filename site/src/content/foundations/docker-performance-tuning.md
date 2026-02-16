---
title: "Docker Performance Tuning"
description: "Optimize Docker container performance — memory limits, CPU allocation, storage drivers, logging, image optimization, and resource monitoring."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["docker", "performance", "optimization", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Docker Performance Matters

On a small self-hosting server, resources are limited. A single misconfigured container can monopolize RAM or CPU and take down everything else. Performance tuning ensures all your services coexist reliably and respond quickly.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose Basics](/foundations/docker-compose-basics))
- Basic Linux familiarity ([Linux Basics](/foundations/linux-basics-self-hosting))
- Understanding of Docker volumes ([Docker Volumes](/foundations/docker-volumes))

## Measure Before You Optimize

### Container Resource Usage

```bash
# Live resource monitoring
docker stats

# Snapshot (non-streaming)
docker stats --no-stream

# Specific containers
docker stats container1 container2

# Output:
# NAME         CPU %   MEM USAGE / LIMIT   MEM %   NET I/O         BLOCK I/O
# nextcloud    2.5%    245MiB / 3.84GiB    6.2%    1.2MB / 500KB   50MB / 10MB
# postgres     0.3%    85MiB / 3.84GiB     2.2%    500KB / 1.5MB   20MB / 100MB
```

### System-Wide Resources

```bash
# Overall memory
free -h

# CPU and load
uptime
nproc  # Number of CPU cores

# Disk I/O
iostat -x 1 5  # 5 samples, 1 second apart

# Disk space
df -h
docker system df  # Docker-specific disk usage
```

## Memory Management

### Set Memory Limits

Without limits, a single container can consume all available RAM and trigger the OOM killer, which may kill other containers or system processes.

```yaml
services:
  myapp:
    image: myapp:v1.0
    deploy:
      resources:
        limits:
          memory: 512M    # Hard cap — container is killed if it exceeds this
        reservations:
          memory: 256M    # Guaranteed minimum allocation
```

**Guidelines for common self-hosted apps:**

| App | Recommended Limit | Notes |
|-----|-------------------|-------|
| Nginx/Caddy/Traefik | 128-256M | Low unless handling heavy traffic |
| PostgreSQL | 256M-1G | Depends on database size and queries |
| Redis | 64-256M | In-memory store, size depends on cached data |
| Nextcloud | 512M-1G | PHP app, increases with users |
| Jellyfin | 1-4G | Transcoding needs more |
| Immich | 1-2G | ML models use significant memory |
| Vaultwarden | 64-128M | Very lightweight |

### Optimize Swap

Swap prevents OOM kills when memory is tight:

```bash
# Check current swap
free -h

# Add 4GB swap file
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Set swappiness (how eagerly the kernel swaps)
# Lower = swap less aggressively (better for servers)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl vm.swappiness=10
```

### Disable Swap per Container (When Needed)

For latency-sensitive apps:

```yaml
services:
  redis:
    deploy:
      resources:
        limits:
          memory: 256M
    # Prevent swapping for this container
    memswap_limit: 256M  # Same as memory = no swap
```

## CPU Management

### Limit CPU Usage

```yaml
services:
  myapp:
    deploy:
      resources:
        limits:
          cpus: "1.5"    # Can use up to 1.5 CPU cores
        reservations:
          cpus: "0.5"    # Guaranteed 0.5 cores
```

### Pin to Specific CPU Cores

Useful for isolating heavy workloads:

```yaml
services:
  jellyfin:
    cpuset: "2,3"  # Only use cores 2 and 3
```

### CPU Priority (Shares)

When multiple containers compete for CPU:

```yaml
services:
  important-app:
    cpu_shares: 1024  # Default priority

  background-task:
    cpu_shares: 256   # Lower priority — gets less CPU when contested
```

CPU shares only matter under contention. When CPU is idle, any container can use all available cores.

## Storage Performance

### Choose the Right Storage Driver

```bash
# Check current storage driver
docker info | grep "Storage Driver"
```

| Driver | Performance | Best For |
|--------|------------|----------|
| overlay2 | Good | Default, works well on ext4 and xfs |
| btrfs | Good with btrfs filesystem | Servers already using btrfs |
| zfs | Good with ZFS | Servers already using ZFS |

overlay2 is the default and best choice for most self-hosting setups.

### Use SSD for Docker Data

Docker's data directory (`/var/lib/docker`) benefits massively from SSD storage.

```bash
# Move Docker to SSD (if currently on HDD)
sudo systemctl stop docker
sudo mv /var/lib/docker /mnt/ssd/docker
sudo ln -s /mnt/ssd/docker /var/lib/docker
sudo systemctl start docker
```

Or configure in daemon.json:

```json
{
  "data-root": "/mnt/ssd/docker"
}
```

### Optimize Volume Mounts

Bind mount performance tips:
- Avoid mounting over slow network filesystems (NFS, CIFS) for write-heavy apps
- Use named volumes for database data (Docker manages them more efficiently)
- For large media libraries, bind mounts to direct disk paths are fine

```yaml
# Database: use named volume (Docker manages it on local storage)
services:
  db:
    volumes:
      - db_data:/var/lib/postgresql/data

# Media: bind mount directly (large, sequential reads)
  jellyfin:
    volumes:
      - /mnt/media:/media:ro  # Read-only where possible
```

## Logging Optimization

### Limit Container Log Size

By default, Docker keeps unlimited logs. On a busy server, logs can fill your disk.

**Per container:**

```yaml
services:
  myapp:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

**Globally (all containers):**

```bash
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
sudo systemctl restart docker
```

See [Container Logging](/foundations/container-logging) for detailed log management.

### Clean Up Old Logs

```bash
# Check log sizes
sudo du -sh /var/lib/docker/containers/*/  # Per container
sudo du -sh /var/lib/docker/containers/  # Total

# Truncate a specific container's log (keeps the file, empties content)
sudo truncate -s 0 /var/lib/docker/containers/CONTAINER_ID/CONTAINER_ID-json.log
```

## Image Optimization

### Remove Unused Images

```bash
# See what's taking space
docker system df

# Remove unused images
docker image prune       # Dangling images only
docker image prune -a    # All unused images

# Remove everything unused (images, containers, networks, build cache)
docker system prune -a
```

### Use Smaller Base Images

If you build custom images, the base image matters:

| Base | Size | Use When |
|------|------|----------|
| alpine | ~5MB | Minimal, good for most apps |
| debian-slim | ~80MB | When you need glibc |
| ubuntu | ~75MB | When you need Ubuntu-specific packages |
| scratch | 0MB | Static binaries only |

## Network Performance

### Use Bridge Networking

Bridge mode (the default) is the best balance of performance and isolation.

```yaml
# Default — good performance
services:
  myapp:
    # Uses bridge networking by default

# Host networking — marginal performance gain, less isolation
  myapp:
    network_mode: host
```

Host networking eliminates NAT overhead but removes network isolation. Only use it when you need it (e.g., for network scanning tools or when dealing with multicast).

### Reduce DNS Lookups

If containers frequently resolve external domains:

```yaml
# Add explicit DNS servers (avoids systemd-resolved latency)
services:
  myapp:
    dns:
      - 1.1.1.1
```

## Docker Daemon Tuning

### daemon.json Best Practices

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "dns": ["1.1.1.1", "8.8.8.8"],
  "default-address-pools": [
    {"base": "10.10.0.0/16", "size": 24}
  ]
}
```

### Enable Live Restore

Allows containers to keep running when the Docker daemon restarts:

```json
{
  "live-restore": true
}
```

## Monitoring Performance Over Time

### Basic Monitoring with docker stats

Create a simple monitoring script:

```bash
#!/bin/bash
# Log container stats every 5 minutes
while true; do
  echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
  docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
  echo ""
  sleep 300
done
```

### Better: Use a Monitoring Stack

For proper performance monitoring, deploy a monitoring solution. See [Monitoring Basics](/foundations/monitoring-basics) for options like Uptime Kuma, Grafana, or Netdata.

## FAQ

### Should I set memory limits on every container?

For production self-hosting, yes. At minimum, set limits on resource-heavy containers (databases, media servers, ML-based apps). Without limits, one misbehaving container can crash everything.

### Does Docker have significant performance overhead compared to bare metal?

No. Docker's overhead is negligible — typically <1% for CPU, zero for memory, and minimal for disk and network I/O. The isolation comes from Linux kernel features (namespaces, cgroups), not virtualization.

### My server is slow but no single container is using much CPU or RAM. What's wrong?

Check disk I/O with `iostat -x 1`. A slow or failing disk is the most common cause of "everything is slow." Also check for high system load (`uptime`) — a load average higher than your CPU core count means processes are waiting.

### How much memory overhead does Docker itself use?

The Docker daemon uses 50-100MB. Each container adds minimal overhead (a few MB for the runtime). The container's application is what uses memory. A server with 4GB RAM can comfortably run 10-15 lightweight containers.

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Volumes](/foundations/docker-volumes)
- [Container Logging](/foundations/container-logging)
- [Monitoring Basics](/foundations/monitoring-basics)
- [Docker Common Issues](/foundations/docker-common-issues)
- [Storage Planning](/foundations/storage-planning)
- [Power Management](/foundations/power-management)
