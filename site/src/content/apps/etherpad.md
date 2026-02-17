---
title: "How to Self-Host Etherpad with Docker Compose"
description: "Step-by-step guide to self-hosting Etherpad with Docker Compose for real-time collaborative text editing without account signups."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "note-taking"
apps:
  - etherpad
tags:
  - self-hosted
  - etherpad
  - collaboration
  - docker
  - notes
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Etherpad?

[Etherpad](https://etherpad.org/) is a self-hosted, real-time collaborative text editor. Open a pad, share the link, and anyone can start typing — no accounts needed. Each user gets a color, and edits appear instantly. It's the original open-source Google Docs alternative, focused purely on collaborative writing. Etherpad has been around since 2008 (originally by Google, then open-sourced) and remains actively maintained.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 500 MB of free disk space
- 256 MB of RAM (minimum)
- A domain name (optional, for sharing pads)

## Docker Compose Configuration

### Simple Setup (SQLite — DirtyDB)

For quick testing or personal use:

```yaml
services:
  etherpad:
    image: etherpad/etherpad:2.3.0
    container_name: etherpad
    restart: unless-stopped
    ports:
      - "9001:9001"
    environment:
      TITLE: "My Etherpad"
      DEFAULT_PAD_TEXT: ""
      ADMIN_PASSWORD: "your_admin_password"  # CHANGE THIS
    volumes:
      - etherpad-data:/opt/etherpad-lite/var

volumes:
  etherpad-data:
```

### Production Setup (PostgreSQL)

For reliable, multi-user deployments:

```yaml
services:
  etherpad:
    image: etherpad/etherpad:2.3.0
    container_name: etherpad
    restart: unless-stopped
    ports:
      - "9001:9001"
    environment:
      TITLE: "Team Pad"
      DEFAULT_PAD_TEXT: ""
      ADMIN_PASSWORD: "your_admin_password"  # CHANGE THIS — for /admin panel

      # Database — PostgreSQL
      DB_TYPE: "postgres"
      DB_HOST: "etherpad-db"
      DB_PORT: "5432"
      DB_NAME: "etherpad"
      DB_USER: "etherpad"
      DB_PASS: "your_db_password"  # CHANGE THIS — must match PostgreSQL

      # Trust reverse proxy headers
      TRUST_PROXY: "true"
    volumes:
      - etherpad-data:/opt/etherpad-lite/var
    depends_on:
      etherpad-db:
        condition: service_healthy

  etherpad-db:
    image: postgres:16-alpine
    container_name: etherpad-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: etherpad
      POSTGRES_PASSWORD: your_db_password  # CHANGE THIS
      POSTGRES_DB: etherpad
    volumes:
      - etherpad-pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U etherpad"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  etherpad-data:
  etherpad-pgdata:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

Open `http://your-server-ip:9001`. You'll see the Etherpad homepage with a "New Pad" button. Click it to create your first pad. No login required — pads are accessible by URL.

**Admin panel:** Visit `/admin` and log in with the `ADMIN_PASSWORD` you set. From here you can manage plugins, view active pads, and configure settings.

## Configuration

### Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TITLE` | `Etherpad` | Page title shown in browser tab |
| `DEFAULT_PAD_TEXT` | Welcome text | Text shown in new pads |
| `ADMIN_PASSWORD` | (none) | Password for the `/admin` panel |
| `DB_TYPE` | `dirty` | Database type: `dirty`, `postgres`, `mysql`, `sqlite` |
| `TRUST_PROXY` | `false` | Set to `true` when behind a reverse proxy |
| `REQUIRE_SESSION` | `false` | Require users to have a session (login) |
| `EDIT_ONLY` | `false` | Hide everything except the editor |
| `PAD_OPTIONS_NO_COLORS` | `false` | Disable author colors |
| `SUPPRESS_ERRORS_IN_PAD_TEXT` | `false` | Hide error messages in pads |

### Plugins

Etherpad has a plugin ecosystem. Install plugins from the admin panel or via environment variables:

```yaml
# Install plugins on startup
ETHERPAD_PLUGINS: "ep_headings2 ep_markdown ep_comments_page ep_font_size"
```

Popular plugins:
- `ep_headings2` — heading styles (H1-H6)
- `ep_markdown` — Markdown import/export
- `ep_comments_page` — inline comments
- `ep_font_size` — font size control
- `ep_table_of_contents` — auto-generated TOC

### Authentication

Etherpad is anonymous by default. To require authentication:

```yaml
REQUIRE_SESSION: "true"
REQUIRE_AUTHENTICATION: "true"
```

For SSO integration, use plugins like `ep_openid_connect` or configure HTTP authentication via your reverse proxy.

### Pad Management

Pads are identified by their URL slug. You can create specific pad names by visiting `/p/your-pad-name`. To set a pad to read-only, use the share button within the pad — Etherpad generates a separate read-only URL.

## Advanced Configuration (Optional)

### Skin / Theme

Etherpad ships with multiple skins:

```yaml
SKIN_NAME: "colibris"  # Options: colibris (default), no-hierarchical
SKIN_VARIANTS: "super-light-toolbar super-light-editor light-background"
```

### Rate Limiting

```yaml
# Import/export rate limiting
IMPORT_MAX_FILE_SIZE: "52428800"  # 50 MB max file import
```

### API Key

Etherpad exposes an HTTP API for programmatic pad management. The API key is auto-generated and stored in the data volume at `APIKEY.txt`. Use it for integrations with [n8n](/apps/n8n), scripts, or custom applications.

## Reverse Proxy

Etherpad runs on port 9001. Point your reverse proxy to `http://etherpad:9001`.

WebSocket support is required for real-time collaboration:

**Nginx:**

```nginx
location / {
    proxy_pass http://etherpad:9001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Set `TRUST_PROXY: "true"` when running behind a reverse proxy. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

### PostgreSQL

```bash
docker exec etherpad-db pg_dump -U etherpad etherpad > etherpad-db-$(date +%Y%m%d).sql
```

### DirtyDB (default)

Back up the data volume:

```bash
docker run --rm -v etherpad_etherpad-data:/data -v $(pwd):/backup alpine \
  tar -czf /backup/etherpad-data-$(date +%Y%m%d).tar.gz /data
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Real-Time Sync Not Working

**Symptom:** Users can't see each other's edits.

**Fix:** WebSocket connections are required. Check reverse proxy WebSocket headers. If using Nginx Proxy Manager, enable "WebSockets Support." Also verify `TRUST_PROXY` is set to `true`.

### "Internal Error" When Creating Pads

**Symptom:** New pads fail with an internal error.

**Fix:** Check database connectivity:

```bash
docker compose logs etherpad
```

Common cause: wrong `DB_PASS` or PostgreSQL container not ready. The healthcheck in the config above prevents this, but check logs if issues persist.

### Plugins Not Loading

**Symptom:** Installed plugins don't appear in pads.

**Fix:** Some plugins need a restart to take effect:

```bash
docker compose restart etherpad
```

If using `ETHERPAD_PLUGINS`, verify the plugin names are correct (check the Etherpad plugin registry).

### High Memory Usage

**Symptom:** Etherpad consuming excessive RAM with many active pads.

**Fix:** Etherpad keeps active pad data in memory. With hundreds of concurrent pads, memory usage can climb. Use PostgreSQL instead of DirtyDB for better memory management. Consider setting `MAX_AGE` to expire inactive pads from memory sooner.

## Resource Requirements

- **RAM:** ~100-150 MB idle (with PostgreSQL), ~200-400 MB under active use with plugins
- **CPU:** Low for text editing. Moderate with many concurrent collaborative sessions
- **Disk:** ~150 MB for the application. Database size depends on pad count and revision history

## Verdict

Etherpad is the simplest self-hosted solution for real-time collaborative editing. Its biggest strength is zero friction — share a link, start typing, no accounts needed. The plugin system extends it well beyond basic text editing.

For Markdown-specific collaboration, [HedgeDoc](/apps/hedgedoc) is a better fit. For full knowledge management, [BookStack](/apps/bookstack) or [Outline](/apps/outline) are more appropriate. Etherpad is best when you need a shared writing space with minimal setup and no login requirements — meeting notes, brainstorming sessions, and ad-hoc collaboration.

## Related

- [How to Self-Host HedgeDoc](/apps/hedgedoc)
- [How to Self-Host BookStack](/apps/bookstack)
- [How to Self-Host Outline](/apps/outline)
- [Best Self-Hosted Note Taking Apps](/best/note-taking)
- [Self-Hosted Alternatives to Notion](/replace/notion)
- [Self-Hosted Alternatives to Confluence](/replace/confluence)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
