---
title: "How to Self-Host AFFiNE with Docker Compose"
description: "Deploy AFFiNE with Docker — an open-source Notion and Miro alternative with docs, whiteboards, and database views."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "note-taking-knowledge"
apps:
  - affine
tags:
  - self-hosted
  - affine
  - docker
  - note-taking
  - notion-alternative
  - whiteboard
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is AFFiNE?

[AFFiNE](https://affine.pro/) is an open-source knowledge management platform that combines documents, whiteboards, and databases in a single workspace. Think of it as Notion + Miro — you get rich text documents with block editing, infinite canvas whiteboards for visual thinking, and database views (table, kanban) for structured data. Pages can switch between document and whiteboard modes seamlessly.

AFFiNE is still maturing but is one of the most ambitious self-hosted Notion alternatives in active development.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 4 GB of RAM minimum (8 GB recommended)
- 20 GB of free disk space
- A domain name (required for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  affine:
    image: ghcr.io/toeverything/affine-graphql:stable
    ports:
      - "3010:3010"
      - "5555:5555"
    environment:
      NODE_ENV: production
      AFFINE_CONFIG_PATH: /root/.affine/config
      REDIS_SERVER_HOST: redis
      DATABASE_URL: postgresql://affine:${POSTGRES_PASSWORD}@postgres:5432/affine
      AFFINE_SERVER_HOST: "0.0.0.0"
      AFFINE_SERVER_PORT: "3010"
      AFFINE_SERVER_HTTPS: "false"
      AFFINE_SERVER_EXTERNAL_URL: ${AFFINE_URL}
    volumes:
      - affine-config:/root/.affine/config
      - affine-storage:/root/.affine/storage
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: ['sh', '-c', 'node ./scripts/self-host-predeploy && node ./dist/index.js']
    restart: unless-stopped

  redis:
    image: redis:7.4-alpine
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: affine
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: affine
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U affine -d affine"]
      interval: 10s
      timeout: 3s
      retries: 3
    restart: unless-stopped

volumes:
  affine-config:
  affine-storage:
  redis-data:
  postgres-data:
```

Create a `.env` file:

```bash
# PostgreSQL password — use a strong random password
POSTGRES_PASSWORD=change_me_strong_password

# The full external URL where AFFiNE is accessible (no trailing slash)
AFFINE_URL=https://affine.yourdomain.com
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Wait 1-2 minutes for database migrations to complete
2. Navigate to your AFFiNE URL (e.g., `https://affine.yourdomain.com`)
3. Create an account with email and password
4. The first user can access admin features
5. Create your first workspace and start editing — toggle between document and whiteboard modes with a click

## Configuration

### Workspace Structure

AFFiNE organizes content as:
- **Workspaces** — isolated spaces for different projects or teams
- **Pages** — individual documents that can be docs or whiteboards
- **Sub-pages** — nested pages for hierarchical organization
- **Databases** — structured data views within pages

### Document Features

- Block-based editing with slash commands
- Markdown shortcuts (type `#` for headings, `-` for lists)
- Code blocks with syntax highlighting
- Tables, callouts, dividers, images
- Inline databases (table, kanban views)
- Page links and backlinks

### Whiteboard Features

- Infinite canvas with free-form drawing
- Shapes, connectors, text blocks
- Embed documents within whiteboards
- Real-time collaboration on the canvas
- Hand-drawn style option (Excalidraw-inspired)

## Advanced Configuration (Optional)

### Email Configuration

For password reset and email verification:

```yaml
environment:
  MAILER_HOST: smtp.example.com
  MAILER_PORT: 587
  MAILER_USER: your_smtp_user
  MAILER_PASSWORD: your_smtp_password
  MAILER_SENDER: noreply@yourdomain.com
```

### OAuth Authentication

AFFiNE supports Google OAuth for login:

```yaml
environment:
  OAUTH_GOOGLE_CLIENT_ID: your_google_client_id
  OAUTH_GOOGLE_CLIENT_SECRET: your_google_client_secret
```

## Reverse Proxy

Set up a reverse proxy pointing to port 3010. AFFiNE uses WebSocket connections for real-time collaboration, so ensure WebSocket passthrough is enabled.

For detailed setup: [Reverse Proxy Setup](/foundations/reverse-proxy)

## Backup

Critical data to back up:
- **PostgreSQL database:** `docker compose exec postgres pg_dump -U affine affine > affine_backup.sql`
- **Storage volume:** `affine-storage` contains uploaded files and assets
- **Config volume:** `affine-config` contains server configuration
- **Environment file:** Your `.env` with credentials

For a complete backup strategy: [Backup Strategy](/foundations/backup-strategy)

## Troubleshooting

### "Migration failed" on startup

**Symptom:** AFFiNE container exits with migration errors.
**Fix:** This usually means PostgreSQL wasn't ready when AFFiNE tried to connect. Ensure the health check is working: `docker compose ps`. Restart AFFiNE after PostgreSQL is healthy: `docker compose restart affine`.

### Whiteboard performance is slow

**Symptom:** The whiteboard canvas lags or stutters.
**Fix:** Whiteboards are rendered client-side using WebGL. This is a client browser performance issue, not a server issue. Use a modern browser (Chrome/Edge recommended). Reduce the number of elements on a single whiteboard.

### WebSocket errors in browser console

**Symptom:** Real-time collaboration doesn't work, browser console shows WebSocket errors.
**Fix:** Ensure your reverse proxy forwards WebSocket connections. For Nginx, add `Upgrade` and `Connection` headers. Verify `AFFINE_SERVER_EXTERNAL_URL` matches your actual URL.

### Account creation fails

**Symptom:** Can't create a new account.
**Fix:** Check AFFiNE logs: `docker compose logs affine`. If SMTP is not configured, some auth flows may fail. Check that PostgreSQL has space and the connection is healthy.

## Resource Requirements

- **RAM:** 1-2 GB for AFFiNE + 500 MB for PostgreSQL + 100 MB for Redis = 2-3 GB total
- **CPU:** Moderate — Node.js server with database operations
- **Disk:** ~500 MB for the application, plus user data

## Verdict

AFFiNE is the most visually ambitious self-hosted Notion alternative. The combination of documents and whiteboards in one app is unique — no other self-hosted tool does this. If you use Notion and Miro together, AFFiNE aims to replace both.

The caveat: AFFiNE is still in active development (pre-1.0). Expect bugs, missing features, and breaking changes between versions. For production team documentation, [Outline](/apps/outline) or [BookStack](/apps/bookstack) are more stable. For personal experimentation or teams comfortable with beta software, AFFiNE is exciting and worth watching.

Choose AFFiNE if whiteboards are essential to your workflow. Choose [AppFlowy](/apps/appflowy) for a more mature Notion clone. Choose [Outline](/apps/outline) for stable team documentation.

## Related

- [Best Self-Hosted Note Taking](/best/note-taking)
- [AppFlowy vs AFFiNE](/compare/appflowy-vs-affine)
- [How to Self-Host AppFlowy](/apps/appflowy)
- [How to Self-Host Outline](/apps/outline)
- [How to Self-Host BookStack](/apps/bookstack)
- [Replace Notion](/replace/notion)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
- [Backup Strategy](/foundations/backup-strategy)
