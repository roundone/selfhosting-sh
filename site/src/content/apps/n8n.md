---
title: "How to Self-Host n8n with Docker Compose"
description: "Deploy n8n with Docker Compose — a powerful self-hosted workflow automation platform that replaces Zapier, Make, and IFTTT."
date: 2026-02-16
dateUpdated: 2026-02-20
category: "automation"
apps:
  - n8n
tags:
  - self-hosted
  - n8n
  - docker
  - automation
  - workflow
  - zapier-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is n8n?

[n8n](https://n8n.io/) is a self-hosted workflow automation platform. It's the best self-hosted alternative to Zapier, Make (Integromat), and IFTTT. Build automated workflows with a visual node-based editor — connect APIs, transform data, send notifications, sync databases, and automate virtually anything. n8n has 400+ integrations, supports JavaScript/Python code nodes, and can handle everything from simple webhook triggers to complex multi-step workflows with branching logic.

The key difference from Zapier: your data stays on your server, there are no per-execution fees, and you can write custom code in any workflow.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 1 GB of free RAM (2 GB recommended)
- 2 GB of free disk space
- A domain name (recommended for webhook URLs)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  n8n:
    image: n8nio/n8n:2.9.1
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      N8N_HOST: "localhost"                              # Set to your domain
      N8N_PORT: "5678"
      N8N_PROTOCOL: "https"                              # Use "http" for local access
      WEBHOOK_URL: "https://n8n.example.com/"            # Your public URL for webhooks
      N8N_ENCRYPTION_KEY: "change_this_to_random_string" # CHANGE THIS — generate with: openssl rand -hex 24
      DB_TYPE: "postgresdb"
      DB_POSTGRESDB_HOST: "n8n_db"
      DB_POSTGRESDB_PORT: "5432"
      DB_POSTGRESDB_DATABASE: "n8n"
      DB_POSTGRESDB_USER: "n8n"
      DB_POSTGRESDB_PASSWORD: "change_this_strong_password"  # Must match PostgreSQL password
      GENERIC_TIMEZONE: "America/New_York"               # Your timezone
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      n8n_db:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:5678/healthz || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  n8n_db:
    image: postgres:16-alpine
    container_name: n8n_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: n8n
      POSTGRES_PASSWORD: change_this_strong_password      # Must match DB_POSTGRESDB_PASSWORD
      POSTGRES_DB: n8n
    volumes:
      - n8n_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U n8n"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  n8n_data:
  n8n_pgdata:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:5678` in your browser
2. Create your owner account (email and password)
3. You're dropped into the workflow editor — start building

n8n uses SQLite by default if you don't configure PostgreSQL. The PostgreSQL setup above is recommended for production — it handles concurrent executions better and supports n8n's queue mode.

## Configuration

### Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_ENCRYPTION_KEY` | auto-generated | Encrypts credentials. Set explicitly and back up — losing this means losing all stored credentials. |
| `WEBHOOK_URL` | `N8N_HOST` | Public URL for incoming webhooks. Must be accessible from the internet. |
| `EXECUTIONS_DATA_PRUNE` | `true` | Auto-delete old execution data |
| `EXECUTIONS_DATA_MAX_AGE` | `336` | Hours to keep execution data (default 14 days) |
| `N8N_BASIC_AUTH_ACTIVE` | `false` | Add HTTP Basic Auth in front of n8n |
| `N8N_CONCURRENCY_PRODUCTION_LIMIT` | `-1` | Max concurrent workflow executions (-1 = unlimited) |

### Credentials Security

n8n encrypts all stored credentials (API keys, passwords, OAuth tokens) using `N8N_ENCRYPTION_KEY`. This key is critical:

- Set it explicitly in your Compose file
- Back it up separately
- If you lose it, all stored credentials become unreadable
- Generate with: `openssl rand -hex 24`

### Webhook Configuration

For workflows triggered by external webhooks, `WEBHOOK_URL` must be your publicly accessible URL:

```yaml
WEBHOOK_URL: "https://n8n.example.com/"
```

Without this, webhook URLs in your workflows will use the internal hostname, which external services can't reach.

## Advanced Configuration (Optional)

### Queue Mode (Worker Architecture)

For high-volume workflows, run n8n in queue mode with separate main and worker processes:

```yaml
  n8n:
    # ... same as above, plus:
    environment:
      EXECUTIONS_MODE: "queue"
      QUEUE_BULL_REDIS_HOST: "n8n_redis"

  n8n_worker:
    image: n8nio/n8n:2.9.1
    container_name: n8n_worker
    restart: unless-stopped
    command: worker
    environment:
      # Same database and Redis config as main instance
      EXECUTIONS_MODE: "queue"
      QUEUE_BULL_REDIS_HOST: "n8n_redis"
    volumes:
      - n8n_data:/home/node/.n8n

  n8n_redis:
    image: redis:7-alpine
    container_name: n8n_redis
    restart: unless-stopped
    volumes:
      - n8n_redis:/data
```

### SMTP for Email Notifications

```yaml
environment:
  N8N_EMAIL_MODE: "smtp"
  N8N_SMTP_HOST: "smtp.example.com"
  N8N_SMTP_PORT: "587"
  N8N_SMTP_USER: "your-email@example.com"
  N8N_SMTP_PASS: "your-smtp-password"
  N8N_SMTP_SSL: "false"
```

### External Storage for Binary Data

For workflows handling large files:

```yaml
environment:
  N8N_EXTERNAL_STORAGE_TYPE: "s3"
  N8N_EXTERNAL_STORAGE_S3_HOST: "minio.example.com"
  N8N_EXTERNAL_STORAGE_S3_BUCKET_NAME: "n8n"
  N8N_EXTERNAL_STORAGE_S3_ACCESS_KEY: "your-access-key"
  N8N_EXTERNAL_STORAGE_S3_SECRET_KEY: "your-secret-key"
```

## Reverse Proxy

Set `WEBHOOK_URL` and `N8N_HOST` to match your domain. n8n requires WebSocket support for the editor.

Nginx Proxy Manager config:
- **Scheme:** http
- **Forward Hostname:** n8n
- **Forward Port:** 5678
- **Enable WebSocket Support:** Yes (critical for the editor)

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for full configuration.

## Backup

Back up two things:

1. **PostgreSQL database** — contains workflows, credentials (encrypted), execution history:
```bash
docker compose exec n8n_db pg_dump -U n8n n8n > n8n-backup-$(date +%Y%m%d).sql
```

2. **n8n data volume** — contains the encryption key (if auto-generated) and custom nodes:
```bash
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/n8n-data-$(date +%Y%m%d).tar.gz /data
```

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a complete backup approach.

## Troubleshooting

### Webhooks Not Receiving Data

**Symptom:** External services send webhooks but n8n doesn't trigger.
**Fix:** Check `WEBHOOK_URL` — it must be your public URL with HTTPS. Verify the URL is reachable from the internet. If behind a reverse proxy, ensure WebSocket support is enabled and the proxy passes all headers.

### "Encryption key is missing" Error

**Symptom:** n8n can't decrypt stored credentials after restart or migration.
**Fix:** The `N8N_ENCRYPTION_KEY` must be the same as when the credentials were created. If you didn't set it explicitly, n8n generated one and stored it in `~/.n8n/config`. Check the data volume for the original key.

### Workflow Executions Pile Up / Memory Issues

**Symptom:** n8n memory grows over time, eventually crashes.
**Fix:** Enable execution data pruning:

```yaml
EXECUTIONS_DATA_PRUNE: "true"
EXECUTIONS_DATA_MAX_AGE: "168"    # 7 days
EXECUTIONS_DATA_SAVE_ON_ERROR: "all"
EXECUTIONS_DATA_SAVE_ON_SUCCESS: "none"  # Don't save successful execution data
```

### Container Starts But Web UI Is Blank

**Symptom:** Port 5678 responds but the editor doesn't load.
**Fix:** This is usually a reverse proxy issue. n8n's editor uses WebSockets. Ensure your proxy passes the `Upgrade` and `Connection` headers. In Nginx, add:

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

## Resource Requirements

- **RAM:** ~200 MB idle, 500 MB+ under load (depends on workflow complexity)
- **CPU:** Low idle, medium during execution (JavaScript/Python code nodes are CPU-intensive)
- **Disk:** ~300 MB for the application, PostgreSQL storage grows with execution history

## Verdict

n8n is the best self-hosted workflow automation tool. It's the closest you'll get to Zapier without paying per execution or sending your data to a third party. The visual editor is intuitive, the integration library is massive, and the ability to write custom JavaScript/Python code makes it handle edge cases that Zapier can't. The main competition is [Node-RED](/apps/node-red/) — which is more IoT/hardware focused — and [Huginn](/apps/huginn/) — which is more developer-oriented. For most workflow automation needs, n8n is the clear winner.

## Related

- [Best Self-Hosted Automation Tools](/best/automation/)
- [n8n vs Node-RED](/compare/n8n-vs-node-red/)
- [Airflow vs n8n](/compare/airflow-vs-n8n/)
- [Kestra vs n8n](/compare/kestra-vs-n8n/)
- [Temporal vs n8n](/compare/temporal-vs-n8n/)
- [Replace Zapier with Self-Hosted Automation](/replace/zapier/)
- [Replace IFTTT with Self-Hosted Automation](/replace/ifttt/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
