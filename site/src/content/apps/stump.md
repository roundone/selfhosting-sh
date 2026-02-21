---
title: "How to Self-Host Stump with Docker Compose"
description: "Step-by-step guide to self-hosting Stump with Docker Compose — a fast, Rust-based comic and ebook server with a modern web reader."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "media-servers"
apps: ["stump"]
tags: ["self-hosted", "stump", "docker", "comics", "manga", "ebooks"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Stump?

[Stump](https://stumpapp.dev/) is a self-hosted comic, manga, and ebook server written in Rust. It scans your library of CBZ, CBR, PDF, and EPUB files, organizes them into series, and provides a web-based reader. Stump is the lightweight, modern alternative to Komga — built for speed and low resource usage.

**Important:** Stump is pre-release software (v0.0.12). The developer explicitly states it's "not ready for normal usage yet." Use it for experimentation, not as your primary library server. For production use, consider [Komga](/apps/komga/) or [Kavita](/apps/kavita/) instead.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 512 MB of free RAM (minimum)
- Storage for your comic/ebook collection
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/stump && cd /opt/stump
```

Create a `docker-compose.yml` file:

```yaml
services:
  stump:
    image: aaronleopold/stump:0.0.12
    container_name: stump
    ports:
      # Web UI
      - "10801:10801"
    environment:
      # User/group for file permissions
      - PUID=1000
      - PGID=1000
      # Timezone
      - TZ=America/New_York
      # Override default port (optional)
      # - STUMP_PORT=10801
    volumes:
      # Application configuration and database
      - stump-config:/config
      # Your comic/ebook library (read-only recommended)
      - /path/to/comics:/data:ro
    restart: unless-stopped

volumes:
  stump-config:
```

Replace `/path/to/comics` with the actual path to your comic/ebook library.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:10801` in a browser
2. Create your admin account on the first-run setup screen
3. Add your library — click **Libraries** and point it to `/data`
4. Stump scans the directory and imports your files

Stump organizes files by directory structure. Each subdirectory becomes a series. Files at the root of a library become standalone items.

## Configuration

Stump stores its configuration in the `/config` volume. Key settings are managed through the web UI:

- **Libraries:** Add multiple library paths, each mapped as a volume mount
- **Users:** Create additional accounts with configurable access
- **Scanning:** Trigger manual rescans or configure scan behavior
- **Server settings:** Port, authentication, and general preferences

### File Organization

Stump expects this directory structure:

```
/data/
├── Marvel/
│   ├── Spider-Man (2022)/
│   │   ├── Spider-Man 001.cbz
│   │   ├── Spider-Man 002.cbz
│   │   └── Spider-Man 003.cbz
│   └── X-Men (2023)/
│       ├── X-Men 001.cbr
│       └── X-Men 002.cbr
└── Manga/
    └── One Piece/
        ├── Volume 01.cbz
        └── Volume 02.cbz
```

## Reverse Proxy

Stump works behind a reverse proxy. Example Nginx Proxy Manager configuration:

- **Scheme:** `http`
- **Forward Hostname:** `stump` (or your server IP)
- **Forward Port:** `10801`
- **WebSocket Support:** Enable it (recommended for real-time updates)

For other reverse proxy options, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

## Backup

Back up the config volume to preserve your database, user accounts, and library metadata:

```bash
docker compose stop stump
tar -czf stump-backup-$(date +%Y%m%d).tar.gz -C /var/lib/docker/volumes stump-config
docker compose start stump
```

Your actual comic/ebook files should be backed up separately as part of your general storage backup strategy. See [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Stump can't read my files

**Symptom:** Library scan completes but no books appear.
**Fix:** Check file permissions. The PUID/PGID user must have read access to the mounted library directory:
```bash
ls -la /path/to/comics
# Ensure the PUID user (1000) can read the files
```

### Web UI shows blank page

**Symptom:** Port 10801 responds but the page is blank.
**Fix:** Clear your browser cache. Stump's frontend assets may be cached from a previous version. Try an incognito/private window first to confirm.

### High memory usage during scan

**Symptom:** Stump uses excessive RAM when scanning a large library.
**Fix:** Stump processes files in batches. For very large libraries (10,000+ files), the initial scan will spike memory. This is temporary — memory usage drops after scanning completes.

### Container won't start

**Symptom:** Container exits immediately after starting.
**Fix:** Check logs: `docker logs stump`. Common causes: port conflict (another service on 10801), or the config volume has corrupted data. Try removing the config volume and starting fresh:
```bash
docker compose down -v
docker compose up -d
```

## Resource Requirements

- **RAM:** ~30-50 MB idle, ~80-150 MB during library scans
- **CPU:** Low (Rust binary is highly efficient)
- **Disk:** ~50 MB for application config, plus your library files
- **Architecture:** x86_64 and ARM64 supported

## Verdict

Stump is the fastest and lightest comic/ebook server available. Its Rust foundation makes it ideal for low-resource hardware like a Raspberry Pi. The modern React UI is clean and responsive.

However, it's pre-release software. Missing features include full OPDS support, advanced metadata scraping, and the mature ecosystem of reader apps that [Komga](/apps/komga/) offers. If you need production reliability today, use Komga. If you want to experiment with the future of self-hosted comic servers, Stump is worth trying.

## FAQ

### What file formats does Stump support?

CBZ, CBR, PDF, and EPUB. These cover the vast majority of comic, manga, and ebook formats.

### Does Stump have mobile apps?

Not yet. Stump's web reader works on mobile browsers, but there are no dedicated iOS or Android apps. For mobile reading with native apps, [Komga](/apps/komga/) has better support through Tachiyomi/Mihon and Panels.

### Can I migrate from Komga to Stump?

Not directly. Both scan the same file formats from the same directories, so you can point Stump at an existing Komga library folder. Read progress and metadata edits won't transfer.

### Is Stump still being developed?

Yes, but development is focused on the unstable branch. The v0.0.12 release (October 2025) is the latest stable. Check the [GitHub repo](https://github.com/stumpapp/stump) for activity.

## Related

- [Stump vs Komga](/compare/stump-vs-komga/)
- [How to Self-Host Komga](/apps/komga/)
- [How to Self-Host Kavita](/apps/kavita/)
- [Kavita vs Komga](/compare/kavita-vs-komga/)
- [Kavita vs Calibre-Web](/compare/kavita-vs-calibre-web/)
- [Best Self-Hosted Ebooks & Reading](/best/ebooks-reading/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
