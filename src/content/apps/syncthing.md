---
title: "How to Self-Host Syncthing with Docker Compose"
type: "app-guide"
app: "syncthing"
category: "file-sync"
replaces: "Dropbox"
difficulty: "beginner"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up Syncthing for peer-to-peer file sync between devices — no server required, fully encrypted."
officialUrl: "https://syncthing.net"
githubUrl: "https://github.com/syncthing/syncthing"
defaultPort: 8384
minRam: "128MB"
---

## What is Syncthing?

Syncthing is a continuous file synchronization tool that syncs files directly between your devices — no cloud server involved. It's like Dropbox without the cloud. Files are encrypted in transit, never touch a third-party server, and sync happens automatically whenever devices are online together. It's one of the simplest and most reliable self-hosted tools available.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- At least two devices you want to sync between

## Docker Compose Configuration

```yaml
# docker-compose.yml for Syncthing
# Tested with Syncthing 1.27+

services:
  syncthing:
    container_name: syncthing
    image: syncthing/syncthing:latest
    ports:
      - "8384:8384"     # Web UI
      - "22000:22000/tcp" # File transfer
      - "22000:22000/udp" # QUIC file transfer
      - "21027:21027/udp" # Discovery
    volumes:
      - ./config:/var/syncthing/config
      - /path/to/sync/folder:/var/syncthing/data
    environment:
      - PUID=1000
      - PGID=1000
    restart: unless-stopped
```

## Step-by-Step Setup

1. **Create a directory:**
   ```bash
   mkdir ~/syncthing && cd ~/syncthing
   ```

2. **Create the `docker-compose.yml`** — update `/path/to/sync/folder` to the directory you want to sync.

3. **Start the container:**
   ```bash
   docker compose up -d
   ```

4. **Access the web UI** at `http://your-server-ip:8384`

5. **Install Syncthing on your other device** — download from [syncthing.net](https://syncthing.net/downloads/) or install via Docker there too.

6. **Add devices:** In the web UI, click "Add Remote Device" and enter the Device ID from your other Syncthing instance (shown under Actions → Show ID).

7. **Share a folder:** Click "Add Folder," set the path, and select which devices to share it with.

8. **Accept on the other device** — the other instance will show a notification to accept the folder share.

## Configuration Tips

- **File versioning:** Enable "Staggered File Versioning" on shared folders to keep old versions of changed files. Saved me many times.
- **Ignore patterns:** Create a `.stignore` file in any shared folder to exclude files (like `node_modules`, `.DS_Store`, temp files).
- **Selective sync:** You can choose different folders to sync with different devices. Your phone doesn't need your entire file collection.
- **Android app:** Syncthing has an excellent Android app that can auto-sync camera photos to your server.
- **Relay servers:** If two devices can't connect directly, Syncthing uses encrypted relay servers. This is automatic but adds latency.

## Backup & Migration

- **Backup:** The `config` folder contains your device keys and sync configuration. Back it up — if you lose your keys, you'll need to re-pair all devices.
- **Migration:** Copy the `config` folder to a new installation. Update folder paths if they've changed.

## Troubleshooting

- **Devices not connecting:** Ensure port 22000 isn't blocked by firewalls. Syncthing will fall back to relay servers if direct connections fail, but it's slower.
- **Sync conflicts:** Syncthing creates conflict files (`.sync-conflict-*`) when both sides change the same file. Review and resolve manually.
- **Slow sync:** Initial sync of large directories takes time. Subsequent syncs are fast (only changed blocks are transferred).

## Alternatives

[Nextcloud](/apps/nextcloud/) provides file sync plus a full cloud platform (calendar, contacts, apps). [Seafile](/apps/seafile/) is another server-based option optimized for fast sync. See our [Nextcloud vs Syncthing comparison](/compare/nextcloud-vs-syncthing/) or the full [Best Self-Hosted File Sync](/best/file-sync/) roundup.

## Verdict

Syncthing is the gold standard for peer-to-peer file sync. No server, no accounts, no cloud — just direct, encrypted sync between your devices. If you only need to keep files in sync (no web access, no sharing links), Syncthing is simpler and more reliable than any server-based solution.
