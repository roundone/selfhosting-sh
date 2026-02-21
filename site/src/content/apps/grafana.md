---
title: "How to Self-Host Grafana with Docker Compose"
description: "Complete guide to self-hosting Grafana with Docker Compose, including Prometheus integration, dashboards, and alerting setup."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "monitoring"
apps:
  - grafana
tags:
  - self-hosted
  - monitoring
  - grafana
  - docker
  - dashboards
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Grafana?

[Grafana](https://grafana.com) is the most popular open-source visualization and monitoring platform. It connects to dozens of data sources — Prometheus, InfluxDB, PostgreSQL, Elasticsearch, and more — and turns them into real-time dashboards, graphs, and alerts. For self-hosters, Grafana is the standard tool for monitoring server health, container performance, and application metrics. It replaces paid tools like Datadog and New Relic.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 1 GB of RAM minimum
- A data source to connect to (this guide includes Prometheus)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  grafana:
    image: grafana/grafana-oss:12.3.3
    container_name: grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_USER: "admin"           # Default admin username
      GF_SECURITY_ADMIN_PASSWORD: "changeme"     # CHANGE THIS — admin password
      GF_SERVER_ROOT_URL: "http://localhost:3000" # Your Grafana URL (update for production)
      GF_USERS_ALLOW_SIGN_UP: "false"            # Disable public registration
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - monitoring

  prometheus:
    image: prom/prometheus:v3.5.1
    container_name: prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--storage.tsdb.retention.time=30d"
    networks:
      - monitoring

volumes:
  grafana-data:
  prometheus-data:

networks:
  monitoring:
    driver: bridge
```

Create a `prometheus.yml` configuration file alongside:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  # Add your targets here. Example — monitor a Node Exporter:
  # - job_name: "node"
  #   static_configs:
  #     - targets: ["node-exporter:9100"]
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open Grafana at `http://your-server-ip:3000`
2. Log in with `admin` / the password you set in `GF_SECURITY_ADMIN_PASSWORD`
3. Add Prometheus as a data source:
   - Go to **Connections > Data sources > Add data source**
   - Select **Prometheus**
   - Set the URL to `http://prometheus:9090` (Docker service name, not localhost)
   - Click **Save & test** — it should show "Data source is working"
4. Import a dashboard:
   - Go to **Dashboards > Import**
   - Enter dashboard ID `1860` (Node Exporter Full) or browse [grafana.com/dashboards](https://grafana.com/grafana/dashboards/)
   - Select your Prometheus data source
   - Click **Import**

## Configuration

### Key Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GF_SECURITY_ADMIN_USER` | Admin username | `admin` |
| `GF_SECURITY_ADMIN_PASSWORD` | Admin password | `admin` |
| `GF_SERVER_ROOT_URL` | Public URL of Grafana | `http://localhost:3000` |
| `GF_USERS_ALLOW_SIGN_UP` | Allow public registration | `false` |
| `GF_AUTH_ANONYMOUS_ENABLED` | Enable anonymous access | `false` |
| `GF_INSTALL_PLUGINS` | Comma-separated list of plugins to install | Empty |
| `GF_SMTP_ENABLED` | Enable email notifications | `false` |
| `GF_SMTP_HOST` | SMTP server address | Empty |

All Grafana settings can be set via environment variables using the pattern `GF_<SECTION>_<KEY>`. See the [Grafana configuration docs](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/) for the full list.

### Monitor Your Server with Node Exporter

Add Node Exporter to your Docker Compose to collect system metrics (CPU, RAM, disk, network):

```yaml
  node-exporter:
    image: prom/node-exporter:v1.9.1
    container_name: node-exporter
    restart: unless-stopped
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - "--path.procfs=/host/proc"
      - "--path.rootfsys=/host/sys"
      - "--path.rootfs=/rootfs"
      - "--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)"
    networks:
      - monitoring
```

Add the scrape target to `prometheus.yml`:

```yaml
  - job_name: "node"
    static_configs:
      - targets: ["node-exporter:9100"]
```

Restart the stack, then import dashboard ID `1860` in Grafana for a complete server monitoring dashboard.

### Monitor Docker Containers with cAdvisor

```yaml
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.52.1
    container_name: cadvisor
    restart: unless-stopped
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    networks:
      - monitoring
```

Add to `prometheus.yml`:

```yaml
  - job_name: "cadvisor"
    static_configs:
      - targets: ["cadvisor:8080"]
```

Import dashboard ID `14282` for Docker container monitoring.

### Alerting

Grafana has built-in alerting. Set up alerts from any dashboard panel:

1. Edit a panel, go to the **Alert** tab
2. Define conditions (e.g., "CPU > 90% for 5 minutes")
3. Configure notification channels under **Alerting > Contact points** (email, Slack, Discord, webhook)

For email alerts, set SMTP in your environment:

```yaml
environment:
  GF_SMTP_ENABLED: "true"
  GF_SMTP_HOST: "smtp.example.com:587"
  GF_SMTP_USER: "alerts@example.com"
  GF_SMTP_PASSWORD: "your-smtp-password"
  GF_SMTP_FROM_ADDRESS: "alerts@example.com"
```

## Reverse Proxy

Behind [Nginx Proxy Manager](/apps/nginx-proxy-manager/) or [Traefik](/apps/traefik/):

- Forward your domain to `http://grafana:3000`
- Set `GF_SERVER_ROOT_URL` to your public URL (e.g., `https://grafana.example.com`)
- Enable WebSocket support in your proxy for live dashboard updates

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for the full configuration.

## Backup

Grafana stores dashboards, data sources, users, and settings in `/var/lib/grafana`:

```bash
docker compose stop grafana
docker run --rm \
  -v grafana-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/grafana-backup.tar.gz /data
docker compose start grafana
```

For dashboard-only backup, use the Grafana API:

```bash
# Export all dashboards
for uid in $(curl -s http://admin:password@localhost:3000/api/search | jq -r '.[].uid'); do
  curl -s "http://admin:password@localhost:3000/api/dashboards/uid/$uid" > "dashboard-$uid.json"
done
```

See [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### "Data source is not working" error

**Symptom:** Prometheus data source test fails in Grafana.

**Fix:** Use the Docker service name, not `localhost`:
- Correct: `http://prometheus:9090`
- Wrong: `http://localhost:9090`

Both containers must be on the same Docker network.

### Dashboards show "No data"

**Symptom:** Dashboard panels display "No data" despite data source working.

**Fix:**
1. Check the time range selector — set it to "Last 1 hour"
2. Verify Prometheus is scraping targets: visit `http://your-server:9090/targets`
3. Ensure scrape targets are up and returning metrics

### Permission denied on startup

**Symptom:** Grafana exits with permission errors writing to `/var/lib/grafana`.

**Fix:** The Grafana container runs as UID 472. If using bind mounts instead of named volumes:
```bash
sudo chown -R 472:472 ./grafana-data
```

### High memory usage

**Symptom:** Grafana uses excessive memory with many dashboards open.

**Fix:** This is typically caused by too many concurrent queries. Reduce dashboard refresh intervals from 5s to 30s or 1m. Set resource limits:
```yaml
deploy:
  resources:
    limits:
      memory: 512M
```

## Resource Requirements

- **RAM:** 200 MB idle, 500 MB with active dashboards and queries
- **CPU:** Low for displaying dashboards. Spikes during complex queries.
- **Disk:** 100 MB for Grafana. Prometheus data grows based on scrape targets and retention — budget 1-5 GB for a typical home server with 30-day retention.

## Frequently Asked Questions

### Grafana OSS vs Enterprise — which should I use?

Use OSS (grafana/grafana-oss). Enterprise adds SAML, enhanced LDAP, and reporting features most self-hosters don't need. Enterprise is free to run but the extra features require a license.

### Do I need Prometheus with Grafana?

Not necessarily. Grafana connects to many data sources — InfluxDB, PostgreSQL, MySQL, Elasticsearch, Loki, and more. But Prometheus is the most common pairing for infrastructure monitoring and has the largest ecosystem of exporters and dashboards.

### Can Grafana replace Datadog?

For self-hosted infrastructure monitoring, yes. Grafana + Prometheus + Node Exporter gives you server metrics, container monitoring, and alerting. You won't get Datadog's APM or log management out of the box, but adding Loki (for logs) and Tempo (for traces) gives you a complete observability stack.

## Verdict

Grafana is the undisputed standard for self-hosted monitoring dashboards. The community dashboard library saves hours of setup, the alerting system is flexible, and the plugin ecosystem covers virtually every data source. Pair it with Prometheus and Node Exporter and you have enterprise-grade monitoring for free. The only downside is complexity — if you just want simple uptime monitoring, [Uptime Kuma](/apps/uptime-kuma/) is much simpler. But for anything beyond basic uptime checks, Grafana is the tool.

## Related

- [How to Self-Host Prometheus](/apps/prometheus/)
- [How to Self-Host Uptime Kuma](/apps/uptime-kuma/)
- [Grafana vs Netdata](/compare/grafana-vs-netdata/)
- [Grafana vs Prometheus](/compare/grafana-vs-prometheus/)
- [Grafana vs Uptime Kuma](/compare/grafana-vs-uptime-kuma/)
- [Best Self-Hosted Monitoring](/best/monitoring/)
- [Replace Datadog](/replace/datadog/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
- [Docker Networking](/foundations/docker-networking/)
