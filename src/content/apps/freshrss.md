---
title: "How to Self-Host FreshRSS with Docker Compose"
type: "app-guide"
app: "freshrss"
category: "rss-readers"
replaces: "Feedly"
difficulty: "beginner"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up FreshRSS, a self-hosted RSS reader, with Docker Compose. Follow any website or blog."
officialUrl: "https://freshrss.org"
githubUrl: "https://github.com/FreshRSS/FreshRSS"
defaultPort: 8080
minRam: "128MB"
---

## What is FreshRSS?

FreshRSS is a self-hosted RSS feed reader. Subscribe to any website, blog, or news source and read everything in one place — like Feedly, but on your own server. It supports multiple users, Google Reader API (for mobile apps), keyboard shortcuts, and full-text content retrieval.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- Any server — FreshRSS is very lightweight

## Docker Compose Configuration

```yaml
# docker-compose.yml for FreshRSS
# Tested with FreshRSS 1.24+

services:
  freshrss:
    container_name: freshrss
    image: freshrss/freshrss:latest
    ports:
      - "8080:80"
    volumes:
      - ./data:/var/www/FreshRSS/data
      - ./extensions:/var/www/FreshRSS/extensions
    environment:
      - TZ=America/New_York
      - CRON_MIN=2,32    # Refresh feeds every 30 minutes
    restart: unless-stopped
```

## Step-by-Step Setup

1. **Create a directory:**
   ```bash
   mkdir ~/freshrss && cd ~/freshrss
   ```

2. **Create the `docker-compose.yml`** with the config above.

3. **Start the container:**
   ```bash
   docker compose up -d
   ```

4. **Run the setup wizard** at `http://your-server-ip:8080`

5. **Create your admin account** and configure the database (SQLite is fine for personal use).

6. **Add your feeds** — paste RSS URLs or use the built-in feed discovery.

7. **Connect a mobile app** — enable the Google Reader API in settings, then connect with apps like NetNewsWire, Reeder, or FeedMe.

## Configuration Tips

- **Google Reader API:** Enable at Administration → Authentication → Allow API access. This lets you use polished mobile RSS apps.
- **Full-text retrieval:** Install the Full-Text RSS extension to fetch full article content for feeds that only provide summaries.
- **OPML import:** Import your existing feed subscriptions from Feedly or any other reader via OPML file.
- **Keyboard shortcuts:** FreshRSS has extensive keyboard shortcuts for fast reading — press `?` to see them.
- **Reverse proxy:** Access from anywhere over HTTPS. See our [reverse proxy guide](/foundations/reverse-proxy/).

## Backup & Migration

- **Backup:** The `data` folder contains your database, configuration, and feed data.
- **Export:** Export your feeds as OPML from the settings page for portability.

## Troubleshooting

- **Feeds not updating:** Check that `CRON_MIN` is set in the environment variables. Verify cron is running inside the container.
- **Mobile app can't connect:** Ensure API access is enabled and test with the correct URL (usually `https://your-domain/api/greader.php`).

## Alternatives

[Miniflux](/apps/miniflux/) is a minimalist alternative with a cleaner interface and built-in integrations. See our [FreshRSS vs Miniflux comparison](/compare/freshrss-vs-miniflux/) or the full [Best Self-Hosted RSS Readers](/best/rss-readers/) roundup.

## Verdict

FreshRSS is the most capable self-hosted RSS reader. It handles thousands of feeds without breaking a sweat, supports every major mobile RSS app through its API, and uses minimal resources. Take back control of what you read — no algorithmic feeds, no ads, just the content you chose.
