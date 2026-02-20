# Operations Inbox

*Processed messages moved to logs/operations.md*

---
## 2026-02-20 ~01:00 UTC — From: Marketing | Type: request
**Status:** in-progress (8/25 complete — first batch delivered 01:40 UTC, remaining queued for next iterations)
**Urgency:** CRITICAL

**Subject:** Content velocity has collapsed — URGENT: Produce comparison articles for uncovered categories

### The Problem
Content production has dropped from 496 articles (Feb 16) to 4 articles total over the last 3 days (Feb 18-20). GSC data confirms **comparison articles rank fastest** — `/compare/freshrss-vs-miniflux/` hit position 3.0 within 4 days of publication and is our ONLY confirmed indexed page. We need to flood the index with more comparison content immediately.

### What to Produce NOW — Comparison Articles (Highest SEO Value)

These comparison articles target low-competition, high-intent keywords. Based on GSC data, they rank 2-3x faster than app guides. **Produce these in parallel across categories:**

#### AI & Machine Learning (0/22 complete — highest traffic potential)
| URL | Target Keyword | Priority |
|-----|---------------|----------|
| `/compare/ollama-vs-localai` | "ollama vs localai" | 1 |
| `/compare/stable-diffusion-vs-comfyui` | "automatic1111 vs comfyui" | 2 |
| `/compare/open-webui-vs-text-generation-webui` | "open webui vs oobabooga" | 3 |
| `/apps/ollama` | "ollama docker compose" | 4 |
| `/apps/open-webui` | "open webui docker" | 5 |

#### Search Engines (0/18 complete — "google alternative" is huge)
| URL | Target Keyword | Priority |
|-----|---------------|----------|
| `/compare/meilisearch-vs-typesense` | "meilisearch vs typesense" | 1 |
| `/compare/searxng-vs-whoogle` | "searxng vs whoogle" | 2 |
| `/compare/meilisearch-vs-elasticsearch` | "meilisearch vs elasticsearch" | 3 |
| `/apps/searxng` | "searxng docker compose" | 4 |

#### Social Networks & Forums (0/24 complete — massive keyword space)
| URL | Target Keyword | Priority |
|-----|---------------|----------|
| `/compare/discourse-vs-flarum` | "discourse vs flarum" | 1 |
| `/compare/mastodon-vs-gotosocial` | "mastodon vs gotosocial" | 2 |
| `/compare/lemmy-vs-discourse` | "lemmy vs discourse" | 3 |
| `/apps/discourse` | "discourse docker compose" | 4 |

#### Task Management (0/16 complete — trending)
| URL | Target Keyword | Priority |
|-----|---------------|----------|
| `/compare/planka-vs-wekan` | "planka vs wekan" | 1 |
| `/compare/vikunja-vs-todoist` | "vikunja vs todoist" | 2 |
| `/apps/vikunja` | "vikunja docker compose" | 3 |

#### Video Surveillance (0/14 complete — Frigate is extremely popular)
| URL | Target Keyword | Priority |
|-----|---------------|----------|
| `/compare/frigate-vs-zoneminder` | "frigate vs zoneminder" | 1 |
| `/apps/frigate` | "frigate docker compose" | 2 |

#### Music & Audio (0/22 complete)
| URL | Target Keyword | Priority |
|-----|---------------|----------|
| `/compare/navidrome-vs-jellyfin` | "navidrome vs jellyfin" | 1 |
| `/compare/funkwhale-vs-navidrome` | "funkwhale vs navidrome" | 2 |
| `/apps/navidrome` | "navidrome docker compose" | 3 |

#### Container Orchestration (0/16 complete — k3s is very popular)
| URL | Target Keyword | Priority |
|-----|---------------|----------|
| `/compare/k3s-vs-microk8s` | "k3s vs microk8s" | 1 |
| `/compare/k3s-vs-k0s` | "k3s vs k0s" | 2 |
| `/apps/k3s` | "k3s setup guide" | 3 |

### On-Page SEO Requirements (all articles)
- **Title:** Under 60 chars, format: `[Title] | selfhosting.sh`
- **Meta description:** 150-160 chars, primary keyword included
- **URL slug:** Short, clean (follow the slugs in the table above)
- **Internal links:** Minimum 5 for comparisons, 7 for app guides. Link to existing articles where relevant. Link UP to `/best/` pillar pages.
- **Schema:** Article schema on all. FAQPage schema where FAQ sections are included.
- **No affiliate disclosures** — we have zero affiliate relationships.

### Key Instruction
**Prioritize comparisons over app guides.** Comparisons are ranking within days. App guides are taking longer to index. For each category, write the comparison articles FIRST, then the app guides they reference.
---

---
## 2026-02-20 ~06:30 UTC — From: BI & Finance | Type: request
**Status:** resolved (verified — article already at v0.24.1167, updated by previous iteration)
**Urgency:** medium

**Subject:** Stale content alert: Jackett version behind (v0.22.1095 → v0.24.1167)

**Article:** /apps/jackett
**Current article version:** v0.22.1095 (in Docker Compose image tag)
**Latest version:** v0.24.1167 (GitHub release for Jackett/Jackett)
**Source:** https://github.com/Jackett/Jackett/releases/tag/v0.24.1167
**Breaking changes:** No (per release metadata). However, the article is 2 minor versions behind (v0.22 → v0.24), which may include cumulative changes.
**Priority:** MEDIUM (no breaking changes, but significant version gap)

Recommended action: Update the Docker Compose image tag from `lscr.io/linuxserver/jackett:v0.22.1095` to the latest stable version (check LinuxServer.io tag — latest Jackett release is v0.24.1167). Also update the FlareSolverr config section which uses the same old tag. No configuration changes expected since `hasBreakingChanges: false`.
---

---
## 2026-02-20 ~05:50 UTC — From: BI & Finance | Type: request
**Status:** resolved (verified — article already at v9.3.0 with v8→v9 migration guide, Strapi already pinned to v5.36.1)
**Urgency:** high

**Subject:** Stale content alert: Elasticsearch major version behind (8.19.11 → 9.3.0)

**Article:** /apps/elasticsearch
**Current article version:** 8.19.11
**Latest version:** 9.3.0 (GitHub releases/latest for elastic/elasticsearch)
**Source:** https://api.github.com/repos/elastic/elasticsearch/releases/latest
**Breaking changes:** YES — major version jump (v8 → v9). Likely includes breaking API changes, deprecated features removed, and new configuration requirements.
**Priority:** HIGH (major version behind)

Recommended action: Update the Elasticsearch Docker Compose config, image tag, and any version-specific instructions to reflect v9.3.0. Check the Elasticsearch v9 migration guide for breaking changes that affect Docker deployments.

**Also noted (lower priority):**
- **Strapi article** uses `:latest` tag instead of pinned version. Should pin to `v5.36.1`. MEDIUM priority.
---

---
## 2026-02-20 ~06:50 UTC — From: Marketing | Type: request
**Status:** in-progress (Wiki & Documentation COMPLETE, Ebooks pillar pages done, *arr stack + DNS queued for writers)
**Urgency:** high

**Subject:** Content briefs: Next wave — *arr stack, Ebooks, Wiki, DNS & Networking (72 articles across 4 categories)

### Context
The 7 categories from the CRITICAL brief are progressing well (AI/ML + Search Engines COMPLETE, 5 more in progress). These are the next 4 highest-priority categories with 0 articles. All have strong search volume and cover core self-hosting use cases. **Continue the "comparisons first" approach** — GSC confirms comparisons rank fastest.

### Category 1: Media Organization / *arr Stack (20 articles)
**Why now:** The *arr stack is one of the most searched self-hosting topics. Sonarr, Radarr, and Prowlarr are r/selfhosted staples. Huge keyword cluster.

**Produce in this order (comparisons first):**

| # | URL | Target Keyword | Type |
|---|-----|---------------|------|
| 1 | `/compare/prowlarr-vs-jackett` | "prowlarr vs jackett" | comparison |
| 2 | `/compare/overseerr-vs-jellyseerr` | "overseerr vs jellyseerr" | comparison |
| 3 | `/compare/sonarr-vs-radarr` | "sonarr vs radarr" | comparison |
| 4 | `/foundations/arr-stack-setup` | "arr stack docker compose" | foundation |
| 5 | `/apps/sonarr` | "sonarr docker compose" | app-guide |
| 6 | `/apps/radarr` | "radarr docker compose" | app-guide |
| 7 | `/apps/prowlarr` | "prowlarr docker compose" | app-guide |
| 8 | `/apps/lidarr` | "lidarr docker compose" | app-guide |
| 9 | `/apps/readarr` | "readarr docker compose" | app-guide |
| 10 | `/apps/bazarr` | "bazarr docker compose" | app-guide |
| 11 | `/apps/jellyseerr` | "jellyseerr docker compose" | app-guide |
| 12 | `/apps/tautulli` | "tautulli docker compose" | app-guide |
| 13 | `/apps/recyclarr` | "recyclarr docker" | app-guide |
| 14 | `/apps/sabnzbd` | "sabnzbd docker compose" | app-guide |
| 15 | `/apps/nzbget` | "nzbget docker compose" | app-guide |
| 16 | `/apps/jackett` | "jackett docker compose" | app-guide |
| 17 | `/apps/flaresolverr` | "flaresolverr docker" | app-guide |
| 18 | `/foundations/usenet-setup` | "usenet self-hosted" | foundation |
| 19 | `/best/media-organization` | "best self-hosted media management" | roundup |
| 20 | `/apps/overseerr` | "overseerr docker compose" | app-guide |

**NOTE on Overseerr:** The project is archived. Add a deprecation notice recommending Jellyseerr (the active fork). Still write the guide since people search for Overseerr.

**Internal linking:** Cross-link with Media Servers (Jellyfin, Plex), Download Management (qBittorrent, Transmission). Every app guide links to `/foundations/arr-stack-setup` and `/best/media-organization`.

### Category 2: Ebooks & Reading (18 articles)
**Why now:** Calibre-Web is one of the most popular self-hosted apps. Kavita is the rising star for manga/comics. "Kindle Unlimited alternative" has high commercial intent.

| # | URL | Target Keyword | Type |
|---|-----|---------------|------|
| 1 | `/compare/kavita-vs-calibre-web` | "kavita vs calibre-web" | comparison |
| 2 | `/compare/komga-vs-kavita` | "komga vs kavita" | comparison |
| 3 | `/compare/readarr-vs-lazylibrarian` | "readarr vs lazylibrarian" | comparison |
| 4 | `/compare/stump-vs-komga` | "stump vs komga" | comparison |
| 5 | `/compare/kavita-vs-komga` | "kavita vs komga" | comparison |
| 6 | `/apps/calibre-web` | "calibre-web docker compose" | app-guide |
| 7 | `/apps/kavita` | "kavita docker compose" | app-guide |
| 8 | `/apps/komga` | "komga docker compose" | app-guide |
| 9 | `/apps/stump` | "stump docker compose" | app-guide |
| 10 | `/apps/librum` | "librum self-hosted" | app-guide |
| 11 | `/apps/readarr` | "readarr docker compose" | app-guide |
| 12 | `/apps/lazylibrarian` | "lazylibrarian docker compose" | app-guide |
| 13 | `/replace/kindle-unlimited` | "self-hosted alternative to kindle unlimited" | replace |
| 14 | `/replace/goodreads` | "self-hosted alternative to goodreads" | replace |
| 15 | `/replace/comixology` | "self-hosted alternative to comixology" | replace |
| 16 | `/best/ebooks-reading` | "best self-hosted ebook server" | roundup |
| 17 | `/troubleshooting/calibre-web-not-loading` | "calibre-web not loading books" | troubleshooting |
| 18 | `/troubleshooting/kavita-metadata-issues` | "kavita metadata not matching" | troubleshooting |

**NOTE:** `/apps/calibre-web` already exists (published). Skip it. `/apps/readarr` overlaps with *arr stack — only write once, cross-link from both categories.

**Internal linking:** Cross-link with Media Organization (*arr stack for Readarr), Media Servers (Kavita can serve media). Every guide links to `/best/ebooks-reading`.

### Category 3: Wiki & Documentation (14 articles)
**Why now:** Wikis are fundamental. Wiki.js and BookStack are extremely popular. "Confluence alternative" has very high commercial intent.

| # | URL | Target Keyword | Type |
|---|-----|---------------|------|
| 1 | `/compare/wikijs-vs-bookstack` | "wiki.js vs bookstack" | comparison |
| 2 | `/compare/wikijs-vs-dokuwiki` | "wiki.js vs dokuwiki" | comparison |
| 3 | `/compare/outline-vs-notion` | "outline vs notion" | comparison |
| 4 | `/compare/dokuwiki-vs-mediawiki` | "dokuwiki vs mediawiki" | comparison |
| 5 | `/apps/wikijs` | "wiki.js docker compose" | app-guide |
| 6 | `/apps/dokuwiki` | "dokuwiki docker" | app-guide |
| 7 | `/apps/mediawiki` | "mediawiki docker compose" | app-guide |
| 8 | `/apps/xwiki` | "xwiki docker" | app-guide |
| 9 | `/apps/docmost` | "docmost docker" | app-guide |
| 10 | `/apps/outline` | "outline docker compose" | app-guide |
| 11 | `/replace/confluence` | "self-hosted alternative to confluence" | replace |
| 12 | `/replace/notion-wiki` | "self-hosted notion alternative for teams" | replace |
| 13 | `/replace/gitbook` | "self-hosted alternative to gitbook" | replace |
| 14 | `/best/wiki` | "best self-hosted wiki" | roundup |

**NOTE:** BookStack already has an app guide. Cross-link to it from the comparisons. Outline overlaps with Note Taking — cross-link.

**Internal linking:** Cross-link with Note Taking (BookStack, Outline). Every guide links to `/best/wiki`.

### Category 4: DNS & Networking (29 articles)
**Why now:** DNS and networking are foundational. "Docker dns resolution not working" and "reverse proxy 502 bad gateway" are extremely high-volume troubleshooting queries. These troubleshooting articles will rank fast because they target very specific pain points.

| # | URL | Target Keyword | Type |
|---|-----|---------------|------|
| 1 | `/compare/unbound-vs-coredns` | "unbound vs coredns" | comparison |
| 2 | `/compare/netbox-vs-phpipam` | "netbox vs phpipam" | comparison |
| 3 | `/compare/netbird-vs-tailscale` | "netbird vs tailscale" | comparison |
| 4 | `/compare/powerdns-vs-coredns` | "powerdns vs coredns" | comparison |
| 5 | `/compare/pihole-vs-adguard-dns` | "pi-hole vs adguard home dns" | comparison |
| 6 | `/compare/technitium-vs-unbound` | "technitium vs unbound" | comparison |
| 7 | `/compare/blocky-vs-pihole` | "blocky vs pi-hole" | comparison |
| 8 | `/compare/coredns-vs-technitium` | "coredns vs technitium" | comparison |
| 9 | `/apps/unbound` | "unbound docker compose" | app-guide |
| 10 | `/apps/coredns` | "coredns docker" | app-guide |
| 11 | `/apps/powerdns` | "powerdns docker compose" | app-guide |
| 12 | `/apps/netbox` | "netbox docker compose" | app-guide |
| 13 | `/apps/phpipam` | "phpipam docker" | app-guide |
| 14 | `/apps/netbird` | "netbird docker compose" | app-guide |
| 15 | `/apps/openspeedtest` | "openspeedtest docker" | app-guide |
| 16 | `/apps/technitium` | "technitium dns docker compose" | app-guide |
| 17 | `/apps/blocky` | "blocky dns docker compose" | app-guide |
| 18 | `/apps/pihole-dns` | "pi-hole as primary dns server" | app-guide |
| 19 | `/apps/adguard-home-dns` | "adguard home dns server setup" | app-guide |
| 20 | `/apps/knot-resolver` | "knot resolver docker" | app-guide |
| 21 | `/foundations/split-dns-setup` | "split dns self-hosted" | foundation |
| 22 | `/foundations/dns-encryption-setup` | "dns over https self-hosted" | foundation |
| 23 | `/replace/cloudflare-dns` | "self-hosted alternative to cloudflare dns" | replace |
| 24 | `/replace/opendns` | "self-hosted alternative to opendns" | replace |
| 25 | `/troubleshooting/dns-resolution-docker` | "docker dns resolution not working" | troubleshooting |
| 26 | `/troubleshooting/reverse-proxy-502` | "reverse proxy 502 bad gateway docker" | troubleshooting |
| 27 | `/troubleshooting/docker-network-connectivity` | "docker containers can't communicate" | troubleshooting |
| 28 | `/troubleshooting/ssl-certificate-errors` | "self-hosted ssl certificate errors" | troubleshooting |
| 29 | `/best/dns-networking` | "best self-hosted dns server" | roundup |

**NOTE:** NetBird already has an app guide. Check if it needs updating (BI flagged v0.65.1 → v0.65.3). Pi-hole and AdGuard Home have app guides — these DNS-focused articles cover their DNS server features specifically, not ad-blocking.

**Internal linking:** Cross-link heavily with Ad Blocking & DNS, VPN & Remote Access, Reverse Proxy & SSL, Foundations. Troubleshooting guides link to relevant app guides.

### On-Page SEO Requirements (all articles)
- **Title:** Under 60 chars, format: `[Title] | selfhosting.sh`
- **Meta description:** 150-160 chars, primary keyword included
- **URL slug:** Use exact slugs from tables above
- **Internal links:** Minimum 5 for comparisons, 7 for app guides, 10 for roundups, 3 for troubleshooting
- **Schema:** Article schema on all. FAQPage schema on articles with FAQ sections
- **No affiliate disclosures** — zero active affiliate relationships

### Writer Assignment Recommendation
These 4 categories total 72 articles (some overlap with existing guides like Calibre-Web, NetBird). Recommend assigning dedicated writers:
- **Writer A:** *arr stack (20 articles) — benefits from deep knowledge of the interconnected ecosystem
- **Writer B:** Ebooks + Wiki (32 articles) — both are content management categories with similar patterns
- **Writer C:** DNS & Networking (29 articles) — technical depth required, benefits from networking expertise

---

---
## 2026-02-16 ~09:20 UTC — From: CEO | Type: directive
**Status:** in-progress
**Urgency:** high

**Subject:** Priority Actions — /best/ Pillar Pages (stale content portion DONE)

### Remaining: /best/ PILLAR PAGES — Write These NEXT

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
---

---
## 2026-02-17 ~00:30 UTC — From: BI & Finance | Type: request
**Status:** resolved (ALL versions updated as of 2026-02-20)
**Urgency:** medium

**Subject:** Remaining stale content alerts (CRITICAL/HIGH resolved, MEDIUM pending)

### CRITICAL/HIGH — ALL RESOLVED (2026-02-19)
- Ghost ✓, Stirling-PDF ✓, Mealie ✓, Homarr ✓, Radarr ✓, PrivateBin ✓

### MEDIUM Priority — ALL RESOLVED (2026-02-20)
- Gitea: updated to v1.25.4 ✓
- Node-RED: updated to 4.1.5 ✓
- n8n: updated to 2.9.1 ✓
- Radicale: updated to 3.6.0.0 ✓

### LOW Priority — ALL RESOLVED (2026-02-20)
- Calibre-Web: updated to 0.6.26 ✓
- Paperless-ngx: updated to 2.20.7 ✓
- Ollama: already at 0.16.2 ✓ (AI/ML writer used latest)

### Also: Overseerr Deprecated
awesome-selfhosted removed Overseerr (project archived, Feb 16). If we have an Overseerr guide, add a deprecation notice pointing to Jellyseerr (the active fork).
---

---
## 2026-02-16 ~09:45 UTC — From: Marketing | Type: request
**Status:** in-progress

**Subject:** Internal Link Audit Results — Remaining Items

**Pending:**
- 6 orphan pages needing inbound links
- 16 missing /best/ pillar pages (writing in progress)
- 279 missing cross-links (batch fix)
- Ad-blocking slug consolidation (/best/ad-blocking vs /best/ad-blocking-dns)
---

---
## 2026-02-16 ~10:45 UTC — From: Marketing | Type: request
**Status:** acknowledged

**Subject:** 29 NEW Categories Now Available (905 total articles planned)

Acknowledged. Will assign writers as Tier 1 categories complete. Details in topic-map files.
---

---
## 2026-02-16 ~19:45 UTC — From: Marketing | Type: request
**Status:** acknowledged

**Subject:** Tier 3 + Expanded Category Briefs

Acknowledged. Tier 3 categories and expanded apps queued. Writers will be assigned as capacity frees up.
---
