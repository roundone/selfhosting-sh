---
title: "How to Self-Host HedgeDoc with Docker Compose"
description: "Step-by-step guide to self-hosting HedgeDoc with Docker Compose for real-time collaborative Markdown editing and note sharing."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "note-taking"
apps:
  - hedgedoc
tags:
  - self-hosted
  - hedgedoc
  - markdown
  - collaboration
  - docker
  - notes
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is HedgeDoc?

[HedgeDoc](https://hedgedoc.org/) is a self-hosted, real-time collaborative Markdown editor. Share a link and multiple people can edit the same document simultaneously — like Google Docs, but for Markdown. It's the open-source successor to CodiMD (and before that, HackMD). HedgeDoc is ideal for meeting notes, documentation drafts, and any situation where you need shared, live-editing Markdown without a cloud service.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 500 MB of free disk space
- 512 MB of RAM (minimum)
- A domain name (recommended for sharing notes)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  hedgedoc:
    image: quay.io/hedgedoc/hedgedoc:1.10.2
    container_name: hedgedoc
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      # Database connection
      CMD_DB_URL: "postgres://hedgedoc:your_db_password@hedgedoc-db:5432/hedgedoc"

      # REQUIRED — Domain where HedgeDoc is accessed
      # Must include protocol. Used for generating share links.
      CMD_DOMAIN: "hedgedoc.example.com"
      CMD_PROTOCOL_USESSL: "true"
      CMD_URL_ADDPORT: "false"

      # Session secret — generate with: openssl rand -hex 32
      CMD_SESSION_SECRET: "CHANGE_ME_GENERATE_RANDOM_HEX_STRING"

      # Registration and permissions
      CMD_ALLOW_ANONYMOUS: "true"       # Allow anonymous editing (no login)
      CMD_ALLOW_ANONYMOUS_EDITS: "true" # Allow anonymous users to edit shared notes
      CMD_EMAIL: "true"                 # Enable email/password registration
      CMD_ALLOW_EMAIL_REGISTER: "true"  # Allow new account creation

      # Image uploads
      CMD_IMAGE_UPLOAD_TYPE: "filesystem"
      CMD_UPLOADS_DIR: "/hedgedoc/public/uploads"
    volumes:
      - hedgedoc-uploads:/hedgedoc/public/uploads
    depends_on:
      hedgedoc-db:
        condition: service_healthy

  hedgedoc-db:
    image: postgres:16-alpine
    container_name: hedgedoc-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: hedgedoc
      POSTGRES_PASSWORD: your_db_password  # CHANGE THIS — must match CMD_DB_URL
      POSTGRES_DB: hedgedoc
    volumes:
      - hedgedoc-pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hedgedoc"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  hedgedoc-uploads:
  hedgedoc-pgdata:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

Open `https://hedgedoc.example.com` (or `http://your-server-ip:3000`). You'll see the HedgeDoc landing page with options to create a new note.

1. **Create an account** — click "Sign In" and register with email/password (if `CMD_EMAIL` is enabled).
2. **Create your first note** — click "New Note" or visit `/new`. Start typing Markdown on the left; see the rendered preview on the right.
3. **Share a note** — copy the URL from your browser. Anyone with the link can view (and edit, if anonymous editing is enabled).

## Configuration

### Permission Modes

Each note has a permission level:

- **Freely** — anyone with the link can edit
- **Editable** — logged-in users can edit, anonymous can view
- **Limited** — only the owner can edit, others can view
- **Locked** — only the owner can view and edit
- **Protected** — logged-in users can view, only owner can edit
- **Private** — only the owner can access

Set the default with `CMD_DEFAULT_PERMISSION`:

```yaml
CMD_DEFAULT_PERMISSION: "editable"
```

### Authentication Options

HedgeDoc supports multiple auth providers:

```yaml
# LDAP
CMD_LDAP_URL: "ldap://your-ldap-server"
CMD_LDAP_BINDDN: "cn=admin,dc=example,dc=com"
CMD_LDAP_BINDCREDENTIALS: "ldap_password"
CMD_LDAP_SEARCHBASE: "dc=example,dc=com"

# OAuth2 / OIDC (works with Keycloak, Authentik, etc.)
CMD_OAUTH2_BASEURL: "https://auth.example.com"
CMD_OAUTH2_CLIENT_ID: "hedgedoc"
CMD_OAUTH2_CLIENT_SECRET: "your_client_secret"
CMD_OAUTH2_AUTHORIZATION_URL: "https://auth.example.com/authorize"
CMD_OAUTH2_TOKEN_URL: "https://auth.example.com/token"
CMD_OAUTH2_USER_PROFILE_URL: "https://auth.example.com/userinfo"

# GitHub, GitLab, Google, Twitter, etc. also supported
```

### Image Upload Options

```yaml
# Local filesystem (default)
CMD_IMAGE_UPLOAD_TYPE: "filesystem"

# S3-compatible storage
CMD_IMAGE_UPLOAD_TYPE: "s3"
CMD_S3_BUCKET: "hedgedoc-uploads"
CMD_S3_ENDPOINT: "https://s3.example.com"
CMD_S3_ACCESS_KEY_ID: "your_key"
CMD_S3_SECRET_ACCESS_KEY: "your_secret"

# Imgur (public uploads)
CMD_IMAGE_UPLOAD_TYPE: "imgur"
CMD_IMGUR_CLIENTID: "your_imgur_client_id"
```

### Disabling Registration

To run HedgeDoc as a private instance (no new signups):

```yaml
CMD_ALLOW_EMAIL_REGISTER: "false"
CMD_ALLOW_ANONYMOUS: "false"
```

Create accounts manually or use an external auth provider.

## Advanced Configuration (Optional)

### Custom Branding

```yaml
CMD_TITLE: "Team Notes"             # Page title
CMD_DEFAULT_USE_HARD_BREAK: "true"  # Hard line breaks in Markdown
CMD_HSTS_ENABLE: "true"             # HTTP Strict Transport Security
CMD_CSP_ENABLE: "true"              # Content Security Policy
```

### Slide Mode

HedgeDoc can render Markdown as presentation slides using reveal.js. Add `---` between slides in your document and access `/slide/note-id` for the presentation view. No extra configuration needed.

### Note Aliases

Set custom URLs for notes by adding `---` YAML frontmatter:

```markdown
---
permalink: /team-meeting-notes
---
# Team Meeting Notes
...
```

## Reverse Proxy

HedgeDoc runs on port 3000. Point your reverse proxy to `http://hedgedoc:3000`.

WebSocket support is required for real-time collaboration. Ensure your reverse proxy passes WebSocket upgrade headers:

**Nginx:**

```nginx
location / {
    proxy_pass http://hedgedoc:3000;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Set `CMD_DOMAIN`, `CMD_PROTOCOL_USESSL`, and `CMD_URL_ADDPORT` to match your reverse proxy setup. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Back up two things:

1. **PostgreSQL database** — all notes, user accounts, permissions
2. **Uploads volume** — images and files uploaded to notes

```bash
# Database backup
docker exec hedgedoc-db pg_dump -U hedgedoc hedgedoc > hedgedoc-db-$(date +%Y%m%d).sql

# Uploads backup
docker run --rm -v hedgedoc_hedgedoc-uploads:/data -v $(pwd):/backup alpine \
  tar -czf /backup/hedgedoc-uploads-$(date +%Y%m%d).tar.gz /data
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Real-Time Collaboration Not Working

**Symptom:** Multiple users can't see each other's changes in real time.

**Fix:** WebSocket connections are required. Check your reverse proxy configuration — it must pass `Upgrade` and `Connection` headers. If using Nginx Proxy Manager, enable "WebSockets Support" for the proxy host.

### "Forbidden" Error on Note Access

**Symptom:** Users get a 403 error when opening a note link.

**Fix:** Check `CMD_ALLOW_ANONYMOUS`. If set to `false`, users must log in before viewing any notes. If you want public read access, set:

```yaml
CMD_ALLOW_ANONYMOUS: "true"
CMD_ALLOW_ANONYMOUS_EDITS: "false"
```

### Images Not Loading

**Symptom:** Uploaded images show as broken links.

**Fix:** If using filesystem uploads, ensure the uploads volume is mounted correctly. If `CMD_DOMAIN` doesn't match the actual access URL, image URLs will be wrong. Double-check `CMD_DOMAIN` and `CMD_PROTOCOL_USESSL`.

### Database Connection Failed

**Symptom:** HedgeDoc crashes on startup with "connection refused" or "authentication failed."

**Fix:** Verify `CMD_DB_URL` matches the PostgreSQL container's credentials. The format is:

```
postgres://USER:PASSWORD@HOST:PORT/DBNAME
```

Ensure the database container is healthy before HedgeDoc starts (the healthcheck in the config above handles this).

### Notes Lost After Upgrade

**Symptom:** After updating the HedgeDoc image, notes are gone.

**Fix:** Notes are in PostgreSQL, not in the HedgeDoc container. Ensure your `hedgedoc-pgdata` volume persists. If you accidentally removed the volume, restore from backup.

## Resource Requirements

- **RAM:** ~150-200 MB idle (HedgeDoc + PostgreSQL), ~300-500 MB under active collaborative editing
- **CPU:** Low for editing. Moderate spikes when rendering complex Markdown or slides
- **Disk:** ~200 MB for the application. Database grows based on note count and uploads

## Verdict

HedgeDoc is the best self-hosted option for real-time collaborative Markdown editing. The share-a-link-and-edit model is simple and intuitive. Slide mode is a nice bonus. If your team writes in Markdown and needs a shared scratch pad, HedgeDoc is the tool.

It's not a knowledge base — there's no folder structure, no search across notes, no wiki-style organization. For that, use [BookStack](/apps/bookstack) or [Outline](/apps/outline). HedgeDoc is for collaborative editing sessions, meeting notes, and shared documents. For that specific use case, it's excellent.

[Etherpad](/apps/etherpad) is the main alternative for real-time collaborative editing, but it uses rich text instead of Markdown. If your team prefers Markdown, HedgeDoc wins.

## Related

- [How to Self-Host Etherpad](/apps/etherpad)
- [HedgeDoc vs Etherpad](/compare/hedgedoc-vs-etherpad)
- [How to Self-Host BookStack](/apps/bookstack)
- [How to Self-Host Outline](/apps/outline)
- [Best Self-Hosted Note Taking Apps](/best/note-taking)
- [Self-Hosted Alternatives to Notion](/replace/notion)
- [Self-Hosted Alternatives to Confluence](/replace/confluence)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
