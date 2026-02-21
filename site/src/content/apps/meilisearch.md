---
title: "How to Self-Host Meilisearch with Docker Compose"
description: "Deploy Meilisearch with Docker for fast, typo-tolerant search. Complete setup with API keys, indexing, and configuration guide."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "search-engines"
apps:
  - meilisearch
tags:
  - self-hosted
  - meilisearch
  - docker
  - search
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Meilisearch?

[Meilisearch](https://www.meilisearch.com/) is a fast, typo-tolerant search engine designed for end-user-facing applications. It provides instant search-as-you-type results with automatic typo correction, faceted filtering, and relevance ranking — all with minimal configuration. Written in Rust, it's lightweight enough to run on a Raspberry Pi while still being fast enough for production use.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 512 MB+ RAM (more for larger datasets)
- 2 GB+ free disk space
- No GPU required

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  meilisearch:
    image: getmeili/meilisearch:v1.35.1
    container_name: meilisearch
    ports:
      - "7700:7700"
    volumes:
      - meili_data:/meili_data
    environment:
      # Master key for API authentication (min 16 chars)
      - MEILI_MASTER_KEY=your-master-key-change-this-minimum-16-chars
      # Environment: production enables API key auth
      - MEILI_ENV=production
      # Optional: Max payload size (default 100 MB)
      # - MEILI_HTTP_PAYLOAD_SIZE_LIMIT=104857600
      # Optional: Max indexing RAM (default: 2/3 of available RAM)
      # - MEILI_MAX_INDEXING_MEMORY=1073741824
      # Optional: Max indexing threads
      # - MEILI_MAX_INDEXING_THREADS=2
    restart: unless-stopped

volumes:
  meili_data:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

### Get API Keys

In production mode, Meilisearch generates two API keys from your master key:

```bash
# List API keys
curl -H "Authorization: Bearer your-master-key-change-this-minimum-16-chars" \
  http://localhost:7700/keys
```

This returns:
- **Default Admin API Key** — Full access (use server-side only)
- **Default Search API Key** — Search-only access (safe for frontend)

### Index Your First Documents

```bash
# Create an index and add documents
curl -X POST http://localhost:7700/indexes/movies/documents \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary '[
    {"id": 1, "title": "The Matrix", "genre": "sci-fi", "year": 1999},
    {"id": 2, "title": "Interstellar", "genre": "sci-fi", "year": 2014},
    {"id": 3, "title": "The Dark Knight", "genre": "action", "year": 2008}
  ]'
```

### Search

```bash
curl "http://localhost:7700/indexes/movies/search?q=matrx" \
  -H "Authorization: Bearer YOUR_SEARCH_API_KEY"
```

Note: "matrx" (typo) still finds "The Matrix" — typo tolerance works automatically.

## Configuration

### Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MEILI_MASTER_KEY` | Required | Master key for generating API keys (min 16 chars) |
| `MEILI_ENV` | `development` | Set to `production` to enforce API key auth |
| `MEILI_HTTP_PAYLOAD_SIZE_LIMIT` | `104857600` | Max request body size in bytes |
| `MEILI_MAX_INDEXING_MEMORY` | 2/3 RAM | Max RAM for indexing operations |
| `MEILI_MAX_INDEXING_THREADS` | All cores | Max CPU threads for indexing |
| `MEILI_LOG_LEVEL` | `INFO` | Log level: `ERROR`, `WARN`, `INFO`, `DEBUG`, `TRACE` |
| `MEILI_NO_ANALYTICS` | `false` | Disable anonymous analytics |
| `MEILI_DB_PATH` | `/meili_data` | Data directory path |

### Search Configuration

Configure searchable attributes, ranking rules, and facets per index:

```bash
# Set searchable attributes (order matters for relevance)
curl -X PATCH http://localhost:7700/indexes/movies/settings \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "searchableAttributes": ["title", "genre"],
    "filterableAttributes": ["genre", "year"],
    "sortableAttributes": ["year"],
    "rankingRules": ["words", "typo", "proximity", "attribute", "sort", "exactness"]
  }'
```

## Advanced Configuration

### Faceted Search

Enable faceted filtering for category-based search:

```bash
# Search with filters
curl "http://localhost:7700/indexes/movies/search" \
  -H "Authorization: Bearer YOUR_SEARCH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q": "", "filter": "genre = sci-fi AND year > 2000", "facets": ["genre"]}'
```

### Multi-Index Search

Search across multiple indexes in a single request:

```bash
curl -X POST http://localhost:7700/multi-search \
  -H "Authorization: Bearer YOUR_SEARCH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"queries": [
    {"indexUid": "movies", "q": "space"},
    {"indexUid": "books", "q": "space"}
  ]}'
```

### Tenant Tokens

Create scoped API tokens for multi-tenant applications:

```bash
# Generate a tenant token that only allows searching specific records
# (Done server-side using the SDK)
```

## Reverse Proxy

Configure your reverse proxy to forward to port 7700. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

## Backup

### Snapshots

Create a database snapshot:

```bash
curl -X POST http://localhost:7700/snapshots \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

Snapshots are saved to `/meili_data/snapshots/`.

### Volume Backup

```bash
docker run --rm -v meili_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/meilisearch-backup.tar.gz /data
```

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a comprehensive approach.

## Troubleshooting

### Indexing Slow

**Symptom:** Large document imports take a long time.
**Fix:** Increase `MEILI_MAX_INDEXING_MEMORY` and `MEILI_MAX_INDEXING_THREADS`. Index in batches of 10,000-50,000 documents. Check indexing task status: `curl http://localhost:7700/tasks`.

### Document Size Limit

**Symptom:** Error about document exceeding size limit.
**Fix:** Default max document size is ~100 KB. Increase `MEILI_HTTP_PAYLOAD_SIZE_LIMIT` for larger payloads. Consider splitting large documents into smaller ones.

### API Key 403 Forbidden

**Symptom:** Requests return 403.
**Fix:** In production mode, all requests need an API key. Use the admin key for write operations, search key for search. Verify the key is in the `Authorization: Bearer <key>` header.

### Search Returns No Results

**Symptom:** Documents indexed but search finds nothing.
**Fix:** Check that the field you're searching is in `searchableAttributes`. By default, all fields are searchable, but if you set custom searchable attributes, only those are indexed for search.

## Resource Requirements

- **RAM:** 50-100 MB idle, scales with index size (~1-2x document size)
- **CPU:** Low-medium (indexing is CPU-intensive, searching is fast)
- **Disk:** ~1-2x the size of your indexed data

## Verdict

Meilisearch is the best search engine for most self-hosted applications. The instant typo-tolerant search, zero-config relevance, and minimal resource usage make it ideal for adding search to websites, documentation sites, and internal tools. The only real limitation is single-node architecture in the Community Edition — if you need horizontal scaling, look at [Elasticsearch](/apps/elasticsearch/) or [Typesense](/apps/typesense/).

## Related

- [Meilisearch vs Typesense](/compare/meilisearch-vs-typesense/)
- [Meilisearch vs Elasticsearch](/compare/meilisearch-vs-elasticsearch/)
- [How to Self-Host Typesense](/apps/typesense/)
- [How to Self-Host Elasticsearch](/apps/elasticsearch/)
- [Self-Hosted Algolia Alternatives](/replace/algolia/)
- [Best Self-Hosted Search Engines](/best/search-engines/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
