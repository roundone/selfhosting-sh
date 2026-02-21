---
title: "Self-Hosted Search Engine Setup Guide"
description: "Learn how to set up a self-hosted search engine. Choose between Meilisearch, Typesense, Elasticsearch, and SearXNG for your use case."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "foundations"
apps:
  - meilisearch
  - typesense
  - elasticsearch
  - searxng
tags:
  - foundations
  - search
  - docker
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is a Self-Hosted Search Engine?

A self-hosted search engine runs on your own server, giving you full control over your search data and infrastructure. There are two main categories:

1. **Application search engines** (Meilisearch, Typesense, Elasticsearch, OpenSearch, ManticoreSearch, Sonic) — add search functionality to your websites and applications. They index your data and serve search queries through APIs.

2. **Web metasearch engines** (SearXNG, Whoogle) — aggregate results from public search engines (Google, Bing, DuckDuckGo) without tracking. They replace Google as your daily search engine.

This guide covers the concepts, architecture, and setup patterns common to all self-hosted search engines, helping you make the right choice and get running quickly.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- Basic understanding of REST APIs (for application search)
- At least 256 MB free RAM (more for Elasticsearch/OpenSearch)

## Choosing the Right Search Engine

### Application Search Decision Matrix

| If You Need... | Choose | Why |
|----------------|--------|-----|
| Simple, fast app search | [Meilisearch](/apps/meilisearch/) | Zero-config, typo-tolerant, instant results |
| Lowest possible latency | [Typesense](/apps/typesense/) | In-memory indexes, sub-millisecond search |
| Complex queries + analytics | [Elasticsearch](/apps/elasticsearch/) | Full query DSL, aggregations, ELK stack |
| Elasticsearch but open source | [OpenSearch](/apps/opensearch/) | Apache 2.0 fork, API-compatible |
| SQL-based search | [ManticoreSearch](/apps/manticoresearch/) | MySQL protocol, familiar syntax |
| Minimal resources | [Sonic](/apps/sonic/) | 20 MB RAM, returns IDs only |

### Web Search Decision Matrix

| If You Need... | Choose | Why |
|----------------|--------|-----|
| Private multi-engine search | [SearXNG](/apps/searxng/) | 70+ engines, zero tracking |
| Simple Google without tracking | [Whoogle](/apps/whoogle/) | Google results, no ads/tracking |

## Core Concepts

### Indexes and Documents

Application search engines store data in **indexes** (also called **collections** or **tables** depending on the engine). An index holds **documents** — JSON objects with fields.

```json
{
  "id": 1,
  "title": "Getting Started with Docker",
  "content": "Docker is a containerization platform...",
  "category": "foundations",
  "date": "2026-02-15"
}
```

You push documents into an index, then query that index. The search engine tokenizes text, builds inverted indexes, and returns results ranked by relevance.

### Indexing vs Querying

- **Indexing** = pushing data into the search engine. This happens when you create or update content. Most engines handle this asynchronously — they accept the data and index it in the background.
- **Querying** = searching the indexed data. This happens on every user search. Latency here matters most — users expect results in under 100ms.

### Relevance and Ranking

Search engines rank results by relevance. The default ranking typically considers:

- **Term frequency** — how often the search term appears in the document
- **Field weighting** — matches in `title` rank higher than matches in `body`
- **Typo tolerance** — "dokcer" still finds "docker"
- **Exact vs prefix match** — "docker" ranks higher than "dockerize"

Most engines let you customize ranking rules. Meilisearch and Typesense provide sensible defaults that work for most applications.

### Schemas

Some search engines require a **schema** (field definitions and types) before indexing:

| Engine | Schema Required? |
|--------|-----------------|
| Meilisearch | No — infers from first document |
| Typesense | Yes — define collection schema upfront |
| Elasticsearch | Optional — auto-maps, but explicit is better |
| OpenSearch | Optional — same as Elasticsearch |
| ManticoreSearch | Yes — CREATE TABLE with types |
| Sonic | No — schema-less, text only |

**Recommendation:** Even when schemas are optional, define them explicitly. Auto-inference can mistype fields (a `"123"` field might be mapped as text or integer depending on the engine).

## Common Setup Pattern

All application search engines follow the same basic setup:

### 1. Deploy with Docker

Every engine in this guide has an official Docker image. The setup is always a `docker-compose.yml` with volumes for persistent data:

```yaml
services:
  search:
    image: [engine-image]:[version]
    ports:
      - "[port]:[port]"
    volumes:
      - search_data:/var/lib/[engine]/data
    restart: unless-stopped

volumes:
  search_data:
```

See the individual guides for complete Docker Compose configurations:
- [Meilisearch Docker setup](/apps/meilisearch/)
- [Typesense Docker setup](/apps/typesense/)
- [Elasticsearch Docker setup](/apps/elasticsearch/)
- [OpenSearch Docker setup](/apps/opensearch/)
- [ManticoreSearch Docker setup](/apps/manticoresearch/)
- [Sonic Docker setup](/apps/sonic/)

### 2. Create an Index

After deployment, create an index (or collection/table):

**Meilisearch:**
```bash
curl -X POST http://localhost:7700/indexes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"uid": "articles", "primaryKey": "id"}'
```

**Typesense:**
```bash
curl -X POST http://localhost:8108/collections \
  -H "Content-Type: application/json" \
  -H "X-TYPESENSE-API-KEY: YOUR_API_KEY" \
  -d '{
    "name": "articles",
    "fields": [
      {"name": "title", "type": "string"},
      {"name": "content", "type": "string"},
      {"name": "category", "type": "string", "facet": true}
    ]
  }'
```

**Elasticsearch:**
```bash
curl -X PUT http://localhost:9200/articles \
  -H "Content-Type: application/json" \
  -d '{
    "mappings": {
      "properties": {
        "title": {"type": "text"},
        "content": {"type": "text"},
        "category": {"type": "keyword"}
      }
    }
  }'
```

### 3. Index Documents

Push your data into the search engine:

**Meilisearch:**
```bash
curl -X POST http://localhost:7700/indexes/articles/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '[
    {"id": 1, "title": "Docker Basics", "content": "...", "category": "foundations"},
    {"id": 2, "title": "Nginx Proxy Manager", "content": "...", "category": "reverse-proxy"}
  ]'
```

All engines accept JSON arrays for bulk indexing. For large datasets (100K+ documents), batch your imports in chunks of 10,000-50,000 documents.

### 4. Search

Query your indexed data:

**Meilisearch:**
```bash
curl http://localhost:7700/indexes/articles/search \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"q": "docker compose"}'
```

**Typesense:**
```bash
curl "http://localhost:8108/collections/articles/documents/search?q=docker+compose&query_by=title,content" \
  -H "X-TYPESENSE-API-KEY: YOUR_API_KEY"
```

**Elasticsearch:**
```bash
curl -X POST http://localhost:9200/articles/_search \
  -H "Content-Type: application/json" \
  -d '{"query": {"match": {"title": "docker compose"}}}'
```

### 5. Integrate with Your Application

Use official SDKs to integrate search into your application:

| Engine | JavaScript | Python | PHP | Go | Ruby |
|--------|-----------|--------|-----|-----|------|
| Meilisearch | `meilisearch` | `meilisearch` | `meilisearch-php` | `meilisearch-go` | `meilisearch-ruby` |
| Typesense | `typesense` | `typesense` | `typesense-php` | `typesense-go` | `typesense-ruby` |
| Elasticsearch | `@elastic/elasticsearch` | `elasticsearch` | `elasticsearch-php` | `go-elasticsearch` | `elasticsearch-ruby` |
| OpenSearch | `@opensearch-project/opensearch` | `opensearch-py` | `opensearch-php` | `opensearch-go` | N/A |

## Frontend Search UI

For user-facing search interfaces, [InstantSearch.js](https://github.com/algolia/instantsearch) (Algolia's open-source frontend library) works with Meilisearch, Typesense, and Elasticsearch through adapters:

**Meilisearch:**
```bash
npm install @meilisearch/instant-meilisearch instantsearch.js
```

**Typesense:**
```bash
npm install typesense-instantsearch-adapter instantsearch.js
```

These provide ready-made components: search boxes, hit lists, facet filters, pagination — with minimal custom code.

## Security

### Authentication

All application search engines support API key authentication. Always enable it in production:

| Engine | Auth Method |
|--------|------------|
| Meilisearch | Master key + generated API keys (search-only, admin) |
| Typesense | API keys with scoped permissions |
| Elasticsearch | Built-in security (username/password + role-based) |
| OpenSearch | Security plugin with RBAC (enabled by default) |
| ManticoreSearch | No built-in auth (use network-level security) |
| Sonic | Password-based (config file) |

### Network Security

Search engines should **never be directly exposed to the internet**. Standard security setup:

1. **Bind to localhost or Docker network only.** Don't expose ports 7700, 8108, 9200, etc. on `0.0.0.0` unless behind a reverse proxy.
2. **Use a reverse proxy** for external access. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).
3. **Separate search keys from admin keys.** Frontend search uses read-only keys. Admin keys stay server-side.
4. **Firewall rules.** Only allow access from your application servers.

## Backup and Recovery

Search indexes should be backed up alongside your application data:

- **Meilisearch:** Built-in dump/snapshot feature via API
- **Typesense:** Snapshot API for point-in-time backups
- **Elasticsearch:** Snapshot and restore API with repository support
- **OpenSearch:** Same snapshot API as Elasticsearch
- **ManticoreSearch:** `BACKUP` SQL command
- **Sonic:** Back up the data volume directly

For all engines, the simplest backup is a Docker volume backup:

```bash
docker run --rm -v search_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/search-backup-$(date +%Y%m%d).tar.gz /data
```

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a comprehensive backup approach.

## Common Mistakes

### 1. Using `:latest` Docker Tags

Pin your search engine to a specific version. A surprise major version upgrade can break your index format, API compatibility, or configuration.

```yaml
# Bad
image: getmeili/meilisearch:latest

# Good
image: getmeili/meilisearch:v1.35.1
```

### 2. No Authentication in Production

Every search engine defaults to either no auth or weak auth. Before exposing any search endpoint, configure proper API keys and restrict access.

### 3. Not Setting Resource Limits

Elasticsearch and OpenSearch will consume all available memory if not constrained. Always set JVM heap size:

```yaml
environment:
  - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
```

Meilisearch and Typesense self-manage memory but can still grow with large indexes. Monitor usage.

### 4. Exposing Admin APIs Publicly

Separate your search (read-only) and admin (write) API keys. Never expose admin keys to the frontend. A leaked admin key lets anyone modify or delete your index.

### 5. Not Re-Indexing After Schema Changes

Changing field types or adding new searchable fields often requires a full re-index. Plan for this — keep your source data accessible so you can rebuild indexes when needed.

## Next Steps

1. **Choose your engine** using the decision matrices above
2. **Deploy it** following the individual setup guide
3. **Index your data** using the engine's SDK or REST API
4. **Add a search UI** with InstantSearch.js or a custom frontend
5. **Secure it** with API keys and network restrictions
6. **Back it up** on a regular schedule

## Related

- [Best Self-Hosted Search Engines](/best/search-engines/)
- [How to Self-Host Meilisearch](/apps/meilisearch/)
- [How to Self-Host Typesense](/apps/typesense/)
- [How to Self-Host Elasticsearch](/apps/elasticsearch/)
- [How to Self-Host OpenSearch](/apps/opensearch/)
- [How to Self-Host ManticoreSearch](/apps/manticoresearch/)
- [How to Self-Host Sonic](/apps/sonic/)
- [How to Self-Host SearXNG](/apps/searxng/)
- [How to Self-Host Whoogle](/apps/whoogle/)
- [Meilisearch vs Typesense](/compare/meilisearch-vs-typesense/)
- [Meilisearch vs Elasticsearch](/compare/meilisearch-vs-elasticsearch/)
- [SearXNG vs Whoogle](/compare/searxng-vs-whoogle/)
- [Self-Hosted Algolia Alternatives](/replace/algolia/)
- [Self-Hosted Google Alternatives](/replace/google-search/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
