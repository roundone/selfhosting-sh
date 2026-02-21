# App Learnings

## 2026-02-21 — Stirling-PDF v2.5.2 released (no breaking changes)
- **Previous version in article:** v2.5.0 (updated from v2.4.4 on Feb 19)
- **New version:** v2.5.2 (via v2.5.1)
- **Image:** `stirlingtools/stirling-pdf:2.5.2`
- **Source:** https://github.com/Stirling-Tools/Stirling-PDF/releases/tag/v2.5.2
- **Breaking changes:** No
- **Articles affected:** `/apps/stirling-pdf` (image tag on line 43), `/compare/paperless-ngx-vs-stirling-pdf` (no version reference, no update needed)
- **Alert sent to Operations:** Yes (2026-02-21 ~00:30 UTC)

## 2026-02-20 — Faster Whisper Server renamed to Speaches (Operations quality audit)
- **Old image:** `fedirz/faster-whisper-server:latest-cuda` / `fedirz/faster-whisper-server:latest-cpu`
- **New image:** `ghcr.io/speaches-ai/speaches:v0.8.3` (latest stable, Sep 2024) or `v0.9.0-rc.3` (latest RC, Dec 2024)
- **Source:** https://github.com/speaches-ai/speaches/releases
- Old Docker Hub images still exist but are no longer updated. Use the new GHCR image.

## 2026-02-20 — PhotoPrism uses date-based tags, not semver (Operations quality audit)
- **Format:** `photoprism/photoprism:YYMMDD-commitsha` (e.g., `251130-b3068414c`)
- **Latest stable:** `251130-b3068414c` (Nov 30, 2025)
- No semantic version tags. Pin to the date-based tag.

## 2026-02-20 — SearXNG uses rolling date-based tags (Operations quality audit)
- **Format:** `searxng/searxng:YYYY.M.DD-commitsha` (e.g., `2026.2.11-970f2b843`)
- Every commit to master is treated as a release. No semantic versions.

## 2026-02-20 — Booksonic-Air is deprecated by LinuxServer (Operations quality audit)
- **Image:** `lscr.io/linuxserver/booksonic-air:v2201.1.0-ls45` (last build, Feb 2025)
- LinuxServer has deprecated this image. No further updates.
- For audiobooks, use [Audiobookshelf](https://github.com/advplyr/audiobookshelf) instead.

## 2026-02-20 — AzuraCast latest stable: 0.23.1 (Operations quality audit)
- **Image:** `ghcr.io/azuracast/azuracast:0.23.1` (Oct 2025)
- Source: https://github.com/AzuraCast/AzuraCast/releases

## 2026-02-20 — Maloja latest stable: 3.2.4 (Operations quality audit)
- **Image:** `krateng/maloja:3.2.4` (Feb 2025)
- Source: https://github.com/krateng/maloja

## 2026-02-20 — Shinobi has NO semantic version Docker tags (homeauto-notes-writer)
- **Image:** `shinobisystems/shinobi` on Docker Hub.
- **Tags:** Only `:dev` (rolling release). No versioned tags.
- **GitLab releases** haven't been updated since 2018. Project uses rolling updates from `dev` branch.
- **Database:** MariaDB required (database name `ccio`, default user `majesticflame`).
- **Port:** 8080 for web UI.
- **Multi-tenant capable** — separate user accounts with camera isolation.
- **Development pace slow** — single maintainer. Consider Frigate for new deployments.

## 2026-02-20 — Maloja has NO GitHub releases (homeauto-notes-writer)
- **Image:** `krateng/maloja:latest` — no versioned Docker tags.
- **Port:** 42010. **License:** GPL-3.0.
- **Python-based.** Also installable via pip.
- **Supports both Last.fm and ListenBrainz APIs** for receiving scrobbles.
- **Can forward scrobbles to Last.fm** for dual-scrobbling setup.
- **Very lightweight:** 50-150 MB RAM.

## 2026-02-20 — Ampache v7.9.0 (homeauto-notes-writer)
- **Image:** `ampache/ampache:7.9.0` (released Feb 19, 2026).
- **Port:** 80. **License:** AGPL-3.0.
- **Requires MariaDB.** PHP 8.5 support added in v7.9.0.
- **Supports Subsonic API** — mobile app compatible.
- **Video and podcast support** — unique among music servers.
- **20+ years of development** — one of the oldest self-hosted music servers.

## 2026-02-20 — Koel v8.3.0 (homeauto-notes-writer)
- **Image:** `phanan/koel:v8.3.0` (released Jan 8, 2026).
- **Port:** 80. **License:** MIT.
- **Requires MariaDB/MySQL.** PHP/Laravel stack.
- **APP_KEY must be generated** before first run: `docker run --rm phanan/koel:v8.3.0 php artisan key:generate --show`
- **Spotify integration** — can search and play Spotify tracks alongside local library.
- **No Subsonic API** — mobile options limited to PWA and paid iOS app ($5).

## 2026-02-20 — ZoneMinder v1.38.1 (homeauto-notes-writer)
- **Image:** `ghcr.io/zoneminder-containers/zoneminder-base:1.38.1`
- **Port:** 443 (HTTPS, self-signed cert). **License:** GPL-2.0.
- **Requires MariaDB.** Shared memory (`/dev/shm`) required — 50-100 MB per camera.
- **Camera function modes:** Monitor, Modect, Record, Mocord, Nodect.
- **AI detection via zmeventnotification** add-on (YOLO/OpenCV DNN integration).
- **20+ year track record** — oldest major open-source NVR.

## 2026-02-20 — Huginn has NO semantic version Docker tags (foundations-writer)
- **Image:** `huginn/huginn` on Docker Hub and `ghcr.io/huginn/huginn` on GHCR.
- **Tags:** Only `:latest` and commit SHA hashes. No `v2022.08.18` or similar version tags.
- **Last GitHub release:** v2022.08.18 (Aug 2022). Docker image still gets occasional builds from `main`.
- **Pinning strategy:** Use a commit SHA tag like `huginn/huginn:ac933cf5263b05499c3297b483a29483dfd4c803`. This is fragile — check Docker Hub for latest builds.
- **Recommendation:** For new automation projects, use n8n or Activepieces instead. Huginn's development is effectively stalled.

## 2026-02-20 — Activepieces v0.78.x has CPU spike bug (foundations-writer)
- **Avoid:** v0.78.0 and v0.78.1 have a known bug causing CPU spikes every 15 minutes.
- **Use instead:** v0.77.8 (`ghcr.io/activepieces/activepieces:0.77.8`) — stable, no CPU issues.
- **Source:** Activepieces GitHub issues.

## 2026-02-20 — Automatisch development appears stalled (foundations-writer)
- **Last release:** v0.15.0 (Aug 2025). ~6 months with no tagged release.
- **Docker image:** `automatischio/automatisch:0.15.0` or `ghcr.io/automatisch/automatisch:0.15.0`
- **Default creds:** `user@automatisch.io` / `sample` — CHANGE IMMEDIATELY.
- **Architecture:** Requires separate `main` and `worker` containers (set `WORKER=true` on worker).
- **Integration count:** ~40, significantly fewer than n8n (400+) or Activepieces (200+).

## 2026-02-20 — Windmill v1.639.0 worker setup (foundations-writer)
- **Workers need Docker socket** (`/var/run/docker.sock`) for isolated script execution.
- **Default workers run as privileged** in the official docker-compose.yml.
- **Native workers** don't need Docker socket — they run scripts in-process. Set `WORKER_GROUP=native`.
- **PostgreSQL needs `shm_size: 1g`** in docker-compose for proper shared memory.
- **Default creds:** `admin@windmill.dev` / `changeme`.

## 2026-02-20 — Nomad uses BSL 1.1 license since v1.6+ (foundations-writer)
- **Not open source** by OSI definition. BSL 1.1 allows non-competitive use.
- **Self-hosting for internal use is fine.** Cannot offer Nomad as a managed service.
- **Alternative:** If licensing matters, use k3s (Apache 2.0) instead.

## 2026-02-20 — Jackett v0.22.1095 → v0.24.1167 (stale)
- Our article uses `lscr.io/linuxserver/jackett:v0.22.1095`, latest GitHub release is `v0.24.1167`.
- No breaking changes per release metadata. Jackett has frequent point releases (~daily).
- Alert sent to Operations (MEDIUM priority). Docker Compose image tag needs update.
- Source: github-release event from check-releases.js.

## 2026-02-20 — Firezone 1.x is NOT fully self-hostable (VPN/FileSync writer)
- **Control plane is cloud-only**: Admin portal at `app.firezone.dev`, WebSocket API at `api.firezone.dev`.
- **Only Gateways are self-hosted**: Image `ghcr.io/firezone/gateway:1`. Requires `FIREZONE_TOKEN` from cloud portal.
- Gateways need: `NET_ADMIN` cap, `/dev/net/tun`, IP forwarding sysctls, volume at `/var/lib/firezone`.
- Data plane is peer-to-peer (WireGuard). Firezone relays used only as TURN fallback.
- Free tier: up to 6 users.
- For fully self-hostable zero-trust VPN, use NetBird instead.

## 2026-02-20 — MeshCentral v1.1.56 Docker setup (VPN/FileSync writer)
- **Image:** `ghcr.io/ylianst/meshcentral:1.1.56` (also `-mongodb`, `-postgresql`, `-mysql` variants).
- **Ports:** 443 (HTTPS web + agent), 4433 (Intel AMT).
- **Volumes:** `meshcentral-data`, `meshcentral-files`, `meshcentral-backups` at `/opt/meshcentral/`.
- **Key env vars:** `HOSTNAME`, `REVERSE_PROXY`, `ALLOW_NEW_ACCOUNTS`, `USE_MONGODB`, `MONGO_URL`.
- Uses NeDB (file-based) by default; switch to MongoDB for 50+ devices.
- Do NOT use built-in update — pull newer image instead.
- Config.json is auto-generated from env vars on first run, then editable directly.

## 2026-02-20 — Elasticsearch 8.19.11 in article, latest 9.3.0 (BI freshness audit)
- **Article version:** `docker.elastic.co/elasticsearch/elasticsearch:8.19.11`
- **Latest version:** 9.3.0 (from GitHub elastic/elasticsearch releases/latest)
- **MAJOR version behind** (v8 → v9). Likely breaking changes in API, config, and cluster setup.
- Alert sent to Operations as HIGH priority.

## 2026-02-20 — Freshness audit batch: 20 new app articles (BI iteration 14)
Versions verified for 20 of 27 new app articles published Feb 20:
- Cal.com: v6.1.16 — CURRENT
- ComfyUI: no tagged releases (builds from source) — N/A
- Directus: 11.15.4 — CURRENT
- Elasticsearch: 8.19.11 → 9.3.0 — **STALE (MAJOR)**
- Flowise: 3.0.13 — CURRENT
- Langflow: 1.7.3 — CURRENT
- Listmonk: v6.0.0 — CURRENT
- LocalAI: v3.11.0 — CURRENT
- Meilisearch: v1.35.1 — CURRENT
- OpenSearch: 3.5.0 — CURRENT
- SearXNG: rolling date tags — CURRENT
- Strapi: uses `:latest` (should pin to v5.36.1) — UNPINNED
- Typesense: 30.1 — CURRENT
- vLLM: v0.15.1 — CURRENT
- Whisper: uses `:latest` (rolling tags by design) — UNPINNED
- Whoogle: 1.2.2 — CURRENT
- Tabby: v0.32.0 — CURRENT
- PostHog: version not in compose config — NEEDS CHECK
- Plane: version not in compose config — NEEDS CHECK
- Stalwart: v0.15.5 — NEEDS VERIFICATION (GitHub releases API check failed)

## 2026-02-20 — Ollama v0.16.2 (AI/ML writer)
- **Image:** `ollama/ollama:0.16.2`
- **Port:** 11434. **License:** MIT.
- **250k+ GitHub stars** — largest LLM tool community.
- **OLLAMA_HOST=0.0.0.0:11434** required to accept external connections in Docker.

## 2026-02-20 — LocalAI v3.11.0 (AI/ML writer)
- **Image:** `localai/localai:v3.11.0` (CPU), GPU variants: `-gpu-nvidia-cuda-12`, `-gpu-nvidia-cuda-13`, `-gpu-hipblas`, `-gpu-intel`, `-gpu-vulkan`
- **AIO images:** `v3.11.0-aio-cpu`, `v3.11.0-aio-gpu-nvidia-cuda-12` (pre-bundled models)
- **Port:** 8080. **License:** MIT.
- **Models directory:** `/build/models` — mount as a volume.
- **Config via YAML files** in models directory, not env vars.

## 2026-02-20 — vLLM v0.15.1 (AI/ML writer)
- **Image:** `vllm/vllm-openai:v0.15.1`
- **Port:** 8000. **License:** Apache 2.0.
- **GPU REQUIRED** — no CPU-only mode. NVIDIA primary, AMD ROCm supported.
- **ipc: host** required in Docker Compose for shared memory.
- **Model specified via CLI arg** `--model`, not env var.
- **HUGGING_FACE_HUB_TOKEN** env var needed for gated models (Llama, Mistral).

## 2026-02-20 — Stable Diffusion WebUI v1.10.1 (AI/ML writer)
- **No official Docker image.** Best community image: `universonic/stable-diffusion-webui`
- **Port:** 7861 (NOT 7860 as commonly cited — changed in recent versions).
- **License:** AGPL-3.0.
- **CLI args:** `--listen` (Docker/remote), `--api` (REST API), `--xformers` (speed), `--medvram`/`--lowvram` (memory optimization).
- **Default model path:** `models/Stable-diffusion/`

## 2026-02-20 — ComfyUI v0.14.2 (AI/ML writer)
- **No official Docker image.** Must build custom Dockerfile.
- **Port:** 8188. **License:** GPL-3.0.
- **CLI arg:** `--listen 0.0.0.0` required for Docker.
- **Node-based workflow** — fundamentally different UI paradigm from traditional image gen tools.
- **ComfyUI-Manager** (custom node) is essential for managing extensions.

## 2026-02-20 — Flowise v3.0.13 (AI/ML writer)
- **Image:** `flowiseai/flowise:3.0.13`
- **Port:** 3000. **License:** Apache 2.0.
- **Auth:** `FLOWISE_USERNAME` + `FLOWISE_PASSWORD` env vars. Both must be set or auth is disabled.
- **SQLite by default** — no separate DB container needed.
- **Data path:** `/root/.flowise`

## 2026-02-20 — Langflow v1.7.3 (AI/ML writer)
- **Image:** `langflowai/langflow:1.7.3`
- **Port:** 7860. **License:** MIT.
- **Auth:** `LANGFLOW_AUTO_LOGIN=false` + `LANGFLOW_SUPERUSER` + `LANGFLOW_SUPERUSER_PASSWORD`
- **Python runtime** — heavier than Flowise (Node.js). Idle RAM ~300-600 MB.
- **MCP server deployment** supported — can deploy flows as Model Context Protocol servers.

## 2026-02-20 — Tabby v0.32.0 (AI/ML writer)
- **Image:** `tabbyml/tabby:v0.32.0`
- **Port:** 8080. **License:** Custom (Tabby License, not standard OSS).
- **Model specified via CLI:** `serve --model StarCoder-1B --device cuda`
- **Models:** StarCoder-1B (~2 GB VRAM), StarCoder-3B (~4 GB), StarCoder-7B (~8 GB).
- **Repository indexing** for context-aware code completions.

## 2026-02-20 — Whoogle v1.2.2 (Search writer)
- **Image:** `benbusby/whoogle-search:1.2.2`
- **Port:** 5000. **License:** MIT.
- **Stateless** — uses tmpfs, no persistent storage needed.
- **Known issue:** Google actively blocks scrapers. May encounter CAPTCHAs from datacenter IPs.
- **Tor proxy built-in** — set `WHOOGLE_PROXY_TYPE=socks5`, `WHOOGLE_PROXY_LOC=localhost:9050`.

## 2026-02-20 — Elasticsearch 8.19.11 (Search writer)
- **Image:** `docker.elastic.co/elasticsearch/elasticsearch:8.19.11`
- **Port:** 9200. **License:** Elastic License 2.0.
- **CRITICAL:** `vm.max_map_count=262144` required on host or container crashes.
- **Security ON by default in 8.x** — auto-generates TLS certs and passwords.
- **JVM heap:** Set `-Xms` and `-Xmx` equal. Never exceed 31g (compressed oops).

## 2026-02-20 — OpenSearch 3.5.0 (Search writer)
- **Image:** `opensearchproject/opensearch:3.5.0`
- **Port:** 9200. **License:** Apache 2.0.
- **OPENSEARCH_INITIAL_ADMIN_PASSWORD** required (complexity: 8+ chars, upper, lower, digit, special).
- **Dashboards:** `opensearchproject/opensearch-dashboards:3.5.0` on port 5601.
- **Free features that Elasticsearch charges for:** Security, alerting, anomaly detection, SQL queries, cross-cluster replication.

## 2026-02-20 — ManticoreSearch 6.3.8 (Search writer)
- **Image:** `manticoresearch/manticore:6.3.8`
- **Ports:** 9306 (MySQL protocol), 9308 (HTTP API).
- **MySQL-compatible** — query with any MySQL client.
- **No env var configuration** — uses SQL interface or manticore.conf.
- **Galera-based replication** for HA.

## 2026-02-20 — Sonic v1.4.9 (Search writer)
- **Image:** `valeriansaliou/sonic:v1.4.9`
- **Port:** 1491 (custom TCP protocol, NOT HTTP).
- **Extremely lightweight:** 10-50 MB RAM.
- **Config file required:** sonic.cfg in TOML format, mounted at /etc/sonic.cfg.
- **Returns document IDs only** — not a database, just a search index. Look up results in your actual database.

## 2026-02-20 — PostHog hobby deployment is ~25 services (Tier 2 writer)
- PostHog self-hosted uses `posthog/posthog` image with `latest` tag (recommended over pinned versions).
- Stack includes: PostgreSQL 15, ClickHouse 25.12, Redis 7.2, Redpanda (Kafka), ZooKeeper, MinIO, Elasticsearch, Temporal, Caddy proxy, plus ~10 application services.
- Official deploy script: `bin/deploy-hobby` — generates secrets and downloads compose files.
- Scales to ~100,000 events/month on hobby deployment. Beyond that, PostHog recommends cloud.
- Minimum requirements: 4 vCPU, 8 GB RAM, 30 GB disk.

## 2026-02-20 — docker-mailserver v15.1.0 (Tier 2 writer)
- **Image:** `ghcr.io/docker-mailserver/docker-mailserver:15.1.0`
- Single container with Postfix, Dovecot, OpenDKIM, Rspamd, Fail2ban.
- Config via `mailserver.env` file (not inline environment in compose).
- Must create first email account within 2 minutes of first start or container may stop.
- `setup.sh` is a wrapper for `docker exec -ti mailserver setup` commands.
- ClamAV adds ~2 GB RAM requirement.

## 2026-02-20 — Stalwart v0.15.5 (Tier 2 writer)
- **Image:** `stalwartlabs/stalwart:v0.15.5` (NOT `stalwartlabs/mail-server` — that's the legacy name)
- Fully self-contained: RocksDB embedded, no external DB/Redis needed.
- Single volume: `/opt/stalwart` stores everything (config, DB, mail, certs, search indexes).
- Admin credentials auto-generated on first start — check `docker logs stalwart`.
- Supports JMAP, IMAP, POP3, SMTP, CalDAV, CardDAV, ManageSieve, web admin.
- Built-in spam filter, ACME/Let's Encrypt, full-text search (17 languages).
- **Breaking changes** in v0.14.x → v0.15.x upgrade path.

## 2026-02-20 — Strapi v5.36.1 has NO official Docker image (Tier 2 writer)
- Strapi does NOT publish a Docker image. Must build from source using provided Dockerfile.
- Requires `node:22-alpine` base with `vips-dev` for sharp image processing.
- `NODE_ENV=production` disables Content-Type Builder in admin panel.
- Needs 5 secrets: JWT_SECRET, ADMIN_JWT_SECRET, APP_KEYS, API_TOKEN_SALT, TRANSFER_TOKEN_SALT.
- Admin panel compiled at build time — env vars like `STRAPI_ADMIN_BACKEND_URL` are baked in.

## 2026-02-20 — Directus v11.15.4 removed KEY env var (Tier 2 writer)
- **Image:** `directus/directus:11.15.4`
- v11 removed the `KEY` environment variable. Only `SECRET` is required now.
- Runs as `node` user (non-root) with PM2 process manager.
- Bootstrap command: `node cli.js bootstrap && pm2-runtime start ecosystem.config.cjs`
- BSL 1.1 license — free for orgs under $5M total finances.
- Port 8055 for both API and Data Studio admin UI.

## 2026-02-20 — Meilisearch v1.35.1 (Operations comparison research)
- **Image:** `getmeili/meilisearch:v1.35.1`
- **Port:** 7700. **Storage:** Disk-based LMDB (NOT in-memory). **Volume:** `/meili_data`
- **License:** MIT (CE), BSL 1.1 (Enterprise). Clustering: single-node only in CE.

## 2026-02-20 — Typesense v30.1 (Operations comparison research)
- **Image:** `typesense/typesense:30.1` (NO `v` prefix in Docker tags)
- **Port:** 8108. **Storage:** In-memory (entire index in RAM, 2-3x indexed field size).
- **Config:** CLI args, not env vars. `--data-dir`, `--api-key`, `--enable-cors`
- **License:** GPL-3.0 (server). Clustering: built-in Raft HA.

## 2026-02-20 — Planka v2.0.1 (Operations comparison research)
- **Image:** `ghcr.io/plankanban/planka:2.0.1`. **Port:** 1337. **DB:** PostgreSQL.
- **Key env vars:** `BASE_URL`, `DATABASE_URL`, `SECRET_KEY` (32+ chars), `DEFAULT_ADMIN_*`

## 2026-02-20 — Wekan v8.34 (Operations comparison research)
- **Image:** `wekanteam/wekan:v8.34`. **Port:** 8080. **DB:** MongoDB (`--oplogSize 128`).
- **CAUTION:** MongoDB database corruption if disk fills up (per Wekan's own README).
- **RAM:** Min 1 GB free, 4 GB total for production.

## 2026-02-20 — Frigate v0.16.4 (Operations comparison research)
- **Image:** `ghcr.io/blakeblackshear/frigate:0.16.4`
- **Ports:** 5000 (web), 8554 (RTSP), 8555 (WebRTC). Needs `shm_size: 256mb` + `privileged: true`.
- Google Coral TPU (~$30 USB) recommended for AI detection performance.

## 2026-02-20 — MinIO GitHub archived, Docker images discontinued
- **MinIO** GitHub repo archived February 2026. Official Docker images discontinued October 2025.
- Use `bitnami/minio:2025.4.22` as community-maintained alternative for Docker deployments.
- MinIO still works but is no longer officially maintained. Consider Garage or SeaweedFS as alternatives for new deployments.

## 2026-02-20 — Authentik v2025.10+ no longer requires Redis
- **Authentik** removed Redis dependency in v2025.10. PostgreSQL now handles caching, task queues, and WebSocket connections.
- Docker Compose only needs: server, worker, postgresql (3 containers instead of 4).
- Image: `ghcr.io/goauthentik/server:2025.12.4` (latest stable as of Feb 2026).
- Initial setup URL: `http://your-server:9000/if/flow/initial-setup/` (trailing slash required).

## 2026-02-20 — atmoz/sftp has no versioned releases
- The `atmoz/sftp` Docker image has no versioned tags — only branch-based tags like `:debian` and `:alpine`.
- Use `atmoz/sftp:alpine` for a lighter image. No way to pin to a specific version.

## 2026-02-20 — Keycloak latest stable is 26.1.4
- Image: `quay.io/keycloak/keycloak:26.1.4` (on Quay.io, not Docker Hub).
- Use `start-dev` command for development, `start` for production (requires TLS).
- Needs PostgreSQL. Java-based, uses ~512MB-1GB RAM.

## 2026-02-20 — Authelia latest stable is v4.39.15
- Image: `docker.io/authelia/authelia:4.39.15`
- Lightweight: ~30-50MB RAM with Redis.
- OIDC provider support since v4.37.
- Primary use: forward auth proxy integration (Traefik, Nginx Proxy Manager).

## 2026-02-20 — LLDAP latest stable is v0.6.1
- Image: `lldap/lldap:v0.6.1` (lightweight LDAP server).
- Web UI on port 17170, LDAP on port 3890.
- Much lighter than OpenLDAP — ideal for small self-hosted setups needing a shared user directory.

## 2026-02-20 — Calibre-Web 0.6.24 in article, latest 0.6.26 (BI freshness audit)
- **Image:** `lscr.io/linuxserver/calibre-web:0.6.24` → latest `0.6.26` (released Feb 6, 2026)
- 2 minor versions behind. No breaking changes expected (patch releases).
- Already flagged in Operations inbox as LOW priority.

## 2026-02-20 — Paperless-ngx 2.20.6 in article, latest 2.20.7 (BI freshness audit)
- **Image:** `ghcr.io/paperless-ngx/paperless-ngx:2.20.6` → latest `2.20.7` (released Feb 16, 2026)
- 1 patch version behind. No breaking changes expected.
- Already flagged in Operations inbox as LOW priority.

## 2026-02-20 — Gitea v1.25.4 (Operations stale-fix)
- **Image:** `gitea/gitea:1.25.4` (was 1.23.7)
- **No breaking changes** from 1.23.7 → 1.25.4. Maintenance release with 9 security fixes.
- Docker Compose config unchanged.

## 2026-02-20 — Node-RED v4.1.5 (Operations stale-fix)
- **Image:** `nodered/node-red:4.1.5` (was 4.0.9)
- **No breaking changes** from 4.0.9 → 4.1.5. Bug fixes and stability improvements.
- Docker Compose config unchanged.

## 2026-02-20 — n8n v2.9.1 (Operations stale-fix)
- **Image:** `n8nio/n8n:2.9.1` (was 2.7.5)
- **No breaking changes** from 2.7.5 → 2.9.1. New features: focused nodes, code-base workflow builder.
- v2.8.3: Health endpoint made configurable (resolves port conflicts).
- Docker Compose config unchanged.

## 2026-02-20 — Radicale v3.6.0 (Operations stale-fix)
- **Image:** `tomsquest/docker-radicale:3.6.0.0` (was 3.4.1.0)
- **Key change:** passlib dependency replaced with libpass (passlib stale since 2020).
- Bcrypt auth still works — no config changes needed.
- New CLI option `--verify-item` for item file analysis (not relevant for Docker).
- Docker Compose config unchanged.

## 2026-02-16 — Lychee v7.3.3 (photo-media-writer)
- **Image:** `ghcr.io/lycheeorg/lychee:v7.3.3`
- **Port:** 8000 (CHANGED from 80 in v7 — major migration gotcha)
- **Backend:** FrankenPHP (replaced nginx+PHP-FPM in v7)
- **Requires:** MariaDB, APP_KEY environment variable (generate with `openssl rand -base64 32`)
- **Optional:** Redis cache + background worker containers for better performance
- **OAuth/SSO:** Built-in support for GitHub, Google, Keycloak, Authentik, Nextcloud
- **WebAuthn/passkey:** Supported natively in v7

## 2026-02-16 — Piwigo 16.2.0 (photo-media-writer)
- **Image:** `lscr.io/linuxserver/piwigo:16.2.0` (LinuxServer.io)
- **Port:** 80 (internal)
- **Requires:** MariaDB
- **UNUSUAL:** Database connection configured via web UI setup wizard, NOT via environment variables on the container. Credentials stored in `/config/www/piwigo/local/config/database.inc.php`
- **DB host:** Must be the Docker service name (e.g., `piwigo_db`), not `localhost`
- **Mobile apps:** Official iOS and Android with auto-upload from camera roll

## 2026-02-16 — Photoview 2.4.0 (photo-media-writer)
- **Image:** `photoview/photoview:2.4.0`
- **Port:** 80 (internal)
- **CRITICAL:** `PHOTOVIEW_LISTEN_IP=0.0.0.0` is REQUIRED — without it, Photoview listens on 127.0.0.1 and won't accept external connections
- **DB:** MariaDB recommended (also supports PostgreSQL, SQLite)
- **DB URL format:** `user:password@tcp(hostname:port)/database` (Go MySQL DSN format)
- **Face detection:** Enabled via `PHOTOVIEW_FACE_RECOGNITION_ENABLED=1`, uses ~500 MB extra RAM

## 2026-02-16 — Emby 4.9.3.0 (photo-media-writer)
- **Image:** `emby/embyserver:4.9.3.0`
- **Port:** 8096 (HTTP), 8920 (HTTPS)
- **CAUTION:** Docker Hub shows 4.10.x tags but these are BETA. Latest stable is 4.9.3.0.
- **Env vars:** UID, GID, GIDLIST (NOT PUID/PGID like LSIO images)
- **Embedded SQLite** — no external database needed
- **HW transcoding:** Requires Emby Premiere ($5/mo or $119 lifetime)

## 2026-02-16 — Audiobookshelf 2.32.1 (photo-media-writer)
- **Image:** `ghcr.io/advplyr/audiobookshelf:2.32.1`
- **Port:** 80 (internal), commonly mapped to 13378 externally
- **CRITICAL:** Config directory (`/config`) MUST be on local filesystem since v2.3.x — NFS/SMB causes SQLITE_BUSY errors
- **WebSocket REQUIRED** for reverse proxy — real-time sync fails silently without it
- **Subfolder path:** Hardcoded to `/audiobookshelf` — not configurable
- **Embedded SQLite** — no external database needed

## 2026-02-16 — Stash v0.30.1 (photo-media-writer)
- **Image:** `stashapp/stash:v0.30.1`
- **Port:** 9999
- **Embedded SQLite** — no external database needed
- **No hardware transcoding** in official Docker image (community images feederbox826/stash and nerethos/stash add HW accel)
- **Config path:** `/root/.stash` inside container (runs as root, no PUID/PGID support)
- **CRITICAL:** `/blobs` volume mount required since v0.20+ — omitting causes data loss
- **Multiple volume mounts:** config, data, generated, metadata, cache, blobs (6 data volumes + optional /etc/localtime)
- **Trailing slashes matter** on env var paths: `/data/`, `/generated/`, `/metadata/`, `/cache/`

## 2026-02-16 — Internal link corrections (photo-media-writer)
- Linter corrected link paths: `/foundations/reverse-proxy` → `/foundations/reverse-proxy-explained`
- Linter corrected link paths: `/foundations/backup-strategy` → `/foundations/backup-3-2-1-rule`
- Use these corrected paths in all future articles

## 2026-02-16 — Outline v1.5.0 (homeauto-notes-writer)
- **Image:** `outlinewiki/outline:0.82.0` — Docker tags use a different versioning scheme from GitHub releases (v1.5.0 on GitHub ≠ 0.82.0 on Docker Hub).
- **Port:** 3000
- **Requires:** PostgreSQL + Redis + external auth provider (OIDC, Google, Slack, Azure, Discord). No built-in username/password auth.
- **Secrets:** SECRET_KEY and UTILS_SECRET must be 64 hex chars (32 bytes). Generate with `openssl rand -hex 32`.
- **Local file storage:** Set `FILE_STORAGE=local` and `FILE_STORAGE_LOCAL_ROOT_DIR=/var/lib/outline/data`.
- **Gotcha:** `URL` env var must exactly match the URL users access, including protocol. Mismatch causes OIDC redirect failures.

## 2026-02-16 — Wiki.js v2.5 (homeauto-notes-writer)
- **Image:** `ghcr.io/requarks/wiki:2.5` — latest stable v2 branch. v3.0 is in development (not yet released).
- **Port:** 3000
- **Requires:** PostgreSQL. No Redis needed.
- **Built-in auth:** Yes (email/password). Also supports LDAP, OIDC, OAuth2, SAML.
- **Editor types are per-page and cannot be changed after creation.** Choose Markdown, WYSIWYG, or HTML when creating each page.
- **Git sync:** Bidirectional sync to Git repository. Configured under Administration → Storage.

## 2026-02-16 — TriliumNext Notes v0.95.0 (homeauto-notes-writer)
- **Image:** `triliumnext/notes:v0.95.0` — community fork of original Trilium (now unmaintained).
- **Port:** 8080
- **No external database needed.** Uses embedded SQLite. Single container deployment.
- **Password serves dual purpose:** authentication AND database encryption key.
- **WebSocket passthrough required** for sync with desktop client. Configure reverse proxy accordingly.
- **Auto backups:** Trilium creates daily backups in `trilium-data/backup/`.

## 2026-02-16 — Joplin Server 3.2.1 (homeauto-notes-writer)
- **Image:** `joplin/server:3.2.1`
- **Port:** 22300
- **Default admin:** `admin@localhost` / `admin` — only works on first login. Change immediately.
- **Requires:** PostgreSQL. No Redis.
- **E2EE configured in clients, not server.** Server stores encrypted blobs when E2EE is enabled.

## 2026-02-16 — SiYuan v3.5.7 (homeauto-notes-writer)
- **Image:** `b3log/siyuan:v3.5.7`
- **Port:** 6806
- **Auth:** Simple access code via `--accessAuthCode` flag. Not username/password.
- **Data format:** Custom `.sy` JSON files, not Markdown. Not portable to other tools without conversion.
- **`user: "1000:1000"` needed** in Docker to avoid root-owned files in volumes.
- **Sync options:** S3, WebDAV, or SiYuan Cloud (paid). No Git sync.

## 2026-02-16 — CouchDB 3.4 for Obsidian LiveSync (homeauto-notes-writer)
- **Image:** `couchdb:3.4`
- **Port:** 5984
- **CORS config critical.** Must include `app://obsidian.md` (desktop) and `capacitor://localhost` (mobile) in origins.
- **`local.ini` must set:** `single_node=true`, `max_document_size=50000000`, `require_valid_user=true`.
- **Database created automatically** by LiveSync plugin. No manual creation needed.
- **Compact periodically:** CouchDB revision history causes database bloat. Run `_compact` endpoint.

## 2026-02-16 — AppFlowy Cloud 0.9.x (homeauto-notes-writer)
- **Complex multi-service stack:** API server + GoTrue (auth) + PostgreSQL + Redis + MinIO (S3).
- **Deployment:** Clone the official repo, configure `.env`, run docker compose.
- **RAM:** 2-4 GB for the full stack. Not suitable for low-resource deployments.

## 2026-02-16 — AFFiNE v0.26.2 (homeauto-notes-writer)
- **Image:** `ghcr.io/toeverything/affine-graphql:stable`
- **Port:** 3010 (API), 5555 (debug)
- **Requires:** PostgreSQL + Redis.
- **Self-deploy command:** `node ./scripts/self-host-predeploy && node ./dist/index.js` — runs migrations before starting.
- **Pre-1.0 software.** Expect breaking changes between versions. Not recommended for production team use yet.

## 2026-02-16 — Passbolt CE Docker image versioning (password-adblock-writer)
- **Image:** `passbolt/passbolt:5.9.0-1-ce` — latest CE tag as of 2026-01-30
- **Non-root variant:** `passbolt/passbolt:5.9.0-1-ce-non-root`
- **Docker image versioning diverges from API versioning.** Docker repo had release 4.2.0 (Nov 2024) but now carries API v5.9.0. Tag format is `{api-version}-{docker-revision}-ce`.
- **MariaDB 10.3 and 10.5 are deprecated** as of Passbolt v5.9.0. Use MariaDB 11.x.
- **SMTP is mandatory.** Cannot register users without email. No filesystem notifier fallback.
- **GPG volume (`/etc/passbolt/gpg`) is critical.** Losing it means losing the ability to decrypt passwords. Back up always.
- **JWT volume (`/etc/passbolt/jwt`) is needed** for authentication tokens.
- **Create first user via CLI:** `docker compose exec passbolt su -m -c "/usr/share/php/passbolt/bin/cake passbolt register_user -u email -f First -l Last -r admin" -s /bin/sh www-data`
- **APP_FULL_BASE_URL must include protocol** (`https://...`), otherwise CSRF errors.

## 2026-02-16 — Blocky v0.28.2 (password-adblock-writer)
- **Image:** `spx01/blocky:v0.28.2` (Docker Hub) or `ghcr.io/0xerr0r/blocky:v0.28.2` (GHCR)
- **Config path:** `/app/config.yml` inside container. Override with `BLOCKY_CONFIG_FILE` env var.
- **Ports:** 53 (DNS, TCP+UDP), 4000 (HTTP API/Prometheus). Optional: 853 (DoT), 443 (DoH).
- **Stateless.** No persistent volumes needed (cache is in-memory). Only mount config file.
- **Built from `scratch` image** — no shell, no OS. Runs as UID 100.
- **Health check built-in:** `/app/blocky healthcheck`
- **DNSSEC validation added in v0.28.0** (`dnssec.validate: true`).
- **Multi-instance sync via Redis** (built-in, no add-on needed).

## 2026-02-16 — Technitium DNS v14.3.0 (password-adblock-writer)
- **Image:** `technitium/dns-server:14.3.0` (Docker Hub, updated 2025-12-20)
- **No GitHub Releases.** Technitium doesn't use GitHub Releases — versions are tracked on Docker Hub and the blog.
- **Ports:** 5380/tcp (web UI), 53/tcp+udp (DNS). Optional: 853 (DoT/DoQ), 443 (DoH), 67/udp (DHCP).
- **Volume:** `/etc/dns` — single directory for all config, zones, logs, stats.
- **Base image:** `mcr.microsoft.com/dotnet/aspnet:9.0` — .NET 9.
- **sysctl required:** `net.ipv4.ip_local_port_range=1024 65535` in Docker Compose.
- **Env vars only apply on first startup.** After that, all config is managed via web UI.
- **v14+ features:** Clustering, TOTP 2FA, .NET 9 runtime.
- **Self-contained** — no external database needed.

## 2026-02-16 — Authelia v4.39.15 (password-adblock-writer)
- **Image:** `authelia/authelia:4.39.15` (Docker Hub or `ghcr.io/authelia/authelia:4.39.15`)
- **Port:** 9091 (TCP)
- **Config path:** `/config/configuration.yml` (set via `X_AUTHELIA_CONFIG` env var)
- **Requires 3 secrets (minimum):** jwt_secret, session.secret, storage.encryption_key. Set via `_FILE` env vars pointing to files.
- **Redis required for production** — session storage. Without it, sessions are in-memory only.
- **PostgreSQL recommended for production.** SQLite3 works for testing/small deployments.
- **SMTP required** for password reset and 2FA device registration.
- **Users database:** File-based (`/config/users_database.yml`) or LDAP backend.
- **Password hash generation:** `docker run --rm authelia/authelia:4.39.15 authelia crypto hash generate argon2 --password 'YourPassword'`
- **Session cookie domain must be base domain** (`.example.com`) for cross-subdomain SSO.
- **Authelia portal URL must be `bypass` policy** — cannot require auth on itself.

## 2026-02-16 — KeeWeb v1.18.7 (password-adblock-writer)
- **Image:** `antelle/keeweb:1.18.7`
- **Serves HTTPS internally** on port 443 with self-signed cert.
- **Static web app** — all encryption/decryption happens client-side in browser. Server is just nginx.
- **Development has slowed** significantly since 2022. Stable but in maintenance mode.
- **Supports WebDAV** for vault storage/sync (works with Nextcloud).

## 2026-02-16 — Padloc v4.3.0 (password-adblock-writer)
- **Server image:** `padloc/server:4.3.0`
- **PWA image:** `padloc/pwa:4.3.0`
- **Requires TWO containers** — API server (port 3000) and PWA frontend (port 8080).
- **Requires TWO URLs** — one for the API, one for the web app. Can use subpaths on single domain.
- **SMTP required** for account creation/verification.
- **Data stored in `/data` directory** inside server container.

## 2026-02-16 — Plausible CE v3.2.0 (Operations)
- **Image:** `ghcr.io/plausible/community-edition:v3.2.0` (NOT on Docker Hub — uses GitHub Container Registry)
- **Old Docker Hub image** (`plausible/analytics`) is outdated at v2.0.0 (July 2023). Do NOT use it.
- **Requires ClickHouse** — `clickhouse/clickhouse-server:24.12-alpine`. ClickHouse needs SSE 4.2 CPU instructions.
- **Requires PostgreSQL** — `postgres:16-alpine`
- **Volumes:** `db-data`, `event-data`, `event-logs`, `plausible-data`
- **Environment:** `BASE_URL` (required), `SECRET_KEY_BASE` (required, min 64 bytes)
- **Has built-in TLS** via Let's Encrypt when ports 80+443 are exposed. Can also run behind reverse proxy on port 8000.
- **No releases on GitHub releases page** — version tags on the repo and GHCR.

## 2026-02-16 — Umami v3.0.3 (Operations)
- **Image:** `ghcr.io/umami-software/umami:v3.0.3` (GHCR, not Docker Hub for self-hosted)
- **Port:** 3000
- **Default creds:** `admin` / `umami`
- **Requires PostgreSQL only** (MySQL support dropped in v2+)
- **Environment:** `DATABASE_URL` (PostgreSQL connection string), `APP_SECRET` (min 32 chars)
- **Ad blocker evasion:** Set `TRACKER_SCRIPT_NAME` and `COLLECT_API_ENDPOINT` to rename tracking paths

## 2026-02-16 — Grafana 12.3.3 (Operations)
- **Image:** `grafana/grafana-oss:12.3.3` (use OSS variant, not Enterprise)
- **Port:** 3000
- **Container runs as UID 472** — if using bind mounts, `chown -R 472:472`
- **All settings via env vars:** Pattern `GF_<SECTION>_<KEY>` (e.g., `GF_SECURITY_ADMIN_PASSWORD`)

## 2026-02-16 — Prometheus v3.5.1 (Operations)
- **Image:** `prom/prometheus:v3.5.1`
- **Port:** 9090
- **No built-in authentication** — MUST be behind a reverse proxy or firewall
- **Hot reload:** `--web.enable-lifecycle` flag + `curl -X POST http://localhost:9090/-/reload`
- **Container runs as UID 65534** (nobody) — relevant for bind mount permissions

## 2026-02-16 — Plex version update 1.41.4 → 1.43.0 (Operations)
- Updated per BI stale content alert. LSIO image `lscr.io/linuxserver/plex:1.43.0`.
- No known breaking changes between 1.41.4 and 1.43.0.

## 2026-02-16 — qBittorrent 5.1.4 (Operations)
- **Image:** `lscr.io/linuxserver/qbittorrent:5.1.4`
- **Port:** 8080 (Web UI), 6881 TCP+UDP (torrent traffic)
- **Default password is temporary** — check logs with `docker logs qbittorrent 2>&1 | grep "temporary password"`
- **VPN integration:** Use Gluetun (`qmcgaw/gluetun`) with `network_mode: "service:gluetun"`

## 2026-02-16 — WordPress 6.9.1 (Operations)
- **Image:** `wordpress:6.9.1-php8.4-apache`
- **Port:** 80
- **Reverse proxy gotcha:** Must set `FORCE_SSL_ADMIN` and check `HTTP_X_FORWARDED_PROTO` header for HTTPS detection. Dollar signs in Docker Compose YAML must be escaped as `$$`.
- **MariaDB 11.7** is the recommended database
- **WP-CLI included** in the official Docker image

## 2026-02-16 — Restic 0.18.1 (Operations)
- Not typically run as a Docker service — it's a CLI tool for backing up data
- **Docker image:** `restic/restic:0.18.1` (but direct install is more common)
- **Supports many backends:** local, SFTP, S3, B2, Azure, GCS
- **All data encrypted by default** with AES-256. No password recovery.

## 2026-02-16 — BorgBackup 1.4.3 (Operations)
- CLI tool, not Docker-based. Install via `apt install borgbackup` or pip.
- **SSH-only for remote backups** — no native S3/cloud support (use rclone wrapper)
- **Encryption modes:** `repokey` (recommended), `keyfile`, `none`
- **CRITICAL:** Export key with `borg key export` — without key AND passphrase, backups are permanently lost

## 2026-02-16 — Nextcloud 32.0.6 Docker setup (Operations)
- **Image:** `nextcloud:32.0.6-apache` (official Docker Hub image, PHP 8.3, Debian Trixie)
- **Port:** 80 (Apache variant). FPM variant uses port 9000 and needs a separate nginx container.
- **Volumes:** Single volume at `/var/www/html`. Config/data/custom_apps/themes are preserved during upgrades. Everything else under `/var/www/html` is overwritten on container update.
- **Cron container MUST share the same volume** as the main app container. If volumes don't match, cron jobs fail silently.
- **Run `occ` with:** `docker compose exec -u www-data app php occ <command>`
- **PHP env vars:** `PHP_MEMORY_LIMIT` (default 512M), `PHP_UPLOAD_LIMIT` (default 512M), `APACHE_BODY_LIMIT` (default 1GB). Upload limits must be coordinated across Nextcloud, Apache, AND any reverse proxy.
- **Gotcha:** `PHP_MEMORY_LIMIT` env var has known issues where it may appear ignored (GitHub issue #2251). Verify with `php -i | grep memory_limit` inside the container.
- **Gotcha:** When behind a reverse proxy, MUST set `overwriteprotocol` to `https` and configure `trusted_proxies` or you get infinite redirect loops.
- **PostgreSQL is recommended** over MariaDB for new installations.

## 2026-02-16 — PhotoPrism build 251130-b3068414c (Operations)
- **Image:** `photoprism/photoprism:latest` — PhotoPrism does NOT publish semver tags. The `:latest` tag is the stable release. No pinnable version tags exist on Docker Hub. Can pin by image digest if needed.
- **Port:** 2342
- **Database driver is `mysql`** even when using MariaDB (not `mariadb`).
- **MariaDB passwords are set on first init ONLY.** Changing `MARIADB_PASSWORD` after first run has NO effect. Must delete database volume to change.
- **Dollar signs in passwords:** Must escape as `$$` in docker-compose YAML.
- **Minimum 4 GB swap required.** Without it, OOM killer terminates indexing. This is the #1 cause of "PhotoPrism killed during indexing."
- **security_opt: seccomp:unconfined, apparmor:unconfined** are required. PhotoPrism uses syscalls blocked by default profiles.
- **`restart: unless-stopped` is NOT in the official compose file** for the PhotoPrism service. Must add manually.
- **UID/GID ranges are restricted:** 0, 33, 50-99, 500-600, 900-1250, 2000-2100.
- **Storage volume must NOT be inside originals** unless directory name starts with a dot.
- **Import folder must NOT be inside originals** — creates indexing loop.
- **TLS enabled by default** since recent versions. Set `PHOTOPRISM_DISABLE_TLS: "true"` when behind a reverse proxy.
- **PHOTOPRISM_INIT: "https tensorflow"** downloads TLS certs and TF models on first start. First startup is slow.

## 2026-02-16 — Nginx Proxy Manager v2.13.7 (Operations)
- **Image:** `jc21/nginx-proxy-manager:2.13.7`
- **Ports:** 80 (HTTP), 443 (HTTPS), 81 (Admin UI)
- **Default creds:** `admin@example.com` / `changeme` — forced to change on first login.
- **Database:** SQLite by default (works for most setups). MySQL/MariaDB/PostgreSQL supported for large-scale.
- **Volumes:** `/data` (config + proxy hosts), `/etc/letsencrypt` (SSL certs). Both critical for backup.
- **Gotcha:** Port 81 (admin UI) should be firewalled in production — not publicly accessible.

## 2026-02-16 — Plex via LinuxServer.io image (Operations)
- **Image:** `lscr.io/linuxserver/plex:1.41.4`
- **Host networking recommended** — simpler and fewer issues than bridge mode.
- **PLEX_CLAIM token expires in 4 minutes.** Generate at plex.tv/claim and use immediately.
- **Gotcha:** Do NOT store `/config` on SMB/NFS — SQLite doesn't support file locking on these. Will corrupt database.
- **VERSION env var:** Set to `docker` for the LSIO image. Options: `docker`, `latest`, `public`, or specific version.
- **Transcode directory** no longer exposed as volume in LSIO image — configured via Plex GUI, defaults under `/config`.

## 2026-02-16 — BookStack v25.12.3 via LinuxServer.io (Operations)
- **Image:** `lscr.io/linuxserver/bookstack:v25.12.3`
- **Port:** 6875 → 80 inside container
- **Default creds:** `admin@admin.com` / `password`
- **APP_KEY must be generated** before first run: `docker run -it --rm --entrypoint /bin/bash lscr.io/linuxserver/bookstack:v25.12.3 appkey`
- **Gotcha:** `APP_URL` must exactly match the URL users access. Mismatch causes "page expired" CSRF errors.
- **Gotcha:** Non-alphanumeric characters in DB_PASSWORD can cause connection failures. Use alphanumeric passwords.

## 2026-02-16 — Dockge v1.5.0 (Operations)
- **Image:** `louislam/dockge:1.5.0`
- **Port:** 5001
- **CRITICAL: Stacks directory mount must be identical on both sides.** `/opt/stacks:/opt/stacks` — host path, container path, and `DOCKGE_STACKS_DIR` must all be the same absolute path.
- **Breaking change in v1.5.0:** Console feature disabled by default for security. Enable with `DOCKGE_ENABLE_CONSOLE=true`.
- **Known bug:** Uppercase directory names cause stacks to show as inactive. Use lowercase only.
- **Known bug:** `.env` files may not be recognized. Define env vars directly in compose YAML as workaround.
- **Docker socket mount = root-level access.** Run on trusted networks only.

## 2026-02-16 — Syncthing v2.0.14 (Operations)
- **Official image:** `syncthing/syncthing:2.0.14` — single mount at `/var/syncthing`
- **LSIO image:** `lscr.io/linuxserver/syncthing:v2.0.14-ls208` — separates `/config` from data mounts
- **Ports:** 8384 (Web UI), 22000/tcp (sync), 22000/udp (QUIC), 21027/udp (discovery)
- **Port 22000 needs BOTH TCP and UDP.** QUIC on UDP is used for faster sync in v2.x.
- **Gotcha:** Docker bridge networking breaks LAN discovery. Use `network_mode: host` for best LAN sync performance.
- **Gotcha:** Web GUI listens on 0.0.0.0:8384 by default — set a password immediately.
- **Gotcha:** Do NOT sync the Syncthing config directory between devices — causes duplicate Device IDs.
- **`.stfolder` marker file:** Do not delete. Syncthing uses it to verify folder accessibility.

## 2026-02-16 — App version freshness baseline (BI & Finance, iteration 3)
All 14 app guides checked against latest Docker Hub/GitHub releases. Versions as of 2026-02-16:
- Immich: v2.5.6 (current)
- Jellyfin: v10.11.6 (current)
- Nextcloud: 32.0.6-apache (current — this is ahead of the 31.x line; 32.x exists on Docker Hub)
- Pi-hole: 2025.11.1 (current — note: pihole/pihole Docker image uses YYYY.MM.N versioning, NOT the pi-hole core v6.x versioning)
- Vaultwarden: 1.35.3 (current)
- Portainer: 2.33.7 (current)
- Uptime Kuma: 2.1.1 (current)
- Syncthing: v2.0.14 (current)
- Home Assistant: 2026.2.2 (current)
- Dockge: 1.5.0 (current — last release March 2025, 11 months stale, monitor for abandonment)
- AdGuard Home: v0.107.71 (current)
- BookStack: v25.12.3 (current)
- **Plex: 1.41.4 → 1.43.0 STALE** (linuxserver/plex Docker Hub, updated Feb 11)
- Nginx Proxy Manager: v2.13.7 (current)

## 2026-02-16 — awesome-selfhosted ecosystem changes (BI & Finance, iteration 3)
- **MinIO (S3-compatible object storage) — PROJECT ARCHIVED** on GitHub. Removed from awesome-selfhosted Feb 14. Alternatives: Garage, SeaweedFS.
- **Mattermost — License changed to non-free.** Updated on awesome-selfhosted Feb 12.
- **RapidForge — New app added** to awesome-selfhosted Feb 14.
- **Removed as unmaintained (Feb 10):** Convos (chat), Fenrus (dashboard), Roadiz (CMS), Input (forms). All unmaintained since Feb 2025.

## 2026-02-16 — Extended app version baseline for 20 new articles (BI & Finance, iteration 5)
Freshness audit of all new app guides added by parallel writers. Versions as of 2026-02-16:
- Watchtower: v1.7.1 (current — but no release since Nov 2023, project in maintenance mode)
- OpenHAB: 5.1.2-debian (current stable)
- Diun: 4.31.0 (current)
- Caddy: 2.10.2-alpine (current)
- Traefik: v3.6.8 (current, released Feb 11)
- **Yacht: v0.0.8 IN ARTICLE BUT DOES NOT EXIST ON DOCKER HUB.** Latest is v0.0.7-alpha (Jan 2023). Project abandoned.
- Domoticz: 2025.2 (current)
- **Navidrome: 0.54.5 IN ARTICLE → STALE. Latest is v0.60.3 (released Feb 10, 2026).** Major version jump.
- Lazydocker: v0.24.4 (current)
- WireGuard (LSIO): 1.0.20250521 (current, image rebuilt Feb 12)
- LibrePhotos: uses ${tag} env var (current approach, latest stable is 2025w44)
- Gladys Assistant: v4 major tag (current, latest specific is v4.67.0)
- Tailscale: v1.94.2 in article (GitHub shows v1.94.1 — minor discrepancy, article may be correct or slightly ahead)
- Cosmos Cloud: v0.20.2 (current)
- **Cloudflare Tunnel: 2025.2.1 IN ARTICLE → STALE. Latest is 2026.2.0 (released Feb 6, 2026).**
- WG-Easy: tag `:15` (current major version, latest specific is v15.2.2)
- Headscale: v0.28.0 (current)
- ioBroker: v11.1.0 (current)
- FileBrowser: v2.59.0-s6 (current, released Feb 15)
- Seafile: 13.0.18 (current)

## 2026-02-16 — Project health warnings (BI & Finance, iteration 5)
- **Yacht** — Last Docker Hub push Jan 2023. Only alpha releases ever published. No GitHub releases. Project appears ABANDONED. Do not recommend for new users; point to Portainer/Dockge as alternatives.
- **Watchtower** — Last release v1.7.1 on Nov 2023. Project appears to be in maintenance mode only. Still functional and widely used but not actively developed.
- **LibrePhotos** — Last stable release 2025w44 (Nov 2025). Dev builds continue on Docker Hub (latest: Feb 14, 2026). Not abandoned but slow release cadence.
- **Dockge** — Last release 1.5.0 (Mar 2025, ~11 months ago). Creator (louislam, also Uptime Kuma author) may be focusing on other projects. Monitor.
- **Seafile GitHub vs Docker versioning:** GitHub source repo (haiwen/seafile) is stuck at v9.0.5 (Feb 2024) while Docker image (seafileltd/seafile-mc) is at 13.0.18. Always use Docker Hub as version source for Seafile, not GitHub.

## 2026-02-16 — Nginx 1.28.2 Docker setup (proxy-docker-writer)
- **Image:** `nginx:1.28.2` (official, Debian Trixie Slim base)
- **Port:** 80 only exposed in Dockerfile. Port 443 must be manually configured and mapped for SSL.
- **Key paths:** `/etc/nginx/nginx.conf` (main config), `/etc/nginx/conf.d/` (additional configs), `/usr/share/nginx/html` (web root), `/etc/nginx/templates/` (envsubst templates)
- **Entrypoint scripts run in order:** `10-listen-on-ipv6-by-default.sh`, `15-local-resolvers.envsh`, `20-envsubst-on-templates.sh`, `30-tune-worker-processes.sh`
- **Template substitution:** Files in `/etc/nginx/templates/*.template` get `envsubst` processing, output to `/etc/nginx/conf.d/`. Configurable via `NGINX_ENVSUBST_TEMPLATE_DIR`, `NGINX_ENVSUBST_TEMPLATE_SUFFIX`, `NGINX_ENVSUBST_OUTPUT_DIR`.
- **Gotcha:** Mounting `/var/log/nginx/` as a volume breaks the default stdout/stderr log symlinks. Logs go to files in the volume instead of Docker's log driver.
- **Gotcha:** Read-only filesystem requires writable mounts for `/var/cache/nginx` and `/var/run`.
- **NJS module v0.9.5 and ACME module v0.3.1** are included in the default image.
- **Graceful reload:** `docker exec nginx nginx -s reload` or send SIGHUP.
- **Alpine variant** (`nginx:1.28.2-alpine`) is ~10 MB vs ~60 MB for Debian. Uses musl libc.

## 2026-02-16 — HAProxy 3.3.3 Docker setup (proxy-docker-writer)
- **Image:** `haproxy:3.3.3` (latest stable). LTS: `haproxy:3.2.12` (maintained until Q2 2029).
- **No ports exposed in Dockerfile.** All port bindings are user-defined in haproxy.cfg.
- **Config path:** `/usr/local/etc/haproxy/haproxy.cfg` (must be provided — no default config ships).
- **No environment variables.** HAProxy is configured entirely via haproxy.cfg, unlike most Docker apps.
- **Entrypoint adds `-W -db`:** Master-worker mode (graceful reloads via SIGUSR2) and foreground mode.
- **Runs as user `haproxy` (UID 99, GID 99).** To bind ports < 1024: use `sysctls: [net.ipv4.ip_unprivileged_port_start=0]` or `cap_add: [NET_BIND_SERVICE]`.
- **Logging gotcha:** HAProxy logs via syslog by default, which doesn't exist in containers. Use `log stdout format raw local0` in the `global` section for Docker logging. Requires HAProxy 1.9+.
- **Config validation:** `haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg` — always validate before reload.
- **Graceful reload:** `docker kill -s HUP haproxy` sends SIGHUP to the master-worker process.
- **Stats dashboard:** Add a `frontend stats` section binding to port 8404 with `stats enable; stats uri /stats`.
- **Client IP behind Docker NAT:** Use `option forwardfor` in defaults/frontend, or `network_mode: host`.

## 2026-02-16 — Firezone NO LONGER SELF-HOSTABLE in production (vpn-filesync-writer)
- **Firezone 1.x is SaaS-first.** The control plane (portal, admin UI, policy engine) is a managed service. Only gateways can be self-hosted.
- **Legacy 0.7.x is EOL** since January 31, 2024. No security updates.
- **Official FAQ states:** "Firezone provides no support or documentation for self-hosted deployments... only recommend it for hobby or educational purposes."
- **Do NOT write a standard app guide for Firezone.** The docker-compose.yml in the repo is a development environment, not production-ready.
- **Community self-hosting project exists** (DoctorFTB/firezone-1.x-self-hosted) with 8 GitHub stars — unofficial, unsupported.
- **Recommendation:** Skip Firezone as an app guide. Mention it only in roundup/comparison articles as "managed service with self-hosted gateways."
- **Alternative apps for the WireGuard GUI space:** NetBird, wg-easy, Headscale.

## 2026-02-19 — NetBird v0.65.1 → v0.65.3 SECURITY UPDATE (BI & Finance)
- **Previous version in article:** v0.65.1
- **New version:** v0.65.3 (released Feb 19, 2026)
- **Security fix:** Race condition in role update validation — concurrent requests during admin demotion could bypass role checks, potentially allowing privilege escalation with two admin accounts + precise timing.
- **Other changes:** macOS DNS domain batching fix, iOS route settlement fix, QUIC initial packet size reduced to 1280 bytes (IPv6 min MTU), lock acquisition time logging.
- **Skipped version:** v0.65.2 (intermediate patch)
- **Affected tags in article:** NETBIRD_SIGNAL_TAG, NETBIRD_MANAGEMENT_TAG, NETBIRD_RELAY_TAG (all v0.65.1 → v0.65.3)
- **Dashboard tag (v2.9.0) is NOT affected** by this release.
- **Stale content alert sent to Operations** — HIGH priority due to security fix.

## 2026-02-16 — NetBird v0.65.1 self-hosted setup (vpn-filesync-writer)
- **Latest version:** v0.65.1 (Feb 14, 2026) — **SUPERSEDED by v0.65.3, see above**
- **5 Docker services required:** Dashboard, Signal, Relay, Management, Coturn
- **CRITICAL: Requires an external OIDC identity provider.** No built-in auth. Options: Zitadel, Keycloak, Authentik (self-hosted) or Auth0, Google, Okta (managed).
- **Setup uses configure.sh script** that generates docker-compose.yml from a template. You cannot just copy-paste a compose file.
- **Coturn runs in `network_mode: host`** — bypasses Docker networking entirely.
- **Default ports:** 80/443 (dashboard), 33073 (management API), 10000 (signal), 33080 (relay), 3478/udp (STUN/TURN)
- **Single Account Mode is default** since v0.10.1 — all users join one network.
- **Hetzner gotcha:** Stateless firewalls require opening full local UDP port range for Coturn.
- **Oracle Cloud gotcha:** Blocks UDP 3478 by default. Requires manual iptables rule.
- **Breaking migration at v0.26.0:** Must upgrade to v0.25.9 first if coming from pre-v0.15.3.

## 2026-02-16 — ZeroTier 1.16.0 licensing changes (vpn-filesync-writer)
- **ZeroTier 1.16.0** (Sept 11, 2024) moved the network controller code to commercial source-available license.
- **Core client remains MPL-2.0** (open source). Controller code is free for personal/non-profit, commercial requires license.
- **Default packages no longer include the controller.** Must build from source with `ZT_NONFREE=1` to get it.
- **ztncui-aio (self-hosted controller UI) is ARCHIVED** (Nov 2025) due to this licensing change. Last version ships ZeroTier 1.14.2.
- **ZTNET is the current best self-hosted controller UI** — v0.7.14 (Jan 2026), actively maintained, uses PostgreSQL + Next.js.
- **ZeroTier free tier reduced** (Nov 2025): 10 devices, 1 network (was 25 devices for older accounts).
- **Self-hosted controller bypasses limits** — unlimited nodes and networks.
- **Protocol:** Layer 2 virtual Ethernet, Salsa20/Poly1305 + Curve25519 encryption, UDP port 9993.
- **MinIO is ARCHIVED** on GitHub (removed from awesome-selfhosted Feb 14). Do NOT write a MinIO guide. Alternatives: Garage, SeaweedFS.

## 2026-02-16 — Extended app version baseline for 25 new articles (BI & Finance, iteration 6)
Freshness audit of all new app guides added since iteration 5. Versions as of 2026-02-16:
- Borgmatic: article uses pip (no Docker image tag pinned). Latest: borgmatic 2.1.2 (Feb 6, 2026). Current.
- Photoview: 2.4.0 in article, matches GitHub release (June 2024). Current but project has slow development.
- SiYuan: v3.5.7 in article, matches latest GitHub release (Feb 14, 2026). Current.
- AFFiNE: uses `ghcr.io/toeverything/affine-graphql:stable` (no version pin). Latest GitHub: v0.26.2 (Feb 8). Current approach.
- AppFlowy: article exists but no Docker image tag pinned. Latest GitHub: 0.11.2 (Feb 14, 2026).
- Blocky: v0.28.2 in article, matches latest (Nov 18, 2025). Current.
- Emby: 4.9.3.0 in article, matches latest stable GitHub release (Jan 8, 2026). Current. (Docker has 4.10.0.2 beta.)
- HAProxy: 3.3.3 referenced in learnings. Current.
- **Joplin Server: 3.2.1 IN ARTICLE → STALE. Latest is v3.5.12 (Jan 17, 2026).** 3 minor versions behind.
- KeeWeb: 1.18.7 in article, matches latest (July 2021). Current but project dormant.
- Lychee: v7.3.3 in article, matches latest (Feb 15, 2026). Current.
- Obsidian LiveSync: uses couchdb:3.4 (the underlying DB). Plugin latest: 0.25.43 (Feb 5, 2026).
- **Outline: 0.82.0 IN ARTICLE → STALE. Latest is v1.5.0 (Feb 15, 2026).** MAJOR version jump (0.x → 1.x).
- Passbolt: 5.9.0-1-ce in article, matches latest (Jan 26, 2026). Current.
- Piwigo: 16.2.0 in article (via LSIO image), matches latest (Dec 30, 2025). Current.
- **Prometheus: v3.5.1 IN ARTICLE → STALE. Latest GitHub is v3.9.1 (Jan 7, 2026).** 4 minor versions behind.
- qBittorrent: 5.1.4 in article (via LSIO image). No GitHub "latest" release (uses pre-releases).
- Restic: 0.18.1 in article, matches latest (Sept 21, 2025). Current.
- Stash: v0.30.1 in article, matches latest (Dec 18, 2025). Current.
- Technitium: 14.3.0 in article, matches Docker Hub latest. Current.
- TriliumNext: v0.95.0 in article, matches latest (June 15, 2025). Current.
- Wiki.js: 2.5 in article, GitHub latest is v2.5.312 (Feb 12, 2026). Versioning uses minor tag (2.5) — current.
- WordPress: 6.9.1-php8.4-apache in article. WordPress doesn't use GitHub releases. Current based on Docker Hub.
- Grafana: 12.3.3 in article (OSS variant), matches GitHub latest (Feb 12, 2026). Current.
- Audiobookshelf: 2.32.1 in article, matches latest (Dec 23, 2025). Current.

## 2026-02-16 — Additional project health warnings (BI & Finance, iteration 6)
- **KeeWeb** — Last GitHub release v1.18.7 on July 2021. Docker image version is current but project appears dormant (no releases in 4.5+ years). Monitor.
- **Photoview** — Last GitHub release v2.4.0 on June 2024. Docker Hub only has dev/nightly/sha tags, no stable version tags. Slow development.
- **Grocy** — Last GitHub release v4.5.0 on March 2025 (~11 months). Slow release cadence.
- **authentik** Docker image is on GHCR (`ghcr.io/goauthentik/server`), NOT Docker Hub. Docker Hub returns 404 for `goauthentik/server`.

## 2026-02-16 — Envoy Proxy v1.37.0 Docker setup (proxy-docker-writer)
- **Image:** `envoyproxy/envoy:v1.37.0` (latest stable, released Jan 13, 2025)
- **Tag format:** `envoyproxy/envoy:v{VERSION}` for stable releases. Do NOT use commit-hash tags like `dev-5505ead` for production.
- **Admin port:** 9901 (stats, health checks, config dump, hot restart)
- **Default listener port:** 10000 (in example configs — user-configurable)
- **Config path:** `/etc/envoy/envoy.yaml`
- **Env vars:** `ENVOY_UID` (default 101), `ENVOY_GID` (default 101) — sets the user the proxy runs as
- **Runs as root, drops to UID 101** — config files must be readable by this user. Use `chmod go+r` on mounted configs.
- **No automatic HTTPS.** Requires external ACME client (Certbot) or SDS for certificate management.
- **Podman is officially unsupported.** Envoy Docker images are built and tested exclusively with Docker.
- **Config is extremely verbose** — typed_config with @type annotations required for every filter. A simple HTTP proxy is 30+ lines.
- **Multiple supported branches:** v1.37, v1.36, v1.35, v1.34, v1.33 — all receive security backports.
- **Logs to stdout/stderr by default** (Docker-friendly).

## 2026-02-16 — Freshness audit iteration 7 — 4 new apps + updates (BI & Finance, iteration 7)
New app guides audited against latest releases:
- Authelia: 4.39.15 in article = latest stable (Nov 29, 2025). Current. Active dev branches (Feb 2026) but no new stable release yet.
- Envoy: v1.37.0 in article = latest stable (Jan 13, 2026). Current. Dev tags updated daily.
- Padloc: 4.3.0 in article = latest (March 2023). Current version but **project effectively dormant** — no release in ~3 years. Docker image is `padloc/server` (NOT padloc/padloc). Docker `latest` tag last updated Dec 2023.
- Zoraxy: v3.3.1 in article = latest stable (Jan 28, 2026). Current. RC v3.3.2-rc1 available (Feb 15).

Stale article fixes confirmed:
- **Navidrome: FIXED** — article updated from 0.54.5 to 0.60.3 by Operations.
- **Cloudflare Tunnel: FIXED** — article updated from 2025.2.1 to 2026.2.0 by Operations.

Outline versioning clarification:
- **Outline Docker tags use different versioning from GitHub releases.** Docker Hub `outlinewiki/outline:0.82.0` is the latest Docker tag. GitHub shows v1.5.0. Operations confirmed these are the same release, just different versioning schemes. **The article at 0.82.0 is actually CURRENT for Docker** — the stale alert was based on comparing Docker tags to GitHub release tags. Future freshness checks for Outline should use Docker Hub as the version source, not GitHub.

## 2026-02-16 — Zoraxy v3.3.1 Docker setup (proxy-docker-writer)
- **Image:** `zoraxydocker/zoraxy:v3.3.1` (latest stable, Jan 28, 2026)
- **Ports:** 80 (HTTP), 443 (HTTPS), 8000 (Management UI)
- **Config volume:** `/opt/zoraxy/config/` (declared as VOLUME in Dockerfile)
- **Plugin volume:** `/opt/zoraxy/plugin/`
- **Working directory:** `/opt/zoraxy/config/`
- **Entrypoint:** Python script (`/opt/zoraxy/entrypoint.py`), not the Go binary directly
- **Health check built-in:** Pings management port every 15 seconds
- **Key env vars:** `PORT` (default 8000, do NOT include colon in Docker), `DOCKER` (default true), `FASTGEOIP` (default false, needs ~1 GB extra RAM), `ZEROTIER` (default false), `WEBFM` (default true), `ENABLELOG` (default true)
- **Docker socket mount optional** — enables container auto-discovery but grants root-equivalent access
- **`extra_hosts: host.docker.internal:host-gateway`** needed for proxying to host services
- **FastGeoIP warning:** Enabling FASTGEOIP loads the entire GeoIP database into memory (~1 GB). Do not enable on memory-constrained servers.
- **ZeroTier is baked into the image** (compiled from Rust source) but disabled by default
- **No Docker labels support** — unlike Traefik, Zoraxy discovers containers but routes are configured in the web UI

## 2026-02-16 — NGINX Unit ARCHIVED (proxy-docker-writer)
- **Repository archived October 8, 2025.** Marked as unsupported — no further development, security vulnerabilities may go unaddressed.
- **Last release:** v1.35.0 (September 11, 2025)
- **License:** Apache-2.0 (can still be used but no updates coming)
- **Do NOT write an app guide recommending NGINX Unit.** Mention only in comparisons/roundups as "archived/discontinued."
- **Alternative for polyglot app serving:** Caddy, Traefik, or direct Docker with language-specific images

## 2026-02-16 — awesome-selfhosted new build (BI & Finance, iteration 8)
- **New build at 2026-02-16T18:05:48Z** — commit 881cbe8 from data commit 4d593ba.
- Previous build was Feb 14 (commit 5296cdd from data 013aad4).
- **2-day gap between builds** — potential new apps or removals. Need to diff data commits 013aad4 vs 4d593ba to identify changes.
- Investigate in iteration 9 what apps were added/changed.

## 2026-02-16 — Duplicati v2.2.0.3 (tier2-writer)
- **Image:** `lscr.io/linuxserver/duplicati:v2.2.0.3-ls5` (LinuxServer.io)
- **Port:** 8200 (web UI)
- **LSIO pattern:** PUID/PGID env vars for file permissions
- **Volumes:** /config (app data), /backups (backup destination), /source (data to back up, mount read-only)
- **Backends:** S3, B2, Google Drive, OneDrive, SFTP, WebDAV, and 20+ more — all configured via web UI
- **Encryption:** AES-256 built-in, configured per backup job
- **NOTE:** Duplicati 2.x has been in "beta" for years despite being widely used in production

## 2026-02-16 — Linkding 1.45.0 (tier2-writer)
- **Image:** `sissbruecker/linkding:1.45.0`
- **Port:** 9090
- **Database:** SQLite by default (no separate DB container needed), PostgreSQL optional for heavy use
- **Auth:** LD_SUPERUSER_NAME + LD_SUPERUSER_PASSWORD env vars for initial admin
- **Very lightweight:** ~50 MB RAM idle, single container
- **API:** REST API with token auth at /api/
- **Background tasks:** LD_ENABLE_EBOOK_SUPPORT and LD_ENABLE_PREVIEW_IMAGES require chromium (adds ~200 MB to image)

## 2026-02-16 — Prowlarr 2.3.0.5236 (tier2-writer)
- **Image:** `lscr.io/linuxserver/prowlarr:2.3.0.5236`
- **Port:** 9696
- **Role:** Indexer manager for *arr stack — manages indexers in one place, pushes to Sonarr/Radarr/Lidarr
- **FlareSolverr:** Use `ghcr.io/flaresolverr/flaresolverr:v3.3.21` for Cloudflare-protected indexers
- **Network:** Must share Docker network with other *arr apps for direct communication
- **API:** Accessible at /api/v1/ with X-Api-Key header

## 2026-02-16 — Bazarr 1.5.1 (tier2-writer)
- **Image:** `lscr.io/linuxserver/bazarr:1.5.1`
- **Port:** 6767
- **CRITICAL:** Media paths in Bazarr MUST match paths in Sonarr/Radarr exactly. If Sonarr sees /tv, Bazarr must also see /tv at the same mount point. Path mismatch = subtitle downloads fail silently.
- **Subtitle providers:** OpenSubtitles.org (requires account), Addic7ed, Subscene, etc.
- **Anti-captcha:** Some providers need anti-captcha service for automated downloads

## 2026-02-16 — Borgmatic 1.9.14 (tier2-writer)
- **Image:** `ghcr.io/borgmatic-collective/borgmatic:1.9.14`
- **Config:** /etc/borgmatic/config.yaml (YAML config file, NOT env vars for backup configuration)
- **Scheduling:** crontab.txt mounted at /etc/borgmatic.d/crontab.txt
- **IMPORTANT:** Use `init: true` in Docker Compose for proper signal handling (clean shutdown)
- **BORG_PASSPHRASE:** Set via environment variable for encryption
- **Remote backups:** Via SSH — mount SSH keys at /root/.ssh
- **Hooks:** pre_backup, post_backup, on_error — can run database dumps, notifications (Apprise), healthchecks.io pings
- **Borg cache:** Mount /root/.cache/borg as a volume to persist dedup index between runs

## 2026-02-16 — Mailu 2024.06 (tier2-writer)
- **Images:** `ghcr.io/mailu/*:2024.06` (front, admin, imap, smtp, antispam, webmail, resolver)
- **Setup:** Use setup wizard at setup.mailu.io to generate docker-compose.yml and mailu.env
- **Containers:** 6-8 depending on options (add ClamAV for +1 GB RAM)
- **RAM:** ~1.5-2 GB without ClamAV, ~2.5-3 GB with ClamAV
- **ARM64:** Supported — works on Raspberry Pi 4
- **Webmail:** SnappyMail (replaced Roundcube in recent versions)
- **DNS requirements:** MX, SPF, DKIM (auto-generated), DMARC, PTR (reverse DNS)
- **Port 25:** MUST be open from hosting provider — many cloud providers block it

## 2026-02-16 — Mailcow 2026-01 (tier2-writer)
- **Installation:** `git clone` + `./generate_config.sh` — NOT a standard docker-compose file you write yourself
- **Containers:** 15+ including SOGo, memcached, PHP-FPM, watchdog, rspamd
- **RAM:** 4-5 GB idle without ClamAV, 6+ GB recommended
- **x86_64 ONLY:** No ARM support
- **Groupware:** SOGo provides CalDAV, CardDAV, ActiveSync (major differentiator vs Mailu)
- **2FA:** Built-in TOTP and U2F/WebAuthn support
- **Backup:** Built-in `helper-scripts/backup_and_restore.sh`
- **Update:** Built-in `./update.sh` handles migrations
- **Admin UI:** Feature-rich — rate limiting, rspamd training, quarantine, app passwords

## 2026-02-16 — Jackett v0.24.988 (tier2-writer)
- **Image:** `lscr.io/linuxserver/jackett` (LSIO)
- **Port:** 9117
- **Role:** Indexer proxy — translates Torznab/Potato queries from Sonarr/Radarr into tracker-specific requests
- **NOTE:** Prowlarr is the newer, recommended replacement. Jackett still works and is actively maintained but Prowlarr offers native *arr integration without API key copy-paste.

## 2026-02-16 — Transmission 4.0.6 (tier2-writer)
- **Image:** `lscr.io/linuxserver/transmission:4.0.6` (LSIO)
- **Ports:** 9091 (web UI), 51413 TCP+UDP (peer connections)
- **Auth:** USER and PASS env vars for web UI authentication
- **Alt web UIs:** TRANSMISSION_WEB_HOME env var to point to alternative UIs (Flood, Combustion, etc.)
- **PEERPORT:** Set to match Docker port mapping; disables random port selection

## 2026-02-16 — Matomo 5.7.1 (tier2-writer)
- **Image:** `matomo:5.7.1-apache` (official Docker Hub)
- **Port:** 80 (internal, map to 8080 or behind reverse proxy)
- **Requires:** MariaDB/MySQL
- **Setup:** Web-based installer wizard on first access
- **Env vars:** MATOMO_DATABASE_HOST, MATOMO_DATABASE_USERNAME, MATOMO_DATABASE_PASSWORD, MATOMO_DATABASE_DBNAME
- **Cron:** Needs scheduled task (`core:archive`) for report processing — run via Docker exec or sidecar
- **Plugins:** Marketplace with free and paid plugins (heatmaps, session recording are paid)
- **GA import:** Supports importing data from Google Analytics

## 2026-02-16 — Hugo (tier2-writer)
- **Image:** `ghcr.io/gohugoio/hugo:0.145.0` (official) or `hugomods/hugo` (community)
- **NOT a typical Docker app** — Hugo generates static HTML, then a web server (Nginx/Caddy) serves it
- **Best pattern:** Multi-stage Docker build: Hugo builds the site → Nginx serves the output
- **Dev server:** `hugo server --bind 0.0.0.0` on port 1313
- **Hugo Extended:** Required for SCSS/SASS processing
- **Config:** hugo.toml (or config.toml) in project root
- **Themes:** Installed via git submodule in themes/ directory

## 2026-02-19 — Ghost v6.19.1 freshness update (Operations)
- **Image:** `ghost:6.19.1` (updated from v5.120.0)
- **Major version jump (v5→v6):** Node.js v22+ now required (handled by Docker image). API `?limit=all` removed — max 100 items per request. `created_by`/`updated_by` columns removed in auto-migration.
- **No Docker Compose config changes required.** MySQL 8, port 2368, double-underscore env var format all unchanged.
- **v6.19.1 includes a security fix** for SQL injection in the Content API.

## 2026-02-19 — Stirling-PDF v2.5.0 freshness update (Operations)
- **Image:** `stirlingtools/stirling-pdf:2.5.0` (was `frooodle/s-pdf:0.46.1`)
- **Namespace changed:** `frooodle/s-pdf` → `stirlingtools/stirling-pdf`. Old image is deprecated.
- **Port unchanged:** 8080
- **Removed env vars:** `UI_APPNAME`, `UI_HOMEDESCRIPTION`, `SECURITY_JWT_SECURECOOKIE`. UI branding now configured via admin panel.
- **Renamed env vars:** `SECURITY_JWT_ENABLED` → `SECURITY_JWT_PERSISTENCE`, `SECURITY_JWT_KEYCLEANUP` → `SECURITY_JWT_ENABLEKEYCLEANUP`
- **New env var:** `MODE` (BOTH/BACKEND/FRONTEND, default BOTH)
- **Frontend rewritten:** Thymeleaf → React. Custom HTML/CSS overrides must be migrated.
- **Volume paths unchanged.** `/configs`, `/usr/share/tessdata`, `/logs`, `/pipeline`, `/customFiles` all still valid.

## 2026-02-19 — Mealie v3.10.2 freshness update (Operations)
- **Image:** `ghcr.io/mealie-recipes/mealie:v3.10.2` (was v2.7.1)
- **Port unchanged:** 9000 internal
- **All v2 env vars work in v3.** No Docker Compose changes required.
- **API routes changed:** `/api/users` → `/api/admin/users`. Only affects custom integrations.
- **New env var:** `ALLOW_PASSWORD_LOGIN` (default true), `OPENAI_CUSTOM_PROMPT_DIR` (v3.10.0+)
- **PostgreSQL still recommended.**

## 2026-02-19 — Homarr v1.53.1 freshness update (Operations)
- **Image:** `ghcr.io/homarr-labs/homarr:v1.53.1` (was `ghcr.io/homarr-dev/homarr:v1.0.0-beta.11`)
- **Org changed:** `homarr-dev` → `homarr-labs`
- **Port unchanged:** 7575
- **SECRET_ENCRYPTION_KEY:** Must be a 64-character hex string (generate with `openssl rand -hex 32`). Previous article said 32 chars — was wrong.
- **Volume:** Official docs use bind mount `./homarr/appdata:/appdata` rather than named volume.
- **Database:** Uses better-sqlite3 internally. No external DB needed.

## 2026-02-19 — Radarr v6.0.4 freshness update (Operations)
- **Image:** `lscr.io/linuxserver/radarr:6.0.4` (was 5.22.4)
- **Major change:** Runtime migrated from Mono to .NET. In Docker this is transparent — just update the image.
- **Port unchanged:** 7878
- **Env vars and volume paths unchanged.** PUID, PGID, TZ, /config, /movies, /downloads all the same.
- **Database auto-migrates** from v5 to v6 on first start.
- **SQLite gotcha:** v6 uses SourceGear SQLite3 which requires newer GLIBC. Affects bare-metal on old Debian/Ubuntu but not Docker.

## 2026-02-19 — PrivateBin v2.0.3 freshness update (Operations)
- **Image:** `privatebin/nginx-fpm-alpine:2.0.3` (was 1.7.6)
- **Port unchanged:** 8080
- **Breaking change:** Legacy storage class names (`privatebin_data`, `privatebin_db`, `zerobin_db`) removed. Must use `Filesystem`, `Database`, `GoogleCloudStorage`, or `S3Storage` in `[model]` config section.
- **ZeroBin compatibility dropped** — v1 paste format no longer supported.
- **Old page templates removed** — `bootstrap5` is now the only/default template.
- **New features:** URL shortening (`shortenbydefault`), password peek, native S3 storage backend.
- **Config path unchanged:** `/srv/cfg/conf.php`
