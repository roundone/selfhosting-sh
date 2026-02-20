---
title: "How to Self-Host BookStack with Docker"
description: "Step-by-step guide to self-hosting BookStack with Docker Compose — a wiki platform for organizing documentation and knowledge."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "note-taking"
apps:
  - bookstack
tags:
  - self-hosted
  - wiki
  - documentation
  - knowledge-base
  - docker
  - notion-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is BookStack?

[BookStack](https://www.bookstackapp.com) is a self-hosted wiki and documentation platform organized around a simple hierarchy: Shelves contain Books, Books contain Chapters, and Chapters contain Pages. It has a clean WYSIWYG editor, Markdown support, diagrams, search, role-based permissions, and LDAP/SAML authentication. BookStack replaces tools like Notion, Confluence, or GitBook for teams and individuals who want to own their documentation.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM
- 1 GB of free disk space (plus storage for uploads)
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a directory and `docker-compose.yml`:

```bash
mkdir -p ~/bookstack && cd ~/bookstack
```

First, generate an application encryption key:

```bash
docker run -it --rm --entrypoint /bin/bash lscr.io/linuxserver/bookstack:v25.12.3 appkey
```

Copy the output (starts with `base64:...`) and use it as `APP_KEY` below.

```yaml
services:
  bookstack:
    image: lscr.io/linuxserver/bookstack:v25.12.3
    container_name: bookstack
    restart: unless-stopped
    ports:
      - "6875:80"
    environment:
      PUID: "1000"         # Your user ID (run: id -u)
      PGID: "1000"         # Your group ID (run: id -g)
      TZ: "America/New_York"
      APP_URL: "http://localhost:6875"  # Change to your actual URL
      APP_KEY: ""           # Paste the generated key here
      DB_HOST: bookstack-db
      DB_PORT: "3306"
      DB_DATABASE: bookstack
      DB_USERNAME: bookstack
      DB_PASSWORD: "change-this-strong-password"  # Must match MariaDB password
    volumes:
      - bookstack-config:/config
    depends_on:
      - bookstack-db

  bookstack-db:
    image: mariadb:10.11
    container_name: bookstack-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: "change-this-root-password"
      MYSQL_DATABASE: bookstack
      MYSQL_USER: bookstack
      MYSQL_PASSWORD: "change-this-strong-password"  # Must match BookStack password
    volumes:
      - bookstack-db-data:/var/lib/mysql

volumes:
  bookstack-config:
  bookstack-db-data:
```

**Important:** Replace the database passwords with strong, unique values. The `DB_PASSWORD` in the BookStack service must match `MYSQL_PASSWORD` in the MariaDB service.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open BookStack at `http://your-server-ip:6875`
2. Log in with the default credentials:
   - **Email:** `admin@admin.com`
   - **Password:** `password`
3. **Immediately** go to **Settings > Users**, edit the admin user, and change the email and password
4. Update `APP_URL` in your environment to match your actual domain if using a reverse proxy

## Configuration

### Application URL

The `APP_URL` environment variable must match how users access BookStack. If you use a reverse proxy with HTTPS:

```yaml
APP_URL: "https://wiki.yourdomain.com"
```

Restart the container after changing this. If you've already set up BookStack with a different URL, update it:

```bash
docker exec -it bookstack php /app/www/artisan bookstack:update-url "http://old-url" "https://new-url"
```

### Email (SMTP)

Configure email notifications by adding SMTP environment variables:

```yaml
environment:
  # ... existing vars ...
  MAIL_DRIVER: smtp
  MAIL_HOST: smtp.gmail.com
  MAIL_PORT: "587"
  MAIL_USERNAME: "your-email@gmail.com"
  MAIL_PASSWORD: "your-app-password"
  MAIL_ENCRYPTION: tls
  MAIL_FROM: "bookstack@yourdomain.com"
  MAIL_FROM_NAME: "BookStack"
```

### Authentication

BookStack supports multiple auth backends:

- **Standard** (default) — email/password stored in BookStack's database
- **LDAP** — connect to Active Directory or OpenLDAP
- **SAML 2.0** — SSO with providers like Authentik, Keycloak, or Okta
- **OIDC** — OpenID Connect with providers like Authelia

Configure via environment variables. See the [BookStack documentation](https://www.bookstackapp.com/docs/admin/security/) for full auth configuration.

### Storage

By default, uploads are stored locally in `/config/www/uploads/` and `/config/www/files/`. For large deployments, BookStack supports S3-compatible storage:

```yaml
environment:
  STORAGE_TYPE: s3
  STORAGE_S3_KEY: "your-access-key"
  STORAGE_S3_SECRET: "your-secret-key"
  STORAGE_S3_BUCKET: "bookstack-uploads"
  STORAGE_S3_REGION: "us-east-1"
```

## Advanced Configuration (Optional)

### Custom Themes

BookStack supports custom themes. Create a theme directory and mount it:

```yaml
volumes:
  - bookstack-config:/config
  - ./my-theme:/config/www/themes/my-theme
```

Enable the theme in **Settings > Customization** or via `APP_THEME=my-theme` environment variable.

### Async Task Processing

For better performance with large instances, enable the database queue driver:

```yaml
environment:
  QUEUE_CONNECTION: database
```

This offloads tasks like search indexing and notifications to background processing.

### Full-Text Search

BookStack uses MySQL/MariaDB full-text search by default. For better search results on large instances, consider configuring the built-in search or adding a dedicated search engine.

## Reverse Proxy

With [Nginx Proxy Manager](/apps/nginx-proxy-manager):

1. Add a proxy host pointing to `bookstack:80` (or `your-server-ip:6875`)
2. Enable SSL
3. Update `APP_URL` in BookStack to match the proxied URL
4. Restart the BookStack container

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for detailed instructions.

## Backup

Back up both the application config and the database:

```bash
# Stop to ensure consistency
docker compose stop

# Backup application data (config, uploads, themes)
docker run --rm -v bookstack-config:/config -v $(pwd):/backup alpine tar czf /backup/bookstack-config-backup.tar.gz /config

# Backup database
docker run --rm -v bookstack-db-data:/var/lib/mysql -v $(pwd):/backup alpine tar czf /backup/bookstack-db-backup.tar.gz /var/lib/mysql

docker compose start
```

Alternatively, use MariaDB's built-in dump for a portable database backup:

```bash
docker exec bookstack-db mysqldump -u bookstack -p'your-password' bookstack > bookstack-db.sql
```

The `/config` volume contains uploaded files, images, and themes. The database contains all page content, user accounts, and settings. Both are critical. See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### "The page has expired due to inactivity"

**Symptom:** Form submissions fail with a session expiration error

**Fix:** This is usually caused by a mismatched `APP_URL`. Ensure `APP_URL` exactly matches the URL in your browser, including the protocol (http vs https) and port.

### Images not loading or uploads failing

**Symptom:** Uploaded images show broken links

**Fix:** Check that `APP_URL` is correct and that the `/config` volume has proper permissions:
```bash
docker exec bookstack ls -la /config/www/uploads/
```

### Database connection refused

**Symptom:** "Connection refused" error on startup

**Fix:** Ensure the MariaDB container is running and healthy before BookStack starts:
```bash
docker ps
docker logs bookstack-db
```

If using `depends_on`, note that it only waits for the container to start, not for MariaDB to be ready. On first run, MariaDB may need 30-60 seconds to initialize. Restart BookStack if it failed on first attempt:
```bash
docker compose restart bookstack
```

### Password special characters causing issues

**Symptom:** BookStack can't connect to database despite correct password

**Fix:** Non-alphanumeric characters in `DB_PASSWORD` must be properly escaped. Use only alphanumeric characters in database passwords to avoid issues, or ensure special characters are correctly quoted.

## Resource Requirements

- **RAM:** ~150 MB idle, ~300 MB under active use
- **CPU:** Low — BookStack is a lightweight PHP application
- **Disk:** ~200 MB for the application, plus storage for uploaded files and images

## Frequently Asked Questions

### Is BookStack free?

Yes. BookStack is fully open source under the MIT license. No paid tiers, no feature restrictions.

### Can I import from Notion or Confluence?

BookStack doesn't have a direct import from Notion, but it supports Markdown import for pages. For Confluence, export pages as HTML and import them. Several community tools exist for migration assistance.

### Can I run BookStack on a Raspberry Pi?

Yes. BookStack runs well on a Raspberry Pi 4 with 2+ GB RAM. The LinuxServer.io image supports arm64.

### How does BookStack compare to Wiki.js?

BookStack uses a book/chapter/page hierarchy. [Wiki.js](/apps/wiki-js) uses a flat page structure with folder organization. BookStack is simpler and better for structured documentation. Wiki.js is more flexible and supports multiple editors (Markdown, WYSIWYG, raw HTML).

## Verdict

BookStack is the best self-hosted wiki for teams that want structured, organized documentation without complexity. The shelf/book/chapter/page hierarchy forces content organization in a way that flat wikis don't. The WYSIWYG editor is good enough for non-technical users, and Markdown mode satisfies developers. For personal notes and more freeform knowledge management, look at [Outline](/apps/outline) or [SiYuan](/apps/siyuan). For a traditional wiki with maximum flexibility, consider [Wiki.js](/apps/wiki-js).

## Related

- [Best Self-Hosted Note Taking & Knowledge](/best/note-taking)
- [BookStack vs Wiki.js](/compare/bookstack-vs-wiki-js)
- [BookStack vs Outline](/compare/bookstack-vs-outline)
- [Replace Notion](/replace/notion)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [How to Self-Host Nginx Proxy Manager](/apps/nginx-proxy-manager)
