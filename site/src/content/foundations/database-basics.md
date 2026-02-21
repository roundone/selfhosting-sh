---
title: "Database Basics for Self-Hosting"
description: "Learn database basics for self-hosting — PostgreSQL, MariaDB, SQLite, and Redis explained with Docker Compose configs and backup commands."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "database", "postgresql", "mysql", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Databases Matter for Self-Hosting

Every self-hosted app that stores structured data — users, settings, bookmarks, notes, financial records — needs a database. Understanding database basics for self-hosting is the difference between a stack that runs reliably for years and one that loses data on the first upgrade.

Most self-hosted apps bundle a database in their `docker-compose.yml`. You will see PostgreSQL, MariaDB, or SQLite referenced in nearly every app you deploy. Knowing what each one does, when to use it, and how to back it up means you can confidently run [Nextcloud](/apps/nextcloud/), [Immich](/apps/immich/), [Gitea](/apps/gitea/), or any other app that depends on persistent structured storage.

This guide covers the four databases you will encounter most often, how to run them in Docker, and how to keep your data safe.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended) — see [Getting Started with Self-Hosting](/foundations/getting-started/)
- Docker and Docker Compose installed — see [Docker Compose Basics](/foundations/docker-compose-basics/)
- Basic understanding of Docker volumes — see [Docker Volumes and Persistent Data](/foundations/docker-volumes/)
- Basic terminal comfort

## Database Types

### PostgreSQL

PostgreSQL is the best default database for self-hosting. It is mature, standards-compliant, handles complex queries well, and has excellent data integrity guarantees. Most modern self-hosted apps either require PostgreSQL or list it as the recommended option.

**Use PostgreSQL when:**
- The app supports it (most do)
- You want one database engine to standardize on
- The app uses advanced features like full-text search, JSON columns, or spatial data
- You are running apps like Immich, Authentik, Outline, or Gitea

PostgreSQL uses slightly more RAM than MariaDB at idle (roughly 30-50 MB vs 20-40 MB), but the difference is irrelevant on any server with 2 GB+ of RAM.

### MySQL / MariaDB

MariaDB is a community-maintained fork of MySQL. For self-hosting purposes, they are interchangeable — MariaDB is the better choice because it is fully open-source and ships performance improvements over upstream MySQL.

**Use MariaDB when:**
- The app explicitly requires MySQL/MariaDB (WordPress, Matomo, Bookstack)
- The app does not support PostgreSQL
- You are migrating from an existing MySQL setup

Do not run both PostgreSQL and MariaDB unless you have apps that strictly require each. Pick one as your default and use the other only when forced.

### SQLite

SQLite is a file-based database — no separate server process, no network port, no configuration. The entire database lives in a single file on disk.

**Use SQLite when:**
- The app defaults to it and you have a single user or low traffic (Vaultwarden, Uptime Kuma, Linkwarden)
- You want the simplest possible setup with no additional containers
- The app explicitly recommends SQLite for small deployments

**Avoid SQLite when:**
- Multiple users will write data concurrently (SQLite locks the entire database on writes)
- The dataset will grow beyond a few gigabytes
- The app offers PostgreSQL as an alternative and you expect meaningful load

SQLite backups are straightforward: copy the `.db` file while the app is stopped, or use `sqlite3 database.db ".backup backup.db"` for a live-safe copy.

### Redis

Redis is not a primary database — it is an in-memory key-value store used as a cache, session store, or message broker. Many self-hosted apps list Redis as optional but recommended for performance.

**Use Redis when:**
- The app's docs say "Redis recommended" or "Redis required" (Nextcloud, Mastodon, Authentik)
- You want faster page loads and reduced database load

Redis data is ephemeral by default. If Redis restarts, the cache rebuilds from the primary database. This is normal. Do not waste time backing up Redis unless the app explicitly stores non-recoverable data there (rare).

## Which Database to Choose

**Default to PostgreSQL.** It works with the widest range of modern self-hosted apps, has the best tooling, and handles growth well. If every app you run supports PostgreSQL, use PostgreSQL for all of them and simplify your life.

**Use MariaDB only when required.** Some apps (WordPress, BookStack, Matomo) require MySQL/MariaDB. Run it for those apps. Do not switch your entire stack to MariaDB just because one app needs it.

**Use SQLite for lightweight, single-user apps.** If you are the only user of Vaultwarden or Uptime Kuma, SQLite is perfectly fine and removes an entire container from your stack.

**Add Redis when the app asks for it.** Do not add it preemptively. If the app's documentation says Redis improves performance, add it. Otherwise, skip it.

## Running PostgreSQL in Docker

Create a directory for your PostgreSQL stack:

```bash
mkdir -p /opt/stacks/postgres && cd /opt/stacks/postgres
```

Create a `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16.6
    container_name: postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: selfhost          # Superuser username — change this
      POSTGRES_PASSWORD: changeme123   # Superuser password — MUST change this
      POSTGRES_DB: default             # Default database created on first run
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"         # Bind to localhost only — not exposed to the network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U selfhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    shm_size: 256mb                    # Prevents "out of shared memory" under load

volumes:
  postgres_data:
```

Start it:

```bash
docker compose up -d
```

Verify it is running and healthy:

```bash
docker compose ps
```

You should see `postgres` with status `Up (healthy)`.

### Connecting Apps to PostgreSQL

Most self-hosted apps accept a database connection string or individual connection parameters in their environment variables. The typical pattern:

```yaml
services:
  myapp:
    image: someapp/someapp:1.0.0
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: selfhost
      DB_PASSWORD: changeme123
      DB_NAME: myapp_db
    depends_on:
      postgres:
        condition: service_healthy
```

If the app runs in the same Compose file as PostgreSQL, use the service name (`postgres`) as the hostname. If the app runs in a different Compose file, either put both on the same [Docker network](/foundations/docker-networking/) or connect via `127.0.0.1:5432` (since we bound the port to localhost).

### Creating Additional Databases

Each app should have its own database. Connect to the running PostgreSQL container and create them:

```bash
docker exec -it postgres psql -U selfhost -d default
```

Inside the `psql` shell:

```sql
CREATE DATABASE immich;
CREATE DATABASE gitea;
CREATE DATABASE authentik;
```

Type `\q` to exit. Each app now has an isolated database, reducing the blast radius if something goes wrong.

## Running MariaDB in Docker

Create a directory for your MariaDB stack:

```bash
mkdir -p /opt/stacks/mariadb && cd /opt/stacks/mariadb
```

Create a `docker-compose.yml`:

```yaml
services:
  mariadb:
    image: mariadb:11.6.2
    container_name: mariadb
    restart: unless-stopped
    environment:
      MARIADB_ROOT_PASSWORD: rootchangeme    # Root password — MUST change this
      MARIADB_USER: selfhost                 # Application user
      MARIADB_PASSWORD: changeme123          # Application user password — MUST change this
      MARIADB_DATABASE: default              # Default database created on first run
    volumes:
      - mariadb_data:/var/lib/mysql
    ports:
      - "127.0.0.1:3306:3306"               # Bind to localhost only
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mariadb_data:
```

Start it:

```bash
docker compose up -d
```

Verify:

```bash
docker compose ps
```

### Connecting Apps to MariaDB

Same pattern as PostgreSQL — use the service name as hostname, provide credentials via environment variables:

```yaml
services:
  wordpress:
    image: wordpress:6.7.1
    environment:
      WORDPRESS_DB_HOST: mariadb
      WORDPRESS_DB_USER: selfhost
      WORDPRESS_DB_PASSWORD: changeme123
      WORDPRESS_DB_NAME: wordpress
    depends_on:
      mariadb:
        condition: service_healthy
```

### Creating Additional Databases

```bash
docker exec -it mariadb mariadb -u root -p
```

Enter the root password, then:

```sql
CREATE DATABASE wordpress;
CREATE DATABASE bookstack;
GRANT ALL PRIVILEGES ON wordpress.* TO 'selfhost'@'%';
GRANT ALL PRIVILEGES ON bookstack.* TO 'selfhost'@'%';
FLUSH PRIVILEGES;
```

Type `exit` to quit.

## Database Backup and Restore

Databases cannot be reliably backed up by copying files while the database is running. The files may be in an inconsistent state mid-write. Use the database's own dump tools instead.

### PostgreSQL Backup

Dump a single database:

```bash
docker exec postgres pg_dump -U selfhost immich > immich_backup_$(date +%Y%m%d).sql
```

Dump all databases on the server:

```bash
docker exec postgres pg_dumpall -U selfhost > all_databases_$(date +%Y%m%d).sql
```

### PostgreSQL Restore

Restore a single database dump:

```bash
docker exec -i postgres psql -U selfhost -d immich < immich_backup_20260216.sql
```

If restoring to a fresh database, create it first:

```bash
docker exec postgres createdb -U selfhost immich
docker exec -i postgres psql -U selfhost -d immich < immich_backup_20260216.sql
```

### MariaDB Backup

Dump a single database:

```bash
docker exec mariadb mariadb-dump -u root -p'rootchangeme' wordpress > wordpress_backup_$(date +%Y%m%d).sql
```

Dump all databases:

```bash
docker exec mariadb mariadb-dump -u root -p'rootchangeme' --all-databases > all_databases_$(date +%Y%m%d).sql
```

### MariaDB Restore

```bash
docker exec -i mariadb mariadb -u root -p'rootchangeme' wordpress < wordpress_backup_20260216.sql
```

### Automating Backups

Create a script at `/opt/scripts/db-backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/databases"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# PostgreSQL
docker exec postgres pg_dumpall -U selfhost > "$BACKUP_DIR/postgres_$DATE.sql"

# MariaDB
docker exec mariadb mariadb-dump -u root -p'rootchangeme' --all-databases > "$BACKUP_DIR/mariadb_$DATE.sql"

# Compress
gzip "$BACKUP_DIR/postgres_$DATE.sql"
gzip "$BACKUP_DIR/mariadb_$DATE.sql"

# Delete backups older than 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "Database backup completed: $DATE"
```

Make it executable and schedule it with cron:

```bash
chmod +x /opt/scripts/db-backup.sh
crontab -e
```

Add this line for daily backups at 3 AM:

```
0 3 * * * /opt/scripts/db-backup.sh >> /var/log/db-backup.log 2>&1
```

Store these backups off-server using the [3-2-1 backup rule](/foundations/backup-3-2-1-rule/). A local dump is only protection against application-level corruption, not hardware failure.

## Performance Tuning Basics

### PostgreSQL Tuning

The default PostgreSQL configuration is conservative. For a self-hosting server with 4-8 GB of RAM, these settings in a custom config file provide meaningful improvement.

Create `/opt/stacks/postgres/custom-postgresql.conf`:

```ini
# Memory — adjust based on total server RAM
shared_buffers = 512MB            # 25% of total RAM, up to ~2GB
effective_cache_size = 1536MB     # 75% of total RAM
work_mem = 16MB                   # Per-operation memory for sorts/joins
maintenance_work_mem = 256MB      # For VACUUM, CREATE INDEX

# Write-ahead log
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# Query planner
random_page_cost = 1.1            # Set to 1.1 for SSD, 4.0 for HDD
default_statistics_target = 200
```

Mount it in your Compose file:

```yaml
services:
  postgres:
    image: postgres:16.6
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./custom-postgresql.conf:/etc/postgresql/custom.conf:ro
    command: postgres -c config_file=/etc/postgresql/custom.conf
```

### MariaDB Tuning

Create `/opt/stacks/mariadb/custom-mariadb.cnf`:

```ini
[mysqld]
# Memory — adjust based on total server RAM
innodb_buffer_pool_size = 512M    # 50-70% of available RAM for database server
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2  # Slight durability trade-off for 10x write speed

# Connections
max_connections = 100

# Query cache (useful for read-heavy self-hosted apps)
query_cache_type = 1
query_cache_size = 64M
```

Mount it:

```yaml
services:
  mariadb:
    image: mariadb:11.6.2
    volumes:
      - mariadb_data:/var/lib/mysql
      - ./custom-mariadb.cnf:/etc/mysql/conf.d/custom.cnf:ro
```

### When to Tune

Do not tune preemptively. The defaults work fine for most self-hosted apps with fewer than a dozen concurrent users. Tune when you observe:

- Slow page loads that trace back to database queries
- High disk I/O during normal operation
- Out-of-memory errors in database logs

Check database logs with:

```bash
docker logs postgres --tail 50
docker logs mariadb --tail 50
```

## Common Mistakes

**Using `:latest` tags for database images.** A database engine upgrade can change the on-disk format. If `postgres:latest` silently upgrades from 16 to 17, your data volume may become incompatible. Always pin: `postgres:16.6`, not `postgres:latest`.

**Exposing database ports to the public internet.** Never bind database ports to `0.0.0.0`. The configs above bind to `127.0.0.1`, which means only the local machine can connect. If your apps connect over Docker networks, you do not need to expose the port at all — remove the `ports` section entirely and use [Docker networking](/foundations/docker-networking/).

**Not backing up databases.** "I have the Docker volume" is not a backup strategy. Volume data can be corrupted, accidentally deleted, or lost with the host. Run `pg_dump` or `mariadb-dump` daily and store the dumps off-server.

**Running one database per app.** You do not need a separate PostgreSQL container for every app. Run one PostgreSQL instance with multiple databases. Each app gets its own database inside the same server. This saves RAM and simplifies management.

**Forgetting `depends_on` with health checks.** If your app container starts before the database is ready, it will crash on first connection attempt. Always use `depends_on` with `condition: service_healthy` and configure a health check on the database service.

**Copying database files for backup while the database is running.** This produces corrupt backups. Always use `pg_dump` or `mariadb-dump` — they produce consistent snapshots regardless of active writes.

**Using weak passwords.** The `changeme123` passwords in this guide are placeholders. Generate real passwords with `openssl rand -base64 24` and store them using [Docker Compose secrets](/foundations/docker-compose-secrets/) or an [environment variables](/foundations/docker-environment-variables/) file that is not committed to version control.

## Next Steps

- Set up automated off-server backups with the [3-2-1 Backup Rule](/foundations/backup-3-2-1-rule/)
- Learn how containers communicate over [Docker Networking](/foundations/docker-networking/)
- Harden your database setup with [Docker Security Best Practices](/foundations/docker-security/)
- Deploy your first app that uses a database — [Immich](/apps/immich/), [Nextcloud](/apps/nextcloud/), or [Gitea](/apps/gitea/) are good starting points

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Volumes and Persistent Data](/foundations/docker-volumes/)
- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/)
- [Docker Networking](/foundations/docker-networking/)
- [Environment Variables in Docker](/foundations/docker-environment-variables/)
- [Docker Security Best Practices](/foundations/docker-security/)

## FAQ

### Can I run PostgreSQL and MariaDB on the same server?

Yes. Each runs in its own container with its own data volume and port. There is no conflict. The only cost is RAM — budget roughly 50-100 MB per idle database engine. On a server with 4 GB+ of RAM, running both is fine if you have apps that require each.

### How do I upgrade PostgreSQL from version 16 to 17?

PostgreSQL major version upgrades require a data migration — you cannot just change the image tag. The safest approach: dump all databases with `pg_dumpall`, stop the old container, remove the old data volume, start the new version, and restore from the dump. Test this process on a non-production copy first.

### Should I use a managed database instead of self-hosting one?

No, unless you have a specific reason. Managed databases cost $15-50+/month per instance. A self-hosted PostgreSQL container handles the workload of nearly every self-hosted app with zero ongoing cost. The trade-off is that you manage backups and upgrades yourself — which this guide covers.

### How much disk space do databases use?

Most self-hosted app databases are small. A Nextcloud instance with 10 users might use 500 MB of database storage. Immich with 100,000 photos uses 2-5 GB for metadata. The media files themselves live on the filesystem, not in the database. Budget 10-20 GB for databases and you will be fine for years.

### Do I need Redis for every app?

No. Redis is optional for most apps and only worth adding when the app's documentation specifically recommends it for performance. Apps like Nextcloud and Mastodon benefit noticeably from Redis. Smaller apps like Uptime Kuma or Vaultwarden do not need it at all.
