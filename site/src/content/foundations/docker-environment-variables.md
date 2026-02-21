---
title: "Docker Environment Variables Explained"
description: "Master Docker environment variables — .env files, docker-compose.yml syntax, secrets management, and best practices for self-hosted services."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["docker", "environment-variables", "security", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are Environment Variables?

Environment variables are key-value pairs that configure application behavior without hardcoding values in files. In Docker, they're the primary way to configure containers — setting database passwords, API keys, ports, timezone, and feature flags.

Every self-hosted Docker app uses environment variables. Getting them right is the difference between a working deployment and a broken one.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose Basics](/foundations/docker-compose-basics/))
- Basic terminal knowledge ([Linux Basics](/foundations/linux-basics-self-hosting/))

## Setting Environment Variables in Docker Compose

### Method 1: Inline in docker-compose.yml

```yaml
services:
  nextcloud:
    image: nextcloud:29.0
    environment:
      - MYSQL_HOST=db
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_PASSWORD=changeme-strong-password
      - NEXTCLOUD_ADMIN_USER=admin
      - NEXTCLOUD_ADMIN_PASSWORD=changeme-admin-password
      - NEXTCLOUD_TRUSTED_DOMAINS=cloud.example.com
    restart: unless-stopped
```

Or using the map syntax (equivalent):

```yaml
    environment:
      MYSQL_HOST: db
      MYSQL_DATABASE: nextcloud
      MYSQL_USER: nextcloud
      MYSQL_PASSWORD: changeme-strong-password
```

Both formats work. The list format (`- KEY=value`) is more common in self-hosting documentation.

### Method 2: External .env File (Recommended)

Separate secrets from your Compose file:

```bash
# .env (in the same directory as docker-compose.yml)
MYSQL_ROOT_PASSWORD=super-secret-root-password
MYSQL_DATABASE=nextcloud
MYSQL_USER=nextcloud
MYSQL_PASSWORD=changeme-strong-password
NEXTCLOUD_ADMIN_USER=admin
NEXTCLOUD_ADMIN_PASSWORD=changeme-admin-password
TZ=America/New_York
```

```yaml
# docker-compose.yml
services:
  db:
    image: mariadb:11.4
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=${MYSQL_DATABASE}
      - MYSQL_USER=${MYSQL_USER}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
    restart: unless-stopped

  nextcloud:
    image: nextcloud:29.0
    environment:
      - MYSQL_HOST=db
      - MYSQL_DATABASE=${MYSQL_DATABASE}
      - MYSQL_USER=${MYSQL_USER}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
      - NEXTCLOUD_ADMIN_USER=${NEXTCLOUD_ADMIN_USER}
      - NEXTCLOUD_ADMIN_PASSWORD=${NEXTCLOUD_ADMIN_PASSWORD}
    restart: unless-stopped
```

Docker Compose automatically reads the `.env` file in the same directory. Variables referenced with `${VAR_NAME}` are substituted.

**Advantages of .env files:**
- Keep secrets out of `docker-compose.yml` (which you might commit to git)
- Share variables between services (one `MYSQL_PASSWORD` used by both the database and the app)
- Easy to have different `.env` files per environment

### Method 3: env_file Directive

Point to a specific env file (doesn't have to be named `.env`):

```yaml
services:
  myapp:
    image: myapp:v1.0
    env_file:
      - ./myapp.env
      - ./shared.env
    restart: unless-stopped
```

```bash
# myapp.env
APP_SECRET=some-secret
FEATURE_FLAG=true

# shared.env
TZ=America/New_York
```

**Difference from .env:** The `.env` file is used for variable substitution in the Compose file itself. `env_file` passes variables directly to the container. They serve different purposes and can be used together.

## Variable Substitution Syntax

Docker Compose supports several substitution forms:

```yaml
environment:
  # Simple substitution
  - DB_HOST=${DB_HOST}

  # Default value if not set
  - DB_PORT=${DB_PORT:-5432}

  # Error if not set
  - DB_PASSWORD=${DB_PASSWORD:?Database password is required}

  # Default value if empty or not set
  - DB_NAME=${DB_NAME:-myapp}
```

| Syntax | Behavior |
|--------|----------|
| `${VAR}` | Use VAR's value, empty string if not set |
| `${VAR:-default}` | Use VAR's value, or `default` if not set/empty |
| `${VAR-default}` | Use VAR's value, or `default` if not set (but allows empty) |
| `${VAR:?error}` | Use VAR's value, or exit with error message if not set/empty |

## Common Environment Variables

These appear across many self-hosted apps:

| Variable | Purpose | Example |
|----------|---------|---------|
| `TZ` | Timezone | `America/New_York`, `Europe/London`, `UTC` |
| `PUID` | Process user ID (LinuxServer.io) | `1000` |
| `PGID` | Process group ID (LinuxServer.io) | `1000` |
| `MYSQL_ROOT_PASSWORD` | MySQL/MariaDB root password | Strong random string |
| `MYSQL_DATABASE` | Database name to create | `myapp` |
| `MYSQL_USER` | Database username | `myapp` |
| `MYSQL_PASSWORD` | Database user password | Strong random string |
| `POSTGRES_PASSWORD` | PostgreSQL superuser password | Strong random string |
| `POSTGRES_DB` | PostgreSQL database name | `myapp` |
| `POSTGRES_USER` | PostgreSQL username | `myapp` |
| `REDIS_PASSWORD` | Redis authentication password | Strong random string |

### Generating Strong Passwords

Never use `password123` or `changeme` in production. Generate random passwords:

```bash
# 32-character random password
openssl rand -base64 32

# 24-character alphanumeric
openssl rand -hex 12

# Using /dev/urandom
tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 32; echo
```

Put generated passwords in your `.env` file:

```bash
# Generate and write to .env
echo "MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32)" >> .env
echo "MYSQL_PASSWORD=$(openssl rand -base64 32)" >> .env
echo "APP_SECRET=$(openssl rand -hex 32)" >> .env
```

## Debugging Environment Variables

### Check What's Set Inside a Container

```bash
# List all env vars in a running container
docker exec mycontainer env

# Check a specific variable
docker exec mycontainer printenv MYSQL_HOST

# Check the Compose-resolved config
docker compose config
```

`docker compose config` shows the final Compose file with all variables substituted — useful for verifying `.env` values are being picked up.

### Common Issues

**Variable not being substituted:**
```bash
# Check if .env file is in the right directory
ls -la .env

# Check if variable is defined
grep MY_VAR .env

# Check Docker Compose's resolved config
docker compose config | grep MY_VAR
```

**Variable is set but app doesn't see it:**

Some apps read env vars only at first startup. After changing variables:

```bash
# Recreate the container (not just restart)
docker compose up -d --force-recreate
```

`docker compose restart` does NOT re-read environment variables. You need `up -d --force-recreate` or `down` + `up -d`.

## Secrets vs Environment Variables

Environment variables are visible to anyone who can run `docker inspect` or `docker exec env`. For highly sensitive values (private keys, API tokens), Docker Secrets provide better isolation:

```yaml
services:
  db:
    image: postgres:16.2
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    secrets:
      - db_password
    restart: unless-stopped

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

**Note:** Not all apps support `_FILE` suffix variables. Check the app's documentation. PostgreSQL, MySQL, and many official Docker images do support them.

For most self-hosting setups, `.env` files with proper file permissions (`chmod 600 .env`) are sufficient. Docker Secrets add complexity that's only warranted in multi-node or high-security environments.

## Best Practices

### 1. Never Commit Secrets to Git

Add `.env` to `.gitignore`. Commit a `.env.example` with placeholder values instead:

```bash
# .gitignore
.env
secrets/

# .env.example (commit this)
MYSQL_ROOT_PASSWORD=change-me
MYSQL_PASSWORD=change-me
APP_SECRET=change-me
TZ=UTC
```

### 2. Use One .env File Per Service Stack

Don't share a single `.env` across unrelated services. Each `docker-compose.yml` gets its own `.env`:

```
/opt/nextcloud/.env
/opt/nextcloud/docker-compose.yml

/opt/jellyfin/.env
/opt/jellyfin/docker-compose.yml
```

### 3. Document Every Variable

Add comments to your `.env` file:

```bash
# Database configuration
MYSQL_ROOT_PASSWORD=abc123    # Root password — change this
MYSQL_DATABASE=nextcloud      # Database name
MYSQL_USER=nextcloud          # App database user
MYSQL_PASSWORD=xyz789         # App database password — change this

# App configuration
NEXTCLOUD_TRUSTED_DOMAINS=cloud.example.com  # Your domain
TZ=America/New_York                          # Server timezone
```

### 4. Set Restrictive File Permissions

```bash
chmod 600 .env
chmod 600 secrets/*
```

### 5. Always Set TZ

Without `TZ`, containers default to UTC. Set your timezone consistently:

```bash
# In .env
TZ=America/New_York
```

Find your timezone string: `timedatectl list-timezones`

## Common Mistakes

### 1. Using Quotes in .env Files

Docker Compose `.env` files don't need quotes. Quotes become part of the value:

```bash
# Wrong — password includes the quotes
MYSQL_PASSWORD="my-password"
# Container sees: "my-password" (with quotes)

# Right
MYSQL_PASSWORD=my-password
# Container sees: my-password
```

### 2. Spaces Around the Equals Sign

```bash
# Wrong — variable name includes a space
MYSQL_PASSWORD = my-password

# Right
MYSQL_PASSWORD=my-password
```

### 3. Forgetting to Recreate After Changing Variables

```bash
# This does NOT apply new env vars
docker compose restart

# This does
docker compose up -d --force-recreate
```

### 4. Using the Same Password Everywhere

Each service should have its own unique password. A compromise of one doesn't compromise all:

```bash
# Bad
MYSQL_ROOT_PASSWORD=same-password
MYSQL_PASSWORD=same-password
REDIS_PASSWORD=same-password

# Good — unique password per service
MYSQL_ROOT_PASSWORD=aK9x4Bm2pQ7nR3tW
MYSQL_PASSWORD=jH6sD8fL1yE5cV9b
REDIS_PASSWORD=mN3wX7qZ2uP4gT8k
```

### 5. Hardcoding Values That Should Be Configurable

If you might change a value later (domain name, port, storage path), put it in `.env` rather than hardcoding in `docker-compose.yml`.

## FAQ

### What's the difference between .env and env_file?

The `.env` file substitutes variables in the `docker-compose.yml` file itself (the `${VAR}` syntax). The `env_file` directive passes variables directly to the container. Use `.env` for Compose-level substitution and `env_file` for container-level configuration.

### Can I use environment variables for Docker image tags?

Yes. This is a good practice for version pinning:

```bash
# .env
NEXTCLOUD_VERSION=29.0
MARIADB_VERSION=11.4
```

```yaml
services:
  nextcloud:
    image: nextcloud:${NEXTCLOUD_VERSION}
```

### Do I need to restart Docker after changing .env?

You need to recreate the container, not just restart it. Run `docker compose up -d --force-recreate`. A simple `restart` reuses the existing container with the old variables.

### How do I pass multiline values?

Use `\n` for newlines or put the content in a file and mount it as a volume instead:

```yaml
volumes:
  - ./config/my-config.conf:/etc/app/config.conf:ro
```

### Are environment variables secure?

They're visible via `docker inspect` and inside the container. For production secrets, use Docker Secrets, mount secret files as read-only volumes, or use a secrets manager like Vault. For homelab use, `.env` files with `chmod 600` are adequate.

## Next Steps

- [Docker Compose Basics](/foundations/docker-compose-basics/) — full Compose file reference
- [Docker Volumes](/foundations/docker-volumes/) — persistent storage configuration
- [Linux File Permissions](/foundations/linux-permissions/) — secure your .env files

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Docker Networking](/foundations/docker-networking/)
- [Linux File Permissions](/foundations/linux-permissions/)
- [SSH Setup Guide](/foundations/ssh-setup/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
