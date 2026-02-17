---
title: "How to Self-Host Speedtest Tracker with Docker"
description: "Step-by-step guide to self-hosting Speedtest Tracker with Docker for automated internet speed monitoring over time."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "speed-test"
apps:
  - speedtest-tracker
tags:
  - docker
  - speed-test
  - monitoring
  - network
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Speedtest Tracker?

Speedtest Tracker runs automated internet speed tests on a schedule and displays results in a dashboard with historical charts. Unlike [LibreSpeed](/apps/librespeed) (which is a manual test), Speedtest Tracker runs tests unattended every hour (or whatever interval you set) and tracks download speed, upload speed, and ping over days, weeks, and months. It uses Ookla's Speedtest CLI under the hood. [Official site](https://docs.speedtest-tracker.dev/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 500 MB of free disk space
- 256 MB of RAM minimum

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  speedtest-tracker:
    image: lscr.io/linuxserver/speedtest-tracker:1.1.1
    container_name: speedtest-tracker
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
      - DB_CONNECTION=sqlite
      - APP_KEY=base64:$(openssl rand -base64 32)  # Generate once, keep fixed
      - SPEEDTEST_SCHEDULE="0 * * * *"              # Every hour
      - DISPLAY_TIMEZONE=America/New_York
    volumes:
      - ./config:/config
    ports:
      - "8080:80"
      - "8443:443"
    restart: unless-stopped
```

**Generate `APP_KEY` before starting:**

```bash
echo "APP_KEY=base64:$(openssl rand -base64 32)"
```

Copy the output and paste it into your Docker Compose file. This key must remain consistent — changing it invalidates sessions.

**Environment variables:**

| Variable | Purpose | Required |
|----------|---------|----------|
| `PUID` | User ID | Yes |
| `PGID` | Group ID | Yes |
| `TZ` | Server timezone | Yes |
| `APP_KEY` | Laravel encryption key | Yes — generate once |
| `DB_CONNECTION` | Database type (sqlite, mysql, pgsql) | Yes |
| `SPEEDTEST_SCHEDULE` | Cron schedule for tests | No (default: hourly) |
| `DISPLAY_TIMEZONE` | Dashboard display timezone | No |

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8080`
2. Log in with default credentials: `admin@example.com` / `password`
3. **Change the password immediately** under user settings
4. The first speed test runs automatically based on your schedule
5. Manually trigger a test from the dashboard to verify everything works

## Configuration

### Test Schedule

Set how often tests run via the `SPEEDTEST_SCHEDULE` environment variable (cron syntax):

| Schedule | Cron Expression | Description |
|----------|----------------|-------------|
| Every hour | `0 * * * *` | Recommended default |
| Every 30 min | `*/30 * * * *` | More granular |
| Every 6 hours | `0 */6 * * *` | Low bandwidth impact |
| Twice daily | `0 6,18 * * *` | Morning and evening |

### Notification Alerts

Configure alerts when speed drops below a threshold:

- In the dashboard: **Settings → Notifications**
- Supported channels: Email, Discord, Slack, Telegram
- Set thresholds: alert when download < X Mbps or ping > Y ms

### Selecting Specific Servers

By default, Speedtest Tracker uses the nearest Ookla server. You can pin a specific server:

1. Find server IDs: `docker compose exec speedtest-tracker speedtest --list`
2. Set `SPEEDTEST_SERVERS=12345` in environment variables

## Advanced Configuration (Optional)

### PostgreSQL for Heavy Use

For long-term data retention with many tests per day:

```yaml
services:
  speedtest-tracker:
    image: lscr.io/linuxserver/speedtest-tracker:1.1.1
    container_name: speedtest-tracker
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
      - DB_CONNECTION=pgsql
      - DB_HOST=speedtest_db
      - DB_PORT=5432
      - DB_DATABASE=speedtest
      - DB_USERNAME=speedtest
      - DB_PASSWORD=change-this-password
      - APP_KEY=base64:your-generated-key
    volumes:
      - ./config:/config
    ports:
      - "8080:80"
    depends_on:
      - speedtest_db
    restart: unless-stopped

  speedtest_db:
    image: postgres:16-alpine
    container_name: speedtest_db
    environment:
      - POSTGRES_DB=speedtest
      - POSTGRES_USER=speedtest
      - POSTGRES_PASSWORD=change-this-password
    volumes:
      - db-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  db-data:
```

### Grafana Integration

Export Speedtest Tracker data to [Grafana](/apps/grafana) for custom dashboards:

1. Use the Speedtest Tracker API: `http://speedtest-tracker:80/api/v1/results`
2. Create a JSON data source in Grafana pointing to this endpoint
3. Build panels showing download/upload trends, ISP reliability, time-of-day patterns

## Reverse Proxy

Example Nginx Proxy Manager configuration:

- **Scheme:** http
- **Forward Hostname:** speedtest-tracker
- **Forward Port:** 80

[Reverse Proxy Setup](/foundations/reverse-proxy-explained)

## Backup

```bash
tar -czf speedtest-tracker-backup-$(date +%Y%m%d).tar.gz ./config
```

[Backup Strategy](/foundations/backup-3-2-1-rule)

## Troubleshooting

### Tests Fail with "No Servers Available"

**Symptom:** Speed tests return errors about no available servers.
**Fix:** This usually means DNS resolution is failing inside the container. Check that the container can reach the internet: `docker compose exec speedtest-tracker ping -c 3 google.com`. Set custom DNS in Docker Compose if your DNS is unreliable.

### Inaccurate Speed Results

**Symptom:** Results are much lower than expected or inconsistent.
**Fix:** Docker bridge networking adds overhead. For the most accurate results, use `network_mode: host`. Also ensure no other bandwidth-heavy services are running during tests.

### APP_KEY Error on Startup

**Symptom:** Container fails to start with APP_KEY error.
**Fix:** Generate a valid key: `echo "base64:$(openssl rand -base64 32)"`. The key must start with `base64:` and be exactly 44 characters after the prefix.

### Login Page Keeps Redirecting

**Symptom:** Can't log in — page refreshes after entering credentials.
**Fix:** Clear browser cookies for the site. If behind a reverse proxy, ensure `APP_URL` matches the public URL and the proxy forwards the `Host` header correctly.

## Resource Requirements

- **RAM:** ~150 MB idle
- **CPU:** Low (spikes during tests)
- **Disk:** ~200 MB for application, grows with test history

## Verdict

Speedtest Tracker is the best way to monitor your internet connection quality over time. It answers "is my ISP delivering the speed I'm paying for?" with hard data. The dashboard makes it easy to spot patterns — slowdowns at peak hours, degradation over weeks, or sudden drops. Pair it with [LibreSpeed](/apps/librespeed) for manual LAN speed tests.

## FAQ

### Speedtest Tracker vs LibreSpeed?

Complementary tools. Speedtest Tracker: automated, scheduled, tests against Ookla servers (measures ISP speed). LibreSpeed: manual, tests against your own server (measures internal network speed).

### Does Speedtest Tracker use a lot of bandwidth?

Each test uses 50-200 MB depending on your connection speed. Running hourly uses 1.2-4.8 GB/day. Adjust the schedule if you have metered bandwidth.

### Can I use a non-Ookla speed test backend?

Speedtest Tracker is built around Ookla's CLI. For a fully self-hosted alternative that doesn't depend on Ookla servers, use LibreSpeed instead.

## Related

- [How to Self-Host LibreSpeed](/apps/librespeed)
- [How to Self-Host Grafana](/apps/grafana)
- [How to Self-Host Uptime Kuma](/apps/uptime-kuma)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Best Self-Hosted Monitoring Tools](/best/monitoring)
- [Home Network Setup](/foundations/home-network-setup)
