---
title: "How to Self-Host Outline with Docker Compose"
description: "Deploy Outline wiki with Docker Compose — a fast, modern knowledge base with real-time collaboration and Markdown support."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "note-taking-knowledge"
apps:
  - outline
tags:
  - self-hosted
  - outline
  - docker
  - wiki
  - knowledge-base
  - notion-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Outline?

[Outline](https://www.getoutline.com/) is an open-source knowledge base and wiki designed for teams. It's the closest self-hosted alternative to Notion for structured documentation — fast, clean, with real-time collaboration, Markdown support, and a modern UI. Outline supports nested document collections, slash commands, embeds, full-text search powered by PostgreSQL, and passkey authentication (v1.2.0+).

Outline requires an authentication provider (OIDC, Google, Slack, Azure AD, or Discord) — there's no built-in username/password auth. This makes it team-oriented by design.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB of RAM minimum (4 GB recommended)
- 10 GB of free disk space
- A domain name (required — Outline needs a proper URL)
- An OIDC provider, Google Workspace, Slack, or other supported auth provider

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  outline:
    image: outlinewiki/outline:1.5.0
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      SECRET_KEY: ${SECRET_KEY}
      UTILS_SECRET: ${UTILS_SECRET}
      DATABASE_URL: postgres://outline:${POSTGRES_PASSWORD}@postgres:5432/outline
      REDIS_URL: redis://redis:6379
      URL: ${URL}
      PORT: 3000
      FILE_STORAGE: local
      FILE_STORAGE_LOCAL_ROOT_DIR: /var/lib/outline/data
      FILE_STORAGE_UPLOAD_MAX_SIZE: 26214400
      # Authentication — configure ONE provider (see Authentication section below)
      # OIDC example:
      OIDC_CLIENT_ID: ${OIDC_CLIENT_ID}
      OIDC_CLIENT_SECRET: ${OIDC_CLIENT_SECRET}
      OIDC_AUTH_URI: ${OIDC_AUTH_URI}
      OIDC_TOKEN_URI: ${OIDC_TOKEN_URI}
      OIDC_USERINFO_URI: ${OIDC_USERINFO_URI}
      OIDC_DISPLAY_NAME: SSO Login
      OIDC_SCOPES: openid profile email
      # Optional email notifications
      # SMTP_HOST: smtp.example.com
      # SMTP_PORT: 587
      # SMTP_USERNAME: ${SMTP_USERNAME}
      # SMTP_PASSWORD: ${SMTP_PASSWORD}
      # SMTP_FROM_EMAIL: outline@yourdomain.com
      FORCE_HTTPS: "false"
      PGSSLMODE: disable
      DEFAULT_LANGUAGE: en_US
    volumes:
      - outline-data:/var/lib/outline/data
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
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
      POSTGRES_USER: outline
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: outline
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U outline -d outline"]
      interval: 10s
      timeout: 3s
      retries: 3
    restart: unless-stopped

volumes:
  outline-data:
  redis-data:
  postgres-data:
```

Create a `.env` file alongside:

```bash
# Generate with: openssl rand -hex 32
SECRET_KEY=change_me_to_a_random_64_char_hex_string
UTILS_SECRET=change_me_to_another_random_64_char_hex_string

# PostgreSQL password — use a strong random password
POSTGRES_PASSWORD=change_me_strong_password

# The full URL where Outline will be accessible (no trailing slash)
URL=https://wiki.yourdomain.com

# OIDC Authentication (example — configure your provider)
OIDC_CLIENT_ID=your_client_id
OIDC_CLIENT_SECRET=your_client_secret
OIDC_AUTH_URI=https://auth.yourdomain.com/authorize
OIDC_TOKEN_URI=https://auth.yourdomain.com/token
OIDC_USERINFO_URI=https://auth.yourdomain.com/userinfo
```

Generate the required secrets:

```bash
# Generate SECRET_KEY
openssl rand -hex 32

# Generate UTILS_SECRET
openssl rand -hex 32
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Navigate to your Outline URL (e.g., `https://wiki.yourdomain.com`)
2. Click the login button — you'll be redirected to your OIDC/OAuth provider
3. After authenticating, the first user to log in becomes the admin
4. Create your first collection (Outline organizes documents into collections)
5. Start writing — use `/` for slash commands, Markdown syntax works natively

## Configuration

### Authentication Providers

Outline requires an external authentication provider. No built-in username/password. Supported options:

**OIDC (recommended for self-hosters):** Works with Authentik, Keycloak, Authelia, or any OIDC-compliant provider. Set the `OIDC_*` environment variables.

**Google:** Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from Google Cloud Console. Requires a Google Cloud project with OAuth 2.0 credentials.

**Slack:** Set `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET`. Requires a Slack app.

**Azure AD:** Set `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, and `AZURE_RESOURCE_APP_ID`.

**Discord:** Set `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, and optionally `DISCORD_SERVER_ID` for server-restricted access.

### File Storage

By default, the config above uses local file storage (`FILE_STORAGE: local`). Files are stored in the `outline-data` volume. For S3-compatible storage (MinIO, AWS S3, Cloudflare R2):

```yaml
FILE_STORAGE: s3
AWS_ACCESS_KEY_ID: your_access_key
AWS_SECRET_ACCESS_KEY: your_secret_key
AWS_REGION: us-east-1
AWS_S3_UPLOAD_BUCKET_URL: https://s3.yourdomain.com
AWS_S3_UPLOAD_BUCKET_NAME: outline
AWS_S3_FORCE_PATH_STYLE: "true"
AWS_S3_ACL: private
```

### Email Notifications

Uncomment the SMTP variables in the Docker Compose file and configure with your SMTP provider. Outline sends notifications for document mentions, comments, and collection invites.

## Advanced Configuration (Optional)

### Running Behind a Reverse Proxy

When behind Nginx Proxy Manager, Traefik, or Caddy, set `FORCE_HTTPS: "false"` in the Outline environment (let the proxy handle TLS). Ensure your proxy passes the correct headers:

```
X-Forwarded-Proto: https
X-Forwarded-For: <client IP>
X-Real-IP: <client IP>
```

The `URL` environment variable must match the exact URL users access (including `https://`).

### Custom Branding

Outline supports custom team name and logo through the admin settings UI (Settings → Team → Appearance). No environment variables needed.

## Reverse Proxy

Set up a reverse proxy to access Outline over HTTPS with your domain. Point your proxy to port 3000 on the Outline container.

For detailed setup: [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

## Backup

Critical data to back up:

- **PostgreSQL database:** `docker compose exec postgres pg_dump -U outline outline > outline_backup.sql`
- **File uploads:** The `outline-data` volume (or your S3 bucket if using S3 storage)
- **Environment file:** Your `.env` with secrets

Restore database: `cat outline_backup.sql | docker compose exec -T postgres psql -U outline outline`

For a complete backup strategy: [Backup Strategy](/foundations/backup-3-2-1-rule)

## Troubleshooting

### "Invalid redirect_uri" on login

**Symptom:** OIDC login fails with an invalid redirect URI error.
**Fix:** The `URL` environment variable must exactly match the URL configured in your OIDC provider's redirect URIs. Include the protocol (`https://`) and no trailing slash.

### Blank page or 502 after startup

**Symptom:** Outline starts but shows a blank page or 502 error.
**Fix:** Wait 30-60 seconds — Outline runs database migrations on first start. Check logs with `docker compose logs outline`. Verify PostgreSQL is healthy: `docker compose exec postgres pg_isready`.

### File uploads fail

**Symptom:** Uploading images or files returns an error.
**Fix:** Check that the `outline-data` volume is writable. For S3 storage, verify bucket permissions and CORS configuration. Ensure `FILE_STORAGE_UPLOAD_MAX_SIZE` is large enough.

### "Secret key is missing" error

**Symptom:** Container fails to start with a missing secret key message.
**Fix:** Generate `SECRET_KEY` and `UTILS_SECRET` with `openssl rand -hex 32`. Both must be exactly 64 hex characters (32 bytes).

### Users can't access documents after login

**Symptom:** New users log in but can't see any collections.
**Fix:** Collections have access controls. An admin must either make collections visible to "All members" or invite specific users/groups. Check Settings → Collections.

## Resource Requirements

- **RAM:** ~200 MB idle, 400-600 MB under active use with multiple users
- **CPU:** Low to moderate — spikes during search indexing
- **Disk:** ~500 MB for the application, plus storage for uploaded files

## Verdict

Outline is the best self-hosted Notion alternative for teams that need structured documentation. The UI is fast and polished, real-time collaboration works well, and the search is excellent. The main friction point is the mandatory external auth provider — there's no simple username/password login, so you need something like Authentik, Keycloak, or a Google Workspace account.

For personal wikis where you don't want to set up OIDC, [BookStack](/apps/bookstack) is simpler. For teams already using an identity provider, Outline is the better choice.

## Related

- [Best Self-Hosted Note Taking](/best/note-taking)
- [How to Self-Host BookStack](/apps/bookstack)
- [BookStack vs Outline](/compare/bookstack-vs-outline)
- [Wiki.js vs Outline](/compare/wiki-js-vs-outline)
- [Replace Notion](/replace/notion)
- [Replace Confluence](/replace/confluence)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
