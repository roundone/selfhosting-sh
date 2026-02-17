---
title: "How to Self-Host Memos with Docker Compose"
description: "Step-by-step guide to self-hosting Memos with Docker Compose — a lightweight, privacy-first note taking and microblogging app."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "note-taking"
apps:
  - memos
tags:
  - self-hosted
  - memos
  - notes
  - docker
  - microblog
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Memos?

[Memos](https://www.usememos.com/) is a lightweight, self-hosted note-taking and microblogging app. Think of it as a private Twitter crossed with a quick-capture note tool. It's fast to deploy, fast to use, and stores everything in a single database. Memos replaces cloud services like Google Keep, Apple Notes, or Notion for quick captures — without the bloat. Built with Go and React, it starts in seconds and uses minimal resources.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 100 MB of free disk space (plus storage for uploads)
- 256 MB of RAM (minimum)
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  memos:
    image: neosmemo/memos:0.26.1
    container_name: memos
    restart: unless-stopped
    ports:
      - "5230:5230"
    volumes:
      - memos-data:/var/opt/memos

volumes:
  memos-data:
```

That's it. Memos is a single container with an embedded SQLite database. No external database, no Redis, no dependencies.

Start the service:

```bash
docker compose up -d
```

## Initial Setup

Open `http://your-server-ip:5230` in a browser. You'll see a setup page — create your admin account with a username and password.

After logging in, you're ready to start writing memos. The interface is intentionally minimal: a text input at the top, your memo timeline below.

## Configuration

### Database Options

Memos uses SQLite by default, which works well for personal use and small teams. For larger deployments, you can use PostgreSQL or MySQL:

**PostgreSQL:**

```yaml
services:
  memos:
    image: neosmemo/memos:0.26.1
    container_name: memos
    restart: unless-stopped
    ports:
      - "5230:5230"
    volumes:
      - memos-data:/var/opt/memos
    environment:
      MEMOS_DRIVER: postgres
      MEMOS_DSN: "postgresql://memos:your_password@memos-db:5432/memos?sslmode=disable"
    depends_on:
      - memos-db

  memos-db:
    image: postgres:16-alpine
    container_name: memos-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: memos
      POSTGRES_PASSWORD: your_password  # CHANGE THIS
      POSTGRES_DB: memos
    volumes:
      - memos-pgdata:/var/lib/postgresql/data

volumes:
  memos-data:
  memos-pgdata:
```

### Markdown Support

Memos supports Markdown in notes. Use `#tags` for quick tagging — Memos automatically creates filterable tags from hashtags in your notes. Code blocks, links, lists, and images all work.

### API Access

Memos exposes a REST and gRPC API for integrations. Useful for:

- Saving memos from scripts or automation tools
- Building custom clients
- Integrating with [n8n](/apps/n8n) or [Node-RED](/apps/node-red) workflows

Access the API at `http://your-server:5230/api/v1/`.

### Visibility Settings

Each memo can be set to:
- **Private** — only you can see it
- **Protected** — visible to all logged-in users
- **Public** — visible to anyone, including anonymous visitors

This makes Memos double as a simple public microblog if you want.

## Advanced Configuration (Optional)

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MEMOS_PORT` | `5230` | Server port |
| `MEMOS_MODE` | `prod` | Run mode (`prod`, `dev`, `demo`) |
| `MEMOS_DRIVER` | `sqlite` | Database driver (`sqlite`, `postgres`, `mysql`) |
| `MEMOS_DSN` | (auto) | Database connection string (required for postgres/mysql) |

### Custom Port

```yaml
environment:
  MEMOS_PORT: "8080"
ports:
  - "8080:8080"
```

### Telegram Bot Integration

Memos supports sending memos via Telegram bot. Configure in Settings > Memo-related > Telegram Bot Token. This lets you capture thoughts from your phone without opening the web UI.

## Reverse Proxy

Point your reverse proxy to `http://memos:5230`. No special configuration needed — Memos is a standard HTTP app.

**Nginx Proxy Manager:** Create a proxy host pointing to your server's IP on port 5230. Enable SSL.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for full instructions.

## Backup

### SQLite (default)

The entire database is in the `memos-data` volume at `/var/opt/memos/`. Back up this volume:

```bash
docker compose down
docker run --rm -v memos_memos-data:/data -v $(pwd):/backup alpine \
  tar -czf /backup/memos-backup-$(date +%Y%m%d).tar.gz /data
docker compose up -d
```

### PostgreSQL

Use `pg_dump` for the database, and back up the memos-data volume for uploaded files:

```bash
docker exec memos-db pg_dump -U memos memos > memos-db-$(date +%Y%m%d).sql
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Cannot Access Web UI After Start

**Symptom:** Browser shows connection refused on port 5230.

**Fix:** Check the container is running and healthy:

```bash
docker compose logs memos
```

If you changed `MEMOS_PORT`, make sure both the environment variable and the port mapping match.

### Memos Lost After Container Recreate

**Symptom:** All memos disappear after running `docker compose up -d` with a new image.

**Fix:** Ensure you're using a named volume (`memos-data:/var/opt/memos`), not an anonymous volume. Anonymous volumes are not reattached on recreate.

### Environment Variables with Underscores Not Parsed

**Symptom:** Environment variables containing underscores in their values are incorrectly parsed.

**Fix:** This was a known bug fixed in v0.26.1. Upgrade to the latest version. If stuck on an older version, avoid underscores in environment variable values.

### Tags Not Appearing in Sidebar

**Symptom:** You're using `#tags` in memos but they don't show up in the tag filter.

**Fix:** Tags must be followed by a space or line break. `#selfhosted` works, `#self-hosted` works, but `#tag.` (with period immediately after) may not be parsed correctly. Use spaces after tags.

## Resource Requirements

- **RAM:** ~50-80 MB idle (SQLite), ~100-150 MB with PostgreSQL
- **CPU:** Negligible. Single Go binary, minimal processing
- **Disk:** ~50 MB for the application. Database grows based on memo count and uploads

Memos is one of the lightest self-hosted apps available. It runs comfortably on a Raspberry Pi.

## Verdict

Memos is the best self-hosted option for quick-capture notes and microblogging. The deployment couldn't be simpler — one container, one volume, done. It starts in seconds, uses almost no resources, and the Markdown + hashtag system is intuitive.

It's not a replacement for full knowledge bases like [BookStack](/apps/bookstack) or [Outline](/apps/outline) — there's no document organization, no folders, no collaborative editing. Memos is for quick thoughts, daily logs, and fleeting notes. For that use case, nothing else is this lightweight and polished.

If you want a full Notion replacement, look at [Outline](/apps/outline) or [AppFlowy](/apps/appflowy). If you want quick notes that just work, Memos is it.

## Related

- [How to Self-Host BookStack](/apps/bookstack)
- [How to Self-Host Outline](/apps/outline)
- [How to Self-Host Trilium](/apps/trilium)
- [Best Self-Hosted Note Taking Apps](/best/note-taking)
- [Self-Hosted Alternatives to Notion](/replace/notion)
- [Self-Hosted Alternatives to Evernote](/replace/evernote)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
