---
title: "How to Self-Host YOURLS with Docker Compose"
description: "Step-by-step guide to self-hosting YOURLS with Docker Compose for a private URL shortener with analytics."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "url-shorteners"
apps:
  - yourls
tags:
  - docker
  - url-shortener
  - analytics
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is YOURLS?

YOURLS (Your Own URL Shortener) is a self-hosted URL shortener that gives you full control over your short links. It includes click tracking, referrer logging, geographic data, and a bookmarklet for quick shortening. Unlike Bitly or TinyURL, your links live on your domain and you own all the analytics data. [Official site](https://yourls.org/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 500 MB of free disk space
- 256 MB of RAM minimum
- A short domain name (recommended for short URLs)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  yourls:
    image: yourls:1.9.2-apache
    container_name: yourls
    environment:
      - YOURLS_DB_HOST=yourls_db
      - YOURLS_DB_USER=yourls
      - YOURLS_DB_PASS=change-this-strong-password
      - YOURLS_DB_NAME=yourls
      - YOURLS_SITE=https://sho.rt        # Your short domain
      - YOURLS_USER=admin                  # Admin username
      - YOURLS_PASS=change-this-admin-pass # Admin password
    volumes:
      - ./plugins:/var/www/html/user/plugins
    ports:
      - "8080:80"
    depends_on:
      - yourls_db
    restart: unless-stopped

  yourls_db:
    image: mariadb:11.7
    container_name: yourls_db
    environment:
      - MYSQL_ROOT_PASSWORD=change-this-root-password
      - MYSQL_DATABASE=yourls
      - MYSQL_USER=yourls
      - MYSQL_PASSWORD=change-this-strong-password
    volumes:
      - db-data:/var/lib/mysql
    restart: unless-stopped

volumes:
  db-data:
```

**Environment variables:**

| Variable | Purpose | Required |
|----------|---------|----------|
| `YOURLS_SITE` | Your full URL including protocol | Yes — **must change** |
| `YOURLS_USER` | Admin username | Yes — **must change** |
| `YOURLS_PASS` | Admin password | Yes — **must change** |
| `YOURLS_DB_HOST` | Database hostname | Yes |
| `YOURLS_DB_USER` | Database username | Yes |
| `YOURLS_DB_PASS` | Database password | Yes — **must change** |
| `YOURLS_DB_NAME` | Database name | Yes |

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8080/admin/`
2. Click **Install YOURLS** to create the database tables
3. Log in with the credentials from `YOURLS_USER` and `YOURLS_PASS`
4. The admin panel is ready — start shortening URLs

## Configuration

### Custom Short URLs

In the admin panel, you can:

- Enter a custom keyword (e.g., `sho.rt/docs` → your documentation)
- Let YOURLS auto-generate short codes
- Set a custom title for each link

### API Access

YOURLS provides a REST API for programmatic URL shortening:

```bash
curl "https://sho.rt/yourls-api.php?signature=your-api-signature&action=shorturl&url=https://example.com/long-url&format=json"
```

Get your API signature from **Admin → Tools → API Signature**.

### Plugins

YOURLS has a plugin ecosystem. Popular plugins:

- **Sleeky:** Modern admin UI theme
- **YOURLS-IQRCodes:** QR code generation for short URLs
- **YOURLS-LDAP:** LDAP authentication
- **Force Lowercase:** Ensure all short URLs are lowercase

Install plugins by placing them in the `./plugins` volume mount.

## Advanced Configuration (Optional)

### Private vs Public

By default, YOURLS is private — only logged-in users can create short URLs. To make it public (anyone can shorten URLs):

Set `YOURLS_PRIVATE` to `false` in environment variables. Not recommended unless you add rate limiting and captcha via plugins.

### Custom Character Set

YOURLS uses base 36 (a-z, 0-9) by default. You can customize the character set in the config to include uppercase letters or exclude ambiguous characters (0/O, l/1).

### Multiple Admin Users

YOURLS supports multiple admin accounts. Add additional users by installing the multi-user plugin or editing the config file directly.

## Reverse Proxy

Example Nginx Proxy Manager configuration:

- **Scheme:** http
- **Forward Hostname:** yourls
- **Forward Port:** 80

Set `YOURLS_SITE` to your public URL (with `https://`) when using a reverse proxy. [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

## Backup

Back up the database and plugins:

```bash
docker compose exec yourls_db mariadb-dump -u yourls -p yourls > yourls-backup-$(date +%Y%m%d).sql
tar -czf yourls-plugins-backup-$(date +%Y%m%d).tar.gz ./plugins
```

[Backup Strategy](/foundations/backup-3-2-1-rule)

## Troubleshooting

### "Error connecting to database" After Install

**Symptom:** Fresh install shows database connection error.
**Fix:** Wait 10-15 seconds for MariaDB to initialize before accessing YOURLS. Check that `YOURLS_DB_PASS` matches `MYSQL_PASSWORD` exactly. Verify MariaDB is running: `docker compose logs yourls_db`.

### Short URLs Return 404

**Symptom:** Created short URLs don't redirect.
**Fix:** Ensure `YOURLS_SITE` exactly matches your URL (including protocol and no trailing slash). If behind a reverse proxy, verify the proxy passes the original URL path. Check that Apache's `mod_rewrite` is working.

### Admin Panel Locked Out

**Symptom:** Can't access `/admin/` after password change.
**Fix:** YOURLS stores credentials in the database after first run. Environment variable changes don't take effect for existing installs. Reset the password by updating the database directly or reinstalling.

### API Returns "Please log in"

**Symptom:** API calls fail with authentication errors.
**Fix:** Use the API signature (found in **Admin → Tools**), not your password. Format: `?signature=abc123&action=shorturl&url=...`. The signature is a hash of your credentials — it changes if you change your password.

## Resource Requirements

- **RAM:** ~100 MB (YOURLS + MariaDB)
- **CPU:** Very low
- **Disk:** ~50 MB for application, database grows with number of links and clicks

## Verdict

YOURLS is the standard self-hosted URL shortener. It's been around since 2009, is stable, well-documented, and has an active plugin ecosystem. If you want a private URL shortener with analytics on your own domain, YOURLS is the reliable, battle-tested choice. For a more modern alternative with built-in features like QR codes and API-first design, look at [Shlink](/apps/shlink).

## FAQ

### YOURLS vs Shlink?

YOURLS is older, more established, with a larger plugin ecosystem. Shlink is newer, API-first, and has more built-in features without plugins. Choose YOURLS for a proven solution; Shlink for a modern API-driven approach.

### Can I use YOURLS for a public link shortener?

Technically yes, but it's designed for private/personal use. For a public-facing service, you'd need rate limiting, captcha, and abuse prevention plugins. Consider [Kutt](/apps/kutt) for that use case.

### Does YOURLS support custom domains?

YOURLS runs on whatever domain you configure via `YOURLS_SITE`. To use a short domain like `sho.rt`, point that domain to your YOURLS server and set `YOURLS_SITE=https://sho.rt`.

## Related

- [How to Self-Host Shlink](/apps/shlink)
- [How to Self-Host PrivateBin](/apps/privatebin)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [Linux Basics for Self-Hosting](/foundations/linux-basics)
- [HTTPS Setup for Self-Hosted Services](/foundations/https-everywhere)
