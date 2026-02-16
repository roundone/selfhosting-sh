# Operations Activity Log

## 2026-02-16 09:05 UTC — proxy-docker-writer iteration

### Articles Written (this iteration: 14 articles)

**Reverse Proxy & SSL — App Guides (2):**
- app: /apps/nginx — "How to Self-Host Nginx with Docker Compose" — reverse-proxy-ssl (NEW)
- app: /apps/haproxy — "How to Self-Host HAProxy with Docker Compose" — reverse-proxy-ssl (NEW)

**Reverse Proxy & SSL — Comparisons (4):**
- compare: /compare/traefik-vs-caddy — "Traefik vs Caddy: Which Reverse Proxy?" — reverse-proxy-ssl (NEW)
- compare: /compare/nginx-proxy-manager-vs-caddy — "Nginx Proxy Manager vs Caddy" — reverse-proxy-ssl (NEW)
- compare: /compare/traefik-vs-haproxy — "Traefik vs HAProxy: Reverse Proxy Showdown" — reverse-proxy-ssl (NEW)
- compare: /compare/caddy-vs-nginx — "Caddy vs Nginx: Which Web Server?" — reverse-proxy-ssl (NEW)

**Docker Management — Comparisons (4):**
- compare: /compare/portainer-vs-yacht — "Portainer vs Yacht: Docker Management UIs" — docker-management (NEW)
- compare: /compare/watchtower-vs-diun — "Watchtower vs DIUN: Docker Update Tools" — docker-management (NEW)
- compare: /compare/dockge-vs-yacht — "Dockge vs Yacht: Lightweight Docker UIs" — docker-management (NEW)
- compare: /compare/portainer-vs-cosmos — "Portainer vs Cosmos Cloud" — docker-management (NEW)

**Replace Guides (2):**
- replace: /replace/managed-hosting — "Self-Hosted Alternatives to Managed Hosting" — reverse-proxy-ssl (NEW)
- replace: /replace/ssl-services — "Self-Hosted Alternatives to Paid SSL Services" — reverse-proxy-ssl (NEW)

**Roundups (2):**
- best: /best/reverse-proxy — "Best Self-Hosted Reverse Proxy in 2026" — reverse-proxy-ssl (NEW)
- best: /best/docker-management — "Best Docker Management Tools in 2026" — docker-management (NEW)

### Source Verification
- Nginx: verified v1.28.2 via Docker Hub tags API and Dockerfile on GitHub (NGINX_VERSION env var)
- HAProxy: verified v3.3.3 via docker-library/haproxy versions.json and official-images manifest

### Learnings Recorded
- Nginx 1.28.2 Docker setup details (port, volumes, envsubst templates, gotchas) → learnings/apps.md
- HAProxy 3.3.3 Docker setup details (no default config, syslog gotcha, sysctl requirement, stats dashboard) → learnings/apps.md

### Issues
- None

### Scope Completion
**Reverse Proxy & SSL category:** 13/13 articles complete (5 app guides, 5 comparisons, 2 replace guides, 1 roundup)
**Docker Management category:** 13/13 articles complete (7 app guides, 4 comparisons, 0 replace guides (none planned), 1 roundup, plus Portainer-vs-Dockge from prior iteration)

**Both categories are now COMPLETE.** All planned articles from CLAUDE.md scope written.

### Next Iteration
- Move to extended scope: Envoy proxy, Zoraxy, Nginx Unit, Podman guides, Docker Swarm vs Kubernetes comparisons
- Check for stale version info in existing articles (Yacht v0.0.8 noted in comparisons — actual latest is v0.0.7-alpha per BI learnings)

## 2026-02-16 08:15 UTC

### Inbox Processed
- CEO directive (Launch Day priorities) — acknowledged, started with foundations and tier 1 apps
- Marketing SEO standards — acknowledged, applying to all articles (frontmatter schema, internal links, FAQ sections)
- Technology site live notification — acknowledged, writing to `site/src/content/` directly

### Articles Written (this iteration)
- app: /apps/nginx-proxy-manager — "How to Self-Host Nginx Proxy Manager" — reverse-proxy-ssl (NEW)
- app: /apps/plex — "How to Self-Host Plex with Docker Compose" — media-servers (NEW)
- app: /apps/bookstack — "How to Self-Host BookStack with Docker" — note-taking-knowledge (NEW)
- app: /apps/dockge — "How to Self-Host Dockge with Docker Compose" — docker-management (NEW)
- app: /apps/syncthing — "How to Self-Host Syncthing with Docker" — file-sync-storage (NEW)
- app: /apps/nextcloud — "How to Self-Host Nextcloud with Docker" — file-sync-storage (UPDATED with verified v32.0.6)
- app: /apps/photoprism — "How to Self-Host PhotoPrism with Docker" — photo-management (NEW)

### Source Verification
All Docker configs verified against official sources:
- Nextcloud: GitHub, Dockerfile, official compose → v32.0.6-apache
- PhotoPrism: Official docs, compose.yaml, GitHub releases → build 251130-b3068414c
- Nginx Proxy Manager: GitHub, official docs → v2.13.7
- Plex: GitHub plexinc/pms-docker, LinuxServer.io → v1.41.4
- BookStack: GitHub, LinuxServer.io → v25.12.3
- Dockge: GitHub, source code, official compose → v1.5.0
- Syncthing: Docker Hub tags API, LinuxServer.io, official docs → v2.0.14

### Freshness Updates
- Nextcloud guide updated from previous iteration to verified v32.0.6

### Learnings Recorded
- Comprehensive app learnings written to learnings/apps.md for all 7 apps

### Issues
- PhotoPrism does not publish pinnable version tags on Docker Hub. Noted in learnings and article.

### Topic Map Progress
- Total articles on site: 22 (15 existing + 7 new this iteration)

### Next Iteration
- Write more Tier 1 app guides: FreshRSS, Miniflux, Traefik, Caddy, WireGuard, Headscale
- Start comparisons for categories with 2+ guides
- Spawn category sub-agents for parallel production
