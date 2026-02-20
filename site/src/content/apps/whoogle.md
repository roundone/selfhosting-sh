---
title: "How to Self-Host Whoogle with Docker Compose"
description: "Deploy Whoogle with Docker for private Google search. No ads, no tracking, no JavaScript required. Complete setup guide."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "search-engines"
apps:
  - whoogle
tags:
  - self-hosted
  - whoogle
  - docker
  - search
  - privacy
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Whoogle?

[Whoogle](https://github.com/benbusby/whoogle-search) is a self-hosted Google search proxy that strips out ads, tracking, and JavaScript from Google search results. You get Google's search quality without Google knowing who you are. Your search queries go from your browser to your Whoogle server, then from Whoogle to Google — Google sees your server's IP, not yours.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 256 MB+ RAM
- 1 GB free disk space
- No GPU required

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  whoogle:
    image: benbusby/whoogle-search:1.2.2
    container_name: whoogle
    ports:
      - "5000:5000"
    environment:
      # Optional: Set username/password for access control
      - WHOOGLE_USER=admin
      - WHOOGLE_PASS=changeme-use-strong-password
      # Optional: Use a proxy for Google requests
      # - WHOOGLE_PROXY_TYPE=socks5
      # - WHOOGLE_PROXY_LOC=localhost:9050
      # Optional: Default search settings
      - WHOOGLE_CONFIG_THEME=dark
      - WHOOGLE_CONFIG_SAFE=off
      - WHOOGLE_CONFIG_LANGUAGE=lang_en
      - WHOOGLE_CONFIG_NEW_TAB=true
    pids_limit: 50
    mem_limit: 256m
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    tmpfs:
      - /config/:size=10M,uid=927,gid=927,mode=1700
      - /var/lib/tor/:size=15M,uid=927,gid=927,mode=1700
      - /run/tor/:size=1M,uid=927,gid=927,mode=1700
    restart: unless-stopped
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

Open `http://your-server:5000` in your browser. You'll see a clean Google-like search interface without any ads or tracking.

### Set as Default Search Engine

In your browser settings, add a custom search engine:
- **Name:** Whoogle
- **URL:** `http://your-server:5000/search?q=%s`

### Tor Proxy

Route Whoogle's requests through Tor for additional privacy:

```yaml
environment:
  - WHOOGLE_PROXY_TYPE=socks5
  - WHOOGLE_PROXY_LOC=localhost:9050
```

Whoogle has a built-in Tor client. This makes Google see a Tor exit node instead of your server's IP.

## Configuration

### Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `WHOOGLE_USER` | | Username for authentication |
| `WHOOGLE_PASS` | | Password for authentication |
| `WHOOGLE_PROXY_TYPE` | | Proxy type: `socks5`, `http` |
| `WHOOGLE_PROXY_LOC` | | Proxy address (e.g., `localhost:9050`) |
| `WHOOGLE_CONFIG_THEME` | `system` | UI theme: `dark`, `light`, `system` |
| `WHOOGLE_CONFIG_SAFE` | `moderate` | Safe search: `on`, `moderate`, `off` |
| `WHOOGLE_CONFIG_LANGUAGE` | | Search language (e.g., `lang_en`) |
| `WHOOGLE_CONFIG_NEW_TAB` | `false` | Open results in new tab |
| `WHOOGLE_CONFIG_COUNTRY` | | Country for results (e.g., `countryUS`) |
| `WHOOGLE_CONFIG_STYLE` | | Custom CSS for the UI |
| `WHOOGLE_CSP` | | Custom Content Security Policy |
| `WHOOGLE_CONFIG_URL` | | Base URL (set when behind reverse proxy) |

### Bang Searches

Whoogle supports DuckDuckGo-style bang searches:
- `!w Python` → searches Wikipedia
- `!yt Docker tutorial` → searches YouTube
- `!gh selfhosting` → searches GitHub

## Reverse Proxy

Configure your reverse proxy to forward to port 5000. Set `WHOOGLE_CONFIG_URL` to your public URL. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Whoogle is stateless — it stores no persistent data. The `tmpfs` mounts are in-memory and cleared on restart. No backup needed. See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Google CAPTCHA / Blocked

**Symptom:** Whoogle shows CAPTCHA pages or "unusual traffic" errors.
**Fix:** Google may rate-limit or block your server's IP. Enable the Tor proxy (`WHOOGLE_PROXY_TYPE=socks5`, `WHOOGLE_PROXY_LOC=localhost:9050`) to rotate IPs. Reduce search frequency. This is a known limitation of Google proxying.

### Blank Search Results

**Symptom:** Search page loads but no results appear.
**Fix:** Google may have changed their HTML structure. Update to the latest Whoogle version. Check `docker logs whoogle` for errors. Google actively works to prevent scraping.

### Authentication Not Working

**Symptom:** Login page loops or doesn't appear.
**Fix:** Both `WHOOGLE_USER` and `WHOOGLE_PASS` must be set. If only one is set, authentication is disabled. Clear browser cookies.

## Resource Requirements

- **RAM:** 50-100 MB (very lightweight)
- **CPU:** Very low
- **Disk:** None (stateless, uses tmpfs)

## Verdict

Whoogle is the simplest way to get private Google search results. It's extremely lightweight, stateless, and easy to deploy. The main downside is that Google actively fights scrapers — you may encounter CAPTCHAs or blocks, especially from datacenter IPs. The Tor proxy mitigates this but adds latency.

**Choose Whoogle** if you specifically want Google results without tracking. **Choose [SearXNG](/apps/searxng)** if you want results from multiple search engines and more reliability (SearXNG is less likely to be blocked since it distributes queries across many engines).

## Related

- [How to Self-Host SearXNG](/apps/searxng)
- [SearXNG vs Whoogle](/compare/searxng-vs-whoogle)
- [SearXNG vs Google](/compare/searxng-vs-google)
- [Self-Hosted Google Alternatives](/replace/google-search)
- [Best Self-Hosted Search Engines](/best/search-engines)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
