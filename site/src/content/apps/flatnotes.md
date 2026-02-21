---
title: "How to Self-Host Flatnotes with Docker Compose"
description: "Deploy Flatnotes with Docker Compose — a simple, flat-file Markdown note-taking app with full-text search and tagging."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "note-taking"
apps:
  - flatnotes
tags:
  - self-hosted
  - flatnotes
  - markdown
  - notes
  - docker
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Flatnotes?

[Flatnotes](https://github.com/dullage/flatnotes) is a simple, self-hosted Markdown note-taking app. Notes are stored as plain `.md` files on disk — no database required. It has a clean web interface with WYSIWYG and raw Markdown editing, full-text search (powered by Whoosh), tagging, wikilinks for cross-note linking, and light/dark themes. Flatnotes is for people who want the simplest possible self-hosted note app without the complexity of Trilium, Outline, or BookStack.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 100 MB of free disk space (plus storage for notes)
- 128 MB of RAM (minimum)
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  flatnotes:
    image: dullage/flatnotes:v5.5.4
    container_name: flatnotes
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - flatnotes-data:/data  # Markdown files and search index
    environment:
      # Authentication — choose one: "none", "read_only", "password", or "totp"
      FLATNOTES_AUTH_TYPE: "password"
      # Required when auth type is "password" — CHANGE THESE
      FLATNOTES_USERNAME: "admin"
      FLATNOTES_PASSWORD: "changeme"
      # Required — used for session signing. Generate with: openssl rand -hex 32
      FLATNOTES_SECRET_KEY: "change-this-to-a-random-string"
      # Optional: file ownership
      PUID: "1000"
      PGID: "1000"

volumes:
  flatnotes-data:
```

Start the stack:

```bash
docker compose up -d
```

Access Flatnotes at `http://your-server-ip:8080`.

## Initial Setup

1. Open `http://your-server-ip:8080` in your browser
2. Log in with the username and password from your environment variables
3. Click the `+` button or press `/` to create a new note
4. Notes auto-save as you type
5. Use `#tags` in your notes to organize them — tags are extracted automatically

No database setup, no wizard, no additional configuration. It's ready to use immediately.

## Configuration

All configuration is via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `FLATNOTES_AUTH_TYPE` | `password` | Auth mode: `none`, `read_only`, `password`, `totp` |
| `FLATNOTES_USERNAME` | — | Login username (required for `password` auth) |
| `FLATNOTES_PASSWORD` | — | Login password (required for `password` auth) |
| `FLATNOTES_SECRET_KEY` | — | **Required.** Session signing key |
| `PUID` | `1000` | User ID for file ownership |
| `PGID` | `1000` | Group ID for file ownership |

### Authentication Modes

- **`none`** — No login required. Anyone with network access can read and write notes.
- **`read_only`** — Anyone can read, but editing requires login.
- **`password`** — Username/password required for all access.
- **`totp`** — Time-based one-time password (2FA). Adds TOTP on top of password auth.

For any deployment accessible from the internet, use `password` or `totp`.

## Advanced Configuration (Optional)

### TOTP Two-Factor Authentication

Set `FLATNOTES_AUTH_TYPE` to `totp`:

```yaml
environment:
  FLATNOTES_AUTH_TYPE: "totp"
  FLATNOTES_USERNAME: "admin"
  FLATNOTES_PASSWORD: "changeme"
  FLATNOTES_SECRET_KEY: "change-this-to-a-random-string"
  FLATNOTES_TOTP_KEY: "your-base32-totp-secret"
```

Generate a TOTP secret and add it to your authenticator app (Google Authenticator, Aegis, etc.).

### Wikilinks

Link between notes using `[[Note Title]]` syntax. Flatnotes resolves these as clickable links in the WYSIWYG editor. This is useful for building a personal knowledge base with interconnected notes.

## Reverse Proxy

Flatnotes runs on port 8080 and works behind any reverse proxy without special configuration.

**Caddy:**

```
notes.example.com {
    reverse_proxy flatnotes:8080
}
```

See the [Reverse Proxy Setup guide](/foundations/reverse-proxy-explained/) for Nginx Proxy Manager and Traefik configs.

## Backup

Back up the `/data` volume. It contains your Markdown files and the Whoosh search index:

```bash
# If using named volume
docker run --rm -v flatnotes-data:/data -v $(pwd):/backup alpine tar czf /backup/flatnotes-backup.tar.gz /data

# If using bind mount
tar czf flatnotes-backup.tar.gz ./data
```

Since notes are plain Markdown files, you can also back up or sync the files directly. The search index rebuilds automatically if deleted. See the [Backup Strategy guide](/foundations/backup-3-2-1-rule/) for more options.

## Troubleshooting

### Search Returns No Results

**Symptom:** Full-text search doesn't find text that exists in notes.

**Fix:** The Whoosh search index may be corrupted or out of date. Delete the `.flatnotes` directory inside `/data` and restart the container. The index rebuilds on startup.

### Notes Not Saving

**Symptom:** Changes aren't persisted after container restart.

**Fix:** Verify the `/data` volume is mounted correctly. Check container logs for permission errors: `docker logs flatnotes`. If permission errors appear, ensure `PUID` and `PGID` match the ownership of the data directory.

### TOTP Code Rejected

**Symptom:** TOTP codes from your authenticator app are rejected.

**Fix:** TOTP is time-sensitive. Ensure the server clock is synchronized (NTP). A difference of more than 30 seconds between server and phone will cause rejections.

## Resource Requirements

- **RAM:** ~80 MB idle, ~120 MB under active use
- **CPU:** Minimal — Python/Flask backend with lightweight indexing
- **Disk:** ~50 MB for the app; depends on note volume (Markdown files are tiny)

## Verdict

Flatnotes is the best choice when you want the absolute simplest self-hosted note app. No database, no complex setup, no learning curve — just Markdown files in a folder with a web UI on top. It's not trying to be Notion or a team wiki. It's a personal notepad that respects your data by storing everything as plain files. If you need collaboration, hierarchy, or advanced features, look at [Outline](/apps/outline/), [Trilium](/apps/trilium/), or [BookStack](/apps/bookstack/). If you want minimal and functional, Flatnotes nails it.

## FAQ

### Can I access my notes outside of Flatnotes?

Yes. Notes are plain `.md` files in the data directory. Open them with any text editor, VS Code, Obsidian, or sync them with Syncthing. Flatnotes does not lock you in.

### Does Flatnotes support multiple users?

No. Flatnotes has a single set of credentials. All notes are shared. For multi-user note-taking, use [Memos](/apps/memos/) or [Outline](/apps/outline/).

### How does Flatnotes compare to Memos?

[Memos](/apps/memos/) is a microblog-style feed for quick capture. Flatnotes is a traditional note app with titled documents. Use Memos for quick thoughts and Flatnotes for structured notes.

## Related

- [How to Self-Host Memos](/apps/memos/)
- [How to Self-Host Trilium Notes](/apps/trilium/)
- [Memos vs Trilium](/compare/memos-vs-trilium/)
- [SiYuan vs Obsidian](/compare/siyuan-vs-obsidian/)
- [Best Self-Hosted Note Taking Apps](/best/note-taking/)
- [Self-Hosted Evernote Alternatives](/replace/evernote/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
