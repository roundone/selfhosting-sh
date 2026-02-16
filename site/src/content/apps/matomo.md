---
title: "How to Self-Host Matomo with Docker"
description: "Deploy Matomo analytics with Docker Compose — a full-featured, privacy-focused Google Analytics alternative you control."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "analytics"
apps: ["matomo"]
tags: ["self-hosted", "matomo", "docker", "analytics", "privacy"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Matomo?

Matomo (formerly Piwik) is the most feature-rich self-hosted web analytics platform available. It gives you everything Google Analytics does — pageviews, referrers, goals, funnels, e-commerce tracking, custom dimensions, a tag manager — except you own the data and the infrastructure. It's GDPR compliant out of the box and can run in cookieless mode, which means no consent banners required.

If you need a full Google Analytics replacement with plugin extensibility and enterprise-grade reporting, Matomo is the tool. If you just need simple visitor counts and top pages, look at [Plausible](/apps/plausible) or [Umami](/apps/umami) instead — they're lighter and simpler.

[Official site: matomo.org](https://matomo.org) | [GitHub: matomo-org/matomo](https://github.com/matomo-org/matomo)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB of RAM minimum (4 GB recommended for sites with significant traffic)
- 10 GB of free disk space (grows with traffic volume)
- A domain name pointed at your server (for HTTPS and the tracking endpoint)

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/matomo && cd /opt/matomo
```

Create a `docker-compose.yml` file:

```yaml
services:
  matomo:
    image: matomo:5.7.1-apache
    container_name: matomo
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      MATOMO_DATABASE_HOST: matomo-db
      MATOMO_DATABASE_USERNAME: ${DB_USER}
      MATOMO_DATABASE_PASSWORD: ${DB_PASSWORD}
      MATOMO_DATABASE_DBNAME: ${DB_NAME}
    volumes:
      - matomo-data:/var/www/html
    networks:
      - matomo-net
    depends_on:
      matomo-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/matomo.php"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  matomo-db:
    image: mariadb:11.4.5
    container_name: matomo-db
    restart: unless-stopped
    environment:
      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MARIADB_DATABASE: ${DB_NAME}
      MARIADB_USER: ${DB_USER}
      MARIADB_PASSWORD: ${DB_PASSWORD}
    volumes:
      - matomo-db-data:/var/lib/mysql
    networks:
      - matomo-net
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s

volumes:
  matomo-data:
    driver: local
  matomo-db-data:
    driver: local

networks:
  matomo-net:
    driver: bridge
```

Create a `.env` file alongside it:

```bash
# Database credentials — change ALL of these before starting
DB_ROOT_PASSWORD=change_me_root_password_here
DB_NAME=matomo
DB_USER=matomo
DB_PASSWORD=change_me_strong_password_here
```

**Change every password value before deploying.** Use `openssl rand -base64 24` to generate strong passwords.

Start the stack:

```bash
docker compose up -d
```

Wait about 30 seconds for MariaDB to initialize, then verify both containers are healthy:

```bash
docker compose ps
```

You should see both `matomo` and `matomo-db` with status `Up (healthy)`.

## Initial Setup

Open `http://your-server-ip:8080` in a browser. Matomo's web installer walks you through the remaining configuration.

**Step 1 — System Check.** Matomo verifies PHP extensions and file permissions. Everything should pass with the official Docker image. If you see a file permission warning, run:

```bash
docker exec matomo chown -R www-data:www-data /var/www/html
```

**Step 2 — Database Setup.** The installer asks for database credentials. The Docker environment variables pre-fill most of this, but confirm:

- Database server: `matomo-db`
- Login: your `DB_USER` value
- Password: your `DB_PASSWORD` value
- Database name: your `DB_NAME` value
- Table prefix: leave as `matomo_`

**Step 3 — Super User.** Create your admin account. Use a strong password — this account has full access to all analytics data.

**Step 4 — First Website.** Enter the name, URL, and timezone of the first site you want to track. You can add more sites later.

**Step 5 — Tracking Code.** Matomo gives you a JavaScript snippet. Copy it and paste it into the `<head>` of every page on your tracked site:

```html
<!-- Matomo -->
<script>
  var _paq = window._paq = window._paq || [];
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  (function() {
    var u="https://analytics.yourdomain.com/";
    _paq.push(['setTrackerUrl', u+'matomo.php']);
    _paq.push(['setSiteId', '1']);
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
  })();
</script>
<!-- End Matomo Code -->
```

Replace `analytics.yourdomain.com` with your actual Matomo domain and update the site ID if it differs.

## Configuration

### Goals and Conversions

Navigate to **Administration → Websites → Goals**. Define goals for key user actions — form submissions, signups, purchases, or specific page visits. Matomo tracks conversion rates against these goals across all your reports.

### Custom Dimensions

Custom dimensions let you attach metadata to visits or actions. Go to **Administration → Websites → Custom Dimensions**. Common uses:

- **Visit-scoped:** logged-in vs anonymous users, user plan tier, A/B test variant
- **Action-scoped:** article category, author, content type

Add the dimension in the Matomo UI, then send data from your tracking code:

```javascript
_paq.push(['setCustomDimension', customDimensionId = 1, customDimensionValue = 'premium']);
```

### GDPR Consent Mode

Matomo supports two consent modes out of the box:

**Consent required (default EU-compliant):** Matomo doesn't track until the user gives consent.

```javascript
// Require consent before tracking
_paq.push(['requireConsent']);

// Call this when the user accepts cookies
_paq.push(['setConsentGiven']);
```

**No consent required (cookieless — see Advanced Configuration below):** The better option if you want to skip consent banners entirely.

### Tag Manager

Matomo includes a built-in tag manager at **Administration → Tag Manager**. You can manage all your tracking pixels, conversion scripts, and third-party tags from Matomo instead of editing site code for each one. It works the same way as Google Tag Manager but keeps the data on your server.

## Advanced Configuration

### Cookieless Tracking

This is the killer feature for GDPR compliance. With cookieless tracking, Matomo uses a fingerprinting-free method to count unique visitors without storing anything on the user's device. No cookies, no consent banners required.

Add this to your tracking code before `trackPageView`:

```javascript
_paq.push(['disableCookies']);
_paq.push(['trackPageView']);
```

The trade-off: returning visitor detection is less accurate across sessions. For most sites, this is worth it to eliminate the consent banner entirely.

### GeoIP Location

The official Docker image ships with the GeoIP2 database by default. Verify it's active at **Administration → System → Geolocation**. Select **GeoIP 2 (Php)** as the location provider.

For higher accuracy, switch to the **DBIP / GeoIP 2 (Php)** provider and configure automatic database updates. Go to the Geolocation settings page and set the download URL for the DBIP City Lite database — it's free and updates monthly.

### Scheduled Tasks (Archiving via Cron)

By default, Matomo processes reports on-demand when you view them. For sites with significant traffic, this makes the UI slow. Switch to scheduled archiving by adding a cron container to your `docker-compose.yml`:

```yaml
  matomo-cron:
    image: matomo:5.7.1-apache
    container_name: matomo-cron
    restart: unless-stopped
    entrypoint: /bin/bash
    command: >
      -c "while true; do
        php /var/www/html/console core:archive --url=http://matomo;
        sleep 3600;
      done"
    volumes:
      - matomo-data:/var/www/html
    networks:
      - matomo-net
    depends_on:
      matomo-db:
        condition: service_healthy
```

Then disable browser-triggered archiving. Add this line to `/var/www/html/config/config.ini.php` inside the `[General]` section (create the file or edit via `docker exec`):

```ini
[General]
browser_archiving_disabled_enforce = 1
```

This processes reports every hour in the background. Adjust the `sleep` value if you need more frequent updates.

### Email Reports

Matomo can email scheduled reports (daily, weekly, monthly) to stakeholders. Configure SMTP at **Administration → System → General Settings → Email server settings**:

- Transport: `smtp`
- SMTP server: your mail server hostname
- SMTP port: `587` (TLS) or `465` (SSL)
- Authentication: your SMTP credentials

Then create scheduled reports at **Personal → Email Reports**.

## Reverse Proxy

Matomo should sit behind a reverse proxy with HTTPS in production. The tracking endpoint receives data from every visitor to your tracked sites — it must be fast and encrypted.

### Nginx Proxy Manager

Add a proxy host pointing to `matomo:80` (or `your-server-ip:8080` if NPM runs outside Docker). Enable SSL with Let's Encrypt. No custom configuration needed.

### Caddy

```
analytics.yourdomain.com {
    reverse_proxy matomo:80
}
```

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name analytics.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/analytics.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/analytics.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

After setting up the reverse proxy, tell Matomo it's behind one. Add to `config/config.ini.php`:

```ini
[General]
force_ssl = 1
assume_secure_protocol = 1
proxy_client_headers[] = HTTP_X_FORWARDED_FOR
```

For a detailed reverse proxy walkthrough, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Matomo stores data in two places:

1. **MariaDB database** — all analytics data, site configuration, user accounts
2. **Matomo data volume** — config files, plugins, GeoIP databases, custom logos

### Database Backup

```bash
docker exec matomo-db mariadb-dump -u root -p"$(grep DB_ROOT_PASSWORD .env | cut -d= -f2)" matomo > matomo-db-backup-$(date +%Y%m%d).sql
```

### File Backup

```bash
docker run --rm -v matomo-data:/data -v $(pwd)/backups:/backup alpine \
  tar czf /backup/matomo-files-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore

```bash
# Restore database
docker exec -i matomo-db mariadb -u root -p"$(grep DB_ROOT_PASSWORD .env | cut -d= -f2)" matomo < matomo-db-backup-20260216.sql

# Restore files
docker run --rm -v matomo-data:/data -v $(pwd)/backups:/backup alpine \
  tar xzf /backup/matomo-files-20260216.tar.gz -C /data
```

Run backups on a schedule. The database is the critical piece — analytics data is irreplaceable. See [Backup Strategy](/foundations/backup-strategy) for a complete approach.

## Troubleshooting

### Matomo Shows "No Data" After Installing Tracking Code

**Symptom:** Tracking code is on your site, but Matomo shows zero visits.

**Fix:** Open browser developer tools on your tracked site and check the Network tab for requests to `matomo.php`. Common causes:

- The Matomo URL in the tracking snippet is wrong or unreachable from the browser
- An ad blocker is blocking `matomo.js` — test in an incognito window with extensions disabled
- Mixed content: your site is HTTPS but the tracking URL is HTTP. Fix the URL in the snippet or configure `force_ssl` in Matomo's config
- The site ID in the tracking code doesn't match the site ID in Matomo's admin

### "Database Connection Failed" on Startup

**Symptom:** Matomo container starts but shows a database connection error in the browser.

**Fix:** Verify the database container is healthy first:

```bash
docker compose ps matomo-db
docker compose logs matomo-db
```

If MariaDB isn't ready yet, wait 30 seconds — the health check has a start period. If it's running but Matomo can't connect, confirm your `.env` values match and that `MATOMO_DATABASE_HOST` is set to `matomo-db` (the service name), not `localhost`.

### File Permission Errors

**Symptom:** "Unable to write to directory" errors in the Matomo UI, or plugins fail to install.

**Fix:** The `www-data` user inside the container needs write access to the data volume:

```bash
docker exec matomo chown -R www-data:www-data /var/www/html/tmp
docker exec matomo chown -R www-data:www-data /var/www/html/config
docker exec matomo chown -R www-data:www-data /var/www/html/plugins
```

### Reports Are Slow to Load

**Symptom:** Dashboard and report pages take 10+ seconds to render, especially for date ranges spanning months.

**Fix:** You're using browser-triggered archiving, which processes reports on every page load. Switch to cron-based archiving (see Advanced Configuration above). This pre-processes reports in the background so the UI only reads cached data.

### "Trusted Host" Error After Setting Up Reverse Proxy

**Symptom:** Matomo shows "You are requesting Matomo from an untrusted host" after configuring a domain via reverse proxy.

**Fix:** Add your domain to the trusted hosts list in `config/config.ini.php`:

```ini
[General]
trusted_hosts[] = "analytics.yourdomain.com"
```

Or add it through the UI at **Administration → System → General Settings → Trusted Matomo Hostname**.

## Resource Requirements

- **RAM:** ~200 MB idle, 500 MB–1 GB under load with report processing. Budget 2 GB minimum on the server.
- **CPU:** Medium. PHP-based, so report archiving is CPU-intensive. One or two cores handles moderate traffic fine. Heavy sites (100K+ pageviews/day) benefit from more.
- **Disk:** ~500 MB for the application. Database grows roughly 1 GB per million pageviews tracked, depending on what you log. Plan storage based on your traffic volume.

Matomo is significantly heavier than [Plausible](/apps/plausible) or [Umami](/apps/umami). It earns that weight with deeper analytics capabilities.

## Verdict

Matomo is the right choice when you need a full Google Analytics replacement — not just visitor counts but funnels, e-commerce tracking, custom dimensions, tag management, heatmaps (via plugins), and session recordings (via plugins). It imports data from Google Analytics, so migration is practical rather than a clean break.

The trade-off is resource usage and complexity. Matomo is a PHP application with a MySQL database, a plugin marketplace, and a web installer. It requires more server resources, more configuration, and more maintenance than the leaner alternatives.

**Choose Matomo if:** You need enterprise-grade analytics features, want a direct Google Analytics replacement with data import, need e-commerce tracking, or have compliance requirements that demand a full audit trail of analytics data.

**Choose [Plausible](/apps/plausible) if:** You want lightweight, privacy-first analytics with a clean dashboard and minimal resource usage. It's the best option for most blogs and marketing sites.

**Choose [Umami](/apps/umami) if:** You want something between the two — more features than Plausible, lighter than Matomo, with a modern UI.

For most self-hosters running personal sites or small businesses, Plausible or Umami is the better fit. For teams that actually use advanced analytics features, Matomo is the only self-hosted option that competes with Google Analytics feature-for-feature.

## Related

- [How to Self-Host Plausible Analytics](/apps/plausible)
- [How to Self-Host Umami](/apps/umami)
- [Plausible vs Umami: Which Should You Self-Host?](/compare/plausible-vs-umami)
- [Self-Hosted Alternatives to Google Analytics](/replace/google-analytics)
- [Best Self-Hosted Analytics Platforms](/best/analytics)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-strategy)
