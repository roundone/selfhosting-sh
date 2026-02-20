---
title: "How to Self-Host SearXNG with Docker Compose"
description: "Deploy SearXNG with Docker Compose — a privacy-respecting metasearch engine that replaces Google without tracking you."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "search-engines"
apps:
  - searxng
tags:
  - self-hosted
  - searxng
  - docker
  - search-engine
  - privacy
  - google-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is SearXNG?

[SearXNG](https://docs.searxng.org/) is a privacy-respecting metasearch engine that aggregates results from 70+ search engines -- Google, Bing, DuckDuckGo, Wikipedia, and dozens more -- without forwarding your queries or IP address to any of them. You get comprehensive search results without a tracking profile being built around you. It replaces Google Search, Bing, and any other commercial search engine you currently hand your data to.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM (256 MB absolute minimum, 512+ MB recommended)
- 1 GB of free disk space
- A domain name (recommended for remote access via HTTPS)

## Docker Compose Configuration

Create a directory for SearXNG:

```bash
mkdir -p ~/searxng && cd ~/searxng
```

Generate a secret key -- you will need this for the configuration:

```bash
openssl rand -hex 32
```

Save the output. You will use it as `SEARXNG_SECRET_KEY` below.

Create a `docker-compose.yml` file:

```yaml
services:
  searxng:
    container_name: searxng
    image: docker.io/searxng/searxng:2026.2.20-b20a5b667
    ports:
      - "8080:8080/tcp"  # Web UI
    volumes:
      - ./config:/etc/searxng      # Configuration files (settings.yml, limiter.toml)
      - ./data:/var/cache/searxng   # Cache and runtime data
    environment:
      # REQUIRED: The public URL where SearXNG will be accessible
      - SEARXNG_BASE_URL=http://localhost:8080/
      # REQUIRED: Secret key for encryption -- replace with your generated key
      - SEARXNG_SECRET_KEY=CHANGE_ME_REPLACE_WITH_OUTPUT_OF_OPENSSL_RAND_HEX_32
      # Ensures correct file ownership inside the container
      - FORCE_OWNERSHIP=true
    depends_on:
      valkey:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "--quiet", "http://localhost:8080/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID

  valkey:
    container_name: searxng-valkey
    image: docker.io/valkey/valkey:8.0-alpine
    volumes:
      - valkey-data:/data
    command: valkey-server --save 30 1 --loglevel warning
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "valkey-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 5s
    cap_drop:
      - ALL
    cap_add:
      - SETGID
      - SETUID

volumes:
  valkey-data:
```

**A note on image tags:** SearXNG uses a rolling-release model and does not publish fixed semantic version tags. The image tag above (`2026.2.20-b20a5b667`) is a dated build tag. Check [SearXNG's Docker Hub page](https://hub.docker.com/r/searxng/searxng/tags) for the latest dated tag. If no dated tag is available, `docker.io/searxng/searxng:latest` is the fallback -- SearXNG is one of the rare projects where `:latest` is the intended deployment tag. Pin the tag when possible, but know that the project does not maintain stable release versions.

Before starting, create the config directory and a minimal `settings.yml`:

```bash
mkdir -p config
```

Create `config/settings.yml`:

```yaml
use_default_settings: true

server:
  # Must match SEARXNG_BASE_URL
  base_url: "http://localhost:8080/"
  # Replace with your actual secret key
  secret_key: "CHANGE_ME_REPLACE_WITH_OUTPUT_OF_OPENSSL_RAND_HEX_32"
  # Limiter helps prevent abuse if your instance is public
  limiter: true
  # Public instances should set this to true
  image_proxy: true

redis:
  # Connects to the Valkey container for caching and rate limiting
  url: redis://valkey:6379/0

ui:
  # Default theme
  default_theme: simple
  # Default language -- leave blank for auto-detect
  default_locale: ""

search:
  # Safe search: 0 = off, 1 = moderate, 2 = strict
  safe_search: 0
  # Default search language -- leave blank for all languages
  default_lang: ""
  autocomplete: "google"
```

Create `config/limiter.toml` to configure the rate limiter:

```toml
[botdetection.ip_limit]
# Maximum requests per minute for a single IP
link_token = true
```

Now start the stack:

```bash
docker compose up -d
```

Open `http://your-server-ip:8080` in your browser. SearXNG is ready to use immediately -- no setup wizard, no account creation. Search and go.

## Initial Setup

SearXNG works out of the box, but you will want to customize the search engines and settings.

### Enable and Disable Search Engines

Edit `config/settings.yml` to control which engines are active. The `use_default_settings: true` line loads all default engines. To selectively disable engines:

```yaml
use_default_settings: true

engines:
  # Disable Bing
  - name: bing
    disabled: true

  # Disable Yahoo
  - name: yahoo
    disabled: true

  # Enable a specific engine that is off by default
  - name: brave
    disabled: false
```

After editing, restart SearXNG:

```bash
docker compose restart searxng
```

Users can also toggle engines on a per-search basis through the Preferences page in the web UI (click the gear icon). Changes made in the UI are stored in the browser as a cookie -- they do not modify `settings.yml`.

### Set Your Instance as Your Browser's Default Search

Add SearXNG as a custom search engine in your browser:

- **Search URL:** `http://your-server-ip:8080/search?q=%s`
- **Shortcut/Keyword:** `@searx` (or whatever you prefer)

For Firefox, visit your SearXNG instance and right-click the search bar to add it as a search engine directly.

## Configuration

### Search Engine Selection

SearXNG supports 70+ engines grouped by category: general, images, videos, news, maps, music, IT, science, files, and social media. The full list is in the [SearXNG documentation](https://docs.searxng.org/user/configured_engines.html).

Key engines to consider enabling or tuning:

| Engine | Category | Notes |
|--------|----------|-------|
| google | general | Best results for most queries. Enabled by default. |
| brave | general | Good privacy-focused alternative. Disabled by default. |
| duckduckgo | general | Privacy-respecting. Enabled by default. |
| wikipedia | general | Direct Wikipedia results. Enabled by default. |
| reddit | social media | Useful for community answers. |
| arxiv | science | Academic papers. |
| github | IT | Code and repository search. |

### Privacy Settings

In `settings.yml`, you can control how SearXNG protects your privacy:

```yaml
server:
  # Proxy images through SearXNG so external engines never see the user's IP
  image_proxy: true
  # HTTP or HTTPS method to send requests to search engines
  method: "POST"

search:
  # Supported formats for results
  formats:
    - html
    - json
```

Setting `method: "POST"` prevents search queries from appearing in URL logs on upstream search engines. The `image_proxy` option routes image thumbnails through your SearXNG server so users never make direct connections to external hosts.

### UI Customization

```yaml
ui:
  default_theme: simple
  # Center alignment like traditional search engines
  center_alignment: true
  # Number of results per page
  results_on_new_tab: false
  # Infinite scroll instead of pagination
  infinite_scroll: false
```

### Public vs Private Instance

If you are running SearXNG only for yourself or your household, disable the limiter for a smoother experience:

```yaml
server:
  limiter: false
```

If you plan to make your instance public, keep the limiter enabled and configure `limiter.toml` to prevent abuse. Public instances also benefit from being added to [searx.space](https://searx.space/) -- the directory of public SearXNG instances.

## Reverse Proxy

SearXNG runs on port 8080 by default. For HTTPS access with a proper domain, put it behind a reverse proxy. Update `SEARXNG_BASE_URL` and `server.base_url` in `settings.yml` to match your domain:

```yaml
# In docker-compose.yml environment section
- SEARXNG_BASE_URL=https://search.yourdomain.com/

# In config/settings.yml
server:
  base_url: "https://search.yourdomain.com/"
```

An Nginx Proxy Manager location entry for SearXNG needs no special headers beyond the standard proxy configuration. Point it at `http://searxng:8080` (if on the same Docker network) or `http://your-server-ip:8080`.

For full reverse proxy setup instructions, see: [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

## Backup

SearXNG's data footprint is small. Back up these two directories:

- **`./config/`** -- Contains `settings.yml`, `limiter.toml`, and any custom configurations. This is the critical directory. Losing it means reconfiguring all your engine selections and settings.
- **`./data/`** -- Contains cached data. Not critical -- it rebuilds automatically.

The Valkey volume stores cached search results. It is ephemeral and does not need backup.

```bash
# Back up the SearXNG configuration
tar -czf searxng-backup-$(date +%Y%m%d).tar.gz config/
```

For a full backup strategy, see: [Backup Strategy](/foundations/backup-3-2-1-rule)

## Troubleshooting

### SearXNG Returns No Results for Some Engines

**Symptom:** Searches work, but certain engines always return empty results or errors.

**Fix:** Some search engines rate-limit or block requests from known server IPs (especially cloud providers). This is common with Google.

1. Check the engine status in the SearXNG preferences page (gear icon > Engines tab). Engines with errors will show a warning icon.
2. If Google is blocked, try enabling `use_mobile_ua: true` for the engine in `settings.yml`, or rely on other general engines like Brave and DuckDuckGo.
3. Ensure the Valkey cache is running -- without it, SearXNG cannot cache tokens needed by some engines:
   ```bash
   docker compose logs valkey
   ```

### Container Fails to Start with Permission Errors

**Symptom:** SearXNG container exits immediately with permission denied errors on `/etc/searxng/`.

**Fix:** Ensure `FORCE_OWNERSHIP=true` is set in your environment variables. This tells the container entrypoint to fix file ownership on startup. If the issue persists:

```bash
# Fix ownership manually
sudo chown -R 977:977 ./config ./data
docker compose restart searxng
```

UID 977 is the default SearXNG user inside the container.

### Valkey Connection Refused

**Symptom:** SearXNG logs show `redis.exceptions.ConnectionError: Error connecting to redis://valkey:6379/0`.

**Fix:** The Valkey container may not be ready yet, or the service name does not match. Verify:

1. Both containers are on the same Docker network (they are by default in the same Compose file).
2. The `redis.url` in `settings.yml` uses the correct service name: `redis://valkey:6379/0`.
3. Valkey is healthy:
   ```bash
   docker compose exec valkey valkey-cli ping
   # Should return: PONG
   ```

### Settings Changes Not Taking Effect

**Symptom:** You edited `settings.yml` but SearXNG still uses the old configuration.

**Fix:** SearXNG reads `settings.yml` at startup. A simple `docker compose restart searxng` is required after any settings change. Also check:

1. Your `settings.yml` is valid YAML -- indentation errors will cause SearXNG to fall back to defaults silently.
2. You are editing the correct file (the one mounted into the container, not a copy elsewhere).
3. Check the container logs for parsing errors:
   ```bash
   docker compose logs searxng | grep -i error
   ```

## Resource Requirements

- **RAM:** 256 MB minimum, 512 MB recommended. Each search query briefly spikes memory while aggregating results from multiple engines. With Valkey, add another 50-100 MB.
- **CPU:** Low. SearXNG is I/O-bound (waiting on upstream search engines), not CPU-bound. Any modern single-core VPS handles it.
- **Disk:** 1 GB minimum. The application itself is small. Cache data in Valkey and `/var/cache/searxng/` grows slowly and can be pruned.

## Verdict

SearXNG is the best self-hosted search engine available. It is mature, actively maintained, and genuinely useful as a daily driver replacement for Google. The aggregation approach means you get better results than any single privacy-focused engine like DuckDuckGo, because you are pulling from all of them simultaneously -- without any of them knowing who you are.

Setup takes five minutes. Resource usage is negligible. The only real trade-off is that some engines (particularly Google) may rate-limit your server IP over time, but with 70+ engines available, you will always have working sources. If you care about search privacy at all, SearXNG is the answer. Run it, set it as your default search engine, and stop giving Google your query history.

## Related

- [Best Self-Hosted Search Engines](/best/search-engines)
- [Self-Hosted Alternatives to Google Search](/replace/google-search)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [How to Self-Host AdGuard Home](/apps/adguard-home) -- pair with SearXNG for full DNS-level ad blocking alongside private search
- [How to Self-Host Whoogle](/apps/whoogle) -- a lighter alternative if you only want Google results without tracking
- [Security Basics for Self-Hosting](/foundations/security-hardening)
