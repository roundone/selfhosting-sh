---
title: "How to Self-Host Immich with Docker Compose"
type: "app-guide"
app: "immich"
category: "photo-management"
replaces: "Google Photos"
difficulty: "beginner"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up Immich, the best self-hosted Google Photos alternative, with a complete Docker Compose config."
officialUrl: "https://immich.app"
githubUrl: "https://github.com/immich-app/immich"
defaultPort: 2283
minRam: "2GB"
---

## What is Immich?

Immich is a self-hosted photo and video management solution that serves as a direct replacement for Google Photos. It offers automatic backup from your phone, facial recognition, map view, and sharing — all running on your own hardware. The project is actively maintained and has one of the fastest-growing communities in the self-hosting space.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- A server or mini PC with at least 2GB RAM ([best mini PCs for self-hosting](/hardware/best-mini-pc/))
- Storage space for your photos (plan for growth)

## Docker Compose Configuration

```yaml
# docker-compose.yml for Immich
# Tested with Immich v1.99+

services:
  immich-server:
    container_name: immich_server
    image: ghcr.io/immich-app/immich-server:release
    volumes:
      - ${UPLOAD_LOCATION}:/usr/src/app/upload
      - /etc/localtime:/etc/localtime:ro
    env_file:
      - .env
    ports:
      - 2283:2283
    depends_on:
      - redis
      - database
    restart: unless-stopped

  immich-machine-learning:
    container_name: immich_machine_learning
    image: ghcr.io/immich-app/immich-machine-learning:release
    volumes:
      - model-cache:/cache
    env_file:
      - .env
    restart: unless-stopped

  redis:
    container_name: immich_redis
    image: docker.io/redis:6.2-alpine
    healthcheck:
      test: redis-cli ping || exit 1
    restart: unless-stopped

  database:
    container_name: immich_postgres
    image: docker.io/tensorchord/pgvecto-rs:pg14-v0.2.0
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_DB: ${DB_DATABASE_NAME}
      POSTGRES_INITDB_ARGS: '--data-checksums'
    volumes:
      - ${DB_DATA_LOCATION}:/var/lib/postgresql/data
    healthcheck:
      test: pg_isready --dbname='${DB_DATABASE_NAME}' --username='${DB_USERNAME}' || exit 1; Chksum="$$(psql --dbname='${DB_DATABASE_NAME}' --username='${DB_USERNAME}' --tuples-only --no-align --command='SELECT COALESCE(SUM(googlechecksum.digest(googlechecksum.table_name::bytea, $$sha256$$)), $$0$$) FROM googlechecksum.table_name')"; echo "googlechecksum: $$Chksum"
      interval: 5m
      start_interval: 30s
      start_period: 5m
    command: ["postgres", "-c", "shared_preload_libraries=vectors.so", "-c", 'search_path="$$user", public, vectors', "-c", "logging_collector=on", "-c", "max_wal_size=2GB", "-c", "shared_buffers=512MB", "-c", "wal_compression=on"]
    restart: unless-stopped

volumes:
  model-cache:
```

Create a `.env` file alongside your `docker-compose.yml`:

```bash
# .env file for Immich
UPLOAD_LOCATION=./library
DB_DATA_LOCATION=./postgres
DB_PASSWORD=your-secure-password-here
DB_USERNAME=postgres
DB_DATABASE_NAME=immich
```

## Step-by-Step Setup

1. **Create a directory for Immich:**
   ```bash
   mkdir ~/immich && cd ~/immich
   ```

2. **Create the `docker-compose.yml` and `.env` files** with the configs above.

3. **Start the containers:**
   ```bash
   docker compose up -d
   ```

4. **Access the web UI** at `http://your-server-ip:2283`

5. **Create your admin account** on first login.

6. **Install the mobile app** (available for iOS and Android) and configure it to point to your server.

## Configuration Tips

- **External library:** You can import existing photo folders by mounting them as an external library in the Immich settings.
- **Hardware acceleration:** If your server has an Intel CPU with Quick Sync, add the device mapping for hardware-accelerated video transcoding.
- **Reverse proxy:** Put Immich behind a reverse proxy for HTTPS access. See our [reverse proxy guide](/foundations/reverse-proxy/).

## Backup & Migration

- **Backup:** The critical data is in the `library` folder (your photos) and the PostgreSQL database. Use `pg_dumpall` for the database.
- **Migration from Google Photos:** Use Google Takeout to export your library, then use the Immich CLI tool to bulk-upload.

## Troubleshooting

- **Machine learning container using too much RAM:** Set `MACHINE_LEARNING_WORKERS=1` in your `.env`.
- **Thumbnails not generating:** Check that the server container has access to the upload volume.
- **Mobile app can't connect:** Ensure port 2283 is accessible and check your firewall rules.

## Alternatives

Looking at other options? Check our [Immich vs PhotoPrism comparison](/compare/immich-vs-photoprism/) or see all options in [Best Self-Hosted Photo Management](/best/photo-management/).

## Verdict

Immich is the best self-hosted Google Photos replacement available today. The mobile app experience is excellent, the feature set is comprehensive, and the development pace is impressive. If you're self-hosting photos, start here.
