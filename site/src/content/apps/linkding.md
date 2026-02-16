---
title: "How to Self-Host Linkding with Docker"
description: "Set up linkding with Docker Compose as a fast, minimal self-hosted bookmark manager with tags, search, and browser extensions."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "bookmarks-read-later"
apps:
  - linkding
tags:
  - docker
  - bookmarks
  - pocket-alternative
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Linkding?

[Linkding](https://github.com/sissbruecker/linkding) is a lightweight, self-hosted bookmark manager built with Python and Django. It gives you fast full-text search, tag-based organization, browser extensions for Chrome and Firefox, and a REST API for automation. Linkding replaces cloud bookmark services like Pocket, Raindrop.io, and Pinboard with something you fully control.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 256 MB of free RAM
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a directory for linkding and the `docker-compose.yml`:

```bash
mkdir -p /opt/linkding && cd /opt/linkding
```

### SQLite (Default — Recommended for Most Users)

SQLite is the default database and works well for single-user and small multi-user setups. No extra services needed.

```yaml
services:
  linkding:
    image: sissbruecker/linkding:1.45.0
    container_name: linkding
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - linkding-data:/etc/linkding/data
    environment:
      # Superuser credentials — change these before first start
      LD_SUPERUSER_NAME: "admin"
      LD_SUPERUSER_PASSWORD: "changeme-use-a-strong-password"
      LD_SUPERUSER_EMAIL: "admin@example.com"
      # Server port inside the container
      LD_SERVER_PORT: "9090"

volumes:
  linkding-data:
```

Start it:

```bash
docker compose up -d
```

### PostgreSQL (For Larger Deployments)

If you expect heavy usage or want the durability guarantees of PostgreSQL:

```yaml
services:
  linkding:
    image: sissbruecker/linkding:1.45.0
    container_name: linkding
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - linkding-data:/etc/linkding/data
    environment:
      LD_SUPERUSER_NAME: "admin"
      LD_SUPERUSER_PASSWORD: "changeme-use-a-strong-password"
      LD_SUPERUSER_EMAIL: "admin@example.com"
      LD_SERVER_PORT: "9090"
      # PostgreSQL connection
      LD_DB_ENGINE: "postgres"
      LD_DB_DATABASE: "linkding"
      LD_DB_USER: "linkding"
      LD_DB_PASSWORD: "changeme-strong-db-password"
      LD_DB_HOST: "linkding-db"
      LD_DB_PORT: "5432"
    depends_on:
      linkding-db:
        condition: service_healthy

  linkding-db:
    image: postgres:16-alpine
    container_name: linkding-db
    restart: unless-stopped
    volumes:
      - linkding-db-data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: "linkding"
      POSTGRES_USER: "linkding"
      POSTGRES_PASSWORD: "changeme-strong-db-password"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U linkding"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  linkding-data:
  linkding-db-data:
```

**Use SQLite unless you have a specific reason not to.** Linkding is a lightweight app and SQLite handles thousands of bookmarks without issue. PostgreSQL is only worthwhile if you're running a shared instance with many users or want to use an existing PostgreSQL cluster.

## Initial Setup

1. Open `http://your-server-ip:9090` in your browser.
2. Log in with the superuser credentials you set in the environment variables (`admin` / the password you chose).
3. You're in. The interface is intentionally minimal — a search bar, a list of bookmarks, and a sidebar for tags.

If you did not set superuser environment variables before first start, create an account manually:

```bash
docker exec -it linkding python manage.py createsuperuser --username=admin --email=admin@example.com
```

You will be prompted for a password.

## Configuration

### Adding Bookmarks

Click the **+** button in the top-right, paste a URL, add tags, and optionally write a description. Linkding fetches the page title and description automatically.

### Tags

Tags are the primary organizational system. Use them instead of folders. A few tips:

- Use lowercase, hyphenated tags for consistency (`self-hosting`, `docker`, `linux`)
- Linkding supports tag autocomplete, so existing tags surface as you type
- You can bulk-edit tags from the settings page

### Browser Extensions

Install the official browser extension to save bookmarks without leaving the page:

- **Firefox:** [linkding extension on Firefox Add-ons](https://addons.mozilla.org/firefox/addon/linkding-extension/)
- **Chrome/Edge:** [linkding extension on Chrome Web Store](https://chrome.google.com/webstore/detail/linkding-extension/beakmhbijpdhipnjhnclkflpcelngamh)

Configure the extension with:
- **Base URL:** `http://your-server-ip:9090` (or your reverse proxy URL)
- **API Token:** Generate one from **Settings > Integrations > REST API**

### Import and Export

Linkding supports the standard Netscape HTML bookmark format used by all major browsers:

- **Import:** Go to **Settings > General > Import** and upload an HTML bookmark file exported from Chrome, Firefox, Pocket, Pinboard, or any other service.
- **Export:** Go to **Settings > General > Export** to download all bookmarks as an HTML file.

### Sharing Bookmarks

Linkding supports shared bookmarks. Mark a bookmark as shared and it becomes visible on a public shared bookmarks page at `/bookmarks/shared`. This is off by default and per-bookmark.

## Advanced Configuration

### REST API

Linkding exposes a full REST API for creating, reading, updating, and deleting bookmarks and tags programmatically. Generate an API token from **Settings > Integrations > REST API**.

Example — list all bookmarks:

```bash
curl -H "Authorization: Token YOUR_API_TOKEN" \
  http://your-server-ip:9090/api/bookmarks/
```

Example — create a bookmark:

```bash
curl -X POST -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "tag_names": ["example", "test"]}' \
  http://your-server-ip:9090/api/bookmarks/
```

The API supports pagination, filtering by tag, and full-text search. Full documentation is at `/api/docs/` on your linkding instance.

### Authentication Proxy

If you run an authentication proxy like [Authelia](/apps/authelia) or Authentik in front of linkding, enable auth proxy support:

```yaml
environment:
  LD_ENABLE_AUTH_PROXY: "True"
  LD_AUTH_PROXY_USERNAME_HEADER: "HTTP_REMOTE_USER"
  LD_AUTH_PROXY_LOGOUT_URL: "https://auth.yourdomain.com/logout"
```

When enabled, linkding trusts the username header set by the reverse proxy and skips its own login page. Make sure your proxy strips this header from external requests to prevent spoofing.

### Context Path (Subpath Hosting)

To serve linkding under a subpath like `https://yourdomain.com/bookmarks/`:

```yaml
environment:
  LD_CONTEXT_PATH: "bookmarks"
```

Update your reverse proxy to forward `/bookmarks/` to linkding's port.

### Disable URL Validation

By default, linkding validates that URLs are well-formed. To allow non-standard URLs (local network addresses, custom schemes):

```yaml
environment:
  LD_DISABLE_URL_VALIDATION: "True"
```

### Web Archive Integration

Linkding can automatically create snapshots of bookmarked pages on the Internet Archive. Enable this from **Settings > General > Enable Web Archive integration**. This preserves a copy of the page even if the original goes down.

## Reverse Proxy

With [Nginx Proxy Manager](/apps/nginx-proxy-manager):

1. Add a proxy host for `bookmarks.yourdomain.com`
2. Forward to `http://your-server-ip:9090`
3. Enable SSL with Let's Encrypt
4. No WebSocket support needed — linkding is a standard HTTP application

With Caddy:

```
bookmarks.yourdomain.com {
    reverse_proxy localhost:9090
}
```

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for full configuration details.

## Backup

### What to Back Up

The only critical data is the `/etc/linkding/data` volume inside the container. This contains:

- The SQLite database (if using SQLite) with all bookmarks, tags, and user accounts
- Favicon cache
- Any uploaded files

```bash
# Stop linkding for a consistent backup (SQLite)
docker compose stop linkding
tar czf linkding-backup-$(date +%F).tar.gz /opt/linkding/
docker compose start linkding
```

If using PostgreSQL, dump the database separately:

```bash
docker exec linkding-db pg_dump -U linkding linkding > linkding-db-$(date +%F).sql
```

You can also export bookmarks from the web UI (**Settings > General > Export**) as a portable HTML file that can be imported into any browser or bookmark manager.

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a complete backup approach.

## Troubleshooting

### Cannot Log In After First Start

**Symptom:** The login page appears but your superuser credentials are rejected.

**Fix:** The `LD_SUPERUSER_NAME` and `LD_SUPERUSER_PASSWORD` environment variables only take effect on first startup when the database is empty. If the container has already started once, create the superuser manually:

```bash
docker exec -it linkding python manage.py createsuperuser --username=admin --email=admin@example.com
```

Or remove the data volume and restart to trigger initial setup again:

```bash
docker compose down -v
docker compose up -d
```

### Bookmarks Not Showing Titles or Descriptions

**Symptom:** Newly added bookmarks show only the URL, no title or description.

**Fix:** Linkding fetches metadata in the background. If it consistently fails, the most common cause is DNS resolution inside the container. Test it:

```bash
docker exec linkding nslookup example.com
```

If DNS fails, add a DNS server to the Compose config:

```yaml
services:
  linkding:
    dns:
      - 1.1.1.1
      - 8.8.8.8
```

### Browser Extension Cannot Connect

**Symptom:** The browser extension shows a connection error when saving bookmarks.

**Fix:** Verify three things:
1. The base URL in the extension settings matches your linkding instance exactly (include the port if not using a reverse proxy: `http://your-server-ip:9090`)
2. The API token is correct — regenerate it from **Settings > Integrations > REST API**
3. If using HTTPS with a self-signed certificate, the browser must trust the certificate

### Import Fails or Times Out

**Symptom:** Importing a large bookmark file (1000+ entries) fails or the page times out.

**Fix:** Large imports are processed in the background. After uploading, wait a few minutes and check the bookmark list. If the import genuinely failed, split the HTML file into smaller chunks (500 bookmarks each) and import them sequentially.

### High Memory Usage After Large Import

**Symptom:** Linkding uses more memory than expected after importing thousands of bookmarks.

**Fix:** This is temporary. Linkding creates background tasks to fetch metadata and favicons for imported bookmarks. Memory returns to normal once processing completes. If it persists, restart the container:

```bash
docker compose restart linkding
```

## Resource Requirements

- **RAM:** ~50 MB idle, ~120 MB during heavy imports
- **CPU:** Minimal — linkding is a lightweight Django application
- **Disk:** ~30 MB for the application image, plus ~1 KB per bookmark (a 10,000-bookmark library uses roughly 10 MB)

## Verdict

Linkding is the best self-hosted bookmark manager for people who want something fast and minimal. It launches in seconds, has a clean interface that stays out of your way, and the browser extensions make it practical for daily use. The REST API opens it up for automation. If you're coming from Pocket or Raindrop.io and just want a place to save and search links with tags, linkding is the right choice.

If you need more — full-page archiving, annotations, or collaborative collections — look at [Linkwarden](/apps/linkwarden) or [Wallabag](/apps/wallabag) instead. But for pure bookmark management, linkding does exactly what it should and nothing more.

## Related

- [How to Self-Host Wallabag](/apps/wallabag)
- [How to Self-Host Linkwarden](/apps/linkwarden)
- [Best Self-Hosted Bookmarks and Read Later Apps](/best/bookmarks-read-later)
- [Linkding vs Wallabag](/compare/linkding-vs-wallabag)
- [Replace Pocket with Self-Hosted Alternatives](/replace/pocket)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
