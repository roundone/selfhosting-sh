---
title: "How to Self-Host Ghost with Docker Compose"
description: "Step-by-step guide to self-hosting Ghost CMS with Docker Compose, including MySQL setup, email configuration, and theme management."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "cms-websites"
apps:
  - ghost
tags:
  - docker
  - ghost
  - cms
  - blogging
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Ghost?

Ghost is an open-source publishing platform built for professional bloggers, journalists, and content creators. It handles content creation, memberships, newsletters, and monetization in a single platform. Think of it as a self-hosted alternative to Substack or Medium with full control over your content and audience. [Official site](https://ghost.org/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB of free disk space
- 1 GB of RAM (minimum)
- A domain name (required for production use)
- SMTP credentials for transactional email (Mailgun, SendGrid, or similar)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  ghost:
    image: ghost:5.120.0
    container_name: ghost
    environment:
      database__client: mysql
      database__connection__host: ghost_db
      database__connection__user: ghost
      database__connection__password: ghost_db_password  # Change this
      database__connection__database: ghost_db
      url: https://example.com              # MUST match your actual site URL
      NODE_ENV: production
      # Mail configuration (required for member signups and newsletters)
      # mail__transport: SMTP
      # mail__options__host: smtp.mailgun.org
      # mail__options__port: 587
      # mail__options__auth__user: postmaster@mg.example.com
      # mail__options__auth__pass: your-smtp-password
      # mail__from: noreply@example.com
    volumes:
      - ghost_content:/var/lib/ghost/content   # Themes, images, settings
    ports:
      - "2368:2368"          # Web UI
    depends_on:
      ghost_db:
        condition: service_healthy
    restart: unless-stopped

  ghost_db:
    image: mysql:8.0
    container_name: ghost_db
    environment:
      MYSQL_ROOT_PASSWORD: root_password_change_me   # Change this
      MYSQL_USER: ghost
      MYSQL_PASSWORD: ghost_db_password               # Must match above
      MYSQL_DATABASE: ghost_db
    volumes:
      - ghost_db_data:/var/lib/mysql
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  ghost_content:
  ghost_db_data:
```

Create a `.env` file for sensitive values:

```bash
# Ghost database credentials
GHOST_DB_PASSWORD=change_me_to_a_strong_password
MYSQL_ROOT_PASSWORD=change_me_root_password
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:2368/ghost` to access the admin panel
2. Create your admin account (first user becomes the owner)
3. Set your site title, description, and branding under **Settings → General**
4. Configure your publication's design under **Settings → Design**

**Important:** The `url` environment variable must exactly match the URL users will access your site at, including the protocol (`https://`). A mismatch causes asset loading failures and broken links.

## Configuration

### Email (SMTP)

Ghost needs SMTP for member signups, password resets, and newsletters. Uncomment the mail configuration in your Docker Compose and set your SMTP provider details:

```yaml
    environment:
      mail__transport: SMTP
      mail__options__host: smtp.mailgun.org
      mail__options__port: 587
      mail__options__secure: "true"
      mail__options__auth__user: postmaster@mg.example.com
      mail__options__auth__pass: your-api-key
      mail__from: "Your Blog <noreply@example.com>"
```

Ghost supports Mailgun natively for bulk newsletter sending. Configure under **Settings → Email newsletter → Mailgun**.

### Memberships and Subscriptions

Ghost has built-in membership and payment support:

- **Free members:** Collect emails, gate content behind free signup
- **Paid members:** Connect Stripe for paid subscriptions
- Configure tiers under **Settings → Membership**

### Themes

Ghost uses Handlebars templates. The default **Casper** theme is solid, but you can:

- Install themes via **Settings → Design → Change theme**
- Upload `.zip` theme files
- Edit the default theme files in the `content/themes/` directory

Popular free themes: Casper (default), Starter, Edition, Alto.

### Content API

Ghost provides two APIs:

- **Content API:** Read-only, for building custom frontends (headless CMS use)
- **Admin API:** Full CRUD, for automation and integrations

Create API keys under **Settings → Integrations → Add custom integration**.

## Advanced Configuration (Optional)

### Headless Ghost (API-only)

Ghost works well as a headless CMS. Use the Content API to fetch posts and render them with any frontend framework (Next.js, Astro, Hugo). This decouples your frontend from Ghost's built-in themes.

### Custom Redirects

Create a `redirects.yaml` or `redirects.json` file and upload via **Settings → Labs → Redirects**. Useful for maintaining SEO when migrating from another platform.

### Bulk Email with Mailgun

For newsletters to large subscriber lists, Ghost integrates directly with Mailgun's bulk sending API. This bypasses SMTP limits and provides delivery analytics. Configure under **Settings → Email newsletter**.

## Reverse Proxy

Ghost must run behind a reverse proxy for production use (HTTPS is required for memberships and Stripe).

For [Nginx Proxy Manager](/apps/nginx-proxy-manager):

- **Scheme:** `http`
- **Forward Hostname:** `ghost` (container name) or server IP
- **Forward Port:** `2368`
- Enable **Websockets Support**
- Request an SSL certificate via Let's Encrypt

Ensure the `url` environment variable matches your domain with `https://`.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for detailed configuration.

## Backup

Ghost stores content in two locations:

- **MySQL database:** All posts, members, settings, tags
- **Content volume** (`/var/lib/ghost/content`): Themes, uploaded images, redirects

Back up both. Ghost also has a built-in export under **Settings → Labs → Export content** that exports posts as JSON (but not images or themes).

For database backup:

```bash
docker compose exec ghost_db mysqldump -u ghost -p ghost_db > ghost_backup.sql
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Ghost Shows "Site is Starting Up"

**Symptom:** Browser shows a loading screen that never resolves.
**Fix:** Check logs with `docker compose logs ghost`. Common causes: database not ready yet (wait for MySQL healthcheck), incorrect `url` environment variable, or missing database credentials.

### Images Not Loading After Reverse Proxy Setup

**Symptom:** Pages load but images are broken (mixed content errors).
**Fix:** Ensure `url` is set to `https://your-domain.com` (with `https://`). Ghost generates image URLs based on this setting. If it says `http://`, images won't load over HTTPS.

### "Cannot Send Email" Errors

**Symptom:** Member signups fail or newsletters don't send.
**Fix:** Verify SMTP credentials. Test with a simple integration (Mailgun's sandbox domain works for testing). Check that port 587 is not blocked by your hosting provider. Some providers block outbound SMTP — use an API-based email service instead.

### Database Connection Refused

**Symptom:** Ghost logs show "ECONNREFUSED" for MySQL.
**Fix:** Ensure `ghost_db` container is healthy before Ghost starts. The `depends_on` with `condition: service_healthy` in the Docker Compose handles this. If the database was just created, give it a minute to initialize.

### High Memory Usage

**Symptom:** Ghost consuming 500+ MB of RAM.
**Fix:** Ghost runs on Node.js, which pre-allocates memory. This is normal for a Node.js application. For memory-constrained servers, add `node__env: production` (already set in our config) and avoid running Ghost's background jobs too frequently.

## Resource Requirements

- **RAM:** 512 MB idle, 800 MB-1 GB under moderate traffic
- **CPU:** Low to moderate (Node.js single-threaded)
- **Disk:** ~200 MB for the application, plus uploads and database

## Verdict

Ghost is the best self-hosted option for professional publishing and newsletter platforms. Its editor is excellent, the membership system is built-in (no plugins needed), and it's fast. If you're building a publication, newsletter, or content business, Ghost beats [WordPress](/apps/wordpress) on simplicity and performance. WordPress wins on extensibility and plugin ecosystem. For a blog that "just works" with modern features, Ghost is the clear choice.

## FAQ

### Ghost vs WordPress — which should I self-host?

Ghost is purpose-built for publishing — it's faster, simpler, and has built-in memberships. [WordPress](/apps/wordpress) is more flexible with thousands of plugins but requires more maintenance. See our [Ghost vs WordPress comparison](/compare/ghost-vs-wordpress) for details.

### Can I migrate from WordPress to Ghost?

Yes. Ghost has a WordPress migration plugin under **Settings → Labs → Migration**. It imports posts, tags, and authors. Images need to be migrated separately (exported from WordPress uploads directory).

### Is Ghost free to self-host?

Ghost is open source (MIT license) and free to self-host. Ghost(Pro) is the paid hosted version. Self-hosting gives you the same software without monthly fees, but you're responsible for hosting, backups, and updates.

## Related

- [How to Self-Host WordPress](/apps/wordpress)
- [Ghost vs WordPress](/compare/ghost-vs-wordpress)
- [Best Self-Hosted CMS Platforms](/best/cms-websites)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [How to Self-Host Nginx Proxy Manager](/apps/nginx-proxy-manager)
