---
title: "How to Self-Host Wiki.js with Docker Compose"
description: "Deploy Wiki.js with Docker Compose — a powerful open-source wiki with Markdown, visual editor, Git sync, and full-text search."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "note-taking-knowledge"
apps:
  - wiki-js
tags:
  - self-hosted
  - wiki-js
  - docker
  - wiki
  - knowledge-base
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Wiki.js?

[Wiki.js](https://js.wiki/) is an open-source wiki platform built on Node.js. It supports multiple editors (Markdown, visual WYSIWYG, and raw HTML), Git-based storage sync, full-text search, and fine-grained access control. Wiki.js can store content in PostgreSQL while simultaneously syncing to a Git repository for version control and backup.

Wiki.js is a strong choice for technical documentation, team wikis, and knowledge bases where you want structured content with multiple editor options.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of RAM minimum (2 GB recommended)
- 5 GB of free disk space
- A domain name (recommended for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  wikijs:
    image: ghcr.io/requarks/wiki:2.5
    ports:
      - "3000:3000"
    environment:
      DB_TYPE: postgres
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: wikijs
      DB_PASS: ${DB_PASSWORD}
      DB_NAME: wikijs
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: wikijs
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: wikijs
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wikijs -d wikijs"]
      interval: 10s
      timeout: 3s
      retries: 3
    restart: unless-stopped

volumes:
  postgres-data:
```

Create a `.env` file alongside:

```bash
# PostgreSQL password — use a strong random password
DB_PASSWORD=change_me_strong_password
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Navigate to `http://your-server-ip:3000`
2. The setup wizard runs on first access:
   - **Admin Email:** Enter your administrator email address
   - **Admin Password:** Set a strong admin password
   - **Site URL:** Enter the full URL where Wiki.js will be accessible (e.g., `https://wiki.yourdomain.com`)
3. Click "Install" — Wiki.js creates the database schema and loads default configuration
4. Log in with your admin credentials
5. Create your first page — the Home page is created by default

## Configuration

### Editor Options

Wiki.js supports three editor types per page:

- **Markdown:** Full Markdown with extensions (tables, task lists, diagrams via Mermaid/PlantUML)
- **Visual Editor:** WYSIWYG editor based on CKEditor for non-technical users
- **Raw HTML:** Direct HTML editing for advanced layouts

The editor type is set per page and can't be changed after creation.

### Authentication

Wiki.js has built-in local authentication (email/password) and supports:

- **LDAP/Active Directory**
- **OIDC (OpenID Connect)** — works with Authentik, Keycloak, Authelia
- **OAuth2** — Google, GitHub, Discord, Slack, and many others
- **SAML 2.0** — for enterprise SSO

Configure under Administration → Authentication.

### Git Storage Sync

One of Wiki.js's standout features. Under Administration → Storage, enable Git sync to push all content to a Git repository. This provides:

- Real-time backup of all pages to Git
- Version history through Git commits
- Ability to edit pages by committing to the repo
- Disaster recovery — rebuild Wiki.js from the Git repo

### Search

Wiki.js supports multiple search engines:

- **Database** (default) — PostgreSQL full-text search, works without additional setup
- **Elasticsearch** — for large wikis with heavy search usage
- **Algolia** — cloud search service
- **Manticore** — open-source search engine

Database search is sufficient for most self-hosted setups.

## Advanced Configuration (Optional)

### HTTPS with Built-in SSL

Wiki.js can terminate TLS directly if you're not using a reverse proxy:

```yaml
environment:
  SSL_ACTIVE: "true"
  LETSENCRYPT_DOMAIN: wiki.yourdomain.com
  LETSENCRYPT_EMAIL: admin@yourdomain.com
```

For most self-hosters, using a reverse proxy is recommended instead.

### Custom Theming

Under Administration → Theme, you can customize colors, add custom CSS, and inject JavaScript. Wiki.js supports dark mode toggle for readers.

## Reverse Proxy

Set up a reverse proxy to access Wiki.js over HTTPS. Point your proxy to port 3000. Update the Site URL in Administration → General to match your external URL.

For detailed setup: [Reverse Proxy Setup](/foundations/reverse-proxy)

## Backup

Critical data to back up:

- **PostgreSQL database:** `docker compose exec postgres pg_dump -U wikijs wikijs > wikijs_backup.sql`
- **Git sync (if enabled):** Your Git repository already serves as a content backup
- **Environment file:** Your `.env` with the database password

Restore database: `cat wikijs_backup.sql | docker compose exec -T postgres psql -U wikijs wikijs`

For a complete backup strategy: [Backup Strategy](/foundations/backup-strategy)

## Troubleshooting

### Wiki.js stuck on "Loading..." screen

**Symptom:** The page loads but shows an infinite loading spinner.
**Fix:** Check that PostgreSQL is healthy: `docker compose exec postgres pg_isready`. Check Wiki.js logs: `docker compose logs wikijs`. Common cause: incorrect database credentials or PostgreSQL not yet ready.

### "ECONNREFUSED" database connection error

**Symptom:** Wiki.js logs show database connection refused.
**Fix:** Ensure the `DB_HOST` matches the PostgreSQL service name (`postgres` in the Compose file). Verify PostgreSQL is running: `docker compose ps`. The `depends_on` with health check should prevent this, but if PostgreSQL is slow to initialize, restart Wiki.js: `docker compose restart wikijs`.

### Git sync fails with authentication error

**Symptom:** Storage sync shows authentication failure.
**Fix:** For SSH-based Git repos, ensure the SSH key is mounted into the container. For HTTPS repos, use a personal access token in the URL. Check that the repository exists and the token has write access.

### Pages show wrong URL after changing site URL

**Symptom:** Internal links point to the old URL.
**Fix:** Update the Site URL in Administration → General. Clear the page cache in Administration → Utilities. Some links stored in page content may need manual updating.

## Resource Requirements

- **RAM:** ~150 MB idle, 300-500 MB under active use
- **CPU:** Low — Node.js single-threaded, spikes during search indexing
- **Disk:** ~200 MB for the application, plus database storage for content

## Verdict

Wiki.js is the best self-hosted wiki for teams that want multiple editor options and Git-based content sync. The Markdown editor is excellent, the visual editor makes it accessible to non-technical users, and Git sync provides a robust backup and version control story.

The downside compared to [Outline](/apps/outline) is that Wiki.js feels more like a traditional wiki than a modern documentation tool — the UI is functional but not as polished. Compared to [BookStack](/apps/bookstack), Wiki.js offers more flexibility (Git sync, multiple editors) but BookStack has a simpler, more intuitive navigation structure.

Choose Wiki.js if Git-based content management matters to you.

## Related

- [Best Self-Hosted Note Taking](/best/note-taking)
- [How to Self-Host BookStack](/apps/bookstack)
- [How to Self-Host Outline](/apps/outline)
- [BookStack vs Wiki.js](/compare/bookstack-vs-wiki-js)
- [Wiki.js vs Outline](/compare/wiki-js-vs-outline)
- [Replace Notion](/replace/notion)
- [Replace Confluence](/replace/confluence)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
