---
title: "How to Self-Host Gatus with Docker Compose"
description: "Step-by-step guide to self-hosting Gatus with Docker Compose for automated endpoint monitoring and status pages."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "monitoring-uptime"
apps:
  - gatus
tags:
  - docker
  - monitoring
  - status-page
  - uptime
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Gatus?

Gatus is a developer-oriented health dashboard and status page. It monitors HTTP, TCP, ICMP, DNS, and SSH endpoints, evaluates conditions you define (status codes, response times, certificate expiry), and displays results on a clean status page. Unlike [Uptime Kuma](/apps/uptime-kuma) which is configured via a web UI, Gatus uses YAML configuration — infrastructure-as-code for monitoring. [Official site](https://gatus.io/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 500 MB of free disk space
- 256 MB of RAM minimum
- Endpoints to monitor (websites, APIs, services)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  gatus:
    image: twinproduction/gatus:v5.16.0
    container_name: gatus
    volumes:
      - ./config:/config
      - ./data:/data
    ports:
      - "8080:8080"
    restart: unless-stopped
```

Create `./config/config.yaml`:

```yaml
storage:
  type: sqlite
  path: /data/data.db

endpoints:
  - name: My Website
    url: "https://example.com"
    interval: 60s
    conditions:
      - "[STATUS] == 200"
      - "[RESPONSE_TIME] < 1000"
      - "[CERTIFICATE_EXPIRATION] > 72h"

  - name: API Health
    url: "https://api.example.com/health"
    interval: 30s
    conditions:
      - "[STATUS] == 200"
      - "[BODY].status == UP"
      - "[RESPONSE_TIME] < 500"

  - name: Database
    url: "tcp://db-server:5432"
    interval: 30s
    conditions:
      - "[CONNECTED] == true"

  - name: DNS Resolution
    url: "dns://8.8.8.8"
    interval: 120s
    dns:
      query-name: "example.com"
      query-type: "A"
    conditions:
      - "[DNS_RCODE] == NOERROR"
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8080`
2. The status page displays immediately — no login required for viewing
3. Modify `config/config.yaml` to add your endpoints
4. Restart the container after config changes: `docker compose restart gatus`

## Configuration

### Endpoint Types

Gatus supports multiple protocols:

| Protocol | URL Format | Use Case |
|----------|-----------|----------|
| HTTP/HTTPS | `https://example.com` | Websites, APIs |
| TCP | `tcp://host:port` | Databases, services |
| ICMP | `icmp://host` | Ping monitoring |
| DNS | `dns://resolver` | DNS resolution checks |
| SSH | `ssh://host:22` | SSH availability |
| WebSocket | `ws://host/path` | WebSocket endpoints |

### Conditions

Conditions define what "healthy" means:

```yaml
conditions:
  - "[STATUS] == 200"                    # HTTP status code
  - "[RESPONSE_TIME] < 1000"            # Response time in ms
  - "[CERTIFICATE_EXPIRATION] > 72h"    # SSL cert expiry
  - "[BODY].status == ok"               # JSON body field
  - "[BODY] == pat(*healthy*)"          # Body pattern match
  - "[CONNECTED] == true"               # TCP/ICMP connection
  - "[DNS_RCODE] == NOERROR"            # DNS response code
```

### Alerting

Configure alerts when endpoints fail:

```yaml
alerting:
  discord:
    webhook-url: "https://discord.com/api/webhooks/..."
    default-alert:
      enabled: true
      failure-threshold: 3
      success-threshold: 2
      send-on-resolved: true

  slack:
    webhook-url: "https://hooks.slack.com/services/..."
    default-alert:
      enabled: true
      failure-threshold: 3

  email:
    from: "gatus@example.com"
    host: "smtp.example.com"
    port: 587
    username: "gatus@example.com"
    password: "your-smtp-password"
    to: "admin@example.com"
    default-alert:
      enabled: true
      failure-threshold: 5
```

Supported providers: Slack, Discord, PagerDuty, Telegram, Twilio, Mattermost, Gotify, Ntfy, email, and custom webhooks.

### Endpoint Groups

Organize endpoints into groups:

```yaml
endpoints:
  - name: Frontend
    group: Web
    url: "https://example.com"
    interval: 60s
    conditions:
      - "[STATUS] == 200"

  - name: API
    group: Backend
    url: "https://api.example.com/health"
    interval: 30s
    conditions:
      - "[STATUS] == 200"
```

## Advanced Configuration (Optional)

### External Endpoints (Manual Push)

Accept health data pushed from external sources:

```yaml
external-endpoints:
  - name: CI Pipeline
    group: DevOps
    token: "your-secret-token"
    alerts:
      - type: discord
        enabled: true
        failure-threshold: 1
```

Push results with:
```bash
curl -X POST "https://gatus.example.com/api/v1/endpoints/devops_ci-pipeline/external" \
  -H "Authorization: Bearer your-secret-token" \
  -d '{"status":"UP","errors":[]}'
```

### Security (Basic Auth)

Protect the dashboard:

```yaml
security:
  basic:
    username: "admin"
    password: "$2a$10$..."  # bcrypt hash
```

### Client Configuration

Set custom headers, request body, or TLS settings:

```yaml
endpoints:
  - name: Authenticated API
    url: "https://api.example.com/internal"
    headers:
      Authorization: "Bearer your-token"
    interval: 60s
    conditions:
      - "[STATUS] == 200"
```

## Reverse Proxy

Example Nginx Proxy Manager configuration:

- **Scheme:** http
- **Forward Hostname:** gatus
- **Forward Port:** 8080

[Reverse Proxy Setup](/foundations/reverse-proxy-explained)

## Backup

Back up the config and data directories:

```bash
tar -czf gatus-backup-$(date +%Y%m%d).tar.gz ./config ./data
```

[Backup Strategy](/foundations/backup-3-2-1-rule)

## Troubleshooting

### Config Changes Not Taking Effect

**Symptom:** Modified `config.yaml` but Gatus still shows old endpoints.
**Fix:** Gatus reads config on startup only. Restart the container: `docker compose restart gatus`. Validate YAML syntax before restarting — a syntax error prevents startup.

### "Connection Refused" for Local Services

**Symptom:** Gatus can't reach services on the same Docker host.
**Fix:** Use the Docker service name (not `localhost`) when monitoring containers on the same network. For host services, use `host.docker.internal` or the host's IP. Add Gatus to the same Docker network as the services it monitors.

### High Memory Usage Over Time

**Symptom:** Gatus memory grows steadily.
**Fix:** The SQLite database accumulates historical data. Configure retention: add `storage.capping` to limit how many results are kept. Or periodically delete old data from the SQLite database.

### SSL Certificate Checks Failing

**Symptom:** Certificate expiration condition always fails.
**Fix:** Ensure the URL uses `https://` (not `http://`). If the endpoint uses a self-signed certificate, add `client.insecure: true` to skip TLS verification for that endpoint.

## Resource Requirements

- **RAM:** ~30 MB idle, 50-100 MB with 50+ endpoints
- **CPU:** Very low
- **Disk:** Minimal — grows with history retention

## Verdict

Gatus is the best monitoring tool for developers who prefer config-as-code over clicking through UIs. If you want a public status page that's defined in a YAML file and version-controlled in Git, Gatus is the answer. For a more traditional UI-driven approach, use [Uptime Kuma](/apps/uptime-kuma) instead. Gatus's extremely low resource usage makes it suitable for even the smallest VPS.

## FAQ

### Gatus vs Uptime Kuma?

Different philosophies. Gatus: config-as-code in YAML, lightweight, developer-oriented. Uptime Kuma: web UI configuration, more features out of the box, easier for non-developers. Choose based on your workflow preference.

### Can Gatus replace StatusPage.io?

For basic status pages, yes. Gatus provides a clean public status page with uptime history. It lacks incident management and subscriber notifications that StatusPage.io offers, but for most self-hosted setups, Gatus covers the need.

### Does Gatus support hot-reloading config?

No. You must restart the container after config changes. This is by design — config-as-code means explicit deployments, not live editing.

## Related

- [How to Self-Host Uptime Kuma](/apps/uptime-kuma)
- [How to Self-Host Grafana](/apps/grafana)
- [How to Self-Host Prometheus](/apps/prometheus)
- [Grafana vs Uptime Kuma](/compare/grafana-vs-uptime-kuma)
- [Best Self-Hosted Monitoring Tools](/best/monitoring)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
