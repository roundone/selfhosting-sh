---
title: "How to Self-Host Docmost with Docker Compose"
description: "Step-by-step guide to self-hosting Docmost wiki with Docker Compose, including PostgreSQL, Redis, and collaboration setup."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "note-taking"
apps:
  - docmost
tags:
  - self-hosted
  - docmost
  - docker
  - wiki
  - notion-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Docmost?

Docmost is an open-source collaborative wiki and documentation platform — a self-hosted alternative to Confluence and Notion. It features real-time collaboration, a block-based editor with slash commands, nested page hierarchies, and workspace/space organization. It's written in TypeScript and licensed under AGPL-3.0.

[Official site: docmost.com](https://docmost.com) | [GitHub: docmost/docmost](https://github.com/docmost/docmost)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB of free RAM (minimum)
- 5 GB of free disk space
- A domain name (recommended for HTTPS access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  docmost:
    image: docmost/docmost:v0.25.3
    depends_on:
      - db
      - redis
    environment:
      APP_URL: "${APP_URL}"
      APP_SECRET: "${APP_SECRET}"
      DATABASE_URL: "postgresql://docmost:${DB_PASSWORD}@db:5432/docmost?sslmode=disable"
      REDIS_URL: "redis://redis:6379"
    ports:
      - "3000:3000"
    restart: unless-stopped
    volumes:
      - docmost_data:/app/data/storage

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: docmost
      POSTGRES_USER: docmost
      POSTGRES_PASSWORD: "${DB_PASSWORD}"
    restart: unless-stopped
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U docmost"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes", "--maxmemory-policy", "noeviction"]
    restart: unless-stopped
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  docmost_data:
  db_data:
  redis_data:
```

Create a `.env` file alongside:

```bash
# URL where Docmost is accessible (include protocol, no trailing slash)
APP_URL=https://wiki.example.com

# Secret key for session encryption — generate with: openssl rand -hex 32
APP_SECRET=CHANGE_ME_GENERATE_WITH_OPENSSL_RAND_HEX_32

# Database password — use a strong random string
DB_PASSWORD=CHANGE_ME_STRONG_DB_PASSWORD
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open your browser and navigate to `http://your-server-ip:3000` (or your configured domain).
2. Docmost shows a registration page on first access. Create your admin account with email and password.
3. Set your workspace name. This is the organization-level container for all your content.
4. You're now in the editor. Create your first space (a content area within the workspace) and start adding pages.

## Configuration

### Key Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_URL` | Yes | Full URL where Docmost is accessed. Must match exactly. |
| `APP_SECRET` | Yes | Encryption key. Minimum 32 characters. Generate with `openssl rand -hex 32`. |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `REDIS_URL` | Yes | Redis connection string. |
| `MAIL_DRIVER` | No | Email driver: `smtp` or `postmark`. Required for invitations. |
| `SMTP_HOST` | No | SMTP server hostname. |
| `SMTP_PORT` | No | SMTP port (587 for TLS). |
| `SMTP_USERNAME` | No | SMTP authentication username. |
| `SMTP_PASSWORD` | No | SMTP authentication password. |
| `MAIL_FROM_ADDRESS` | No | Sender email address. |
| `MAIL_FROM_NAME` | No | Sender display name. |

### SMTP Configuration

Email is optional but needed for user invitations and password resets. Add these to your `.env`:

```bash
MAIL_DRIVER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-smtp-user
SMTP_PASSWORD=your-smtp-password
MAIL_FROM_ADDRESS=wiki@example.com
MAIL_FROM_NAME=Docmost
```

## Advanced Configuration (Optional)

### S3 Storage

By default, Docmost stores file uploads locally in the `docmost_data` volume. For S3-compatible storage:

```bash
STORAGE_DRIVER=s3
AWS_S3_ACCESS_KEY_ID=your-access-key
AWS_S3_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=docmost-files
AWS_S3_ENDPOINT=https://s3.amazonaws.com  # or MinIO/Garage endpoint
```

### Disable Registration

After creating your admin account, disable public registration to prevent unauthorized signups. This is managed through the workspace settings in the web UI under **Settings → General**.

## Reverse Proxy

Docmost uses WebSocket for real-time collaboration. Your reverse proxy must support WebSocket passthrough.

Nginx Proxy Manager: Create a proxy host pointing to `docmost:3000`. Enable WebSocket support in the advanced settings.

For manual Nginx configuration, ensure these headers are set:

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

[Reverse Proxy Setup](/foundations/reverse-proxy-explained)

## Backup

Back up these volumes:
- `docmost_data` — uploaded files and attachments
- `db_data` — PostgreSQL database (all pages, users, workspaces)
- `redis_data` — session cache (less critical, regenerated on restart)

For PostgreSQL, a database dump is more reliable than volume backup:

```bash
docker compose exec db pg_dump -U docmost docmost > docmost_backup.sql
```

[Backup Strategy](/foundations/backup-3-2-1-rule)

## Troubleshooting

### Pages Not Loading or Showing Errors

**Symptom:** Blank pages or 500 errors after deployment.
**Fix:** Verify `APP_URL` exactly matches the URL in your browser (including protocol and port). Mismatch causes CORS and session issues.

### Real-Time Collaboration Not Working

**Symptom:** Changes by one user don't appear for others in real time.
**Fix:** Ensure your reverse proxy supports WebSocket connections. Check that `Upgrade` and `Connection` headers are passed through.

### Cannot Send User Invitations

**Symptom:** Invitation emails not delivered.
**Fix:** Configure SMTP environment variables. Check SMTP credentials and test connectivity with `telnet smtp.example.com 587`.

### Database Connection Refused

**Symptom:** `connection refused` errors in Docmost logs.
**Fix:** Ensure the database container is healthy (`docker compose ps`). Verify `DATABASE_URL` matches the PostgreSQL container's credentials exactly.

### Health Check

Verify Docmost is running:

```bash
curl http://localhost:3000/api/health
```

A healthy instance returns `200 OK`.

## Resource Requirements

- **RAM:** 300–500 MB for Docmost + 200 MB for PostgreSQL + 50 MB for Redis (~600 MB total)
- **CPU:** Low to medium. Spikes during file uploads and search indexing.
- **Disk:** 2 GB for application, plus storage proportional to uploaded files.

## Verdict

Docmost is one of the most promising self-hosted wiki platforms in 2026. It delivers a Notion/Confluence-like editing experience with real-time collaboration, clean UI, and straightforward Docker deployment. The three-service stack (app + PostgreSQL + Redis) is standard and manageable.

Compared to [Outline](/apps/outline), Docmost has a simpler setup — no external OIDC provider required. Built-in email/password authentication makes it accessible to teams without SSO infrastructure. Compared to [BookStack](/apps/bookstack), Docmost offers a more modern editor and real-time collaboration at the cost of slightly higher resource usage.

The main caveat: Docmost is pre-1.0 software (v0.25.x). Expect occasional rough edges. For production team use, [BookStack](/apps/bookstack) or [Wiki.js](/apps/wiki-js) are more mature. For teams willing to adopt newer software, Docmost is the most Notion-like self-hosted option available.

## Related

- [Best Self-Hosted Note Taking](/best/note-taking)
- [How to Self-Host Outline](/apps/outline)
- [How to Self-Host BookStack](/apps/bookstack)
- [How to Self-Host Wiki.js](/apps/wiki-js)
- [BookStack vs Outline](/compare/bookstack-vs-outline)
- [Replace Notion](/replace/notion)
- [Replace Confluence](/replace/confluence)
- [Docker Compose Basics](/foundations/docker-compose-basics)
