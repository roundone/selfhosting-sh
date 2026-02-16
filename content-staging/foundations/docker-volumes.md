---
title: "Docker Volumes and Persistent Data"
description: "Master Docker volumes, bind mounts, and data persistence — keep your self-hosted app data safe across container updates."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "docker", "volumes", "storage", "data"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are Docker Volumes?

Containers are ephemeral. Every time you run `docker compose down && docker compose up -d`, your containers are destroyed and recreated from scratch. Without volumes, everything inside them -- databases, config files, uploaded photos, media libraries -- vanishes.

Volumes solve this by mapping storage outside the container's filesystem. Your [Immich](/apps/immich) photo library, your [Jellyfin](/apps/jellyfin) media collection, your [Nextcloud](/apps/nextcloud) files -- all of it survives container rebuilds, image upgrades, and host reboots because the data lives on the host, not inside the container.

If you self-host anything you care about, understanding volumes is non-negotiable. Get this wrong and you lose data. Get it right and upgrades become a one-line operation.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([Docker Compose Basics](/foundations/docker-compose-basics))
- Basic terminal comfort ([Getting Started with Self-Hosting](/foundations/getting-started))
- Understanding of Linux file permissions ([Linux Permissions](/foundations/linux-permissions))

## Named Volumes vs Bind Mounts

Docker offers two primary approaches to persistent storage. Both work. One is better for self-hosting.

### Bind Mounts

A bind mount maps a directory on your host directly into the container. You choose the path. You can see the files with `ls`. You can back them up by copying the directory.

```yaml
services:
  app:
    image: example/app:1.2.0
    volumes:
      - /opt/appdata/myapp:/data
```

Here, `/opt/appdata/myapp` on your host maps to `/data` inside the container. Any file the container writes to `/data` appears in `/opt/appdata/myapp` and vice versa.

### Named Volumes

A named volume is managed by Docker. Docker decides where the data lives on disk (typically `/var/lib/docker/volumes/<name>/_data`). You reference it by name, not path.

```yaml
services:
  app:
    image: example/app:1.2.0
    volumes:
      - myapp_data:/data

volumes:
  myapp_data:
```

### Which to Use

**Use bind mounts for most self-hosting scenarios.** Here is why:

| Factor | Bind Mounts | Named Volumes |
|--------|------------|---------------|
| Backup | Copy the directory | Requires extra steps |
| Inspect files | `ls /opt/appdata/myapp` | `docker volume inspect` + navigate to internal path |
| Portability | Move the directory anywhere | Tied to Docker's internal storage |
| Permissions | You control them directly | Docker manages them |
| Performance | Native filesystem speed | Same on Linux, slower on macOS/Windows |
| Cleanup | Explicit -- you delete the directory | Can be orphaned by `docker compose down -v` |

Named volumes have one advantage: Docker handles initial directory creation and, in some cases, copies default files from the image into the volume on first run. This matters for databases where the container expects to initialize an empty data directory.

**The recommendation:** Use bind mounts for application data you want to access, back up, or migrate. Use named volumes for database storage where the container handles initialization. This is the pattern most self-hosted apps follow.

## Bind Mounts in Docker Compose

### Basic Syntax

```yaml
volumes:
  - /host/path:/container/path
```

The host path comes first, then a colon, then the container path. Always use absolute paths on the host side.

### Read-Only Mounts

Append `:ro` to prevent the container from writing:

```yaml
volumes:
  - /opt/appdata/myapp/config.yml:/app/config.yml:ro
```

Use this for config files you edit on the host and don't want the application to modify.

### Practical Example: Vaultwarden

```yaml
services:
  vaultwarden:
    image: vaultwarden/server:1.32.5
    restart: unless-stopped
    volumes:
      - /opt/appdata/vaultwarden:/data
    ports:
      - "8080:80"
    environment:
      - DOMAIN=https://vault.example.com
```

All of Vaultwarden's data -- the SQLite database, attachments, RSA keys -- lands in `/opt/appdata/vaultwarden`. Back it up by copying that directory. Upgrade by pulling a new image and restarting. Your passwords survive.

### Organizing Host Paths

Pick a convention and stick with it. A clean layout for a multi-app server:

```
/opt/appdata/
├── immich/
│   ├── upload/
│   ├── library/
│   └── postgres/
├── jellyfin/
│   ├── config/
│   └── cache/
├── nextcloud/
│   ├── html/
│   └── db/
├── vaultwarden/
└── pihole/
    └── etc-pihole/
```

Create directories before starting your containers:

```bash
mkdir -p /opt/appdata/immich/{upload,library,postgres}
```

## Named Volumes in Docker Compose

### When Named Volumes Make Sense

Databases are the primary use case. PostgreSQL, MariaDB, and Redis containers expect to initialize their data directories on first start. Named volumes let Docker handle this cleanly.

```yaml
services:
  db:
    image: postgres:16.2
    restart: unless-stopped
    volumes:
      - immich_db:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: immich
      POSTGRES_USER: immich
      POSTGRES_PASSWORD: change-this-strong-password

volumes:
  immich_db:
```

### Inspecting Named Volumes

Find where Docker stores a named volume:

```bash
docker volume inspect immich_db
```

Output:

```json
[
    {
        "CreatedAt": "2026-02-16T10:00:00Z",
        "Driver": "local",
        "Labels": {
            "com.docker.compose.project": "immich",
            "com.docker.compose.volume": "immich_db"
        },
        "Mountpoint": "/var/lib/docker/volumes/immich_immich_db/_data",
        "Name": "immich_immich_db",
        "Options": null,
        "Scope": "local"
    }
]
```

Note the `Mountpoint` -- that is where the files live on disk. You can browse them directly, but avoid modifying database files while the container is running.

### Listing and Cleaning Up Volumes

```bash
# List all volumes
docker volume ls

# Remove a specific volume (container must be stopped)
docker volume rm immich_immich_db

# Remove all unused volumes -- BE CAREFUL
docker volume prune
```

Never run `docker volume prune` without checking what it will delete. It removes every volume not currently attached to a running container. If your app is stopped, its data is fair game.

## File Permissions

Permissions are the number one source of Docker volume headaches. The container runs processes as a specific user (often `root`, sometimes `1000`, sometimes a custom UID). If that user cannot read or write the mounted directory, the app fails with `Permission denied`.

### The Problem

Your host user might be UID 1000. The container process might run as UID 911. When the container tries to write to your bind mount, Linux sees UID 911 trying to write to a directory owned by UID 1000 and blocks it.

### The Fix: Match UIDs

**Option 1: Set ownership to match the container's UID.**

Check what UID the container uses (look at the Dockerfile or docs), then:

```bash
# If the container runs as UID 911 (common for LinuxServer.io images)
sudo chown -R 911:911 /opt/appdata/myapp
```

**Option 2: Use PUID/PGID environment variables.**

[LinuxServer.io](https://linuxserver.io) images support `PUID` and `PGID` to remap the internal user to match your host user:

```yaml
services:
  app:
    image: lscr.io/linuxserver/jellyfin:10.9.11
    restart: unless-stopped
    environment:
      - PUID=1000
      - PGID=1000
    volumes:
      - /opt/appdata/jellyfin/config:/config
      - /mnt/media:/media:ro
```

This tells the container to run its process as UID/GID 1000 -- matching your host user. No permission conflicts.

**Option 3: Run the container as a specific user.**

For containers that do not support PUID/PGID:

```yaml
services:
  app:
    image: example/app:1.2.0
    user: "1000:1000"
    volumes:
      - /opt/appdata/myapp:/data
```

### Debugging Permission Issues

When you hit `Permission denied`:

```bash
# Check who owns the host directory
ls -la /opt/appdata/myapp/

# Check what user the container process runs as
docker exec myapp id

# Check from inside the container
docker exec myapp ls -la /data
```

If ownership doesn't match, fix it with `chown`. See [Linux Permissions](/foundations/linux-permissions) for a deeper dive on UIDs, GIDs, and the Linux permissions model.

## Backing Up Volume Data

Volumes without backups are a disaster waiting for a disk failure. The approach depends on the volume type.

### Backing Up Bind Mounts

Copy the directory. That is it.

```bash
# Stop the container first for consistency (especially databases)
docker compose stop

# Copy the data
sudo cp -a /opt/appdata/myapp /backups/myapp-$(date +%F)

# Restart
docker compose start
```

For non-database bind mounts (media files, uploads, configs), you can often copy while the container is running. For databases, always stop the container first or use the database's own dump tool:

```bash
# PostgreSQL dump without stopping the container
docker exec myapp-db pg_dumpall -U postgres > /backups/myapp-db-$(date +%F).sql
```

### Backing Up Named Volumes

Named volumes require an extra step since they live inside Docker's storage:

```bash
# Mount the volume into a temporary container and tar it
docker run --rm \
  -v immich_db:/source:ro \
  -v /backups:/backup \
  alpine tar czf /backup/immich-db-$(date +%F).tar.gz -C /source .
```

This spins up a minimal Alpine container, mounts the named volume as read-only, and creates a compressed archive in your backups directory.

### Automate It

Manual backups don't happen. Set up automated backups with a cron job or a tool like restic, borgmatic, or Kopia. See [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule) for a complete backup guide covering self-hosted backup solutions.

## Volume Drivers and Remote Storage

By default, Docker volumes use the `local` driver -- files live on the host's filesystem. For more advanced setups, you can mount remote storage directly as a Docker volume.

### NFS Mounts

Mount a NAS share as a Docker volume:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.9.11
    restart: unless-stopped
    volumes:
      - /opt/appdata/jellyfin/config:/config
      - media_nfs:/media:ro

volumes:
  media_nfs:
    driver: local
    driver_opts:
      type: nfs
      o: addr=192.168.1.50,nolock,soft,rw
      device: ":/volume1/media"
```

This mounts an NFS share from your Synology or TrueNAS at `192.168.1.50` directly into the Jellyfin container. Your media library lives on the NAS; Jellyfin reads it over the network.

### CIFS/SMB Mounts

For Windows shares or Samba:

```yaml
volumes:
  media_smb:
    driver: local
    driver_opts:
      type: cifs
      o: addr=192.168.1.50,username=user,password=pass,file_mode=0777,dir_mode=0777
      device: "//192.168.1.50/media"
```

### When to Use Remote Storage

- **Media libraries** that already live on a NAS -- no reason to duplicate them
- **Shared storage** across multiple Docker hosts
- **Large datasets** that exceed your server's local storage

Don't use NFS or CIFS for databases. The latency and locking behavior causes performance issues and data corruption risks. Keep database volumes local.

## Common Mistakes

**Anonymous volumes that vanish.** If you write a Compose file without explicit volume definitions and the image declares a `VOLUME` in its Dockerfile, Docker creates an anonymous volume with a random hash name. These are invisible, hard to back up, and deleted by `docker compose down -v`. Always declare your volumes explicitly.

**Running `docker compose down -v` by accident.** The `-v` flag deletes all named volumes associated with the project. This destroys your database. Use `docker compose down` (without `-v`) to stop and remove containers while keeping data intact.

**Mounting over existing container data.** If a container ships with files at `/app/data` and you mount an empty host directory there, the container sees an empty directory. Some apps handle this with initialization logic. Others break silently. Check the app's documentation for first-run behavior.

**Ignoring backup consistency.** Copying a PostgreSQL data directory while the database is running can produce a corrupt backup. Always stop the database container or use `pg_dump` / `pg_dumpall` for consistent database backups.

**Wrong host paths.** Typos in bind mount paths create empty directories silently. Docker will create the host directory if it does not exist -- but it creates it as root-owned and empty. If your app's data directory is suspiciously empty after startup, double-check your paths.

## Practical Patterns

Here is how popular self-hosted apps organize their volumes in real-world setups:

### Immich (Photo Management)

```yaml
services:
  immich-server:
    image: ghcr.io/immich-app/immich-server:v1.99.0
    restart: unless-stopped
    volumes:
      - /opt/appdata/immich/upload:/usr/src/app/upload  # User uploads
      - /mnt/photos/external:/usr/src/app/external:ro   # Existing photo library (read-only import)

  immich-database:
    image: tensorchord/pgvecto-rs:pg16-v0.2.1
    restart: unless-stopped
    volumes:
      - immich_pgdata:/var/lib/postgresql/data           # Database (named volume)

volumes:
  immich_pgdata:
```

Pattern: Bind mount for user-facing data (photos you want to access and back up). Named volume for the database (let PostgreSQL manage its internals).

### Jellyfin (Media Server)

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.9.11
    restart: unless-stopped
    volumes:
      - /opt/appdata/jellyfin/config:/config             # Jellyfin config + database
      - /opt/appdata/jellyfin/cache:/cache               # Transcoding cache (expendable)
      - /mnt/media/movies:/media/movies:ro               # Media library (read-only)
      - /mnt/media/tv:/media/tv:ro                       # Media library (read-only)
```

Pattern: Separate config from cache (cache is expendable and can be large). Mount media read-only since Jellyfin only needs to read it.

### Nextcloud (File Storage)

```yaml
services:
  nextcloud:
    image: nextcloud:29.0.0
    restart: unless-stopped
    volumes:
      - /opt/appdata/nextcloud/html:/var/www/html         # App files + user data

  nextcloud-db:
    image: mariadb:11.3.2
    restart: unless-stopped
    volumes:
      - /opt/appdata/nextcloud/db:/var/lib/mysql           # Database (bind mount for easy backup)
```

Pattern: Some people prefer bind mounts even for databases when they want simpler backups. This works, but you must stop the container (or use `mysqldump`) before copying.

## Next Steps

- Learn inter-container networking in [Docker Networking](/foundations/docker-networking)
- Set up automated backups with [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule)
- Understand file ownership issues in [Linux Permissions](/foundations/linux-permissions)
- Deploy your first self-hosted app: [Immich](/apps/immich), [Jellyfin](/apps/jellyfin), or [Nextcloud](/apps/nextcloud)

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Networking](/foundations/docker-networking)
- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule)
- [Linux Permissions](/foundations/linux-permissions)
- [Getting Started with Self-Hosting](/foundations/getting-started)
- [How to Self-Host Immich](/apps/immich)
- [How to Self-Host Jellyfin](/apps/jellyfin)
- [How to Self-Host Nextcloud](/apps/nextcloud)
