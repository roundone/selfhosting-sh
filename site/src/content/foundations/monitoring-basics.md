---
title: "Monitoring Your Home Server"
description: "Set up monitoring for your self-hosted server — track uptime, resource usage, and get alerts when services go down or disks fill up."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["monitoring", "uptime", "alerts", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Monitor Your Home Server?

Without monitoring, you discover problems when something breaks — when your Nextcloud sync fails, your VPN stops connecting, or your disk fills up at 3 AM. Monitoring catches issues before they become outages and gives you data to plan upgrades.

At minimum, monitor three things: **service uptime** (is it running?), **resource usage** (disk, RAM, CPU), and **security events** (failed logins, banned IPs).

## Prerequisites

- A running self-hosted server ([Getting Started](/foundations/getting-started))
- Docker Compose knowledge ([Docker Compose Basics](/foundations/docker-compose-basics))
- At least one service to monitor

## Monitoring Stack Options

| Tool | Best For | Complexity | Resources |
|------|----------|------------|-----------|
| Uptime Kuma | Uptime monitoring + alerts | Low | ~50 MB RAM |
| Beszel | Server resource monitoring | Low | ~30 MB RAM |
| Netdata | Real-time performance metrics | Low | ~150 MB RAM |
| Prometheus + Grafana | Custom dashboards + long-term metrics | High | ~500 MB RAM |

**Recommendation:** Start with Uptime Kuma for uptime alerts and either Beszel or Netdata for resource monitoring. Add Prometheus + Grafana later if you need custom dashboards and historical data.

## Uptime Kuma: Service Uptime Monitoring

Uptime Kuma checks if your services are online and alerts you when they go down.

```yaml
# docker-compose.yml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1.23.15
    volumes:
      - uptime-kuma-data:/app/data
    ports:
      - "127.0.0.1:3001:3001"
    restart: unless-stopped

volumes:
  uptime-kuma-data:
```

```bash
docker compose up -d
# Access at http://your-server-ip:3001
```

### Configuring Monitors

After initial setup (create admin account), add monitors for each service:

| Monitor Type | Use For | Example |
|-------------|---------|---------|
| HTTP(s) | Web services | `https://cloud.yourdomain.com` |
| TCP Port | Database, Redis | `localhost:5432` |
| Docker Container | Container health | Container name: `nextcloud` |
| Ping | Network devices | `192.168.1.1` |
| DNS | DNS resolution | `cloud.yourdomain.com` |

**Set check intervals:**
- Critical services (reverse proxy, VPN): 60 seconds
- Standard services (Nextcloud, Jellyfin): 120 seconds
- Non-critical (dashboards): 300 seconds

### Setting Up Alerts

Uptime Kuma supports many notification methods. Recommended:

**Email (via your existing SMTP):**
1. Settings → Notifications → Add
2. Type: SMTP
3. Configure your SMTP server details
4. Apply to all monitors

**Telegram (instant mobile alerts):**
1. Create a bot via @BotFather on Telegram
2. Get your chat ID
3. Settings → Notifications → Telegram
4. Enter bot token and chat ID

**Discord/Slack webhook:**
1. Create a webhook in your Discord/Slack channel
2. Settings → Notifications → Discord/Slack
3. Paste the webhook URL

## Beszel: Lightweight Server Monitoring

Beszel is a lightweight agent that tracks CPU, memory, disk, network, and per-container resource usage.

```yaml
# docker-compose.yml — Hub (web UI)
services:
  beszel:
    image: henrygd/beszel:0.7.2
    ports:
      - "127.0.0.1:8090:8090"
    volumes:
      - beszel-data:/beszel_data
    restart: unless-stopped

volumes:
  beszel-data:
```

```yaml
# Agent (runs on each server you want to monitor)
services:
  beszel-agent:
    image: henrygd/beszel-agent:0.7.2
    environment:
      - PORT=45876
      - KEY=your-public-key-from-hub
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    ports:
      - "45876:45876"
    restart: unless-stopped
```

## Command-Line Monitoring

No Docker containers needed — built-in Linux tools for quick checks:

### Disk Usage

```bash
# Filesystem usage
df -h
# Filesystem      Size  Used  Avail Use% Mounted on
# /dev/sda1       100G   45G   50G  47%  /

# Largest directories
du -sh /opt/* | sort -rh | head -10

# Docker disk usage
docker system df
```

### Memory Usage

```bash
# Memory overview
free -h
#               total   used   free   shared  buff/cache  available
# Mem:           16Gi   4.2Gi  1.5Gi  256Mi   10.3Gi      11.4Gi

# Per-process memory usage (top consumers)
ps aux --sort=-%mem | head -10
```

### CPU Usage

```bash
# Real-time process monitor
top
# or the better alternative
htop

# CPU usage summary
mpstat 1 5   # 5 samples, 1 second apart

# Load average (1, 5, 15 minute)
uptime
# 10:00:00 up 30 days, load average: 0.50, 0.45, 0.40
```

**Load average rule of thumb:** If the 1-minute load average exceeds your CPU core count, the server is overloaded. 4-core server → load average above 4.0 means contention.

### Docker Container Resources

```bash
# Live container resource usage
docker stats
# CONTAINER  CPU %  MEM USAGE / LIMIT  NET I/O      BLOCK I/O
# nextcloud  2.5%   512MiB / 16GiB     1.2MB/800KB  50MB/20MB
# postgres   0.8%   256MiB / 16GiB     500KB/300KB  30MB/10MB

# Specific container
docker stats nextcloud

# Container health status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Alerting on Disk Space

Disk filling up is the most common silent killer. Set up a simple alert:

```bash
#!/bin/bash
# /opt/scripts/disk-alert.sh
THRESHOLD=85
USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$USAGE" -gt "$THRESHOLD" ]; then
    echo "WARNING: Disk usage at ${USAGE}% on $(hostname)" >&2
    # Send alert via your preferred method
fi

# Also check Docker volume usage
DOCKER_USAGE=$(docker system df --format '{{.Size}}' | head -1)
echo "Docker usage: $DOCKER_USAGE"
```

```bash
chmod +x /opt/scripts/disk-alert.sh
# Run hourly
# sudo crontab -e
0 * * * * /opt/scripts/disk-alert.sh >> /var/log/disk-alert.log 2>&1
```

## Docker Health Checks

Add health checks to your Docker Compose services so Docker knows if a container is actually working (not just running):

```yaml
services:
  nextcloud:
    image: nextcloud:29.0
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped

  postgres:
    image: postgres:16.2
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  redis:
    image: redis:7.4
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 5s
      retries: 3
    restart: unless-stopped
```

Check health status:

```bash
docker ps
# NAMES       STATUS
# nextcloud   Up 2 hours (healthy)
# postgres    Up 2 hours (healthy)
```

## What to Monitor

| Category | What to Track | Alert Threshold |
|----------|--------------|-----------------|
| **Disk** | Usage percentage | >85% warning, >95% critical |
| **RAM** | Available memory | <500 MB available |
| **CPU** | Load average | >CPU cores sustained |
| **Services** | HTTP response codes | Non-200 response |
| **SSL** | Certificate expiry | <14 days to expiry |
| **Docker** | Container health | Any container unhealthy |
| **Network** | Ping latency | >100ms to gateway |
| **Security** | Failed SSH logins | >10 in 5 minutes |
| **Backups** | Last backup time | >25 hours since last backup |

## Common Mistakes

### 1. Not Monitoring at All

The most common mistake. At minimum, run Uptime Kuma and a disk space alert script. 30 minutes of setup saves hours of debugging later.

### 2. Monitoring the Server From the Server

If the server goes down, your monitoring goes down with it. Use an external service (UptimeRobot free tier, or a second server) to monitor your main server from outside.

### 3. Alert Fatigue

Too many alerts and you start ignoring them all. Only alert on actionable conditions — things that require your intervention. Log everything else for review.

### 4. Not Monitoring Docker Volumes

A container can restart fine even if its volume is full or corrupted. Add health checks and volume space monitoring.

### 5. Over-Engineering the Monitoring Stack

Prometheus + Grafana + Alertmanager + Loki is powerful but complex. Start with Uptime Kuma (5-minute setup) and add complexity only when needed.

## FAQ

### What's the simplest monitoring setup?

Uptime Kuma in a Docker container with email or Telegram notifications. 5 minutes to set up, covers the most critical need: knowing when services go down.

### Should I monitor from inside or outside my network?

Both. Internal monitoring catches container and service issues. External monitoring (from a different network) catches DNS, network, and power outages. Use UptimeRobot (free tier, 5-minute intervals) for external monitoring.

### How much RAM does monitoring use?

Uptime Kuma: ~50 MB. Beszel: ~30 MB. Netdata: ~150 MB. Prometheus + Grafana: ~400-500 MB. Start small and scale up.

### Should I monitor Docker container logs?

Yes, but don't overwhelm yourself. Check logs reactively when something fails, and set up log-based alerts only for critical errors. Loki + Grafana provides searchable centralized logs if you need it.

### How do I monitor SSL certificate expiry?

Uptime Kuma monitors HTTPS endpoints and shows certificate expiry. Set an alert for 14 days before expiry. If you use Let's Encrypt with auto-renewal, this is a safety net for when renewal fails.

## Next Steps

- [Docker Compose Basics](/foundations/docker-compose-basics) — add health checks to your services
- [Linux Cron Jobs](/foundations/linux-cron-jobs) — schedule monitoring scripts
- [Systemd Services](/foundations/linux-systemd) — run monitoring as system services

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Linux Cron Jobs](/foundations/linux-cron-jobs)
- [Systemd Services](/foundations/linux-systemd)
- [Firewall Setup with UFW](/foundations/firewall-ufw)
- [Fail2ban Setup](/foundations/fail2ban)
- [Getting Started with Self-Hosting](/foundations/getting-started)
