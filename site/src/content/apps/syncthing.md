---
title: "How to Self-Host Syncthing with Docker"
description: "Set up Syncthing with Docker Compose for peer-to-peer file sync across devices without a central server or cloud dependency."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "file-sync-storage"
apps:
  - syncthing
tags:
  - self-hosted
  - file-sync
  - syncthing
  - docker
  - dropbox-alternative
  - p2p
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Syncthing?

[Syncthing](https://syncthing.net) is a peer-to-peer file synchronization tool that keeps folders in sync across multiple devices without relying on a central server or cloud storage. Data goes directly between your devices, encrypted in transit and at rest. Syncthing replaces Dropbox, Google Drive, or OneDrive for users who want file sync without trusting a third party with their data. It is fully open source, works on Linux, macOS, Windows, Android, and FreeBSD, and has been battle-tested since 2013.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 256 MB of free RAM
- Storage for the files you want to sync
- At least one other device running Syncthing to sync with

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  syncthing:
    image: lscr.io/linuxserver/syncthing:v2.0.14-ls208
    container_name: syncthing
    hostname: my-syncthing-server
    restart: unless-stopped
    environment:
      PUID: "1000"       # Your user ID (run: id -u)
      PGID: "1000"       # Your group ID (run: id -g)
      TZ: "America/New_York"
    ports:
      - "8384:8384"       # Web UI
      - "22000:22000/tcp" # Sync protocol (TCP)
      - "22000:22000/udp" # Sync protocol (QUIC)
      - "21027:21027/udp" # Local discovery
    volumes:
      - syncthing-config:/config
      - /path/to/sync-folder:/data
    healthcheck:
      test: curl -fkLsS -m 2 127.0.0.1:8384/rest/noauth/health | grep -o --color=never OK || exit 1
      interval: 1m
      timeout: 10s
      retries: 3

volumes:
  syncthing-config:
```

**Replace** `/path/to/sync-folder` with the actual directory you want to sync. You can add multiple data volumes:

```yaml
volumes:
  - syncthing-config:/config
  - /home/user/documents:/data/documents
  - /home/user/photos:/data/photos
  - /mnt/nas/shared:/data/shared
```

Start the stack:

```bash
docker compose up -d
```

### Host Networking (Better for LAN Discovery)

If you sync primarily between devices on your local network, use host networking for better device discovery:

```yaml
services:
  syncthing:
    image: lscr.io/linuxserver/syncthing:v2.0.14-ls208
    container_name: syncthing
    hostname: my-syncthing-server
    network_mode: host
    restart: unless-stopped
    environment:
      PUID: "1000"
      PGID: "1000"
      TZ: "America/New_York"
    volumes:
      - syncthing-config:/config
      - /path/to/sync-folder:/data

volumes:
  syncthing-config:
```

With host networking, all ports are exposed automatically and local discovery broadcasts work correctly. The trade-off is reduced container isolation.

## Initial Setup

1. Open the web UI at `http://your-server-ip:8384`
2. **Set a password immediately.** Go to **Actions > Settings > GUI** and set a GUI Authentication User and Password. The web UI listens on all interfaces by default — without a password, anyone on your network can access it.
3. Add folders to sync:
   - Click **Add Folder**
   - Set the **Folder Path** to a path inside the container (e.g., `/data/documents`)
   - Give it a **Folder Label** and **Folder ID** (the ID must match across devices)
4. Add remote devices:
   - On this device, find your **Device ID** under **Actions > Show ID**
   - On the other device, go to **Add Remote Device** and paste this ID
   - The other device will show a notification asking to confirm the connection
   - Once connected, share folders between devices

## Configuration

### Folder Types

Syncthing supports three folder types:

- **Send & Receive** (default) — bidirectional sync. Changes on any device propagate everywhere.
- **Send Only** — this device sends changes but ignores changes from other devices. Use for a "master" copy.
- **Receive Only** — this device receives changes but doesn't send. Use for a backup destination.

### Ignore Patterns

Create a `.stignore` file in any synced folder to exclude files:

```
// Ignore OS junk
.DS_Store
Thumbs.db
desktop.ini

// Ignore temp files
*~
*.tmp
*.swp

// Ignore node_modules
node_modules

// Ignore by pattern
*.log
```

### Versioning

Syncthing can keep old versions of modified or deleted files:

- **Simple File Versioning** — keeps the last N versions
- **Staggered File Versioning** — keeps versions at decreasing intervals (daily, weekly, monthly)
- **Trash Can Versioning** — moves deleted files to `.stversions` folder
- **External Versioning** — calls a custom script

Configure versioning per folder under **Edit Folder > File Versioning**.

## Advanced Configuration (Optional)

### Untrusted Devices (Encrypted Folders)

Syncthing supports encrypting folder data for untrusted devices. The untrusted device stores encrypted blobs and cannot read your files. Useful for syncing through an untrusted VPS or cloud server.

Configure this when sharing a folder: set the device as "Untrusted" and provide an encryption password.

### Relay and Discovery Servers

By default, Syncthing uses public relay and discovery servers when direct connections fail. You can run your own:

- **Discovery server:** `syncthing/discosrv` Docker image
- **Relay server:** `syncthing/relaysrv` Docker image

This removes dependency on Syncthing's infrastructure and keeps all traffic private.

### NAT Traversal

Syncthing handles NAT traversal automatically using UPnP, NAT-PMP, and relay fallback. If you have a strict firewall, forward ports 22000/tcp, 22000/udp, and 21027/udp on your router.

## Reverse Proxy

For remote access to the web UI through [Nginx Proxy Manager](/apps/nginx-proxy-manager):

1. Add a proxy host for `syncthing.yourdomain.com`
2. Forward to `http://your-server-ip:8384`
3. Enable SSL

The sync protocol itself (port 22000) does not go through the reverse proxy — it connects directly between devices. Only the web UI uses the proxy.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for details.

## Backup

Syncthing is itself a sync/backup tool, but back up its configuration:

```bash
docker compose stop syncthing
docker run --rm -v syncthing-config:/config -v $(pwd):/backup alpine tar czf /backup/syncthing-config-backup.tar.gz /config
docker compose start syncthing
```

The `/config` volume contains device identity (keys and certificates), folder configuration, and the local database. Losing the device identity means other devices won't recognize this node. See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Devices not connecting

**Symptom:** Remote device shows "Disconnected" and never syncs

**Fix:** Check network connectivity:
1. Ensure port 22000/tcp and 22000/udp are forwarded on your router (for connections from outside your LAN)
2. If using Docker bridge networking, verify the port mappings are correct
3. Check that both devices are using the same Syncthing protocol version (v2.x requires both sides on v2.x)
4. Devices behind strict NAT may need relay connections — check **Actions > About** for connection type

### Sync is very slow

**Symptom:** Files take much longer than expected to sync

**Fix:** Check the connection type. If it says "Relay" instead of a direct address, the data is being routed through public relay servers. To fix:
1. Forward ports 22000/tcp and 22000/udp on both ends
2. Or use host networking mode for LAN sync
3. Check that the QUIC port (22000/udp) is also forwarded — QUIC is faster than TCP for most sync workloads

### Permission denied errors

**Symptom:** Files sync but with wrong permissions, or sync fails entirely

**Fix:** Ensure `PUID` and `PGID` match the owner of the host directories:
```bash
# Check your user ID
id -u
id -g

# Check file ownership
ls -la /path/to/sync-folder
```

### "Folder Marker Missing" error

**Symptom:** A folder shows an error about a missing `.stfolder` marker

**Fix:** Syncthing creates a `.stfolder` file in each synced directory. If it's been deleted:
```bash
touch /path/to/sync-folder/.stfolder
```

Do not delete `.stfolder` files — Syncthing uses them to verify folders are accessible and mounted.

### Two devices with the same Device ID

**Symptom:** Sync conflicts or devices not recognized

**Fix:** This happens when the Syncthing config directory was copied between devices. Each device must have a unique identity. Delete the config on one device and let it regenerate:
```bash
docker compose stop syncthing
docker volume rm syncthing-config
docker compose up -d
# Re-add devices and folders
```

## Resource Requirements

- **RAM:** ~50 MB idle, scales with number of files being indexed
- **CPU:** Low during steady state. Spikes during initial scan (hashing all files with SHA-256) and during large sync operations.
- **Disk:** ~10 MB for the application, plus a database proportional to the number of synced files (typically 1-5% of total data size)

## Frequently Asked Questions

### Is Syncthing free?

Yes. Syncthing is fully open source under the MPL-2.0 license. No paid tiers, no limits.

### How does Syncthing compare to Nextcloud?

Syncthing is peer-to-peer file sync only — no web UI for browsing files, no apps ecosystem, no calendar or contacts. [Nextcloud](/apps/nextcloud) is a full cloud platform with file sync, office documents, and dozens of apps. Use Syncthing if you only need file sync between known devices. Use Nextcloud if you want a Dropbox/Google Drive replacement with a web interface.

### Can Syncthing run on a Raspberry Pi?

Yes. Syncthing runs well on a Raspberry Pi 4. The main limitation is disk I/O speed — use an SSD or fast USB drive for the synced data, not an SD card.

### Does Syncthing work without a server?

Yes. Syncthing is peer-to-peer — no central server is required. Each device connects directly to the others. Running Syncthing in Docker on a VPS is optional but useful as an always-on sync node.

## Verdict

Syncthing is the best self-hosted file sync tool for users who want simplicity, privacy, and no central server. It does one thing — sync files between devices — and does it extremely well. The peer-to-peer architecture means there's no single point of failure and no cloud dependency. For users who want a full file management platform with web access, sharing links, and office integration, [Nextcloud](/apps/nextcloud) or [Seafile](/apps/seafile) are better choices.

## Related

- [How to Self-Host Nextcloud](/apps/nextcloud)
- [Best Self-Hosted File Sync & Storage](/best/file-sync-storage)
- [Syncthing vs Nextcloud](/compare/syncthing-vs-nextcloud)
- [Replace Dropbox](/replace/dropbox)
- [Replace Google Drive](/replace/google-drive)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [Docker Networking](/foundations/docker-networking)
