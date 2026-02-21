---
title: "How to Self-Host SilverBullet with Docker"
description: "Deploy SilverBullet with Docker Compose — a Markdown-based personal knowledge management system with wiki linking and Lua scripting."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "note-taking"
apps:
  - silverbullet
tags:
  - self-hosted
  - silverbullet
  - markdown
  - notes
  - docker
  - knowledge-base
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is SilverBullet?

[SilverBullet](https://silverbullet.md/) is a self-hosted, Markdown-based personal knowledge management platform that runs entirely in your browser. Your notes (called a "Space") are plain Markdown files stored on disk — no database, no proprietary format. SilverBullet adds wiki-style bidirectional linking, live Markdown preview, Lua scripting for dynamic content, queryable metadata (Objects), task management, and an extensible plug system. It replaces Obsidian (with sync), Notion for personal knowledge work, or any wiki where you want to own your files.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 500 MB of free disk space (plus storage for your notes)
- 256 MB of RAM (minimum)
- A domain name (recommended for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  silverbullet:
    image: ghcr.io/silverbulletmd/silverbullet:v2.4.1
    container_name: silverbullet
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./space:/space  # Your Markdown files live here
    environment:
      # Authentication — CHANGE THESE. Without SB_USER, the instance is open to anyone on the network.
      - SB_USER=admin:changeme
      # Optional: Override auto-detected UID/GID for file ownership
      # - PUID=1000
      # - PGID=1000
```

Create the space directory and start the stack:

```bash
mkdir -p ./space
docker compose up -d
```

Access SilverBullet at `http://your-server-ip:3000`. Log in with the credentials you set in `SB_USER`.

## Initial Setup

1. Open the web UI at `http://your-server-ip:3000`
2. Log in with your `SB_USER` credentials (username:password)
3. You'll see an empty Space — start typing to create your first page
4. Use `Ctrl+K` (or `Cmd+K`) to open the command palette
5. Create new pages by typing `[[Page Name]]` — the link is created automatically, and clicking it creates the page

SilverBullet stores everything as plain `.md` files in the `/space` volume. You can edit these files directly on disk, and changes sync to the browser automatically.

## Configuration

SilverBullet is configured primarily through environment variables and the Space itself:

| Variable | Description |
|----------|-------------|
| `SB_USER` | `username:password` for basic auth. **Required for security.** |
| `PUID` | Override the auto-detected user ID for file ownership |
| `PGID` | Override the auto-detected group ID for file ownership |

Advanced configuration happens through special pages in your Space:

- **`SETTINGS`** — a page named `SETTINGS` in your Space root configures editor behavior, default page, and plug settings
- **`PLUGS`** — install community plugs by listing them in a `PLUGS` page

## Key Features

### Wiki-Style Linking

Type `[[Page Name]]` to create bidirectional links. SilverBullet tracks all references, so you can see which pages link to the current one (backlinks). This is the core of the knowledge management experience.

### Objects and Queries

SilverBullet treats structured data in your notes (tasks, page metadata, tagged items) as queryable Objects. Use the built-in query language to create dynamic views:

```markdown
<!-- #query page where name =~ /docker/ -->
```

This renders a live list of all pages with "docker" in the name. Queries update automatically as your Space changes.

### Lua Scripting

Extend SilverBullet with Lua scripts that run in the browser. Create custom commands, automate workflows, transform content, or build entirely new features. Scripts live as code blocks in your notes.

### Live Preview

The editor renders Markdown inline — headings, bold, code blocks, and links display formatted while you type. No split-pane needed.

## Advanced Configuration (Optional)

### Multiple Users

SilverBullet supports multiple user credentials separated by commas:

```yaml
environment:
  - SB_USER=alice:password1,bob:password2
```

Each user shares the same Space. There's no per-user permissions — all users can read and write everything.

### Reverse Proxy with HTTPS

For production use, put SilverBullet behind a reverse proxy with HTTPS. WebSocket support is required for real-time sync:

**Nginx Proxy Manager:** Enable WebSocket support in the proxy host settings.

**Caddy:**

```
notes.example.com {
    reverse_proxy silverbullet:3000
}
```

See the [Reverse Proxy Setup guide](/foundations/reverse-proxy-explained/) for full configuration.

## Backup

Back up the `./space` directory — it contains all your Markdown files and configuration. Since everything is plain files, any backup tool works:

```bash
# Simple rsync backup
rsync -av ./space/ /backup/silverbullet/

# Or use your preferred backup tool
```

Because notes are plain Markdown files, they're inherently portable. You can open them in any Markdown editor (VS Code, Obsidian, Typora) as a fallback. See the [Backup Strategy guide](/foundations/backup-3-2-1-rule/) for comprehensive backup approaches.

## Troubleshooting

### Permission Denied Errors on /space

**Symptom:** Container logs show permission errors when reading or writing to `/space`.

**Fix:** The container auto-detects the owner of `/space` and runs as that UID/GID. If auto-detection fails, set `PUID` and `PGID` explicitly:

```yaml
environment:
  - PUID=1000
  - PGID=1000
```

Ensure the host directory is owned by the same user: `chown -R 1000:1000 ./space`

### Instance Accessible Without Login

**Symptom:** SilverBullet loads without asking for credentials.

**Fix:** `SB_USER` is not set. Add it to your environment variables. Without it, SilverBullet runs unauthenticated and anyone on your network can access and edit your notes.

### Changes Not Syncing Between Tabs

**Symptom:** Edits in one browser tab don't appear in another.

**Fix:** SilverBullet uses WebSockets for real-time sync. If you're behind a reverse proxy, ensure WebSocket passthrough is enabled. Check the browser console for WebSocket connection errors.

### Plugs Not Loading

**Symptom:** Community plugs listed in the `PLUGS` page don't appear.

**Fix:** After editing the `PLUGS` page, run the `Plugs: Update` command from the command palette (`Ctrl+K`). Plugs are fetched and installed on demand, not automatically.

## Resource Requirements

- **RAM:** ~100 MB idle, ~200 MB under active use
- **CPU:** Low — most rendering happens in the browser
- **Disk:** Minimal for the app; depends on your note volume (Markdown files are small)

## Verdict

SilverBullet is the best self-hosted option for people who want Obsidian-like features in a browser with zero vendor lock-in. Your notes are plain Markdown files on disk — no database, no proprietary format, no sync subscription. The wiki linking, Objects/Queries system, and Lua scripting make it powerful beyond simple note-taking. It's ideal for solo knowledge workers who want full control over their data. For team collaboration, look at [Outline](/apps/outline/) or [BookStack](/apps/bookstack/) instead — SilverBullet is designed for personal use.

## FAQ

### How does SilverBullet compare to Obsidian?

Both use Markdown files with wiki linking. SilverBullet runs in the browser (no app install), is fully open-source, and includes the server for free. Obsidian is a desktop app with optional paid sync ($8/month). SilverBullet's Lua scripting and Objects/Queries replace some of Obsidian's plugin ecosystem.

### Can I use my existing Markdown files?

Yes. Drop your `.md` files into the Space directory and they'll appear in SilverBullet. Wiki links (`[[Page Name]]`) work if your file names match.

### Is there a mobile app?

No native app, but the web UI is responsive and works on mobile browsers. You can add it to your home screen as a PWA for a near-native experience.

## Related

- [SiYuan vs Obsidian](/compare/siyuan-vs-obsidian/)
- [Trilium vs Joplin](/compare/trilium-vs-joplin/)
- [BookStack vs Wiki.js](/compare/bookstack-vs-wiki-js/)
- [Best Self-Hosted Note Taking Apps](/best/note-taking/)
- [Self-Hosted Notion Alternatives](/replace/notion/)
- [Self-Hosted Evernote Alternatives](/replace/evernote/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
