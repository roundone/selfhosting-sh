---
title: "Grafana vs Prometheus: Understanding the Stack"
description: "Grafana vs Prometheus explained — how these complementary monitoring tools work together for self-hosted infrastructure."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "monitoring"
apps:
  - grafana
  - prometheus
tags:
  - comparison
  - grafana
  - prometheus
  - monitoring
  - dashboards
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Grafana and Prometheus are not competitors — they are complementary tools that form the standard self-hosted monitoring stack. Prometheus collects and stores metrics. Grafana visualizes them. Asking "Grafana vs Prometheus" is like asking "database vs dashboard." You almost certainly want both. Deploy Prometheus to scrape metrics from your services, then point Grafana at it to build dashboards and set up alerts with a proper UI.

## Overview

**[Prometheus](https://prometheus.io)** is an open-source monitoring and alerting toolkit originally built at SoundCloud. It uses a pull-based model to scrape metrics from configured targets, stores them in a local time-series database, and provides PromQL — a powerful query language for slicing, aggregating, and alerting on metric data. Prometheus is the data engine.

**[Grafana](https://grafana.com)** is an open-source visualization platform. It connects to dozens of data sources — Prometheus, InfluxDB, PostgreSQL, Loki, Elasticsearch, and more — and turns raw data into interactive dashboards, graphs, and alerts. Grafana is the presentation layer.

They solve different problems. Prometheus answers "what is happening on my infrastructure right now, and what happened over the last 30 days?" Grafana answers "how do I see and understand that data without writing PromQL queries by hand?"

## Role Comparison

| Capability | Prometheus | Grafana |
|-----------|-----------|---------|
| **Primary role** | Metrics collection + storage + alerting | Visualization + dashboards + alerting UI |
| **Data collection** | Yes — pull-based scraping of `/metrics` endpoints | No — connects to external data sources |
| **Data storage** | Yes — built-in time-series database (TSDB) | No — reads from other databases |
| **Query language** | PromQL (native) | Uses underlying data source query languages |
| **Built-in UI** | Basic expression browser | Full dashboard builder with panels, variables, annotations |
| **Alerting** | Yes — Alertmanager (rules evaluated server-side) | Yes — unified alerting with notification channels (email, Slack, PagerDuty) |
| **Data sources** | Self only (its own TSDB) | 100+ data sources (Prometheus, InfluxDB, MySQL, PostgreSQL, Loki, Elasticsearch, CloudWatch, etc.) |
| **Service discovery** | Yes — Kubernetes, Docker, Consul, DNS, file-based | No |
| **Export format** | Exposes its own `/metrics` endpoint | Can export dashboards as JSON, generate PDF reports |
| **License** | Apache 2.0 | AGPL 3.0 (OSS) / Apache 2.0 (older versions) |
| **Default port** | 9090 | 3000 |
| **Docker image** | `prom/prometheus:v3.5.1` | `grafana/grafana-oss:12.3.3` |

The key takeaway: Prometheus is a backend. Grafana is a frontend. They occupy different layers of the monitoring stack.

## How They Work Together

The standard self-hosted monitoring stack looks like this:

```
Your Services → expose /metrics endpoints
        ↓
   Prometheus → scrapes metrics every 15s, stores in TSDB
        ↓
     Grafana → queries Prometheus via PromQL, renders dashboards
```

In practice:

1. **Exporters** expose metrics from your infrastructure. Node Exporter reports CPU, memory, and disk. cAdvisor reports Docker container stats. Most self-hosted apps (Traefik, Gitea, MinIO) expose their own `/metrics` endpoint natively.
2. **Prometheus** scrapes these exporters on a configured interval (default: 15 seconds). It stores every data point in its time-series database and evaluates alerting rules against the incoming data.
3. **Grafana** connects to Prometheus as a data source. You build dashboards using PromQL queries, or import community dashboards from [grafana.com/dashboards](https://grafana.com/grafana/dashboards/). Grafana can also trigger its own alerts based on query thresholds.

This architecture scales well. You can add new exporters to Prometheus without touching Grafana. You can add new Grafana dashboards without changing Prometheus config. Each tool does one thing well.

## Installation Complexity

**Prometheus** requires a configuration file (`prometheus.yml`) that defines scrape targets. You need to know which services to monitor and what ports their metrics endpoints are on. Adding new targets means editing a YAML file and reloading. Not difficult, but there is configuration involved. The learning curve is PromQL — it is powerful but takes time to master.

**Grafana** is simpler to deploy. Start the container, log in, add a data source, import a dashboard. The web UI handles almost everything. The complexity shows up when building custom dashboards with advanced PromQL queries, variables, and templating — but you can get very far with community-built dashboards alone.

**Together:** The combined stack adds a few more moving parts — you will likely also deploy Node Exporter (for host metrics) and cAdvisor (for Docker metrics). That is four containers total. The Docker Compose is longer, but each piece is straightforward.

## Resource Usage

| Resource | Prometheus | Grafana |
|----------|-----------|---------|
| **RAM (idle)** | 100-200 MB | 50-100 MB |
| **RAM (active, 10+ targets)** | 300-500 MB | 100-200 MB |
| **RAM (heavy, 50+ targets)** | 1-2 GB | 200-400 MB |
| **CPU** | Low-Medium (spikes during scrapes and query evaluation) | Low (spikes when rendering dashboards) |
| **Disk** | Grows with retention — ~1-2 MB/day per target at 15s interval | Minimal — stores dashboard JSON and user config only |
| **Network** | Pulls metrics from all targets every scrape interval | Queries Prometheus on dashboard load and refresh |

Prometheus is the heavier component because it runs the TSDB and handles all data ingestion. Grafana is lightweight by comparison — it is essentially a web application that queries other databases. On a small homelab server with 5-10 monitored services and 30-day retention, expect the entire stack (Prometheus + Grafana + Node Exporter + cAdvisor) to use around 400-600 MB of RAM.

## When You Need Just Grafana

Grafana without Prometheus makes sense when:

- **You already have a different data source.** If your metrics are in InfluxDB, PostgreSQL, MySQL, or Elasticsearch, Grafana connects to all of them directly. You do not need Prometheus as a middleman.
- **You want to visualize application data, not infrastructure metrics.** Grafana can query a PostgreSQL database and chart business metrics — signups, revenue, orders — without any time-series database at all.
- **You are using Grafana Cloud or Grafana Loki.** The Grafana ecosystem includes its own log aggregation (Loki) and metrics storage (Mimir). In this model, Prometheus may not be needed locally.

Without Prometheus, Grafana cannot pull metrics from your containers or host system — it needs some data source to query.

## When You Need Just Prometheus

Prometheus without Grafana makes sense when:

- **You only need alerting, not dashboards.** Prometheus has Alertmanager, which evaluates rules and sends notifications to email, Slack, PagerDuty, or webhooks. If you just want to be notified when a server goes down or disk fills up, Prometheus + Alertmanager handles that without Grafana.
- **You query metrics programmatically.** PromQL via the HTTP API (`/api/v1/query`) returns JSON. If your monitoring workflows are scripted or feed into other automation, you may not need a visual dashboard.
- **You prefer the built-in expression browser.** Prometheus ships with a basic web UI at port 9090 where you can run PromQL queries and see results in table or graph format. It is functional for ad-hoc debugging.

For most self-hosters, Prometheus alone is workable but limiting. The expression browser is not a replacement for proper dashboards.

## Running Both Together (Recommended)

This is the recommended Docker Compose for a complete monitoring stack. It deploys Grafana, Prometheus, Node Exporter (host metrics), and cAdvisor (container metrics):

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
      GF_SECURITY_ADMIN_PASSWORD: "changeme"     # CHANGE THIS — set a strong password
      GF_SERVER_ROOT_URL: "http://localhost:3000" # Update to your domain in production
      GF_USERS_ALLOW_SIGN_UP: "false"            # Disable public user registration
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
      - "--storage.tsdb.retention.time=30d"    # Keep 30 days of metrics
      - "--web.enable-lifecycle"               # Enable config reload via API
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
  grafana-data:
  prometheus-data:

networks:
  monitoring:
    driver: bridge
```

Create a `prometheus.yml` alongside the Compose file:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "node"
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: "cadvisor"
    static_configs:
      - targets: ["cadvisor:8080"]
```

Start the stack:

```bash
docker compose up -d
```

Then connect them:

1. Open Grafana at `http://your-server-ip:3000` and log in with `admin` / the password you set
2. Go to **Connections > Data sources > Add data source**
3. Select **Prometheus** and set the URL to `http://prometheus:9090` (the Docker service name)
4. Click **Save & test** — it should confirm the connection is working
5. Go to **Dashboards > Import**, enter ID `1860` (Node Exporter Full), select your Prometheus data source, and click **Import**
6. For container monitoring, import dashboard ID `14282`

You now have full infrastructure monitoring: host metrics, container metrics, and dashboards — all self-hosted.

## Final Verdict

Grafana and Prometheus are not an either/or decision. They are the two halves of the standard self-hosted monitoring stack. Prometheus handles data collection, storage, and rule-based alerting. Grafana handles visualization, dashboard management, and user-facing alerting configuration.

**Deploy both.** The Docker Compose above takes five minutes to set up and gives you production-grade monitoring that replaces Datadog, New Relic, or UptimeRobot. The only scenario where you would run one without the other is if you already have an alternative for that layer — for example, Grafana with InfluxDB instead of Prometheus, or Prometheus with Alertmanager only and no dashboards.

If you want simpler uptime monitoring without the full metrics stack, look at [Uptime Kuma](/apps/uptime-kuma) instead — it is a single container that handles uptime checks with a clean UI and no configuration files. For full infrastructure observability, Prometheus + Grafana is the answer.

## Related

- [How to Self-Host Grafana](/apps/grafana)
- [How to Self-Host Prometheus](/apps/prometheus)
- [How to Self-Host Uptime Kuma](/apps/uptime-kuma)
- [Best Self-Hosted Monitoring Tools](/best/monitoring)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
