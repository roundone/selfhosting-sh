---
title: "How to Self-Host SiYuan with Docker Compose"
description: "Deploy SiYuan with Docker — a local-first note-taking app with block-level editing, bidirectional links, and graph view."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "note-taking"
apps:
  - siyuan
tags:
  - self-hosted
  - siyuan
  - docker
  - note-taking
  - knowledge-base
  - obsidian-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is SiYuan?

[SiYuan](https://b3log.org/siyuan/) is an open-source, local-first note-taking application with block-level editing, bidirectional links, a graph view, and end-to-end encrypted sync. Think of it as a self-hosted alternative to Obsidian with a WYSIWYG block editor instead of plain Markdown files. SiYuan stores notes in a custom JSON format with block-level granularity, enabling features like block references, block embedding, and database-style views.

Running SiYuan as a Docker container provides a web-accessible note-taking interface that you can access from any device with a browser, while keeping all data on your server.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of RAM minimum (2 GB recommended)
- 5 GB of free disk space
- A domain name (recommended for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  siyuan:
    image: b3log/siyuan:v3.5.7
    ports:
      - "6806:6806"
    volumes:
      - siyuan-data:/siyuan/workspace
    environment:
      TZ: UTC
    command: ["--workspace=/siyuan/workspace", "--accessAuthCode=${ACCESS_CODE}"]
    user: "1000:1000"
    restart: unless-stopped

volumes:
  siyuan-data:
```

Create a `.env` file alongside:

```bash
# Access code (password) for the web UI — change this to something strong
ACCESS_CODE=change_me_strong_password
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Navigate to `http://your-server-ip:6806`
2. Enter the access code you set in the `.env` file
3. SiYuan opens with a default workspace — you can start creating notebooks immediately
4. Click the "+" icon to create your first notebook
5. Start writing — SiYuan uses a block-based editor with `/` slash commands

## Configuration

### Access Authentication

SiYuan uses a simple access code (set via `--accessAuthCode`) rather than username/password authentication. Change it by updating the `ACCESS_CODE` in your `.env` file and restarting.

### Workspace Structure

SiYuan organizes content as:
- **Workspaces** — the top-level container (one per Docker instance)
- **Notebooks** — folders within the workspace
- **Documents** — pages within notebooks
- **Blocks** — individual content elements (paragraphs, headings, lists, code, etc.)

Data is stored as `.sy` JSON files in the workspace directory, with assets (images, files) in an `assets/` subdirectory.

### Block-Level Features

- **Block references:** Link to any individual block (paragraph, heading, list item) across all notebooks
- **Block embedding:** Embed content from one block into another document — updates propagate
- **Block attributes:** Add custom key-value metadata to any block for filtering and queries
- **Database views:** Create table/kanban views of blocks using SiYuan's query syntax

### Sync Options

SiYuan supports multiple sync methods:
- **SiYuan Cloud Sync** (paid feature — requires subscription, E2EE)
- **S3-compatible storage** (self-hosted — MinIO, Cloudflare R2, etc.)
- **WebDAV** (to Nextcloud or other WebDAV servers)

To configure S3 sync: Settings → Cloud → S3, then enter your endpoint, bucket, access key, and secret key.

## Advanced Configuration (Optional)

### Custom Port and Host Binding

```yaml
command: ["--workspace=/siyuan/workspace", "--accessAuthCode=${ACCESS_CODE}", "--port=6806", "--host=0.0.0.0"]
```

### Read-Only Mode

For sharing a public knowledge base:

```yaml
command: ["--workspace=/siyuan/workspace", "--accessAuthCode=${ACCESS_CODE}", "--readonly=true"]
```

### User Permissions

The `user: "1000:1000"` directive ensures files in the volume are owned by a regular user. Adjust the UID:GID to match your host user if needed:

```bash
# Check your user's UID/GID
id -u && id -g
```

## Reverse Proxy

Set up a reverse proxy to access SiYuan over HTTPS. Point your proxy to port 6806. SiYuan uses WebSocket connections, so ensure your proxy supports WebSocket passthrough.

For detailed setup: [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

## Backup

SiYuan stores everything in the workspace directory:

- **Workspace volume:** `siyuan-data` — contains all notebooks, documents, assets, and settings
- **Built-in snapshots:** SiYuan creates automatic data snapshots that you can browse and restore from within the app (Settings → Data → Snapshots)

Manual backup:

```bash
# Stop the container to ensure data consistency
docker compose stop siyuan
# Copy the workspace
docker cp $(docker compose ps -q siyuan):/siyuan/workspace ./siyuan-backup
# Restart
docker compose start siyuan
```

For a complete backup strategy: [Backup Strategy](/foundations/backup-3-2-1-rule)

## Troubleshooting

### "Access denied" after setting access code

**Symptom:** Can't log in despite entering the correct access code.
**Fix:** Access codes are case-sensitive. Clear your browser cookies for the SiYuan URL and try again. If you've lost the code, recreate the container with a new `ACCESS_CODE` value.

### Files in workspace owned by root

**Symptom:** Can't edit or delete files when accessing the volume from the host.
**Fix:** Set `user: "1000:1000"` in the Docker Compose file (adjust UID:GID to match your host user). Existing files may need ownership changed: `sudo chown -R 1000:1000 /path/to/siyuan-data`.

### WebSocket connection fails behind reverse proxy

**Symptom:** Editor shows "connection lost" or sync errors.
**Fix:** Configure your reverse proxy to forward WebSocket connections. For Nginx, add `proxy_set_header Upgrade $http_upgrade;` and `proxy_set_header Connection "upgrade";`.

### High memory usage with large workspaces

**Symptom:** Container uses significantly more memory than expected.
**Fix:** SiYuan loads block indexes into memory. Workspaces with 10,000+ blocks can use 500 MB+. This is expected. If memory is constrained, split content across multiple notebooks or archive old notebooks.

## Resource Requirements

- **RAM:** ~200 MB idle, 400-800 MB with large workspaces
- **CPU:** Low to moderate — spikes during search indexing and sync
- **Disk:** ~100 MB for the application, plus workspace data

## Verdict

SiYuan is the best self-hosted option if you want Obsidian-like features (bidirectional links, graph view, block references) with a WYSIWYG editor instead of plain Markdown. The block-level architecture enables powerful features like block embedding and database views that most note-taking apps can't match.

The trade-off is complexity — the learning curve is steeper than [BookStack](/apps/bookstack) or [Joplin](/apps/joplin-server), and the custom storage format means your notes aren't plain Markdown files. If you want simple Markdown notes with sync, use [Joplin](/apps/joplin-server). If you want a team wiki, use [BookStack](/apps/bookstack) or [Outline](/apps/outline). For a personal knowledge base with maximum power, SiYuan delivers.

## Related

- [Best Self-Hosted Note Taking](/best/note-taking)
- [SiYuan vs Obsidian](/compare/siyuan-vs-obsidian)
- [Joplin vs SiYuan](/compare/joplin-vs-siyuan)
- [Outline vs SiYuan](/compare/outline-vs-siyuan)
- [Trilium vs SiYuan](/compare/trilium-vs-siyuan)
- [BookStack vs SiYuan](/compare/bookstack-vs-siyuan)
- [How to Self-Host Trilium Notes](/apps/trilium)
- [How to Self-Host BookStack](/apps/bookstack)
- [How to Self-Host Outline](/apps/outline)
- [Replace Notion](/replace/notion)
- [Replace Evernote](/replace/evernote)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
