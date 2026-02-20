---
title: "How to Self-Host Typesense with Docker Compose"
description: "Deploy Typesense with Docker for sub-millisecond search. In-memory engine setup with API keys, collections, and clustering."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "search-engines"
apps:
  - typesense
tags:
  - self-hosted
  - typesense
  - docker
  - search
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Typesense?

[Typesense](https://typesense.org/) is an in-memory search engine designed for sub-millisecond search latency. It stores the entire search index in RAM for maximum speed, with automatic typo tolerance, faceting, and geo-search built in. Written in C++, it's designed as a faster, easier alternative to Elasticsearch for application search. Think of it as Algolia that you self-host.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB+ RAM (scales with index size — 2-3x indexed data size)
- 5 GB+ free disk space
- No GPU required

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  typesense:
    image: typesense/typesense:30.1
    container_name: typesense
    ports:
      - "8108:8108"
    volumes:
      - typesense_data:/data
    command: >
      --data-dir /data
      --api-key=your-api-key-change-this-to-something-strong
      --enable-cors
    restart: unless-stopped

volumes:
  typesense_data:
```

Note: Typesense uses CLI arguments instead of environment variables for configuration.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

### Verify the Server

```bash
curl -H "X-TYPESENSE-API-KEY: your-api-key-change-this-to-something-strong" \
  http://localhost:8108/health
```

### Create a Collection (Schema)

Unlike Meilisearch, Typesense requires you to define a schema:

```bash
curl -X POST http://localhost:8108/collections \
  -H "X-TYPESENSE-API-KEY: your-api-key-change-this-to-something-strong" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "movies",
    "fields": [
      {"name": "title", "type": "string"},
      {"name": "genre", "type": "string", "facet": true},
      {"name": "year", "type": "int32", "facet": true},
      {"name": "rating", "type": "float", "optional": true}
    ],
    "default_sorting_field": "year"
  }'
```

### Index Documents

```bash
curl -X POST http://localhost:8108/collections/movies/documents/import \
  -H "X-TYPESENSE-API-KEY: your-api-key-change-this-to-something-strong" \
  -H "Content-Type: text/plain" \
  --data-binary '{"title": "The Matrix", "genre": "sci-fi", "year": 1999, "rating": 8.7}
{"title": "Interstellar", "genre": "sci-fi", "year": 2014, "rating": 8.7}
{"title": "The Dark Knight", "genre": "action", "year": 2008, "rating": 9.0}'
```

### Search

```bash
curl "http://localhost:8108/collections/movies/search?q=matrx&query_by=title" \
  -H "X-TYPESENSE-API-KEY: your-api-key-change-this-to-something-strong"
```

Typo tolerance is automatic — "matrx" finds "The Matrix".

## Configuration

### Key CLI Arguments

| Argument | Default | Description |
|----------|---------|-------------|
| `--data-dir` | Required | Directory for persistent data |
| `--api-key` | Required | Admin API key |
| `--enable-cors` | `false` | Enable CORS for browser requests |
| `--api-port` | `8108` | HTTP API port |
| `--peering-port` | `8107` | Port for cluster communication |
| `--thread-pool-size` | `4` | Number of request handling threads |
| `--num-collections-parallel-load` | `0` | Collections to load in parallel on startup |
| `--cache-num-entries` | `1000` | Number of search results to cache |
| `--log-dir` | | Directory for log files |

### Scoped API Keys

Create search-only API keys for frontend use:

```bash
curl -X POST http://localhost:8108/keys \
  -H "X-TYPESENSE-API-KEY: your-api-key-change-this-to-something-strong" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Search-only key",
    "actions": ["documents:search"],
    "collections": ["movies"]
  }'
```

## Advanced Configuration

### Clustering (High Availability)

Typesense supports built-in Raft-based clustering:

```yaml
services:
  typesense-1:
    image: typesense/typesense:30.1
    command: >
      --data-dir /data
      --api-key=your-api-key
      --nodes=/config/nodes.txt
      --api-port=8108
      --peering-port=8107
    volumes:
      - ts1_data:/data
      - ./nodes.txt:/config/nodes.txt:ro
    restart: unless-stopped

  typesense-2:
    image: typesense/typesense:30.1
    command: >
      --data-dir /data
      --api-key=your-api-key
      --nodes=/config/nodes.txt
      --api-port=8108
      --peering-port=8107
    volumes:
      - ts2_data:/data
      - ./nodes.txt:/config/nodes.txt:ro
    restart: unless-stopped
```

Create `nodes.txt`:

```
typesense-1:8107:8108,typesense-2:8107:8108
```

### Vector Search

Typesense supports vector search for semantic similarity:

```bash
# Add a vector field to your collection
curl -X PATCH http://localhost:8108/collections/movies \
  -H "X-TYPESENSE-API-KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"fields": [{"name": "embedding", "type": "float[]", "num_dim": 384}]}'
```

### Result Curation (Overrides)

Pin specific results for specific queries (useful for merchandising):

```bash
curl -X PUT "http://localhost:8108/collections/movies/overrides/featured-scifi" \
  -H "X-TYPESENSE-API-KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"rule": {"query": "best sci-fi", "match": "contains"}, "includes": [{"id": "1", "position": 1}]}'
```

## Reverse Proxy

Configure your reverse proxy to forward to port 8108. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

### Snapshots

Create a snapshot:

```bash
curl -X POST "http://localhost:8108/operations/snapshot?snapshot_path=/data/snapshots" \
  -H "X-TYPESENSE-API-KEY: your-api-key"
```

### Volume Backup

```bash
docker run --rm -v typesense_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/typesense-backup.tar.gz /data
```

See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### High Memory Usage

**Symptom:** Typesense uses more RAM than expected.
**Fix:** Typesense keeps the entire index in RAM. Expect 2-3x the size of your indexed fields. Remove unused fields from the schema. Consider [Meilisearch](/apps/meilisearch) if your dataset is too large for RAM.

### Collection Creation Fails

**Symptom:** 400 error when creating a collection.
**Fix:** Check that all field types are valid (`string`, `int32`, `int64`, `float`, `bool`, `string[]`, `float[]`). Ensure `default_sorting_field` references a numeric field.

### Search Returns No Results

**Symptom:** Documents indexed but search finds nothing.
**Fix:** Verify `query_by` parameter references the correct field(s). Check that the field is of type `string` or `string[]` (non-string fields aren't text-searchable).

## Resource Requirements

- **RAM:** 2-3x the size of indexed data (in-memory engine)
- **CPU:** Low (C++ binary, very efficient)
- **Disk:** Index size + snapshot space

## Verdict

Typesense is the fastest application search engine you can self-host. Sub-millisecond latency is real — and it makes search-as-you-type feel instant. The trade-off is RAM usage: keeping the entire index in memory means larger datasets get expensive. Built-in Raft clustering and result curation are standout features.

**Choose Typesense** for application search where speed is critical and your index fits in RAM. **Choose [Meilisearch](/apps/meilisearch)** for similar functionality with lower RAM usage (disk-based). **Choose [Elasticsearch](/apps/elasticsearch)** for analytics, logging, and massive-scale search.

## Related

- [Meilisearch vs Typesense](/compare/meilisearch-vs-typesense)
- [Typesense vs Elasticsearch](/compare/typesense-vs-elasticsearch)
- [How to Self-Host Meilisearch](/apps/meilisearch)
- [How to Self-Host Elasticsearch](/apps/elasticsearch)
- [Self-Hosted Algolia Alternatives](/replace/algolia)
- [Best Self-Hosted Search Engines](/best/search-engines)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
