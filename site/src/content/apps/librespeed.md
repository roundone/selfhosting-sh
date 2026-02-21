---
title: "How to Self-Host LibreSpeed with Docker Compose"
description: "Step-by-step guide to self-hosting LibreSpeed with Docker for a private internet speed test on your network."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "speed-test"
apps:
  - librespeed
tags:
  - docker
  - speed-test
  - network
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is LibreSpeed?

LibreSpeed is a self-hosted speed test that measures download speed, upload speed, ping, and jitter between your device and your server. It's a private alternative to Ookla's Speedtest.net — no third-party tracking, no ads, and results stay on your server. Useful for testing internal network speeds, VPN throughput, or providing a speed test for users on your network. [Official site](https://librespeed.org/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 100 MB of free disk space
- 128 MB of RAM minimum

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  librespeed:
    image: lscr.io/linuxserver/librespeed:5.4.1
    container_name: librespeed
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
      - PASSWORD=change-this-admin-password  # Admin panel password
      - CUSTOM_RESULTS=true                  # Store test results
      - DB_TYPE=sqlite                       # sqlite or mysql
    volumes:
      - ./config:/config
    ports:
      - "8080:80"
    restart: unless-stopped
```

**Environment variables:**

| Variable | Purpose | Required |
|----------|---------|----------|
| `PUID` | User ID for file permissions | Yes |
| `PGID` | Group ID for file permissions | Yes |
| `TZ` | Timezone | Yes |
| `PASSWORD` | Admin password for results panel | Yes — **must change** |
| `CUSTOM_RESULTS` | Enable result storage | Recommended |
| `DB_TYPE` | Database type (sqlite or mysql) | No (default: sqlite) |

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8080`
2. The speed test is immediately available — click **Start** to run a test
3. Results are stored if `CUSTOM_RESULTS=true`
4. Access the results panel at `http://your-server-ip:8080/results/stats.php` with your admin password

## Configuration

### Result Storage with MySQL

For higher-traffic deployments, use MySQL/MariaDB instead of SQLite:

```yaml
services:
  librespeed:
    image: lscr.io/linuxserver/librespeed:5.4.1
    container_name: librespeed
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
      - PASSWORD=change-this-admin-password
      - CUSTOM_RESULTS=true
      - DB_TYPE=mysql
      - DB_HOSTNAME=librespeed_db
      - DB_NAME=librespeed
      - DB_USERNAME=librespeed
      - DB_PASSWORD=change-this-db-password
    volumes:
      - ./config:/config
    ports:
      - "8080:80"
    depends_on:
      - librespeed_db
    restart: unless-stopped

  librespeed_db:
    image: mariadb:11.7
    container_name: librespeed_db
    environment:
      - MYSQL_ROOT_PASSWORD=change-this-root-password
      - MYSQL_DATABASE=librespeed
      - MYSQL_USER=librespeed
      - MYSQL_PASSWORD=change-this-db-password
    volumes:
      - db-data:/var/lib/mysql
    restart: unless-stopped

volumes:
  db-data:
```

### Telemetry Settings

LibreSpeed stores test results with optional client information:

- IP address (can be anonymized)
- ISP information (via IP geolocation)
- Download/upload speeds
- Ping and jitter
- Timestamp

Configure what's collected in `config/settings.php`.

## Advanced Configuration (Optional)

### Multiple Test Servers

If you have servers in different locations, configure them as test endpoints. Users can select which server to test against.

### Customizing the UI

Mount a custom `index.html` to rebrand the speed test:

```yaml
volumes:
  - ./custom-index.html:/config/www/index.html
```

### HTTPS

When behind a reverse proxy with SSL, LibreSpeed works without additional configuration. For direct HTTPS, use [Caddy](/apps/caddy/) or [Nginx Proxy Manager](/apps/nginx-proxy-manager/) in front.

## Reverse Proxy

Example Nginx Proxy Manager configuration:

- **Scheme:** http
- **Forward Hostname:** librespeed
- **Forward Port:** 80

[Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

## Backup

```bash
tar -czf librespeed-backup-$(date +%Y%m%d).tar.gz ./config
```

[Backup Strategy](/foundations/backup-3-2-1-rule/)

## Troubleshooting

### Speed Test Shows Very Low Results

**Symptom:** Results show much lower speeds than expected.
**Fix:** The test measures speed between your client and the Docker container. If the server has limited bandwidth, results will be capped. For LAN testing, ensure both devices are on the same subnet. Check if the Docker network is the bottleneck — test with `host` networking mode.

### Results Not Saving

**Symptom:** Tests complete but results don't appear in the admin panel.
**Fix:** Ensure `CUSTOM_RESULTS=true` is set. Check that the `/config` volume is writable (correct PUID/PGID). If using MySQL, verify the database connection.

### Test Fails to Start

**Symptom:** Clicking "Start" does nothing or shows an error.
**Fix:** Check browser console for JavaScript errors. LibreSpeed requires a modern browser. If behind a reverse proxy, ensure WebSocket connections are passed through.

## Resource Requirements

- **RAM:** ~50 MB
- **CPU:** Low (spikes during active tests)
- **Disk:** ~10 MB for the application, grows minimally with results

## Verdict

LibreSpeed is the go-to self-hosted speed test. It's simple, works out of the box, and gives you the exact same functionality as Speedtest.net without the tracking. Deploy it on your LAN to test internal network speeds, or expose it publicly as a service for your users. For tracking speed test results over time with historical charts, pair it with [Speedtest Tracker](/apps/speedtest-tracker/).

## FAQ

### LibreSpeed vs Speedtest Tracker?

Different tools. LibreSpeed is a speed test you run manually in your browser. Speedtest Tracker automatically runs tests on a schedule and tracks results over time. Many people run both — LibreSpeed for manual tests, Speedtest Tracker for monitoring.

### Can I test LAN speeds with LibreSpeed?

Yes. Deploy LibreSpeed on your server and test from devices on the same network. Results measure the throughput between your device and the server, including network overhead.

### Is LibreSpeed accurate?

For measuring the connection between your device and the server, yes. For measuring your ISP speed, you need the server to have more bandwidth than your ISP connection — otherwise the server is the bottleneck.

## Related

- [How to Self-Host Speedtest Tracker](/apps/speedtest-tracker/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Home Network Setup](/foundations/home-network-setup/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
- [Monitoring Basics](/foundations/monitoring-basics/)
- [Best Self-Hosted Monitoring Tools](/best/monitoring/)
