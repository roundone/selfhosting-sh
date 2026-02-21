---
title: "How to Self-Host Sonic with Docker Compose"
description: "Deploy Sonic with Docker for lightweight search indexing. Fast, schema-less search backend for applications with minimal resources."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "search-engines"
apps:
  - sonic
tags:
  - self-hosted
  - sonic
  - docker
  - search
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Sonic?

[Sonic](https://github.com/valeriansaliou/sonic) is a lightweight, schema-less search backend designed to replace heavy search engines like Elasticsearch when you need basic full-text search with minimal resource usage. Written in Rust, Sonic uses less than 20 MB of RAM while providing fast search with auto-complete suggestions. It's not a database — it stores search indexes only and returns document IDs that you look up in your actual database.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 64 MB+ RAM (Sonic is extremely lightweight)
- 1 GB free disk space
- No GPU required

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  sonic:
    image: valeriansaliou/sonic:v1.4.9
    container_name: sonic
    ports:
      - "1491:1491"
    volumes:
      - sonic_data:/var/lib/sonic/store
      - ./sonic.cfg:/etc/sonic.cfg:ro
    restart: unless-stopped

volumes:
  sonic_data:
```

Create a `sonic.cfg` configuration file:

```toml
[server]
log_level = "info"

[channel]
inet = "0.0.0.0:1491"
tcp_timeout = 300

[channel.search]
query_limit_default = 10
query_limit_maximum = 100
query_alternates_try = 4
suggest_limit_default = 5
suggest_limit_maximum = 20

[store]

[store.kv]
path = "/var/lib/sonic/store/kv/"
retain_word_objects = 1000

[store.kv.pool]
inactive_after = 1800

[store.kv.database]
flush_after = 900
compress = true

[store.fst]
path = "/var/lib/sonic/store/fst/"

[store.fst.pool]
inactive_after = 300

[store.fst.graph]
consolidate_after = 180
max_size = 2048
max_words = 250000
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

Sonic uses a custom text protocol over TCP (not HTTP). Use a Sonic client library or `telnet`:

```bash
telnet localhost 1491
```

### Connect and Push Data

```
START search SecretPassword
# Connected to Sonic

# Push text into the index
PUSH messages user:1 conv:1 "Hello, how are you today?"
PUSH messages user:1 conv:2 "Let's talk about self-hosting"

# Search
QUERY messages user:1 "self-hosting"
# Returns: conv:2

# Auto-suggest
SUGGEST messages user:1 "sel"
# Returns: self-hosting

QUIT
```

### Using Client Libraries

Sonic has official and community client libraries for most languages:
- **Node.js:** `sonic-channel`
- **Python:** `sonic-client`
- **Go:** `go-sonic`
- **Ruby:** `sonic-ruby`
- **PHP:** `php-sonic`

Example with Node.js:

```javascript
const Sonic = require("sonic-channel");

const search = new Sonic.Search({ host: "localhost", port: 1491, auth: "SecretPassword" });
await search.connect();
const results = await search.query("messages", "user:1", "self-hosting");
// results = ["conv:2"]
```

## Configuration

### Key Config Options

| Section | Setting | Default | Description |
|---------|---------|---------|-------------|
| `channel.inet` | | `0.0.0.0:1491` | Listen address and port |
| `channel.search.query_limit_default` | | `10` | Default results per query |
| `channel.search.query_alternates_try` | | `4` | Typo correction alternatives |
| `channel.search.suggest_limit_default` | | `5` | Default suggestions count |
| `store.kv.retain_word_objects` | | `1000` | Word objects kept in memory |
| `store.fst.graph.max_words` | | `250000` | Max words in suggestion graph |

### Authentication

Set a password in `sonic.cfg`:

```toml
[channel]
auth_password = "YourSecretPassword"
```

All client connections must authenticate with `START [mode] [password]`.

## Reverse Proxy

Sonic uses a TCP protocol, not HTTP. You cannot put it behind a standard HTTP reverse proxy. Access it directly via port 1491 from your application servers. Restrict access via firewall rules. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

## Backup

Back up the Sonic data volume:

```bash
docker run --rm -v sonic_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/sonic-backup.tar.gz /data
```

Sonic stores search indexes only. If you lose the data, you can re-index from your source database. See [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Connection Refused

**Symptom:** Can't connect on port 1491.
**Fix:** Verify `channel.inet` in `sonic.cfg` is set to `0.0.0.0:1491`. Check Docker port mapping. Ensure the config file is mounted correctly.

### No Search Results

**Symptom:** `QUERY` returns empty results.
**Fix:** Verify data was pushed with `PUSH`. The collection and bucket names must match exactly. Sonic indexes text — it returns document IDs, which you look up in your database.

### High Memory Usage

**Symptom:** Sonic using more RAM than expected.
**Fix:** Reduce `retain_word_objects` in config. Reduce `max_words` in FST graph settings. Sonic is designed to use minimal RAM, so high usage usually indicates a very large index.

## Resource Requirements

- **RAM:** 10-50 MB (extremely lightweight)
- **CPU:** Very low
- **Disk:** Index size is typically 10-20% of indexed text

## Verdict

Sonic is the lightest search engine you can self-host. If you need basic full-text search and auto-suggest for an application and don't want the overhead of Elasticsearch or even Meilisearch, Sonic does the job in 20 MB of RAM. The trade-off is a limited feature set — no faceting, no aggregations, no HTTP API.

**Choose Sonic** for minimal search on resource-constrained servers (Raspberry Pi, cheap VPS). **Choose [Meilisearch](/apps/meilisearch/)** for a more complete search engine with an HTTP API. **Choose [Elasticsearch](/apps/elasticsearch/)** for full-featured search and analytics.

## Related

- [How to Self-Host Meilisearch](/apps/meilisearch/)
- [How to Self-Host Typesense](/apps/typesense/)
- [Best Self-Hosted Search Engines](/best/search-engines/)
- [Self-Hosted Algolia Alternatives](/replace/algolia/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
