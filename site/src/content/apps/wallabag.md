---
title: "How to Self-Host Wallabag with Docker Compose"
description: "Deploy Wallabag with Docker Compose — a self-hosted read-later app that saves articles for offline reading with full-text search."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "bookmarks-read-later"
apps:
  - wallabag
tags:
  - self-hosted
  - wallabag
  - docker
  - read-later
  - bookmarks
  - pocket-alternative
  - instapaper-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Wallabag?

[Wallabag](https://wallabag.org/) is a self-hosted read-later application. Save articles from the web, strip away the clutter, and read them later in a clean, distraction-free format — on any device. It's a direct replacement for Pocket and Instapaper. Wallabag extracts article content, stores it locally, provides full-text search, supports tagging, and has native mobile apps for Android and iOS. It also integrates with e-readers, RSS readers, and browser extensions.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM
- 1 GB of free disk space
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  wallabag:
    image: wallabag/wallabag:2.6.14
    container_name: wallabag
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      MYSQL_ROOT_PASSWORD: "change_this_root_password"        # CHANGE THIS
      SYMFONY__ENV__DATABASE_DRIVER: "pdo_pgsql"
      SYMFONY__ENV__DATABASE_HOST: "wallabag_db"
      SYMFONY__ENV__DATABASE_PORT: "5432"
      SYMFONY__ENV__DATABASE_NAME: "wallabag"
      SYMFONY__ENV__DATABASE_USER: "wallabag"
      SYMFONY__ENV__DATABASE_PASSWORD: "change_this_strong_password"  # Must match PostgreSQL
      SYMFONY__ENV__DATABASE_CHARSET: "utf8"
      SYMFONY__ENV__DOMAIN_NAME: "http://localhost:8080"      # Set to your public URL
      SYMFONY__ENV__SERVER_NAME: "Wallabag"
      SYMFONY__ENV__SECRET: "change_this_to_random_string"    # CHANGE THIS — generate with: openssl rand -hex 32
      SYMFONY__ENV__FOSUSER_REGISTRATION: "false"             # Disable public registration
      SYMFONY__ENV__FOSUSER_CONFIRMATION: "false"
    volumes:
      - wallabag_images:/var/www/wallabag/web/assets/images
      - wallabag_data:/var/www/wallabag/data
    depends_on:
      wallabag_db:
        condition: service_healthy
      wallabag_redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s

  wallabag_db:
    image: postgres:16-alpine
    container_name: wallabag_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: wallabag
      POSTGRES_PASSWORD: change_this_strong_password          # Must match SYMFONY__ENV__DATABASE_PASSWORD
      POSTGRES_DB: wallabag
    volumes:
      - wallabag_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wallabag"]
      interval: 10s
      timeout: 5s
      retries: 5

  wallabag_redis:
    image: redis:7-alpine
    container_name: wallabag_redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  wallabag_images:
  wallabag_data:
  wallabag_pgdata:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Wait 30-60 seconds for database migrations to complete on first start
2. Open `http://your-server-ip:8080` in your browser
3. Default credentials: `wallabag` / `wallabag`
4. Change your password immediately under **Config → User Information**
5. Install the browser extension for one-click saving

## Configuration

### Browser Extensions

- **Firefox:** [Wallabagger](https://addons.mozilla.org/firefox/addon/wallabagger/)
- **Chrome:** [Wallabagger](https://chrome.google.com/webstore/detail/wallabagger/)

Configure with your Wallabag URL and generate an API client ID/secret under **API clients management** in Wallabag settings.

### Mobile Apps

- **Android:** [Wallabag](https://play.google.com/store/apps/details?id=fr.gaulupeau.apps.InThePoche) (official)
- **iOS:** [Wallabag](https://apps.apple.com/app/wallabag-2-official/id1170800946) (official)

Both apps support offline reading and sync.

### Import from Pocket/Instapaper

Wallabag has built-in importers:

1. Go to **Config → Import**
2. Select your source (Pocket, Instapaper, Pinboard, Firefox, Chrome, and more)
3. Follow the instructions to authorize and import

### Tagging Rules

Automatically tag articles based on content:

1. Go to **Config → Tagging Rules**
2. Add rules like: `title matches "Docker"` → tag: `docker`
3. Rules apply to new articles as they're saved

### SMTP for Email Features

```yaml
environment:
  SYMFONY__ENV__MAILER_DSN: "smtp://user:password@smtp.example.com:587"
  SYMFONY__ENV__FROM_EMAIL: "wallabag@example.com"
```

## Advanced Configuration (Optional)

### RSS Feeds

Wallabag generates RSS feeds for your saved articles — useful for syncing with RSS readers like [FreshRSS](/apps/freshrss) or [Miniflux](/apps/miniflux):

1. Go to **Config → RSS**
2. Generate a token
3. Use the feed URLs provided

### E-Reader Integration

Send articles to your Kindle or Kobo:

```yaml
environment:
  SYMFONY__ENV__MAILER_DSN: "smtp://user:password@smtp.example.com:587"
```

Then configure under **Config → Send to Kindle/Kobo** with your device email.

### API Usage

Wallabag exposes a REST API for automation:

```bash
# Get an OAuth token
curl -X POST "http://localhost:8080/oauth/v2/token" \
  -d "grant_type=password&client_id=YOUR_CLIENT_ID&client_secret=YOUR_SECRET&username=wallabag&password=yourpass"

# Save a URL
curl -X POST "http://localhost:8080/api/entries.json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "url=https://example.com/article"
```

## Reverse Proxy

Set `SYMFONY__ENV__DOMAIN_NAME` to your public URL:

```yaml
SYMFONY__ENV__DOMAIN_NAME: "https://read.example.com"
```

Nginx Proxy Manager config:
- **Scheme:** http
- **Forward Hostname:** wallabag
- **Forward Port:** 80

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for full configuration.

## Backup

```bash
# Database
docker compose exec wallabag_db pg_dump -U wallabag wallabag > wallabag-backup-$(date +%Y%m%d).sql

# Article images
docker run --rm -v wallabag_images:/data -v $(pwd):/backup alpine \
  tar czf /backup/wallabag-images-$(date +%Y%m%d).tar.gz /data
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a complete backup approach.

## Troubleshooting

### "Internal Server Error" on First Access

**Symptom:** 500 error when accessing Wallabag for the first time.
**Fix:** Database migrations may not have completed. Check the logs:

```bash
docker compose logs wallabag | grep -i error
```

Wait 60 seconds and try again. If persistent, restart the container. Wallabag runs migrations automatically on startup.

### Articles Not Being Parsed Correctly

**Symptom:** Saved articles show only the URL or raw HTML instead of clean content.
**Fix:** Wallabag uses PHP libraries for content extraction. Some sites block server-side fetching. Try updating the site config rules:

```bash
docker compose exec wallabag bin/console wallabag:install --env=prod
```

### Mobile App Can't Connect

**Symptom:** Android/iOS app reports connection errors.
**Fix:** Create an API client under **Config → API clients management** in the web UI. Use the generated Client ID and Client Secret in the app. Ensure your URL is accessible from your phone's network.

### Slow Performance with Many Articles

**Symptom:** Page loads slow after saving thousands of articles.
**Fix:** Ensure PostgreSQL (not SQLite) is configured. Add Redis for caching (already included in the Compose above). If still slow, increase PHP memory:

```yaml
environment:
  PHP_MEMORY_LIMIT: "256M"
```

## Resource Requirements

- **RAM:** ~150 MB idle, ~300 MB during article processing
- **CPU:** Low — content parsing is lightweight
- **Disk:** ~200 MB for the application, plus storage for article images and content

## Verdict

Wallabag is the best self-hosted read-later app. It does one thing well: save articles for clean, distraction-free reading later. The mobile apps work offline, the browser extensions make saving effortless, and the Pocket/Instapaper import makes migration painless. It's not a bookmark manager — if you need collections, team sharing, and page archiving, use [Linkwarden](/apps/linkwarden). But for personal read-later use, Wallabag is exactly right.

## Related

- [Best Self-Hosted Bookmark & Read Later Apps](/best/bookmarks-read-later)
- [Linkwarden vs Wallabag](/compare/linkwarden-vs-wallabag)
- [Wallabag vs Hoarder](/compare/wallabag-vs-hoarder)
- [Replace Pocket with Self-Hosted Tools](/replace/pocket)
- [Replace Instapaper with Self-Hosted Tools](/replace/instapaper)
- [How to Self-Host Linkwarden](/apps/linkwarden)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
