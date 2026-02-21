---
title: "How to Self-Host Gitea with Docker Compose"
description: "Deploy Gitea with Docker Compose — a lightweight, self-hosted Git service that replaces GitHub, GitLab, and Bitbucket."
date: 2026-02-16
dateUpdated: 2026-02-20
category: "git-code-hosting"
apps:
  - gitea
tags:
  - self-hosted
  - gitea
  - docker
  - git
  - github-alternative
  - code-hosting
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Gitea?

[Gitea](https://gitea.io/) is a lightweight, self-hosted Git service. It provides repository hosting, pull requests, issue tracking, CI/CD (Gitea Actions), package registries, and a web-based code editor — everything you need from GitHub or GitLab, running on your own hardware. Gitea is written in Go, compiles to a single binary, and runs on minimal resources. It's the most popular self-hosted GitHub alternative alongside its fork Forgejo.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 512 MB of free RAM (1 GB recommended)
- 2 GB of free disk space (plus storage for repositories)
- A domain name (recommended for SSH access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  gitea:
    image: gitea/gitea:1.25.4
    container_name: gitea
    restart: unless-stopped
    ports:
      - "3000:3000"    # Web UI
      - "2222:22"      # SSH (use non-standard port to avoid conflict with host SSH)
    environment:
      USER_UID: "1000"
      USER_GID: "1000"
      GITEA__database__DB_TYPE: "postgres"
      GITEA__database__HOST: "gitea_db:5432"
      GITEA__database__NAME: "gitea"
      GITEA__database__USER: "gitea"
      GITEA__database__PASSWD: "change_this_strong_password"   # Must match PostgreSQL
      GITEA__server__ROOT_URL: "http://localhost:3000"         # Set to your public URL
      GITEA__server__SSH_DOMAIN: "localhost"                    # Set to your domain
      GITEA__server__SSH_PORT: "2222"
    volumes:
      - gitea_data:/data
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    depends_on:
      gitea_db:
        condition: service_healthy

  gitea_db:
    image: postgres:16-alpine
    container_name: gitea_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: gitea
      POSTGRES_PASSWORD: change_this_strong_password           # Must match GITEA__database__PASSWD
      POSTGRES_DB: gitea
    volumes:
      - gitea_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gitea"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  gitea_data:
  gitea_pgdata:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:3000` in your browser
2. Gitea shows the installation wizard:
   - Database settings are pre-filled from environment variables
   - Set **Site Title** and **SSH Server Domain**
   - Set **Gitea Base URL** to your public URL
   - Create an admin account
3. Click **Install Gitea**
4. You're ready to create repositories

## Configuration

### SSH Access

Gitea supports SSH for Git operations. The Docker setup maps port 2222 to avoid conflicting with the host's SSH:

```bash
# Clone via SSH
git clone ssh://git@your-server:2222/username/repo.git

# Or configure SSH config (~/.ssh/config):
Host gitea
    HostName your-server
    Port 2222
    User git
```

### Gitea Actions (CI/CD)

Gitea Actions is compatible with GitHub Actions workflows. Enable it:

1. Edit `app.ini` or set environment variables:
```yaml
environment:
  GITEA__actions__ENABLED: "true"
```

2. Register a runner:
```yaml
  gitea_runner:
    image: gitea/act_runner:0.2.11
    container_name: gitea_runner
    restart: unless-stopped
    environment:
      GITEA_INSTANCE_URL: "http://gitea:3000"
      GITEA_RUNNER_REGISTRATION_TOKEN: "your-registration-token"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

Get the registration token from **Site Administration → Runners**.

### Email Notifications

```yaml
environment:
  GITEA__mailer__ENABLED: "true"
  GITEA__mailer__PROTOCOL: "smtps"
  GITEA__mailer__SMTP_ADDR: "smtp.example.com"
  GITEA__mailer__SMTP_PORT: "465"
  GITEA__mailer__USER: "your-email@example.com"
  GITEA__mailer__PASSWD: "your-email-password"
  GITEA__mailer__FROM: "gitea@example.com"
```

### Package Registry

Gitea includes built-in package registries for Docker, npm, PyPI, Maven, NuGet, Cargo, and more. No additional configuration needed — push packages via the standard tooling.

## Advanced Configuration (Optional)

### OAuth2/OIDC Authentication

```yaml
environment:
  GITEA__service__DISABLE_REGISTRATION: "true"
  GITEA__openid__ENABLE_OPENID_SIGNIN: "true"
```

Configure OAuth providers under **Site Administration → Authentication Sources**.

### LFS (Large File Storage)

```yaml
environment:
  GITEA__server__LFS_START_SERVER: "true"
  GITEA__lfs__STORAGE_TYPE: "local"
  GITEA__lfs__PATH: "/data/lfs"
```

### Mirror Repositories

Gitea can mirror repositories from GitHub, GitLab, or any Git remote. Create a new migration under **+** → **New Migration** and select the mirror option.

## Reverse Proxy

Set `ROOT_URL` and `SSH_DOMAIN`:

```yaml
GITEA__server__ROOT_URL: "https://git.example.com"
GITEA__server__SSH_DOMAIN: "git.example.com"
```

Nginx Proxy Manager config:
- **Scheme:** http
- **Forward Hostname:** gitea
- **Forward Port:** 3000
- **Enable WebSocket Support:** Yes

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for full configuration.

## Backup

```bash
# Use Gitea's built-in backup command
docker compose exec -u git gitea /usr/local/bin/gitea dump -c /data/gitea/conf/app.ini

# Or back up PostgreSQL separately
docker compose exec gitea_db pg_dump -U gitea gitea > gitea-backup-$(date +%Y%m%d).sql
```

The `gitea dump` command creates a ZIP with repositories, database, configuration, and LFS data.

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a complete backup approach.

## Troubleshooting

### SSH Connection Refused

**Symptom:** `ssh: connect to host ... port 2222: Connection refused`
**Fix:** Check that port 2222 is mapped in Docker and not blocked by your firewall. Verify with `docker compose port gitea 22`.

### "Repository Not Found" After Clone

**Symptom:** Push/pull works via HTTPS but SSH returns "repository not found."
**Fix:** Ensure `SSH_DOMAIN` and `SSH_PORT` in Gitea's config match your actual SSH endpoint. Check that the SSH keys are configured under your Gitea profile.

### Actions Runner Not Connecting

**Symptom:** Runner shows as offline in the admin panel.
**Fix:** Verify the registration token is correct. Ensure the runner can reach `GITEA_INSTANCE_URL` on the Docker network. Check runner logs: `docker compose logs gitea_runner`.

### Slow Repository Browsing

**Symptom:** Viewing large repositories in the web UI is slow.
**Fix:** Git operations on large repos are CPU-intensive. Ensure adequate CPU resources. For very large repos, enable Git LFS to keep the main repository small.

## Resource Requirements

- **RAM:** ~100 MB idle, ~300 MB under load
- **CPU:** Low idle, moderate during Git operations (push/pull, Actions)
- **Disk:** ~200 MB for Gitea, plus storage for repositories

## Verdict

Gitea is the best lightweight self-hosted Git platform. It gives you 90% of GitHub's features at 10% of GitLab's resource usage. The Go binary is fast, the web UI is clean, and Gitea Actions provides CI/CD without an external service. If you need a heavier platform with built-in DevOps features (container registry, monitoring, etc.), look at [GitLab CE](/apps/gitlab-ce/). If you want a community-governed fork, check [Forgejo](/apps/forgejo/). For most self-hosters, Gitea hits the sweet spot.

## Related

- [Best Self-Hosted Git Platforms](/best/git-hosting/)
- [Gitea vs Forgejo](/compare/gitea-vs-forgejo/)
- [Gitea vs GitLab](/compare/gitea-vs-gitlab/)
- [Replace GitHub with Self-Hosted Git](/replace/github/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
