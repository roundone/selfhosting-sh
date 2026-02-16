---
title: "How to Self-Host Joplin Server with Docker"
description: "Deploy Joplin Server with Docker Compose — sync your Joplin notes across devices with your own private server and end-to-end encryption."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "note-taking-knowledge"
apps:
  - joplin-server
tags:
  - self-hosted
  - joplin
  - docker
  - note-taking
  - sync
  - evernote-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Joplin Server?

[Joplin Server](https://joplinapp.org/) is the official sync backend for Joplin, an open-source note-taking application. Joplin itself is a desktop and mobile app (Windows, macOS, Linux, iOS, Android) that supports Markdown, end-to-end encryption, notebooks, tags, and to-do lists. Joplin Server replaces cloud sync services (Dropbox, OneDrive, Nextcloud) with a self-hosted sync target that gives you complete control over your data.

The server handles synchronization between Joplin clients. You write and read notes in the Joplin desktop/mobile apps, and the server keeps everything in sync. The server also provides a web interface for basic note viewing and sharing.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of RAM minimum
- 5 GB of free disk space (scales with note and attachment volume)
- A domain name (required for HTTPS sync)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  joplin-server:
    image: joplin/server:3.2.1
    ports:
      - "22300:22300"
    environment:
      APP_PORT: 22300
      APP_BASE_URL: ${APP_BASE_URL}
      DB_CLIENT: pg
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_DATABASE: joplin
      POSTGRES_USER: joplin
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      MAILER_ENABLED: 0
      # Uncomment to enable email notifications:
      # MAILER_ENABLED: 1
      # MAILER_HOST: smtp.example.com
      # MAILER_PORT: 587
      # MAILER_SECURITY: starttls
      # MAILER_AUTH_USER: ${SMTP_USER}
      # MAILER_AUTH_PASSWORD: ${SMTP_PASSWORD}
      # MAILER_NOREPLY_EMAIL: joplin@yourdomain.com
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: joplin
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: joplin
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U joplin -d joplin"]
      interval: 10s
      timeout: 3s
      retries: 3
    restart: unless-stopped

volumes:
  postgres-data:
```

Create a `.env` file alongside:

```bash
# The full URL where Joplin Server is accessible (no trailing slash)
APP_BASE_URL=https://joplin.yourdomain.com

# PostgreSQL password — use a strong random password
POSTGRES_PASSWORD=change_me_strong_password
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Navigate to your Joplin Server URL (e.g., `https://joplin.yourdomain.com`)
2. Log in with the default admin credentials:
   - **Email:** `admin@localhost`
   - **Password:** `admin`
3. **Change the admin password immediately** — go to Admin → Users → admin → Change Password
4. Create user accounts for each person who will sync notes
5. Each user gets their own email and password for connecting Joplin clients

### Connecting Joplin Desktop/Mobile

1. Open Joplin on your device
2. Go to **Tools → Options → Synchronization** (desktop) or **Settings → Sync** (mobile)
3. Set **Synchronization target** to "Joplin Server"
4. Enter:
   - **Joplin Server URL:** `https://joplin.yourdomain.com`
   - **Email:** Your user email
   - **Password:** Your user password
5. Click "Check synchronization configuration" to verify
6. Click "Synchronize" — your notes sync to the server

## Configuration

### End-to-End Encryption

Joplin supports end-to-end encryption (E2EE) configured in the Joplin desktop/mobile clients (not on the server). When enabled, notes are encrypted before leaving your device — the server stores encrypted blobs and cannot read your content.

Enable in Joplin client: **Tools → Options → Encryption → Enable encryption**

Set a master password. All connected devices must use the same master password to decrypt notes.

### User Management

The admin panel at `/admin` provides:
- Create/delete users
- Set storage quotas per user (e.g., 1 GB, 10 GB, unlimited)
- Monitor user storage usage
- View sync activity

### File Size Limits

By default, Joplin Server limits upload size. Set `MAX_ASSET_SIZE` in bytes to increase:

```yaml
environment:
  MAX_ASSET_SIZE: 209715200  # 200 MB
```

## Advanced Configuration (Optional)

### Email Configuration

Enable email for user registration confirmations and password resets:

```yaml
environment:
  MAILER_ENABLED: 1
  MAILER_HOST: smtp.example.com
  MAILER_PORT: 587
  MAILER_SECURITY: starttls
  MAILER_AUTH_USER: your_smtp_user
  MAILER_AUTH_PASSWORD: your_smtp_password
  MAILER_NOREPLY_EMAIL: noreply@yourdomain.com
```

### Storage Backend

By default, Joplin Server stores note content and attachments in PostgreSQL. For very large deployments, you can configure S3-compatible storage. Check the [Joplin Server documentation](https://joplinapp.org/help/install/server/) for S3 configuration details.

## Reverse Proxy

Set up a reverse proxy to access Joplin Server over HTTPS. Point your proxy to port 22300. HTTPS is strongly recommended — sync credentials are sent with every request.

Ensure the `APP_BASE_URL` matches the external URL exactly.

For detailed setup: [Reverse Proxy Setup](/foundations/reverse-proxy)

## Backup

Critical data to back up:

- **PostgreSQL database:** `docker compose exec postgres pg_dump -U joplin joplin > joplin_backup.sql` — this contains all notes and attachments
- **Environment file:** Your `.env` with the database password and URL

Restore: `cat joplin_backup.sql | docker compose exec -T postgres psql -U joplin joplin`

Note: If you use Joplin's E2EE, the database backup contains encrypted data. You need the master password to decrypt after restore.

For a complete backup strategy: [Backup Strategy](/foundations/backup-strategy)

## Troubleshooting

### Sync fails with "403 Forbidden"

**Symptom:** Joplin client shows 403 when trying to sync.
**Fix:** Verify the email and password are correct. Check that the user account exists and is enabled in the admin panel. Ensure `APP_BASE_URL` matches the URL you're using in the client exactly (including `https://`).

### "Connection refused" when syncing

**Symptom:** Client can't connect to the server.
**Fix:** Check that Joplin Server is running: `docker compose ps`. Verify port 22300 is accessible. If behind a reverse proxy, ensure the proxy is forwarding correctly to port 22300.

### Large sync takes very long or times out

**Symptom:** Initial sync with many notes (1000+) is extremely slow or fails.
**Fix:** Increase `MAX_TIME_DRIFT` if clients have clock differences. For the initial sync, use a wired connection. Consider increasing PostgreSQL's `work_mem` for large databases. The first sync is always the slowest.

### Default admin login doesn't work

**Symptom:** `admin@localhost` / `admin` is rejected.
**Fix:** This only works on the very first login. If you've already initialized the server and forgot the password, you'll need to reset it via the database: `docker compose exec postgres psql -U joplin -d joplin -c "UPDATE users SET password = '' WHERE email = 'admin@localhost';"` then set a new password through the web UI.

### E2EE "Master password required" on new device

**Symptom:** After setting up a new device, notes appear but are encrypted.
**Fix:** Go to Tools → Options → Encryption and enter the master password. All devices must use the same master password to decrypt E2EE notes.

## Resource Requirements

- **RAM:** ~150 MB idle, 300-500 MB under active sync load
- **CPU:** Low — spikes during bulk sync operations
- **Disk:** ~100 MB for the application, plus your note data (attachments can add up quickly)

## Verdict

Joplin Server is the best self-hosted sync solution if you're already using or planning to use Joplin as your note-taking app. The client apps are solid (especially the desktop app), Markdown support is excellent, and E2EE provides genuine privacy.

The main limitation is that Joplin Server is primarily a sync backend — the web interface is basic. If you want a full web-based note experience, [Outline](/apps/outline) or [BookStack](/apps/bookstack) are better. If you want a personal knowledge base with hierarchical notes and relation maps, [Trilium](/apps/trilium) offers more organizational power. But for syncing Markdown notes across devices with end-to-end encryption, Joplin Server is the right tool.

## Related

- [Best Self-Hosted Note Taking](/best/note-taking)
- [Trilium vs Joplin](/compare/trilium-vs-joplin)
- [How to Self-Host Trilium Notes](/apps/trilium)
- [How to Self-Host BookStack](/apps/bookstack)
- [Replace Evernote](/replace/evernote)
- [Replace OneNote](/replace/onenote)
- [Replace Notion](/replace/notion)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
