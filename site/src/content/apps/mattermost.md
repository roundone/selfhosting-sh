---
title: "How to Self-Host Mattermost with Docker"
description: "Deploy Mattermost with Docker Compose for self-hosted team chat with channels, threads, file sharing, and integrations."
date: 2026-02-19
dateUpdated: 2026-02-19
category: "communication-chat"
apps:
  - mattermost
tags:
  - self-hosted
  - mattermost
  - docker
  - team-chat
  - slack-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Mattermost?

[Mattermost](https://mattermost.com/) is a self-hosted team communication platform. It provides channels, threads, direct messages, file sharing, search, and integrations — everything Slack does, but running on your own infrastructure. The Team Edition is open source (MIT + AGPL) and free to self-host with no user limits. It replaces Slack, Microsoft Teams, and Discord for organizations that need data sovereignty. [GitHub](https://github.com/mattermost/mattermost)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 4 GB of free RAM (minimum for production)
- 10 GB of free disk space (plus storage for file uploads)
- A domain name (required for production use)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  mattermost:
    image: mattermost/mattermost-team-edition:11.4.0
    container_name: mattermost
    restart: unless-stopped
    ports:
      - "8065:8065"           # Web UI and API
      - "8443:8443/udp"       # Calls plugin (WebRTC)
      - "8443:8443/tcp"       # Calls plugin (WebRTC)
    environment:
      TZ: "UTC"
      MM_SQLSETTINGS_DRIVERNAME: "postgres"
      MM_SQLSETTINGS_DATASOURCE: "postgres://mmuser:change_this_password@mattermost_db:5432/mattermost?sslmode=disable&connect_timeout=10"
      MM_BLEVESETTINGS_INDEXDIR: "/mattermost/bleve-indexes"
      MM_SERVICESETTINGS_SITEURL: "https://chat.example.com"   # MUST match your public URL
    volumes:
      - mattermost_config:/mattermost/config
      - mattermost_data:/mattermost/data
      - mattermost_logs:/mattermost/logs
      - mattermost_plugins:/mattermost/plugins
      - mattermost_client_plugins:/mattermost/client/plugins
      - mattermost_bleve:/mattermost/bleve-indexes
    depends_on:
      mattermost_db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8065/api/v4/system/ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  mattermost_db:
    image: postgres:16-alpine
    container_name: mattermost_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: mmuser
      POSTGRES_PASSWORD: change_this_password    # Must match datasource above
      POSTGRES_DB: mattermost
    volumes:
      - mattermost_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mmuser -d mattermost"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mattermost_config:
  mattermost_data:
  mattermost_logs:
  mattermost_plugins:
  mattermost_client_plugins:
  mattermost_bleve:
  mattermost_pgdata:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8065` in your browser
2. Create the first admin account — this becomes the System Administrator
3. Create your first team
4. Invite users by sharing the team URL or sending email invitations (requires SMTP)

## Configuration

### SMTP for Email Notifications

Mattermost needs SMTP for email invitations, notifications, and password resets. Add to environment:

```yaml
environment:
  MM_EMAILSETTINGS_ENABLESIGNUPWITHEMAIL: "true"
  MM_EMAILSETTINGS_SENDEMAILNOTIFICATIONS: "true"
  MM_EMAILSETTINGS_SMTPSERVER: "smtp.example.com"
  MM_EMAILSETTINGS_SMTPPORT: "587"
  MM_EMAILSETTINGS_SMTPUSERNAME: "mattermost@example.com"
  MM_EMAILSETTINGS_SMTPPASSWORD: "your-smtp-password"
  MM_EMAILSETTINGS_CONNECTIONSECURITY: "STARTTLS"
  MM_EMAILSETTINGS_FEEDBACKEMAIL: "noreply@example.com"
```

### File Storage

By default, Mattermost stores uploaded files locally in `/mattermost/data`. For S3-compatible storage:

```yaml
environment:
  MM_FILESETTINGS_DRIVERNAME: "amazons3"
  MM_FILESETTINGS_AMAZONS3ACCESSKEYID: "your-access-key"
  MM_FILESETTINGS_AMAZONS3SECRETACCESSKEY: "your-secret-key"
  MM_FILESETTINGS_AMAZONS3BUCKET: "mattermost-files"
  MM_FILESETTINGS_AMAZONS3ENDPOINT: "s3.amazonaws.com"
  MM_FILESETTINGS_AMAZONS3REGION: "us-east-1"
```

Works with MinIO, Garage, or any S3-compatible storage.

### Push Notifications

For mobile push notifications, use the Mattermost Push Notification Service (MPNS). The free Team Edition uses Mattermost's hosted push proxy:

```yaml
environment:
  MM_EMAILSETTINGS_PUSHNOTIFICATIONSERVER: "https://push-test.mattermost.com"
```

For production, consider the self-hosted push proxy or the `https://push.mattermost.com` production server (requires a Mattermost account).

### Plugins

Mattermost has a plugin marketplace. Install plugins from the System Console under **Plugins → Plugin Marketplace**. Popular plugins:

- **Calls** — Audio/video calls and screen sharing (built-in since v7)
- **Jitsi** — Jitsi Meet integration
- **GitHub** — Link PR/issue notifications to channels
- **Boards** — Kanban-style project management (built-in)
- **Playbooks** — Incident response and runbooks (built-in)

### SSO / OIDC

For single sign-on with Keycloak, Authentik, or other OIDC providers:

```yaml
environment:
  MM_OPENIDSETTINGS_ENABLE: "true"
  MM_OPENIDSETTINGS_DISCOVERURL: "https://keycloak.example.com/realms/mattermost/.well-known/openid-configuration"
  MM_OPENIDSETTINGS_ID: "mattermost-client-id"
  MM_OPENIDSETTINGS_SECRET: "mattermost-client-secret"
```

## Reverse Proxy

Set `MM_SERVICESETTINGS_SITEURL` to your public URL with HTTPS:

```yaml
MM_SERVICESETTINGS_SITEURL: "https://chat.example.com"
```

Nginx Proxy Manager config:
- **Scheme:** http
- **Forward Hostname:** mattermost
- **Forward Port:** 8065
- **Enable WebSocket Support:** Yes (required for real-time updates)

For the Calls plugin, also forward UDP/TCP port 8443 directly (cannot go through an HTTP proxy).

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for full configuration.

## Backup

```bash
# Database backup
docker compose exec mattermost_db pg_dump -U mmuser mattermost > mattermost-backup-$(date +%Y%m%d).sql

# File uploads and config
docker run --rm \
  -v mattermost_config:/config \
  -v mattermost_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/mattermost-files-$(date +%Y%m%d).tar.gz /config /data
```

Critical data to back up:
- PostgreSQL database (all messages, users, channels, settings)
- `/mattermost/config` (server configuration)
- `/mattermost/data` (file uploads, attachments)

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a comprehensive approach.

## Troubleshooting

### "Unable to Connect to Database" on Startup

**Symptom:** Mattermost container exits with database connection errors.
**Fix:** Verify the `MM_SQLSETTINGS_DATASOURCE` connection string matches your PostgreSQL credentials exactly. Ensure the database container is healthy before Mattermost starts — the `depends_on` with `condition: service_healthy` handles this. Give PostgreSQL 30-60 seconds to initialize on first run.

### WebSocket Connection Errors

**Symptom:** Browser console shows WebSocket connection failures. Messages don't update in real-time.
**Fix:** Your reverse proxy must support WebSocket connections. In Nginx, ensure `proxy_set_header Upgrade $http_upgrade;` and `proxy_set_header Connection "upgrade";` are set. In Nginx Proxy Manager, enable WebSocket Support.

### Push Notifications Not Working

**Symptom:** Mobile app doesn't receive notifications.
**Fix:** Verify `MM_EMAILSETTINGS_PUSHNOTIFICATIONSERVER` is set. The test server (`push-test.mattermost.com`) has rate limits — for production, use the production push proxy. Ensure `MM_SERVICESETTINGS_SITEURL` is set correctly — the push proxy uses this to route notifications.

### File Uploads Fail

**Symptom:** "Unable to upload file" or timeout errors.
**Fix:** Check disk space on the server. Verify volume mounts are correct. If behind a reverse proxy, increase `client_max_body_size` (default 50 MB). Mattermost's default file size limit is 100 MB — configurable via `MM_FILESETTINGS_MAXFILESIZE`.

### Search Not Returning Results

**Symptom:** Messages exist but search finds nothing.
**Fix:** Bleve search indexes may need rebuilding. Go to **System Console → Experimental → Bleve → Purge and Rebuild**. Ensure `MM_BLEVESETTINGS_INDEXDIR` is set and the volume is mounted.

## Resource Requirements

- **RAM:** 1 GB idle, 2-4 GB under moderate load (50-100 active users)
- **CPU:** 2 cores minimum, 4 recommended for 100+ users
- **Disk:** ~500 MB for the application, plus storage for file uploads and database

## Verdict

Mattermost is the best self-hosted Slack alternative for teams that need full-featured chat with integrations. The Team Edition gives you channels, threads, search, file sharing, plugins, and even built-in audio/video calls — all for free with no user limits. It's more resource-heavy than lighter options like [Rocket.Chat](/apps/rocket-chat/), but the trade-off is a polished, enterprise-ready experience.

For personal or small homelab use, Mattermost is overkill — look at [Matrix/Element](/apps/element/) for a federated option or [ntfy](/apps/ntfy/) for just notifications. For teams of 10-500 who want a self-hosted Slack replacement, Mattermost is the clear winner.

## FAQ

### Mattermost Team Edition vs Enterprise Edition?

Team Edition is fully open source (MIT license) and free. Enterprise Edition adds LDAP group sync, advanced compliance features, custom branding, and high-availability clustering. Most self-hosting users are well-served by Team Edition.

### Can I migrate from Slack to Mattermost?

Yes. Mattermost has a Slack import tool that brings over channels, messages, and users. Export from Slack using their API, then import through **System Console → Import → Slack**. File attachments require additional steps.

### Does Mattermost support end-to-end encryption?

Not natively. Messages are encrypted in transit (TLS) and at rest (database encryption), but E2EE for individual messages is not built in. Since you control the server, you control the data.

### How many users can Mattermost handle?

The Team Edition with PostgreSQL comfortably handles 500-1000 users on a 4-core, 8 GB RAM server. For 1000+ users, the Enterprise Edition's high-availability features become important.

## Related

- [Best Self-Hosted Team Chat](/best/communication/)
- [Mattermost vs Rocket.Chat](/compare/mattermost-vs-rocket-chat/)
- [Mattermost vs Slack Alternatives](/compare/mattermost-vs-slack-alternatives/)
- [Self-Hosted Alternatives to Slack](/replace/slack/)
- [Self-Hosted Alternatives to Microsoft Teams](/replace/microsoft-teams/)
- [How to Self-Host Element (Matrix)](/apps/element/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
