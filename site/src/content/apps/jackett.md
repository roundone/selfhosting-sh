---
title: "How to Self-Host Jackett with Docker Compose"
description: "Step-by-step guide to self-hosting Jackett with Docker Compose for indexer management with Sonarr, Radarr, and other *arr apps."
date: 2026-02-16
dateUpdated: 2026-02-21
category: "download-management"
apps:
  - jackett
tags:
  - docker
  - jackett
  - torznab
  - download-management
  - arr-stack
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Jackett?

Jackett is an indexer proxy that translates queries from apps like [Sonarr](/apps/sonarr/), [Radarr](/apps/radarr/), and other *arr tools into tracker-specific requests. It supports hundreds of public and private torrent trackers and Usenet indexers through a unified Torznab/Potato API. Instead of each app needing native support for every tracker, Jackett acts as the translator in between. [Official site](https://github.com/Jackett/Jackett)

**A note on Prowlarr:** [Prowlarr](/apps/prowlarr/) is the newer, purpose-built replacement for Jackett. It integrates natively with the *arr stack without requiring manual API key copy-paste for each app/indexer combination. If you're building a fresh setup, start with Prowlarr. If you already run Jackett and it works, there's no urgent reason to migrate -- Jackett is still actively maintained.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 500 MB of free disk space
- 256 MB of RAM (minimum)
- At least one *arr app to connect to, such as [Sonarr](/apps/sonarr/) or [Radarr](/apps/radarr/)
- A download client like [qBittorrent](/apps/qbittorrent/) or [Transmission](/apps/transmission/)
- Accounts on your preferred torrent trackers or Usenet indexers

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  jackett:
    image: lscr.io/linuxserver/jackett:0.24.1174
    container_name: jackett
    environment:
      - PUID=1000            # Your user ID (run `id -u` to find it)
      - PGID=1000            # Your group ID (run `id -g` to find it)
      - TZ=America/New_York  # Your timezone (find yours: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
      - AUTO_UPDATE=true     # Allow Jackett to update its internal indexer definitions
    volumes:
      - jackett_config:/config          # Jackett configuration and indexer definitions
      - /path/to/blackhole:/downloads   # Optional: blackhole download directory for .torrent files
    ports:
      - "9117:9117"          # Web UI and API
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9117/UI/Dashboard"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s

volumes:
  jackett_config:
```

The `/downloads` volume is optional. It's only needed if you use Jackett's blackhole download method (saving `.torrent` files to a watched folder). Most setups use direct API integration with a download client instead.

Start the stack:

```bash
docker compose up -d
```

Jackett's web UI is available at `http://your-server-ip:9117`.

## Initial Setup

### 1. Set Admin Password

Open the web UI at `http://your-server-ip:9117`. The first thing to do is scroll down to the **Jackett Configuration** section at the bottom and set an admin password. Jackett has no authentication by default -- anyone with network access can modify your indexers. Set a strong password and click **Set Password**.

### 2. Add Your First Indexer

Click **+ Add Indexer** at the top. You'll see a searchable list of hundreds of supported trackers. Find yours and click the wrench icon to configure it.

For most trackers, you'll need to provide:

- **Username/password** or **API key** -- depends on the tracker
- **Cookie-based login** -- some private trackers require this; Jackett will walk you through the browser login flow

After configuring, click **Okay**. Jackett tests the connection automatically. A green checkmark means it's working.

### 3. Copy the Torznab Feed URL

Each configured indexer gets a Torznab feed URL. Click the **Copy Torznab Feed** button next to any indexer. This URL and the API key shown at the top of the page are what you'll paste into Sonarr, Radarr, or other apps.

### 4. Connect to Sonarr/Radarr

In [Sonarr](/apps/sonarr/) or [Radarr](/apps/radarr/):

1. Go to **Settings > Indexers > Add**
2. Select **Torznab** (under Torrent) or **Newznab** (under Usenet)
3. Paste the Torznab Feed URL from Jackett
4. Paste the Jackett API key
5. Set categories appropriate to the app (e.g., TV categories for Sonarr, Movie categories for Radarr)
6. Test and Save

Repeat for each indexer you want available in each *arr app. This per-indexer, per-app configuration is the main reason [Prowlarr](/apps/prowlarr/) was created as a replacement -- it eliminates this repetitive step entirely.

## Configuration

### API Key

The API key is displayed at the top of the Jackett dashboard. All *arr apps use this single key to authenticate with Jackett. You can regenerate it from the configuration section if compromised, but you'll need to update it in every connected app.

### FlareSolverr Integration

Some trackers use Cloudflare protection that blocks automated requests. Jackett supports [FlareSolverr](https://github.com/FlareSolverr/FlareSolverr) as a proxy to bypass these challenges. To enable it, add FlareSolverr to your Compose file:

```yaml
services:
  jackett:
    image: lscr.io/linuxserver/jackett:0.24.1174
    container_name: jackett
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
      - AUTO_UPDATE=true
    volumes:
      - jackett_config:/config
      - /path/to/blackhole:/downloads
    ports:
      - "9117:9117"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9117/UI/Dashboard"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s

  flaresolverr:
    image: ghcr.io/flaresolverr/flaresolverr:v3.3.21
    container_name: flaresolverr
    environment:
      - LOG_LEVEL=info
      - TZ=America/New_York
    ports:
      - "8191:8191"
    restart: unless-stopped

volumes:
  jackett_config:
```

Then in Jackett's configuration section, set the **FlareSolverr API URL** to `http://flaresolverr:8191`.

### Indexer Definition Updates

Jackett's indexer definitions update independently from the application itself. The `AUTO_UPDATE=true` environment variable lets Jackett pull the latest definitions on startup. Tracker sites change their layouts frequently, so keeping definitions current is important for reliability.

### Cache Settings

Jackett caches search results by default (1200-second TTL). This reduces load on trackers and speeds up repeated searches. You can adjust or disable the cache from the configuration section. Leaving the default is fine for most setups.

## Reverse Proxy

If you want to access Jackett over HTTPS with a domain name, put it behind a reverse proxy. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for full details.

**Nginx Proxy Manager:** Create a proxy host pointing to `http://jackett:9117` (if on the same Docker network) or `http://your-server-ip:9117`.

**Caddy** example:

```
jackett.yourdomain.com {
    reverse_proxy localhost:9117
}
```

**Traefik** labels (add to the Jackett service in your Compose file):

```yaml
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.jackett.rule=Host(`jackett.yourdomain.com`)"
      - "traefik.http.routers.jackett.entrypoints=websecure"
      - "traefik.http.routers.jackett.tls.certresolver=letsencrypt"
      - "traefik.http.services.jackett.loadbalancer.server.port=9117"
```

Set the **Base URL** in Jackett's configuration to `/jackett` if you're running it under a subpath instead of a subdomain.

## Backup

Jackett's state is minimal -- indexer configurations and the API key are stored in the `/config` volume. Back up that volume to preserve your setup.

```bash
# Stop the container first for a consistent backup
docker compose stop jackett

# Back up the config volume
docker run --rm -v jackett_config:/data -v $(pwd):/backup alpine \
  tar czf /backup/jackett-config-$(date +%Y%m%d).tar.gz -C /data .

# Restart
docker compose start jackett
```

To restore, extract the tarball into the named volume before starting the container.

Jackett's config is small (a few MB). Include it in your regular backup schedule. See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a complete approach.

**What matters in the backup:**
- `ServerConfig.json` -- API key, admin password hash, FlareSolverr URL, cache settings
- `Indexers/` directory -- all configured indexer credentials and settings

Losing this data isn't catastrophic -- you can reconfigure indexers -- but it saves time, especially if you have many private trackers configured.

## Troubleshooting

### Indexer Returns No Results

**Symptom:** Searches from Sonarr or Radarr through Jackett return zero results, but the tracker works in a browser.

**Fix:** Open Jackett's web UI and test the indexer directly using the search icon. If it fails there too, the indexer definition may be outdated. Click the wrench icon on the indexer, delete it, and re-add it to pull the latest definition. If the tracker recently changed its layout, check [Jackett's GitHub issues](https://github.com/Jackett/Jackett/issues) for reports. Ensure `AUTO_UPDATE=true` is set so definitions stay current.

### Connection Refused From Sonarr/Radarr

**Symptom:** Sonarr or Radarr shows "Unable to connect to Jackett" when testing the indexer.

**Fix:** Verify the Torznab URL is correct. If both containers are on the same Docker network, use the container name as the hostname: `http://jackett:9117/api/v2.0/indexers/INDEXERNAME/results/torznab/`. If they're on different networks, use the host IP instead of `localhost`. Confirm port 9117 is accessible and not blocked by a firewall (`ufw allow 9117` if needed).

### Tracker Requires Cloudflare Bypass

**Symptom:** Indexer configuration fails with errors about Cloudflare challenges or CAPTCHA.

**Fix:** Deploy FlareSolverr as shown in the Configuration section above. Set the FlareSolverr URL in Jackett's configuration. Reconfigure the affected indexer -- Jackett will route requests through FlareSolverr for trackers that need it. Note that FlareSolverr uses a headless browser and consumes more RAM (300-500 MB).

### High Memory Usage

**Symptom:** Jackett's container memory grows well beyond expected levels over time.

**Fix:** This typically happens with many indexers configured and frequent searches. Restart the container to reclaim memory: `docker compose restart jackett`. If it recurs, reduce the number of configured indexers to only those you actively use. You can also adjust the cache TTL downward in Jackett's settings to reduce in-memory cached results.

### Permission Errors on Config Files

**Symptom:** Jackett fails to start with "access denied" or "permission denied" errors in logs.

**Fix:** Ensure the `PUID` and `PGID` environment variables match the user that owns the config volume data. Check with `docker compose logs jackett`. The LinuxServer.io image runs an init process that sets ownership based on these values. If you changed PUID/PGID after first run, you may need to fix permissions manually:

```bash
docker compose exec jackett chown -R 1000:1000 /config
```

## Resource Requirements

- **RAM:** ~150 MB idle, 200-300 MB under active search load. Add 300-500 MB if running FlareSolverr.
- **CPU:** Minimal. Occasional spikes during searches but otherwise idle.
- **Disk:** ~100 MB for the application, plus a few MB for configuration. Negligible.

Jackett is one of the lightest components in a typical *arr stack.

## Verdict

Jackett works and it works reliably. If you already have it running in your *arr stack, there's no pressing reason to rip it out. It supports more trackers than almost any alternative and has years of community battle-testing behind it.

That said, for new setups, **[Prowlarr](/apps/prowlarr/) is the better choice.** Prowlarr syncs indexers to all your *arr apps automatically -- no copying Torznab URLs and API keys into every application. It's built by the same team behind the *arr ecosystem and integrates natively. The manual configuration overhead of Jackett adds up quickly when you have multiple indexers and multiple *arr apps.

**Use Jackett if:** you already run it and it's working, you need a specific tracker that Prowlarr doesn't support yet, or you use non-*arr applications that need Torznab endpoints.

**Use [Prowlarr](/apps/prowlarr/) if:** you're starting fresh or willing to migrate. The native integration is worth the switch.

## Related

- [How to Self-Host Sonarr](/apps/sonarr/) -- automated TV show management, primary Jackett consumer
- [How to Self-Host Radarr](/apps/radarr/) -- automated movie management, primary Jackett consumer
- [How to Self-Host Prowlarr](/apps/prowlarr/) -- the recommended modern replacement for Jackett
- [How to Self-Host qBittorrent](/apps/qbittorrent/) -- download client that works with the *arr stack
- [How to Self-Host Transmission](/apps/transmission/) -- lightweight alternative download client
- [Sonarr vs Radarr](/compare/sonarr-vs-radarr/) -- understanding the difference between the two
- [Best Self-Hosted Download Management](/best/download-management/) -- full category roundup
- [Docker Compose Basics](/foundations/docker-compose-basics/) -- foundation guide for all Docker setups
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) -- expose services securely over HTTPS
- [Backup Strategy](/foundations/backup-3-2-1-rule/) -- protect your self-hosted data
