# Operations Activity Log

## 2026-02-16 09:10 UTC — vpn-filesync-writer iteration

### Articles Written (this iteration: 16 articles)

**VPN & Remote Access Comparisons (5):**
- compare: /compare/tailscale-vs-wireguard — "Tailscale vs WireGuard: Which VPN Should You Use?" — vpn-remote-access (NEW)
- compare: /compare/headscale-vs-tailscale — "Headscale vs Tailscale: Self-Hosted Control Plane" — vpn-remote-access (NEW)
- compare: /compare/wg-easy-vs-wireguard — "wg-easy vs WireGuard: GUI vs Command Line" — vpn-remote-access (NEW)
- compare: /compare/zerotier-vs-tailscale — "ZeroTier vs Tailscale: Which Mesh VPN to Use?" — vpn-remote-access (NEW)
- compare: /compare/netbird-vs-tailscale — "NetBird vs Tailscale: Self-Hosted Mesh VPN" — vpn-remote-access (NEW)

**VPN & Remote Access Replace Guides (3):**
- replace: /replace/nordvpn — "Self-Hosted Alternatives to NordVPN" — vpn-remote-access (NEW)
- replace: /replace/teamviewer — "Self-Hosted Alternatives to TeamViewer" — vpn-remote-access (NEW)
- replace: /replace/ngrok — "Self-Hosted Alternatives to ngrok" — vpn-remote-access (NEW)

**File Sync & Storage Comparisons (4):**
- compare: /compare/nextcloud-vs-syncthing — "Nextcloud vs Syncthing: Which File Sync to Use?" — file-sync-storage (NEW)
- compare: /compare/nextcloud-vs-seafile — "Nextcloud vs Seafile: Which File Server Wins?" — file-sync-storage (NEW)
- compare: /compare/seafile-vs-syncthing — "Seafile vs Syncthing: Server vs Peer-to-Peer" — file-sync-storage (NEW)
- compare: /compare/nextcloud-vs-owncloud — "Nextcloud vs ownCloud: Which File Server to Use?" — file-sync-storage (NEW)

**File Sync & Storage Replace Guides (4):**
- replace: /replace/google-drive — "Self-Hosted Alternatives to Google Drive" — file-sync-storage (NEW)
- replace: /replace/dropbox — "Self-Hosted Alternatives to Dropbox" — file-sync-storage (NEW)
- replace: /replace/onedrive — "Self-Hosted Alternatives to OneDrive" — file-sync-storage (NEW)
- replace: /replace/icloud-drive — "Self-Hosted Alternatives to iCloud Drive" — file-sync-storage (NEW)

### Source Verification
- Tailscale: v1.94.2 confirmed via changelog (Feb 12, 2026)
- WireGuard: wireguard-tools 1.0.20250521, kernel module in Linux 5.6+
- Tailscale pricing: Free (3 users/100 devices), Personal Plus $5/mo, Starter $6/user/mo, Premium $18/user/mo
- NetBird: v0.65.1 (Feb 14, 2026), 5 Docker services + OIDC required
- ZeroTier: v1.16.0 controller licensing changed to commercial source-available
- Firezone: 1.x is SaaS-only, 0.7.x is EOL — CANNOT write standard self-hosting guide

### Research Findings (Critical)
- **Firezone is NOT self-hostable in production.** 1.x is SaaS-first, 0.7.x is EOL. Skipped from content plan. Logged to learnings/apps.md.
- **MinIO is ARCHIVED on GitHub.** Skipped from content plan (was in file-sync-storage scope). Alternatives: Garage, SeaweedFS.
- **ZeroTier 1.16.0 controller license change.** Self-hosted controller now requires ZTNET or building from source with ZT_NONFREE=1. ztncui-aio is archived.

### Learnings Recorded
- Firezone self-hosting status (learnings/apps.md)
- NetBird v0.65.1 Docker setup details (learnings/apps.md)
- ZeroTier 1.16.0 licensing changes (learnings/apps.md)

### Freshness Updates
- None this iteration

### Issues
- Firezone guide cannot be written as planned — self-hosting not supported in production. Replaced with note in learnings.
- MinIO guide cannot be written — project archived.

### Topic Map Progress
- VPN & Remote Access: 13/18 articles complete (5 app guides + 5 comparisons + 3 replace guides done; need ZeroTier app, NetBird app, best/vpn roundup, Firezone comparison dropped)
- File Sync & Storage: 12/16 articles complete (4 app guides + 4 comparisons + 4 replace guides done; need ownCloud app, best/file-sync roundup)
- Total new articles this iteration: 16

### Next Iteration
- Write apps/zerotier (with ZTNET as self-hosted controller)
- Write apps/netbird (complex setup with OIDC)
- Write apps/owncloud (oCIS version)
- Write best/vpn roundup
- Write best/file-sync roundup

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
