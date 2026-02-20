---
title: "How to Self-Host Automatisch with Docker Compose"
description: "Deploy Automatisch with Docker Compose — an open-source business automation tool and self-hosted alternative to Zapier."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "automation-workflows"
apps:
  - automatisch
tags:
  - self-hosted
  - automatisch
  - docker
  - automation
  - zapier-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Automatisch?

[Automatisch](https://automatisch.io/) is an open-source (AGPLv3) business automation platform that closely resembles Zapier's interface. It provides a trigger-action workflow builder with ~40 integrations for popular services like Google Sheets, Slack, Notion, and Discord. It's designed for users who want a straightforward, self-hosted Zapier experience.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB of free disk space
- 1 GB of RAM (minimum)
- A domain name (recommended for OAuth callbacks)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  automatisch:
    image: automatischio/automatisch:0.15.0
    container_name: automatisch
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      APP_ENV: production
      HOST: ${HOST:-localhost}
      PROTOCOL: ${PROTOCOL:-http}
      PORT: 3000
      # Database
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_DATABASE: automatisch
      POSTGRES_USERNAME: automatisch
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      # Redis
      REDIS_HOST: redis
      REDIS_PORT: 6379
      # Security keys (REQUIRED — generate each with: openssl rand -base64 36)
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      WEBHOOK_SECRET_KEY: ${WEBHOOK_SECRET_KEY}
      APP_SECRET_KEY: ${APP_SECRET_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - automatisch-storage:/automatisch/storage
    networks:
      - automatisch-net

  worker:
    image: automatischio/automatisch:0.15.0
    container_name: automatisch-worker
    restart: unless-stopped
    environment:
      APP_ENV: production
      HOST: ${HOST:-localhost}
      PROTOCOL: ${PROTOCOL:-http}
      PORT: 3000
      WORKER: "true"
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_DATABASE: automatisch
      POSTGRES_USERNAME: automatisch
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      WEBHOOK_SECRET_KEY: ${WEBHOOK_SECRET_KEY}
      APP_SECRET_KEY: ${APP_SECRET_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - automatisch-storage:/automatisch/storage
    networks:
      - automatisch-net

  postgres:
    image: postgres:14.5
    container_name: automatisch-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: automatisch
      POSTGRES_USER: automatisch
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - automatisch-db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U automatisch -d automatisch"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - automatisch-net

  redis:
    image: redis:7.0.4
    container_name: automatisch-redis
    restart: unless-stopped
    volumes:
      - automatisch-redis:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - automatisch-net

volumes:
  automatisch-db:
  automatisch-redis:
  automatisch-storage:

networks:
  automatisch-net:
```

Create a `.env` file alongside:

```bash
# Your domain (used for OAuth redirect URLs)
HOST=automatisch.example.com
PROTOCOL=https

# Database password — change this
POSTGRES_PASSWORD=automatisch-secure-password

# Security keys (REQUIRED — generate each separately)
# Run: openssl rand -base64 36
ENCRYPTION_KEY=your-encryption-key-here
WEBHOOK_SECRET_KEY=your-webhook-secret-here
APP_SECRET_KEY=your-app-secret-here
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Wait ~30 seconds for database setup and migrations
2. Access Automatisch at `http://your-server:3000`
3. Log in with default credentials:
   - Email: `user@automatisch.io`
   - Password: `sample`
4. **Change the default password immediately** via Settings → Profile
5. Update your email address

## Configuration

### Creating a Flow

1. Click **"Create Flow"** from the dashboard
2. Set up a **trigger** (e.g., "When a new row is added to Google Sheets")
3. Configure the trigger by connecting your Google account
4. Add an **action** step (e.g., "Send a Slack message")
5. Map data fields from the trigger to the action
6. Test the flow, then toggle it **Active**

### Supported Integrations

| Category | Apps |
|----------|------|
| **Productivity** | Google Sheets, Notion, Todoist, Airtable |
| **Communication** | Slack, Discord, Telegram, Twilio |
| **Email** | Gmail, Mailchimp, SendGrid |
| **CRM** | HubSpot, Salesforce |
| **Development** | GitHub, GitLab |
| **Social** | Twitter/X |
| **Webhooks** | Generic webhook trigger and action |
| **Scheduling** | Cron/schedule triggers |

~40 integrations total. Fewer than n8n (400+) or Activepieces (200+), but covers the most common services.

### Connection Setup

For OAuth-based integrations (Google, Slack, etc.), you need:

1. `HOST` and `PROTOCOL` set correctly in your environment
2. A valid SSL certificate (OAuth providers require HTTPS callbacks)
3. The appropriate OAuth app credentials from each service

## Advanced Configuration (Optional)

### Custom OAuth Apps

For Google integrations, create a Google Cloud OAuth app:

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Set redirect URI to `https://your-domain.com/app/[app-key]/connection/add`
4. Add the client ID and secret in Automatisch's connection setup

### SMTP for Notifications

Automatisch sends email notifications via SMTP. Add to the environment:

```yaml
environment:
  SMTP_HOST: smtp.example.com
  SMTP_PORT: 587
  SMTP_SECURE: "false"
  SMTP_USER: your-smtp-user
  SMTP_PASSWORD: your-smtp-password
```

## Reverse Proxy

Behind [Nginx Proxy Manager](/apps/nginx-proxy-manager) or [Caddy](/apps/caddy), proxy to port 3000. HTTPS is effectively required for OAuth callbacks.

Set `HOST` and `PROTOCOL` environment variables to match your public URL.

For detailed reverse proxy setup, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Back up PostgreSQL and the storage volume:

```bash
# Database
docker exec automatisch-postgres pg_dump -U automatisch automatisch > automatisch_backup.sql

# File storage
docker run --rm -v automatisch-storage:/data -v $(pwd):/backup alpine \
  tar czf /backup/automatisch-storage.tar.gz -C /data .
```

For a full backup strategy, see [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Flows Not Executing

**Symptom:** Flows are active but never trigger.

**Fix:** Check that the worker container is running:

```bash
docker ps | grep automatisch-worker
docker logs automatisch-worker
```

The worker handles all background job execution. If it's not running, flows won't fire.

### OAuth Redirect Errors

**Symptom:** "Redirect URI mismatch" when connecting an app.

**Fix:** Ensure `HOST` and `PROTOCOL` match exactly what your OAuth app's redirect URI expects. The URL must be HTTPS and match the registered callback URL in the OAuth provider's console.

### Database Connection Errors

**Symptom:** App crashes with PostgreSQL connection refused.

**Fix:** Verify the health check is passing on the PostgreSQL container. Ensure `POSTGRES_PASSWORD` is identical in all three services (app, worker, database).

## Resource Requirements

- **RAM:** 300 MB total (app ~100 MB, worker ~100 MB, PostgreSQL ~60 MB, Redis ~40 MB)
- **CPU:** Low
- **Disk:** 500 MB for application, grows with flow execution logs

## Verdict

Automatisch is the most Zapier-like self-hosted automation tool. If you want an interface that feels familiar to Zapier users and you only need integrations with major platforms, it works. The AGPLv3 license is genuinely open source.

**The concern is development pace.** With ~40 integrations, months between releases, and a small team, Automatisch lags behind [n8n](/apps/n8n) (400+ integrations, weekly releases) and [Activepieces](/apps/activepieces) (200+ integrations, MIT license, weekly releases).

**Use Automatisch if:** You want the simplest possible Zapier replacement with AGPLv3 licensing and your workflows only use common apps.

**Consider alternatives:** [n8n](/apps/n8n) for power and integrations. [Activepieces](/apps/activepieces) for MIT licensing with more features. See [Automatisch vs n8n](/compare/automatisch-vs-n8n).

## FAQ

### Is Automatisch truly open source?

Yes. AGPLv3 is an OSI-approved open-source license. It requires sharing source code if you modify and distribute the software, but self-hosting for internal use has no restrictions.

### Why does Automatisch need a separate worker?

The worker handles background job execution (running flows, processing webhooks). Separating it from the web server ensures the UI stays responsive during heavy flow execution.

### Can Automatisch handle complex workflows?

Simple trigger-action chains work well. For complex branching, loops, or multi-step logic, n8n or Activepieces are more capable.

## Related

- [Automatisch vs n8n](/compare/automatisch-vs-n8n)
- [How to Self-Host n8n](/apps/n8n)
- [How to Self-Host Activepieces](/apps/activepieces)
- [n8n vs Activepieces](/compare/n8n-vs-activepieces)
- [Self-Hosted Alternatives to Zapier](/replace/zapier)
- [Best Self-Hosted Automation Tools](/best/automation)
- [Docker Compose Basics](/foundations/docker-compose-basics)
