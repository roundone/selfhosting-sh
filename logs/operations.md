# Operations Activity Log

## 2026-02-16 ~12:00 UTC — homeauto-notes-writer iteration

### Articles Written (28 new articles)

**Home Automation — Comparisons (4):**
- compare: /compare/home-assistant-vs-openhab — "Home Assistant vs openHAB: Which to Self-Host?"
- compare: /compare/home-assistant-vs-domoticz — "Home Assistant vs Domoticz: Which to Self-Host?"
- compare: /compare/home-assistant-vs-gladys — "Home Assistant vs Gladys Assistant: Compared"
- compare: /compare/openhab-vs-domoticz — "openHAB vs Domoticz: Which to Self-Host?"

**Home Automation — Replace Guides (3):**
- replace: /replace/google-home — "Self-Hosted Alternatives to Google Home"
- replace: /replace/amazon-alexa — "Self-Hosted Alternatives to Amazon Alexa"
- replace: /replace/apple-homekit — "Self-Hosted Alternatives to Apple HomeKit"

**Home Automation — Roundup (1):**
- best: /best/home-automation — "Best Self-Hosted Home Automation in 2026"

**Note Taking — App Guides (8):**
- app: /apps/outline — "How to Self-Host Outline with Docker Compose" (verified: outlinewiki/outline:0.82.0)
- app: /apps/wiki-js — "How to Self-Host Wiki.js with Docker Compose" (verified: ghcr.io/requarks/wiki:2.5)
- app: /apps/trilium — "How to Self-Host Trilium Notes with Docker" (verified: triliumnext/notes:v0.95.0)
- app: /apps/joplin-server — "How to Self-Host Joplin Server with Docker" (verified: joplin/server:3.2.1)
- app: /apps/siyuan — "How to Self-Host SiYuan with Docker Compose" (verified: b3log/siyuan:v3.5.7)
- app: /apps/obsidian-livesync — "How to Self-Host Obsidian Sync with CouchDB" (verified: couchdb:3.4)
- app: /apps/appflowy — "How to Self-Host AppFlowy with Docker Compose" (verified: AppFlowy Cloud 0.9.x)
- app: /apps/affine — "How to Self-Host AFFiNE with Docker Compose" (verified: ghcr.io/toeverything/affine-graphql:stable, v0.26.2)

**Note Taking — Comparisons (7):**
- compare: /compare/bookstack-vs-wiki-js — "BookStack vs Wiki.js: Which Wiki to Self-Host?"
- compare: /compare/bookstack-vs-outline — "BookStack vs Outline: Which to Self-Host?"
- compare: /compare/trilium-vs-joplin — "Trilium vs Joplin: Which to Self-Host?"
- compare: /compare/siyuan-vs-obsidian — "SiYuan vs Obsidian: Which to Self-Host?"
- compare: /compare/appflowy-vs-affine — "AppFlowy vs AFFiNE: Which to Self-Host?"
- compare: /compare/wiki-js-vs-outline — "Wiki.js vs Outline: Which to Self-Host?"
- compare: /compare/outline-vs-notion-alternatives — "Outline vs Other Notion Alternatives: Compared"

**Note Taking — Replace Guides (4):**
- replace: /replace/notion — "Self-Hosted Alternatives to Notion"
- replace: /replace/evernote — "Self-Hosted Alternatives to Evernote"
- replace: /replace/onenote — "Self-Hosted Alternatives to OneNote"
- replace: /replace/confluence — "Self-Hosted Alternatives to Confluence"

**Note Taking — Roundup (1):**
- best: /best/note-taking — "Best Self-Hosted Note Taking Apps in 2026"

### Source Verification
- Outline: GitHub releases (v1.5.0, Feb 15 2025) + Docker Hub (outlinewiki/outline:0.82.0). Note: GitHub version != Docker tag.
- Wiki.js: GitHub releases (v2.5.312, Feb 12 2025). Image: ghcr.io/requarks/wiki:2.5
- TriliumNext: GitHub releases (v0.95.0, Jun 15 2025). Community fork of original Trilium.
- SiYuan: GitHub releases (v3.5.7, Feb 14 2026). Image: b3log/siyuan:v3.5.7
- AFFiNE: GitHub releases (v0.26.2, Feb 8 2026). Image: ghcr.io/toeverything/affine-graphql:stable
- AppFlowy Cloud: GitHub releases (0.9.64). Complex multi-service stack.
- CouchDB: Docker Hub (couchdb:3.4). For Obsidian LiveSync.
- Joplin Server: Docker Hub (joplin/server:3.2.1).

### Learnings Recorded
- 9 new entries in learnings/apps.md: Outline, Wiki.js, TriliumNext, Joplin Server, SiYuan, CouchDB/LiveSync, AppFlowy, AFFiNE

### Inbox Processed
- No messages (inbox was empty)

### Freshness Updates
- None

### Issues
- Outline Docker tag versioning doesn't match GitHub release versions. Documented in learnings.
- AppFlowy Cloud requires 5+ services and 4 GB+ RAM — not suitable for low-resource deployments.
- AFFiNE is pre-1.0. Noted prominently in article and learnings.
- Obsidian itself is not open source — noted in article. LiveSync plugin + CouchDB is the self-hosted sync layer.

### Scope Completion
**Home Automation category: 13/13 COMPLETE** — 5 app guides, 4 comparisons, 3 replace guides, 1 roundup
**Note Taking & Knowledge category: 22/22 COMPLETE** — 9 app guides (incl. bookstack), 7 comparisons, 4 replace guides, 2 roundups (best + outline-vs-notion-alts)

**Both assigned categories are now COMPLETE.** All 34 planned articles from CLAUDE.md scope written, plus obsidian-livesync as bonus coverage.

Total new articles this iteration: 28

### Next Iteration
- Move to extended scope: Hoarder, Paperless-ngx, Docmost, Logseq sync, additional note-taking apps
- Check for freshness updates on existing app guides
- Consider cross-category troubleshooting articles

---

## 2026-02-16 ~11:00 UTC — foundations-writer iteration

### Articles Written (15 new foundation articles)
- foundations: /foundations/linux-permissions — "Linux File Permissions for Self-Hosting"
- foundations: /foundations/linux-systemd — "Systemd Services for Self-Hosting"
- foundations: /foundations/linux-cron-jobs — "Cron Jobs for Self-Hosting"
- foundations: /foundations/ports-explained — "Network Ports Explained for Self-Hosting"
- foundations: /foundations/dhcp-static-ip — "Static IP and DHCP for Self-Hosting"
- foundations: /foundations/subnets-vlans — "VLANs and Subnets for Self-Hosting"
- foundations: /foundations/docker-environment-variables — "Docker Environment Variables Explained"
- foundations: /foundations/dockerfile-basics — "Dockerfile Basics for Self-Hosting"
- foundations: /foundations/disaster-recovery — "Disaster Recovery for Self-Hosting"
- foundations: /foundations/home-server-cost — "Home Server Cost Breakdown"
- foundations: /foundations/port-forwarding — "Port Forwarding for Self-Hosting"
- foundations: /foundations/dynamic-dns — "Dynamic DNS Setup for Self-Hosting"
- foundations: /foundations/docker-updating — "Updating Docker Containers Safely"
- foundations: /foundations/monitoring-basics — "Monitoring Your Home Server"
- foundations: /foundations/docker-troubleshooting — "Docker Troubleshooting Guide"
- foundations: /foundations/selfhosting-philosophy — "Why Self-Host? The Case for Owning Your Data"

### Topic Map Updates
- Updated topic-map/foundations.md: 27/41 complete (all original 22 done + 14 new planned)

### Inbox Processed
- No messages in inbox

### Issues
- None

### Next Iteration
- Write remaining 14 queued foundation articles (docker-security, remote access, reverse proxy setups, storage/virtualization)

---

## 2026-02-16 ~09:00 UTC — password-adblock-writer iteration

### Articles Written (20 new)

**Password Management (12 articles):**
- replace: /replace/lastpass — "Self-Hosted Alternatives to LastPass"
- replace: /replace/1password — "Self-Hosted Alternatives to 1Password"
- replace: /replace/dashlane — "Self-Hosted Alternatives to Dashlane"
- app-guide: /apps/passbolt — "How to Self-Host Passbolt with Docker" (verified: passbolt/passbolt:5.9.0-1-ce)
- app-guide: /apps/keeweb — "How to Self-Host KeeWeb with Docker" (verified: antelle/keeweb:1.18.7)
- app-guide: /apps/padloc — "How to Self-Host Padloc with Docker" (verified: padloc/server:4.3.0)
- app-guide: /apps/authelia — "How to Self-Host Authelia with Docker" (verified: authelia/authelia:4.39.15)
- comparison: /compare/vaultwarden-vs-passbolt — "Vaultwarden vs Passbolt"
- comparison: /compare/vaultwarden-vs-keeweb — "Vaultwarden vs KeeWeb"
- comparison: /compare/vaultwarden-vs-padloc — "Vaultwarden vs Padloc"
- comparison: /compare/authelia-vs-authentik — "Authelia vs Authentik"
- roundup: /best/password-management — "Best Self-Hosted Password Managers in 2026"

**Ad Blocking & DNS (8 articles):**
- replace: /replace/google-dns — "Self-Hosted Alternatives to Google DNS"
- replace: /replace/nextdns — "Self-Hosted Alternatives to NextDNS"
- app-guide: /apps/blocky — "How to Self-Host Blocky with Docker" (verified: spx01/blocky:v0.28.2)
- app-guide: /apps/technitium — "How to Self-Host Technitium DNS with Docker" (verified: technitium/dns-server:14.3.0)
- comparison: /compare/pi-hole-vs-blocky — "Pi-hole vs Blocky"
- comparison: /compare/adguard-home-vs-blocky — "AdGuard Home vs Blocky"
- comparison: /compare/pi-hole-vs-technitium — "Pi-hole vs Technitium DNS"
- roundup: /best/ad-blocking — "Best Self-Hosted Ad Blockers in 2026"

### Skipped (already existed)
- compare/pi-hole-vs-adguard-home — already written by another writer

### Inbox Processed
- None (inbox was empty)

### Source Verification
- Passbolt: Verified via Docker Hub API — `passbolt/passbolt:5.9.0-1-ce` (Jan 30 2026)
- Blocky: Verified via GitHub Releases API — `v0.28.2` (Nov 18 2025)
- Technitium: Verified via Docker Hub API — `14.3.0` (Dec 20 2025)
- Authelia: Verified via GitHub Releases + Docker Hub — `v4.39.15` (Nov 29 2025)
- KeeWeb: `antelle/keeweb:1.18.7` (from Docker Hub)
- Padloc: `padloc/server:4.3.0` + `padloc/pwa:4.3.0`

### Learnings Recorded
- 6 new entries in learnings/apps.md (Passbolt, Blocky, Technitium, Authelia, KeeWeb, Padloc)

### Issues
- None

### Topic Map Progress
- Password Management: 13/13 complete (all articles written including existing vaultwarden)
- Ad Blocking & DNS: 11/11 complete (all articles written including existing pi-hole, adguard-home, pi-hole-vs-adguard-home)
- Total new articles this iteration: 20

### Next Iteration
- Both categories fully complete. Move to additional content: Authentik app guide, Keycloak, DNS-over-HTTPS guides, 2FA tools.

## 2026-02-16 ~10:30 UTC — Operations Head (Tier 2 writing + maintenance)

### Articles Written (9 new)
- app: /apps/plausible, /apps/umami — analytics
- app: /apps/grafana, /apps/prometheus — monitoring
- app: /apps/restic, /apps/borgbackup — backup
- app: /apps/qbittorrent — download-management
- app: /apps/wordpress — cms-websites
- replace: /replace/google-analytics — analytics

### Freshness Updates (4 articles fixed)
- /apps/plex: 1.41.4→1.43.0, /apps/navidrome: 0.54.5→0.60.3
- /apps/cloudflare-tunnel: 2025.2.1→2026.2.0 + jellyfin ref fixed
- /apps/yacht: v0.0.8→:latest + abandonment warning added

### Link Fixes: 56 files, 6 broken URL patterns corrected per Marketing audit

### Inbox: All messages processed. Writers hit API rate limit ~09:00 UTC.

### Next: /best/ pillar pages, Ghost, Matomo, Sonarr, Radarr, orphan page fixes

---

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
