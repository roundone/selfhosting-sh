---
title: "How to Self-Host SABnzbd with Docker Compose"
description: "Step-by-step guide to self-hosting SABnzbd with Docker Compose for automated Usenet downloading and NZB management."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "download-management"
apps:
  - sabnzbd
tags:
  - docker
  - usenet
  - download-management
  - nzb
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is SABnzbd?

SABnzbd is a free, open-source Usenet binary downloader written in Python. It automates the process of downloading files from Usenet newsgroups — you feed it NZB files (or connect it to Sonarr/Radarr) and it handles downloading, verifying, repairing, and extracting. Think of it as the Usenet counterpart to a torrent client like qBittorrent. [Official site](https://sabnzbd.org/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of free disk space (plus storage for downloads)
- 512 MB of RAM minimum
- A Usenet provider subscription (Newshosting, Eweka, Frugal Usenet, etc.)
- An NZB indexer account (NZBGeek, DrunkenSlug, etc.) or integration with [Prowlarr](/apps/prowlarr)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  sabnzbd:
    image: lscr.io/linuxserver/sabnzbd:4.4.1
    container_name: sabnzbd
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
    volumes:
      - ./config:/config
      - ./downloads:/downloads
      - ./incomplete:/incomplete-downloads
    ports:
      - "8080:8080"
    restart: unless-stopped
```

**Environment variables:**

| Variable | Purpose | Required |
|----------|---------|----------|
| `PUID` | User ID for file permissions | Yes |
| `PGID` | Group ID for file permissions | Yes |
| `TZ` | Timezone for scheduling | Yes |

**Volume mounts:**

| Container Path | Purpose |
|---------------|---------|
| `/config` | SABnzbd configuration and database |
| `/downloads` | Completed downloads |
| `/incomplete-downloads` | In-progress downloads |

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8080` in your browser
2. The setup wizard walks you through basic configuration
3. Enter your Usenet provider details: server address, port (563 for SSL), username, and password
4. Set the number of connections (check your provider's limit — typically 20-50)
5. Choose your download and incomplete folders (these map to the Docker volumes)

## Configuration

### Usenet Server Settings

Navigate to **Config → Servers** to add your Usenet provider:

- **Host:** Your provider's server address (e.g., `news.newshosting.com`)
- **Port:** 563 (SSL) or 119 (unencrypted — avoid)
- **SSL:** Always enable
- **Connections:** Set to your provider's maximum
- **Priority:** 0 for primary server, 1 for backup/fill servers

### Categories

Set up categories to organize downloads and integrate with the *arr stack:

- **Config → Categories**
- Create categories like `tv`, `movies`, `music` with specific download paths
- When Sonarr sends a download, it specifies the `tv` category automatically

### API Key

Found under **Config → General → Security**. You'll need this to connect Sonarr, Radarr, or other automation tools.

## Advanced Configuration (Optional)

### Integration with Sonarr and Radarr

SABnzbd works as the download client for the *arr stack:

1. In [Sonarr](/apps/sonarr): **Settings → Download Clients → Add → SABnzbd**
2. Enter SABnzbd's host (`sabnzbd` if on the same Docker network), port `8080`, and API key
3. Set category to `tv`
4. Repeat in [Radarr](/apps/radarr) with category `movies`

### Performance Tuning

- **Config → General → Tuning:** Increase article cache to 500 MB if you have RAM to spare
- Enable **Direct Unpack** for faster post-processing on fast connections
- Set **Par2 Multicore** to the number of CPU cores available

### Multiple Usenet Providers

Add backup servers with priority 1 or higher. SABnzbd automatically falls back to backup servers for missing articles — this dramatically improves completion rates.

## Reverse Proxy

Example Nginx Proxy Manager configuration:

- **Scheme:** http
- **Forward Hostname:** sabnzbd (or container IP)
- **Forward Port:** 8080

If using a reverse proxy, set `url_base` in SABnzbd's config or add to `host_whitelist` under **Config → General → Security**. [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

## Backup

Back up the `/config` volume — it contains your server settings, API keys, history, and queue:

```bash
docker compose stop sabnzbd
tar -czf sabnzbd-backup-$(date +%Y%m%d).tar.gz ./config
docker compose start sabnzbd
```

[Backup Strategy](/foundations/backup-3-2-1-rule)

## Troubleshooting

### Download Speed Is Slow

**Symptom:** Downloads crawl despite having a fast connection.
**Fix:** Increase connections to your provider's limit. Enable SSL on port 563. Check if your ISP throttles Usenet traffic — a VPN can help. Also check **Config → General → Tuning** and increase the article cache.

### "Server Requires Authentication" Error

**Symptom:** Connection fails with authentication errors.
**Fix:** Double-check username and password in **Config → Servers**. Some providers use a different username than your login email. Ensure SSL is enabled and the port matches (563 for SSL).

### Incomplete Downloads / Repair Failures

**Symptom:** Downloads fail with "not enough repair blocks."
**Fix:** This means your Usenet provider is missing articles. Add a second provider from a different backbone as a backup server (priority 1). Services like Eweka or Tweaknews complement US-based providers.

### Permission Denied on Downloads

**Symptom:** Files download but Sonarr/Radarr can't access them.
**Fix:** Ensure `PUID` and `PGID` match the user running Sonarr/Radarr. All *arr containers should use the same UID/GID. Check that the download directory has correct permissions: `chmod -R 775 ./downloads`.

### Web UI Not Accessible

**Symptom:** Can't reach the web interface after setup.
**Fix:** Check that port 8080 isn't used by another service. Verify the container is running with `docker compose logs sabnzbd`. If behind a reverse proxy, add your domain to `host_whitelist` in SABnzbd's config.

## Resource Requirements

- **RAM:** ~100 MB idle, 300-500 MB during active downloads with large article cache
- **CPU:** Low (mostly I/O bound). Spikes during par2 repair and unpacking
- **Disk:** Minimal for the application. Budget for download storage based on your usage

## Verdict

SABnzbd is the best Usenet downloader for self-hosting. It's mature, reliable, and integrates perfectly with Sonarr, Radarr, and the rest of the *arr stack. If you use Usenet for media automation, SABnzbd is the standard choice. The only real alternative is NZBGet, which is faster on low-powered hardware but is no longer actively developed. Stick with SABnzbd.

## FAQ

### SABnzbd vs NZBGet — which should I use?

SABnzbd. NZBGet entered maintenance-only mode in 2023. While NZBGet uses less RAM and is slightly faster on weak hardware, SABnzbd is actively developed and has better *arr integration.

### Do I need a VPN with SABnzbd?

Usenet downloads over SSL (port 563) are already encrypted end-to-end. A VPN adds minimal benefit unless your ISP actively throttles Usenet traffic. This is different from torrenting, where a VPN is strongly recommended.

### Can SABnzbd run on a Raspberry Pi?

Yes, but par2 repair and unpacking will be slow on a Pi's ARM CPU. Fine for light usage. For heavy downloading, use an x86 mini PC.

## Related

- [How to Self-Host Sonarr](/apps/sonarr)
- [How to Self-Host Radarr](/apps/radarr)
- [How to Self-Host Prowlarr](/apps/prowlarr)
- [How to Self-Host qBittorrent](/apps/qbittorrent)
- [Sonarr vs Radarr](/compare/sonarr-vs-radarr)
- [Best Self-Hosted Download Management](/best/download-management)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
