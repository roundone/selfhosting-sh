---
title: "How to Self-Host Directus with Docker Compose"
description: "Deploy Directus headless CMS with Docker Compose and PostgreSQL for instant REST and GraphQL APIs from any SQL database."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "cms-websites"
apps:
  - directus
tags:
  - self-hosted
  - directus
  - docker
  - cms
  - headless-cms
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Directus?

Directus is an open-source headless CMS and data platform that wraps any SQL database with auto-generated REST and GraphQL APIs plus a visual admin panel called Data Studio. Unlike [Strapi](/apps/strapi), Directus doesn't impose its own schema — it mirrors your existing database tables. This makes it useful both as a CMS and as an instant API layer for any SQL database. [Official site](https://directus.io/).

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of RAM minimum (2 GB recommended with Redis)
- 5 GB of free disk space
- A domain name (optional, for production access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  directus:
    image: directus/directus:11.15.4
    container_name: directus
    ports:
      - "8055:8055"
    volumes:
      - directus-uploads:/directus/uploads
      - directus-extensions:/directus/extensions
    depends_on:
      directus-db:
        condition: service_healthy
      directus-cache:
        condition: service_healthy
    environment:
      SECRET: "replace-with-a-long-random-value"  # CHANGE THIS — generate with: openssl rand -base64 32

      # Database
      DB_CLIENT: "pg"
      DB_HOST: "directus-db"
      DB_PORT: "5432"
      DB_DATABASE: "directus"
      DB_USER: "directus"
      DB_PASSWORD: "change-me-strong-password"  # CHANGE THIS

      # Cache
      CACHE_ENABLED: "true"
      CACHE_STORE: "redis"
      REDIS: "redis://directus-cache:6379"

      # Admin account (created on first startup)
      ADMIN_EMAIL: "admin@example.com"    # CHANGE THIS
      ADMIN_PASSWORD: "change-me-admin"   # CHANGE THIS

      # Optional
      WEBSOCKETS_ENABLED: "true"
    restart: unless-stopped

  directus-db:
    image: postgres:16-alpine
    container_name: directus-db
    environment:
      POSTGRES_USER: "directus"
      POSTGRES_PASSWORD: "change-me-strong-password"  # Must match DB_PASSWORD above
      POSTGRES_DB: "directus"
    volumes:
      - directus-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U directus"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  directus-cache:
    image: redis:7-alpine
    container_name: directus-cache
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  directus-uploads:
  directus-extensions:
  directus-db-data:
```

Generate a secure secret:

```bash
openssl rand -base64 32
```

Replace the placeholder values and start:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server:8055` in your browser
2. Log in with the admin email and password you set in the compose file
3. You'll see the Data Studio — Directus's visual admin interface
4. Create your first collection (database table) by clicking the **+** in the sidebar
5. Define fields for your collection — Directus supports 30+ field types
6. Add content entries through the Content module

### API Access

Directus automatically generates APIs for every collection:

- **REST API:** `http://your-server:8055/items/[collection-name]`
- **GraphQL API:** `http://your-server:8055/graphql`

Both require authentication by default. Create an API token under Settings > Access Tokens, or configure public access under Settings > Roles > Public.

## Configuration

### Database Options

Directus supports PostgreSQL, MySQL, MariaDB, SQLite, CockroachDB, MS-SQL, and OracleDB. For MySQL:

```yaml
environment:
  DB_CLIENT: "mysql"
  DB_HOST: "directus-db"
  DB_PORT: "3306"
  DB_DATABASE: "directus"
  DB_USER: "directus"
  DB_PASSWORD: "your-password"
```

For simple setups, SQLite works without an external database:

```yaml
environment:
  DB_CLIENT: "sqlite3"
  DB_FILENAME: "/directus/database/data.db"
volumes:
  - directus-database:/directus/database
```

### File Storage

Directus stores uploads locally by default. For production, configure S3-compatible storage:

```yaml
environment:
  STORAGE_LOCATIONS: "s3"
  STORAGE_S3_DRIVER: "s3"
  STORAGE_S3_KEY: "your-access-key"
  STORAGE_S3_SECRET: "your-secret-key"
  STORAGE_S3_BUCKET: "your-bucket"
  STORAGE_S3_REGION: "us-east-1"
```

Also supports Google Cloud Storage, Azure Blob Storage, Cloudinary, and Supabase Storage.

### Email Configuration

Configure email for password resets and notifications:

```yaml
environment:
  EMAIL_FROM: "noreply@example.com"
  EMAIL_TRANSPORT: "smtp"
  EMAIL_SMTP_HOST: "smtp.example.com"
  EMAIL_SMTP_PORT: "587"
  EMAIL_SMTP_USER: "your-username"
  EMAIL_SMTP_PASSWORD: "your-password"
```

## Advanced Configuration (Optional)

### Flows (Automations)

Directus includes a built-in automation engine similar to n8n or Zapier. Create event-triggered or scheduled workflows directly in the admin panel under Settings > Flows. No additional containers needed.

### Extensions

Add custom extensions by placing them in the `/directus/extensions` directory (mounted as a volume). Directus supports custom endpoints, hooks, interfaces, displays, layouts, modules, panels, and themes.

### Authentication Providers

Configure OAuth2, OpenID, LDAP, or SAML authentication:

```yaml
environment:
  AUTH_PROVIDERS: "google"
  AUTH_GOOGLE_DRIVER: "openid"
  AUTH_GOOGLE_CLIENT_ID: "your-client-id"
  AUTH_GOOGLE_CLIENT_SECRET: "your-secret"
  AUTH_GOOGLE_ISSUER_URL: "https://accounts.google.com/.well-known/openid-configuration"
```

### WebSockets

Real-time data updates are available via WebSocket when `WEBSOCKETS_ENABLED` is set to `"true"`. Clients can subscribe to collection changes.

## Reverse Proxy

Configure your reverse proxy to forward to port 8055. See [Reverse Proxy Setup](/foundations/reverse-proxy) for full guides with [Nginx Proxy Manager](/apps/nginx-proxy-manager), [Traefik](/apps/traefik), or [Caddy](/apps/caddy).

## Backup

1. **PostgreSQL database:**
```bash
docker exec directus-db pg_dump -U directus directus > directus-backup.sql
```

2. **Uploaded files:**
```bash
docker run --rm -v directus-uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/directus-uploads.tar.gz /data
```

See [Backup Strategy](/foundations/backup-strategy).

## Troubleshooting

### Migrations Fail on Startup

**Symptom:** Directus crashes during startup with database migration errors.
**Fix:** This usually happens after upgrading Directus versions. Check that your PostgreSQL version is compatible (16+ recommended). Run with verbose logs:

```bash
docker compose logs directus --tail 100
```

If a specific migration fails, check the [Directus GitHub issues](https://github.com/directus/directus/issues) for known problems with that version.

### Uploads Not Persisting

**Symptom:** Uploaded files disappear after container restart.
**Fix:** Ensure the `/directus/uploads` volume is mounted correctly. Check volume ownership:

```bash
docker exec directus ls -la /directus/uploads
```

The `node` user (UID 1000) must own the directory.

### Redis Connection Refused

**Symptom:** Directus logs show Redis connection errors.
**Fix:** Ensure the Redis service is healthy and the `REDIS` URL uses the correct service name. If you don't need caching, remove the cache service and set `CACHE_ENABLED: "false"`.

### Admin Password Reset

**Symptom:** Forgot the admin password.
**Fix:** Connect directly to PostgreSQL and update the password hash, or delete and recreate the admin via the `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables (requires a fresh bootstrap).

### Slow API Responses

**Symptom:** API queries take several seconds.
**Fix:** Enable Redis caching (`CACHE_ENABLED: "true"`). Add database indexes for frequently queried fields. Check that your PostgreSQL instance has enough RAM allocated.

## Resource Requirements

- **RAM:** 512 MB minimum (Directus alone), 1.5 GB with PostgreSQL and Redis
- **CPU:** Low to Medium
- **Disk:** 1 GB for the application, plus database and upload storage

## Verdict

Directus is the best self-hosted headless CMS for teams that want a pre-built Docker image, instant APIs, and a polished admin interface. The database-agnostic approach is its killer feature — connect it to an existing PostgreSQL or MySQL database and you instantly get REST + GraphQL APIs with a visual admin panel. The built-in Flows automation engine and granular role-based permissions make it production-ready out of the box.

Choose Directus over [Strapi](/apps/strapi) if you want simpler deployment (pre-built Docker image vs build-from-source), database flexibility, or the ability to wrap an existing database. Choose Strapi if you prefer its content-type builder workflow or need its larger plugin ecosystem.

**Licensing note:** Directus uses BSL 1.1, which is free for organizations with less than $5M in total finances. Larger organizations need a commercial license.

## Related

- [How to Self-Host Strapi](/apps/strapi)
- [How to Self-Host Ghost](/apps/ghost)
- [How to Self-Host WordPress](/apps/wordpress)
- [How to Self-Host Hugo](/apps/hugo)
- [Ghost vs WordPress](/compare/ghost-vs-wordpress)
- [Best Self-Hosted CMS](/best/cms-websites)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
- [Backup Strategy](/foundations/backup-strategy)
