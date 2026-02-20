---
title: "How to Self-Host Activepieces with Docker Compose"
description: "Deploy Activepieces with Docker Compose — an open-source workflow automation platform and self-hosted Zapier alternative."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "automation"
apps:
  - activepieces
tags:
  - self-hosted
  - activepieces
  - docker
  - automation
  - zapier-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Activepieces?

[Activepieces](https://www.activepieces.com/) is an open-source (MIT) workflow automation platform designed to replace Zapier. It has a clean step-by-step flow builder, 200+ integrations called "pieces," and supports branching, loops, and code steps. It's one of the fastest-growing self-hosted automation tools, positioning itself as the truly open-source alternative to n8n and Zapier.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB of free disk space
- 1 GB of RAM (minimum)
- A domain name (optional, for webhooks and remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  activepieces:
    image: ghcr.io/activepieces/activepieces:0.77.8
    container_name: activepieces
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      # Encryption key (REQUIRED — 32 hex characters)
      # Generate with: openssl rand -hex 16
      AP_ENCRYPTION_KEY: ${AP_ENCRYPTION_KEY}
      # JWT secret (REQUIRED)
      # Generate with: openssl rand -hex 32
      AP_JWT_SECRET: ${AP_JWT_SECRET}
      # Frontend URL (set to your public URL)
      AP_FRONTEND_URL: ${AP_FRONTEND_URL:-http://localhost:8080}
      # PostgreSQL connection
      AP_POSTGRES_DATABASE: activepieces
      AP_POSTGRES_HOST: postgres
      AP_POSTGRES_PORT: 5432
      AP_POSTGRES_USERNAME: activepieces
      AP_POSTGRES_PASSWORD: ${AP_POSTGRES_PASSWORD}
      # Redis connection
      AP_REDIS_HOST: redis
      AP_REDIS_PORT: 6379
      # Execution settings
      AP_EXECUTION_MODE: UNSANDBOXED
      AP_ENVIRONMENT: prod
      # Telemetry (disable if desired)
      AP_TELEMETRY_ENABLED: "false"
      # Polling interval (seconds)
      AP_TRIGGER_DEFAULT_POLL_INTERVAL: 5
      # Webhook timeout
      AP_WEBHOOK_TIMEOUT_SECONDS: 30
      # Flow execution timeout
      AP_FLOW_TIMEOUT_SECONDS: 600
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - activepieces-cache:/usr/src/app/cache
    networks:
      - activepieces-net

  postgres:
    image: postgres:14.4
    container_name: activepieces-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: activepieces
      POSTGRES_USER: activepieces
      POSTGRES_PASSWORD: ${AP_POSTGRES_PASSWORD}
    volumes:
      - activepieces-db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U activepieces -d activepieces"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - activepieces-net

  redis:
    image: redis:7.0.7
    container_name: activepieces-redis
    restart: unless-stopped
    volumes:
      - activepieces-redis:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - activepieces-net

volumes:
  activepieces-db:
  activepieces-redis:
  activepieces-cache:

networks:
  activepieces-net:
```

Create a `.env` file alongside:

```bash
# REQUIRED: Generate encryption key (32 hex characters)
# Run: openssl rand -hex 16
AP_ENCRYPTION_KEY=your-32-hex-char-key-here

# REQUIRED: Generate JWT secret
# Run: openssl rand -hex 32
AP_JWT_SECRET=your-jwt-secret-here

# REQUIRED: Database password — change this
AP_POSTGRES_PASSWORD=activepieces-secure-password

# Your public URL (important for webhooks)
AP_FRONTEND_URL=http://localhost:8080
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Wait ~30 seconds for database migrations
2. Access Activepieces at `http://your-server:8080`
3. Create your admin account on the registration page
4. The first registered user becomes the platform admin
5. You'll be guided through creating your first flow

## Configuration

### Creating a Flow

1. Click **"New Flow"** from the dashboard
2. Select a trigger (Schedule, Webhook, or app-specific trigger)
3. Add steps: click **"+"** to add actions
4. Configure each step with the required credentials and parameters
5. Test the flow with sample data
6. **Publish** to activate the flow

### Connecting Apps

Activepieces uses OAuth or API keys for connections:

1. Click on a step that requires authentication
2. Click **"New Connection"**
3. Follow the OAuth flow or enter the API key
4. The connection is encrypted and stored for reuse across flows

### Supported Pieces (Integrations)

200+ integrations including:

| Category | Examples |
|----------|---------|
| **Communication** | Slack, Discord, Telegram, Gmail, Microsoft Teams |
| **Productivity** | Google Sheets, Notion, Airtable, Todoist |
| **CRM** | HubSpot, Salesforce, Pipedrive |
| **Development** | GitHub, GitLab, Jira, Linear |
| **Marketing** | Mailchimp, SendGrid, Facebook Ads |
| **Storage** | Google Drive, Dropbox, S3 |
| **AI** | OpenAI, Anthropic, Hugging Face |

### Execution Modes

- **UNSANDBOXED** (default): Flows run in the main process. Simpler, lower resource usage.
- **SANDBOXED**: Each flow execution runs in isolation. More secure but requires Docker socket access.

## Advanced Configuration (Optional)

### External SMTP for Notifications

Add to the Activepieces environment:

```yaml
environment:
  AP_SMTP_HOST: smtp.example.com
  AP_SMTP_PORT: 587
  AP_SMTP_USER: your-smtp-user
  AP_SMTP_PASSWORD: your-smtp-password
  AP_SMTP_SENDER_EMAIL: activepieces@example.com
```

### Custom Pieces

Activepieces supports creating custom pieces (integrations) using TypeScript. See the [pieces framework documentation](https://www.activepieces.com/docs/developers/overview) for building your own integrations.

## Reverse Proxy

Behind [Nginx Proxy Manager](/apps/nginx-proxy-manager) or [Caddy](/apps/caddy), proxy to port 8080. Set `AP_FRONTEND_URL` to your public HTTPS URL — this is critical for webhook URLs.

For detailed reverse proxy setup, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Back up PostgreSQL and Redis data:

```bash
# Database backup
docker exec activepieces-postgres pg_dump -U activepieces activepieces > activepieces_backup.sql

# Redis backup (optional — mostly cache)
docker exec activepieces-redis redis-cli BGSAVE
```

The database contains all flows, connections (encrypted), and execution history. For a full backup strategy, see [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Flows Not Triggering

**Symptom:** Published flows with schedule or webhook triggers don't fire.

**Fix:** Check that `AP_FRONTEND_URL` matches your actual URL. Webhook triggers require the URL to be reachable from the source. For schedule triggers, check container logs:

```bash
docker logs activepieces
```

### High CPU Every 15 Minutes

**Symptom:** CPU spikes every 15 minutes.

**Fix:** This is a known issue in v0.78.x. Use v0.77.8 instead, which is stable. See the [GitHub issues](https://github.com/activepieces/activepieces/issues) for status.

### Connection OAuth Fails

**Symptom:** OAuth redirect fails or returns an error.

**Fix:** Ensure `AP_FRONTEND_URL` is set correctly and accessible from your browser. OAuth callbacks redirect to this URL. If using a reverse proxy, HTTPS must be properly configured.

### Database Migration Errors on Startup

**Symptom:** Container crashes with migration errors after an upgrade.

**Fix:** Always back up your database before upgrading. If migrations fail, restore from backup and check the release notes for migration requirements.

## Resource Requirements

- **RAM:** 200 MB idle (Activepieces) + 100 MB (PostgreSQL) + 50 MB (Redis). ~500 MB under active flow execution.
- **CPU:** Low when idle, moderate during flow execution
- **Disk:** 600 MB for application, grows with execution history

## Verdict

Activepieces is the best truly open-source (MIT) workflow automation platform available. Its step-by-step builder is more intuitive than n8n's canvas for simple workflows, and the 200+ integration library covers most common use cases. The MIT license means no restrictions on commercial use or modification.

**Use Activepieces if:** You want open-source licensing, a clean UI, and standard business workflow automation. It's the closest self-hosted experience to Zapier.

**Consider n8n instead if:** You need more integrations (400+), advanced error handling, code execution in Python, or more mature multi-user features. See our [n8n vs Activepieces comparison](/compare/n8n-vs-activepieces).

## FAQ

### Is Activepieces free for commercial use?

Yes. Activepieces uses the MIT license, which allows commercial use, modification, and redistribution without restrictions. The paid cloud version adds hosting and support.

### How does Activepieces compare to Zapier?

Activepieces covers the core Zapier workflow: trigger → action → action. It supports branching, loops, and webhooks. Zapier has more integrations (6,000+) and a more mature platform, but Activepieces is free, self-hosted, and growing fast.

### Can I import flows from Zapier or n8n?

No direct import. You'll need to recreate workflows manually. Activepieces' UI is similar enough to Zapier that the mental model transfers easily.

## Related

- [n8n vs Activepieces](/compare/n8n-vs-activepieces)
- [How to Self-Host n8n](/apps/n8n)
- [How to Self-Host Node-RED](/apps/node-red)
- [How to Self-Host Huginn](/apps/huginn)
- [Self-Hosted Alternatives to Zapier](/replace/zapier)
- [Self-Hosted Alternatives to IFTTT](/replace/ifttt)
- [Best Self-Hosted Automation Tools](/best/automation)
- [Docker Compose Basics](/foundations/docker-compose-basics)
