---
title: "How to Self-Host Windmill with Docker Compose"
description: "Deploy Windmill with Docker Compose — a self-hosted developer platform for scripts, workflows, and internal tools."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "automation-workflows"
apps:
  - windmill
tags:
  - self-hosted
  - windmill
  - docker
  - automation
  - developer-tools
  - internal-tools
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Windmill?

[Windmill](https://www.windmill.dev/) is an open-source (AGPLv3) developer platform for building and running scripts, workflows, and internal tools. Write in Python, TypeScript, Go, Bash, SQL, or PowerShell — Windmill handles scheduling, error handling, approval flows, and auto-generates UIs from your script parameters. It's what you'd get if you combined Retool, Temporal, and Airflow into one self-hosted platform.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 4 GB of RAM (minimum for server + workers)
- 5 GB of free disk space
- Docker socket accessible (workers need it for execution)
- A domain name (recommended)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  windmill_server:
    image: ghcr.io/windmill-labs/windmill:1.639.0
    container_name: windmill-server
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgres://windmill:${DB_PASSWORD}@db/windmill?sslmode=disable
      MODE: server
      BASE_URL: ${BASE_URL:-http://localhost:8000}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - windmill-net

  windmill_worker:
    image: ghcr.io/windmill-labs/windmill:1.639.0
    container_name: windmill-worker
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://windmill:${DB_PASSWORD}@db/windmill?sslmode=disable
      MODE: worker
      WORKER_GROUP: default
    depends_on:
      db:
        condition: service_healthy
    volumes:
      # Workers need Docker socket for isolated script execution
      - /var/run/docker.sock:/var/run/docker.sock
      - worker-cache:/tmp/windmill/cache
    networks:
      - windmill-net

  windmill_worker_native:
    image: ghcr.io/windmill-labs/windmill:1.639.0
    container_name: windmill-worker-native
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://windmill:${DB_PASSWORD}@db/windmill?sslmode=disable
      MODE: worker
      WORKER_GROUP: native
      NUM_WORKERS: 8
      SLEEP_QUEUE: 200
    depends_on:
      db:
        condition: service_healthy
    networks:
      - windmill-net

  db:
    image: postgres:16
    container_name: windmill-db
    restart: unless-stopped
    shm_size: 1g
    environment:
      POSTGRES_DB: windmill
      POSTGRES_USER: windmill
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - windmill-db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U windmill -d windmill"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - windmill-net

volumes:
  windmill-db:
  worker-cache:

networks:
  windmill-net:
```

Create a `.env` file alongside:

```bash
# Database password — change this
DB_PASSWORD=windmill-secure-password

# Public URL (used for webhooks and OAuth callbacks)
BASE_URL=http://localhost:8000
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Wait ~30 seconds for database migrations
2. Access Windmill at `http://your-server:8000`
3. Log in with default credentials:
   - Email: `admin@windmill.dev`
   - Password: `changeme`
4. **Change the admin password immediately**
5. Create a workspace (Windmill uses workspaces to organize scripts and flows)

## Configuration

### Scripts

Windmill's core unit is the **script**. Write in any supported language:

```python
# Example: Python script with typed parameters
# Windmill auto-generates a UI from the function signature

def main(name: str, count: int = 5):
    """Greet someone multiple times"""
    results = []
    for i in range(count):
        results.append(f"Hello, {name}! (#{i+1})")
    return results
```

Save this as a script, and Windmill generates a form UI with a text input for `name` and a number input for `count`. Run it manually or schedule it.

### Flows

Flows chain scripts together:

1. Click **"New Flow"**
2. Add steps — each step is a script in any language
3. Use the previous step's output as input via `results.step_name`
4. Add branching logic, loops, or approval steps
5. Schedule or trigger via webhook

### Schedules

Any script or flow can be scheduled with cron syntax:

- Go to the script/flow → Schedule tab
- Add a cron expression (e.g., `0 */6 * * *` for every 6 hours)
- The scheduler runs on the server, workers execute the jobs

### Variables and Secrets

Store configuration centrally:

- **Variables**: Key-value pairs accessible from scripts via `wmill.get_variable("path")`
- **Resources**: Typed connections (databases, APIs, S3) with credential storage

## Advanced Configuration (Optional)

### Scaling Workers

Add more default workers for parallelism:

```yaml
windmill_worker:
  deploy:
    replicas: 3
  # ... same config as above
```

Each worker replica processes jobs independently. Scale based on your workload.

### LSP Service (Code Completion)

For in-browser code completion, add the LSP service:

```yaml
lsp:
  image: ghcr.io/windmill-labs/windmill-extra:latest
  container_name: windmill-lsp
  restart: unless-stopped
  volumes:
    - lsp-cache:/pyls/.cache
  networks:
    - windmill-net
```

### Git Sync

Windmill can sync scripts and flows with a Git repository:

1. Go to Workspace Settings → Git Sync
2. Configure your Git repository URL and credentials
3. Scripts and flows are version-controlled automatically

## Reverse Proxy

Behind [Nginx Proxy Manager](/apps/nginx-proxy-manager) or [Caddy](/apps/caddy), proxy to port 8000. WebSocket support is required for the real-time editor. Set `BASE_URL` to your public HTTPS URL.

For detailed reverse proxy setup, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Back up the PostgreSQL database:

```bash
docker exec windmill-db pg_dump -U windmill windmill > windmill_backup.sql
```

The database stores all scripts, flows, schedules, variables, resources, and execution history. Worker cache is disposable.

For a full backup strategy, see [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Workers Not Processing Jobs

**Symptom:** Scripts are queued but not executing.

**Fix:** Check the worker containers are running and connected to the database:

```bash
docker logs windmill-worker
docker logs windmill-worker-native
```

Common causes: database connection issues, or Docker socket not mounted (needed for default workers).

### Script Execution Timeouts

**Symptom:** Scripts fail with timeout errors.

**Fix:** Default timeout is configurable per script. For long-running scripts, increase the timeout in the script settings. For global defaults, set `TIMEOUT_WAIT_RESULT` environment variable on workers.

### Database Connection Pool Exhausted

**Symptom:** "too many connections" errors in logs.

**Fix:** With multiple workers, connection pool usage adds up. Increase PostgreSQL's `max_connections` in a custom `postgresql.conf`, or reduce worker replicas.

### Docker Socket Permission Denied

**Symptom:** Default workers can't execute scripts, permission denied on `/var/run/docker.sock`.

**Fix:** Ensure the Docker socket is mounted in the worker container. The Windmill worker user must have access to the Docker group. On some systems, you may need to set socket permissions:

```bash
chmod 666 /var/run/docker.sock
```

Or add the worker container user to the Docker group.

## Resource Requirements

- **RAM:** 2 GB minimum (server ~500 MB, workers ~500 MB each, PostgreSQL ~500 MB with 1 GB shm_size)
- **CPU:** Medium — workers are compute-heavy during script execution
- **Disk:** 1 GB for application, grows with execution logs and worker dependency cache

## Verdict

Windmill is the most powerful self-hosted platform for developer workflows. If your team writes scripts, builds internal tools, or needs data pipelines with approval flows, Windmill is unmatched. The auto-generated UIs from script parameters are genuinely useful — no frontend work needed.

**The trade-off is complexity.** Windmill requires more resources than simpler tools like [n8n](/apps/n8n) or [Node-RED](/apps/node-red), and the multi-container setup needs proper infrastructure. It's designed for developer teams, not casual automators.

**Use Windmill if:** You're a development team that needs to run scheduled scripts, build internal tools, and orchestrate complex jobs in multiple languages.

**Consider n8n instead if:** You want visual workflow automation with pre-built integrations and simpler deployment. See [Windmill vs n8n](/compare/windmill-vs-n8n).

## FAQ

### Is Windmill free for self-hosting?

The community edition is AGPLv3, free to self-host. Enterprise features (SAML SSO, priority queues, audit logs) require a paid license.

### What languages does Windmill support?

Python, TypeScript/Deno, Go, Bash, SQL, PowerShell, and REST API calls. Each script can be in a different language, and flows can mix languages.

### How does Windmill compare to Airflow?

Both orchestrate data workflows. Windmill has a better UI, supports more languages, and adds internal tool building. Airflow has a larger ecosystem of operators and is the industry standard for data engineering. Windmill is easier to self-host.

### Do workers really need Docker socket access?

Default workers use Docker to run scripts in isolated containers, which requires socket access. Native workers run scripts directly in the worker process — no Docker socket needed, but less isolation.

## Related

- [Windmill vs n8n](/compare/windmill-vs-n8n)
- [How to Self-Host n8n](/apps/n8n)
- [How to Self-Host Node-RED](/apps/node-red)
- [n8n vs Node-RED](/compare/n8n-vs-node-red)
- [Self-Hosted Alternatives to Zapier](/replace/zapier)
- [Best Self-Hosted Automation Tools](/best/automation)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Networking](/foundations/docker-networking)
