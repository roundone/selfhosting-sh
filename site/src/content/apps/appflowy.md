---
title: "How to Self-Host AppFlowy with Docker Compose"
description: "Deploy AppFlowy with Docker — an open-source Notion alternative with documents, databases, kanban boards, and real-time collaboration."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "note-taking"
apps:
  - appflowy
tags:
  - self-hosted
  - appflowy
  - docker
  - note-taking
  - notion-alternative
  - knowledge-base
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is AppFlowy?

[AppFlowy](https://appflowy.io/) is an open-source alternative to Notion. It provides documents with rich text editing, databases (table, kanban, calendar, grid views), and a workspace structure similar to Notion's. AppFlowy emphasizes data ownership and privacy — the entire stack can run on your own server.

AppFlowy Cloud is the self-hostable server component that provides sync, collaboration, and user management for AppFlowy desktop and mobile clients.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 4 GB of RAM minimum (8 GB recommended)
- 20 GB of free disk space
- A domain name (required for the cloud server)
- Git (to clone the deployment repository)

## Docker Compose Configuration

AppFlowy Cloud has a complex multi-service architecture. The recommended approach is to use their official deployment repository:

```bash
git clone https://github.com/AppFlowy-IO/AppFlowy-Cloud.git
cd AppFlowy-Cloud
```

Create a `.env` file based on the provided template:

```bash
cp deploy.env .env
```

Key environment variables to configure in `.env`:

```bash
# Server URL — your domain
APPFLOWY_CLOUD_BASE_URL=https://appflowy.yourdomain.com

# PostgreSQL
POSTGRES_PASSWORD=change_me_strong_password

# Redis
REDIS_PASSWORD=change_me_strong_redis_password

# Gotrue (authentication)
GOTRUE_JWT_SECRET=change_me_to_a_random_64_char_string
GOTRUE_ADMIN_EMAIL=admin@yourdomain.com
GOTRUE_ADMIN_PASSWORD=change_me_admin_password

# S3-compatible storage (MinIO included in the stack)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=change_me_strong_minio_password

# SMTP for email verification (optional but recommended)
# GOTRUE_SMTP_HOST=smtp.example.com
# GOTRUE_SMTP_PORT=587
# GOTRUE_SMTP_USER=your_smtp_user
# GOTRUE_SMTP_PASS=your_smtp_password
# GOTRUE_SMTP_ADMIN_EMAIL=admin@yourdomain.com
```

The Docker Compose stack includes:
- **AppFlowy Cloud** — the main API server
- **GoTrue** — authentication service (manages users, OAuth, email verification)
- **PostgreSQL** — primary database
- **Redis** — caching and real-time features
- **MinIO** — S3-compatible object storage for file attachments
- **Gotrue Admin** — user management panel

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Wait 2-3 minutes for all services to initialize
2. Navigate to your AppFlowy Cloud URL to verify the API is running
3. Download the AppFlowy desktop or mobile client from [appflowy.io](https://appflowy.io/)
4. In the client, select "Self-hosted" and enter your server URL
5. Create an account (or log in with the admin credentials from `.env`)
6. Start creating workspaces, documents, and databases

## Configuration

### Authentication

AppFlowy Cloud uses GoTrue for authentication, supporting:
- **Email/password** — built-in, enabled by default
- **OAuth providers** — Google, GitHub, Discord, and other OAuth2 providers
- **Magic links** — passwordless email login (requires SMTP)

Configure OAuth providers by setting the relevant environment variables in `.env`.

### Storage

MinIO handles file storage (attachments, images). It's included in the Docker Compose stack. For production, consider:
- Configuring MinIO data persistence on a separate disk
- Using an external S3-compatible service instead of the bundled MinIO

### User Management

Access the GoTrue admin panel to manage users, reset passwords, and configure authentication settings.

## Advanced Configuration (Optional)

### External S3 Storage

Replace the bundled MinIO with any S3-compatible service (AWS S3, Cloudflare R2, Backblaze B2):

```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET=appflowy
AWS_REGION=us-east-1
AWS_ENDPOINT=https://s3.amazonaws.com
```

### SMTP Configuration

Enable email verification and magic link login by configuring SMTP:

```bash
GOTRUE_SMTP_HOST=smtp.example.com
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=your_smtp_user
GOTRUE_SMTP_PASS=your_smtp_password
GOTRUE_SMTP_ADMIN_EMAIL=admin@yourdomain.com
```

## Reverse Proxy

Set up a reverse proxy to serve AppFlowy Cloud over HTTPS. Point your proxy to the AppFlowy Cloud API port (default 9000). Ensure WebSocket passthrough is enabled for real-time collaboration.

For detailed setup: [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

## Backup

Critical data to back up:
- **PostgreSQL database:** Contains all documents, user data, and workspace metadata
- **MinIO data volume:** Contains all uploaded files and attachments
- **Environment file:** Your `.env` with secrets and configuration

```bash
# Database backup
docker compose exec postgres pg_dump -U supabase appflowy > appflowy_backup.sql

# MinIO data is in the minio-data volume
```

For a complete backup strategy: [Backup Strategy](/foundations/backup-3-2-1-rule/)

## Troubleshooting

### Client can't connect to self-hosted server

**Symptom:** AppFlowy client shows connection errors.
**Fix:** Verify the `APPFLOWY_CLOUD_BASE_URL` matches exactly what you enter in the client (including `https://`). Check that all Docker services are running: `docker compose ps`. Ensure the reverse proxy is forwarding correctly.

### Authentication fails with "invalid credentials"

**Symptom:** Can't log in despite correct email/password.
**Fix:** Check GoTrue logs: `docker compose logs gotrue`. Verify the `GOTRUE_JWT_SECRET` hasn't changed since user creation. If SMTP is not configured, email verification may be blocking login — check GoTrue settings for email verification requirements.

### File uploads fail

**Symptom:** Can't upload images or attachments in documents.
**Fix:** Verify MinIO is running: `docker compose ps minio`. Check MinIO credentials match between AppFlowy Cloud and MinIO services. Ensure the MinIO bucket exists.

### High resource usage

**Symptom:** The stack uses more memory than expected.
**Fix:** AppFlowy Cloud with all services (PostgreSQL, Redis, MinIO, GoTrue, API) consumes 2-4 GB RAM total. This is expected. On constrained hardware, consider using external PostgreSQL and Redis to reduce local resource usage.

## Resource Requirements

- **RAM:** 2-4 GB for the full stack (PostgreSQL + Redis + MinIO + GoTrue + API)
- **CPU:** Moderate — multiple services running concurrently
- **Disk:** ~1 GB for the application stack, plus storage for user data and attachments

## Verdict

AppFlowy is the most feature-complete self-hosted Notion replacement available. Documents, databases, kanban boards, calendar views — it covers the core Notion feature set. The desktop and mobile clients are polished and actively developed.

The trade-off is complexity. The self-hosted stack has 5+ services compared to Outline's 3 or BookStack's 2. Resource requirements are higher. And AppFlowy is still maturing — expect occasional rough edges compared to the more established [Outline](/apps/outline/) or [BookStack](/apps/bookstack/).

Choose AppFlowy if you specifically want Notion's database/kanban features in a self-hosted package. For pure documentation/wiki, [Outline](/apps/outline/) or [BookStack](/apps/bookstack/) are simpler and more mature.

## Related

- [Best Self-Hosted Note Taking](/best/note-taking/)
- [AppFlowy vs AFFiNE](/compare/appflowy-vs-affine/)
- [How to Self-Host Outline](/apps/outline/)
- [How to Self-Host BookStack](/apps/bookstack/)
- [Replace Notion](/replace/notion/)
- [Replace Confluence](/replace/confluence/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
