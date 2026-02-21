---
title: "How to Self-Host Recyclarr with Docker"
description: "Set up Recyclarr with Docker to sync TRaSH Guides quality profiles to Sonarr and Radarr. Automated custom format and quality management."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "download-management"
apps:
  - recyclarr
tags:
  - self-hosted
  - recyclarr
  - docker
  - sonarr
  - radarr
  - arr-stack
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Recyclarr?

Recyclarr syncs quality profiles and custom formats from the [TRaSH Guides](https://trash-guides.info/) directly into Sonarr and Radarr. Instead of manually configuring dozens of custom formats and quality profiles, Recyclarr reads a YAML config and pushes the settings automatically. When TRaSH Guides update their recommendations, run Recyclarr again to stay current. [GitHub](https://github.com/recyclarr/recyclarr)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 200 MB of free disk space
- 128 MB of RAM (minimum)
- Sonarr and/or Radarr already running

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  recyclarr:
    image: ghcr.io/recyclarr/recyclarr:7.4.0
    container_name: recyclarr
    user: 1000:1000                        # Run as your user (not root)
    volumes:
      - ./recyclarr-config:/config         # Configuration files
    environment:
      - TZ=America/New_York                # Your timezone
      - RECYCLARR_CREATE_CONFIG=true       # Create default config on first run
    restart: unless-stopped
```

Start the container:

```bash
docker compose up -d
```

On first run with `RECYCLARR_CREATE_CONFIG=true`, Recyclarr creates a default `recyclarr.yml` in the config directory.

## Initial Setup

1. After first run, edit `./recyclarr-config/recyclarr.yml`
2. Get your Sonarr API key from **Sonarr → Settings → General → API Key**
3. Get your Radarr API key from **Radarr → Settings → General → API Key**
4. Configure your YAML file (see Configuration below)
5. Run a sync:

```bash
docker compose run --rm recyclarr sync
```

## Configuration

The main config file is `recyclarr.yml`. Here's a practical example:

```yaml
# recyclarr.yml
sonarr:
  series:
    base_url: http://sonarr:8989          # Sonarr URL (use container name if same network)
    api_key: your-sonarr-api-key-here     # From Sonarr Settings → General
    delete_old_custom_formats: false       # Set true to remove CFs not in this config
    replace_existing_custom_formats: true  # Update existing CFs with TRaSH values

    quality_definition:
      type: series                         # Use TRaSH recommended quality sizes

    quality_profiles:
      - name: WEB-1080p                    # Must match a profile name in Sonarr
        reset_unmatched_scores:
          enabled: true                    # Reset scores for CFs not listed below
        upgrade:
          allowed: true
          until_quality: WEB 1080p
          until_score: 10000
        min_format_score: 0
        quality_sort: top
        qualities:
          - name: WEB 1080p
            qualities:
              - WEBDL-1080p
              - WEBRip-1080p

    custom_formats:
      - trash_ids:
          - 32b367365729d530ca1c124a0b180c64  # Bad Dual Groups
          - 82d40da2bc6923f41e14394075dd4b03  # No-RlsGroup
          - e1a997ddb54e3ecbfe06341ad323c458  # Obfuscated
          - 06d66ab109d4d2eddb2794d21526d140  # Retags
        assign_scores_to:
          - name: WEB-1080p
            score: -10000                    # Strongly avoid these

radarr:
  movies:
    base_url: http://radarr:7878
    api_key: your-radarr-api-key-here
    delete_old_custom_formats: false
    replace_existing_custom_formats: true

    quality_definition:
      type: movie

    quality_profiles:
      - name: HD Bluray + WEB
        reset_unmatched_scores:
          enabled: true
        upgrade:
          allowed: true
          until_quality: Bluray-1080p
          until_score: 10000
        min_format_score: 0

    custom_formats:
      - trash_ids:
          - ed38b889b31be83fda192888e2286d83  # BR-DISK (avoid raw Blu-ray discs)
          - 90a6f9a284dff5103f6346090e6280c8  # LQ
          - dc98083864ea246d05a42df0d05f81cc  # x265 (HD — avoid for compatibility)
        assign_scores_to:
          - name: HD Bluray + WEB
            score: -10000
```

### Finding TRaSH IDs

To find custom format TRaSH IDs:

1. Visit [TRaSH Guides](https://trash-guides.info/)
2. Navigate to the Sonarr or Radarr section
3. Find the custom format you want
4. The TRaSH ID is listed on each custom format page

Or use Recyclarr's built-in list:

```bash
docker compose run --rm recyclarr list custom-formats sonarr
docker compose run --rm recyclarr list custom-formats radarr
```

### Automated Sync with Cron

Recyclarr doesn't run as a daemon — it executes and exits. Set up a cron schedule in the config:

```yaml
# In recyclarr.yml, add at the top level:
# Or use Docker's built-in scheduling:
```

Using Docker Compose with a cron-style restart:

```yaml
services:
  recyclarr:
    image: ghcr.io/recyclarr/recyclarr:7.4.0
    container_name: recyclarr
    user: 1000:1000
    volumes:
      - ./recyclarr-config:/config
    environment:
      - TZ=America/New_York
      - CRON_SCHEDULE=@weekly              # Run weekly sync
    restart: unless-stopped
```

The `CRON_SCHEDULE` environment variable accepts standard cron expressions. `@weekly` runs every Sunday at midnight.

## Reverse Proxy

Recyclarr doesn't have a web UI — it's a CLI tool that runs on a schedule. No reverse proxy needed.

## Backup

Back up the config directory:

```bash
tar -czf recyclarr-backup-$(date +%Y%m%d).tar.gz ./recyclarr-config/
```

The config directory contains your `recyclarr.yml` — that's the only critical file. See [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### "Unable to connect" errors

**Symptom:** Recyclarr can't reach Sonarr or Radarr.
**Fix:** If using container names (e.g., `http://sonarr:8989`), ensure Recyclarr is on the same Docker network. If using IP, use the host IP, not `localhost`.

### Custom formats not appearing in Sonarr/Radarr

**Symptom:** Sync completes but no changes visible.
**Fix:** Check the TRaSH IDs are correct. Run with verbose logging: `docker compose run --rm recyclarr sync --debug`. Look for "no changes needed" messages — if your settings already match, Recyclarr won't modify them.

### Quality profile not found

**Symptom:** Error about a missing quality profile.
**Fix:** The `name` in your config must exactly match the quality profile name in Sonarr/Radarr (case-sensitive). Create the profile in Sonarr/Radarr first, then reference it in Recyclarr.

## Resource Requirements

- **RAM:** ~50-100 MB during sync (not a resident service)
- **CPU:** Low — runs briefly during sync
- **Disk:** ~50 MB for application, config is negligible

## Verdict

Recyclarr is indispensable if you use Sonarr and Radarr. Manually managing custom formats and quality profiles is tedious and error-prone — TRaSH Guides are the community standard for quality settings, and Recyclarr automates applying them. Set it up once, schedule weekly syncs, and your quality profiles stay current with community best practices.

The only downside is the learning curve around TRaSH IDs and YAML configuration. Once configured, it's entirely hands-off.

## FAQ

### Do I need Recyclarr if I manually set up quality profiles?

You don't need it, but it saves significant effort. TRaSH Guides maintain dozens of custom formats that help identify the best releases. Keeping up with changes manually is impractical.

### Will Recyclarr overwrite my custom settings?

Only settings defined in your `recyclarr.yml` are modified. Set `delete_old_custom_formats: false` to preserve custom formats you've created manually. Scores are only assigned to profiles listed in the config.

### How often should I sync?

Weekly is fine for most users. Custom format definitions and quality recommendations don't change frequently. `CRON_SCHEDULE=@weekly` is a sensible default.

## Related

- [How to Self-Host Sonarr](/apps/sonarr/)
- [How to Self-Host Radarr](/apps/radarr/)
- [Sonarr vs Radarr](/compare/sonarr-vs-radarr/)
- [Prowlarr vs Jackett](/compare/prowlarr-vs-jackett/)
- [How to Self-Host qBittorrent](/apps/qbittorrent/)
- [How to Self-Host Prowlarr](/apps/prowlarr/)
- [Best Self-Hosted Download Management](/best/download-management/)
