---
title: "How to Self-Host Obsidian Sync with CouchDB"
description: "Set up self-hosted Obsidian sync with CouchDB and the LiveSync plugin — sync your vault across devices without Obsidian's paid plan."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "note-taking"
apps:
  - obsidian-livesync
tags:
  - self-hosted
  - obsidian
  - docker
  - note-taking
  - sync
  - couchdb
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Self-Hosted Obsidian Sync?

[Obsidian](https://obsidian.md/) is a popular Markdown-based note-taking app with bidirectional links, a graph view, and a massive plugin ecosystem. Obsidian's official sync service costs $4/month (billed annually). The [Self-hosted LiveSync](https://github.com/vrtmrz/obsidian-livesync) community plugin provides a free alternative by syncing your vault through a self-hosted CouchDB instance.

LiveSync supports real-time synchronization across desktop and mobile Obsidian clients, end-to-end encryption, and conflict resolution. It's the most popular self-hosted sync solution for Obsidian.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of RAM minimum
- 5 GB of free disk space
- A domain name (required — LiveSync needs HTTPS for mobile clients)
- Obsidian installed on your devices

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  couchdb:
    image: couchdb:3.4
    ports:
      - "5984:5984"
    environment:
      COUCHDB_USER: ${COUCHDB_USER}
      COUCHDB_PASSWORD: ${COUCHDB_PASSWORD}
    volumes:
      - couchdb-data:/opt/couchdb/data
      - ./local.ini:/opt/couchdb/etc/local.d/local.ini
    restart: unless-stopped

volumes:
  couchdb-data:
```

Create a `local.ini` file alongside:

```ini
[couchdb]
single_node = true
max_document_size = 50000000

[chttpd]
require_valid_user = true
max_http_request_size = 4294967296
enable_cors = true

[chttpd_auth]
require_valid_user = true

[httpd]
WWW-Authenticate = Basic realm="couchdb"
bind_address = 0.0.0.0

[cors]
origins = app://obsidian.md, capacitor://localhost, http://localhost
credentials = true
headers = accept, authorization, content-type, origin, referer
methods = GET, PUT, POST, HEAD, DELETE
max_age = 3600
```

Create a `.env` file:

```bash
# CouchDB admin credentials — change both
COUCHDB_USER=admin
COUCHDB_PASSWORD=change_me_strong_password
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

### 1. Verify CouchDB Is Running

Navigate to `http://your-server-ip:5984/_utils/` to access CouchDB's Fauxton admin UI. Log in with your admin credentials.

### 2. Set Up the Database

The LiveSync plugin creates the database automatically. No manual database creation needed.

### 3. Install the LiveSync Plugin in Obsidian

1. Open Obsidian → Settings → Community Plugins → Browse
2. Search for "Self-hosted LiveSync"
3. Install and enable the plugin
4. Go to the plugin settings

### 4. Configure the LiveSync Plugin

In Obsidian's LiveSync plugin settings:

1. Click "Use CouchDB" as the remote type
2. Enter:
   - **CouchDB URL:** `https://couchdb.yourdomain.com` (your reverse proxy URL)
   - **Username:** Your CouchDB admin username
   - **Password:** Your CouchDB admin password
   - **Database name:** `obsidian-vault` (or any name — it's created automatically)
3. Click "Test" to verify the connection
4. Click "Check and Fix" to configure the database properly
5. Enable "LiveSync" mode for real-time sync, or choose "Periodic" for interval-based sync

### 5. Connect Additional Devices

On each additional device:
1. Install the LiveSync plugin
2. Use the "Setup URI" feature: on your first device, generate a setup URI (LiveSync settings → Copy setup URI). This encodes all connection details.
3. On the new device, paste the setup URI in the plugin settings
4. The vault syncs automatically

## Configuration

### Sync Modes

- **LiveSync:** Real-time sync — changes propagate immediately. Uses more bandwidth but notes are always current.
- **Periodic:** Syncs at set intervals (e.g., every 5 minutes). Lower bandwidth, slight delay.
- **On events:** Syncs on file open, file close, or app startup.

### End-to-End Encryption

LiveSync supports E2EE — enable it in the plugin settings. When enabled, all note content is encrypted before being sent to CouchDB. The server stores encrypted data and cannot read your notes.

### Conflict Resolution

When the same note is edited on two devices simultaneously, LiveSync detects the conflict and presents both versions for manual resolution. This is more reliable than silently overwriting changes.

## Advanced Configuration (Optional)

### Selective Sync

You can exclude specific folders or file patterns from sync using the plugin's filter settings. Useful for large binary files or local-only content.

### Database Maintenance

CouchDB databases grow over time with revision history. Compact periodically:

```bash
curl -X POST http://admin:password@localhost:5984/obsidian-vault/_compact \
  -H "Content-Type: application/json"
```

## Reverse Proxy

CouchDB must be accessible over HTTPS for mobile Obsidian clients. Set up a reverse proxy pointing to port 5984. Ensure CORS headers are properly forwarded.

For Nginx, add these headers:
```
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

For detailed setup: [Reverse Proxy Setup](/foundations/reverse-proxy-explained)

## Backup

- **CouchDB data volume:** `couchdb-data` — contains all synced notes and revision history
- **CouchDB config:** `local.ini` — your custom configuration
- **Environment file:** Your `.env` with credentials

Your Obsidian vault on each device is also a complete backup — every device has a full copy of all notes.

For a complete backup strategy: [Backup Strategy](/foundations/backup-3-2-1-rule)

## Troubleshooting

### Sync fails with "401 Unauthorized"

**Symptom:** Plugin shows authentication errors.
**Fix:** Verify CouchDB username and password are correct. Check that `require_valid_user = true` is set in `local.ini`. Restart CouchDB after config changes.

### CORS errors on mobile devices

**Symptom:** Desktop syncs fine but mobile fails with CORS errors.
**Fix:** Ensure the `[cors]` section in `local.ini` includes `capacitor://localhost` in origins. The `app://obsidian.md` origin is for desktop, `capacitor://localhost` is for mobile.

### Large files fail to sync

**Symptom:** Notes with large attachments fail to sync.
**Fix:** Check `max_document_size` in `local.ini` (default 50 MB in our config). Increase if needed. Also check that your reverse proxy allows large request bodies.

### Database grows very large

**Symptom:** CouchDB data directory becomes unexpectedly large.
**Fix:** CouchDB stores revision history. Run compaction: `curl -X POST http://admin:password@localhost:5984/obsidian-vault/_compact -H "Content-Type: application/json"`. Consider enabling auto-compaction in CouchDB settings.

## Resource Requirements

- **RAM:** ~100 MB idle, 200-400 MB during active sync
- **CPU:** Very low
- **Disk:** ~50 MB for CouchDB, plus your vault size (with revision history, expect 2-3x vault size)

## Verdict

Self-hosted Obsidian LiveSync is the best way to sync Obsidian vaults across devices without paying for Obsidian Sync. The setup is more involved than Obsidian's paid service, but once configured, it works reliably across desktop and mobile. E2EE support means your notes stay private.

The main caveat: this only works if you use Obsidian. If you're choosing a note-taking app from scratch and want built-in sync, [Joplin](/apps/joplin-server) or [Trilium](/apps/trilium) have server-based sync built into their architecture. But if you're already invested in Obsidian and want to self-host your sync, LiveSync + CouchDB is the way to go.

## Related

- [Best Self-Hosted Note Taking](/best/note-taking)
- [SiYuan vs Obsidian](/compare/siyuan-vs-obsidian)
- [How to Self-Host Trilium Notes](/apps/trilium)
- [How to Self-Host Joplin Server](/apps/joplin-server)
- [Replace Notion](/replace/notion)
- [Replace Evernote](/replace/evernote)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
