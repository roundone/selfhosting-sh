---
title: "How to Self-Host Miniflux with Docker Compose"
description: "Deploy Miniflux with Docker Compose — a minimalist, opinionated RSS reader with fast performance and clean reading experience."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "rss-readers"
apps:
  - miniflux
tags:
  - self-hosted
  - miniflux
  - docker
  - rss
  - feed-reader
  - minimalist
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Miniflux?

[Miniflux](https://miniflux.app/) is an opinionated, minimalist RSS reader. Where FreshRSS gives you a feature-rich experience, Miniflux strips everything down to the essentials: subscribe to feeds, read articles, done. It's written in Go, compiles to a single binary, uses PostgreSQL for storage, and has a clean web UI that loads instantly. Miniflux also supports the Google Reader API and Fever API for mobile app sync, and has built-in integrations with services like Pinboard, Instapaper, Wallabag, and Matrix.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 256 MB of free RAM
- 500 MB of free disk space
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  miniflux:
    image: miniflux/miniflux:2.2.17
    container_name: miniflux
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: "postgres://miniflux:change_this_strong_password@miniflux_db/miniflux?sslmode=disable"
      RUN_MIGRATIONS: "1"                # Auto-run database migrations on startup
      CREATE_ADMIN: "1"                  # Create admin user on first run
      ADMIN_USERNAME: "admin"            # Admin username — CHANGE THIS
      ADMIN_PASSWORD: "change_this_password"  # Admin password — CHANGE THIS
    depends_on:
      miniflux_db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "/usr/bin/miniflux", "-healthcheck", "auto"]
      interval: 30s
      timeout: 10s
      retries: 3

  miniflux_db:
    image: postgres:16-alpine
    container_name: miniflux_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: miniflux
      POSTGRES_PASSWORD: change_this_strong_password    # Must match DATABASE_URL above
      POSTGRES_DB: miniflux
    volumes:
      - miniflux_db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U miniflux"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  miniflux_db:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8080` in your browser
2. Log in with the `ADMIN_USERNAME` and `ADMIN_PASSWORD` you set in the Compose file
3. After first login, remove `CREATE_ADMIN` and `ADMIN_PASSWORD` from your Compose file (they're only needed once)
4. Start adding feeds via **Feeds → Add Subscription**

The `hstore` PostgreSQL extension is created automatically when `RUN_MIGRATIONS=1` is set.

## Configuration

### Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POLLING_FREQUENCY` | `60` | Minutes between feed checks |
| `BATCH_SIZE` | `100` | Feeds fetched per polling cycle |
| `CLEANUP_ARCHIVE_READ_DAYS` | `-1` | Days to keep read articles (-1 = forever) |
| `CLEANUP_ARCHIVE_UNREAD_DAYS` | `180` | Days to keep unread articles |
| `FETCH_YOUTUBE_WATCH_TIME` | `0` | Fetch YouTube video durations |
| `LISTEN_ADDR` | `0.0.0.0:8080` | Bind address |
| `BASE_URL` | `http://localhost` | Public URL (set for reverse proxy) |

### API Access (Mobile Apps)

Miniflux supports the Google Reader API and Fever API:

- **Google Reader API:** `https://your-domain/v1/` — use your Miniflux credentials
- **Fever API:** Enable per-user under **Settings → Integrations → Fever**. Set a separate Fever password.

Compatible apps: NetNewsWire, Reeder, FeedMe, ReadKit, Fluent Reader.

### Full-Text Content Fetching

Miniflux can scrape full article content from feeds that only provide summaries. Enable per-feed:

1. Edit the feed settings
2. Check **Fetch original content**

Miniflux uses a built-in readability parser — no extensions needed.

## Advanced Configuration (Optional)

### OAuth2/OIDC Authentication

Miniflux supports Google and OIDC authentication:

```yaml
environment:
  OAUTH2_PROVIDER: "oidc"
  OAUTH2_CLIENT_ID: "your-client-id"
  OAUTH2_CLIENT_SECRET: "your-client-secret"
  OAUTH2_REDIRECT_URL: "https://rss.example.com/oauth2/oidc/callback"
  OAUTH2_OIDC_DISCOVERY_ENDPOINT: "https://auth.example.com/.well-known/openid-configuration"
  OAUTH2_USER_CREATION: "1"
```

### Webhooks and Integrations

Miniflux has built-in integrations for:
- Pinboard, Instapaper, Wallabag, Linkding, Shaarli (save articles)
- Matrix, Apprise, Ntfy (notifications)
- Telegram bot (read articles in Telegram)

Configure under **Settings → Integrations**.

## Reverse Proxy

Set `BASE_URL` to your public-facing domain:

```yaml
environment:
  BASE_URL: "https://rss.example.com"
```

Nginx Proxy Manager config:
- **Scheme:** http
- **Forward Hostname:** miniflux
- **Forward Port:** 8080

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for full configuration.

## Backup

Back up the PostgreSQL database:

```bash
docker compose exec miniflux_db pg_dump -U miniflux miniflux > miniflux-backup-$(date +%Y%m%d).sql
```

Restore:

```bash
cat miniflux-backup.sql | docker compose exec -T miniflux_db psql -U miniflux miniflux
```

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a complete backup approach.

## Troubleshooting

### "relation does not exist" Error on Startup

**Symptom:** Miniflux fails to start with PostgreSQL errors about missing tables.
**Fix:** Ensure `RUN_MIGRATIONS=1` is set. If the database was partially created, drop and recreate it:

```bash
docker compose exec miniflux_db psql -U miniflux -c "DROP DATABASE miniflux;"
docker compose exec miniflux_db psql -U miniflux -c "CREATE DATABASE miniflux;"
docker compose restart miniflux
```

### Feeds Stuck on "Waiting"

**Symptom:** Feeds never refresh, stuck in "Waiting for initial fetch" state.
**Fix:** Check the Miniflux logs for network errors. Common causes: DNS resolution failure inside the container, or outbound connections blocked by a firewall.

```bash
docker compose logs miniflux | grep -i error
```

### High CPU During Feed Refresh

**Symptom:** CPU spikes every polling cycle.
**Fix:** Reduce `BATCH_SIZE` (default 100) and increase `POLLING_FREQUENCY`. If you have hundreds of feeds, `BATCH_SIZE=50` and `POLLING_FREQUENCY=120` is more reasonable.

### Fever API Returns Empty Response

**Symptom:** Fever-compatible apps show no feeds or articles.
**Fix:** Make sure Fever is enabled under **Settings → Integrations → Fever** and you've set a Fever-specific password. The Fever API endpoint is `/fever/`.

## Resource Requirements

- **RAM:** ~30 MB idle, ~80 MB during feed refresh
- **CPU:** Very low — Go binary is extremely efficient
- **Disk:** ~50 MB for the application, PostgreSQL storage grows with article count

## Verdict

Miniflux is the best RSS reader if you value simplicity and speed above all else. It's faster than FreshRSS, uses less memory, and the UI is ruthlessly minimal — no clutter, no distractions, just your feeds. The trade-off: no extensions, no themes, and fewer customization options. If you want a full-featured reader with bells and whistles, use [FreshRSS](/apps/freshrss/). If you want the fastest, cleanest reading experience, Miniflux is the one.

## Related

- [Best Self-Hosted RSS Readers](/best/rss-readers/)
- [FreshRSS vs Miniflux](/compare/freshrss-vs-miniflux/)
- [How to Self-Host FreshRSS](/apps/freshrss/)
- [Replace Feedly with Self-Hosted RSS](/replace/feedly/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
