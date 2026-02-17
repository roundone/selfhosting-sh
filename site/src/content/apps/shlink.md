---
title: "How to Self-Host Shlink with Docker Compose"
description: "Step-by-step guide to self-hosting Shlink with Docker Compose for API-first URL shortening with analytics."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "url-shorteners"
apps:
  - shlink
tags:
  - docker
  - url-shortener
  - api
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Shlink?

Shlink is a modern, API-first URL shortener with a clean web client. It supports custom slugs, QR code generation, device-specific redirects, tag-based organization, and detailed visit analytics — all built-in without plugins. Unlike [YOURLS](/apps/yourls) which is PHP/jQuery, Shlink is built on PHP 8 with Swoole for high performance and ships with a React-based web client. [Official site](https://shlink.io/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 500 MB of free disk space
- 256 MB of RAM minimum
- A domain name for your short URLs

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  shlink:
    image: shlinkio/shlink:4.4.3
    container_name: shlink
    environment:
      - DEFAULT_DOMAIN=sho.rt              # Your short domain
      - IS_HTTPS_ENABLED=true              # Set true if behind HTTPS proxy
      - INITIAL_API_KEY=change-this-to-a-strong-api-key
      - DB_DRIVER=maria
      - DB_HOST=shlink_db
      - DB_USER=shlink
      - DB_PASSWORD=change-this-db-password
      - DB_NAME=shlink
    ports:
      - "8080:8080"
    depends_on:
      - shlink_db
    restart: unless-stopped

  shlink_db:
    image: mariadb:11.7
    container_name: shlink_db
    environment:
      - MYSQL_ROOT_PASSWORD=change-this-root-password
      - MYSQL_DATABASE=shlink
      - MYSQL_USER=shlink
      - MYSQL_PASSWORD=change-this-db-password
    volumes:
      - db-data:/var/lib/mysql
    restart: unless-stopped

  shlink-web:
    image: shlinkio/shlink-web-client:4.3.2
    container_name: shlink-web
    environment:
      - SHLINK_SERVER_URL=https://sho.rt   # URL of your Shlink server
      - SHLINK_SERVER_API_KEY=change-this-to-a-strong-api-key
    ports:
      - "8081:8080"
    restart: unless-stopped

volumes:
  db-data:
```

**Environment variables (Shlink server):**

| Variable | Purpose | Required |
|----------|---------|----------|
| `DEFAULT_DOMAIN` | Your short URL domain | Yes — **must change** |
| `IS_HTTPS_ENABLED` | Enable HTTPS URL generation | Yes |
| `INITIAL_API_KEY` | API key for authentication | Yes — **must change** |
| `DB_DRIVER` | Database type (maria, postgres, sqlite) | Yes |
| `DB_HOST` | Database hostname | Yes (except SQLite) |
| `DB_USER` | Database username | Yes (except SQLite) |
| `DB_PASSWORD` | Database password | Yes — **must change** |

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Shlink server starts on port 8080 — this handles redirects
2. Web client starts on port 8081 — this is the management UI
3. Open `http://your-server-ip:8081` for the web client
4. The web client auto-connects using the configured API key
5. Start creating short URLs

## Configuration

### Creating Short URLs

Via the web client:

- Enter the long URL
- Optionally set a custom slug, title, tags
- Set expiration date or maximum visits
- Enable/disable bot visit tracking

Via the API:

```bash
curl -X POST "https://sho.rt/rest/v3/short-urls" \
  -H "X-Api-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"longUrl": "https://example.com/very/long/url", "customSlug": "docs"}'
```

### Device-Specific Redirects

Shlink can redirect to different URLs based on the visitor's device:

```bash
curl -X POST "https://sho.rt/rest/v3/short-urls" \
  -H "X-Api-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "longUrl": "https://example.com/desktop",
    "deviceLongUrls": {
      "android": "https://play.google.com/store/apps/details?id=com.example",
      "ios": "https://apps.apple.com/app/example/id123456"
    }
  }'
```

### QR Codes

Every short URL automatically gets a QR code:

```
https://sho.rt/my-link/qr-code?size=300&format=png
```

Parameters: `size` (pixels), `format` (png/svg), `margin` (pixels), `color` and `bgColor` (hex).

### Tags and Domains

Organize short URLs with tags for filtering and analytics. Shlink also supports multiple domains — serve different short URL sets from different domains, all managed by one instance.

## Advanced Configuration (Optional)

### GeoIP for Visit Location

Enable geographic visit tracking:

```yaml
environment:
  - GEOLITE_LICENSE_KEY=your-maxmind-key  # Free from maxmind.com
```

Sign up for a free MaxMind account to get a GeoLite2 license key. Shlink downloads the GeoIP database automatically.

### Redis for Better Performance

Add Redis for caching and improved performance under load:

```yaml
  shlink_redis:
    image: redis:7-alpine
    container_name: shlink_redis
    restart: unless-stopped
```

Add to Shlink's environment:
```yaml
  - REDIS_SERVERS=shlink_redis:6379
```

### RabbitMQ for Async Processing

For high-traffic instances, offload visit processing:

```yaml
environment:
  - RABBITMQ_ENABLED=true
  - RABBITMQ_HOST=rabbitmq
  - RABBITMQ_PORT=5672
```

### Multiple Short Domains

```yaml
environment:
  - DEFAULT_DOMAIN=sho.rt
  # Additional domains configured via API after startup
```

Use the API to add more domains: each domain can have its own set of short URLs.

## Reverse Proxy

Your reverse proxy should send traffic to:

- **Port 8080 (Shlink server):** For the short domain (redirects + API)
- **Port 8081 (Web client):** For the management interface

Example: `sho.rt` → port 8080, `admin.sho.rt` → port 8081

[Reverse Proxy Setup](/foundations/reverse-proxy-explained)

## Backup

```bash
docker compose exec shlink_db mariadb-dump -u shlink -p shlink > shlink-backup-$(date +%Y%m%d).sql
```

[Backup Strategy](/foundations/backup-3-2-1-rule)

## Troubleshooting

### Short URLs Return "URL Not Found"

**Symptom:** Created URLs return a 404 page.
**Fix:** Ensure `DEFAULT_DOMAIN` matches the domain visitors use. If behind a reverse proxy, `IS_HTTPS_ENABLED=true` must be set when the proxy terminates HTTPS. Check that the reverse proxy forwards to port 8080.

### Web Client Can't Connect to Server

**Symptom:** Web client shows "Could not connect to server."
**Fix:** Verify `SHLINK_SERVER_URL` in the web client matches the publicly accessible URL of the Shlink server. The web client connects from the browser, not from the Docker network — it needs the external URL, not an internal hostname.

### API Key Not Working

**Symptom:** API calls return 401 Unauthorized.
**Fix:** `INITIAL_API_KEY` only creates the key on first startup. If you change it after the database is initialized, the old key remains. Create a new key via the CLI: `docker compose exec shlink shlink api-key:generate`.

### GeoIP Data Not Loading

**Symptom:** Visit locations show as "Unknown."
**Fix:** Set `GEOLITE_LICENSE_KEY` with a valid MaxMind key. The database downloads on startup — check logs for download errors. MaxMind rate-limits downloads to ~1 per day.

## Resource Requirements

- **RAM:** ~100 MB (Shlink) + 100 MB (MariaDB) + 50 MB (web client)
- **CPU:** Low
- **Disk:** ~50 MB for application, grows with visit analytics data

## Verdict

Shlink is the best URL shortener for developers and API-driven workflows. The built-in QR codes, device-specific redirects, and multi-domain support are features that YOURLS only gets through plugins. The separate web client means you can run the API server on your short domain and the management UI on a different domain or behind authentication. For a simpler, more established option, [YOURLS](/apps/yourls) is the alternative.

## FAQ

### Shlink vs YOURLS?

Shlink: modern API-first design, built-in QR codes and device redirects, React web client. YOURLS: older but proven, larger plugin ecosystem, simpler single-container setup. Choose Shlink for API integration and modern features; YOURLS for simplicity and stability.

### Can I migrate from Bitly to Shlink?

Shlink has an import command: `docker compose exec shlink shlink short-url:import bitly`. It requires a Bitly API token. Historical visit data does not transfer — only the URLs themselves.

### Does Shlink need a separate web client?

No. The API server works standalone — you can create and manage URLs entirely via the API or CLI. The web client is a convenience, not a requirement.

## Related

- [How to Self-Host YOURLS](/apps/yourls)
- [How to Self-Host PrivateBin](/apps/privatebin)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [HTTPS Setup for Self-Hosted Services](/foundations/https-everywhere)
- [Database Basics for Self-Hosting](/foundations/database-basics)
