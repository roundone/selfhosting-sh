---
title: "How to Self-Host OpenSearch with Docker Compose"
description: "Deploy OpenSearch with Docker for fully open-source search and analytics. Free security, alerting, and Elasticsearch compatibility."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "search-engines"
apps:
  - opensearch
tags:
  - self-hosted
  - opensearch
  - docker
  - search
  - analytics
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is OpenSearch?

[OpenSearch](https://opensearch.org/) is a fully open-source search and analytics engine forked from Elasticsearch 7.10.2 by Amazon. It includes security, alerting, anomaly detection, and SQL query support for free — features that Elasticsearch locks behind paid tiers. Licensed under Apache 2.0, it's the go-to choice for organizations that want Elasticsearch capabilities without licensing concerns.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 4 GB+ RAM (2 GB minimum for JVM heap)
- 10 GB+ free disk space
- Set `vm.max_map_count=262144` on the host

```bash
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  opensearch:
    image: opensearchproject/opensearch:3.5.0
    container_name: opensearch
    ports:
      - "9200:9200"
      - "9600:9600"
    volumes:
      - os_data:/usr/share/opensearch/data
    environment:
      - discovery.type=single-node
      - OPENSEARCH_INITIAL_ADMIN_PASSWORD=YourStr0ngP@ssword!
      - OPENSEARCH_JAVA_OPTS=-Xms1g -Xmx1g
      - cluster.name=selfhosted-search
      - node.name=os-node-1
      # Disable security for development (enable for production)
      - plugins.security.disabled=true
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    restart: unless-stopped

  opensearch-dashboards:
    image: opensearchproject/opensearch-dashboards:3.5.0
    container_name: opensearch-dashboards
    ports:
      - "5601:5601"
    environment:
      - OPENSEARCH_HOSTS=["http://opensearch:9200"]
      - DISABLE_SECURITY_DASHBOARDS_PLUGIN=true
    depends_on:
      - opensearch
    restart: unless-stopped

volumes:
  os_data:
```

For production with security enabled:

```yaml
services:
  opensearch:
    image: opensearchproject/opensearch:3.5.0
    container_name: opensearch
    ports:
      - "9200:9200"
    volumes:
      - os_data:/usr/share/opensearch/data
    environment:
      - discovery.type=single-node
      - OPENSEARCH_INITIAL_ADMIN_PASSWORD=YourStr0ngP@ssword!
      - OPENSEARCH_JAVA_OPTS=-Xms2g -Xmx2g
    ulimits:
      memlock:
        soft: -1
        hard: -1
    restart: unless-stopped

  opensearch-dashboards:
    image: opensearchproject/opensearch-dashboards:3.5.0
    container_name: opensearch-dashboards
    ports:
      - "5601:5601"
    environment:
      - OPENSEARCH_HOSTS=["https://opensearch:9200"]
    depends_on:
      - opensearch
    restart: unless-stopped

volumes:
  os_data:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

```bash
# Check cluster health (security disabled)
curl http://localhost:9200/_cluster/health?pretty

# With security enabled:
curl -k -u admin:YourStr0ngP@ssword! https://localhost:9200/_cluster/health?pretty

# Index a document
curl -X POST http://localhost:9200/my-index/_doc \
  -H "Content-Type: application/json" \
  -d '{"title": "Self-Hosting Guide", "content": "Run your own search engine"}'

# Search
curl "http://localhost:9200/my-index/_search?q=self-hosting&pretty"
```

Access OpenSearch Dashboards at `http://your-server:5601` for the Kibana-like visualization interface.

## Configuration

### Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `discovery.type` | | Set to `single-node` |
| `OPENSEARCH_INITIAL_ADMIN_PASSWORD` | Required | Admin password (must meet complexity requirements) |
| `OPENSEARCH_JAVA_OPTS` | | JVM heap: `-Xms1g -Xmx1g` |
| `plugins.security.disabled` | `false` | Disable the security plugin |
| `cluster.name` | `opensearch` | Cluster identifier |
| `node.name` | Auto-generated | Node identifier |

### Password Requirements

`OPENSEARCH_INITIAL_ADMIN_PASSWORD` must contain:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

## Advanced Configuration

### Built-in Alerting (Free)

Create alerts through OpenSearch Dashboards → Alerting:
1. Define a monitor (query + schedule)
2. Set triggers (conditions that fire alerts)
3. Configure actions (email, Slack, webhook)

### SQL Query Support (Free)

Query your data with SQL:

```bash
curl -X POST "http://localhost:9200/_plugins/_sql" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT title FROM my-index WHERE match(content, '\''search'\'')"}'
```

### Index State Management (ISM)

Automatic index lifecycle management:

```bash
curl -X PUT "http://localhost:9200/_plugins/_ism/policies/logs-policy" \
  -H "Content-Type: application/json" \
  -d '{
    "policy": {
      "description": "Rotate and delete old logs",
      "default_state": "hot",
      "states": [
        {"name": "hot", "actions": [{"rollover": {"min_size": "10gb"}}], "transitions": [{"state_name": "delete", "conditions": {"min_index_age": "30d"}}]},
        {"name": "delete", "actions": [{"delete": {}}]}
      ]
    }
  }'
```

## Reverse Proxy

Configure your reverse proxy to forward to port 9200 (API) and 5601 (Dashboards). See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

## Backup

Use OpenSearch's snapshot API:

```bash
# Register snapshot repository
curl -X PUT "http://localhost:9200/_snapshot/backups" \
  -H "Content-Type: application/json" \
  -d '{"type": "fs", "settings": {"location": "/usr/share/opensearch/data/backups"}}'

# Create snapshot
curl -X PUT "http://localhost:9200/_snapshot/backups/snapshot_1"
```

See [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Container Won't Start

**Symptom:** Exit with `max virtual memory areas` error.
**Fix:** Run `sudo sysctl -w vm.max_map_count=262144` on the host.

### Password Rejected

**Symptom:** `OPENSEARCH_INITIAL_ADMIN_PASSWORD` not accepted.
**Fix:** Password must be 8+ characters with uppercase, lowercase, digit, and special character. The initial password only takes effect on first start — changing it after requires the security API.

### Dashboards Can't Connect

**Symptom:** OpenSearch Dashboards shows connection error.
**Fix:** If security is disabled, use `http://` in `OPENSEARCH_HOSTS` and set `DISABLE_SECURITY_DASHBOARDS_PLUGIN=true`. If security is enabled, use `https://` and configure credentials.

## Resource Requirements

- **RAM:** 2 GB minimum (1 GB JVM heap + OS), 4-8 GB recommended
- **CPU:** Medium (indexing is CPU-intensive)
- **Disk:** SSD recommended, size depends on data volume

## Verdict

OpenSearch is the best fully open-source alternative to Elasticsearch. You get security, alerting, anomaly detection, and SQL queries for free — without licensing restrictions. The API is compatible with Elasticsearch 7.x tooling. The trade-off is slightly lower performance than Elasticsearch in benchmarks, but for most self-hosted deployments, the difference is negligible.

**Choose OpenSearch** for open-source search + analytics without licensing concerns. **Choose [Elasticsearch](/apps/elasticsearch/)** if you need cutting-edge Elastic features or tight ELK Stack integration.

## Related

- [How to Self-Host Elasticsearch](/apps/elasticsearch/)
- [Elasticsearch vs OpenSearch](/compare/elasticsearch-vs-opensearch/)
- [Meilisearch vs Elasticsearch](/compare/meilisearch-vs-elasticsearch/)
- [Best Self-Hosted Search Engines](/best/search-engines/)
- [Self-Hosted Algolia Alternatives](/replace/algolia/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
