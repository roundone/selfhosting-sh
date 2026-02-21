---
title: "How to Self-Host WordPress with Docker Compose"
description: "Complete guide to self-hosting WordPress with Docker Compose, including MariaDB, performance tuning, SSL, and backup strategies."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "cms-websites"
apps:
  - wordpress
tags:
  - self-hosted
  - cms
  - wordpress
  - docker
  - website
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is WordPress?

[WordPress](https://wordpress.org) is the world's most popular content management system, powering over 40% of all websites. The self-hosted version (WordPress.org) gives you complete control over your site — no hosting fees to WordPress.com, no plugin restrictions, no arbitrary limits. You own everything: the code, the database, the content. Self-hosting WordPress replaces managed platforms like Squarespace, Wix, and WordPress.com.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 1 GB of RAM minimum (2 GB+ recommended)
- A domain name pointed at your server
- Ports 80/443 available (or a reverse proxy)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  wordpress:
    image: wordpress:6.9.1-php8.4-apache
    container_name: wordpress
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: "wordpress-db"
      WORDPRESS_DB_USER: "wordpress"
      WORDPRESS_DB_PASSWORD: "change-me-strong-password"  # CHANGE THIS
      WORDPRESS_DB_NAME: "wordpress"
      WORDPRESS_TABLE_PREFIX: "wp_"
    volumes:
      - wordpress-data:/var/www/html
    depends_on:
      wordpress-db:
        condition: service_healthy
    networks:
      - wordpress-net

  wordpress-db:
    image: mariadb:11.7
    container_name: wordpress-db
    restart: unless-stopped
    environment:
      MARIADB_ROOT_PASSWORD: "change-me-root-password"  # CHANGE THIS
      MARIADB_DATABASE: "wordpress"
      MARIADB_USER: "wordpress"
      MARIADB_PASSWORD: "change-me-strong-password"     # Must match WORDPRESS_DB_PASSWORD
    volumes:
      - wordpress-db-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - wordpress-net

volumes:
  wordpress-data:
  wordpress-db-data:

networks:
  wordpress-net:
    driver: bridge
```

**Important:** Change both `WORDPRESS_DB_PASSWORD` and `MARIADB_PASSWORD` to matching strong passwords. Change `MARIADB_ROOT_PASSWORD` to a separate strong password.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open WordPress at `http://your-server-ip:8080`
2. Select your language
3. Set up the admin account:
   - **Site Title:** Your site name
   - **Username:** Choose something other than "admin" (security)
   - **Password:** Use the generated strong password
   - **Email:** Your admin email
4. Click **Install WordPress**
5. Log in at `http://your-server-ip:8080/wp-admin`

## Configuration

### Performance: Add Redis Object Cache

WordPress makes many database queries per page load. Redis caches these queries in memory:

```yaml
  redis:
    image: redis:7-alpine
    container_name: wordpress-redis
    restart: unless-stopped
    volumes:
      - redis-data:/data
    networks:
      - wordpress-net
```

Add the Redis volume:
```yaml
volumes:
  redis-data:
```

Then in WordPress:
1. Install the **Redis Object Cache** plugin
2. Add to `wp-config.php` (or use the `WORDPRESS_CONFIG_EXTRA` environment variable):

```yaml
  wordpress:
    environment:
      WORDPRESS_CONFIG_EXTRA: |
        define('WP_REDIS_HOST', 'wordpress-redis');
        define('WP_REDIS_PORT', 6379);
```

3. Activate the plugin and enable Redis in **Settings > Redis**

### Upload Limits

The default PHP upload limit is 2 MB. Increase it:

```yaml
  wordpress:
    environment:
      WORDPRESS_CONFIG_EXTRA: |
        define('WP_MEMORY_LIMIT', '256M');
    volumes:
      - wordpress-data:/var/www/html
      - ./uploads.ini:/usr/local/etc/php/conf.d/uploads.ini:ro
```

Create `uploads.ini`:

```ini
upload_max_filesize = 64M
post_max_size = 64M
memory_limit = 256M
max_execution_time = 300
```

### Multisite

Enable WordPress Multisite to run multiple sites from one installation. Add before first setup:

```yaml
environment:
  WORDPRESS_CONFIG_EXTRA: |
    define('WP_ALLOW_MULTISITE', true);
```

Then follow the Network Setup wizard in **Tools > Network Setup** after installation.

### Security Hardening

Add security-related constants:

```yaml
environment:
  WORDPRESS_CONFIG_EXTRA: |
    define('DISALLOW_FILE_EDIT', true);    # Disable plugin/theme editor
    define('WP_AUTO_UPDATE_CORE', true);   # Auto-update core
    define('FORCE_SSL_ADMIN', true);       # Force HTTPS for admin
```

### WP-CLI

The WordPress Docker image includes WP-CLI. Run commands with:

```bash
docker exec wordpress wp --allow-root plugin list
docker exec wordpress wp --allow-root core update
docker exec wordpress wp --allow-root cache flush
```

## Reverse Proxy

Behind [Nginx Proxy Manager](/apps/nginx-proxy-manager/) or [Traefik](/apps/traefik/):

1. Forward your domain to `http://wordpress:80` (or `http://your-server:8080`)
2. Add these environment variables for proper URL handling:

```yaml
environment:
  WORDPRESS_CONFIG_EXTRA: |
    define('FORCE_SSL_ADMIN', true);
    if (isset($$_SERVER['HTTP_X_FORWARDED_PROTO']) && strpos($$_SERVER['HTTP_X_FORWARDED_PROTO'], 'https') !== false) {
      $$_SERVER['HTTPS'] = 'on';
    }
```

Note: `$$` is required in Docker Compose YAML to escape the dollar sign.

3. Set your site URL in WordPress: **Settings > General > WordPress Address** and **Site Address** to `https://yourdomain.com`

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

## Backup

Two things to back up: the database and the WordPress files (themes, plugins, uploads).

### Database Backup

```bash
docker exec wordpress-db mariadb-dump -u wordpress -p"your-password" wordpress > wordpress-backup.sql
```

### Files Backup

```bash
docker run --rm \
  -v wordpress-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/wordpress-files-backup.tar.gz /data
```

### Automated Daily Backup Script

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/opt/backups/wordpress"
mkdir -p "$BACKUP_DIR"

# Database
docker exec wordpress-db mariadb-dump -u wordpress -pchangeme wordpress > "$BACKUP_DIR/db-$DATE.sql"

# Files (uploads, plugins, themes)
docker run --rm \
  -v wordpress-data:/data \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/files-$DATE.tar.gz" /data/wp-content

# Keep only 7 days of backups
find "$BACKUP_DIR" -type f -mtime +7 -delete
```

See [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### "Error establishing a database connection"

**Symptom:** WordPress shows a database connection error.

**Fix:**
1. Verify MariaDB is running: `docker ps | grep wordpress-db`
2. Check that `WORDPRESS_DB_PASSWORD` matches `MARIADB_PASSWORD`
3. Verify the database host is `wordpress-db` (Docker service name)
4. Check MariaDB logs: `docker logs wordpress-db`

### White screen of death

**Symptom:** WordPress shows a blank white page.

**Fix:** Enable debug mode temporarily:
```yaml
environment:
  WORDPRESS_DEBUG: "1"
  WORDPRESS_CONFIG_EXTRA: |
    define('WP_DEBUG_LOG', true);
    define('WP_DEBUG_DISPLAY', false);
```

Check logs at: `docker exec wordpress cat /var/www/html/wp-content/debug.log`

### Redirect loop after enabling SSL

**Symptom:** Browser shows "too many redirects."

**Fix:** Ensure the `FORCE_SSL_ADMIN` and `HTTP_X_FORWARDED_PROTO` configuration is set correctly (see Reverse Proxy section). Also verify Site URL and WordPress URL in the database:

```bash
docker exec wordpress wp --allow-root option update siteurl "https://yourdomain.com"
docker exec wordpress wp --allow-root option update home "https://yourdomain.com"
```

### File upload fails

**Symptom:** Media uploads fail or timeout.

**Fix:** Increase PHP limits with `uploads.ini` (see Configuration section). Also check that the uploads directory is writable:
```bash
docker exec wordpress ls -la /var/www/html/wp-content/uploads
```

### Plugin/theme installation fails

**Symptom:** "Could not create directory" errors when installing plugins.

**Fix:** Check file ownership inside the container:
```bash
docker exec wordpress chown -R www-data:www-data /var/www/html/wp-content
```

## Resource Requirements

- **RAM:** 256 MB idle, 512 MB - 1 GB under traffic (depends on plugins and caching)
- **CPU:** Low for static pages, moderate with dynamic content and many plugins
- **Disk:** 100 MB for WordPress core. Grows with media uploads, plugins, and themes.

## Frequently Asked Questions

### WordPress.org vs WordPress.com — what's the difference?

WordPress.org is the free, open-source software you self-host (this guide). WordPress.com is a hosted service by Automattic — you pay them to run it. Self-hosting gives you full control, no restrictions on plugins/themes, and no monthly fees beyond your server cost.

### Is WordPress secure?

WordPress core is well-maintained. Most security issues come from outdated plugins, weak passwords, and misconfigured servers. Keep everything updated, use strong passwords, disable the file editor (`DISALLOW_FILE_EDIT`), and limit login attempts.

### Should I use WordPress or a static site generator?

For blogs and content sites that need frequent updates, WordPress is easier to manage. For developer portfolios, documentation, or sites where maximum speed matters, a static site generator (Hugo, Astro) is better. WordPress has a larger ecosystem of themes and plugins.

## Verdict

WordPress is still the most practical choice for most websites. The plugin ecosystem is unmatched — SEO, e-commerce, membership sites, forums — there's a plugin for everything. Self-hosting with Docker makes deployment and backups straightforward. The downsides: PHP-based sites are slower than static sites, and WordPress is a frequent target for automated attacks (keep it updated). For simple blogs, consider [Ghost](/apps/ghost/) which is faster and cleaner. For everything else, WordPress's flexibility is hard to beat.

## Related

- [How to Self-Host Ghost](/apps/ghost/)
- [WordPress vs Ghost](/compare/ghost-vs-wordpress/)
- [WordPress vs Hugo](/compare/wordpress-vs-hugo/)
- [Best Self-Hosted CMS](/best/cms-websites/)
- [Replace Squarespace](/replace/squarespace/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [SSL Certificates](/foundations/ssl-certificates/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
