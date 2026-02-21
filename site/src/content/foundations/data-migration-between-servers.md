---
title: "Migrate Self-Hosted Services Between Servers"
description: "Move Docker containers, volumes, and configs between servers with zero data loss. Complete migration guide for self-hosted setups."
date: "2026-02-17"
dateUpdated: "2026-02-17"
category: "foundations"
apps: []
tags: ["migration", "backup", "docker", "self-hosted", "server"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Server Migration?

Server migration means moving your self-hosted services — Docker containers, volumes, databases, configs, and reverse proxy settings — from one server to another. Common reasons: upgrading hardware, switching from a VPS to a home server (or vice versa), or moving to a more powerful machine.

Done right, migration results in zero data loss and minimal downtime. Done wrong, you lose your photo library, break your password manager, or corrupt your databases.

## Prerequisites

- SSH access to both old and new servers ([SSH Setup](/foundations/ssh-setup/))
- Docker and Docker Compose installed on the new server ([Docker Compose Basics](/foundations/docker-compose-basics/))
- Enough storage on the new server for all your data
- A basic understanding of Docker volumes ([Docker Volumes](/foundations/docker-volumes/))

## Migration Strategy Overview

| Step | What | Risk Level |
|------|------|-----------|
| 1 | Inventory everything on the old server | None |
| 2 | Set up Docker on the new server | None |
| 3 | Copy Docker Compose files | None |
| 4 | Stop services on old server | Downtime starts |
| 5 | Transfer volumes and data | Data loss if interrupted |
| 6 | Start services on new server | None |
| 7 | Verify everything works | None |
| 8 | Update DNS/reverse proxy | Downtime ends |

Total expected downtime: 10 minutes to several hours, depending on data volume and network speed between servers.

## Step 1: Inventory the Old Server

List everything running:

```bash
# List all running containers
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

# List all Docker Compose projects
docker compose ls

# List all volumes
docker volume ls

# Check total data size
du -sh /srv/*
du -sh /var/lib/docker/volumes/*
```

Document every service, its Compose file location, volume mount paths, and environment files. Create a migration checklist:

```
Service: nextcloud
Compose file: /srv/nextcloud/docker-compose.yml
Env file: /srv/nextcloud/.env
Volumes:
  - /srv/nextcloud/html → /var/www/html
  - /srv/nextcloud/data → /var/www/html/data
  - nextcloud-db → /var/lib/mysql
Data size: 45 GB
Database: MariaDB (included in compose)
```

## Step 2: Prepare the New Server

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Create the same directory structure
sudo mkdir -p /srv/nextcloud /srv/jellyfin /srv/vaultwarden
# (mirror your old server's structure)
```

Match the directory structure exactly. If your old server stores data in `/srv/`, use `/srv/` on the new one. This avoids editing every Compose file.

## Step 3: Copy Docker Compose Files

Transfer all Compose files and environment files:

```bash
# From the old server, use rsync
rsync -avz --progress /srv/*/docker-compose.yml /srv/*/.env \
  user@new-server:/srv/

# Or use scp for individual services
scp -r /srv/nextcloud/docker-compose.yml /srv/nextcloud/.env \
  user@new-server:/srv/nextcloud/
```

Verify the files arrived intact:

```bash
# On the new server
diff <(ssh user@old-server cat /srv/nextcloud/docker-compose.yml) \
     /srv/nextcloud/docker-compose.yml
```

## Step 4: Stop Services on Old Server

Stop containers to ensure data consistency. Running containers can write data during transfer, causing corruption — especially databases.

```bash
# Stop all containers gracefully
docker stop $(docker ps -q)

# Or stop specific compose projects
cd /srv/nextcloud && docker compose down
cd /srv/jellyfin && docker compose down
```

**Downtime starts now.** If you have a status page (like Uptime Kuma), update it before stopping services.

## Step 5: Transfer Data

### Option A: rsync (Recommended)

rsync is the best tool for server-to-server transfers. It handles large files, can resume interrupted transfers, and preserves permissions.

```bash
# Transfer bind-mounted data
rsync -avz --progress -e ssh /srv/ user@new-server:/srv/

# Transfer named Docker volumes
# First, find where they're stored
docker volume inspect nextcloud-db --format '{{.Mountpoint}}'
# /var/lib/docker/volumes/nextcloud-db/_data

rsync -avz --progress -e ssh \
  /var/lib/docker/volumes/ user@new-server:/var/lib/docker/volumes/
```

For large datasets (100+ GB), consider running rsync with `--compress` for WAN transfers or `--no-compress` for LAN transfers.

### Option B: tar + SSH (For Smaller Datasets)

```bash
# Pipe tar directly through SSH
cd /srv && tar czf - nextcloud/ | ssh user@new-server "cd /srv && tar xzf -"
```

### Option C: Physical Disk Move

If both servers are local and use the same filesystem, you can physically move the drive:

1. Stop containers on old server
2. Unmount the data drive
3. Install it in the new server
4. Mount at the same path

### Transferring Named Docker Volumes

Named volumes live in `/var/lib/docker/volumes/`. You have two options:

**Direct copy (if you have root SSH access):**

```bash
sudo rsync -avz --progress -e ssh \
  /var/lib/docker/volumes/myapp_data/ \
  root@new-server:/var/lib/docker/volumes/myapp_data/
```

**Export/import with tar:**

```bash
# On old server: export volume to tar
docker run --rm -v myapp_data:/data -v /tmp:/backup \
  alpine tar czf /backup/myapp_data.tar.gz -C /data .

# Transfer the tar
scp /tmp/myapp_data.tar.gz user@new-server:/tmp/

# On new server: create volume and import
docker volume create myapp_data
docker run --rm -v myapp_data:/data -v /tmp:/backup \
  alpine tar xzf /backup/myapp_data.tar.gz -C /data
```

## Step 6: Start Services on New Server

```bash
# Start services one at a time and verify each
cd /srv/nextcloud && docker compose up -d
docker compose logs -f  # Watch for errors

cd /srv/jellyfin && docker compose up -d
docker compose logs -f
```

Check each service's web UI before starting the next one. Fix any issues before proceeding.

### Common Post-Migration Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Permission denied | UID/GID mismatch | `chown -R 1000:1000 /srv/myapp` |
| Database connection refused | Container name changed | Check service names in Compose file |
| Bind mount empty | Path doesn't exist on new server | Create the directory, re-transfer data |
| Container can't pull image | Docker not logged into registry | `docker login ghcr.io` |

## Step 7: Verify Data Integrity

For each service:

```bash
# Check container health
docker ps  # All containers should show "Up" and "healthy"

# Check logs for errors
docker compose logs --tail=50

# Verify data exists
docker exec nextcloud ls /var/www/html/data/

# For databases, verify tables exist
docker exec nextcloud-db mysql -u root -p -e "SHOW DATABASES;"
```

Test the application through its web UI. Log in, verify your data is present, upload a test file, check that existing files are accessible.

## Step 8: Update DNS and Reverse Proxy

Once everything is verified on the new server:

```bash
# Update DNS records to point to new server's IP
# If using Cloudflare, update the A record
# Old: domain.com → old-server-ip
# New: domain.com → new-server-ip
```

If you're using [Cloudflare Tunnel](/foundations/cloudflare-tunnel/), install `cloudflared` on the new server and re-configure the tunnel.

If you're using a [reverse proxy](/foundations/reverse-proxy-explained/), set it up on the new server with the same configuration.

DNS propagation can take minutes to hours. Keep the old server running until you're confident all traffic is hitting the new server.

## Database-Specific Migration

### PostgreSQL

```bash
# On old server: dump all databases
docker exec postgres pg_dumpall -U postgres > /tmp/pg_backup.sql

# Transfer
scp /tmp/pg_backup.sql user@new-server:/tmp/

# On new server: start PostgreSQL first, then restore
cd /srv/postgres && docker compose up -d
docker exec -i postgres psql -U postgres < /tmp/pg_backup.sql
```

### MariaDB/MySQL

```bash
# On old server: dump all databases
docker exec mariadb mysqldump -u root --password=yourpass \
  --all-databases > /tmp/mysql_backup.sql

# Transfer and restore on new server
scp /tmp/mysql_backup.sql user@new-server:/tmp/
docker exec -i mariadb mysql -u root --password=yourpass < /tmp/mysql_backup.sql
```

### SQLite

SQLite databases are single files. Just copy them. Make sure the container is stopped first — copying a SQLite database while it's being written to can corrupt it.

## Common Mistakes

### Transferring Data While Containers Are Running

Databases are the biggest risk. A database being written to during a copy can result in a corrupted, unrecoverable backup. Always stop containers first.

### Forgetting .env Files

Docker Compose `.env` files contain passwords, API keys, and configuration. They're easy to miss because they're hidden files. Always include them in your transfer.

### Not Verifying Before Decommissioning

Keep the old server running for at least a week after migration. Users will find issues you didn't. Having the old server available as a fallback is worth the extra cost.

### Mismatched Docker Versions

If the new server runs a much newer or older Docker version, volume formats or Compose syntax might differ. Match Docker versions or test thoroughly before decommissioning the old server.

## Next Steps

- Set up automated backups on the new server with [Backup Strategy](/foundations/backup-3-2-1-rule/)
- Back up Docker volumes regularly using [Backup Docker Volumes](/foundations/backup-docker-volumes/)
- Consider [VPS vs Home Server](/foundations/vps-vs-home-server/) for your next migration
- Set up [Monitoring](/foundations/monitoring-basics/) on the new server to catch issues early

## FAQ

### How long does server migration take?

It depends on your data volume and network speed. 10 GB over a fast LAN takes minutes. 500 GB over the internet can take hours. Plan for the data transfer step to take the longest.

### Can I migrate without downtime?

Near-zero downtime is possible with a two-phase approach: rsync data while the old server is still running (first pass), stop services, rsync again (only changes transfer, which is fast), then switch DNS. Total downtime is just the final rsync + DNS propagation.

### Should I use Docker volumes or bind mounts on the new server?

Bind mounts (host paths like `/srv/myapp`) are easier to back up, inspect, and migrate. Named Docker volumes are cleaner in Compose files but harder to manage externally. For self-hosting, bind mounts are generally recommended.

### Can I migrate from x86 to ARM (or vice versa)?

Data transfers fine. But your Docker images need to support the target architecture. Check Docker Hub for multi-arch image support. Many popular self-hosted apps now publish multi-arch images. See [Docker Multi-Arch](/foundations/docker-multi-arch/).

### What about Tailscale/VPN connections?

Re-install Tailscale or WireGuard on the new server. Tailscale nodes get new IPs by default, so update any hardcoded references. You can request the same Tailscale IP through the admin console.

## Related

- [Backup Strategy](/foundations/backup-3-2-1-rule/)
- [Backup Docker Volumes](/foundations/backup-docker-volumes/)
- [Docker Volumes](/foundations/docker-volumes/)
- [VPS vs Home Server](/foundations/vps-vs-home-server/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [SSH Setup](/foundations/ssh-setup/)
- [Disaster Recovery](/foundations/disaster-recovery/)
