---
title: "How to Self-Host FreshRSS with Docker Compose"
description: "Deploy FreshRSS with Docker Compose — a fast, self-hosted RSS aggregator with full-text search, API support, and mobile sync."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "rss-readers"
apps:
  - freshrss
tags:
  - self-hosted
  - freshrss
  - docker
  - rss
  - feed-reader
  - feedly-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is FreshRSS?

[FreshRSS](https://freshrss.org/) is a self-hosted RSS and Atom feed aggregator. It replaces services like Feedly, Inoreader, and NewsBlur with something you fully control. FreshRSS supports multiple users, full-text search, feed categorization, the Google Reader API (for mobile app sync), WebSub for real-time updates, and extensions for additional functionality. It's lightweight, fast, and handles thousands of feeds without breaking a sweat.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM (minimum)
- 1 GB of free disk space
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  freshrss:
    image: freshrss/freshrss:1.28.1
    container_name: freshrss
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      TZ: "America/New_York"            # Your timezone
      CRON_MIN: "1,31"                  # Feed refresh schedule (minutes past the hour)
    volumes:
      - freshrss_data:/var/www/FreshRSS/data
      - freshrss_extensions:/var/www/FreshRSS/extensions
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  freshrss_data:
  freshrss_extensions:
```

FreshRSS uses SQLite by default, which works well for single-user or small multi-user setups. For larger deployments, use PostgreSQL:

```yaml
services:
  freshrss:
    image: freshrss/freshrss:1.28.1
    container_name: freshrss
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      TZ: "America/New_York"
      CRON_MIN: "1,31"
    volumes:
      - freshrss_data:/var/www/FreshRSS/data
      - freshrss_extensions:/var/www/FreshRSS/extensions
    depends_on:
      freshrss_db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3

  freshrss_db:
    image: postgres:16-alpine
    container_name: freshrss_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: freshrss
      POSTGRES_PASSWORD: change_this_strong_password    # CHANGE THIS
      POSTGRES_DB: freshrss
    volumes:
      - freshrss_db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U freshrss"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  freshrss_data:
  freshrss_extensions:
  freshrss_db:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8080` in your browser
2. FreshRSS walks you through a setup wizard:
   - **Language:** Select your preferred language
   - **Database:** Choose SQLite (simple) or PostgreSQL (if you configured it above — host: `freshrss_db`, port: `5432`, user: `freshrss`, password: your password, database: `freshrss`)
   - **Admin account:** Create your admin username and password
3. After setup, log in and start adding feeds

## Configuration

### Feed Refresh Schedule

The `CRON_MIN` environment variable controls when feeds are refreshed. Examples:

- `"1,31"` — refresh at :01 and :31 past every hour (default)
- `"*/15"` — refresh every 15 minutes
- `"2,32"` — offset by a minute to reduce load spikes

### API Access (Mobile Apps)

FreshRSS supports the Google Reader API and Fever API for mobile app sync:

1. Go to **Settings → Authentication**
2. Check **Allow API access**
3. Set an **API password** (separate from your login password)
4. Mobile apps that work with FreshRSS:
   - **Android:** FeedMe, Readrops, EasyRSS
   - **iOS:** NetNewsWire, Reeder, lire

API endpoint: `https://your-domain/api/greader.php`

### Extensions

FreshRSS has a built-in extension system. Install extensions by placing them in the `extensions` volume:

```bash
docker compose exec freshrss sh -c "cd /var/www/FreshRSS/extensions && \
  git clone https://github.com/FreshRSS/Extensions.git"
```

Enable extensions under **Settings → Extensions**.

## Advanced Configuration (Optional)

### WebSub (Real-Time Updates)

FreshRSS supports WebSub (formerly PubSubHubbub) for instant feed updates instead of polling:

1. Go to **Settings → System configuration**
2. Set **Base URL** to your public-facing URL
3. Enable WebSub — feeds that support it push updates to FreshRSS in real time

### Full-Text Retrieval

FreshRSS can fetch full article content from truncated feeds using [XPath](https://freshrss.github.io/FreshRSS/en/Users/Article_CSS_Selectors.html) or CSS selectors per feed, or using the **Full-Text RSS** extension.

### LDAP Authentication

For team deployments, FreshRSS supports LDAP via the `HTTP_AUTH` method and an external reverse proxy doing LDAP authentication.

## Reverse Proxy

FreshRSS works behind any reverse proxy. Set the `Base URL` in FreshRSS settings to match your domain.

Example Nginx Proxy Manager config:
- **Scheme:** http
- **Forward Hostname:** freshrss (container name)
- **Forward Port:** 80
- **Enable WebSocket Support:** Yes (for real-time features)

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for full configuration.

## Backup

Back up the `freshrss_data` volume — it contains your configuration, user data, and SQLite database (if using SQLite). If using PostgreSQL, also back up the `freshrss_db` volume or use `pg_dump`.

```bash
# SQLite setup
docker run --rm -v freshrss_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/freshrss-backup-$(date +%Y%m%d).tar.gz /data

# PostgreSQL
docker compose exec freshrss_db pg_dump -U freshrss freshrss > freshrss-backup.sql
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a complete backup approach.

## Troubleshooting

### Feeds Not Updating

**Symptom:** Feeds show stale content, no new articles appearing.
**Fix:** Check that `CRON_MIN` is set correctly in your environment variables. Verify the cron is running:

```bash
docker compose exec freshrss cat /var/log/cron.log
```

If cron isn't running, restart the container. FreshRSS starts cron automatically on container start.

### API Returns 403 Forbidden

**Symptom:** Mobile apps can't connect, API returns 403.
**Fix:** Enable API access in **Settings → Authentication** and set a separate API password. Make sure your reverse proxy passes the `Authorization` header.

### High Memory Usage with Many Feeds

**Symptom:** Container using excessive RAM with 500+ feeds.
**Fix:** Reduce the number of articles retained per feed in **Settings → Reading → Article retention**. Switch from SQLite to PostgreSQL for better performance with large datasets.

### Cannot Log In After Update

**Symptom:** Login fails after upgrading FreshRSS version.
**Fix:** Clear the browser cache or try incognito mode. If persistent, run the database migration manually:

```bash
docker compose exec freshrss php ./cli/reconfigure.php
```

## Resource Requirements

- **RAM:** ~50 MB idle, ~150 MB during feed refresh with 200+ feeds
- **CPU:** Very low — negligible except during feed refresh
- **Disk:** ~100 MB for the application, plus storage for cached articles (varies by retention settings)

## Verdict

FreshRSS is the best self-hosted RSS reader for most people. It's lightweight, feature-rich, supports mobile app sync via Google Reader API, and handles thousands of feeds reliably. If you want a single-binary, minimalist alternative, look at [Miniflux](/apps/miniflux). But for most users, FreshRSS hits the sweet spot of features, performance, and ease of setup.

## Related

- [Best Self-Hosted RSS Readers](/best/rss-readers)
- [FreshRSS vs Miniflux](/compare/freshrss-vs-miniflux)
- [Replace Feedly with Self-Hosted RSS](/replace/feedly)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting)
