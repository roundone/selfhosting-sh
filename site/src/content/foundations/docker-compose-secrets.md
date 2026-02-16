---
title: "Docker Compose Secrets Management"
description: "Manage sensitive data in Docker Compose — secrets, environment files, and best practices for passwords and API keys."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "docker", "secrets", "security", "docker-compose"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are Docker Compose Secrets?

Docker Compose secrets are a mechanism for passing sensitive data (passwords, API keys, tokens, certificates) to containers without putting them in environment variables or hardcoding them in configuration files.

Environment variables are visible in `docker inspect`, process listings, and container logs. Secrets are mounted as files inside the container, accessible only to the container's processes. This is a meaningful security improvement for any self-hosted setup.

## Prerequisites

- Docker Engine with Docker Compose v2 — see [Docker Compose Basics](/foundations/docker-compose-basics)
- Basic understanding of environment variables — see [Docker Environment Variables](/foundations/docker-environment-variables)

## The Problem with Environment Variables

Most self-hosted app guides (including ours) use environment variables for passwords:

```yaml
services:
  postgres:
    image: postgres:17.2
    environment:
      POSTGRES_PASSWORD: my_super_secret_password
```

This works, but has security issues:

1. **Visible in `docker inspect`:**
   ```bash
   docker inspect postgres | grep POSTGRES_PASSWORD
   # "POSTGRES_PASSWORD=my_super_secret_password"
   ```

2. **Visible in process listings** on some systems

3. **Committed to git** if the `docker-compose.yml` is in a repository

4. **Passed to child processes** — any process spawned by the container inherits all env vars

## Level 1: .env Files (Minimum Standard)

The simplest improvement: move secrets to a `.env` file and reference them in `docker-compose.yml`:

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:17.2
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
```

```bash
# .env (same directory as docker-compose.yml)
DB_PASSWORD=a_strong_generated_password_here
```

**Add `.env` to `.gitignore`** so it never gets committed:

```bash
echo ".env" >> .gitignore
```

Generate strong passwords:

```bash
openssl rand -base64 32
```

**Limitations:** The secret still ends up as an environment variable inside the container. It's still visible via `docker inspect`. But it's no longer hardcoded in your Compose file or committed to git.

## Level 2: Docker Compose Secrets (Recommended)

Docker Compose secrets mount sensitive data as files at `/run/secrets/SECRET_NAME` inside the container. The application reads the file instead of an environment variable.

### Basic Example

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:17.2
    restart: unless-stopped
    secrets:
      - db_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    volumes:
      - pgdata:/var/lib/postgresql/data

secrets:
  db_password:
    file: ./secrets/db_password.txt

volumes:
  pgdata:
```

Create the secret file:

```bash
mkdir -p secrets
openssl rand -base64 32 > secrets/db_password.txt
chmod 600 secrets/db_password.txt
```

**Key points:**
- The `secrets` top-level key defines available secrets
- Each service lists which secrets it needs under its `secrets` key
- The secret is available inside the container as a file at `/run/secrets/db_password`
- PostgreSQL's official image supports `*_FILE` environment variables — it reads the password from the file path

### Which Images Support _FILE Variables?

Many official Docker images support the `*_FILE` pattern:

| Image | File Variable | Example |
|-------|--------------|---------|
| PostgreSQL | `POSTGRES_PASSWORD_FILE` | `/run/secrets/db_password` |
| MariaDB | `MARIADB_ROOT_PASSWORD_FILE` | `/run/secrets/root_password` |
| MySQL | `MYSQL_ROOT_PASSWORD_FILE` | `/run/secrets/root_password` |
| Redis | `REDIS_PASSWORD_FILE` | `/run/secrets/redis_password` |
| Nextcloud | `NEXTCLOUD_ADMIN_PASSWORD_FILE` | `/run/secrets/admin_password` |

Check the image's Docker Hub page or documentation for `_FILE` support.

### Full Example: App with Database

```yaml
services:
  app:
    image: myapp:v1.0.0
    restart: unless-stopped
    secrets:
      - db_password
      - app_secret_key
    environment:
      DATABASE_URL: postgres://appuser:$(cat /run/secrets/db_password)@postgres:5432/appdb
      SECRET_KEY_FILE: /run/secrets/app_secret_key
    depends_on:
      - postgres

  postgres:
    image: postgres:17.2
    restart: unless-stopped
    secrets:
      - db_password
    environment:
      POSTGRES_USER: appuser
      POSTGRES_DB: appdb
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    volumes:
      - pgdata:/var/lib/postgresql/data

secrets:
  db_password:
    file: ./secrets/db_password.txt
  app_secret_key:
    file: ./secrets/app_secret_key.txt

volumes:
  pgdata:
```

### For Apps That Don't Support _FILE Variables

Some apps only read passwords from environment variables, not files. Workaround: use an entrypoint script that reads the file and exports the env var.

Create a wrapper script:

```bash
#!/bin/sh
# entrypoint-wrapper.sh
export APP_PASSWORD=$(cat /run/secrets/app_password)
exec "$@"
```

Use it in the Compose file:

```yaml
services:
  myapp:
    image: myapp:v1.0.0
    entrypoint: ["/entrypoint-wrapper.sh"]
    command: ["myapp", "start"]
    secrets:
      - app_password
    volumes:
      - ./entrypoint-wrapper.sh:/entrypoint-wrapper.sh:ro
```

This isn't as clean but keeps the secret out of the Compose file and `.env`.

## Level 3: External Secret Stores

For advanced setups, Docker Compose can reference secrets from external stores. This is mostly relevant for Docker Swarm or integration with HashiCorp Vault. For most self-hosting setups, Level 2 (file-based secrets) is sufficient.

## Secret File Organization

Keep all secret files in a dedicated directory:

```
my-stack/
├── docker-compose.yml
├── .env                    # Non-sensitive config (ports, hostnames)
├── .gitignore              # Must include secrets/ and .env
└── secrets/
    ├── db_password.txt
    ├── app_secret_key.txt
    ├── smtp_password.txt
    └── redis_password.txt
```

Set restrictive permissions:

```bash
chmod 700 secrets/
chmod 600 secrets/*
```

Add to `.gitignore`:

```
.env
secrets/
```

## Generating Strong Secrets

Different types of secrets need different formats:

```bash
# General-purpose password (32 chars, base64)
openssl rand -base64 32

# Hex string (64 chars, for tokens/keys)
openssl rand -hex 32

# Alphanumeric only (useful for URLs and file names)
openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32

# UUID format
uuidgen
```

Write directly to a secret file:

```bash
openssl rand -base64 32 > secrets/db_password.txt
```

## Rotating Secrets

When you need to change a secret:

1. Generate a new secret value
2. Update the secret file
3. Restart the affected containers:
   ```bash
   docker compose restart postgres myapp
   ```
4. For database passwords, also update the password inside the database:
   ```bash
   docker compose exec postgres psql -U appuser -c "ALTER USER appuser PASSWORD 'new_password';"
   ```

Secret rotation with zero downtime requires application-level support (e.g., the app can reload credentials without restart). Most self-hosted apps require a restart.

## Common Mistakes

### Committing Secrets to Git

The most common mistake. Add `.env` and `secrets/` to `.gitignore` before creating any secrets. If you accidentally committed a secret, change it immediately — git history retains the old value even after deletion.

```bash
# Check if any secrets are tracked by git
git ls-files secrets/ .env
```

### Using Weak Default Passwords

Many guides show `password123` or `changeme` as examples. Always generate random passwords, even for development:

```bash
openssl rand -base64 32
```

### Same Password for Multiple Services

If your app and its database use the same password and one is compromised, both are compromised. Generate a unique password for every service.

### Overly Permissive Secret File Permissions

Secret files should be readable only by the owner:

```bash
chmod 600 secrets/*
```

If Docker needs to read them (and you're running Docker as root, which is default), the files should be owned by root with `600` permissions.

## Next Steps

- Learn Docker Compose fundamentals — [Docker Compose Basics](/foundations/docker-compose-basics)
- Understand environment variables — [Docker Environment Variables](/foundations/docker-environment-variables)
- Review your security setup — [Security Checklist](/foundations/selfhosting-security-checklist)
- Harden Docker — [Docker Security Best Practices](/foundations/docker-security)

## FAQ

### Do I need Docker Swarm for secrets?

No. Docker Compose file-based secrets (the `file:` directive) work in standalone Docker Compose without Swarm. External secrets and `docker secret create` require Swarm mode, but file-based secrets are the recommended approach for self-hosting.

### Are secrets encrypted at rest?

No. File-based secrets are plain text files on your server's filesystem. They're protected by filesystem permissions, not encryption. For encryption at rest, use full-disk encryption (LUKS) on your server.

### Can I use the same secret across multiple Compose files?

Yes, if they reference the same file path. Or use a shared secrets directory that multiple Compose stacks reference.

### What about Kubernetes secrets?

Kubernetes has its own secrets system. If you're running K3s or K8s for self-hosting (most people shouldn't), Kubernetes secrets are base64-encoded by default (not encrypted) and stored in etcd. You'd use tools like Sealed Secrets or External Secrets for better security. For most self-hosters, Docker Compose secrets are simpler and sufficient.

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Environment Variables](/foundations/docker-environment-variables)
- [Docker Security Best Practices](/foundations/docker-security)
- [Self-Hosting Security Checklist](/foundations/selfhosting-security-checklist)
- [Docker Compose Profiles](/foundations/docker-compose-profiles)
