---
title: "How to Self-Host Grafana with Docker Compose"
type: "app-guide"
app: "grafana"
category: "monitoring"
difficulty: "intermediate"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up Grafana for beautiful monitoring dashboards with Docker Compose and Prometheus."
officialUrl: "https://grafana.com"
githubUrl: "https://github.com/grafana/grafana"
defaultPort: 3000
minRam: "512MB"
---

## What is Grafana?

Grafana is a visualization and monitoring platform that turns your metrics into beautiful, interactive dashboards. Connect data sources like Prometheus, InfluxDB, or your database, and build dashboards showing server health, container stats, network traffic, or anything you can measure. It's the standard for self-hosted monitoring visualization.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- A server with at least 512MB RAM
- Optional: Prometheus for metrics collection (included in the compose file below)

## Docker Compose Configuration

```yaml
# docker-compose.yml for Grafana + Prometheus
# Tested with Grafana 11+ / Prometheus 2.50+

services:
  grafana:
    container_name: grafana
    image: grafana/grafana-oss:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    depends_on:
      - prometheus
    restart: unless-stopped

  prometheus:
    container_name: prometheus
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
    restart: unless-stopped

  node-exporter:
    container_name: node-exporter
    image: prom/node-exporter:latest
    pid: host
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--path.rootfs=/rootfs'
    restart: unless-stopped

volumes:
  grafana_data:
  prometheus_data:
```

Create a `prometheus.yml` config file:

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

Create a `.env` file:

```bash
GRAFANA_PASSWORD=change-this-password
```

## Step-by-Step Setup

1. **Create a directory:**
   ```bash
   mkdir ~/grafana && cd ~/grafana
   ```

2. **Create the `docker-compose.yml`, `prometheus.yml`, and `.env` files.**

3. **Start the containers:**
   ```bash
   docker compose up -d
   ```

4. **Access Grafana** at `http://your-server-ip:3000`. Log in with the admin credentials from your `.env`.

5. **Add Prometheus as a data source:** Go to Connections → Data sources → Add data source → Prometheus. URL: `http://prometheus:9090`.

6. **Import a dashboard:** Go to Dashboards → New → Import. Enter ID `1860` for the Node Exporter Full dashboard. Select your Prometheus data source.

7. **You'll immediately see** CPU usage, memory, disk, and network stats in a beautiful dashboard.

## Configuration Tips

- **Pre-built dashboards:** Browse [grafana.com/grafana/dashboards](https://grafana.com/grafana/dashboards/) for thousands of community dashboards. Import by ID.
- **Alerting:** Set up alert rules in Grafana to notify you via email, Telegram, Discord, or Slack when metrics exceed thresholds.
- **More exporters:** Add cAdvisor for Docker container metrics, Blackbox Exporter for HTTP endpoint monitoring, or app-specific exporters.
- **Reverse proxy:** Access over HTTPS. See our [reverse proxy guide](/foundations/reverse-proxy/).

## Backup & Migration

- **Backup:** Back up the `grafana_data` volume (dashboards, users, data sources) and `prometheus_data` (metrics history).
- **Export dashboards:** Export individual dashboards as JSON for version control.

## Troubleshooting

- **"No data" on dashboards:** Check that Prometheus is running and scraping targets. Visit `http://your-server-ip:9090/targets` to verify.
- **High disk usage:** Prometheus stores metrics on disk. Adjust `--storage.tsdb.retention.time` to control how long data is kept.

## Alternatives

[Netdata](/apps/netdata/) provides instant monitoring with auto-detection and no configuration — good for quick setup but less customizable. See our full [Best Self-Hosted Monitoring Tools](/best/monitoring/) roundup.

## Verdict

Grafana + Prometheus is the gold standard for self-hosted monitoring. The dashboards are beautiful, the ecosystem is massive, and you can monitor literally anything that exposes metrics. The initial setup is more involved than simpler tools like Uptime Kuma, but the depth of insight is unmatched.
