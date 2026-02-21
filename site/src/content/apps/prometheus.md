---
title: "How to Self-Host Prometheus with Docker Compose"
description: "Complete guide to self-hosting Prometheus with Docker Compose, including scrape targets, Node Exporter, alerting, and retention."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "monitoring"
apps:
  - prometheus
tags:
  - self-hosted
  - monitoring
  - prometheus
  - docker
  - metrics
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Prometheus?

[Prometheus](https://prometheus.io) is an open-source monitoring and alerting toolkit. It scrapes metrics from configured targets at regular intervals, stores them in a time-series database, and provides a powerful query language (PromQL) for analysis. Prometheus is the backbone of most self-hosted monitoring stacks — it collects the data that [Grafana](/apps/grafana/) visualizes. It replaces the data collection layer of paid tools like Datadog, New Relic, and Pingdom.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 1 GB of RAM minimum (2 GB+ recommended for many scrape targets)
- Services or exporters to monitor

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  prometheus:
    image: prom/prometheus:v3.9.1
    container_name: prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./alert-rules.yml:/etc/prometheus/alert-rules.yml:ro
      - prometheus-data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--storage.tsdb.retention.time=30d"
      - "--web.enable-lifecycle"
    networks:
      - monitoring

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
      - "--path.sysfs=/host/sys"
      - "--path.rootfs=/rootfs"
      - "--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)"
    networks:
      - monitoring

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

volumes:
  prometheus-data:

networks:
  monitoring:
    driver: bridge
```

Create a `prometheus.yml` configuration file:

```yaml
global:
  scrape_interval: 15s      # How often to scrape targets
  evaluation_interval: 15s  # How often to evaluate alerting rules

rule_files:
  - "alert-rules.yml"

scrape_configs:
  # Monitor Prometheus itself
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  # Monitor host system via Node Exporter
  - job_name: "node"
    static_configs:
      - targets: ["node-exporter:9100"]

  # Monitor Docker containers via cAdvisor
  - job_name: "cadvisor"
    static_configs:
      - targets: ["cadvisor:8080"]
```

Create a basic `alert-rules.yml`:

```yaml
groups:
  - name: host-alerts
    rules:
      - alert: HighCPU
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 90
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"

      - alert: HighMemory
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 90
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"

      - alert: DiskAlmostFull
        expr: (1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 > 85
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Disk almost full on {{ $labels.instance }}"

      - alert: ContainerDown
        expr: absent(container_last_seen{name=~".+"})
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Container {{ $labels.name }} is down"
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open the Prometheus UI at `http://your-server-ip:9090`
2. Go to **Status > Targets** — all scrape targets should show as "UP"
3. Test a query in the **Graph** tab:
   - `up` — shows which targets are reachable
   - `node_memory_MemAvailable_bytes` — available memory
   - `rate(node_cpu_seconds_total{mode="idle"}[5m])` — CPU idle rate

Prometheus is a data backend — for dashboards, connect it to [Grafana](/apps/grafana/).

## Configuration

### Adding Scrape Targets

Add any service that exposes a `/metrics` endpoint:

```yaml
scrape_configs:
  # Custom application
  - job_name: "my-app"
    static_configs:
      - targets: ["my-app:8080"]
    metrics_path: "/metrics"  # default, can be changed

  # Multiple targets for the same job
  - job_name: "web-servers"
    static_configs:
      - targets:
        - "server1:9100"
        - "server2:9100"
        - "server3:9100"
```

After editing `prometheus.yml`, reload the config:

```bash
curl -X POST http://localhost:9090/-/reload
```

This works because `--web.enable-lifecycle` is enabled.

### Common Exporters

| Exporter | What It Monitors | Image | Port |
|----------|-----------------|-------|------|
| Node Exporter | Host CPU, memory, disk, network | `prom/node-exporter` | 9100 |
| cAdvisor | Docker containers | `gcr.io/cadvisor/cadvisor` | 8080 |
| Blackbox Exporter | HTTP/TCP/DNS/ICMP probes | `prom/blackbox-exporter` | 9115 |
| SNMP Exporter | Network devices | `prom/snmp-exporter` | 9116 |
| PostgreSQL Exporter | PostgreSQL databases | `prometheuscommunity/postgres-exporter` | 9187 |

### Storage and Retention

Prometheus stores data on disk. Control how much with:

```yaml
command:
  - "--storage.tsdb.retention.time=30d"   # Keep 30 days of data
  - "--storage.tsdb.retention.size=10GB"  # Or cap at 10 GB
```

You can set both — whichever limit is hit first triggers cleanup.

### Alerting with Alertmanager

Prometheus evaluates alert rules but needs [Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/) to route notifications. Add it to your stack:

```yaml
  alertmanager:
    image: prom/alertmanager:v0.28.1
    container_name: alertmanager
    restart: unless-stopped
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
    networks:
      - monitoring
```

Create `alertmanager.yml`:

```yaml
route:
  receiver: "email"
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

receivers:
  - name: "email"
    email_configs:
      - to: "admin@example.com"
        from: "alertmanager@example.com"
        smarthost: "smtp.example.com:587"
        auth_username: "alertmanager@example.com"
        auth_password: "your-smtp-password"
```

Add Alertmanager to `prometheus.yml`:

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ["alertmanager:9093"]
```

## Reverse Proxy

Behind [Nginx Proxy Manager](/apps/nginx-proxy-manager/) or [Traefik](/apps/traefik/), forward traffic to port 9090. Add `--web.external-url=https://prometheus.example.com` to the command to fix redirect URLs.

**Security:** Prometheus has no built-in authentication. Either use a reverse proxy with basic auth or restrict access to your local network. Do not expose port 9090 publicly without authentication.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

## Backup

Back up the Prometheus data volume:

```bash
docker compose stop prometheus
docker run --rm \
  -v prometheus-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/prometheus-backup.tar.gz /data
docker compose start prometheus
```

Also back up your configuration files (`prometheus.yml`, `alert-rules.yml`, `alertmanager.yml`).

See [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Target shows as "DOWN"

**Symptom:** Targets page shows a red "DOWN" status.

**Fix:**
1. Verify the target container is running: `docker ps`
2. Check that containers are on the same Docker network
3. Test connectivity: `docker exec prometheus wget -qO- http://node-exporter:9100/metrics | head`
4. Ensure the target's `/metrics` endpoint is accessible

### "out of order sample" errors in logs

**Symptom:** Prometheus logs show "out of order sample" warnings.

**Fix:** This happens when scrape intervals are too short or when time syncs on the host. Ensure NTP is configured:
```bash
timedatectl status
```

### High memory usage

**Symptom:** Prometheus uses several GB of RAM.

**Fix:** Memory scales with the number of active time series. Reduce by:
1. Increasing `scrape_interval` (30s instead of 15s)
2. Reducing the number of metrics collected (use `metric_relabel_configs` to drop unneeded metrics)
3. Setting `--storage.tsdb.retention.size` to cap disk usage

### Metrics missing after restart

**Symptom:** Historical data is gone after container restart.

**Fix:** Ensure `prometheus-data` volume is persisted. If using bind mounts, check permissions — Prometheus runs as UID `65534` (nobody).

## Resource Requirements

- **RAM:** 500 MB for a few targets, 2-4 GB for 50+ targets with many metrics
- **CPU:** Low at rest, moderate during scrapes and queries
- **Disk:** ~2 bytes per sample. 10 targets scraped every 15s for 30 days ≈ 500 MB. 100 targets ≈ 5 GB.

## Frequently Asked Questions

### Do I need Prometheus if I have Grafana?

Grafana is a visualization tool — it doesn't collect data. You need a data source like Prometheus to feed it metrics. Prometheus scrapes and stores the data; Grafana displays it.

### Prometheus vs InfluxDB — which should I use?

Prometheus is pull-based (it scrapes targets) and purpose-built for monitoring. InfluxDB is push-based (services send data to it) and more general-purpose. For infrastructure monitoring, Prometheus has a larger ecosystem of exporters and community dashboards. Use InfluxDB for IoT or custom application metrics.

### How many targets can Prometheus handle?

A single Prometheus instance can comfortably scrape 500+ targets with 15s intervals. Beyond that, consider federation (multiple Prometheus instances) or Thanos/Cortex for long-term storage.

## Verdict

Prometheus is the standard for self-hosted metrics collection. The exporter ecosystem covers everything — servers, containers, databases, network devices, and custom applications. PromQL is powerful once learned, and the community has built thousands of pre-made dashboards and alert rules. Pair it with [Grafana](/apps/grafana/) for visualization and you have an enterprise-grade monitoring stack for free. The learning curve is steeper than simpler tools like [Uptime Kuma](/apps/uptime-kuma/) or [Netdata](/apps/netdata/), but the flexibility and scalability are worth it.

## Related

- [How to Self-Host Grafana](/apps/grafana/)
- [How to Self-Host Uptime Kuma](/apps/uptime-kuma/)
- [How to Self-Host Netdata](/apps/netdata/)
- [Prometheus vs Zabbix](/compare/prometheus-vs-zabbix/)
- [Grafana vs Prometheus](/compare/grafana-vs-prometheus/)
- [Best Self-Hosted Monitoring](/best/monitoring/)
- [Replace Datadog](/replace/datadog/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Networking](/foundations/docker-networking/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
