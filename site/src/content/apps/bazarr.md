---
title: "How to Self-Host Bazarr with Docker"
description: "Set up Bazarr with Docker Compose for automatic subtitle management alongside Sonarr and Radarr in your arr stack."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "download-management"
apps:
  - bazarr
tags:
  - docker
  - subtitles
  - arr-stack
  - sonarr
  - radarr
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Bazarr?

[Bazarr](https://www.bazarr.media/) is a companion application to Sonarr and Radarr that automatically downloads subtitles for your TV shows and movies. It monitors your media library, matches episodes and films against subtitle providers like OpenSubtitles and Subscene, and drops the correct subtitle files right next to your media. If you run Sonarr and Radarr, Bazarr is the missing piece that makes your media stack complete.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM (minimum)
- [Sonarr](/apps/sonarr) and/or [Radarr](/apps/radarr) already running and configured
- Media directories accessible to the Bazarr container
- An account with at least one subtitle provider (OpenSubtitles, Subscene, Addic7ed, etc.)

## Docker Compose Configuration

Bazarr must see the same media paths as Sonarr and Radarr. If Sonarr maps `/tv` to `/data/tv` on the host, Bazarr needs the identical mapping. Mismatched paths are the number one cause of Bazarr failing to find or save subtitles.

Create a `docker-compose.yml` file:

```yaml
services:
  bazarr:
    image: lscr.io/linuxserver/bazarr:1.5.1
    container_name: bazarr
    environment:
      - PUID=1000        # Your user ID — run 'id' to find it
      - PGID=1000        # Your group ID — run 'id' to find it
      - TZ=America/New_York  # Your timezone
    volumes:
      - ./bazarr-config:/config          # Bazarr configuration and database
      - /data/movies:/movies             # Must match Radarr's movie path exactly
      - /data/tv:/tv                     # Must match Sonarr's TV path exactly
    ports:
      - "6767:6767"      # Bazarr Web UI
    restart: unless-stopped
```

The `/movies` and `/tv` container paths must be identical to what Sonarr and Radarr use. If your Sonarr container maps `/data/tv:/tv`, then Bazarr must also map `/data/tv:/tv`. Not `/media/tv:/tv`, not `/srv/tv:/tv` — the exact same host path to the exact same container path.

Start the stack:

```bash
docker compose up -d
```

Bazarr will be available at `http://your-server-ip:6767`.

## Initial Setup

### Connect to Sonarr

1. Open Bazarr at `http://your-server-ip:6767`
2. Go to **Settings → Sonarr**
3. Toggle **Enabled** on
4. Set **Host** to your Sonarr IP or hostname (use the Docker host IP if running in separate Compose stacks, or the container name if on the same Docker network)
5. Set **Port** to `8989` (default Sonarr port)
6. Paste your Sonarr **API Key** (found in Sonarr under Settings → General)
7. Click **Test** to verify the connection
8. Set the **Minimum Score** for subtitle matching (70 is a good starting point)
9. Click **Save**

### Connect to Radarr

1. Go to **Settings → Radarr**
2. Toggle **Enabled** on
3. Set **Host** to your Radarr IP or hostname
4. Set **Port** to `7878` (default Radarr port)
5. Paste your Radarr **API Key** (found in Radarr under Settings → General)
6. Click **Test** to verify the connection
7. Set the **Minimum Score** for subtitle matching
8. Click **Save**

### Configure Subtitle Providers

1. Go to **Settings → Providers**
2. Click the **+** button to add a provider
3. Select a provider from the list. Recommended starting providers:
   - **OpenSubtitles.com** — largest subtitle database; requires a free account at opensubtitles.com
   - **Subscene** — good coverage for non-English subtitles
   - **Addic7ed** — strong for TV show subtitles; requires a free account
4. Enter your credentials for each provider
5. Click **Save**

Add at least two providers for redundancy. Bazarr queries them in order and uses the best match.

### Set Subtitle Languages

1. Go to **Settings → Languages**
2. Under **Enabled Languages**, select every language you want subtitles for
3. Set your **Default** language profile (e.g., English)
4. Create language profiles if you need different languages for different shows or movies
5. Click **Save**

## Configuration

### Subtitle Quality Profiles

Bazarr scores subtitle matches based on hash matching, release group, and video codec. Configure this under **Settings → Subtitles**:

- **Subtitle Folder** — leave as "Alongside Media File" so subtitles sit next to the video file
- **Upgrade Subtitles** — enable this so Bazarr replaces low-scoring subtitles when better ones appear
- **Upgrade Frequency** — how often to check for better subtitles (every 12 hours is reasonable)
- **Days to Upgrade** — how long after initial download to keep looking for upgrades (7 days works well)
- **Anti-Captcha** — some providers use captchas; add an Anti-Captcha or DeathByCaptcha API key if you hit rate limits

### Anti-Captcha Setup

Some subtitle providers use captchas to prevent automated downloading. If you see captcha errors in the Bazarr logs:

1. Go to **Settings → Subtitles**
2. Under **Anti-Captcha Providers**, select **Anti-Captcha** or **Death By Captcha**
3. Enter your API key
4. Click **Save**

Anti-Captcha costs a few dollars for thousands of solves. It is worth the cost if you have a large library.

### Custom Language Profiles

For multilingual households, create profiles that download multiple subtitle languages per media item:

1. Go to **Settings → Languages**
2. Click **Add New Profile**
3. Name it (e.g., "English + Spanish")
4. Add your desired languages in priority order
5. Assign profiles to specific series in Sonarr or movies in Radarr through the Bazarr UI under **Series** or **Movies**

### Scheduler Settings

Under **Settings → Scheduler**, configure how aggressively Bazarr searches:

- **Sonarr/Radarr Sync** — how often to pull library changes (every 15 minutes is the default)
- **Search Missing Subtitles** — how often to search for missing subtitles across your library (every 12 hours)
- **Upgrade Subtitles** — how often to check for better quality subtitles

For a large library (1,000+ items), keep search intervals at 12-24 hours to avoid hitting provider rate limits.

## Advanced Configuration

### Custom Post-Processing

Bazarr can run scripts after downloading a subtitle. Use this for custom formatting, encoding conversion, or notifications.

1. Go to **Settings → Subtitles**
2. Under **Post-Processing**, enable the post-processing command
3. Enter a script path accessible inside the container. Example:

```bash
# /config/scripts/fix-encoding.sh
#!/bin/bash
# Convert subtitle encoding to UTF-8
iconv -f WINDOWS-1252 -t UTF-8 "$1" -o "$1.tmp" && mv "$1.tmp" "$1"
```

Mount your scripts directory if it lives outside the config volume.

### Webhook Notifications

Bazarr supports notifications through multiple services:

1. Go to **Settings → Notifications**
2. Add a notification provider:
   - **Discord** — paste a webhook URL
   - **Slack** — paste a webhook URL
   - **Apprise** — supports dozens of notification services through a single API
   - **Email** — SMTP configuration for email alerts
3. Select which events trigger notifications (subtitle downloaded, subtitle upgraded, failed download)
4. Click **Test** to verify, then **Save**

### Excluding Specific Media

To skip subtitle downloads for certain content (e.g., foreign language films you watch with dubbing):

1. Go to the **Movies** or **Series** tab
2. Select the item
3. Change the subtitle profile to **None**

This prevents Bazarr from wasting provider API calls on media that does not need subtitles.

## Reverse Proxy

If you run a reverse proxy, add Bazarr behind it for HTTPS access. Bazarr works behind a subpath or subdomain.

### Nginx Proxy Manager

Create a proxy host pointing to `http://bazarr-ip:6767`. No special configuration is needed — Bazarr handles reverse proxying without base URL changes by default.

If you need a subpath (e.g., `/bazarr`), set the base URL in Bazarr under **Settings → General → Base URL** to `/bazarr`, then configure your proxy accordingly.

For a full reverse proxy setup, see [Reverse Proxy Setup](/foundations/reverse-proxy).

## Backup

Bazarr stores its configuration and database in the `/config` volume. Back up this directory to preserve:

- Subtitle provider credentials
- Sonarr/Radarr connection settings
- Language profiles and quality settings
- Download history and logs

```bash
# Stop Bazarr before backing up for database consistency
docker compose stop bazarr
tar -czf bazarr-backup-$(date +%Y%m%d).tar.gz ./bazarr-config
docker compose start bazarr
```

You do not need to back up subtitle files themselves — Bazarr can re-download them. The configuration is what matters.

For a comprehensive approach, see [Backup Strategy](/foundations/backup-strategy).

## Troubleshooting

### Bazarr Cannot Find Media Files

**Symptom:** Bazarr shows your series or movies from Sonarr/Radarr but lists all episodes as "file missing" or subtitles fail to save.

**Fix:** This is a path mismatch. The container paths in Bazarr must exactly match those in Sonarr and Radarr. If Sonarr uses `/tv` as its container path for TV shows, Bazarr must also mount to `/tv` — not `/media/tv`, not `/television`. Check your `docker-compose.yml` volume mappings and ensure the host-to-container path pairs are identical across all three services.

### Subtitle Provider Authentication Failures

**Symptom:** Logs show 401 or 403 errors from OpenSubtitles or other providers.

**Fix:** OpenSubtitles.com (the new API, not the legacy one) requires a separate account from the old opensubtitles.org. Create an account at opensubtitles.com and use those credentials. Also check that you have not exceeded the daily download limit — free accounts are limited to a set number of downloads per day (typically 20 for OpenSubtitles.com).

### Subtitles Downloaded but Out of Sync

**Symptom:** Subtitles appear but are offset by several seconds from the actual dialogue.

**Fix:** Enable subtitle syncing in Bazarr. Go to **Settings → Subtitles** and enable **Use Embedded Subtitles as Reference** if your media has embedded subtitles. Alternatively, increase the minimum match score to 80+ so Bazarr only downloads higher-quality matches that are more likely to be properly synced. You can also use the built-in subtitle offset tool in Bazarr to manually adjust timing.

### Bazarr Cannot Connect to Sonarr or Radarr

**Symptom:** Connection test fails with timeout or connection refused errors.

**Fix:** If Bazarr runs in a separate Docker Compose stack from Sonarr/Radarr, use the Docker host IP (not `localhost` or `127.0.0.1`) as the host address. If they share the same Compose file or Docker network, use the container name as the hostname (e.g., `sonarr` or `radarr`). Verify the API key is correct and that the target service is actually running.

### High CPU Usage During Library Sync

**Symptom:** CPU spikes to 100% when Bazarr syncs a large library from Sonarr/Radarr.

**Fix:** This is normal during the initial sync of a large library (5,000+ items). Subsequent syncs are incremental and much lighter. If it persists, increase the sync interval under **Settings → Scheduler** to reduce frequency. You can also temporarily disable one of Sonarr or Radarr, let the other sync complete, then re-enable.

## Resource Requirements

- **RAM:** 150 MB idle, 300 MB during active subtitle searching
- **CPU:** Low — brief spikes during library sync and subtitle searches
- **Disk:** Under 100 MB for application data. Subtitle files themselves are negligible (a few KB each)

Bazarr is one of the lightest services in the arr stack. It runs comfortably on a Raspberry Pi 4 or any low-power server.

## Verdict

Bazarr is essential if you run Sonarr and Radarr and watch content that benefits from subtitles. Setup takes ten minutes, resource usage is negligible, and it runs silently in the background handling a task that would be tedious to do manually. The only real setup friction is getting media paths to match across your arr stack containers — get that right and Bazarr just works. If you self-host a media stack, add Bazarr. There is no reason not to.

## Related

- [How to Self-Host Sonarr with Docker](/apps/sonarr)
- [How to Self-Host Radarr with Docker](/apps/radarr)
- [How to Self-Host Prowlarr with Docker](/apps/prowlarr)
- [How to Self-Host qBittorrent with Docker](/apps/qbittorrent)
- [How to Self-Host Jellyfin with Docker](/apps/jellyfin)
- [Best Self-Hosted Download Management](/best/download-management)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
- [Backup Strategy](/foundations/backup-strategy)
