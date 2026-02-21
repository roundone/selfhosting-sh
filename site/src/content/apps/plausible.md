---
title: "How to Self-Host Plausible Analytics with Docker"
description: "Step-by-step guide to self-hosting Plausible Community Edition with Docker Compose, including ClickHouse, PostgreSQL, and SSL setup."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "analytics"
apps:
  - plausible
tags:
  - self-hosted
  - analytics
  - plausible
  - docker
  - privacy
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Plausible?

[Plausible](https://plausible.io) is a lightweight, privacy-friendly web analytics tool. It tracks page views, referrers, and top pages without cookies, making it GDPR-compliant out of the box. Plausible replaces Google Analytics for anyone who wants simple, accurate traffic data without the privacy baggage. The dashboard loads in under a second and shows everything on a single page.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 2 GB of RAM minimum (ClickHouse needs memory)
- A CPU with SSE 4.2 or NEON instruction support (required by ClickHouse)
- A domain name pointed at your server (required for automatic SSL)

## Docker Compose Configuration

Clone the official Community Edition repository:

```bash
git clone -b v3.2.0 --single-branch \
  https://github.com/plausible/community-edition plausible-ce
cd plausible-ce
```

Create a `.env` file:

```bash
# REQUIRED: Your Plausible instance URL (must match your actual domain)
BASE_URL=https://plausible.example.com

# REQUIRED: Secret key for session encryption (minimum 64 bytes)
# Generate with: openssl rand -base64 48
SECRET_KEY_BASE=change-me-generate-with-openssl-rand-base64-48

# Optional: TOTP vault key for 2FA (generate the same way)
# TOTP_VAULT_KEY=change-me-generate-with-openssl-rand-base64-32

# Optional: Disable registration after creating your account
# DISABLE_REGISTRATION=invite_only

# Optional: SMTP for email reports and alerts
# MAILER_EMAIL=plausible@example.com
# SMTP_HOST_ADDR=mail.example.com
# SMTP_HOST_PORT=587
# SMTP_USER_NAME=plausible@example.com
# SMTP_USER_PWD=your-smtp-password
# SMTP_HOST_SSL_ENABLED=true
```

The repository includes a `compose.yml` with three services — Plausible, PostgreSQL, and ClickHouse. To expose ports, create a `compose.override.yml`:

```yaml
services:
  plausible:
    ports:
      - 8000:8000
```

If you want Plausible to handle SSL automatically with Let's Encrypt, expose ports 80 and 443 instead:

```yaml
services:
  plausible:
    ports:
      - 80:80
      - 443:443
```

And add to your `.env`:

```bash
HTTP_PORT=80
HTTPS_PORT=443
```

Start the stack:

```bash
docker compose up -d
```

The default `compose.yml` from the repository creates these services:

- **plausible** — `ghcr.io/plausible/community-edition:v3.2.0` — the analytics server
- **plausible_db** — `postgres:16-alpine` — stores user accounts, sites, and goals
- **plausible_events_db** — `clickhouse/clickhouse-server:24.12-alpine` — stores analytics events (page views, custom events)

## Initial Setup

1. Open your Plausible instance at the `BASE_URL` you configured
2. Create the first user account — this becomes the admin
3. Add your first website by entering its domain
4. Copy the tracking script and add it to your website's `<head>`:

```html
<script defer data-domain="yourdomain.com"
  src="https://plausible.example.com/js/script.js"></script>
```

That single line is the entire tracking snippet. No cookies, no consent banners needed.

## Configuration

### Disable Public Registration

After creating your admin account, prevent others from signing up by adding to `.env`:

```bash
DISABLE_REGISTRATION=invite_only
```

Then restart:

```bash
docker compose restart plausible
```

You can still invite team members from the Plausible UI.

### Google Search Console Integration

Plausible can import search query data from Google Search Console. In the Plausible UI, go to **Site Settings > Search Console** and follow the OAuth flow. This requires creating Google API credentials — see the [Plausible docs](https://plausible.io/docs/self-hosting-configuration#google-integration) for the full setup.

### GeoIP Location Data

By default, Plausible shows country-level data using a built-in database. For city-level geolocation, configure MaxMind GeoLite2:

```bash
# Add to .env
MAXMIND_LICENSE_KEY=your-maxmind-license-key
MAXMIND_EDITION=GeoLite2-City
```

Sign up for a free MaxMind account at [maxmind.com](https://www.maxmind.com) to get a license key.

### Custom Events and Goals

Track button clicks, form submissions, or any custom interaction by adding JavaScript calls:

```javascript
plausible('Signup', {props: {plan: 'premium'}});
```

Then create a matching goal in the Plausible UI under **Site Settings > Goals**.

## Reverse Proxy

If running Plausible behind a reverse proxy like [Nginx Proxy Manager](/apps/nginx-proxy-manager/) or [Traefik](/apps/traefik/), expose port 8000 in your override:

```yaml
services:
  plausible:
    ports:
      - 8000:8000
```

Set `BASE_URL` to your public domain (with `https://`) and let the reverse proxy handle SSL. Do not expose ports 80/443 in this setup — the reverse proxy manages those.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for the full configuration.

## Backup

Three volumes matter for backup:

- `db-data` — PostgreSQL data (user accounts, site configs, goals)
- `event-data` — ClickHouse data (all analytics events)
- `plausible-data` — Plausible application data

Back up all three:

```bash
docker compose stop
docker run --rm \
  -v plausible-ce_db-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/plausible-postgres-backup.tar.gz /data

docker run --rm \
  -v plausible-ce_event-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/plausible-clickhouse-backup.tar.gz /data

docker compose start
```

For ongoing backups, use PostgreSQL `pg_dump` and ClickHouse's native backup tools without stopping services. See [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### ClickHouse fails to start

**Symptom:** `plausible_events_db` container exits immediately with instruction set errors.

**Fix:** ClickHouse requires SSE 4.2 (x86) or NEON (ARM) CPU instructions. Check with:
```bash
grep -o 'sse4_2' /proc/cpuinfo | head -1
```
If your CPU lacks SSE 4.2, you cannot run ClickHouse (and therefore Plausible) on this machine.

### "Database connection refused" on startup

**Symptom:** Plausible container restarts repeatedly with connection errors.

**Fix:** The databases need time to initialize on first boot. Plausible depends on health checks, but if they timeout, restart the stack:
```bash
docker compose down && docker compose up -d
```

### Tracking script not recording visits

**Symptom:** Dashboard shows zero visitors despite script being installed.

**Fix:**
1. Verify the script URL matches your `BASE_URL` exactly
2. Check browser developer console for blocked requests (ad blockers may block the script)
3. Ensure the `data-domain` attribute matches the site domain configured in Plausible
4. Test with `curl -I https://plausible.example.com/js/script.js` to verify the script is accessible

### Let's Encrypt certificate not issuing

**Symptom:** HTTPS not working, certificate errors in browser.

**Fix:** Ensure ports 80 and 443 are publicly accessible and your DNS A record points to the server. Let's Encrypt requires HTTP challenge validation on port 80.

## Resource Requirements

- **RAM:** 1 GB idle, 2+ GB under moderate traffic (ClickHouse is the main consumer)
- **CPU:** Low for small sites (<100K monthly). ClickHouse can spike during report generation.
- **Disk:** 500 MB for the application. Analytics data grows ~1 GB per million page views stored.

## Frequently Asked Questions

### Is Plausible really cookie-free?

Yes. Plausible uses no cookies and stores no personal data. It generates a daily-rotating hash from the visitor's IP + User-Agent to count unique visitors without tracking individuals. This makes it GDPR, CCPA, and PECR compliant without consent banners.

### What's the difference between Plausible Cloud and Community Edition?

Plausible Cloud is the hosted SaaS version (paid). Community Edition is the self-hosted version — same analytics engine, free to run on your own infrastructure. The CE version is released periodically from the main codebase.

### Can Plausible replace Google Analytics?

For most websites, yes. Plausible covers page views, referrers, top pages, geographic data, device/browser stats, UTM campaigns, and custom events. It does not offer the deep funnel analysis, audience segments, or e-commerce tracking that GA4 provides. If you need simple, privacy-respecting traffic data, Plausible is a better fit.

## Verdict

Plausible is the best self-hosted analytics tool for most websites. It's lightweight, privacy-friendly, and gives you 90% of the insights you actually look at in Google Analytics — on a single dashboard that loads instantly. The setup with Docker is straightforward thanks to the official Community Edition repo. The main limitations are the lack of advanced segmentation and e-commerce features. For product analytics or complex funnels, look at [PostHog](/apps/posthog/) or [Matomo](/apps/matomo/). For simple traffic analytics, Plausible is the clear winner.

## Related

- [How to Self-Host Umami](/apps/umami/)
- [How to Self-Host Matomo](/apps/matomo/)
- [Plausible vs Umami](/compare/plausible-vs-umami/)
- [Plausible vs Matomo](/compare/plausible-vs-matomo/)
- [Best Self-Hosted Analytics](/best/analytics/)
- [Replace Google Analytics](/replace/google-analytics/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
