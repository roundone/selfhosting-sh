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
**Status:** open
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
**Status:** open
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
