---
title: "Linux Swap and Memory for Self-Hosting"
description: "Configure swap space, monitor memory usage, and prevent OOM kills on your self-hosted server. Essential memory management guide."
date: "2026-02-17"
dateUpdated: "2026-02-17"
category: "foundations"
apps: []
tags: ["linux", "memory", "swap", "server", "performance"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Swap?

Swap is disk space used as overflow memory. When your server's RAM fills up, Linux moves less-used data from RAM to the swap partition or file on disk. This prevents the OOM (Out of Memory) killer from terminating your containers, but at a significant speed penalty — disk is 100-1000x slower than RAM.

For self-hosted servers, swap is a safety net, not a performance feature. If your server regularly uses swap, you need more RAM. But having swap configured prevents catastrophic OOM kills when a container temporarily spikes in memory usage.

## Prerequisites

- Root access to your Linux server ([SSH Setup](/foundations/ssh-setup))
- Basic Linux command line skills ([Linux Basics](/foundations/linux-basics-self-hosting))

## Checking Current Memory and Swap

```bash
# Quick overview
free -h
# Output:
#               total        used        free      shared  buff/cache   available
# Mem:           7.7G        3.2G        1.8G        256M        2.7G        4.0G
# Swap:          2.0G         0B        2.0G

# Detailed per-process memory usage
ps aux --sort=-%mem | head -20

# Check if swap exists
swapon --show
```

Key terms:
- **total** — physical RAM installed
- **used** — actively in use by applications
- **buff/cache** — used by Linux for file caching (reclaimed when apps need it)
- **available** — actually available for new applications (free + reclaimable cache)
- **Swap** — disk-based overflow memory

**Common misconception:** "used" memory looks high because Linux aggressively caches files in RAM. This is normal and good. Look at the "available" column to see how much memory is actually free for new work.

## Setting Up Swap

### Option 1: Swap File (Recommended)

Swap files are easier to resize than partitions:

```bash
# Create a 4 GB swap file
sudo fallocate -l 4G /swapfile

# Set correct permissions (only root should access swap)
sudo chmod 600 /swapfile

# Format as swap
sudo mkswap /swapfile

# Enable immediately
sudo swapon /swapfile

# Verify
swapon --show
free -h
```

Make it permanent by adding to `/etc/fstab`:

```bash
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Option 2: Swap Partition

If you prefer a dedicated partition (common on VPS providers):

```bash
# Create swap on a partition (e.g., /dev/sdb1)
sudo mkswap /dev/sdb1

# Enable
sudo swapon /dev/sdb1

# Make permanent in /etc/fstab
echo '/dev/sdb1 none swap sw 0 0' | sudo tee -a /etc/fstab
```

### How Much Swap?

| Server RAM | Swap Size | Why |
|-----------|-----------|-----|
| 1-2 GB | 2 GB | Small VPS, need emergency buffer |
| 4-8 GB | 4 GB | Most home servers |
| 16-32 GB | 4-8 GB | Well-equipped server |
| 64+ GB | 4 GB | Swap is just a safety net at this level |

**Rule of thumb for self-hosting:** Set swap to your RAM size (up to 8 GB). Beyond 8 GB of swap, you're better off buying more RAM.

## Tuning Swappiness

The `vm.swappiness` parameter controls how aggressively Linux moves data from RAM to swap:

| Value | Behavior |
|-------|----------|
| 0 | Avoid swap almost entirely (only use when RAM is critically full) |
| 10 | Start swapping early inactive data — good for servers |
| 60 | Default — balances RAM and swap usage |
| 100 | Aggressively swap to disk |

For self-hosted servers, set swappiness to 10:

```bash
# Set immediately
sudo sysctl vm.swappiness=10

# Make permanent
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.d/99-swappiness.conf
```

Low swappiness keeps your active application data in RAM (fast) and only moves truly inactive pages to disk. This is ideal for servers running multiple Docker containers.

## Docker and Memory

### Container Memory Usage

Check memory usage per container:

```bash
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"
```

### Setting Container Memory Limits

Prevent individual containers from consuming all RAM:

```yaml
services:
  nextcloud:
    image: nextcloud:29.0
    deploy:
      resources:
        limits:
          memory: 512M
    restart: unless-stopped
```

See [Docker Resource Limits](/foundations/docker-resource-limits) for detailed guidance.

### The OOM Killer

When both RAM and swap are exhausted, Linux's OOM killer picks a process to terminate. It typically kills the process using the most memory — often your database or largest container.

Signs of OOM kills:

```bash
# Check system logs for OOM events
dmesg | grep -i "oom"
sudo journalctl | grep -i "out of memory"

# Check if a specific container was OOM-killed
docker inspect --format='{{.State.OOMKilled}}' container_name
```

Preventing OOM kills:
1. Add enough swap (safety net)
2. Set container memory limits (prevents runaway usage)
3. Monitor memory usage (catch problems before they escalate)
4. Add more RAM if swap is regularly used

## Monitoring Memory

### Real-Time Monitoring

```bash
# htop — interactive process viewer with memory bars
htop

# vmstat — memory and swap statistics every 5 seconds
vmstat 5

# Watch memory over time
watch -n 5 free -h
```

### Key Metrics to Watch

| Metric | Healthy | Warning | Action Needed |
|--------|---------|---------|--------------|
| Available memory | >20% of total | 10-20% | Monitor closely |
| Available memory | — | <10% | Add RAM or reduce containers |
| Swap used | 0-100 MB | 100 MB - 1 GB | Check what's consuming RAM |
| Swap used | — | >1 GB consistently | Add more RAM |
| OOM kills | 0 | Any | Investigate immediately |

### Clearing Swap

If swap is full and you've resolved the memory issue:

```bash
# Disable and re-enable swap to clear it
# WARNING: Only do this if you have enough free RAM to absorb swap contents
sudo swapoff -a && sudo swapon -a
```

## Memory-Hungry Self-Hosted Apps

Plan your RAM around these common requirements:

| Application | Minimum RAM | Comfortable RAM |
|-------------|------------|-----------------|
| Nextcloud | 256 MB | 512 MB |
| Jellyfin (no transcoding) | 256 MB | 1 GB |
| Jellyfin (hardware transcoding) | 1 GB | 2 GB |
| Immich | 1 GB | 4 GB |
| Home Assistant | 256 MB | 512 MB |
| PostgreSQL | 128 MB | 512 MB |
| GitLab CE | 4 GB | 8 GB |
| Vaultwarden | 32 MB | 64 MB |
| Pi-hole | 64 MB | 128 MB |
| Matrix/Synapse | 512 MB | 2 GB |

A server running Nextcloud + Jellyfin + Immich + PostgreSQL + Pi-hole + a reverse proxy needs at minimum 4 GB RAM, with 8-16 GB recommended.

## Common Mistakes

### No Swap on a VPS

Many VPS providers don't configure swap by default. A memory spike with no swap means instant OOM kills. Always create a swap file on a new VPS.

### Confusing "used" with "unavailable"

`free -h` showing 6 GB "used" out of 8 GB doesn't mean you're low on memory. Most of that is file cache, which Linux reclaims automatically. Check the "available" column instead.

### Swap on an HDD

Swap on spinning disks is painfully slow. If your server uses swap regularly and it's on an HDD, every operation becomes sluggish. Move swap to an SSD or add more RAM.

### Running Too Many Services for Available RAM

Self-hosting is addictive. Running 20 containers on 4 GB of RAM doesn't work, even with swap. Each new service needs memory. Budget at minimum 256 MB per lightweight container and 1-4 GB for heavy ones.

## Next Steps

- Set memory limits per container with [Docker Resource Limits](/foundations/docker-resource-limits)
- Monitor your server with [Monitoring Basics](/foundations/monitoring-basics)
- Choose the right hardware at [SSD vs HDD](/foundations/ssd-vs-hdd-servers)
- Plan your server capacity with [Storage Planning](/foundations/storage-planning)

## FAQ

### How do I know if my server needs more RAM?

If swap usage consistently exceeds 500 MB, if applications feel slow, or if you see OOM kills in `dmesg`, you need more RAM. Run `free -h` over several days to see peak usage patterns.

### Can I use swap on an NVMe SSD?

Yes, and it's the fastest swap option. NVMe swap is still much slower than RAM but significantly faster than HDD swap. For an SSD server, swap performs well enough to handle temporary memory spikes smoothly.

### Should I disable swap entirely?

No. Even with plenty of RAM, keep swap enabled as a safety net. Without swap, a single memory spike can kill your database container. Set swappiness to 10 so swap is only used when needed.

### Does Docker bypass swap limits?

If you set a memory limit on a container (`deploy.resources.limits.memory`), the container is killed when it exceeds that limit — swap doesn't save it. The container's memory limit applies to RSS (resident memory), not swap. Swap helps the overall system, not individual container limits.

### How do I resize a swap file?

```bash
sudo swapoff /swapfile
sudo fallocate -l 8G /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

This requires enough free RAM to absorb the current swap contents while it's disabled.

## Related

- [Docker Resource Limits](/foundations/docker-resource-limits)
- [Monitoring Basics](/foundations/monitoring-basics)
- [Docker Performance Tuning](/foundations/docker-performance-tuning)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting)
- [Getting Started with Self-Hosting](/foundations/getting-started)
- [SSD vs HDD for Servers](/foundations/ssd-vs-hdd-servers)
