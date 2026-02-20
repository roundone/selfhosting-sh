---
title: "How to Self-Host Elasticsearch with Docker"
description: "Deploy Elasticsearch with Docker Compose for search, analytics, and log aggregation. Single-node and production setup guide."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "search-engines"
apps:
  - elasticsearch
tags:
  - self-hosted
  - elasticsearch
  - docker
  - search
  - analytics
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Elasticsearch?

[Elasticsearch](https://www.elastic.co/elasticsearch) is the most widely deployed search and analytics engine in the world. Built on Apache Lucene, it handles full-text search, structured search, analytics, and log aggregation. It's the core of the ELK Stack (Elasticsearch, Logstash, Kibana) used for observability across millions of deployments. Self-hosting gives you complete control over your search and analytics data.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 4 GB+ RAM (2 GB minimum for JVM heap)
- 10 GB+ free disk space
- Set `vm.max_map_count=262144` on the host (required)

Set the required kernel parameter:

```bash
sudo sysctl -w vm.max_map_count=262144
# Make persistent:
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.19.11
    container_name: elasticsearch
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data
    environment:
      # Single-node mode (no cluster discovery)
      - discovery.type=single-node
      # JVM heap size (set to ~50% of available RAM, max 32g)
      - ES_JAVA_OPTS=-Xms1g -Xmx1g
      # Disable security for development (enable for production)
      - xpack.security.enabled=false
      # Cluster name
      - cluster.name=selfhosted-search
      # Node name
      - node.name=es-node-1
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    restart: unless-stopped

volumes:
  es_data:
```

For production with security enabled:

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.19.11
    container_name: elasticsearch
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms2g -Xmx2g
      - xpack.security.enabled=true
      - ELASTIC_PASSWORD=changeme-use-strong-password
      - cluster.name=selfhosted-search
    ulimits:
      memlock:
        soft: -1
        hard: -1
    restart: unless-stopped

  kibana:
    image: docker.elastic.co/kibana/kibana:8.19.11
    container_name: kibana
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - ELASTICSEARCH_USERNAME=kibana_system
      - ELASTICSEARCH_PASSWORD=changeme-kibana-password
    depends_on:
      - elasticsearch
    restart: unless-stopped

volumes:
  es_data:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

### Without Security

```bash
# Check cluster health
curl http://localhost:9200/_cluster/health?pretty

# Index a document
curl -X POST http://localhost:9200/my-index/_doc \
  -H "Content-Type: application/json" \
  -d '{"title": "Self-Hosting Guide", "content": "How to run your own services"}'

# Search
curl "http://localhost:9200/my-index/_search?q=self-hosting&pretty"
```

### With Security

When security is enabled, Elasticsearch generates TLS certificates and passwords on first start. Check logs for the auto-generated `elastic` user password:

```bash
docker logs elasticsearch 2>&1 | grep "Password"
```

## Configuration

### Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `discovery.type` | | Set to `single-node` for single-node deployment |
| `ES_JAVA_OPTS` | | JVM heap: `-Xms1g -Xmx1g` (set both equal) |
| `xpack.security.enabled` | `true` (8.x) | Enable/disable security |
| `ELASTIC_PASSWORD` | Auto-generated | Password for `elastic` user |
| `cluster.name` | `elasticsearch` | Cluster identifier |
| `node.name` | Auto-generated | Node identifier |
| `bootstrap.memory_lock` | `false` | Lock JVM memory to prevent swapping |

### JVM Heap Sizing

Set `-Xms` and `-Xmx` to the same value. Guidelines:
- **Minimum:** 512m (testing only)
- **Small deployments:** 1g-2g
- **Medium:** 4g-8g
- **Large:** 16g-31g (never exceed 31g — compressed oops threshold)
- **Rule of thumb:** 50% of available RAM, max 32g

## Advanced Configuration

### Index Lifecycle Management (ILM)

Automatically manage index retention for logs:

```bash
curl -X PUT "http://localhost:9200/_ilm/policy/logs-policy" \
  -H "Content-Type: application/json" \
  -d '{
    "policy": {
      "phases": {
        "hot": {"actions": {"rollover": {"max_size": "10gb", "max_age": "7d"}}},
        "delete": {"min_age": "30d", "actions": {"delete": {}}}
      }
    }
  }'
```

### Snapshot Repository (Backup)

```bash
# Register a filesystem snapshot repository
curl -X PUT "http://localhost:9200/_snapshot/my_backup" \
  -H "Content-Type: application/json" \
  -d '{"type": "fs", "settings": {"location": "/usr/share/elasticsearch/data/backups"}}'

# Create a snapshot
curl -X PUT "http://localhost:9200/_snapshot/my_backup/snapshot_1"
```

## Reverse Proxy

Configure your reverse proxy to forward to port 9200 (API) and 5601 (Kibana). See [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

Use Elasticsearch's snapshot API for consistent backups. The data volume can also be backed up when the service is stopped. See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Container Crashes on Start

**Symptom:** Exit code 78, `max virtual memory areas vm.max_map_count` error.
**Fix:** Run `sudo sysctl -w vm.max_map_count=262144` on the host. This is the most common Elasticsearch Docker issue.

### Out of Memory

**Symptom:** Container killed by OOM killer.
**Fix:** Reduce `ES_JAVA_OPTS` heap size. Ensure the host has at least 2x the JVM heap size in total RAM (the OS needs RAM for file system cache). Set `memlock` ulimits.

### Slow Queries

**Symptom:** Search responses take seconds.
**Fix:** Check index mappings — use `keyword` for exact match fields, `text` for full-text search. Add SSD storage. Increase JVM heap. Check for expensive aggregations.

### Cluster Status Yellow/Red

**Symptom:** `_cluster/health` returns yellow or red status.
**Fix:** Yellow = unassigned replica shards (normal for single-node). Set `number_of_replicas` to 0 for single-node: `curl -X PUT "localhost:9200/_settings" -H "Content-Type: application/json" -d '{"number_of_replicas": 0}'`. Red = primary shard failures, check logs.

## Resource Requirements

- **RAM:** 2 GB minimum (1 GB JVM heap + OS), 4-8 GB recommended
- **CPU:** Medium (indexing is CPU-intensive)
- **Disk:** SSD recommended, size depends on data volume

## Verdict

Elasticsearch is the industry standard for search and analytics. If you need full-text search, log aggregation, or an observability platform, nothing else has the same depth of features and ecosystem. The trade-off is significant resource requirements and complexity.

**Choose Elasticsearch** for search + analytics + logging. **Choose [OpenSearch](/apps/opensearch)** for the same capabilities with a fully open-source license. **Choose [Meilisearch](/apps/meilisearch) or [Typesense](/apps/typesense)** if you just need application search without the analytics overhead.

## Related

- [How to Self-Host OpenSearch](/apps/opensearch)
- [Elasticsearch vs OpenSearch](/compare/elasticsearch-vs-opensearch)
- [Meilisearch vs Elasticsearch](/compare/meilisearch-vs-elasticsearch)
- [Typesense vs Elasticsearch](/compare/typesense-vs-elasticsearch)
- [Best Self-Hosted Search Engines](/best/search-engines)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
