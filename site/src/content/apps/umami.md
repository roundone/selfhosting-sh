---
title: "How to Self-Host Umami Analytics with Docker"
description: "Complete guide to self-hosting Umami analytics with Docker Compose, including PostgreSQL setup, tracking script, and configuration."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "analytics"
apps:
  - umami
tags:
  - self-hosted
  - analytics
  - umami
  - docker
  - privacy
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Umami?

[Umami](https://umami.is) is a simple, fast, privacy-focused web analytics tool. It collects page views, referrers, browser and OS data, and custom events — all without cookies. Umami is fully open source (MIT license), lightweight, and designed as a direct replacement for Google Analytics when you want clean data without the privacy concerns. The dashboard is minimal and loads fast.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of RAM minimum
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  umami:
    image: ghcr.io/umami-software/umami:v3.0.3
    container_name: umami
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "postgresql://umami:umami@umami-db:5432/umami"
      APP_SECRET: "change-me-use-a-random-string-at-least-32-chars"  # Generate with: openssl rand -hex 32
    depends_on:
      umami-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/heartbeat || exit 1"]
      interval: 5s
      timeout: 5s
      retries: 5

  umami-db:
    image: postgres:16-alpine
    container_name: umami-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: "umami"
      POSTGRES_USER: "umami"
      POSTGRES_PASSWORD: "umami"  # Change this in production
    volumes:
      - umami-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U umami"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  umami-db-data:
```

**Important:** Change `APP_SECRET` to a random string and `POSTGRES_PASSWORD` to a strong password. Update the password in `DATABASE_URL` to match.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open Umami at `http://your-server-ip:3000`
2. Log in with the default credentials: `admin` / `umami`
3. **Change the password immediately** — go to **Settings > Profile**
4. Add a website: go to **Settings > Websites > Add website**
5. Enter your domain and copy the tracking code
6. Add the tracking script to your website's `<head>`:

```html
<script defer src="https://your-umami-domain.com/script.js"
  data-website-id="your-website-id"></script>
```

The `data-website-id` is a UUID generated when you add the site in Umami.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `APP_SECRET` | Session encryption key (min 32 chars) | Required |
| `CLIENT_IP_HEADER` | Header for real IP behind proxy (e.g., `X-Forwarded-For`) | Auto-detected |
| `DISABLE_TELEMETRY` | Set to `1` to disable anonymous telemetry | `0` |
| `DISABLE_UPDATES` | Set to `1` to disable update checks | `0` |
| `TRACKER_SCRIPT_NAME` | Rename the tracking script (ad blocker evasion) | `script` |
| `COLLECT_API_ENDPOINT` | Rename the data collection endpoint | `/api/send` |

### Avoid Ad Blockers

Many ad blockers block `umami` and `script.js` by default. Rename the script and endpoint:

```yaml
environment:
  TRACKER_SCRIPT_NAME: "stats"
  COLLECT_API_ENDPOINT: "/api/collect"
```

Your tracking script becomes:
```html
<script defer src="https://your-domain.com/stats.js"
  data-website-id="your-id"></script>
```

### Teams and Permissions

Umami supports multiple users with role-based access. Create team members under **Settings > Users**. Users can be assigned to specific websites — they only see analytics for sites they have access to.

### Custom Events

Track button clicks, form submissions, or any user action:

```javascript
umami.track('signup', { plan: 'premium', source: 'homepage' });
```

Events appear in the dashboard under the **Events** tab and can be filtered by custom properties.

## Reverse Proxy

Behind [Nginx Proxy Manager](/apps/nginx-proxy-manager) or [Caddy](/apps/caddy), forward traffic to port 3000. Set `CLIENT_IP_HEADER` to get accurate visitor IPs:

```yaml
environment:
  CLIENT_IP_HEADER: "X-Forwarded-For"
```

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for the full configuration.

## Backup

The PostgreSQL database contains all analytics data. Back it up with `pg_dump`:

```bash
docker exec umami-db pg_dump -U umami umami > umami-backup.sql
```

Restore:

```bash
cat umami-backup.sql | docker exec -i umami-db psql -U umami umami
```

For automated backups, see [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Dashboard shows zero visitors

**Symptom:** Tracking script is installed but no data appears.

**Fix:**
1. Open browser developer tools, check the Network tab for requests to `/api/send`. If blocked, rename the script (see ad blocker section above)
2. Verify `data-website-id` matches the UUID in Umami settings
3. Check that the script URL is correct and accessible

### "Invalid database" or connection errors on startup

**Symptom:** Umami container exits with database connection errors.

**Fix:** Ensure the PostgreSQL container is healthy before Umami starts. The `depends_on` with `condition: service_healthy` handles this. If the database needs extra initialization time on first run, restart:
```bash
docker compose restart umami
```

### Cannot log in after upgrade

**Symptom:** Login fails with correct credentials after updating Umami.

**Fix:** Database migrations may need to run. Check logs:
```bash
docker logs umami
```
If migration errors appear, the database schema may need manual intervention. Back up first, then recreate:
```bash
docker compose down
docker compose up -d
```

### High memory usage

**Symptom:** Umami container uses excessive RAM on high-traffic sites.

**Fix:** Umami is a Node.js application. Set memory limits in Docker Compose:
```yaml
services:
  umami:
    deploy:
      resources:
        limits:
          memory: 512M
```

## Resource Requirements

- **RAM:** 200 MB idle, 300-500 MB under moderate traffic
- **CPU:** Very low. Umami is lightweight even at 100K+ monthly page views.
- **Disk:** 100 MB for the application. Database grows ~500 MB per million page views.

## Frequently Asked Questions

### Is Umami free?

The self-hosted version is fully free and open source under the MIT license. Umami also offers a paid cloud-hosted version at [cloud.umami.is](https://cloud.umami.is).

### Umami vs Plausible — which should I use?

Both are excellent privacy-friendly analytics tools. Umami is lighter on resources and completely free (MIT license). [Plausible](/apps/plausible) has a more polished UI and built-in features like Google Search Console integration and email reports. See [Umami vs Plausible](/compare/plausible-vs-umami) for the full comparison.

### Does Umami support MySQL?

Umami v2+ only supports PostgreSQL. MySQL support was dropped. Use the PostgreSQL configuration shown above.

## Verdict

Umami is the lightest self-hosted analytics tool you can run. It's dead simple to set up, uses minimal resources, and gives you clean privacy-friendly data. The MIT license means no restrictions on use. The downsides: fewer built-in features than [Plausible](/apps/plausible) (no email reports, no Search Console integration out of the box) and a more basic dashboard. For a single-developer project or personal site, Umami is perfect. For a team or business needing more features, consider Plausible or [Matomo](/apps/matomo).

## Related

- [How to Self-Host Plausible](/apps/plausible)
- [How to Self-Host Matomo](/apps/matomo)
- [Plausible vs Umami](/compare/plausible-vs-umami)
- [Best Self-Hosted Analytics](/best/analytics)
- [Replace Google Analytics](/replace/google-analytics)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
