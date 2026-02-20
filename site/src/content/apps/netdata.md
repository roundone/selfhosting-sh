---
title: "How to Self-Host Netdata with Docker Compose"
description: "Step-by-step guide to self-hosting Netdata with Docker for real-time server monitoring with zero configuration."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "monitoring"
apps:
  - netdata
tags:
  - docker
  - monitoring
  - metrics
  - server-monitoring
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Netdata?

Netdata is a real-time infrastructure monitoring tool that collects thousands of metrics per second with near-zero configuration. It auto-detects running services (databases, web servers, Docker containers) and immediately starts monitoring them. The web dashboard updates every second with interactive, zoomable charts. Think of it as `htop` on steroids with a web UI. [Official site](https://www.netdata.cloud/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 500 MB of free disk space
- 512 MB of RAM minimum (Netdata itself uses ~100-200 MB)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  netdata:
    image: netdata/netdata:v2.5.2
    container_name: netdata
    hostname: my-server  # Change to your server's hostname
    cap_add:
      - SYS_PTRACE
      - SYS_ADMIN
    security_opt:
      - apparmor:unconfined
    volumes:
      - ./netdataconfig:/etc/netdata
      - ./netdatalib:/var/lib/netdata
      - ./netdatacache:/var/cache/netdata
      - /etc/passwd:/host/etc/passwd:ro
      - /etc/group:/host/etc/group:ro
      - /etc/localtime:/etc/localtime:ro
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /etc/os-release:/host/etc/os-release:ro
      - /var/log:/host/var/log:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    ports:
      - "19999:19999"
    restart: unless-stopped
```

**Why so many mounts?** Netdata needs read-only access to host system files to monitor hardware, processes, and services. The Docker socket mount enables container monitoring.

**Capabilities explained:**

| Capability | Purpose |
|-----------|---------|
| `SYS_PTRACE` | Monitor processes, read `/proc` details |
| `SYS_ADMIN` | Access cgroup information for container metrics |

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:19999`
2. The dashboard is immediately active — no setup wizard needed
3. Netdata auto-discovers and monitors everything it can find
4. Explore the dashboard: CPU, RAM, disk, network, Docker containers, and any detected services

## Configuration

### What Gets Monitored Automatically

Netdata detects and monitors these without configuration:

- **System:** CPU, RAM, swap, disk I/O, network interfaces, interrupts, softirqs
- **Docker:** Container CPU, memory, network, disk I/O per container
- **Services:** nginx, Apache, MySQL/MariaDB, PostgreSQL, Redis, MongoDB, and 200+ more
- **Hardware:** CPU temperature, fan speed, battery (when sensors are available)

### Custom Alerts

Override default alerts in `./netdataconfig/health.d/`:

```yaml
# custom-alerts.conf
alarm: high_cpu_usage
on: system.cpu
lookup: average -5m percentage
every: 1m
warn: $this > 80
crit: $this > 95
info: CPU usage is high
to: sysadmin
```

### Notification Methods

Configure in `./netdataconfig/health_alarm_notify.conf`:

- **Email:** Set `SEND_EMAIL="YES"` and configure SMTP
- **Slack:** Set `SLACK_WEBHOOK_URL`
- **Discord:** Set `DISCORD_WEBHOOK_URL`
- **Telegram:** Set `TELEGRAM_BOT_TOKEN` and `DEFAULT_RECIPIENT_TELEGRAM`
- **PagerDuty, Gotify, Ntfy:** All supported

### Data Retention

By default, Netdata keeps ~2 days of per-second data. Adjust in `./netdataconfig/netdata.conf`:

```ini
[db]
    mode = dbengine
    storage tiers = 3
    dbengine multihost disk space MB = 1024    # Tier 0: per-second, ~3 days
    dbengine tier 1 multihost disk space MB = 256  # Tier 1: per-minute, ~2 months
    dbengine tier 2 multihost disk space MB = 64   # Tier 2: per-hour, ~2 years
```

## Advanced Configuration (Optional)

### Netdata Cloud (Optional)

Netdata Cloud is a free SaaS dashboard that aggregates multiple Netdata agents. It doesn't store your data — it streams directly from your agents via WebSocket. To connect:

1. Create a free account at [app.netdata.cloud](https://app.netdata.cloud)
2. Get a claim token from the dashboard
3. Add to your docker-compose.yml:
   ```yaml
   environment:
     - NETDATA_CLAIM_TOKEN=your-token
     - NETDATA_CLAIM_URL=https://app.netdata.cloud
   ```

You can skip this entirely — the local dashboard works perfectly standalone.

### Disable Cloud Connection

If you want a fully air-gapped setup:

```ini
# netdata.conf
[cloud]
    enabled = no
```

### Monitoring Remote Docker Hosts

Add the Docker socket from the remote host via SSH or expose it over TLS. Or install Netdata on each host and use Netdata Cloud or a Grafana dashboard to aggregate.

### Export to Prometheus/Grafana

Netdata exposes metrics in Prometheus format at `http://netdata:19999/api/v1/allmetrics?format=prometheus`. Add this as a Prometheus scrape target:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: netdata
    metrics_path: /api/v1/allmetrics
    params:
      format: [prometheus]
    static_configs:
      - targets: ['netdata:19999']
```

## Reverse Proxy

Example Nginx Proxy Manager configuration:

- **Scheme:** http
- **Forward Hostname:** netdata
- **Forward Port:** 19999

**Important:** Netdata has no built-in authentication. When exposing via reverse proxy, enable basic auth or use [Authelia](/apps/authelia) for access control. [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

## Backup

```bash
docker compose stop netdata
tar -czf netdata-backup-$(date +%Y%m%d).tar.gz ./netdataconfig ./netdatalib
docker compose start netdata
```

The cache directory doesn't need backup — it's rebuilt automatically. [Backup Strategy](/foundations/backup-3-2-1-rule)

## Troubleshooting

### No Container Metrics Showing

**Symptom:** System metrics work but Docker container metrics are missing.
**Fix:** Ensure the Docker socket is mounted: `/var/run/docker.sock:/var/run/docker.sock:ro`. If using rootless Docker, the socket path differs. Check with `docker info | grep -i socket`.

### High CPU Usage from Netdata Itself

**Symptom:** Netdata uses 10-20% CPU constantly.
**Fix:** Reduce collection frequency for non-critical metrics. In `netdata.conf`, set `update every = 2` (default is 1 second). Disable plugins you don't need under `[plugins]`.

### Dashboard Loads Slowly

**Symptom:** Web UI takes several seconds to load charts.
**Fix:** Reduce the default chart timeframe. In the UI, click the time selector and choose a shorter window. For persistent fix, reduce `default_chart_duration` in `netdata.conf`.

### Permission Errors in Logs

**Symptom:** Log shows "Permission denied" for various files.
**Fix:** Ensure `SYS_PTRACE` and `SYS_ADMIN` capabilities are set. If SELinux is enabled, add `:z` or `:Z` to volume mount suffixes. Check that `apparmor:unconfined` is set in `security_opt`.

## Resource Requirements

- **RAM:** 100-200 MB typical, scales with number of monitored metrics
- **CPU:** 1-3% on modern hardware with default settings
- **Disk:** 1-2 GB with default retention (configurable)

## Verdict

Netdata is the fastest way to get comprehensive server monitoring running. The zero-configuration auto-discovery is genuinely impressive — install it and immediately see every metric that matters. The per-second granularity catches issues that tools polling every 30-60 seconds miss. For long-term trend analysis and multi-server dashboards, pair it with [Grafana](/apps/grafana) and [Prometheus](/apps/prometheus). For just watching your server's health in real time, Netdata alone is enough.

## FAQ

### Netdata vs Grafana + Prometheus?

Different tools for different needs. Netdata: instant setup, per-second real-time monitoring, single-server focus. Grafana + Prometheus: custom dashboards, multi-server aggregation, long-term storage, but requires significant configuration. Many people run both — Netdata for real-time debugging, Grafana for historical trends.

### Is Netdata Cloud required?

No. The local dashboard is fully functional without any cloud connection. Netdata Cloud adds multi-node management and composite charts for free, but it's entirely optional.

### Does Netdata work on ARM / Raspberry Pi?

Yes. Official ARM64 images are available. Performance is fine on a Pi 4. Reduce collection frequency on a Pi 3 or Zero.

## Related

- [How to Self-Host Grafana](/apps/grafana)
- [How to Self-Host Prometheus](/apps/prometheus)
- [How to Self-Host Uptime Kuma](/apps/uptime-kuma)
- [Grafana vs Prometheus](/compare/grafana-vs-prometheus)
- [Grafana vs Uptime Kuma](/compare/grafana-vs-uptime-kuma)
- [Best Self-Hosted Monitoring Tools](/best/monitoring)
- [Docker Compose Basics](/foundations/docker-compose-basics)
