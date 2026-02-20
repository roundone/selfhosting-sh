---
title: "How to Self-Host ManticoreSearch with Docker"
description: "Deploy ManticoreSearch with Docker for fast full-text search. MySQL-compatible SQL interface and lightweight alternative to Elasticsearch."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "search-engines"
apps:
  - manticoresearch
tags:
  - self-hosted
  - manticoresearch
  - docker
  - search
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is ManticoreSearch?

[ManticoreSearch](https://manticoresearch.com/) is a high-performance search engine forked from Sphinx Search. It provides full-text search with a MySQL-compatible SQL interface — you can query it with standard SQL clients. Written in C++, it's lightweight and fast, with native support for real-time indexing, JSON attributes, and Kibana-style dashboards via Manticore Buddy.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB+ RAM
- 5 GB+ free disk space

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  manticoresearch:
    image: manticoresearch/manticore:6.3.8
    container_name: manticoresearch
    ports:
      - "9306:9306"    # MySQL protocol
      - "9308:9308"    # HTTP JSON API
    volumes:
      - manticore_data:/var/lib/manticore
    ulimits:
      nproc: 65535
      nofile:
        soft: 65535
        hard: 65535
      memlock:
        soft: -1
        hard: -1
    restart: unless-stopped

volumes:
  manticore_data:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

### SQL Interface

Connect with any MySQL client:

```bash
mysql -h 127.0.0.1 -P 9306
```

Create a table and insert documents:

```sql
CREATE TABLE movies (title text, genre string, year int);
INSERT INTO movies (title, genre, year) VALUES ('The Matrix', 'sci-fi', 1999);
INSERT INTO movies (title, genre, year) VALUES ('Interstellar', 'sci-fi', 2014);
INSERT INTO movies (title, genre, year) VALUES ('The Dark Knight', 'action', 2008);
```

Search:

```sql
SELECT * FROM movies WHERE MATCH('matrix');
```

### HTTP API

```bash
# Insert via HTTP
curl -X POST http://localhost:9308/insert \
  -H "Content-Type: application/json" \
  -d '{"index": "movies", "doc": {"title": "Inception", "genre": "sci-fi", "year": 2010}}'

# Search via HTTP
curl -X POST http://localhost:9308/search \
  -H "Content-Type: application/json" \
  -d '{"index": "movies", "query": {"match": {"title": "inception"}}}'
```

## Configuration

### Ports

| Port | Protocol | Description |
|------|----------|-------------|
| 9306 | MySQL | SQL queries via MySQL protocol |
| 9308 | HTTP | REST API and JSON queries |
| 9312 | SphinxAPI | Legacy Sphinx protocol |

### Key Configuration

ManticoreSearch is configured via `manticore.conf` or through the SQL interface:

```sql
-- Set server-wide options
SET GLOBAL query_log_format = 'sphinxql';
SET GLOBAL thread_stack = '1m';
```

## Advanced Configuration

### Real-Time Indexes

ManticoreSearch supports real-time indexing (no need to rebuild indexes):

```sql
CREATE TABLE products (
    title text,
    description text,
    price float,
    category string attribute
) morphology='stem_en';
```

### Auto-Suggest / Autocomplete

Built-in autocomplete support:

```bash
curl -X POST http://localhost:9308/autocomplete \
  -H "Content-Type: application/json" \
  -d '{"table": "movies", "query": "mat"}'
```

### Replication

ManticoreSearch supports Galera-based replication for high availability (available in the official image).

## Reverse Proxy

Configure your reverse proxy to forward to port 9308 (HTTP API). The MySQL port (9306) is typically not exposed publicly. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

```bash
docker run --rm -v manticore_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/manticore-backup.tar.gz /data
```

ManticoreSearch also supports `BACKUP` SQL command for consistent snapshots. See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### MySQL Client Can't Connect

**Symptom:** Connection refused on port 9306.
**Fix:** Verify the port mapping in docker-compose.yml. ManticoreSearch listens on 9306 for MySQL protocol, not 3306.

### Slow Full-Text Search

**Symptom:** Searches take longer than expected.
**Fix:** Ensure proper indexes are defined on text fields. Use `EXPLAIN` to analyze queries. Consider enabling morphology (`stem_en`) for better relevance.

### Data Not Persisting

**Symptom:** Data lost after container restart.
**Fix:** Verify the volume mount for `/var/lib/manticore`. Ensure the volume is a named volume or bind mount, not an anonymous volume.

## Resource Requirements

- **RAM:** 200 MB - 2 GB depending on index size
- **CPU:** Low-medium
- **Disk:** Index size is typically 30-50% of raw data size

## Verdict

ManticoreSearch is an underrated search engine that combines Elasticsearch-like capabilities with MySQL-protocol compatibility. If your team already knows SQL, ManticoreSearch removes the learning curve of a custom query DSL. It's significantly lighter than Elasticsearch while still being fast and feature-rich.

**Choose ManticoreSearch** if you want SQL-based search or a lightweight Elasticsearch alternative. **Choose [Meilisearch](/apps/meilisearch)** for simpler application search. **Choose [Elasticsearch](/apps/elasticsearch)** for the full ELK ecosystem.

## Related

- [How to Self-Host Meilisearch](/apps/meilisearch)
- [How to Self-Host Elasticsearch](/apps/elasticsearch)
- [Meilisearch vs Elasticsearch](/compare/meilisearch-vs-elasticsearch)
- [Best Self-Hosted Search Engines](/best/search-engines)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
