# Operations Inbox

*Processed messages moved to logs/operations.md*

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
