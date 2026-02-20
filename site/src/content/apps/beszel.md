---
title: "How to Self-Host Beszel with Docker Compose"
description: "Step-by-step guide to self-hosting Beszel with Docker for lightweight multi-server monitoring and alerting."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "monitoring"
apps:
  - beszel
tags:
  - docker
  - monitoring
  - server-monitoring
  - lightweight
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Beszel?

Beszel is a lightweight server monitoring hub with a clean web UI, Docker container stats, historical data, and alerting. It uses a hub-agent architecture: a central hub collects data from agents running on each server you want to monitor. Beszel sits between simple tools like [Uptime Kuma](/apps/uptime-kuma) (which checks endpoints) and heavy stacks like [Grafana](/apps/grafana) + [Prometheus](/apps/prometheus) (which require significant setup). [Official site](https://beszel.dev/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 200 MB of free disk space
- 128 MB of RAM minimum
- SSH key pair for hub-agent authentication

## Docker Compose Configuration

### Hub (Central Dashboard)

Create a `docker-compose.yml` file on your monitoring server:

```yaml
services:
  beszel:
    image: henrygd/beszel:0.9.1
    container_name: beszel
    volumes:
      - ./data:/beszel_data
    ports:
      - "8090:8090"
    restart: unless-stopped
```

Start the hub:

```bash
docker compose up -d
```

### Agent (On Each Monitored Server)

On each server you want to monitor, create a `docker-compose.yml`:

```yaml
services:
  beszel-agent:
    image: henrygd/beszel-agent:0.9.1
    container_name: beszel-agent
    environment:
      - KEY=your-public-key-from-hub  # Set during hub setup
      - PORT=45876
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    ports:
      - "45876:45876"
    restart: unless-stopped
```

## Initial Setup

1. Open `http://your-server-ip:8090`
2. Create an admin account on first access
3. Click **Add System** to register your first server
4. The hub generates a public key — copy this to the agent's `KEY` environment variable
5. Start the agent on the target server
6. The hub automatically connects and begins collecting metrics

## Configuration

### Adding Multiple Servers

For each server:

1. In the hub: **Add System** → enter a name and the agent's IP:port (e.g., `192.168.1.100:45876`)
2. Copy the public key shown
3. On the target server: set the `KEY` environment variable in the agent's Docker Compose
4. Start the agent

### Alerts

Beszel supports alerts for:

- CPU usage thresholds
- Memory usage thresholds
- Disk usage thresholds
- Container status changes (started/stopped)
- System offline detection

Configure alerts per system in the web UI. Notification methods include Discord, Slack, Telegram, Gotify, Ntfy, and email via SMTP.

### Data Retention

Beszel stores data in a SQLite database. Configure retention under **Settings** to control how long historical data is kept. Default retention keeps several months of data at minimal disk cost.

## Advanced Configuration (Optional)

### Monitoring Without Docker Socket

If you don't want to expose the Docker socket, the agent still monitors system metrics (CPU, RAM, disk, network). You lose per-container stats but maintain a smaller attack surface:

```yaml
services:
  beszel-agent:
    image: henrygd/beszel-agent:0.9.1
    container_name: beszel-agent
    environment:
      - KEY=your-public-key
      - PORT=45876
    ports:
      - "45876:45876"
    restart: unless-stopped
```

### Custom Port

Change the agent port if 45876 conflicts:

```yaml
environment:
  - PORT=45877
ports:
  - "45877:45877"
```

Update the port in the hub's system configuration to match.

### Running Agent Without Docker

Beszel provides a standalone binary agent for systems without Docker:

```bash
curl -sL https://raw.githubusercontent.com/henrygd/beszel/main/supplemental/scripts/install-agent.sh | bash
```

## Reverse Proxy

Example Nginx Proxy Manager configuration:

- **Scheme:** http
- **Forward Hostname:** beszel
- **Forward Port:** 8090

[Reverse Proxy Setup](/foundations/reverse-proxy-explained)

## Backup

Back up the hub's data directory:

```bash
docker compose stop beszel
tar -czf beszel-backup-$(date +%Y%m%d).tar.gz ./data
docker compose start beszel
```

[Backup Strategy](/foundations/backup-3-2-1-rule)

## Troubleshooting

### Agent Not Connecting to Hub

**Symptom:** System shows as offline in the hub.
**Fix:** Verify the agent's `KEY` matches the public key shown in the hub. Check that port 45876 is open between the hub and agent servers. Verify the agent container is running: `docker logs beszel-agent`.

### No Docker Container Stats

**Symptom:** System metrics show but no container-level data.
**Fix:** Ensure `/var/run/docker.sock` is mounted in the agent's Docker Compose. The Docker socket must be readable by the container user.

### High Disk Usage Over Time

**Symptom:** The data directory grows steadily.
**Fix:** Adjust data retention settings in the hub's web UI. Beszel stores per-second metrics — reducing retention to 30 days significantly cuts storage.

## Resource Requirements

- **Hub:** ~50 MB RAM, negligible CPU
- **Agent:** ~20 MB RAM per monitored server, negligible CPU
- **Disk:** ~100 MB per monitored server per month (varies with metric count)

## Verdict

Beszel hits the sweet spot between Uptime Kuma (too simple for server monitoring) and Grafana + Prometheus (too complex for small setups). If you run 2-10 servers and want per-container stats with a clean dashboard and zero YAML configuration, Beszel is the right choice. It's newer than alternatives but actively developed and maturing quickly.

## FAQ

### Beszel vs Uptime Kuma?

Different focus. Uptime Kuma monitors endpoints (is this URL responding?). Beszel monitors servers (how much CPU/RAM/disk is this machine using?). Many people run both.

### Beszel vs Netdata?

Netdata is per-server with thousands of metrics and per-second granularity. Beszel is a centralized multi-server hub with fewer but the most important metrics. Netdata is better for deep single-server debugging; Beszel is better for overview monitoring of multiple servers.

### Is Beszel production-ready?

Beszel is pre-1.0 but stable for monitoring. It's used by thousands of homelabbers. Don't rely on it as your only alerting system for critical production infrastructure — pair it with something proven like Grafana alerting for that.

## Related

- [How to Self-Host Uptime Kuma](/apps/uptime-kuma)
- [How to Self-Host Grafana](/apps/grafana)
- [How to Self-Host Netdata](/apps/netdata)
- [How to Self-Host Prometheus](/apps/prometheus)
- [Grafana vs Uptime Kuma](/compare/grafana-vs-uptime-kuma)
- [Best Self-Hosted Monitoring Tools](/best/monitoring)
- [Docker Compose Basics](/foundations/docker-compose-basics)
