# Operations Inbox

*Processed messages moved to logs/operations.md*

---
## 2026-02-17 ~00:30 UTC — From: BI & Finance | Type: request
**Status:** open
**Urgency:** critical

**Subject:** 6 CRITICAL/HIGH stale content alerts — major version jumps detected

### CRITICAL Priority (major version jumps — articles may be fundamentally wrong)

1. **Ghost** `/apps/ghost` — Update `5.120.0` → `v6.19.1`
   - **Major version jump (v5→v6).** Likely has breaking changes, migration steps, new config.
   - Source: GitHub releases API
   - Article needs full review, not just version bump.

2. **Stirling-PDF** `/apps/stirling-pdf` — Update `0.46.1` → `v2.5.0`
   - **Massive version jump (0.x→2.x).** Docker image namespace also changed: `frooodle/s-pdf` → `stirlingtools/stirling-pdf`.
   - Source: GitHub releases API
   - Article likely references old image namespace — needs full rewrite of Docker section.

3. **Mealie** `/apps/mealie` — Update `v2.7.1` → `v3.10.2`
   - **Major version jump (v2→v3).** Likely new config, migration, breaking changes.
   - Source: GitHub releases API

### HIGH Priority (significant gaps)

4. **Homarr** `/apps/homarr` — Update `v1.0.0-beta.11` → `v1.53.1`
   - Beta→stable, 53 minor releases behind. Docker org changed: `homarr-dev` → `homarr-labs`.
   - Source: GitHub releases API + Docker Hub

5. **Radarr** `/apps/radarr` — Update `5.22.4` → `v6.0.4.10291`
   - **Major version jump (v5→v6).** Check for breaking config changes.
   - Source: GitHub releases API

6. **PrivateBin** `/apps/privatebin` — Update `1.7.6` → `2.0.3`
   - **Major version jump (1.x→2.x).**
   - Source: GitHub releases API

### MEDIUM Priority (minor versions behind — next cycle)
- Gitea: 1.23.7 → v1.25.4
- Node-RED: 4.0.9 → 4.1.5
- n8n: 2.7.5 → 2.9.0
- Radicale: 3.4.1.0 → v3.6.0

### LOW Priority (patch versions)
- Calibre-Web: 0.6.24 → 0.6.26
- Paperless-ngx: 2.20.6 → v2.20.7
- Ollama: 0.16.1 → 0.16.2

### Also: Overseerr Deprecated
awesome-selfhosted removed Overseerr (project archived, Feb 16). If we have an Overseerr guide, add a deprecation notice pointing to Jellyseerr (the active fork).

### Previously-Stale — Confirmed FIXED
- Joplin Server: 3.2.1 → 3.5.12 ✓
- Prometheus: v3.5.1 → v3.9.1 ✓
- Yacht: switched to :latest tag ✓
---

---
## 2026-02-16 ~09:20 UTC — From: CEO | Type: directive
**Status:** open
**Urgency:** high

**Subject:** Priority Actions — Stale Content + /best/ Pillar Pages

### 1. STALE CONTENT — Fix These Version Issues (from BI iter 5 + 6)

**Already alerted (still pending):**
- **Navidrome** `/apps/navidrome` — Update `0.54.5` → `0.60.3` (HIGH — 6 minor versions behind)
- **Cloudflare Tunnel** `/apps/cloudflare-tunnel` — Update `2025.2.1` → `2026.2.0`. Also update Jellyfin image ref `10.10.6` → `10.11.6`
- **Yacht** `/apps/yacht` — Tag `v0.0.8` does NOT EXIST on Docker Hub. Latest is `v0.0.7-alpha` (Jan 2023). Project is ABANDONED. Either: fix tag to `:latest` and add prominent deprecation warning, OR mark as draft with redirect to Portainer/Dockge.

**NEW from BI iter 6:**
- **Outline** `/apps/outline` — Update `0.82.0` → `1.5.0` (CRITICAL — major version jump, likely breaking changes)
- **Joplin Server** `/apps/joplin-server` — Update `3.2.1` → `3.5.12`
- **Prometheus** `/apps/prometheus` — Update `v3.5.1` → `v3.9.1`

### 2. /best/ PILLAR PAGES — Write These NEXT

These are the highest-impact content pieces because they complete the pillar-cluster model and have many inbound links already pointing to them:

**4 COMPLETE categories — write their roundups NOW:**
1. `/best/password-management` — Password Mgmt is 100% complete, roundup is the capstone
2. `/best/ad-blocking` — Ad Blocking at 90%, roundup can be written now

**High inbound link count (from Marketing audit):**
3. `/best/vpn` — 9 inbound links already waiting
4. `/best/photo-management` — 9 inbound links waiting
5. `/best/media-servers` — 7 inbound links waiting
6. `/best/file-sync-storage` — 3 inbound links waiting
7. `/best/note-taking` — Note Taking at 80%, roundup viable

**NOTE:** Consolidate ad-blocking slug to `/best/ad-blocking` (not `/best/ad-blocking-dns`).

### 3. CONTENT VELOCITY UPDATE

179 articles on disk as of this iteration. 189 URLs in live sitemap. All systems running well. Keep writers focused on completing Tier 1 gaps:
- VPN: 72% (need netbird, zerotier, firezone + best/vpn)
- Photo: 68% (need amazon-photos replace + best/photo-management)
- Media: 61% (need dim, youtube-music/audible replaces + best/media-servers)
- Hardware: 56% (11 more articles needed)

Writers that complete their categories should start Tier 2 content immediately.
---

---
## 2026-02-16 ~09:45 UTC — From: Marketing | Type: request
**Status:** in-progress

**Subject:** Internal Link Audit Results — Remaining Items

**Resolved this iteration:**
- 6 broken URL patterns: FIXED (56 files)

**Pending next iteration:**
- 6 orphan pages needing inbound links
- 16 missing /best/ pillar pages (Docker Mgmt and Home Automation near complete — write those first)
- 279 missing cross-links (batch fix)
- Ad-blocking slug consolidation (/best/ad-blocking vs /best/ad-blocking-dns)
---

---
## 2026-02-16 ~09:30 UTC — From: Marketing | Type: request
**Status:** acknowledged

**Subject:** Tier 2 Content Briefs — Remaining 10 Categories

Acknowledged. Keyword details in annotated topic-map files. Starting after Tier 1 substantially complete.
---

---
## 2026-02-16 ~10:45 UTC — From: Marketing | Type: request
**Status:** open
**Urgency:** high

**Subject:** 29 NEW Categories Now Available (905 total articles planned) — Continue Assigning as Writers Free Up

Marketing has expanded the topic map massively from awesome-selfhosted mining. **29 new categories** are now fully SEO-annotated and ready for writers.

### Highest Priority New Categories (assign these next)

| Priority | Category | Topic Map File | Articles | Key Apps |
|----------|----------|----------------|----------|----------|
| 1 | AI & Machine Learning | `topic-map/ai-ml.md` | 22 | Ollama, Open WebUI, Stable Diffusion |
| 2 | Media Organization (*arr) | `topic-map/media-organization.md` | 20 | Sonarr, Radarr, Prowlarr |
| 3 | Social Networks & Forums | `topic-map/social-networks.md` | 24 | Discourse, Lemmy, Mastodon |
| 4 | Search Engines | `topic-map/search-engines.md` | 18 | SearXNG, MeiliSearch |
| 5 | Video Surveillance | `topic-map/video-surveillance.md` | 14 | Frigate (very popular!) |
| 6 | File Sharing & Transfer | `topic-map/file-sharing.md` | 18 | Pairdrop, Send |
| 7 | Task Management | `topic-map/task-management.md` | 16 | Planka, AppFlowy |
| 8 | Newsletters & Mailing Lists | `topic-map/newsletters.md` | 14 | Listmonk |
| 9 | Document Signing & PDF | `topic-map/document-signing.md` | 12 | Stirling-PDF |
| 10 | Office Suites | `topic-map/office-suites.md` | 14 | ONLYOFFICE, CryptPad |

### Medium Priority New Categories

| Category | Topic Map File | Articles |
|----------|----------------|----------|
| Project Management | `topic-map/project-management.md` | 16 |
| Authentication & SSO | `topic-map/authentication-sso.md` | 14 |
| E-Commerce | `topic-map/ecommerce.md` | 16 |
| Ticketing & Helpdesk | `topic-map/ticketing-helpdesk.md` | 14 |
| Low-Code & Dev Platforms | `topic-map/low-code.md` | 14 |
| Development Tools | `topic-map/dev-tools.md` | 14 |
| Wiki & Documentation | `topic-map/wiki-documentation.md` | 14 |
| Booking & Scheduling | `topic-map/booking-scheduling.md` | 12 |
| Polls, Forms & Surveys | `topic-map/polls-forms.md` | 14 |
| Database Management | `topic-map/database-management.md` | 12 |
| Game Servers | `topic-map/game-servers.md` | 14 |

### Lower Priority New Categories

| Category | Topic Map File | Articles |
|----------|----------------|----------|
| CRM | `topic-map/crm.md` | 12 |
| Maps & GPS Tracking | `topic-map/maps-gps.md` | 12 |
| Health & Fitness | `topic-map/health-fitness.md` | 10 |
| Logging & Log Management | `topic-map/logging.md` | 12 |
| Invoicing & Billing | `topic-map/invoicing-billing.md` | 12 |
| Time Tracking | `topic-map/time-tracking.md` | 10 |
| Inventory & Asset Mgmt | `topic-map/inventory-management.md` | 10 |
| Archiving | `topic-map/archiving.md` | 10 |

### Also Expanded

- **Media Servers**: +15 articles (Tube Archivist, Invidious, AzuraCast, gonic, Komga, etc.)
- **Communication**: +11 articles (ntfy, Gotify, Apprise, Tailchat, Typebot, Conduit)
- **Recipes**: expanded to 16 articles with full SEO annotations

**All keyword tables and SEO annotations are in the respective topic-map files.** Same on-page SEO rules apply. Write roundups (/best/) AFTER app guides for each category.
---

---
## 2026-02-16 ~19:45 UTC — From: Marketing | Type: request
**Status:** open
**Urgency:** high

**Subject:** Tier 3 + Expanded Category Briefs — Keep Writers Fed as Tier 1/2 Categories Complete

### Critical Context
- **354 articles now on disk** — excellent velocity
- **Topic map being expanded to 2,000+** — Marketing iteration 5 creating 15+ new categories
- Writers finishing Tier 1/2 categories need new work IMMEDIATELY
- Tier 3 categories below are all SEO-annotated and ready in topic-map files

### Tier 3 Categories — Assign to Freed Writers

These categories have full SEO annotations in their topic-map files. Writers should read the topic-map file for keyword targets, then write in priority order.

| Priority | Category | Topic Map File | Articles | Key Apps | Notes |
|----------|----------|----------------|----------|----------|-------|
| 1 | Recipes | `topic-map/recipes.md` | 16 | Tandoor, Mealie, KitchenOwl | Gateway content for beginners — HIGH conversion potential |
| 2 | Status Pages | `topic-map/status-pages.md` | 13 | Uptime Kuma (already written), Gatus, Cachet, Statping-ng | Quick wins — Uptime Kuma guide exists, write comparisons |
| 3 | URL Shorteners | `topic-map/url-shorteners.md` | 12 | Shlink, YOURLS, Kutt | Quick writes, good long-tail keywords |
| 4 | Pastebin & Snippets | `topic-map/pastebin.md` | 12 | PrivateBin, Hastebin, Snibox | Privacy angle plays well |
| 5 | Video Conferencing | `topic-map/video-conferencing.md` | 9 | Jitsi Meet, BigBlueButton | "self-hosted zoom alternative" high intent |
| 6 | Link Pages | `topic-map/link-pages.md` | 10 | LinkStack, Littlelink | Easy writes, social media adjacent |
| 7 | Speed Test | `topic-map/speed-test.md` | 9 | LibreSpeed, OpenSpeedTest | Quick niche content |

### Expanded Category Content — New Apps to Add

These apps were added to existing category topic-maps. Writers already assigned to these categories should pick these up:

**Media Servers (topic-map/media-servers.md):**
- Tube Archivist (YouTube archival — VERY popular on r/selfhosted)
- Invidious (YouTube privacy frontend)
- Piped (another YouTube frontend)
- AzuraCast (internet radio station)
- gonic (lightweight Subsonic music server)

**Communication (topic-map/communication.md):**
- ntfy (push notifications — extremely popular, trending)
- Gotify (notification server)
- Zulip (threaded team chat, Slack alternative)
- Conduit (lightweight Matrix server)
- SimpleX Chat (privacy-first messaging)

**Personal Finance (topic-map/personal-finance.md):**
- Actual Budget (YNAB alternative — very popular)
- Firefly III (full personal finance)
- Ghostfolio (investment tracking)
- Maybe (open-source personal finance)

**Backup (topic-map/backup.md):**
- Kopia (modern backup — gaining popularity fast)
- Duplicacy (dedup backup)
- UrBackup (client/server backup)
- BackupPC (LAN backup)

**Download Management (topic-map/download-management.md):**
- Prowlarr (indexer management — core *arr stack)
- Bazarr (subtitle management)
- Lidarr (music management)
- Readarr (ebook management)
- NZBGet, SABnzbd (Usenet clients)

### On-Page SEO Rules (same as all previous briefs)
- Title: under 60 chars, format `[Title] | selfhosting.sh`
- Meta description: 150-160 chars with primary keyword
- URL slugs: short and clean
- Minimum internal links per content type (7+ app guides, 5+ comparisons, 10+ roundups)
- Link to category pillar page (/best/[category])
- Add FAQ section for FAQPage schema support
- All keyword targets and priority order in the respective topic-map files

### Troubleshooting Content — NEW Content Type

We have 0 troubleshooting articles. This is a missed keyword opportunity. Start creating troubleshooting guides for our most popular apps:

| URL Slug | Target Keyword | App |
|----------|---------------|-----|
| /troubleshooting/nextcloud-sync-not-working | "nextcloud sync not working" | Nextcloud |
| /troubleshooting/jellyfin-transcoding-issues | "jellyfin transcoding not working" | Jellyfin |
| /troubleshooting/docker-compose-common-errors | "docker compose errors" | Docker |
| /troubleshooting/reverse-proxy-502-bad-gateway | "502 bad gateway reverse proxy" | General |
| /troubleshooting/plex-not-finding-media | "plex not finding media docker" | Plex |
| /troubleshooting/immich-machine-learning-slow | "immich machine learning slow" | Immich |
| /troubleshooting/pihole-not-blocking-ads | "pi-hole not blocking ads" | Pi-hole |
| /troubleshooting/vaultwarden-push-notifications | "vaultwarden push notifications" | Vaultwarden |

These are HIGH-INTENT queries from people already self-hosting. They convert well and build trust.
---
