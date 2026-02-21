---
title: "Updating Docker Containers Safely"
description: "How to update self-hosted Docker containers without losing data — manual updates, Watchtower automation, rollback strategies, and best practices."
date: 2026-02-16
dateUpdated: 2026-02-21
category: "foundations"
apps: []
tags: ["docker", "updates", "maintenance", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Update Docker Containers?

Docker containers freeze software at a specific version. This is great for stability but means you're responsible for applying updates. Updates bring security patches, bug fixes, and new features. Running outdated containers exposes you to known vulnerabilities.

**The update dilemma:** update too eagerly and you risk breaking things. Update too rarely and you risk security issues. The approach in this guide balances both.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose Basics](/foundations/docker-compose-basics/))
- Understanding of Docker volumes ([Docker Volumes](/foundations/docker-volumes/))
- Working backups ([3-2-1 Backup Rule](/foundations/backup-3-2-1-rule/))

## Manual Update Process

The safest and most controlled approach. Recommended for critical services.

### Step 1: Check for Updates

```bash
# See current image versions
docker compose ps
docker compose images

# Check the app's GitHub releases or Docker Hub for the latest version
# Example: check Nextcloud releases
# https://github.com/nextcloud/server/releases
```

### Step 2: Back Up Before Updating

Always back up before updating. The update might fail, corrupt data, or introduce breaking changes.

```bash
# Back up the database
docker exec postgres pg_dumpall -U postgres > backup-pre-update.sql

# Back up the data directory
tar czf backup-pre-update.tar.gz /opt/myapp/data/

# Or use your regular backup tool
restic backup /opt/myapp/
```

### Step 3: Update the Image Tag

Edit your `docker-compose.yml` to specify the new version:

```yaml
services:
  nextcloud:
    # Old version
    # image: nextcloud:28.0
    # New version
    image: nextcloud:29.0
    restart: unless-stopped
```

### Step 4: Pull and Recreate

```bash
# Pull the new image
docker compose pull

# Recreate the container with the new image
docker compose up -d

# Check logs for errors
docker compose logs -f --tail=50
```

`docker compose up -d` automatically detects the image change and recreates only the affected container. Your volumes (data) remain intact.

### Step 5: Verify

```bash
# Check the container is running
docker compose ps

# Check the version in the app's web UI or API
# Check logs for migration/upgrade messages
docker compose logs --tail=100 nextcloud
```

## Rollback If Something Breaks

If an update causes problems, roll back immediately:

```bash
# Stop the broken container
docker compose down

# Revert the image tag in docker-compose.yml
# image: nextcloud:29.0  → image: nextcloud:28.0

# Restore data from backup if needed
tar xzf backup-pre-update.tar.gz -C /

# For database:
cat backup-pre-update.sql | docker exec -i postgres psql -U postgres

# Start with the old version
docker compose up -d
```

**Important:** Some apps run database migrations on startup. If the new version migrated the database, rolling back the image without also rolling back the database can break things. Always back up the database before updating.

## Automated Updates with Watchtower

> **Watchtower is deprecated.** The `containrrr/watchtower` repository is archived and no longer maintained. For new setups, use [DIUN](/apps/diun/) (notify-only, never touches containers) or [What's Up Docker](https://github.com/fmartinou/whats-up-docker) (actively maintained, supports manual approval). The configuration below is kept for reference.

Watchtower monitors your containers and automatically updates them when new images are available.

```yaml
services:
  watchtower:
    image: containrrr/watchtower:1.7.1
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_SCHEDULE=0 0 4 * * *
      - WATCHTOWER_NOTIFICATIONS=email
      - WATCHTOWER_NOTIFICATION_EMAIL_FROM=admin@yourdomain.com
      - WATCHTOWER_NOTIFICATION_EMAIL_TO=you@yourdomain.com
      - WATCHTOWER_NOTIFICATION_EMAIL_SERVER=smtp.yourdomain.com
      - WATCHTOWER_NOTIFICATION_EMAIL_SERVER_PORT=587
    restart: unless-stopped
```

### Watchtower Configuration

| Variable | Purpose | Recommended Value |
|----------|---------|-------------------|
| `WATCHTOWER_SCHEDULE` | Cron schedule for update checks | `0 0 4 * * *` (daily at 4 AM) |
| `WATCHTOWER_CLEANUP` | Remove old images after update | `true` |
| `WATCHTOWER_MONITOR_ONLY` | Only notify, don't update | `true` (for critical services) |
| `WATCHTOWER_LABEL_ENABLE` | Only update labeled containers | `true` |

### Selective Updates with Labels

Don't auto-update everything. Use labels to control which containers Watchtower manages:

```yaml
# In Watchtower's config
environment:
  - WATCHTOWER_LABEL_ENABLE=true

# On containers you WANT auto-updated
services:
  pihole:
    image: pihole/pihole:2024.07.0
    labels:
      - com.centurylinklabs.watchtower.enable=true

  # Critical services — monitor only, manual update
  vaultwarden:
    image: vaultwarden/server:1.32.5
    labels:
      - com.centurylinklabs.watchtower.enable=false
```

**Recommendation:** Use `WATCHTOWER_MONITOR_ONLY=true` for notifications without automatic updates. Then manually update when convenient and after backing up.

### Containers to Never Auto-Update

- **Databases** (PostgreSQL, MySQL, MariaDB) — version upgrades often require migration steps
- **Password managers** (Vaultwarden) — too critical for unattended updates
- **Reverse proxies** — downtime affects all services
- **Any app with a database migration step** — check release notes first

### Containers Safe to Auto-Update

- Monitoring tools (Uptime Kuma, Grafana)
- Dashboards (Homepage, Homarr)
- Utility containers (DDNS updaters)
- Stateless tools (Stirling PDF, PrivateBin)

## Version Pinning Strategy

### Do: Pin to Specific Versions

```yaml
# Good — reproducible, controlled
image: nextcloud:29.0.3
image: postgres:16.2
image: vaultwarden/server:1.32.5
```

### Don't: Use :latest

```yaml
# Bad — unpredictable, unauditable
image: nextcloud:latest
image: postgres:latest
```

`:latest` means "whatever the newest version was when I last pulled." You don't know what you're running, and `docker compose pull` might jump multiple major versions.

### Consider: Major Version Tags

```yaml
# Acceptable compromise — gets minor/patch updates within a major version
image: postgres:16
image: redis:7
```

This auto-updates within PostgreSQL 16.x when you pull, but won't jump to PostgreSQL 17. A reasonable middle ground for less critical services.

## Update Workflow for Different Service Types

### Databases (PostgreSQL, MySQL)

Databases require special care during major version upgrades:

```bash
# 1. Check if the update is a major version change
# PostgreSQL 16 → 17 = MAJOR (requires pg_upgrade or dump/restore)
# PostgreSQL 16.1 → 16.2 = MINOR (safe to update in place)

# 2. For minor updates — safe to pull and restart
docker compose pull db
docker compose up -d db

# 3. For major updates — dump and restore
docker exec postgres pg_dumpall -U postgres > full-backup.sql
docker compose down
# Update image tag to new major version
docker compose up -d
cat full-backup.sql | docker exec -i postgres psql -U postgres
```

### Web Applications (Nextcloud, Gitea)

```bash
# 1. Enable maintenance mode if supported
docker exec nextcloud php occ maintenance:mode --on

# 2. Back up database and files
docker exec db pg_dump -U nextcloud nextcloud > nextcloud-backup.sql

# 3. Update image tag in docker-compose.yml
# 4. Pull and recreate
docker compose pull
docker compose up -d

# 5. Check logs for migration messages
docker compose logs -f nextcloud

# 6. Disable maintenance mode
docker exec nextcloud php occ maintenance:mode --off
```

### Stateless Services (Monitoring, Dashboards)

```bash
# Simple — just pull and recreate
docker compose pull
docker compose up -d
```

## Cleanup After Updates

Old images accumulate and waste disk space:

```bash
# Remove unused images
docker image prune -a

# Remove all unused Docker objects (images, containers, networks, volumes)
# WARNING: --volumes removes unused volumes — only if you're sure no data is in them
docker system prune -a

# Check disk usage
docker system df
```

Schedule cleanup weekly ([Cron Jobs](/foundations/linux-cron-jobs/)):

```bash
# Weekly cleanup (Sunday at 3 AM)
0 3 * * 0 /usr/bin/docker image prune -af >> /var/log/docker-cleanup.log 2>&1
```

## Common Mistakes

### 1. Updating Without Backing Up

The most common and most painful mistake. An update corrupts the database, and you have no backup. Always back up before updating critical services.

### 2. Using :latest and Forgetting What Version You're Running

You can't roll back if you don't know what version you were on. Always pin versions and keep a record.

### 3. Auto-Updating Databases

A PostgreSQL major version upgrade requires a migration process. Watchtower auto-updating your database container from 16 to 17 will break it. Never auto-update databases.

### 4. Not Reading Release Notes

Major version upgrades often have breaking changes — removed environment variables, changed config formats, new dependencies. Read the release notes before updating.

### 5. Updating All Services at Once

Update one service at a time. If something breaks, you know exactly which update caused it.

## FAQ

### How often should I update Docker containers?

Check for updates weekly. Apply security patches immediately. Apply feature updates monthly or when convenient. Critical services (password manager, reverse proxy) should be updated promptly when security fixes are released.

### Is Watchtower safe to use?

Watchtower is now deprecated — the `containrrr/watchtower` repository has been archived and will not receive further updates or security patches. If you have an existing installation, it will continue to function, but for new setups use [DIUN](/apps/diun/) for update notifications or [What's Up Docker](https://github.com/fmartinou/whats-up-docker) for managed updates. Never auto-update databases regardless of the tool you use.

### What if I'm many versions behind?

Check the app's documentation for upgrade paths. Some apps require stepping through versions (e.g., Nextcloud 25 → 26 → 27 → 28, can't skip). Databases may need dump/restore between major versions.

### How do I know if a container has a security vulnerability?

Use `docker scout cves <image>` (Docker Scout) to scan for known vulnerabilities. Or use Trivy: `trivy image nextcloud:29.0`. Subscribe to the app's security mailing list or GitHub advisories.

### Can I update just one service in a multi-service Compose file?

Yes. `docker compose up -d nextcloud` recreates only the nextcloud service. Other containers are unaffected.

## Next Steps

- [Docker Compose Basics](/foundations/docker-compose-basics/) — understand Compose file structure
- [Docker Volumes](/foundations/docker-volumes/) — how data persists across updates
- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/) — protect your data

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Docker Environment Variables](/foundations/docker-environment-variables/)
- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/)
- [Linux Cron Jobs](/foundations/linux-cron-jobs/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
