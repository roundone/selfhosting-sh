---
title: "How to Self-Host Linkwarden with Docker"
description: "Deploy Linkwarden with Docker Compose — a collaborative bookmark manager with archival, full-text search, and collections."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "bookmarks-read-later"
apps:
  - linkwarden
tags:
  - self-hosted
  - linkwarden
  - docker
  - bookmarks
  - read-later
  - pocket-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Linkwarden?

[Linkwarden](https://linkwarden.app/) is a self-hosted collaborative bookmark manager. It saves your bookmarks, archives the pages (so they survive link rot), and makes everything searchable. Think of it as a self-hosted alternative to Pocket, Raindrop.io, and Pinboard — but with team collaboration features, automatic page archiving, full-text search via Meilisearch, and a clean modern UI. Linkwarden supports browser extensions, collections, tags, and multiple users with sharing.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 1 GB of free RAM (2 GB recommended with Meilisearch)
- 5 GB of free disk space (archives grow over time)
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  linkwarden:
    image: ghcr.io/linkwarden/linkwarden:v2.13.5
    container_name: linkwarden
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "postgresql://linkwarden:change_this_strong_password@linkwarden_db:5432/linkwarden"
      NEXTAUTH_SECRET: "change_this_to_random_string"    # CHANGE THIS — generate with: openssl rand -hex 32
      NEXTAUTH_URL: "http://localhost:3000"               # Set to your public URL
      MEILI_ADDR: "http://meilisearch:7700"
      MEILI_MASTER_KEY: "change_this_meili_key"           # CHANGE THIS — must match Meilisearch
      NEXT_PUBLIC_DISABLE_REGISTRATION: "false"           # Set to "true" after creating your account
    volumes:
      - linkwarden_data:/data/data
    depends_on:
      linkwarden_db:
        condition: service_healthy
      meilisearch:
        condition: service_healthy

  linkwarden_db:
    image: postgres:16-alpine
    container_name: linkwarden_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: linkwarden
      POSTGRES_PASSWORD: change_this_strong_password      # Must match DATABASE_URL
      POSTGRES_DB: linkwarden
    volumes:
      - linkwarden_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U linkwarden"]
      interval: 10s
      timeout: 5s
      retries: 5

  meilisearch:
    image: getmeili/meilisearch:v1.12.8
    container_name: linkwarden_meili
    restart: unless-stopped
    environment:
      MEILI_MASTER_KEY: "change_this_meili_key"           # Must match MEILI_MASTER_KEY above
      MEILI_NO_ANALYTICS: "true"
    volumes:
      - linkwarden_meili:/meili_data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7700/health"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  linkwarden_data:
  linkwarden_pgdata:
  linkwarden_meili:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:3000` in your browser
2. Click **Register** and create your account
3. After creating your account, set `NEXT_PUBLIC_DISABLE_REGISTRATION: "true"` in your Compose file and restart to prevent others from signing up
4. Install the browser extension (available for Chrome, Firefox, Safari) for one-click bookmarking

## Configuration

### Browser Extensions

Linkwarden has browser extensions for all major browsers:
- **Chrome/Edge:** Chrome Web Store
- **Firefox:** Firefox Add-ons
- **Safari:** Mac App Store

After installing, enter your Linkwarden URL and log in.

### Collections and Tags

Organize bookmarks with:
- **Collections:** Folders with sharing permissions. Nest collections for hierarchy.
- **Tags:** Cross-cutting labels for any bookmark.
- **Sub-collections:** Create nested organization within collections.

### Automatic Archiving

Linkwarden automatically creates archived copies of bookmarked pages:
- **Screenshot archive:** Captures how the page looks
- **PDF archive:** Full-page PDF for offline reading
- **Single-file archive:** Complete HTML page with embedded assets

Configure archive formats under **Settings → Archiving**.

### SMTP for Invitations

To invite users via email:

```yaml
environment:
  EMAIL_FROM: "linkwarden@example.com"
  EMAIL_SERVER: "smtp://user:password@smtp.example.com:587"
```

## Advanced Configuration (Optional)

### SSO/OIDC Authentication

Linkwarden supports multiple authentication providers:

```yaml
environment:
  # Keycloak/OIDC example
  NEXT_PUBLIC_OIDC_ENABLED: "true"
  OIDC_CLIENT_ID: "linkwarden"
  OIDC_CLIENT_SECRET: "your-client-secret"
  OIDC_ISSUER: "https://auth.example.com/realms/master"
```

### S3 Storage for Archives

For large deployments, store archives in S3-compatible storage:

```yaml
environment:
  STORAGE_FOLDER: "s3"
  S3_ENDPOINT: "https://s3.example.com"
  S3_BUCKET_NAME: "linkwarden"
  S3_ACCESS_KEY: "your-access-key"
  S3_SECRET_KEY: "your-secret-key"
  S3_REGION: "us-east-1"
```

## Reverse Proxy

Set `NEXTAUTH_URL` to your public-facing domain:

```yaml
NEXTAUTH_URL: "https://bookmarks.example.com"
```

Nginx Proxy Manager config:
- **Scheme:** http
- **Forward Hostname:** linkwarden
- **Forward Port:** 3000

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for full configuration.

## Backup

Back up three things:

1. **PostgreSQL database:**
```bash
docker compose exec linkwarden_db pg_dump -U linkwarden linkwarden > linkwarden-backup-$(date +%Y%m%d).sql
```

2. **Linkwarden data volume** (archived pages):
```bash
docker run --rm -v linkwarden_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/linkwarden-data-$(date +%Y%m%d).tar.gz /data
```

3. **Meilisearch data** (search index — can be rebuilt but slow):
```bash
docker run --rm -v linkwarden_meili:/data -v $(pwd):/backup alpine \
  tar czf /backup/linkwarden-meili-$(date +%Y%m%d).tar.gz /data
```

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a complete backup approach.

## Troubleshooting

### Search Not Working

**Symptom:** Bookmarks save but search returns no results.
**Fix:** Check that Meilisearch is running and `MEILI_ADDR` and `MEILI_MASTER_KEY` match between the Linkwarden and Meilisearch containers. Restart Linkwarden after fixing configuration.

### Archives Not Being Created

**Symptom:** Bookmarks save but no screenshots or PDFs are generated.
**Fix:** Archive generation needs a headless Chrome service. Verify the container has enough memory (at least 1 GB). Check Linkwarden logs for archival errors:

```bash
docker compose logs linkwarden | grep -i archive
```

### Registration Page Not Showing

**Symptom:** Going to the registration page redirects to login.
**Fix:** Set `NEXT_PUBLIC_DISABLE_REGISTRATION: "false"` and restart the container. Note: this environment variable requires a container rebuild since it's a build-time variable in some versions.

## Resource Requirements

- **RAM:** ~300 MB for Linkwarden, ~200 MB for Meilisearch, ~100 MB for PostgreSQL
- **CPU:** Low idle, moderate during archiving operations
- **Disk:** ~200 MB for the application, archives grow based on bookmarking activity (plan for 1-5 GB)

## Verdict

Linkwarden is the best self-hosted bookmark manager for users who want archival and team collaboration. The automatic page archiving means your bookmarks survive even when the original pages disappear. If you want something simpler and lighter — just bookmarks without archival — look at [Linkding](https://github.com/sissbruecker/linkding). If you want a read-later app focused on article reading, [Wallabag](/apps/wallabag/) is better suited. But for a full-featured, team-friendly bookmark manager, Linkwarden is the top choice.

## Related

- [Best Self-Hosted Bookmark Managers](/best/bookmarks-read-later/)
- [Linkwarden vs Wallabag](/compare/linkwarden-vs-wallabag/)
- [Linkwarden vs Hoarder](/compare/linkwarden-vs-hoarder/)
- [Linkding vs Linkwarden](/compare/linkding-vs-linkwarden/)
- [Replace Pocket with Self-Hosted Tools](/replace/pocket/)
- [Replace Raindrop.io with Self-Hosted Tools](/replace/raindrop/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
