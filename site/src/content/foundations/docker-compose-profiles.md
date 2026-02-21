---
title: "Docker Compose Profiles Tutorial"
description: "Use Docker Compose profiles to selectively start services — run dev, monitoring, or optional containers only when you need them."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "docker", "docker-compose", "profiles"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are Docker Compose Profiles?

Docker Compose profiles let you group services and only start them when explicitly requested. Instead of running every service in your `docker-compose.yml` with `docker compose up -d`, you tag optional services with a profile name and start them selectively.

This is useful for self-hosting when you have:
- Monitoring tools (Prometheus, Grafana) you only run occasionally
- Development/debug containers alongside production services
- Optional services like backup agents or log collectors
- Multiple environments in a single Compose file

## Prerequisites

- Docker Engine 20.10+ with Docker Compose v2 — see [Docker Compose Basics](/foundations/docker-compose-basics/)
- An existing Docker Compose setup to add profiles to

## Basic Syntax

Add a `profiles` key to any service you want to make optional:

```yaml
services:
  # Always starts — no profile assigned
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    restart: unless-stopped
    volumes:
      - jellyfin-config:/config
      - /media:/media:ro
    ports:
      - "8096:8096"

  # Only starts when "monitoring" profile is active
  prometheus:
    image: prom/prometheus:v3.1.0
    restart: unless-stopped
    profiles:
      - monitoring
    volumes:
      - prometheus-data:/prometheus
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:11.5.1
    restart: unless-stopped
    profiles:
      - monitoring
    volumes:
      - grafana-data:/var/lib/grafana
    ports:
      - "3000:3000"

  # Only starts when "debug" profile is active
  adminer:
    image: adminer:4.8.1
    restart: unless-stopped
    profiles:
      - debug
    ports:
      - "8080:8080"

volumes:
  jellyfin-config:
  prometheus-data:
  grafana-data:
```

**Key rules:**
- Services without `profiles` always start with `docker compose up -d`
- Services with `profiles` only start when you explicitly activate their profile
- A service can belong to multiple profiles

## Starting Services with Profiles

```bash
# Start only the always-on services (no profiles)
docker compose up -d

# Start always-on + monitoring profile
docker compose --profile monitoring up -d

# Start always-on + debug profile
docker compose --profile debug up -d

# Start everything (all profiles)
docker compose --profile monitoring --profile debug up -d
```

## Stopping Profile Services

```bash
# Stop only monitoring services
docker compose --profile monitoring down

# Stop everything including profiled services
docker compose --profile monitoring --profile debug down
```

Note: `docker compose down` without profiles only stops services that were started without profiles. To stop profiled services, include their profile names.

## Practical Patterns

### Pattern 1: Optional Monitoring Stack

Keep your monitoring tools out of the way until you need them:

```yaml
services:
  app:
    image: myapp:v1.0.0
    restart: unless-stopped
    ports:
      - "8080:8080"

  node-exporter:
    image: prom/node-exporter:v1.8.2
    restart: unless-stopped
    profiles:
      - monitoring
    pid: host
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro

  prometheus:
    image: prom/prometheus:v3.1.0
    restart: unless-stopped
    profiles:
      - monitoring
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro

  grafana:
    image: grafana/grafana:11.5.1
    restart: unless-stopped
    profiles:
      - monitoring
    ports:
      - "3000:3000"
```

Run `docker compose --profile monitoring up -d` when you want dashboards. Stop them when you don't.

### Pattern 2: Database Admin Tools

Keep database administration tools available but not running:

```yaml
services:
  postgres:
    image: postgres:17.2
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  pgadmin:
    image: dpage/pgadmin4:8.14
    restart: unless-stopped
    profiles:
      - admin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  pgdata:
```

### Pattern 3: Backup Services on Schedule

Run backup containers only when needed:

```yaml
services:
  nextcloud:
    image: nextcloud:30.0.4
    restart: unless-stopped
    volumes:
      - nextcloud-data:/var/www/html

  backup:
    image: offen/docker-volume-backup:v2.43.3
    profiles:
      - backup
    environment:
      BACKUP_CRON_EXPRESSION: "0 2 * * *"
    volumes:
      - nextcloud-data:/backup/nextcloud:ro
      - ./backups:/archive

volumes:
  nextcloud-data:
```

### Pattern 4: Multiple Environments

```yaml
services:
  app:
    image: myapp:v1.0.0
    restart: unless-stopped
    ports:
      - "8080:8080"

  app-dev:
    image: myapp:dev
    profiles:
      - dev
    ports:
      - "8081:8080"
    environment:
      DEBUG: "true"

  test-db:
    image: postgres:17.2
    profiles:
      - dev
    environment:
      POSTGRES_PASSWORD: testpassword
    tmpfs:
      - /var/lib/postgresql/data
```

## Environment Variable for Default Profiles

Set `COMPOSE_PROFILES` in your `.env` file or shell to activate profiles by default:

```bash
# .env file
COMPOSE_PROFILES=monitoring
```

Now `docker compose up -d` automatically includes the monitoring profile. Multiple profiles are comma-separated:

```bash
COMPOSE_PROFILES=monitoring,backup
```

## Dependencies Between Profiled and Non-Profiled Services

If a profiled service depends on a non-profiled service, the non-profiled service starts automatically when you activate the profile. But the reverse doesn't work — a non-profiled service cannot depend on a profiled service (it would fail to start without the profile).

```yaml
services:
  postgres:
    image: postgres:17.2  # Always runs
    restart: unless-stopped

  pgadmin:
    profiles:
      - admin
    depends_on:
      - postgres  # postgres starts when admin profile is activated
```

## Common Mistakes

### Forgetting to Include the Profile When Stopping

`docker compose down` doesn't stop profiled services. You'll see orphaned containers. Always include the profile:

```bash
# Wrong — leaves monitoring containers running
docker compose down

# Correct
docker compose --profile monitoring down
```

### Using Profiles for Required Dependencies

Don't put a database behind a profile if your main app depends on it. Profiles are for optional services, not core dependencies.

### Not Setting restart: unless-stopped

Profiled services should still have `restart: unless-stopped`. After a system reboot, profiled services that were running will restart automatically (Docker daemon remembers running containers regardless of how they were started).

## Common Mistakes

### Overcomplicating with Too Many Profiles

If you have 10 different profiles, your Compose file is probably too complex. Consider splitting into multiple Compose files for distinct environments instead. Profiles work best with 2-4 profile names.

## Next Steps

- Learn Docker Compose fundamentals — [Docker Compose Basics](/foundations/docker-compose-basics/)
- Manage secrets in Compose — [Docker Compose Secrets](/foundations/docker-compose-secrets/)
- Set up monitoring — [Monitoring Basics](/foundations/monitoring-basics/)
- Understand Docker networking — [Docker Networking](/foundations/docker-networking/)

## FAQ

### Can a service belong to multiple profiles?

Yes. A service with `profiles: [monitoring, debug]` starts when either profile is activated. The service only needs one of its profiles to be active.

### Do profiles affect docker compose ps?

Yes. `docker compose ps` shows only running containers. To see all defined services including profiled ones, use `docker compose config --services`.

### Can I use profiles with docker compose build?

Yes. `docker compose --profile dev build` builds only the services in the `dev` profile (plus non-profiled services). This is useful when profiled services use custom Dockerfiles.

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Compose Secrets](/foundations/docker-compose-secrets/)
- [Docker Environment Variables](/foundations/docker-environment-variables/)
- [Docker Networking](/foundations/docker-networking/)
- [Monitoring Basics](/foundations/monitoring-basics/)
