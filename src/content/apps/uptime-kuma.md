---
title: "How to Self-Host Uptime Kuma with Docker Compose"
type: "app-guide"
app: "uptime-kuma"
category: "monitoring"
difficulty: "beginner"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up Uptime Kuma, a beautiful self-hosted monitoring tool, with Docker Compose in under 5 minutes."
officialUrl: "https://uptime.kuma.pet"
githubUrl: "https://github.com/louislam/uptime-kuma"
defaultPort: 3001
minRam: "256MB"
---

## What is Uptime Kuma?

Uptime Kuma is a self-hosted monitoring tool that watches your services and alerts you when something goes down. It supports HTTP, TCP, DNS, Docker, and many other monitor types. The interface is clean, responsive, and includes customizable status pages you can share publicly.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- Any server — Uptime Kuma is lightweight ([best mini PCs for self-hosting](/hardware/best-mini-pc/))

## Docker Compose Configuration

```yaml
# docker-compose.yml for Uptime Kuma
# Tested with Uptime Kuma 1.23+

services:
  uptime-kuma:
    container_name: uptime-kuma
    image: louislam/uptime-kuma:1
    ports:
      - "3001:3001"
    volumes:
      - ./data:/app/data
      # Mount Docker socket to monitor containers
      - /var/run/docker.sock:/var/run/docker.sock:ro
    restart: unless-stopped
```

That's it. No database, no dependencies. One container.

## Step-by-Step Setup

1. **Create a directory:**
   ```bash
   mkdir ~/uptime-kuma && cd ~/uptime-kuma
   ```

2. **Create the `docker-compose.yml`** with the config above.

3. **Start the container:**
   ```bash
   docker compose up -d
   ```

4. **Access the web UI** at `http://your-server-ip:3001`

5. **Create your admin account** on first visit.

6. **Add your first monitors:**
   - Click "Add New Monitor"
   - Choose monitor type (HTTP, TCP, Ping, DNS, Docker, etc.)
   - Enter the URL or hostname
   - Set check interval (default: 60 seconds)
   - Save

## Configuration Tips

- **Notifications:** Set up notification channels in Settings → Notifications. Supports Telegram, Discord, Slack, email, Pushover, Gotify, and 90+ other services.
- **Status pages:** Create a public status page at Settings → Status Pages. Share the link with users to show service availability.
- **Docker monitoring:** With the Docker socket mounted, you can monitor container status directly.
- **Maintenance windows:** Schedule maintenance periods so expected downtime doesn't trigger alerts.
- **Reverse proxy:** Access over HTTPS with a reverse proxy. See our [reverse proxy guide](/foundations/reverse-proxy/).

## Backup & Migration

- **Backup:** The `data` folder contains the SQLite database with all your monitors, notifications, and history. Back it up regularly.
- **Export/Import:** Use Settings → Backup to export and import your configuration as JSON.

## Troubleshooting

- **Monitors showing down when services are up:** Check network connectivity from the container. If monitoring local services, make sure you're using the correct internal network addresses.
- **High memory usage:** If monitoring hundreds of endpoints, increase container memory limits or extend check intervals.

## Alternatives

[Gatus](/apps/gatus/) offers a similar feature set with config-as-code and Kubernetes-native support. See our [Uptime Kuma vs Gatus comparison](/compare/uptime-kuma-vs-gatus/) or the full [Best Self-Hosted Monitoring Tools](/best/monitoring/) roundup.

## Verdict

Uptime Kuma is the go-to self-hosted monitoring tool. Five minutes to set up, beautiful interface, and supports every notification channel you can think of. Monitor your self-hosted services, your websites, and anything else with an IP address. There's no reason not to run it.
