---
title: "How to Self-Host Trilium Notes with Docker"
description: "Deploy TriliumNext Notes with Docker Compose — a hierarchical note-taking app with relation maps, cloning, and end-to-end encryption."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "note-taking"
apps:
  - trilium
tags:
  - self-hosted
  - trilium
  - docker
  - note-taking
  - knowledge-base
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Trilium Notes?

[TriliumNext Notes](https://github.com/TriliumNext/Notes) is an open-source hierarchical note-taking application designed for building personal knowledge bases. It supports rich text editing, Markdown, code notes with syntax highlighting, relation maps between notes, note cloning (same note in multiple places), and powerful search. Notes are stored in a SQLite database with optional sync to a self-hosted server.

TriliumNext is the community fork of the original Trilium Notes project (which is no longer maintained). The fork is actively developed and maintains full compatibility with existing Trilium databases.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 512 MB of RAM minimum (1 GB recommended)
- 2 GB of free disk space
- A domain name (recommended for remote sync)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  trilium:
    image: triliumnext/notes:v0.95.0
    ports:
      - "8080:8080"
    volumes:
      - trilium-data:/home/node/trilium-data
    environment:
      TRILIUM_DATA_DIR: /home/node/trilium-data
    restart: unless-stopped

volumes:
  trilium-data:
```

Start the stack:

```bash
docker compose up -d
```

Trilium is a self-contained application — no external database or Redis required. Everything is stored in a SQLite database inside the data directory.

## Initial Setup

1. Navigate to `http://your-server-ip:8080`
2. On first access, you'll be prompted to set a password — this encrypts your note database
3. Choose a strong password — this is the only authentication mechanism and also serves as the encryption key
4. After setting the password, you'll see the note tree with some default demo notes
5. Delete the demo notes and start creating your own structure

## Configuration

### Sync Setup

Trilium's main use case as a self-hosted server is syncing with desktop clients. The architecture:

- **Server instance** (Docker): Runs 24/7, holds the authoritative database
- **Desktop client** (Windows/macOS/Linux): Syncs bidirectionally with the server

To set up sync:
1. Install the [TriliumNext desktop app](https://github.com/TriliumNext/Notes/releases) on your computer
2. On first launch, choose "I have a server instance already"
3. Enter the server URL (`https://trilium.yourdomain.com`) and your password
4. Sync completes automatically — changes propagate in both directions

### Protected Notes

Trilium supports "protected" notes that are encrypted at rest. These require re-entering the password to view. Use for sensitive information like credentials, private journal entries, or confidential documents.

### Note Types

- **Text notes:** Rich text with formatting, images, tables
- **Code notes:** Syntax-highlighted code in 30+ languages
- **Relation maps:** Visual diagrams showing connections between notes
- **Book notes:** Render child notes as a book/document
- **Render notes:** Custom HTML rendering via scripting
- **Canvas notes:** Drawing canvas (Excalidraw-based)
- **File notes:** Attach files directly to the note tree

### Scripting

Trilium has a built-in scripting engine (JavaScript). You can create custom widgets, automate note organization, build dashboards, and extend functionality. Scripts run both on the server and in the desktop client.

## Advanced Configuration (Optional)

### Environment Variables

```yaml
environment:
  TRILIUM_DATA_DIR: /home/node/trilium-data  # Data directory path
  TRILIUM_PORT: 8080                          # Server port
  # TRILIUM_NOAUTH: true                      # Disable authentication (NOT recommended)
```

### Running with a Custom Data Path

Map the data volume to a specific host path for easier backup access:

```yaml
volumes:
  - /opt/trilium-data:/home/node/trilium-data
```

## Reverse Proxy

Set up a reverse proxy to access Trilium over HTTPS. Point your proxy to port 8080. Trilium uses WebSocket connections for sync, so ensure your proxy supports WebSocket passthrough:

For Nginx, add:
```
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

For detailed setup: [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

## Backup

The entire Trilium database is a single SQLite file in the data directory:

- **Database:** `trilium-data/document.db` — this is everything (notes, attachments, history)
- **Backup built-in:** Trilium creates automatic daily backups in `trilium-data/backup/`

To create a manual backup:

```bash
docker compose exec trilium cp /home/node/trilium-data/document.db /home/node/trilium-data/backup/manual-backup.db
```

Or copy from the host volume. Since it's SQLite, you can also use Trilium's built-in export (Menu → Export) for portable formats.

For a complete backup strategy: [Backup Strategy](/foundations/backup-3-2-1-rule/)

## Troubleshooting

### Sync fails with "401 Unauthorized"

**Symptom:** Desktop client can't sync with the server.
**Fix:** Verify the password matches on both client and server. If you changed the server password, you need to reconfigure the desktop client sync settings. Check that the URL includes the protocol (`https://`).

### "Database is encrypted" error on startup

**Symptom:** Trilium won't start, logs show database encryption error.
**Fix:** The database file may be corrupted. Restore from the automatic backup in `trilium-data/backup/`. Copy the most recent backup to `document.db`.

### High memory usage with large databases

**Symptom:** Trilium consumes more memory than expected.
**Fix:** Trilium loads note metadata into memory. Large databases (10,000+ notes with attachments) can use 500 MB+. This is expected behavior. Increase container memory limits if needed.

### WebSocket connection fails behind reverse proxy

**Symptom:** Sync works initially but disconnects, or the web UI shows connection errors.
**Fix:** Ensure your reverse proxy is configured for WebSocket passthrough. For Nginx Proxy Manager, WebSocket support is enabled by default. For custom Nginx configs, add the `Upgrade` and `Connection` headers.

## Resource Requirements

- **RAM:** ~100 MB idle, 200-500 MB with large databases
- **CPU:** Very low — SQLite is lightweight
- **Disk:** ~50 MB for the application, plus your note database size

## Verdict

TriliumNext Notes is the best self-hosted option for personal knowledge management with a hierarchical structure. The note cloning feature (same note appearing in multiple places without duplication), relation maps, and built-in scripting make it uniquely powerful for building interconnected knowledge bases.

The UI is functional but not as polished as [Outline](/apps/outline/) or commercial apps like Notion. It's designed for power users who want deep organizational features over visual beauty. If you want something simpler for team documentation, use [BookStack](/apps/bookstack/). If you want a more modern UI for team wikis, use [Outline](/apps/outline/). For personal knowledge management with maximum depth, Trilium is unmatched.

## Related

- [Best Self-Hosted Note Taking](/best/note-taking/)
- [Trilium vs Joplin](/compare/trilium-vs-joplin/)
- [Trilium vs SiYuan](/compare/trilium-vs-siyuan/)
- [Memos vs Trilium](/compare/memos-vs-trilium/)
- [How to Self-Host BookStack](/apps/bookstack/)
- [How to Self-Host Outline](/apps/outline/)
- [Replace Notion](/replace/notion/)
- [Replace Evernote](/replace/evernote/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
