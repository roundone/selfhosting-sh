---
title: "How to Self-Host Huginn with Docker Compose"
description: "Deploy Huginn with Docker Compose — a self-hosted agent system for monitoring the web, automating tasks, and acting on your behalf."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "automation-workflows"
apps:
  - huginn
tags:
  - self-hosted
  - huginn
  - docker
  - automation
  - web-monitoring
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Huginn?

[Huginn](https://github.com/huginn/huginn) is a self-hosted system for building agents that monitor the web and act on your behalf. Agents can watch websites for changes, receive webhooks, send notifications, and chain together into complex workflows. Think IFTTT or Zapier, but self-hosted and with deeper web scraping capabilities. Named after Odin's ravens from Norse mythology — Huginn ("thought") and Muninn ("memory").

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of free disk space
- 512 MB of RAM (minimum), 1 GB recommended
- A domain name (optional, for remote access)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  huginn:
    image: huginn/huginn:ac933cf5263b05499c3297b483a29483dfd4c803
    # Note: Huginn doesn't publish semantic version tags.
    # This commit hash is from the latest build as of Feb 2026.
    # Check Docker Hub for newer builds: hub.docker.com/r/huginn/huginn
    container_name: huginn
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      # Application secret (REQUIRED — generate a long random string)
      APP_SECRET_TOKEN: ${APP_SECRET_TOKEN}
      # Domain configuration
      DOMAIN: ${DOMAIN:-localhost:3000}
      PORT: 3000
      # Database — using external PostgreSQL
      DATABASE_ADAPTER: postgresql
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      HUGINN_DATABASE_NAME: huginn
      HUGINN_DATABASE_USERNAME: huginn
      HUGINN_DATABASE_PASSWORD: ${DB_PASSWORD}
      # Default admin account
      SEED_USERNAME: admin
      SEED_PASSWORD: ${ADMIN_PASSWORD:-changeme}
      # Invitation code for new signups (set to empty string to disable)
      INVITATION_CODE: ${INVITATION_CODE:-}
      # Timezone
      TIMEZONE: "UTC"
      # Email (optional — needed for email-sending agents)
      SMTP_DOMAIN: ${SMTP_DOMAIN:-}
      SMTP_SERVER: ${SMTP_SERVER:-}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_AUTHENTICATION: plain
      SMTP_USER_NAME: ${SMTP_USER:-}
      SMTP_PASSWORD: ${SMTP_PASSWORD:-}
      EMAIL_FROM_ADDRESS: ${EMAIL_FROM:-huginn@example.com}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - huginn-net

  postgres:
    image: postgres:16
    container_name: huginn-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: huginn
      POSTGRES_USER: huginn
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - huginn-db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U huginn -d huginn"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - huginn-net

volumes:
  huginn-db:

networks:
  huginn-net:
```

Create a `.env` file alongside:

```bash
# REQUIRED: Generate with: openssl rand -hex 64
APP_SECRET_TOKEN=your-long-random-secret-token-here

# Database password — change this
DB_PASSWORD=huginn-secure-password-change-me

# Admin password for the default account
ADMIN_PASSWORD=changeme

# Your domain (for links in notifications)
DOMAIN=huginn.example.com

# Invitation code (leave empty to allow open registration)
INVITATION_CODE=

# SMTP settings (optional — for email agents)
SMTP_DOMAIN=
SMTP_SERVER=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=huginn@example.com
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Wait ~30 seconds for database initialization and seeding
2. Access Huginn at `http://your-server:3000`
3. Log in with the default credentials:
   - Username: `admin`
   - Password: value of `ADMIN_PASSWORD` (default: `changeme`)
4. **Change the admin password immediately** via the account settings page
5. Explore the default agents — Huginn seeds several example agents to demonstrate capabilities

## Configuration

### Agent Types

Huginn includes ~60 agent types. The most useful:

| Agent | What It Does |
|-------|-------------|
| **WebsiteAgent** | Monitors a webpage for changes, extracts data via CSS selectors |
| **RssAgent** | Monitors RSS feeds |
| **WebhookAgent** | Receives incoming webhooks |
| **HttpStatusAgent** | Monitors URL uptime |
| **EmailAgent** | Sends email notifications |
| **SlackAgent** | Posts to Slack channels |
| **TriggerAgent** | Fires when conditions are met on incoming events |
| **SchedulerAgent** | Triggers other agents on a schedule |
| **JavaScriptAgent** | Runs custom JavaScript |
| **ShellCommandAgent** | Executes shell commands |

### Creating Your First Agent

1. Click **"New Agent"** in the nav bar
2. Select agent type (e.g., WebsiteAgent)
3. Configure the agent's options via the JSON form
4. Set a schedule (e.g., check every 2 hours)
5. Optionally set event sources (receive events from other agents)
6. Save and let it run

### Chaining Agents into Scenarios

Agents pass events to each other. A common pattern:

1. **WebsiteAgent** — monitors a price page, extracts the current price
2. **TriggerAgent** — fires when price drops below $50
3. **EmailAgent** — sends you a notification

Group related agents into **Scenarios** for organization.

## Advanced Configuration (Optional)

### Single-Process Mode

For production or to separate the web and worker processes:

```yaml
services:
  huginn-web:
    # No semver tags exist — only :latest and commit SHAs
    image: huginn/huginn-single-process:latest
    command: /scripts/init bin/rails server
    # ... same env vars as above

  huginn-worker:
    # No semver tags exist — only :latest and commit SHAs
    image: huginn/huginn-single-process:latest
    command: /scripts/init bin/threaded.rb
    # ... same env vars (no port needed)
```

### Using MySQL Instead of PostgreSQL

Change the database variables:

```yaml
environment:
  DATABASE_ADAPTER: mysql2
  DATABASE_HOST: mysql
  HUGINN_DATABASE_NAME: huginn
  HUGINN_DATABASE_USERNAME: root
  HUGINN_DATABASE_PASSWORD: ${DB_PASSWORD}
```

And replace the PostgreSQL service with MySQL 5.7.

## Reverse Proxy

Behind [Nginx Proxy Manager](/apps/nginx-proxy-manager) or [Caddy](/apps/caddy), proxy to port 3000. Set the `DOMAIN` environment variable to your public domain and `FORCE_SSL=true` if using HTTPS.

For detailed reverse proxy setup, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Back up the PostgreSQL database:

```bash
docker exec huginn-postgres pg_dump -U huginn huginn > huginn_backup.sql
```

The database contains all agents, scenarios, events, and credentials. The Docker volume `huginn-db` holds the PostgreSQL data.

For a full backup strategy, see [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Agents Not Running / Delayed Jobs Queue Empty

**Symptom:** Agents are created but never fire. The "Jobs" page shows no pending jobs.

**Fix:** The multi-process image bundles the web server and worker. If the worker isn't starting, check logs:

```bash
docker logs huginn
```

Look for errors related to DelayedJob. If using single-process mode, ensure the worker container is running.

### Database Connection Refused

**Symptom:** `PG::ConnectionBad: could not connect to server`

**Fix:** Ensure PostgreSQL is healthy before Huginn starts. The `depends_on` with `condition: service_healthy` in the Compose file handles this. If using an external database, verify the hostname, port, and credentials.

### WebsiteAgent Returns Empty Results

**Symptom:** Agent runs successfully but extracts no data.

**Fix:** The CSS selectors may not match the page structure. Use `extract` options carefully:

```json
{
  "extract": {
    "title": { "css": "h1.product-title", "value": "string(.)" },
    "price": { "css": "span.price", "value": "string(.)" }
  }
}
```

Test your selectors in the browser's developer tools first. Some sites use JavaScript rendering — Huginn fetches raw HTML and won't see JS-rendered content.

### Memory Usage Grows Over Time

**Symptom:** Huginn container memory steadily increases.

**Fix:** Huginn keeps events in the database. Set `keep_events_for` on agents (e.g., `"keep_events_for": 7` days) to auto-purge old events. Also run periodic cleanup:

```bash
docker exec huginn bundle exec rake agents:cleanup
```

## Resource Requirements

- **RAM:** 350 MB idle (Huginn) + 100 MB (PostgreSQL), up to 800 MB under load with many agents
- **CPU:** Low when idle, spikes during agent execution
- **Disk:** 500 MB for application, grows with event history

## Verdict

Huginn is a capable self-hosted automation tool with deep web scraping abilities, but its development has stalled — the last tagged release was August 2022. The agent configuration via JSON forms works but feels dated compared to visual editors like [n8n](/apps/n8n) or [Node-RED](/apps/node-red).

**Use Huginn if:** You specifically need web scraping agents, event monitoring, or you already have existing Huginn workflows. Its WebsiteAgent and event-chaining model are still powerful for monitoring use cases.

**Consider alternatives if:** You're starting fresh with workflow automation. [n8n](/apps/n8n) offers a modern visual editor, 400+ integrations, active development, and better documentation. See our [n8n vs Huginn comparison](/compare/n8n-vs-huginn).

## FAQ

### Is Huginn still maintained?

Development has slowed significantly. The Docker image still receives occasional builds, but the last tagged release was August 2022. The project is functional but not actively adding features.

### Can Huginn scrape JavaScript-rendered pages?

No. Huginn's WebsiteAgent fetches raw HTML. Sites that render content with JavaScript will return empty results. You'd need a separate headless browser setup (like Splash or Selenium) proxied through Huginn.

### How many agents can Huginn handle?

On a 1 GB RAM setup, Huginn comfortably handles 50-100 agents. The bottleneck is the DelayedJob worker — agents execute sequentially per worker thread.

## Related

- [n8n vs Huginn](/compare/n8n-vs-huginn)
- [How to Self-Host n8n](/apps/n8n)
- [How to Self-Host Node-RED](/apps/node-red)
- [Self-Hosted Alternatives to Zapier](/replace/zapier)
- [Self-Hosted Alternatives to IFTTT](/replace/ifttt)
- [Best Self-Hosted Automation Tools](/best/automation)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
