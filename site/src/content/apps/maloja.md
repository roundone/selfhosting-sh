---
title: "How to Self-Host Maloja with Docker Compose"
description: "Step-by-step guide to self-hosting Maloja music scrobbling server with Docker, including Last.fm import, client setup, and configuration."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "music-streaming"
apps:
  - maloja
tags:
  - self-hosted
  - maloja
  - docker
  - scrobbling
  - music
  - lastfm-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Maloja?

[Maloja](https://github.com/krateng/maloja) is a self-hosted music scrobbling and statistics server. It tracks what you listen to from any Subsonic, Last.fm, or ListenBrainz-compatible music player and generates detailed listening statistics, charts, and visualizations. Think of it as a privacy-respecting, self-hosted replacement for Last.fm's tracking functionality. Your listening data stays on your server, forever.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 256 MB+ of free RAM
- A music player that supports Last.fm or ListenBrainz scrobbling (Navidrome, Jellyfin, Plex, etc.)
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  maloja:
    image: krateng/maloja:3.2.4
    container_name: maloja
    restart: unless-stopped
    ports:
      - "42010:42010"  # Web UI and API
    environment:
      MALOJA_DATA_DIRECTORY: /data
      MALOJA_FORCE_PASSWORD: your-admin-password  # CHANGE: Use a strong password
      MALOJA_SKIP_SETUP: "false"
    volumes:
      - maloja-data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:42010"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  maloja-data:
```

**Configuration notes:**

- **Maloja uses rolling releases** on Docker Hub (`latest` tag). The project doesn't publish semver Docker tags. Pin by digest (`krateng/maloja@sha256:...`) for reproducible deployments.
- **Port 42010** is the default for both the web UI and the scrobble API.
- **`MALOJA_FORCE_PASSWORD`** sets the admin password on first run. Remove this variable after initial setup if you prefer.
- **All data** (scrobble database, configuration, images) lives in the `/data` volume.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server:42010` in your browser
2. You'll see the Maloja dashboard — initially empty since no scrobbles have been recorded
3. Navigate to **Settings** (gear icon) to configure:
   - **API keys:** Generate keys for each scrobble source (one per music player)
   - **Third-party scrobbling:** Optionally forward scrobbles to Last.fm, ListenBrainz, or other services
   - **Metadata:** Configure artist image sources and name normalization rules

### Generate an API Key

1. Go to Settings → API Keys
2. Click **Generate New Key**
3. Copy the key — you'll use this to configure your music players

## Configuration

### Connect Navidrome

In Navidrome's settings, configure Last.fm scrobbling:

1. Go to Navidrome Settings → Personal → Last.fm
2. Set the scrobble URL to: `http://your-maloja-server:42010/apis/mlj_1`
3. Enter your Maloja API key
4. Navidrome will now scrobble to Maloja using the Last.fm protocol

### Connect Jellyfin

Install the Last.fm scrobbler plugin for Jellyfin:

1. In Jellyfin, go to Dashboard → Plugins → Catalog
2. Install "Last.fm Scrobbler"
3. Configure the plugin with:
   - **Server URL:** `http://your-maloja-server:42010/apis/mlj_1`
   - **API Key:** Your Maloja API key

### Connect Any Subsonic Client

Most Subsonic clients (DSub, Symfonium) have built-in Last.fm scrobbling. Point the scrobble endpoint to your Maloja instance instead of Last.fm.

### Environment Variables

| Variable | Description | Default |
|----------|------------|---------|
| `MALOJA_DATA_DIRECTORY` | Path for all data storage | `/data` |
| `MALOJA_FORCE_PASSWORD` | Set admin password | (none) |
| `MALOJA_SKIP_SETUP` | Skip first-run setup wizard | `false` |
| `MALOJA_HOST` | Listen address | `::` (all interfaces) |
| `MALOJA_PORT` | Listen port | `42010` |
| `MALOJA_NAME` | Instance name shown in UI | `Maloja` |
| `MALOJA_TIMEZONE` | Timezone for statistics | System default |
| `MALOJA_SCROBBLE_LASTFM` | Forward scrobbles to Last.fm | `false` |
| `MALOJA_LASTFM_API_KEY` | Last.fm API key for forwarding | (none) |
| `MALOJA_LASTFM_API_SECRET` | Last.fm API secret for forwarding | (none) |

## Advanced Configuration (Optional)

### Import Last.fm History

Migrate your existing Last.fm scrobble history to Maloja:

1. Export your Last.fm data using [lastfm-to-csv](https://github.com/kaldrenon/lastfm-to-csv) or similar tool
2. Place the CSV file in the Maloja data directory
3. Maloja can import Last.fm-format CSV files via the admin interface

### Artist Name Rules

Maloja lets you define rules for normalizing artist names — useful when different players send slightly different names for the same artist:

Create rules in the Maloja settings:
- **Replace:** "Pink floyd" → "Pink Floyd"
- **Combine:** "The Beatles" and "Beatles" → "The Beatles"
- **Separate:** "Artist A & Artist B" → treated as collaboration, credited to both

### Dual Scrobbling (Maloja + Last.fm)

Run Maloja as your primary scrobble destination and mirror scrobbles to Last.fm:

```yaml
environment:
  MALOJA_SCROBBLE_LASTFM: "true"
  MALOJA_LASTFM_API_KEY: your-lastfm-api-key
  MALOJA_LASTFM_API_SECRET: your-lastfm-api-secret
```

This gives you local data ownership while maintaining your Last.fm profile.

## Reverse Proxy

For Nginx Proxy Manager:

```
Scheme: http
Forward Hostname: maloja
Forward Port: 42010
```

No special configuration needed — Maloja serves a standard HTTP web application.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for detailed instructions.

## Backup

Maloja stores everything in a single data directory:

```bash
# Backup the entire data volume
docker run --rm -v maloja-data:/data -v $(pwd):/backup alpine tar czf /backup/maloja-backup.tar.gz /data
```

The data directory contains:
- **Scrobble database** (SQLite) — your complete listening history
- **Configuration** — API keys, rules, settings
- **Artist images** — cached artwork

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive backup approach.

## Troubleshooting

### Scrobbles not appearing

**Symptom:** Music player reports scrobbling success but Maloja shows no new scrobbles.
**Fix:** Verify the API endpoint URL. For Last.fm-compatible clients, use `/apis/mlj_1`. For ListenBrainz-compatible clients, use `/apis/listenbrainz`. Check that the API key matches. Check Maloja logs:
```bash
docker logs maloja 2>&1 | tail -50
```

### Duplicate artists in statistics

**Symptom:** The same artist appears multiple times with slightly different names.
**Fix:** Use Maloja's artist name rules (Settings → Rules) to normalize names. Common issues: trailing spaces, different capitalization, "The" prefix inconsistencies.

### High memory usage over time

**Symptom:** Maloja container slowly consumes more RAM.
**Fix:** Restart the container periodically. With very large scrobble databases (100K+), Maloja can accumulate memory for cached statistics. The data is not lost on restart — it's all in the SQLite database.

## Resource Requirements

- **RAM:** 50-150 MB typical. Can grow with large databases.
- **CPU:** Minimal. Scrobble processing is lightweight.
- **Disk:** ~1 MB per 10,000 scrobbles plus cached images (~100 MB for artwork).

## Verdict

Maloja is the best self-hosted scrobbling server available. It's lightweight, easy to deploy, supports both Last.fm and ListenBrainz APIs for wide client compatibility, and gives you permanent ownership of your listening history. The statistics dashboard is clean and informative.

The main limitation is the lack of social features — no friends, no compatibility scores, no recommendations. If you want those, keep a Last.fm account and use Maloja's forwarding feature to maintain both. For pure scrobble tracking and statistics, Maloja is excellent.

## Frequently Asked Questions

### Can I use Maloja without Docker?

Yes. Maloja is a Python application that can be installed directly via pip: `pip install maloja`. Docker is recommended for isolation and easier management, but bare-metal installation works fine.

### Does Maloja replace Spotify's listening history?

Not directly — Spotify doesn't support custom scrobble endpoints. You'd need a bridge (like web-scrobbler browser extension) to send Spotify scrobbles to Maloja. For self-hosted music servers (Navidrome, Jellyfin), it's seamless.

### How accurate are the statistics compared to Last.fm?

Maloja's statistics are more accurate for your local library because you control the data and can normalize artist names. Last.fm's strength is its massive community database for artist metadata and recommendations — a feature Maloja doesn't replicate.

## Related

- [Maloja vs Last.fm](/compare/maloja-vs-lastfm)
- [How to Self-Host Navidrome](/apps/navidrome)
- [Navidrome vs Jellyfin](/compare/navidrome-vs-jellyfin)
- [Best Self-Hosted Music Streaming](/best/music-streaming)
- [Replace Spotify](/replace/spotify)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
