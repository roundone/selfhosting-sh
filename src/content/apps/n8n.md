---
title: "How to Self-Host n8n with Docker Compose"
type: "app-guide"
app: "n8n"
category: "automation"
replaces: "Zapier"
difficulty: "intermediate"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up n8n, the self-hosted Zapier alternative, with Docker Compose for workflow automation."
officialUrl: "https://n8n.io"
githubUrl: "https://github.com/n8n-io/n8n"
defaultPort: 5678
minRam: "512MB"
---

## What is n8n?

n8n (pronounced "nodemation") is a workflow automation tool that connects apps and services together. It's the self-hosted alternative to Zapier, Make, and IFTTT. Build automated workflows with a visual node-based editor — no coding required. "When I get a new email with an attachment, save it to Nextcloud and notify me on Telegram" — that's an n8n workflow.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- A server with at least 512MB RAM ([best mini PCs for self-hosting](/hardware/best-mini-pc/))
- Optional: a domain for webhook URLs

## Docker Compose Configuration

```yaml
# docker-compose.yml for n8n
# Tested with n8n 1.30+

services:
  n8n:
    container_name: n8n
    image: docker.n8n.io/n8nio/n8n:latest
    ports:
      - "5678:5678"
    volumes:
      - ./data:/home/node/.n8n
    environment:
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=https://n8n.yourdomain.com/
      - GENERIC_TIMEZONE=America/New_York
      # Database (default is SQLite, use Postgres for production)
      # - DB_TYPE=postgresdb
      # - DB_POSTGRESDB_HOST=db
      # - DB_POSTGRESDB_PORT=5432
      # - DB_POSTGRESDB_DATABASE=n8n
      # - DB_POSTGRESDB_USER=n8n
      # - DB_POSTGRESDB_PASSWORD=${DB_PASSWORD}
    restart: unless-stopped
```

## Step-by-Step Setup

1. **Create a directory:**
   ```bash
   mkdir ~/n8n && cd ~/n8n
   ```

2. **Create the `docker-compose.yml`** with the config above.

3. **Start the container:**
   ```bash
   docker compose up -d
   ```

4. **Access the editor** at `http://your-server-ip:5678`

5. **Create your account** on first visit.

6. **Build your first workflow:**
   - Click "Add workflow"
   - Add a trigger node (Schedule, Webhook, Email, etc.)
   - Add action nodes (HTTP request, send email, save file, etc.)
   - Connect them and activate

## Configuration Tips

- **Webhook URL:** Set `WEBHOOK_URL` to your public domain so external services can trigger workflows. Requires a reverse proxy with HTTPS. See our [reverse proxy guide](/foundations/reverse-proxy/).
- **PostgreSQL for production:** SQLite works for small setups, but switch to Postgres for reliability with many workflows.
- **Credentials:** n8n stores API keys and service credentials encrypted in its database. The encryption key is in `~/.n8n/config`.
- **Community nodes:** Install community-built nodes for services not included by default.
- **Executions:** Configure execution retention in settings — by default, n8n keeps all execution history, which can grow large.

## Backup & Migration

- **Backup:** The `data` folder contains workflows, credentials (encrypted), and execution history. For PostgreSQL setups, back up the database separately.
- **Export/Import:** Export individual workflows as JSON from the n8n UI. Useful for sharing or version control.

## Troubleshooting

- **Webhooks not triggering:** Ensure `WEBHOOK_URL` is set correctly, HTTPS is working, and the webhook URL is publicly accessible.
- **High memory usage:** Complex workflows with large data sets consume memory. Optimize by processing data in batches.
- **Credential errors:** If you move n8n to a new server, credentials may fail to decrypt if the encryption key changed. Back up `~/.n8n/config`.

## Alternatives

[Activepieces](/apps/activepieces/) is a newer alternative with a cleaner UI and simpler setup. [Node-RED](/apps/node-red/) is more IoT-focused with a different programming model. See our [n8n vs Activepieces comparison](/compare/n8n-vs-activepieces/) or the full [Best Self-Hosted Automation Tools](/best/automation/) roundup.

## Verdict

n8n is the most capable self-hosted automation platform. It has 400+ integrations, a powerful visual editor, and handles everything from simple triggers to complex multi-step workflows. If you're paying for Zapier or Make, n8n does everything they do — for free.
