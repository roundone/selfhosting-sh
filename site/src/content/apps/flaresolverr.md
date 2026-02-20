---
title: "How to Self-Host FlareSolverr with Docker"
description: "Set up FlareSolverr with Docker Compose to bypass Cloudflare protection for Prowlarr and Jackett. Proxy server for browser-based challenges."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "download-management"
apps:
  - flaresolverr
tags:
  - self-hosted
  - flaresolverr
  - docker
  - cloudflare
  - arr-stack
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is FlareSolverr?

FlareSolverr is a proxy server that solves Cloudflare and DDoS-GUARD challenges using a headless browser. When Prowlarr or Jackett needs to scrape a site protected by Cloudflare, they send the request to FlareSolverr, which opens a real browser, solves the challenge, and returns the cookies and response. [GitHub](https://github.com/FlareSolverr/FlareSolverr)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of free disk space
- 512 MB of RAM (minimum — headless browser is memory-hungry)
- Prowlarr or Jackett for indexer management

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  flaresolverr:
    image: ghcr.io/flaresolverr/flaresolverr:v3.3.21
    container_name: flaresolverr
    environment:
      - LOG_LEVEL=info                 # Options: debug, info, warn, error
      - LOG_HTML=false                 # Log HTML responses (debug only)
      - CAPTCHA_SOLVER=none            # No external captcha solver
      - TZ=America/New_York            # Your timezone
    ports:
      - "8191:8191"                    # API endpoint
    restart: unless-stopped
```

Start the stack:

```bash
docker compose up -d
```

FlareSolverr has no persistent data — no volumes needed.

## Initial Setup

FlareSolverr has no web UI. It exposes an HTTP API on port 8191 that Prowlarr and Jackett use automatically.

### Connecting to Prowlarr

1. In Prowlarr, go to **Settings → Indexers**
2. Click **+** and add **FlareSolverr**
3. **Tag:** Create a tag like `flaresolverr`
4. **Host:** `http://flaresolverr:8191` (container name) or `http://your-server:8191`
5. Test the connection
6. On indexers that need Cloudflare bypass, add the `flaresolverr` tag

### Connecting to Jackett

1. In Jackett's web UI, go to the **FlareSolverr URL** field at the top
2. Enter `http://flaresolverr:8191`
3. Save — Jackett automatically uses FlareSolverr for Cloudflare-protected indexers

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Logging verbosity: debug, info, warn, error |
| `LOG_HTML` | `false` | Include HTML in debug logs (large output) |
| `CAPTCHA_SOLVER` | `none` | External captcha solver (hcaptcha, etc.) |
| `TZ` | `UTC` | Timezone for logging |
| `HEADLESS` | `true` | Run browser headless (always true in Docker) |
| `BROWSER_TIMEOUT` | `40000` | Timeout in ms for browser operations |
| `TEST_URL` | `https://www.google.com` | URL used for challenge testing |

### Running on the same network as Prowlarr

```yaml
services:
  flaresolverr:
    image: ghcr.io/flaresolverr/flaresolverr:v3.3.21
    container_name: flaresolverr
    environment:
      - LOG_LEVEL=info
      - TZ=America/New_York
    ports:
      - "8191:8191"
    networks:
      - arr-network
    restart: unless-stopped

networks:
  arr-network:
    external: true
```

## Reverse Proxy

FlareSolverr doesn't need a reverse proxy — it's an internal service used only by Prowlarr/Jackett. Don't expose port 8191 to the internet.

## Backup

FlareSolverr is stateless. No backup needed — recreate the container from the compose file. See [Backup Strategy](/foundations/backup-3-2-1-rule) for your other services.

## Troubleshooting

### "Challenge not detected" errors

**Symptom:** FlareSolverr returns responses but indexers still fail.
**Fix:** Some Cloudflare challenges require JavaScript execution time. Increase `BROWSER_TIMEOUT` to 60000 or 120000. If the site uses CAPTCHAs, FlareSolverr can't solve them without an external solver.

### High memory usage

**Symptom:** FlareSolverr uses 500 MB+ RAM.
**Fix:** This is expected — it runs a full Chromium browser. Each concurrent challenge adds ~100-200 MB. If memory is tight, ensure only indexers that actually need Cloudflare bypass have the FlareSolverr tag in Prowlarr.

### FlareSolverr not responding

**Symptom:** Connection refused on port 8191.
**Fix:** Check container logs: `docker logs flaresolverr`. The browser takes 10-30 seconds to initialize on first start. If it crashes on startup, the image may need more memory — ensure at least 512 MB is available.

## Resource Requirements

- **RAM:** ~300-500 MB idle (headless Chromium), spikes during challenge solving
- **CPU:** Moderate during challenge solving, idle otherwise
- **Disk:** ~500 MB for the container image, no persistent storage

## Verdict

FlareSolverr is a necessary evil if your indexers are behind Cloudflare protection. It's not something you'd install for fun — it exists to solve a specific problem. If your indexers work without it, don't bother. If they don't, FlareSolverr is the standard solution that Prowlarr and Jackett both support natively.

The main downside is resource usage. Running a headless browser permanently costs ~300-500 MB of RAM. On servers with limited memory, consider stopping FlareSolverr when not needed.

## FAQ

### Do I always need FlareSolverr?

No. Only if your indexers use Cloudflare or similar protections. Test your indexers in Prowlarr/Jackett without FlareSolverr first. Add it only if you get Cloudflare challenge errors.

### Can FlareSolverr solve CAPTCHAs?

The basic version cannot solve visual CAPTCHAs. The `CAPTCHA_SOLVER` environment variable supports external services, but most users don't need this.

### FlareSolverr vs browser cookies approach?

Some people extract Cloudflare cookies from a regular browser and paste them into Jackett. This works but cookies expire frequently (often within hours). FlareSolverr solves challenges automatically and handles cookie rotation.

## Related

- [How to Self-Host Prowlarr](/apps/prowlarr)
- [How to Self-Host Jackett](/apps/jackett)
- [Prowlarr vs Jackett](/compare/prowlarr-vs-jackett)
- [How to Self-Host Sonarr](/apps/sonarr)
- [How to Self-Host Radarr](/apps/radarr)
- [How to Self-Host qBittorrent](/apps/qbittorrent)
- [Best Self-Hosted Download Management](/best/download-management)
