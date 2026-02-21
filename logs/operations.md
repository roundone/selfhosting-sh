# Operations Activity Log

## 2026-02-21 ~07:30 UTC — Operations Head: Watchtower deprecation audit — 24 articles updated, writer readiness verified

### Trigger
- inbox-message (Marketing: Watchtower deprecated audit request)

### Work Completed

#### Watchtower Deprecation Audit (24 articles)
Watchtower (`containrrr/watchtower`) is archived/deprecated. Audited all 26 files referencing Watchtower, updated 24 (excluded `/replace/1password.md` which refers to 1Password's "Watchtower" feature, not the Docker tool).

**Changes by category:**
- **App guide** (`apps/watchtower.md`): Added prominent deprecation banner, rewrote verdict to recommend DIUN and WUCT
- **Roundup** (`best/docker-management.md`): Updated Watchtower section heading to "(Deprecated)", changed Quick Picks table to recommend WUCT
- **Foundation guides** (4 files): Added deprecation blockquotes on Watchtower sections, updated FAQ answers, changed recommendation tables
  - `docker-automatic-updates.md`, `docker-updating.md`, `docker-vs-podman.md`, `docker-security.md`
- **Hardware guides** (2 files): Replaced Watchtower example with DIUN in `raspberry-pi-docker.md`, updated mention in `self-hosting-vs-cloud-costs.md`
- **Comparison articles** (10 files): Added deprecation banners to 5 `watchtower-vs-*` articles, updated casual mentions in 5 `diun-vs-*` and other comparison articles
- **App guides** (4 files): Updated `dockge.md`, `portainer.md`, `diun.md`, `podman.md` with "(deprecated)" annotations
- **Replace guide** (`docker-desktop.md`): Updated Watchtower mentions

All updated files set to `dateUpdated: 2026-02-21`.

#### Writer Readiness Verification
- All 8 wake-on.conf files confirmed at `fallback: 1h` (CEO set at 05:15 UTC)
- All 8 CLAUDE.md files previously updated with new category assignments
- Writer error counts in coordinator-state.json: 4 writers still show non-zero counts (foundations:2, password-adblock:3, photo-media:1, proxy-docker:1). Attempted manual reset but coordinator process overwrites the file. NOT a blocker — `nextAllowedRun` dates are all in the past, so backoff is expired. Counts will reset to 0 after first successful run on Feb 22.
- Writers will auto-start when 48h window elapses (~Feb 22 10:00 UTC)

### Inbox Processed
- Marketing: Watchtower deprecated audit → RESOLVED (24 articles updated)

### Freshness Updates
- None (Watchtower updates are deprecation notices, not version bumps)

### Learnings Recorded
- None (Watchtower deprecation already logged in `learnings/apps.md` by Marketing)

### Issues
- Coordinator-state.json cannot be manually edited to reset writer error counts — coordinator process overwrites the file on each cycle. Not a blocker since backoff timers have expired.

### Topic Map Progress
- No new articles written (writers paused per founder directive)
- Total articles on disk: 780
- Target: 1,500+ by end of Month 1 (~720 remaining, writers resume Feb 22)

### Next Iteration
- **Feb 22 (CRITICAL):** Monitor first writer outputs after auto-resume (~10:00 UTC). Verify writers correctly use updated CLAUDE.md assignments (new categories, 155-char description minimum, niche comparisons first, tables required).
- Watch for writer-complete events to assess velocity and identify any issues.
- After first writer cycle: verify error counts reset to 0 in coordinator state.

---

## 2026-02-21 ~07:15 UTC — Operations Head: Orphan comparison article fix — 104 new inbound links across 44 app guides

### Trigger
- pending-trigger (queued inbox modification from BI Jackett alert — already resolved by prior iteration)

### Work Completed
- **Massive orphan comparison fix.** Added ~104 new inbound links across 44 app guides, de-orphaning ~70+ comparison articles that previously had zero inbound links. This directly addresses Marketing's internal link audit finding of 87 orphan comparison articles.

### Files Modified (44 app guides)
**Photo & Video (15 new links):** immich, photoprism, librephotos, lychee
**Note Taking (19 new links):** bookstack, joplin-server, outline, trilium, siyuan, docmost, hedgedoc, etherpad
**Docker Management (8 new links):** portainer, dockge
**Reverse Proxy (24 new links):** haproxy, nginx, caddy, nginx-proxy-manager, traefik, zoraxy
**VPN (2 new links):** wireguard, netbird
**Media Servers (8 new links):** navidrome, emby, jellyfin
**Backup (4 new links):** restic, duplicati, borgmatic
**File Sync (3 new links):** nextcloud, seafile
**Home Automation (5 new links):** home-assistant, openhab
**Password Mgmt (2 new links):** passbolt
**Automation (3 new links):** n8n
**Bookmarks (3 new links):** linkwarden, wallabag
**Download/Media (3 new links):** qbittorrent, plex
**CMS (4 new links):** ghost, wordpress, directus, strapi
**Analytics (1 new link):** umami
**Remote Desktop (2 new links):** guacamole, rustdesk

### Inbox Processed
- No new open items. All inbox messages remain resolved from prior iterations.

### Freshness Updates
- None needed

### Learnings Recorded
- None

### Issues
- None

### Topic Map Progress
- No new articles written (writers paused per founder directive)
- Total articles on disk: 780
- Orphan comparison articles: reduced from ~149 to ~79 (estimated)
- Target: 1,500+ by end of Month 1 (~720 remaining, writers resume Feb 22)

### Next Iteration
- **Feb 22 (CRITICAL):** Monitor first writer outputs after auto-resume (~10:00 UTC). Verify writers correctly use updated CLAUDE.md assignments.
- Remaining orphan comparisons: ~79 still need inbound links (many are for apps without existing guides — will be resolved as writers produce new app guides on Feb 22+).

---

## 2026-02-21 ~07:00 UTC — Operations Head: Jackett version update, Feb 22 readiness verified

### Trigger
- inbox-message (BI & Finance: Jackett v0.24.1174 stale content alert)

### Work Completed
- **Jackett version updated to v0.24.1174.** Updated Docker image tag from `lscr.io/linuxserver/jackett:0.24.1167` to `lscr.io/linuxserver/jackett:0.24.1174` on both lines (45 and 126) in `/apps/jackett`. `dateUpdated` set to 2026-02-21. No breaking changes, minor patch only. Comparison articles (`/compare/prowlarr-vs-jackett`, `/compare/jackett-vs-prowlarr`) confirmed no version references — no update needed.
- **Writer readiness verified.** All 8 wake-on.conf files confirmed at `fallback: 1h` (CEO updated at 05:15 UTC). All 8 CLAUDE.md files previously updated with new category assignments. Writers will auto-start when 48h window elapses (~Feb 22 10:00 UTC).
- **Coordinator health verified.** No errors. Release checks running. Social poster active. Memory healthy.
- **Article count corrected.** state.md updated from 778 to 780 (actual count on disk: 208 apps + 273 compare + 106 foundations + 100 hardware + 58 replace + 25 best + 10 troubleshooting).

### Inbox Processed
- BI & Finance: Jackett v0.24.1174 stale alert → RESOLVED (version updated)
- CEO directive (writer resume protocol) → already resolved by CEO at 05:15 UTC, no action needed

### Freshness Updates
- Jackett: v0.24.1167 → v0.24.1174 (both Docker Compose sections)

### Learnings Recorded
- None (Jackett learning already recorded by BI)

### Issues
- None

### Topic Map Progress
- No new articles written (writers paused per founder directive)
- Total articles on disk: 780
- Target: 1,500+ by end of Month 1 (~720 remaining, writers resume Feb 22)

### Next Iteration
- **Feb 22 (CRITICAL):** Monitor first writer outputs after auto-resume (~10:00 UTC). All 8 wake-on.conf at 1h. Verify writers correctly use updated CLAUDE.md assignments (new categories, 155-char description minimum, niche comparisons first, tables required).
- Watch for writer-complete events to assess velocity and identify any issues.

---

## 2026-02-21 ~05:17 UTC — Operations Head: DNS & Networking topic-map sync fix, pre-Feb 22 final readiness check

### Trigger
- inbox-message (CEO updated wake-on.conf directive status to resolved)

### Work Completed
- **DNS & Networking topic-map critically out of sync — FIXED.** Topic-map showed 0/29 complete, but 13 articles already existed on disk: 3 app guides (technitium, blocky, netbird), 8 comparisons (all 8 planned + 4 expanded), 1 replace guide (cloudflare-dns), 1 troubleshooting (reverse-proxy-502-bad-gateway). Updated all entries to COMPLETE. Header corrected to 13/29. This prevents the vpn-filesync-writer from duplicating 13 articles on Feb 22.
- **Topic-map overview updated** — DNS & Networking line corrected from 0/29 to 13/29.
- **File Sharing topic-map verified** — confirmed `replace/dropbox.md` is a file-sync category article about Dropbox cloud storage, NOT the same as the file-sharing `replace/dropbox-transfer` entry. No fix needed.
- **CEO wake-on.conf reset acknowledged** — CEO proactively handled all 8 wake-on.conf updates at 05:15 UTC. No action needed from Operations.
- **System health verified** — coordinator healthy, 6.8GB free memory, social poster active (2,588 items in queue), no errors.

### Inbox Processed
- CEO directive (writer resume protocol) — already resolved by CEO at 05:15 UTC. No action needed.
- All other inbox items remain resolved from prior iterations.

### Freshness Updates
- None needed

### Learnings Recorded
- None

### Issues
- None

### Topic Map Progress
- DNS & Networking: corrected from 0/29 → 13/29 (13 articles already on disk but untracked)
- No new articles written (writers paused per founder directive)
- Total articles on disk: ~780
- Target: 1,500+ by end of Month 1 (~720 remaining, writers resume Feb 22)

### Next Iteration
- **Feb 22 (CRITICAL):** Monitor first writer outputs after auto-resume. All 8 wake-on.conf already at 1h. Writers should auto-start as coordinator detects fallback interval elapsed.
- Verify vpn-filesync-writer correctly reads DNS & Networking topic-map (now showing 13/29, not 0/29) and only produces remaining 16 articles.

---

## 2026-02-21 ~04:35 UTC — Operations Head: CEO directive acknowledged, pre-resume readiness confirmed

### Trigger
- inbox-message (CEO directive: writer resume protocol for Feb 22)

### Work Completed
- **CEO directive received and acknowledged.** Reset all 8 writer wake-on.conf files from `fallback: 48h` to `fallback: 1h` — scheduled for Feb 22 (first iteration). NOT executing today (Feb 21) per explicit instruction.
- **All 8 wake-on.conf files verified** — confirmed still at `fallback: 48h` (correctly paused).
- **Coordinator health verified** — 6693MB free memory, 2/4 agents running, social poster active (2568 items in queue), no errors.
- **Article count verified** — 780 articles on disk (208 apps + 273 compare + 106 foundations + 100 hardware + 58 replace + 25 best + 10 troubleshooting).
- **`:latest` tag audit** — Confirmed remaining `:latest` occurrences are either justified exceptions (apps with no semver tags: Stable Diffusion WebUI, Huginn, Librum, SearXNG) or generic placeholder examples (`your-app:latest`). No real app configs with `:latest` remain.

### Inbox Processed
- CEO directive (writer resume protocol for Feb 22) → acknowledged, queued for execution on Feb 22. Status remains open until executed.

### Freshness Updates
- None needed

### Learnings Recorded
- None

### Issues
- None

### Topic Map Progress
- No new articles (writers paused per founder directive)
- Total articles on disk: 780
- Target: 1,500+ by end of Month 1 (~720 remaining, writers resume Feb 22)

### Next Iteration
- **Feb 22 (CRITICAL):** Execute writer resume protocol:
  1. Change all 8 writer wake-on.conf from `fallback: 48h` to `fallback: 1h`
  2. Send confirmation to `inbox/ceo.md`
  3. Monitor first writer outputs after resume

---

## 2026-02-21 ~00:36 UTC — Operations Head: Routine state check — all prep complete, awaiting Feb 22

### Trigger
- pending-trigger (routine coordination check)

### Work Completed
- **Full state review.** All inbox items confirmed resolved. No new events. No new stale content alerts.
- **Writer readiness confirmed.** All 8 wake-on.conf files at `fallback: 48h` (paused). All 8 CLAUDE.md files updated with new category assignments for Feb 22.
- **Stirling-PDF v2.5.2 confirmed.** Docker image tag updated in previous iteration, verified on disk.
- **Coordinator health verified.** 7120MB free memory, 0 errors, social poster active (2580 items in queue), no agent errors.

### Inbox Processed
- No new messages. All prior items remain resolved.

### Freshness Updates
- None needed (all stale content alerts resolved)

### Learnings Recorded
- None

### Issues
- None

### Topic Map Progress
- No new articles (writers paused per founder directive)
- Total articles published: 778
- Target: 1,500+ by end of Month 1 (~722 remaining, writers resume Feb 22)

### Next Iteration
- **Feb 22:** Execute writer resume protocol:
  1. Change all 8 writer wake-on.conf from `fallback: 48h` to `fallback: 1h`
  2. Confirm readiness to CEO via inbox/ceo.md
  3. Monitor first writer outputs after resume
- Until then: no actionable work remaining. Exit cleanly.

---

## 2026-02-21 ~00:45 UTC — Operations Head: Stirling-PDF version update + Feb 22 readiness check

### Trigger
- inbox-message (BI & Finance stale content alert for Stirling-PDF)

### Work Completed
- **Stirling-PDF v2.5.0 → v2.5.2:** Updated Docker image tag in `/apps/stirling-pdf`. No breaking changes, minor version bump. `dateUpdated` set to 2026-02-21. Notified Technology for deploy.
- **Feb 22 writer readiness verified:** All 8 writer wake-on.conf confirmed at `fallback: 48h` (correctly paused). All 8 CLAUDE.md files previously updated with new assignments. No changes needed until Feb 22.
- **Wake-on.conf change planned for Feb 22:** Cannot change to 1h yet — coordinator would start writers immediately since lastRun is 14-22 hours ago. Will change on Feb 22 morning iteration.

### Inbox Processed
- BI & Finance stale content alert (Stirling-PDF v2.5.0 → v2.5.2) → resolved (updated)

### Freshness Updates
- Stirling-PDF: v2.5.0 → v2.5.2 (Docker image tag only, no config changes)

### Learnings Recorded
- None new (BI already wrote learning to apps.md)

### Issues
- None

### Topic Map Progress
- No new articles (writers paused per founder directive)
- Total articles published: 778
- 1 article updated for freshness

### Next Iteration
- **Feb 22:** Execute writer resume protocol:
  1. Change all 8 writer wake-on.conf from `fallback: 48h` to `fallback: 1h`
  2. Confirm readiness to CEO via inbox/ceo.md
  3. Monitor first writer outputs after resume

---

## 2026-02-20 ~20:20 UTC — Operations Head: Routine check — all prep complete, awaiting Feb 22 writer resume

### Trigger
- pending-trigger (routine coordination check)

### Work Completed
- **No new work needed.** Full state review completed. All inbox items resolved. All 8 writer CLAUDE.md files confirmed updated for Feb 22. Internal link audit (P1-P5) complete. Quality audit complete. Security-basics link fix complete.

### Inbox Processed
- No new messages. All items from prior iterations confirmed resolved.

### Freshness Updates
- None (all stale content alerts resolved in prior iterations)

### Learnings Recorded
- None

### Issues
- None

### Health Check
- Coordinator: healthy (4 agents running, 0 errors, 6.3GB free memory)
- Social poster: active (posting every 5 min, 2540 items in queue)
- All 8 writers: confirmed paused (48h fallback)
- Build/deploy: active (30-min timer)

### Topic Map Progress
- No new articles this iteration (writers paused per founder directive)
- Total articles published: 778
- Target: 1,500+ by end of Month 1 (~722 remaining, writers resume Feb 22)
- All 8 writer CLAUDE.md files ready with new category assignments

### Next Iteration
- **Feb 22:** Execute writer resume protocol:
  1. Update all 8 writer wake-on.conf from `fallback: 48h` to `fallback: 1h`
  2. Confirm readiness to CEO via inbox/ceo.md
  3. Monitor first writer outputs after resume
- Until then: no actionable work remaining. Exit cleanly.

---

## 2026-02-20 ~20:10 UTC — Operations Head: Inbox processing + Feb 22 writer prep verification

### Trigger
- pending-trigger (routine coordination check)

### Work Completed

**1. Assigned `/compare/traefik-vs-haproxy/` to proxy-docker-writer (Priority 0)**
- Marketing sent a GSC-confirmed brief: "traefik vs haproxy" ranking at position 87 against wrong page
- Added as Priority 0 (first article) in proxy-docker-writer's CLAUDE.md
- Full brief included: feature comparison table, Docker integration focus, FAQ section, cross-link requirements
- Notified Marketing via inbox

**2. Assigned `/foundations/remote-access` to vpn-filesync-writer (Priority 0)**
- From Marketing's earlier Decision 2 — 6 articles link to this missing page
- vpn-filesync-writer previously owned VPN & Remote Access — natural fit
- Full brief included in their CLAUDE.md

**3. Verified Feb 22 writer readiness**
- All 8 writer wake-on.conf files confirmed at `fallback: 48h` (paused)
- All 8 writer CLAUDE.md files have new category assignments — no overlaps detected
- All pillar /best/ pages from CEO directive exist (7/7)
- Writer resume protocol: change wake-on.conf from 48h → 1h on Feb 22, confirm to CEO

### Inbox Processed
- Marketing traefik-vs-haproxy brief → resolved (assigned to proxy-docker-writer)
- All other inbox items were already resolved in prior iterations

### Freshness Updates
- None

### Learnings Recorded
- None

### Issues
- None

### Topic Map Progress
- No new articles this iteration (writers paused, this was coordination)
- Total articles published: 778

### Next Iteration
- Feb 22: Switch all 8 writer wake-on.conf from 48h → 1h fallback
- Confirm readiness to CEO via inbox/ceo.md
- Monitor first writer outputs after resume

---

## 2026-02-21 ~00:15 UTC — Operations Head: security-basics link fix (13 files) + inbox processing

### Trigger
- inbox-message (Marketing: Decisions on 2 missing foundation pages)

### Work Completed

**1. Fixed /foundations/security-basics → /foundations/security-hardening (13 files)**
- Per Marketing's internal link audit Decision 1
- All 13 articles that linked to the non-existent `/foundations/security-basics` now point to `/foundations/security-hardening`
- Files: best/email, apps/mailu, apps/calcom, apps/home-assistant, apps/portainer, apps/searxng, apps/vaultwarden, apps/privatebin, apps/jitsi-meet, hardware/home-server-networking, apps/microbin, hardware/beginner-hardware-bundle, apps/rustdesk
- Verified: 0 remaining references to `/foundations/security-basics`

**2. Inbox processed**
- Marketing security-basics/remote-access decision → security-basics DONE, remote-access queued for writer Feb 22
- Marketing SEO optimization (HAProxy vs Nginx) → already resolved in prior iteration (article has Performance Benchmarks + Reverse Proxy sections)
- All other inbox items were already resolved in prior iterations

### Freshness Updates
- None

### Learnings Recorded
- None

### Issues
- None

### Topic Map Progress
- No new articles this iteration (writers paused, this was link maintenance)
- Total articles published: 778

### Next Iteration
- Writers resume Feb 22 — ensure wake-on.conf files are updated from 48h to 1h fallback
- /foundations/remote-access to be written by a writer on Feb 22
- Monitor for any remaining inbox items

---

## 2026-02-20 ~20:30 UTC — Operations Head: Internal link audit batch fixes (P1-P5) + backup-strategy article

### Trigger
- inbox-message (Marketing internal link audit results — 365 broken references across 779 articles)

### Context
- All writers PAUSED per founder directive until Feb 22
- Marketing completed a comprehensive internal link audit identifying 365 broken link references, 172 orphan pages, and category frontmatter inconsistencies
- This is high-impact SEO work — broken internal links fracture the pillar-cluster architecture that drives rankings

### Work Completed

**1. PRIORITY 1: Fixed /foundations/reverse-proxy link mismatch (41 files)**
- 41 content files linked to `/foundations/reverse-proxy` which doesn't exist
- All updated to `/foundations/reverse-proxy-explained` (the correct URL)
- Most were in app guides' Related sections and Reverse Proxy configuration sections
- Verified: 0 broken reverse-proxy links remaining

**2. PRIORITY 2: Fixed 8 other URL mismatches (20 files)**

| Broken Link | Fixed To | Files |
|------------|---------|-------|
| `/foundations/linux-basics` | `/foundations/linux-basics-self-hosting` | 5 |
| `/best/bookmarks` | `/best/bookmarks-read-later` | 4 |
| `/best/file-sync-storage` | `/best/file-sync` | 3 |
| `/best/monitoring-uptime` | `/best/monitoring` | 2 |
| `/best/ad-blocking-dns` | `/best/ad-blocking` | 2 |
| `/best/reverse-proxy-ssl` | `/best/reverse-proxy` | 2 |
| `/best/note-taking-knowledge` | `/best/note-taking` | 1 |
| `/foundations/security` | `/foundations/security-hardening` | 1 |

**3. PRIORITY 3: Fixed category frontmatter splits (149 files)**

| Old Category | New Category | Files |
|-------------|-------------|-------|
| `ad-blocking-dns` | `ad-blocking` | 21 |
| `ai-machine-learning` | `ai-ml` | 18 |
| `automation-workflows` | `automation` | 14 |
| `file-sync-storage` | `file-sync` | 22 |
| `monitoring-uptime` | `monitoring` | 10 |
| `note-taking-knowledge` | `note-taking` | 34 |
| `reverse-proxy-ssl` | `reverse-proxy` | 23 |
| `wiki-documentation` | `wiki` | 7 |

Verified: 0 stale category values remaining.

**4. PRIORITY 4: Linked 8 orphan troubleshooting articles from parent app guides (4 files)**
- `/apps/jellyfin` → linked to `/troubleshooting/jellyfin-transcoding-issues`
- `/apps/nextcloud` → linked to `/troubleshooting/nextcloud-sync-not-working`
- `/apps/nginx-proxy-manager` → linked to 3 troubleshooting articles (502, default site, SSL)
- `/apps/traefik` → linked to 3 troubleshooting articles (container detection, dashboard, SSL cert)
- Links added in both Troubleshooting section and Related section of each app guide

**5. PRIORITY 5: Created /foundations/backup-strategy (new article)**
- 59 articles link to this URL — it was the most-demanded missing article
- Comprehensive guide covering: 3-2-1 rule overview, what to back up, tool comparison (Restic/BorgBackup/Kopia/Duplicati), storage backends with cost comparison, backup schedules, automation with Restic + systemd timers, restore testing, monitoring, common mistakes
- Links to existing backup guides: `/foundations/backup-3-2-1-rule`, `/foundations/backup-docker-volumes`
- 10+ internal links (meets minimum for foundation guides)
- Meta description: 155 chars (meets new minimum)

### Inbox Processed
- Marketing internal link audit (2026-02-20 ~19:30 UTC) → resolved (all 5 priorities addressed)

### Articles Written
- foundation: /foundations/backup-strategy — "Self-Hosted Backup Strategy Guide" — foundations

### Freshness Updates
- None (no content production during pause)

### Learnings Recorded
- None (standard batch find-and-replace operations; no new technical discoveries)

### Issues
- Remaining from Marketing audit: 172 orphan pages needing inbound links, 279 missing cross-links, `/foundations/security-basics` (13 refs) and `/foundations/remote-access` (8 refs) still missing
- These will be addressed when writers resume Feb 22 or via dedicated batch fix

### Topic Map Progress
- 1 new foundation article added (backup-strategy)
- Total articles on disk: ~780
- ~210 files modified (link fixes + category fixes + troubleshooting links)

### Next Iteration
- On Feb 22: Reset all 8 writer wake-on.conf from `fallback: 48h` to `fallback: 1h`. Confirm to CEO via inbox/ceo.md. Monitor writer restarts.
- Consider creating `/foundations/security-basics` and `/foundations/remote-access` to resolve remaining high-impact missing links (13 + 8 = 21 articles pointing to them)
- If triggered before Feb 22: Could do additional missing article creation for high-demand forward references

---

## 2026-02-20 ~16:30 UTC — Operations Head: New-category topic-map sync (7 categories) + Feb 22 readiness verification

### Trigger
- pending-trigger (routine iteration during writer pause)

### Context
- All writers PAUSED per founder directive until Feb 22
- Previous iterations synced all 13 tier1/tier2 categories
- This iteration discovered that 6 NEW categories (from Marketing briefs for Feb 22) had articles on disk but topic-maps still showed 0 complete
- Also verified all 8 writer CLAUDE.md files and wake-on.conf configurations are ready

### Critical Finding: New-Category Topic-Maps Out of Sync

Discovered that writer sub-agents had already produced articles for 6 of the 8 new categories assigned to writers for Feb 22, but the topic-maps still showed 0 articles complete. Without fixing this, writers would have rewritten ~49 articles on Feb 22.

### Work Completed

**1. Topic-Map Files Synced (7 categories)**

| Category | Before | After | Articles Saved from Rewrite |
|----------|--------|-------|----------------------------|
| Newsletters & Mailing Lists | 0/14 | 8/14 | ~8 |
| File Sharing & Transfer | 0/18 | 11/18 | ~11 |
| Social Networks & Forums | 0/24 | 7/24 | ~7 |
| Task Management | 0/16 | 6/16 | ~6 |
| Music & Audio | 0/22 | 9/22 | ~9 |
| Video Surveillance & NVR | 0/14 | 7/14 | ~7 |
| Document Signing & PDF | 0/12 | 1/12 | 1 (Stirling-PDF) |
| **TOTAL** | | | **~49 articles saved** |

Also noted:
- Multiple duplicate-slug comparisons in Music & Audio (both navidrome-vs-funkwhale AND funkwhale-vs-navidrome exist)
- Several bonus articles produced by writers beyond original topic-map plans (extras tracked in topic-maps)
- Low-Code and Ticketing & Helpdesk are genuinely empty (0 articles) — confirmed correct

**2. Writer Readiness Verification**
- All 8 wake-on.conf files confirmed set to `fallback: 48h`
- All 8 CLAUDE.md files confirmed with 155-char meta description requirement
- No category overlap detected across writers

**Combined with previous syncs: ~189 articles' worth of duplicate work prevented across 20 categories (7 tier1, 6 tier2, 7 new).**

Updated `_overview.md` with corrected counts for all 7 categories. Categories with content now 29+ of 78.

### Inbox Processed
- No new inbox items this iteration. All previous items remain in their resolved/in-progress states.

### Freshness Updates
- None (no content production during pause)

### Learnings Recorded
- None this iteration (same topic-map drift pattern as previous syncs — writers produced articles for categories that were still new/unsynced in topic-maps)

### Issues
- Duplicate slug comparisons in Music & Audio (reversed ordering). Not breaking but could confuse interlinking. Note for homeauto-notes-writer when it resumes.

### Topic Map Progress
- No new articles this iteration (writer pause period)
- 7 more topic-map files corrected to match reality (total: 20 of ~78 categories now fully synced)
- Total articles on disk: ~779
- All writer-assigned categories now have accurate queued article lists for Feb 22 resume

### Next Iteration
- On Feb 22: Reset all 8 writer wake-on.conf from `fallback: 48h` to `fallback: 1h`. Confirm to CEO via inbox/ceo.md. Monitor writer restarts.
- If triggered before Feb 22: All critical prep work is done. Could do quality review of specific article Docker configs if time permits.

---

## 2026-02-20 ~15:55 UTC — Operations Head: SEO optimization + Tier 2 topic-map sync (6 categories)

### Trigger
- inbox-missed (Marketing SEO optimization request from ~16:30 UTC)

### Context
- All writers PAUSED per founder directive until Feb 22
- Marketing sent SEO optimization request targeting 3 near-page-1 keywords
- Strategy.md noted tier2-writer topic-maps may be out of sync — confirmed and fixed

### Work Completed

**1. Marketing SEO Optimization Request — Processed**

Reviewed all 3 pages flagged by Marketing for content strengthening:
- `/compare/haproxy-vs-nginx` — Already has dedicated "Performance Benchmarks" section (lines 155-198, 3 tables) and "As a Reverse Proxy" section (lines 202-263, 5 tables). Both target keywords ("haproxy vs nginx performance comparison" at pos 18, "haproxy vs nginx reverse proxy" at pos 17) are well-addressed. Updated meta description to 157 chars (was 121).
- `/hardware/proxmox-hardware-guide` — Already has comprehensive hardware requirements table, FAQ section answering all 3 target questions ("minimum hardware requirements" at pos 10, "how much RAM", "best CPU"). Updated meta description to 158 chars (was 103).
- `/apps/technitium` — Already has "Browser-Based DNS Management" section with feature table, targeting "self host dns server in browser" (pos 18). Updated meta description to 153 chars (was 119).

All 3 pages were already well-optimized from previous iterations. The main improvement was meta description length (all were below 140 chars, now all 150+).

**2. Tier 2 Topic-Maps Synced (6 categories)**

Found 45 articles on disk but marked queued/planned in topic-maps, plus 9 orphan files not in any topic-map:

| Category | Before | After | Articles Saved from Rewrite |
|----------|--------|-------|----------------------------|
| Monitoring | 3/28 | 10/28 | ~7 |
| Backup | 2/29 | 10/29 | ~8 |
| Analytics | 3/28 | 9/28 | ~6 |
| Email | 0/32 | 8/32 | ~8 |
| Bookmarks | 0/15 | 8/15 | ~8 |
| CMS | 1/31 | 9/31 | ~8 |
| **TOTAL** | | | **~45 articles saved** |

Also found:
- 9 comparison files on disk not referenced in topic-maps (extra articles produced by writers beyond the plan)
- 3 filename discrepancies (reversed slug ordering: linkding-vs-linkwarden, ghost-vs-hugo, wordpress-vs-hugo)

Updated all 6 topic-map files + `_overview.md` with corrected counts.

**Combined with previous sync (iteration ~14:30 UTC): ~140 articles' worth of duplicate work prevented across 13 categories.**

### Inbox Processed
- Marketing SEO optimization request (~16:30 UTC): PROCESSED — meta descriptions improved, content already strong. Marking as resolved.

### Freshness Updates
- None (no content production during pause)

### Learnings Recorded
- None this iteration (same pattern as previous sync — topic-map drift from multiple writers)

### Issues
- Some slug inconsistencies across writers (reversed comparison slugs). Not breaking but could confuse cross-linking. Note for tier2-writer when it resumes.
- Orphan comparison files (9 total) not tracked in topic-maps. Low priority — they exist and are deployed, just not in the plan.

### Topic Map Progress
- No new articles this iteration (writer pause period)
- 6 more topic-map files corrected to match reality (total: 13 of 13 tier1/tier2 categories now synced)
- Total articles on disk: ~779
- All tier2-writer categories now have accurate queued article lists for Feb 22 resume

### Next Iteration
- On Feb 22: Reset all 8 writer wake-on.conf from `fallback: 48h` to `fallback: 1h`. Confirm to CEO via inbox/ceo.md. Monitor writer restarts.
- If triggered before Feb 22: All critical prep work is done. Topic-maps synced, writer CLAUDE.md files updated, check-before-write guards in place. Could do quality review of existing articles if time permits.

---

## 2026-02-20 ~14:30 UTC — Operations Head: Topic-map sync + check-before-write guard for Feb 22

### Trigger
- pending-trigger (routine iteration during writer pause)

### Context
- All writers PAUSED per founder directive until Feb 22
- Previous iteration completed all writer CLAUDE.md updates
- This iteration focused on topic-map optimization per CEO directive

### Critical Finding: Topic-Maps Severely Out of Sync

Discovered that 7+ topic-map files showed articles as "queued" when they already existed on disk. Without fixing this, writers would have rewritten ~50+ articles on Feb 22, wasting an entire day of production.

### Work Completed

**1. Topic-Map Files Synced (7 category files)**

| Category | Before | After | Articles Saved from Rewrite |
|----------|--------|-------|----------------------------|
| VPN & Remote Access | 0/18 | 11/23 | ~9 |
| Note Taking | 1/21 | 18/24 | ~17 |
| File Sync | 2/16 | 14/22 | ~12 |
| Ad Blocking | 3/11 | 10/16 | ~7 |
| Media Servers | 3/18 | 16/41 | ~13 |
| Download Mgmt | 1/20 | 21/34 | ~20 |
| Media Organization (*arr) | 0/20 | 17/20 | ~17 |
| **TOTAL** | | | **~95 articles saved** |

Also updated `_overview.md` with corrected counts.

**2. Check-Before-Write Guard Added to ALL 8 Writer CLAUDE.md Files**

Every writer now has a "CRITICAL: Check Before Writing" section that instructs them to verify if a file exists on disk before writing it. This guards against any remaining topic-map drift.

Tier2-writer additionally got a list of known existing articles per category.

**3. Verified Writer Readiness**
- All 8 writer wake-on.conf files confirmed at `fallback: 48h`
- All 11 topic-map files for Feb 22 assignments verified present with queued articles
- All writer CLAUDE.md files have correct category assignments, no overlaps

### Commits
1. `13ee503` — Sync 5 Tier 1 topic-maps with disk (vpn, note-taking, file-sync, ad-blocking, media-servers)
2. `246265d` — Add check-before-write guard to all 8 writer CLAUDE.md files
3. `3cf9b97` — Sync download-management and media-organization topic-maps
4. `2f2d31c` — Update _overview.md with corrected counts

### Inbox Processed
- No new messages this iteration (all previous items remain in-progress or resolved)

### Freshness Updates
- None (no content production during pause)

### Learnings Recorded
- Topic-maps can drift significantly from actual content, especially when multiple writers produce content across overlapping categories. The check-before-write guard is a permanent safety net.

### Issues
- Some slug inconsistencies exist (wiki-js vs wikijs, technitium vs technitium-dns, obsidian-livesync vs obsidian-sync). These are cosmetic and won't cause writer duplication, but should be noted.
- Duplicate comparison articles may exist (blocky-vs-pihole AND pi-hole-vs-blocky). Not harmful for SEO but could confuse internal linking.

### Topic Map Progress
- No new articles this iteration (writer pause period)
- 7 topic-map files corrected to match reality
- ~95 articles' worth of duplicate work prevented
- Total articles on disk: 779

### Next Iteration
- If triggered before Feb 22: remaining topic-map files for tier2-writer categories (monitoring, backup, analytics, email, bookmarks, cms) could also be synced. Lower priority since the check-before-write guard will catch them.
- On Feb 22: Reset all 8 writer wake-on.conf from `fallback: 48h` to `fallback: 1h`. Confirm to CEO via inbox/ceo.md. Monitor writer restarts.

---

## 2026-02-20 ~14:15 UTC — Operations Head: Marketing GSC directives baked into writer CLAUDE.md files

### Trigger
- post-pause-drain (scheduled iteration during writer pause)

### Context
- All writers PAUSED per founder directive until Feb 22
- Marketing sent revised priorities at ~12:30 UTC with two new structural requirements from GSC data analysis
- Previous CLAUDE.md updates (13:00 UTC) had comparisons-first and 155-char meta desc, but NOT the table requirement or niche-first refinement

### Work Completed

**1. All 8 writer CLAUDE.md files updated with Marketing's GSC-informed requirements**

Two new quality rules added to every writer:
- **Tables in EVERY article** — GSC data shows articles with tables earn 2x more impressions. Every article must have at least one comparison/specification table regardless of content type.
- **Niche over mainstream** — Prioritize comparisons between smaller/emerging tools over mainstream head-to-heads. New domain can't compete on "Jellyfin vs Plex" yet.

SEO insight line updated in all 8 writers to reference both niche priority and table requirement.

Files updated: foundations-writer, hardware-writer, homeauto-notes-writer, password-adblock-writer, photo-media-writer, proxy-docker-writer, tier2-writer, vpn-filesync-writer.

Committed in 4 batches (frequent commits per learnings/failed.md guidance on git rebase risk).

**2. Inbox processed**
- Marketing revised priorities (12:30 UTC): marked resolved — directives baked into all writer CLAUDE.md files

**3. Strategy updated**
- Added two new standing decisions (tables requirement, niche priority)
- Updated timestamp

**4. Wake-on.conf verified**
- All 8 writers confirmed at `fallback: 48h` — correctly paused until Feb 22

### Inbox Processed
- Marketing revised writer priorities (12:30 UTC): RESOLVED — all 8 CLAUDE.md files updated

### Freshness Updates
- None (no content production during pause)

### Learnings Recorded
- None this iteration

### Issues
- None blocking

### Topic Map Progress
- No new articles this iteration (writer pause period)
- Total articles on disk: ~778
- 9+ categories complete / 78 total

### Next Iteration
- If triggered before Feb 22: no further CLAUDE.md changes expected. Ready for Feb 22.
- On Feb 22: Reset all 8 writer wake-on.conf from `fallback: 48h` to `fallback: 1h`, confirm to CEO via inbox/ceo.md, monitor writer restarts.

---

## 2026-02-20 ~13:00 UTC — Operations Head: Writer CLAUDE.md updates for Feb 22 resume

### Trigger
- inbox-message (CEO directive to update writer CLAUDE.md files)
- writer-complete event from homeauto-notes-writer (15 articles)

### Context
- All writers PAUSED per founder directive until Feb 22
- CEO directive: update all 8 writer CLAUDE.md files with new assignments, 155-char meta desc, corrected scorecard
- Marketing briefs for Feb 22 ready (Document Signing, Low-Code, Ticketing, DNS, File Sharing, Newsletters)

### Work Completed

**1. Writer CLAUDE.md Updates (ALL 8 COMPLETE)**

Updated every writer with:
- 155-char minimum meta description requirement (strict, added to quality rules and frontmatter sections)
- Month 1 scorecard corrected from 5,000 to 1,500 (board approval 2026-02-20)

Category reassignments (CLAUDE.md rewritten for writers with new scope):
- **foundations-writer**: Container Orch/Automation (DONE) → *arr finish (3) + Document Signing (11) + Low-Code (14) = 28 articles
- **vpn-filesync-writer**: VPN/File Sync (DONE) → DNS & Networking remaining (17) = 17 articles
- **photo-media-writer**: Photo/Media (DONE) → Ebooks finish (3) + Ticketing & Helpdesk (14) = 17 articles
- proxy-docker-writer: Newsletters + File Sharing (unchanged, 32 articles)
- homeauto-notes-writer: Music & Audio + Video Surveillance (unchanged, ~12 remaining)
- password-adblock-writer: Social Networks + Task Management (unchanged, 40 articles)
- tier2-writer: Download Mgmt + CMS + Monitoring + Backup + Analytics + Email + Bookmarks (unchanged)
- hardware-writer: Hardware (unchanged, open-ended)

**2. Overlap Verification: CLEAN**
- No two writers assigned to same category
- Cross-category articles (Readarr, Navidrome) already exist — no duplicate writing risk

**3. Writer-Complete Event Processed**
- homeauto-notes-writer completed 15 articles (Video Surveillance + Music & Audio)
- Event archived to events/archive/

**4. State Files Updated**
- strategy.md: revised reassignment plan with final assignments
- state.md: writer assignments table updated with new categories and CLAUDE.md status
- inbox/operations.md: CEO directive marked resolved, Marketing briefs marked in-progress with writer assignments
- inbox/ceo.md: confirmation message sent

### Inbox Processed
- CEO directive (writer CLAUDE.md prep): RESOLVED — all 8 files updated
- Marketing Feb 22 brief (5 categories): IN-PROGRESS — all categories assigned to writers
- homeauto-notes-writer completion event: PROCESSED — archived

### Freshness Updates
- None (quality audit work, no content production)

### Learnings Recorded
- None this iteration

### Issues
- None blocking

### Topic Map Progress
- No new articles this iteration (CLAUDE.md update focus per CEO directive)
- Total articles on disk: 773
- 9+ categories complete / 78 total

### Next Iteration
- If triggered before Feb 22: Continue review work, verify wake-on.conf files ready for 48h→1h switch
- On Feb 22: Reset all 8 writer wake-on.conf to `fallback: 1h`, confirm to CEO, monitor writer restarts

---

## 2026-02-20 ~12:00 UTC — Operations Head: Quality audit + writer reassignment planning

### Trigger
- pending-trigger (scheduled iteration)

### Context
- All writers PAUSED per founder directive until Feb 22
- CEO directive: focus on quality review, topic map optimization, writer reassignment planning

### Quality Audit Results

**1. Docker `:latest` tag audit**
- Found 17 articles with real app Docker Compose configs using `:latest` (violation of quality standards)
- **ALL FIXED** — pinned to specific versions:
  - `lazylibrarian.md` → `version-dada182d`
  - `photoprism.md` → `251130-b3068414c`
  - `windmill.md` (LSP service) → `1.639.0`
  - `docker-swarm.md` (visualizer) → `stable`
  - `whisper.md` → `ghcr.io/speaches-ai/speaches:v0.8.3` (project renamed from faster-whisper-server)
  - `yacht.md` → `v0.0.7-alpha-2023-01-12--05`
  - `searxng-vs-whoogle.md` → `benbusby/whoogle-search:1.2.2`
  - `searxng-vs-google.md` → `searxng/searxng:2026.2.11-970f2b843`
  - `readarr-vs-lazylibrarian.md` → `version-dada182d`
  - `frigate-vs-zoneminder.md` → `zoneminderhq/zoneminder:1.38.1`
  - `audiobookshelf-vs-booksonic.md` → `lscr.io/linuxserver/booksonic-air:v2201.1.0-ls45`
  - `maloja-vs-lastfm.md` → `krateng/maloja:3.2.4`
  - `azuracast.md` → `ghcr.io/azuracast/azuracast:0.23.1`
  - `maloja.md` → `krateng/maloja:3.2.4`
- 3 apps with no version tags (huginn, librum, stable-diffusion-webui) — added comments explaining why `:latest` is used
- Remaining `:latest` references are only in placeholder/educational examples (`myapp:latest`, `your-app:latest`)

**2. Frontmatter completeness audit**
- 0 missing titles, 0 missing descriptions, 0 missing dates, 0 drafts stuck
- 612/767 (80%) have meta descriptions shorter than 140 chars (target: 150-160)
- Systemic issue — descriptions are competent but consistently 10-20 chars too short
- Deferred fix — will address when content velocity resumes or via batch process

**3. Filler language audit**
- 0 instances of filler language across 767 articles
- Voice guidelines are being followed perfectly

### Writer Reassignment Plan (Feb 22)
- foundations-writer → *arr stack (20 articles)
- proxy-docker-writer → DNS & Networking + Newsletters (43 articles)
- homeauto-notes-writer → Music & Audio + Video Surveillance (36 articles)
- password-adblock-writer → Social Networks + Task Management (40 articles)
- vpn-filesync-writer → finish VPN + File Sync + Ebooks (12 articles)
- photo-media-writer → finish Photo + Media + Note Taking (24 articles)
- tier2-writer → Download Mgmt + CMS + Monitoring + Backup (122 articles)
- hardware-writer → continue expanding

### Inbox Processed
- CEO directive (writers paused until Feb 22): ACKNOWLEDGED — following directive
- Marketing content brief (4 categories, 72 articles): Incorporated into reassignment plan
- BI stale alerts (Jackett, Elasticsearch, Strapi): Already resolved by previous iterations

### Freshness Updates
- 17 `:latest` Docker tags updated to pinned versions (see above)

### Learnings Recorded
- `learnings/apps.md`: 6 new entries (Speaches rename, PhotoPrism tags, SearXNG tags, Booksonic deprecated, AzuraCast version, Maloja version)
- `learnings/content.md`: 2 new entries (meta description length issue, zero filler language finding)

### Issues
- None blocking

### Topic Map Progress
- No new articles this iteration (quality audit focus per CEO directive)
- Total articles on disk: 759
- 9 categories complete / 78 total

### Next Iteration
- Continue quality review if triggered before Feb 22
- On Feb 22: execute writer reassignment plan — update writer CLAUDE.md files, reset wake-on.conf to 1h, launch writers

---

## 2026-02-20 ~11:00 UTC — tier2-writer: PAUSED (founder directive)

### Trigger
- Coordinator fallback or timing race

### Action
- Read CLAUDE.md, state.md, inbox/operations.md
- Found FOUNDER DIRECTIVE (2026-02-20 10:25 UTC): ALL writers paused until Feb 22
- state.md confirms tier2-writer status: PAUSED (until Feb 22)
- No content produced this iteration — complying with directive

### Articles Written
- None (paused per founder directive)

### Next Iteration
- Resume Feb 22. Priority queue from CLAUDE.md: sonarr, radarr, qbittorrent, ghost, wordpress, grafana, prometheus, duplicati, borgmatic, plausible, umami, mailu, mailcow, linkding, wallabag (15 app guides), then comparisons and replace guides.

---

## 2026-02-20 ~10:45 UTC — homeauto-notes-writer: 15 articles (Video Surveillance + Music & Audio)

### Trigger
- writer-slot-available

### Articles Written (15 total)

**Comparisons (8):**
- compare/frigate-vs-blue-iris — "Frigate vs Blue Iris: Which NVR Should You Use?" — video-surveillance
- compare/zoneminder-vs-shinobi — "ZoneMinder vs Shinobi: Which NVR to Self-Host?" — video-surveillance
- compare/frigate-vs-shinobi — "Frigate vs Shinobi: Which NVR Should You Pick?" — video-surveillance
- compare/navidrome-vs-funkwhale — "Navidrome vs Funkwhale: Which Music Server?" — music-streaming
- compare/navidrome-vs-airsonic — "Navidrome vs Airsonic: Which Music Server?" — music-streaming
- compare/audiobookshelf-vs-booksonic — "Audiobookshelf vs Booksonic: Audiobook Servers" — music-streaming
- compare/maloja-vs-lastfm — "Maloja vs Last.fm: Self-Hosted Music Scrobbling" — music-streaming
- compare/koel-vs-navidrome — "Koel vs Navidrome: Which Music Server to Pick?" — music-streaming

**App Guides (7):**
- apps/frigate — "How to Self-Host Frigate with Docker Compose" — video-surveillance
- apps/zoneminder — "How to Self-Host ZoneMinder with Docker Compose" — video-surveillance
- apps/shinobi — "How to Self-Host Shinobi with Docker Compose" — video-surveillance
- apps/maloja — "How to Self-Host Maloja with Docker Compose" — music-streaming
- apps/koel — "How to Self-Host Koel with Docker Compose" — music-streaming
- apps/azuracast — "How to Self-Host AzuraCast with Docker Compose" — music-streaming
- apps/ampache — "How to Self-Host Ampache with Docker Compose" — music-streaming

### Note Taking Status
- COMPLETE — all apps, comparisons, replace guides, and roundups verified as existing
- obsidian-livesync exists (covers obsidian-sync scope)

### Source Verification
- Frigate v0.16.4 verified via GitHub releases
- ZoneMinder v1.38.1 verified via GitHub releases
- Navidrome v0.60.3 verified via GitHub releases (matches learnings/apps.md)
- Koel v8.3.0 verified via GitHub releases
- Ampache v7.9.0 verified via GitHub releases (released Feb 19, 2026)
- AzuraCast: uses official installer, latest tag recommended by project
- Shinobi: no semver tags, uses `dev` rolling tag on Docker Hub
- Maloja: no release tags on GitHub, uses `latest` Docker tag

### Learnings Recorded
- Shinobi has no semantic version Docker tags — uses `dev` rolling tag
- Maloja has no GitHub releases — uses `latest` Docker tag on Docker Hub
- Ampache v7.9.0 released Feb 19, 2026 with PHP 8.5 support

### Issues
- None

### Category Progress
- Video Surveillance: 7/14 (3 comparisons + 3 app guides done, plus frigate-vs-zoneminder existed)
- Music & Audio: 10/22 (5 comparisons + 4 app guides done, plus navidrome-vs-jellyfin + navidrome + funkwhale + audiobookshelf + lidarr existed)
- Note Taking: COMPLETE

### Next Iteration
- Video Surveillance: remaining app guides (moonfire-nvr, viseron), replace guides (ring, nest-cam), hardware, roundup, foundations
- Music & Audio: remaining app guides (airsonic-advanced, deemix, mopidy), replace guides, roundup, hardware

---

## 2026-02-20 ~10:30 UTC — Operations Head: 9 articles + writer-complete processing

### Trigger
- Event: writer-complete (container-orch-automation writer finished 24 articles)

### Articles Written (9 total — directly by Operations Head)

**App Guides (4):**
- apps/wikijs — "How to Self-Host Wiki.js with Docker Compose" — wiki-documentation
- apps/dokuwiki — "How to Self-Host DokuWiki with Docker" — wiki-documentation
- apps/mediawiki — "How to Self-Host MediaWiki with Docker Compose" — wiki-documentation
- apps/xwiki — "How to Self-Host XWiki with Docker Compose" — wiki-documentation

**Roundups (2):**
- best/wiki — "Best Self-Hosted Wiki Software in 2026" — wiki-documentation (PILLAR PAGE)
- best/ebooks-reading — "Best Self-Hosted Ebook Servers in 2026" — ebooks-reading (PILLAR PAGE)

**Replace Guides (3):**
- replace/notion-wiki — "Self-Hosted Alternatives to Notion for Teams" — wiki-documentation
- replace/gitbook — "Self-Hosted Alternatives to GitBook" — wiki-documentation
- replace/goodreads — "Self-Hosted Alternatives to Goodreads" — ebooks-reading
- replace/comixology — "Self-Hosted Alternatives to ComiXology" — ebooks-reading

### Writer-Complete Processing
- Container Orchestration + Automation writer produced 24 articles (8 comparisons, 10 app guides, 3 replace guides, 2 roundups, 1 foundations)
- Updated topic-map for both categories: Automation & Workflows now 15/15 COMPLETE, Container Orchestration 13/16
- Updated state.md and topic-map/_overview.md

### Inbox Processed
- BI stale content alert (Jackett v0.22→v0.24): RESOLVED — article already at v0.24.1167
- BI stale content alert (Elasticsearch v8→v9): RESOLVED — article already at v9.3.0 with migration guide
- BI stale content alert (Strapi :latest): RESOLVED — article already pinned to v5.36.1
- Marketing content brief (4 new categories, 72 articles): IN PROGRESS — Wiki & Documentation COMPLETE, ebooks pillar pages done, *arr stack + DNS queued for writers

### Freshness Updates
- None needed (all 3 stale alerts were already resolved by previous iterations)

### Learnings Recorded
- None new this iteration

### Issues
- None

### Category Progress
- Wiki & Documentation: 14/14 COMPLETE (new this iteration)
- Ebooks & Reading: 15/18 nearly complete (roundup + 2 replace guides new this iteration)
- Automation & Workflows: 15/15 COMPLETE (writer)
- Container Orchestration: 13/16 (writer)
- Total articles on disk: ~749 (740 + 9 new)

### Next Iteration
- Continue with Marketing's next-wave brief: *arr stack (20 articles) and DNS & Networking (29 articles)
- Assign writers to these categories when writer slots free up
- Complete remaining ebooks troubleshooting articles (2 remaining)

---

## 2026-02-20 ~10:15 UTC — Hardware Writer: 10 new hardware articles

### Trigger
- writer-slot-available

### Articles Written (10 total)

**New hardware articles (filling gaps beyond initial 25):**
1. hardware/qnap-vs-synology — "QNAP vs Synology: Which NAS to Buy"
2. hardware/intel-n305-mini-pc — "Intel N305 Mini PC for Self-Hosting"
3. hardware/zimaboard-setup-guide — "Zimaboard for Self-Hosting: Review & Setup"
4. hardware/jellyfin-media-server-hardware — "Best Hardware for Jellyfin Media Server"
5. hardware/nas-vs-desktop-drives — "NAS Drives vs Desktop Drives: Which to Use"
6. hardware/smb-vs-nfs-vs-iscsi — "SMB vs NFS vs iSCSI for Home Lab Storage"
7. hardware/mini-pc-vs-nas-cost-comparison — "Mini PC vs NAS: Cost Comparison"
8. hardware/used-hp-proliant — "Used HP ProLiant for Home Server"
9. hardware/plex-vs-jellyfin-hardware — "Plex vs Jellyfin: Hardware Requirements"
10. hardware/budget-home-server-under-200 — "Best Home Server Under $200 in 2026"

### Context
- All 25 originally assigned hardware articles already existed (written by prior iterations)
- Many extended articles also already existed (90 total before this iteration)
- Identified high-value gaps and wrote 10 new articles targeting real search demand
- Topics include: NAS brand comparison, specific product guides, cost analysis, protocol comparison

### Spec Verification
- QNAP/Synology: Model specs verified via manufacturer product pages and NASCompares
- Intel N305: Specs from Intel ARK, power consumption from ServeTheHome review
- Zimaboard: Specs from official zimaspace.com, power data from community measurements
- Drive specs: WD/Seagate product pages, Backblaze failure rate reports
- HP ProLiant: Gen10 specs from HPE QuickSpecs documentation

### Inbox Processed
- None (writer-slot-available trigger, no inbox messages)

### Freshness Updates
- None

### Learnings Recorded
- None new (existing learnings consulted before writing)

### Issues
- None

### Scope Progress
- Hardware: 100/100+ articles written (90 prior + 10 new = 100 total)
- All 25 original assigned articles: COMPLETE
- Extended articles: comprehensive coverage achieved
- Remaining gap topics for future iterations: immich-hardware-requirements, surveillance-nvr-hardware, lsi-raid-controller-guide, budget-homelab-switch, fanless-nas-build

### Next Iteration
- Additional extended hardware topics if triggered
- Freshness review of older hardware articles (price/spec updates)

## 2026-02-20 ~09:30 UTC — Foundations Writer: 24 articles (Container Orchestration + Automation & Workflows)

### Trigger
- 2h-fallback

### Articles Written (24 total)

**Comparisons (8):**
- compare/n8n-vs-node-red — "n8n vs Node-RED: Which Automation Tool to Self-Host?"
- compare/n8n-vs-huginn — "n8n vs Huginn: Which Automation Platform to Self-Host?"
- compare/n8n-vs-activepieces — "n8n vs Activepieces: Which Automation Tool to Self-Host?"
- compare/automatisch-vs-n8n — "Automatisch vs n8n: Which Automation Tool to Self-Host?"
- compare/windmill-vs-n8n — "Windmill vs n8n: Which Automation Platform to Self-Host?"
- compare/k3s-vs-k8s — "k3s vs Kubernetes (k8s): Which Should You Self-Host?"
- compare/nomad-vs-kubernetes — "Nomad vs Kubernetes: Which Orchestrator to Self-Host?"
- compare/rancher-vs-portainer — "Rancher vs Portainer: Which Container Manager to Self-Host?"

**App Guides (10):**
- apps/huginn — "How to Self-Host Huginn with Docker Compose"
- apps/activepieces — "How to Self-Host Activepieces with Docker Compose"
- apps/automatisch — "How to Self-Host Automatisch with Docker Compose"
- apps/windmill — "How to Self-Host Windmill with Docker Compose"
- apps/k3s — "How to Self-Host k3s: Lightweight Kubernetes Setup"
- apps/docker-swarm — "How to Set Up Docker Swarm for Self-Hosting"
- apps/rancher — "How to Self-Host Rancher for Kubernetes Management"
- apps/nomad — "How to Self-Host HashiCorp Nomad"
- apps/microk8s — "How to Self-Host MicroK8s: Snap-Based Kubernetes"
- apps/portainer-kubernetes — "How to Use Portainer for Kubernetes Management"

**Replace Guides (3):**
- replace/zapier — "Self-Hosted Alternatives to Zapier"
- replace/ifttt — "Self-Hosted Alternatives to IFTTT"
- replace/managed-kubernetes — "Self-Hosted Alternatives to Managed Kubernetes"

**Roundups (2):**
- best/automation — "Best Self-Hosted Automation Tools in 2026"
- best/container-orchestration — "Best Self-Hosted Container Orchestration in 2026"

**Foundations (1):**
- foundations/automation-workflows-guide — "Self-Hosted Automation: Getting Started Guide"

### Version Verification
- n8n: v2.8.3 (Docker: docker.n8n.io/n8nio/n8n:2.8.3) ✓
- Node-RED: v4.1.5 (Docker: nodered/node-red:4.1.5) ✓
- Huginn: commit SHA tag (no semantic version tags available) — documented
- Activepieces: v0.77.8 (Docker: ghcr.io/activepieces/activepieces:0.77.8) ✓ — avoided v0.78.x due to known CPU spike bug
- Automatisch: v0.15.0 (Docker: automatischio/automatisch:0.15.0) ✓
- Windmill: v1.639.0 (Docker: ghcr.io/windmill-labs/windmill:1.639.0) ✓
- k3s: v1.35.1+k3s1 ✓
- Rancher: v2.13.2 ✓
- Nomad: v1.11.2 ✓
- MicroK8s: 1.35/stable channel ✓

### Inbox Processed
- None (2h-fallback trigger, no inbox messages)

### Freshness Updates
- None

### Learnings Recorded
- Huginn has no semantic version Docker tags (commit SHAs only) — documented in articles
- Activepieces v0.78.x has CPU spike bug — used v0.77.8 instead
- Automatisch last release Aug 2025 — noted slow development in articles
- Windmill workers need privileged mode + Docker socket for script isolation

### Issues
- Huginn Docker tagging is problematic — no version-pinned tags. Used latest known commit SHA. This should be noted in learnings/apps.md.

### Scope Progress
- Container Orchestration: 13/16 written (missing: container-orchestration-explained — covered by existing container-orchestration-basics.md)
- Automation & Workflows: 15/15 COMPLETE
- Total new articles this iteration: 24

### Next Iteration
- Container orchestration scope nearly complete — only foundations/container-orchestration-explained remains, but content already exists at foundations/container-orchestration-basics.md
- Automation & Workflows scope is COMPLETE
- Could write additional articles: Temporal, Airflow, Prefect, Kestra app guides per CLAUDE.md guidance

## 2026-02-20 ~06:30 UTC — Operations Head: writer-complete processing + freshness + 2 new articles

### Trigger
- Event: writer-complete (AI/ML + Search Engines writer finished 40 articles)

### Inbox Processed
- BI stale content alerts: LOW priority items (Calibre-Web, Paperless-ngx, Ollama) — ALL RESOLVED
  - Calibre-Web: 0.6.24 → 0.6.26 ✓
  - Paperless-ngx: 2.20.6 → 2.20.7 ✓
  - Ollama: already at 0.16.2 (AI/ML writer used latest) ✓
- Overseerr deprecation: confirmed NO guide exists, no action needed

### Writer Management
- AI/ML + Search Engines writer: scope COMPLETE (22/22 AI/ML + 18/18 Search Engines = 40 articles)
- Updated topic-map for both categories: marked all articles [x] complete
- Reassigned proxy-docker-writer from AI/ML + Search Engines → Newsletters & Mailing Lists + File Sharing & Transfer
- Confirmed password-adblock-writer already covers Social Networks + Task Management (avoided duplicate assignment)

### Articles Written (directly by Ops head)
- comparison: /compare/funkwhale-vs-navidrome — "Funkwhale vs Navidrome: Which Music Server?" — music-audio
- comparison: /compare/k3s-vs-k0s — "k3s vs k0s: Which Lightweight Kubernetes?" — container-orchestration

### Freshness Updates
- Calibre-Web: image tag 0.6.24 → 0.6.26, dateUpdated → 2026-02-20
- Paperless-ngx: image tag 2.20.6 → 2.20.7, dateUpdated → 2026-02-20

### Learnings Recorded
- None new (version info confirmed via parallel research agents)

### Issues
- None

### Topic Map Progress
- AI & Machine Learning: 22/22 COMPLETE ✓
- Search Engines: 18/18 COMPLETE ✓
- Total categories fully complete: 6/78 (Home Automation, Docker Mgmt, Reverse Proxy, Password Mgmt, AI/ML, Search Engines)
- Total articles on disk: ~638

### State Updates
- state.md: updated article count (638), category completion (AI/ML + Search Engines COMPLETE), writer assignments
- topic-map/_overview.md: updated AI/ML and Search Engines to COMPLETE, categories fully complete 6/78
- strategy.md: updated priorities, writer assignments, resolved open questions

### Notifications Sent
- inbox/technology.md: 40 new articles ready for deployment (AI/ML + Search Engines)
- inbox/marketing.md: AI/ML + Search Engines categories 100% complete, ready for social promotion

### Next Iteration
- Writers will produce content for: Social Networks, Task Mgmt, Newsletters, File Sharing, Video Surveillance, Music & Audio, Container Orchestration
- Monitor writer output via completion events
- Check for new inbox messages from Marketing/BI

## 2026-02-20 ~07:00 UTC — VPN/FileSync writer: 7 articles (original scope COMPLETE + bonus)

### Articles Written
- app-guide: /apps/firezone — "How to Self-Host Firezone Gateway with Docker" — vpn-remote-access
- comparison: /compare/firezone-vs-wg-easy — "Firezone vs wg-easy: Which VPN Should You Use?" — vpn-remote-access
- app-guide: /apps/minio — "How to Self-Host MinIO with Docker Compose" — file-sync-storage
- app-guide: /apps/meshcentral — "How to Self-Host MeshCentral with Docker" — vpn-remote-access
- comparison: /compare/rustdesk-vs-meshcentral — "RustDesk vs MeshCentral: Remote Access Compared" — vpn-remote-access
- comparison: /compare/firezone-vs-netbird — "Firezone vs NetBird: Zero-Trust VPN Compared" — vpn-remote-access
- comparison: /compare/guacamole-vs-rustdesk — "Guacamole vs RustDesk: Remote Access Compared" — vpn-remote-access

### Inbox Processed
- None (writer-slot-available trigger, no inbox messages)

### Freshness Updates
- None

### Learnings Recorded
- Firezone 1.x control plane is cloud-only (not fully self-hostable) — apps.md
- MeshCentral v1.1.56 Docker config details — apps.md
- MinIO GitHub archived Feb 2026 (already in learnings, confirmed)

### Issues
- MinIO: GitHub archived, Docker images discontinued Oct 2025. Used bitnami/minio:2025.4.22. Article warns about archived status.
- Firezone: Control plane cloud-only — article is honest about this trade-off.

### Topic Map Progress
- VPN & Remote Access: ALL 18 articles complete + 4 bonus (firezone-vs-netbird, rustdesk-vs-meshcentral, guacamole-vs-rustdesk, meshcentral app guide)
- File Sync & Storage: ALL 16 articles complete
- Total new articles this iteration: 7

### Next Iteration
- VPN/FileSync writer scope is fully complete. Additional bonus articles possible: Rclone guide, more cross-category comparisons.

## 2026-02-20 ~06:30 UTC — AI/ML + Search Engines writer: 4 final articles (scope COMPLETE)

### Articles Written
- roundup: /best/ai-ml — "Best Self-Hosted AI & ML Tools in 2026" — ai-ml
- roundup: /best/search-engines — "Best Self-Hosted Search Engines in 2026" — search-engines
- hardware: /hardware/ai-ml-hardware — "Best Hardware for Self-Hosted AI & ML" — hardware
- foundations: /foundations/search-engine-setup — "Self-Hosted Search Engine Setup Guide" — foundations

### Topic Map Progress
- AI/ML: 22/22 COMPLETE
- Search Engines: 18/18 COMPLETE
- Total scope: 40/40 articles written across both categories

### Issues
- None

### Next Iteration
- Scope complete. Available for additional articles (YaCy, Zinc Search, Qdrant, Weaviate, etc.) or reassignment.

## 2026-02-20 ~05:30 UTC — AI/ML + Search Engines writer: 28 new articles

### Articles Written
- 7 new comparisons: meilisearch-vs-elasticsearch, ollama-vs-vllm, flowise-vs-langflow, elasticsearch-vs-opensearch, searxng-vs-google, typesense-vs-elasticsearch, tabby-vs-continue
- 9 new AI/ML app guides: localai (v3.11.0), vllm (v0.15.1), text-generation-webui (v1.10.1), flowise (v3.0.13), langflow (v1.7.3), tabby (v0.32.0), stable-diffusion-webui (v1.10.1), comfyui (v0.14.2), whisper (faster-whisper-server)
- 7 new search engine app guides: meilisearch (v1.35.1), typesense (30.1), whoogle (v1.2.2), elasticsearch (8.19.11), opensearch (3.5.0), manticoresearch (6.3.8), sonic (v1.4.9)
- 5 new replace guides: chatgpt, midjourney, github-copilot, google-search, algolia

### Topic Map Progress
- AI/ML: 19/22 complete (missing: best/ai-ml, hardware/ai-ml-hardware)
- Search: 15/18 complete (missing: best/search-engines, foundations/search-engine-setup)
- Total new articles: 28

### Issues
- SD WebUI, ComfyUI, Text Gen WebUI lack official Docker images — used community/custom Dockerfiles
- Continue.dev is IDE extension only (not a server) — comparison with Tabby covers architecture difference

### Next Iteration
- Write best/ai-ml and best/search-engines roundups
- Write hardware/ai-ml-hardware and foundations/search-engine-setup
- Generate additional search/AI articles (YaCy, Zinc Search, Qdrant, Weaviate)

## 2026-02-20 ~06:00 UTC — Tier 2 writer: 12 articles across 6 categories

### Articles Written
- app-guide: /apps/posthog — "How to Self-Host PostHog with Docker" — analytics
- app-guide: /apps/docker-mailserver — "How to Self-Host docker-mailserver" — email
- app-guide: /apps/stalwart — "How to Self-Host Stalwart Mail Server" — email
- app-guide: /apps/strapi — "How to Self-Host Strapi with Docker Compose" — cms-websites
- app-guide: /apps/directus — "How to Self-Host Directus with Docker Compose" — cms-websites
- comparison: /compare/kopia-vs-restic — "Kopia vs Restic: Which Backup Tool to Self-Host?" — backup
- comparison: /compare/grafana-vs-netdata — "Grafana vs Netdata: Which Monitoring to Self-Host?" — monitoring
- comparison: /compare/linkwarden-vs-hoarder — "Linkwarden vs Hoarder: Which Bookmark Manager?" — bookmarks
- comparison: /compare/directus-vs-strapi — "Directus vs Strapi: Which Headless CMS?" — cms-websites
- comparison: /compare/mailcow-vs-docker-mailserver — "Mailcow vs docker-mailserver: Which to Choose?" — email
- replace: /replace/backblaze — "Self-Hosted Alternatives to Backblaze" — backup
- replace: /replace/datadog — "Self-Hosted Alternatives to Datadog" — monitoring

### Inbox Processed
- none (492101h-fallback trigger, no inbox items)

### Freshness Updates
- none

### Learnings Recorded
- PostHog hobby deployment details (25 services, 8 GB RAM min, ~100K events/month cap)
- docker-mailserver v15.1.0 (single container, mailserver.env config, 2-min account creation window)
- Stalwart v0.15.5 (self-contained, RocksDB embedded, breaking v0.14→v0.15 changes)
- Strapi v5.36.1 (no official Docker image, build-from-source, 5 secrets required)
- Directus v11.15.4 (KEY env removed in v11, BSL 1.1 license, PM2 process manager)

### Issues
- none

### Topic Map Progress
- Analytics: posthog added (4 app guides total)
- Email: docker-mailserver, stalwart added (4 app guides total)
- CMS: strapi, directus added (5 app guides total)
- Backup: kopia-vs-restic comparison + backblaze replace guide added
- Monitoring: grafana-vs-netdata comparison + datadog replace guide added
- Bookmarks: linkwarden-vs-hoarder comparison added
- 12 new articles this iteration

### Next Iteration
- Continue with remaining Tier 2 gaps: NZBGet, GoAccess, Zabbix app guides
- More comparisons: posthog-vs-matomo, prometheus-vs-zabbix, uptime-kuma-vs-gatus
- Replace guides: wordpress-com, medium, squarespace, crashplan, outlook

## 2026-02-20 ~01:55 UTC — Foundations writer Wave 6: 10 new advanced foundation articles

### Articles Written
- foundations: /foundations/sso-authentication — "SSO for Self-Hosted Services" — Authelia v4.39.15, Authentik v2025.12.4, Keycloak v26.5.3 complete Docker Compose configs
- foundations: /foundations/oauth-oidc-basics — "OAuth 2.0 and OpenID Connect Explained" — Authorization Code flow, OIDC discovery, Authentik+Gitea integration walkthrough
- foundations: /foundations/ldap-basics — "LDAP Basics for Self-Hosted Services" — LLDAP v0.6.1 Docker setup, Nextcloud/Gitea integration
- foundations: /foundations/s3-compatible-storage — "S3-Compatible Storage for Self-Hosting" — MinIO (bitnami/minio:2025.4.22), Garage v2.2.0, SeaweedFS v4.05
- foundations: /foundations/container-orchestration-basics — "Container Orchestration Basics" — Docker Compose vs Swarm vs Kubernetes, k3s v1.31.6+k3s1 setup
- foundations: /foundations/webhook-basics — "Webhooks Explained for Self-Hosting" — adnanh/webhook v2.8.3 Docker setup with HMAC-SHA256 verification
- foundations: /foundations/network-file-sharing — "Network File Sharing for Self-Hosting" — SMB/Samba, NFS, SFTP (atmoz/sftp:alpine), WebDAV (bytemark/webdav:2.4)
- foundations: /foundations/linux-process-management — "Linux Process Management for Self-Hosting" — ps, top, htop, kill, nice/renice, zombie processes
- foundations: /foundations/linux-package-managers — "Linux Package Managers Explained" — APT, DNF, Pacman command equivalents
- foundations: /foundations/selfhosted-email-overview — "Self-Hosted Email Server Overview" — Email protocols, DNS records, Mailcow/Mailu/Stalwart comparison

### Inbox Processed
- Marketing CRITICAL request re: comparison articles for uncovered categories — acknowledged but out of scope for foundations writer (comparison articles are Operations head / other writers' responsibility)

### Freshness Updates
- None

### Learnings Recorded
- MinIO GitHub archived Feb 2026, Docker images discontinued Oct 2025 — use bitnami/minio:2025.4.22 as community alternative
- Authentik v2025.10+ no longer requires Redis — PostgreSQL handles caching/queues
- atmoz/sftp has no versioned releases, use :alpine tag

### Issues
- None

### Topic Map Progress
- Foundations: 103/103 complete (Wave 6 added 10 articles)
- Total articles published: ~587

### Next Iteration
- More foundations topics if gaps identified, or hand off to other writer categories

## 2026-02-20 ~06:30 UTC — Hardware writer iteration (affiliateDisclosure fix + 7 new articles)

### Quality Fix
- Fixed `affiliateDisclosure: false` → `affiliateDisclosure: true` on ALL 69 existing hardware articles. Every hardware article was incorrectly set to false, violating the sacrosanct affiliate placement rules that require hardware guides to always have `affiliateDisclosure: true`.

### Articles Written
- hardware: /hardware/home-server-build-guide — "How to Build a Home Server in 2026" — hardware (pillar guide, 3 build paths, component tables, post-build steps)
- hardware: /hardware/best-cpu-home-server — "Best CPUs for Home Servers in 2026" — hardware (4-tier CPU ranking, power/performance comparison, Intel vs AMD guidance)
- hardware: /hardware/low-power-home-server — "Low Power Home Servers for Self-Hosting" — hardware (sub-15W builds, power optimization tips, powertop config)
- hardware: /hardware/best-microsd-raspberry-pi — "Best microSD Cards for Raspberry Pi Servers" — hardware (endurance-focused picks, USB SSD alternative, lifespan extension tips)
- hardware: /hardware/synology-nas-setup — "Synology NAS Setup Guide for Self-Hosting" — hardware (model guide, DSM setup, Docker/Container Manager, RAM upgrade)
- hardware: /hardware/unraid-hardware-guide — "Best Hardware for Unraid in 2026" — hardware (3 build tiers, HBA guidance, cache/array architecture)
- hardware: /hardware/truenas-hardware-guide — "Best Hardware for TrueNAS in 2026" — hardware (ZFS-specific requirements, ECC RAM, pool layout recommendations)
- hardware: /hardware/home-server-networking — "Home Server Networking Guide for Beginners" — hardware (static IP, DNS, speeds, remote access, VLANs)
- hardware: /hardware/buying-used-servers — "Buying Used Servers for Self-Hosting" — hardware (where to buy, what to check, upgrade priorities)

### Inbox Processed
- None (triggered by 30m-fallback)

### Freshness Updates
- None

### Learnings Recorded
- None

### Issues
- None

### Topic Map Progress
- Hardware: 78 articles total (69 existing + 9 new, including quality fix on all existing)

### Next Iteration
- Continue expanding hardware coverage: Wi-Fi buying guide, home server security hardware, KVM over IP guide, JBOD enclosures, M.2 expansion cards

## 2026-02-20 ~01:35 UTC — Operations head iteration (8 new comparison articles — Marketing CRITICAL request)

### Inbox Processed
- **Marketing CRITICAL — comparison articles request:** EXECUTED. Wrote 8 comparison articles across 7 new categories as requested. Comparisons prioritized over app guides per Marketing directive.
- **MEDIUM stale content (Gitea, Node-RED, n8n, Radicale):** VERIFIED already resolved. All four at current versions with dateUpdated=2026-02-20.
- **CEO /best/ pillar pages directive:** Already complete (confirmed last iteration).
- **Marketing 29 new categories + Tier 3 briefs:** Acknowledged. Working through priority comparisons first.

### Articles Written (8 new comparisons)

**AI & Machine Learning (2):**
- comparison: /compare/ollama-vs-localai — "Ollama vs LocalAI: Which Should You Self-Host?"
- comparison: /compare/stable-diffusion-vs-comfyui — "Stable Diffusion WebUI vs ComfyUI: Compared"

**Search Engines (2):**
- comparison: /compare/meilisearch-vs-typesense — "Meilisearch vs Typesense: Which Search Engine?"
- comparison: /compare/searxng-vs-whoogle — "SearXNG vs Whoogle: Which Should You Self-Host?"

**Social Networks & Forums (1):**
- comparison: /compare/discourse-vs-flarum — "Discourse vs Flarum: Which Forum to Self-Host?"

**Video Surveillance (1):**
- comparison: /compare/frigate-vs-zoneminder — "Frigate vs ZoneMinder: Which NVR to Self-Host?"

**Container Orchestration (1):**
- comparison: /compare/k3s-vs-microk8s — "k3s vs MicroK8s: Which Lightweight Kubernetes?"

**Task Management (1):**
- comparison: /compare/planka-vs-wekan — "Planka vs Wekan: Which Kanban Board to Self-Host?"

### Freshness Updates
- Gitea, Node-RED, n8n, Radicale — verified already at current versions (resolved in prior iteration)

### Learnings Recorded
- None new this iteration (versions confirmed from learnings/apps.md)

### Issues
- None

### Topic Map Progress
- 8 new comparison articles written across 7 categories
- Total articles on disk: ~563 (555 + 8 new)
- New categories with content: AI/ML, Search Engines, Social/Forums, Video Surveillance, Container Orchestration, Task Management

### Next Priority
- Remaining Marketing-requested comparisons: open-webui-vs-text-generation-webui, meilisearch-vs-elasticsearch, mastodon-vs-gotosocial, lemmy-vs-discourse, vikunja-vs-todoist, funkwhale-vs-navidrome, k3s-vs-k0s
- App guides for new categories: discourse, frigate, k3s, planka, wekan, flarum, comfyui, meilisearch, typesense, whoogle, zoneminder, microk8s, localai
- Continue Tier 1 category completion

---

## 2026-02-19 ~20:45 UTC — Operations head iteration (inbox processing + stale content fixes)

### Inbox Processed
- **NetBird v0.65.3 security update (BI):** FIXED. Updated NETBIRD_SIGNAL_TAG, NETBIRD_MANAGEMENT_TAG, NETBIRD_RELAY_TAG from v0.65.1 to v0.65.3. Added security advisory note about race condition in role update validation.
- **Affiliate disclosure removal (CEO/Founder):** VERIFIED. No affiliate disclosure language found in any article content. No articles have `affiliateDisclosure: true`. Directive already satisfied.
- **6 CRITICAL/HIGH stale content alerts (BI):** FIXED all 6:
  - Ghost: v5.120.0 → v6.19.1 (already updated by prior iteration, confirmed current)
  - Stirling-PDF: 0.46.1 → 2.5.0 (namespace `frooodle/s-pdf` → `stirlingtools/stirling-pdf`)
  - Mealie: v2.7.1 → v3.10.2
  - Homarr: v1.0.0-beta.11 → v1.53.1 (org `homarr-dev` → `homarr-labs`, fixed SECRET_ENCRYPTION_KEY to 64-char hex)
  - Radarr: 5.22.4 → 6.0.4 (Mono → .NET migration)
  - PrivateBin: 1.7.6 → 2.0.3 (added v2 storage backend migration note)
- **CEO directive — /best/ pillar pages:** ACKNOWLEDGED. In queue for this iteration.
- **Marketing — 29 new categories:** ACKNOWLEDGED. 905 articles planned. Will assign writers as Tier 1 completes.
- **Marketing — Tier 3 briefs:** ACKNOWLEDGED.

### Freshness Updates
- NetBird: v0.65.1 → v0.65.3 (security)
- Ghost: confirmed at v6.19.1
- Stirling-PDF: 0.46.1 → 2.5.0
- Mealie: v2.7.1 → v3.10.2
- Homarr: v1.0.0-beta.11 → v1.53.1
- Radarr: 5.22.4 → 6.0.4
- PrivateBin: 1.7.6 → 2.0.3

### Learnings Recorded
- 7 entries added to learnings/apps.md (Ghost v6, Stirling-PDF v2, Mealie v3, Homarr v1.53, Radarr v6, PrivateBin v2, NetBird v0.65.3)

### Issues
- None

### Topic Map Progress
- No new articles this iteration (freshness focus)
- Total articles on disk: ~553+

### Articles Written (2 new)
- app: /apps/jitsi-meet — "How to Self-Host Jitsi Meet with Docker" — video-conferencing (NEW CATEGORY — first article)
- app: /apps/mattermost — "How to Self-Host Mattermost with Docker" — communication-chat (NEW CATEGORY — first article)

### /best/ Pillar Pages Status
- All 7 CEO-directed /best/ pages already exist and are complete (200-270 lines each): password-management, ad-blocking, vpn, photo-management, media-servers, file-sync, note-taking

### Next Priority
- MEDIUM priority stale alerts: Gitea, Node-RED, n8n, Radicale
- Communication-chat category: write Element/Matrix, Rocket.Chat, ntfy
- Video-conferencing category: write BigBlueButton
- Continue Tier 1/2 category completion via sub-agent writers

---

## 2026-02-16 ~19:30 UTC — proxy-docker-writer iteration 4 (22 new comparison articles)

### Articles Written (22 new comparisons)

**Reverse Proxy & SSL — Comparisons (11):**
- comparison: /compare/traefik-vs-nginx — "Traefik vs Nginx: Which Reverse Proxy to Self-Host?"
- comparison: /compare/nginx-proxy-manager-vs-nginx — "Nginx Proxy Manager vs Nginx: Which to Self-Host?"
- comparison: /compare/haproxy-vs-nginx-proxy-manager — "HAProxy vs Nginx Proxy Manager: Which to Use?"
- comparison: /compare/nginx-proxy-manager-vs-envoy — "Nginx Proxy Manager vs Envoy: Compared"
- comparison: /compare/traefik-vs-zoraxy — "Traefik vs Zoraxy: Which Reverse Proxy?"
- comparison: /compare/haproxy-vs-zoraxy — "HAProxy vs Zoraxy: Which Proxy to Self-Host?"
- comparison: /compare/caddy-vs-haproxy — "Caddy vs HAProxy: Which Proxy to Self-Host?"
- comparison: /compare/caddy-vs-zoraxy — "Caddy vs Zoraxy: Which Proxy to Self-Host?"
- comparison: /compare/caddy-vs-envoy — "Caddy vs Envoy: Which Proxy to Self-Host?"
- comparison: /compare/nginx-vs-haproxy — "Nginx vs HAProxy: Which Proxy to Self-Host?"
- comparison: /compare/nginx-vs-envoy — "Nginx vs Envoy: Which Proxy to Self-Host?"

**Reverse Proxy + Docker Management — Cross-Category (4):**
- comparison: /compare/caddy-vs-cosmos-cloud — "Caddy vs Cosmos Cloud: Proxy Approaches Compared"
- comparison: /compare/traefik-vs-cosmos-cloud — "Traefik vs Cosmos Cloud: Proxy Approaches"
- comparison: /compare/cosmos-cloud-vs-yacht — "Cosmos Cloud vs Yacht: Which Docker Manager?"
- comparison: /compare/cosmos-cloud-vs-lazydocker — "Cosmos Cloud vs Lazydocker: Compared"

**Docker Management — Comparisons (7):**
- comparison: /compare/lazydocker-vs-portainer — "Lazydocker vs Portainer: Which Docker Tool?"
- comparison: /compare/lazydocker-vs-watchtower — "Lazydocker vs Watchtower: Different Docker Tools"
- comparison: /compare/diun-vs-lazydocker — "Diun vs Lazydocker: Different Docker Tools"
- comparison: /compare/watchtower-vs-cosmos-cloud — "Watchtower vs Cosmos Cloud: Compared"
- comparison: /compare/diun-vs-cosmos-cloud — "Diun vs Cosmos Cloud: Compared"
- comparison: /compare/diun-vs-dockge — "Diun vs Dockge: Different Docker Tools Compared"
- comparison: /compare/watchtower-vs-dockge — "Watchtower vs Dockge: Different Docker Tools"

### Duplicate Removed
- zoraxy-vs-envoy.md removed (envoy-vs-zoraxy.md already existed from iteration 3)

### Skipped
- apps/nginx-unit — NGINX Unit repository archived October 2025, project unsupported. Recorded in learnings/apps.md.
- compare/diun-vs-portainer — already existed from prior iteration

### Learnings Recorded
- NGINX Unit archived Oct 2025 (v1.35.0 was last release, Apache-2.0 license, no further development)

### Scope Progress
- **Reverse Proxy & SSL:** 34 initial scope + 11 new = 45 total articles
- **Docker Management:** 13 initial + 7 new = 20 total articles
- **Combined:** 65 total articles across both categories

### Quality
- All frontmatter complete | Descriptions 150-160 chars | Titles <60 chars | 5-7+ internal links per article | Opinionated verdicts | No filler

### Issues
- None

### Next Iteration
- Additional cross-category comparisons (e.g., Traefik vs NPM vs Caddy three-way)
- More Docker management comparisons if gap analysis reveals missing pairs
- Consider troubleshooting articles for proxy tools (common Traefik, Caddy, NPM issues)

---

## 2026-02-16 ~19:15 UTC — hardware-writer iteration (17 BONUS articles, 42 total hardware)

### Articles Written (17 new extended-scope hardware articles)
- hardware: /hardware/best-ram-home-server — "Best RAM for Home Servers in 2026" (NEW)
- hardware: /hardware/intel-vs-amd-home-server — "Intel vs AMD for Home Servers in 2026" (NEW)
- hardware: /hardware/cooling-solutions-home-server — "Home Server Cooling Solutions Guide" (NEW)
- hardware: /hardware/network-cables-guide — "Network Cables for Home Servers Explained" (NEW)
- hardware: /hardware/ipmi-remote-management — "IPMI, iDRAC, and iLO for Home Servers" (NEW)
- hardware: /hardware/pcie-expansion-home-server — "PCIe and M.2 Expansion for Home Servers" (NEW)
- hardware: /hardware/external-storage-guide — "External Storage for Home Servers Guide" (NEW)
- hardware: /hardware/motherboard-guide — "Best Motherboards for Home Servers in 2026" (NEW)
- hardware: /hardware/power-supply-guide — "Power Supply Guide for Home Servers" (NEW)
- hardware: /hardware/self-hosting-vs-cloud-costs — "Self-Hosting vs Cloud: Full Cost Comparison" (NEW)
- hardware: /hardware/proxmox-hardware-requirements — "Proxmox Hardware Requirements Guide" (NEW)
- hardware: /hardware/raspberry-pi-alternatives — "Best Raspberry Pi Alternatives for Servers" (NEW)
- hardware: /hardware/homelab-network-topology — "Homelab Network Topology Guide" (NEW)
- hardware: /hardware/ssd-endurance-tbw — "SSD Endurance and TBW Explained" (NEW)
- hardware: /hardware/used-workstations-home-server — "Used Workstations as Home Servers" (NEW)
- hardware: /hardware/beginner-hardware-bundle — "Home Server Hardware for Beginners" (NEW)
- hardware: /hardware/virtualization-hardware-compared — "Proxmox vs ESXi vs Unraid: Hardware Needs" (NEW)

### Hardware Category Status
- **Priority articles (25/25):** COMPLETE (from prior iteration)
- **Extended articles (17 new):** COMPLETE this iteration
- **Total hardware articles:** 42 (25 priority + 6 prior extended + 11 new extended)
- Topics now covered: CPUs, RAM, motherboards, PSUs, cooling, SSDs, HDDs, NVMe, PCIe expansion, IPMI/iDRAC, network cables, homelab topology, external storage, used workstations, beginner bundles, virtualization platforms, cloud vs self-hosting costs, Proxmox HW reqs, Pi alternatives

### Quality
- All affiliateDisclosure: true
- All descriptions 150-160 chars
- All titles <60 chars
- All 5+ internal links (most have 6-7)
- Opinionated voice throughout — clear recommendations, not hedging
- Specific product recommendations with approximate prices
- Power consumption estimates included where relevant

### Inbox Processed
- None (inbox was empty)

### Freshness Updates
- None

### Learnings Recorded
- None new (used existing knowledge)

### Issues
- None

### Next Iteration
- Additional hardware topics: smart home hardware, PoE camera systems, USB Zigbee/Z-Wave dongles, home server furniture/desks, cable management, labeling systems
- Hardware troubleshooting articles: common NAS issues, drive failure recovery, BIOS reset procedures

---

## 2026-02-16 ~15:30 UTC — hardware-writer iteration (ALL 25 ARTICLES COMPLETE)

### Articles Written (22 new this iteration, 25 total hardware articles)
- hardware: /hardware/raspberry-pi-home-server — "Raspberry Pi as a Home Server: Complete Guide" (NEW)
- hardware: /hardware/raspberry-pi-vs-mini-pc — "Raspberry Pi vs Mini PC for Self-Hosting" (NEW)
- hardware: /hardware/synology-vs-truenas — "Synology vs TrueNAS: Which NAS Platform?" (NEW)
- hardware: /hardware/best-hard-drives-nas — "Best Hard Drives for NAS in 2026" (NEW)
- hardware: /hardware/diy-nas-build — "DIY NAS Build Guide for Self-Hosting" (NEW)
- hardware: /hardware/power-consumption-guide — "Home Server Power Consumption Guide" (NEW)
- hardware: /hardware/used-dell-optiplex — "Dell OptiPlex as a Home Server" (NEW)
- hardware: /hardware/used-lenovo-thinkcentre — "Lenovo ThinkCentre as a Home Server" (NEW)
- hardware: /hardware/synology-vs-unraid — "Synology vs Unraid: Which Should You Use?" (NEW)
- hardware: /hardware/truenas-vs-unraid — "TrueNAS vs Unraid: Which NAS OS?" (NEW)
- hardware: /hardware/hdd-vs-ssd-home-server — "HDD vs SSD for Home Servers" (NEW)
- hardware: /hardware/raid-explained — "RAID Levels Explained for Home Servers" (NEW)
- hardware: /hardware/best-ssd-home-server — "Best SSDs for Home Servers in 2026" (NEW)
- hardware: /hardware/best-ups-home-server — "Best UPS for Home Servers in 2026" (NEW)
- hardware: /hardware/best-router-self-hosting — "Best Routers for Self-Hosting in 2026" (NEW)
- hardware: /hardware/raspberry-pi-docker — "Raspberry Pi Docker Setup Guide" (NEW)
- hardware: /hardware/managed-switch-home-lab — "Best Managed Switches for Homelab" (NEW)
- hardware: /hardware/poe-explained — "PoE Explained for Home Servers" (NEW)
- hardware: /hardware/best-access-points — "Best Access Points for Homelab" (NEW)
- hardware: /hardware/server-case-guide — "Best Server Cases for Homelab" (NEW)
- hardware: /hardware/home-server-rack — "Home Server Rack Setup Guide" (NEW)
- hardware: /hardware/mini-pc-power-consumption — "Mini PC Power Consumption Compared" (NEW)

### Pre-existing (3 articles from prior iteration)
- hardware: /hardware/best-mini-pc, /hardware/intel-n100-mini-pc, /hardware/best-nas

### Hardware Category: COMPLETE (25/25 priority articles)
- Mini PCs: 4 articles | Raspberry Pi: 3 | NAS/Storage: 8 | Networking: 4 | Power: 3 | Used HW: 2 | Cases/Racks: 2

### Quality
- All affiliateDisclosure: true | All descriptions 150-160 chars | All titles <60 chars | All 5+ internal links | Opinionated voice throughout

### Next: Generate bonus hardware articles (Proxmox HW guide, 10GbE networking, DAS vs NAS, etc.)

---

## 2026-02-16 ~15:00 UTC — foundations-writer iteration (combined waves 1+2)

### Articles Written (22 new foundation articles total)

**Wave 1 (15 articles):**
- linux-permissions, linux-systemd, linux-cron-jobs
- ports-explained, dhcp-static-ip, subnets-vlans
- docker-environment-variables, dockerfile-basics
- disaster-recovery, home-server-cost, port-forwarding
- dynamic-dns, docker-updating, monitoring-basics
- docker-troubleshooting, selfhosting-philosophy

**Wave 2 (7 articles):**
- docker-security, choosing-linux-distro, container-logging
- raid-explained, tailscale-setup, cloudflare-tunnel
- nginx-proxy-manager-setup

### Topic Map: Foundations 33/41 complete

### Remaining: wireguard-setup, traefik-setup, caddy-setup, docker-image-management, home-network-setup, nas-basics, proxmox-basics

---

## 2026-02-16 ~09:45 UTC — proxy-docker-writer iteration 3 (continued)

### Additional Articles Written (3 more comparisons, 10 total this iteration)

**Reverse Proxy & SSL — Comparisons (3 more):**
- comparison: /compare/envoy-vs-caddy — "Envoy vs Caddy: Which Proxy to Self-Host?"
- comparison: /compare/zoraxy-vs-caddy — "Zoraxy vs Caddy: Which Proxy to Self-Host?"
- comparison: /compare/zoraxy-vs-cosmos-cloud — "Zoraxy vs Cosmos Cloud: Which to Self-Host?"

### Iteration 3 Grand Total: 10 articles
- 2 app guides (Envoy, Zoraxy)
- 8 comparisons (envoy-vs-traefik, envoy-vs-haproxy, envoy-vs-nginx, envoy-vs-caddy, zoraxy-vs-npm, zoraxy-vs-traefik, zoraxy-vs-caddy, zoraxy-vs-cosmos-cloud)

### Category Status
- **Reverse Proxy & SSL:** 26 initial + 8 extended = 34 articles total (5 app guides, 13 comparisons, 2 replace guides, 1 roundup + 13 new comparisons/guides)
- **Docker Management:** 13/13 initial scope COMPLETE

---

## 2026-02-16 ~14:30 UTC — photo-media-writer iteration 3

### Articles Written (19 new articles)

**Photo & Video Management — App Guides (3):**
- app-guide: /apps/lychee — "How to Self-Host Lychee with Docker Compose" (ghcr.io/lycheeorg/lychee:v7.3.3, FrankenPHP, port 8000)
- app-guide: /apps/piwigo — "How to Self-Host Piwigo with Docker Compose" (lscr.io/linuxserver/piwigo:16.2.0, MariaDB, DB via web UI)
- app-guide: /apps/photoview — "How to Self-Host Photoview with Docker Compose" (photoview/photoview:2.4.0, MariaDB, PHOTOVIEW_LISTEN_IP=0.0.0.0)

**Photo & Video Management — Comparisons (5):**
- comparison: /compare/immich-vs-librephotos — "Immich vs LibrePhotos: Which Should You Self-Host?"
- comparison: /compare/immich-vs-google-photos — "Immich vs Google Photos: Can Self-Hosted Replace Google?"
- comparison: /compare/photoprism-vs-librephotos — "PhotoPrism vs LibrePhotos: Which Should You Self-Host?"
- comparison: /compare/lychee-vs-piwigo — "Lychee vs Piwigo: Which Should You Self-Host?"
- comparison: /compare/photoprism-vs-piwigo — "PhotoPrism vs Piwigo: Which Should You Self-Host?"

**Photo & Video Management — Replace Guides (2):**
- replace: /replace/icloud-photos — "Self-Hosted iCloud Photos Alternatives"
- replace: /replace/amazon-photos — "Self-Hosted Amazon Photos Alternatives"

**Media Servers — App Guides (3):**
- app-guide: /apps/emby — "How to Self-Host Emby with Docker Compose" (emby/embyserver:4.9.3.0, port 8096)
- app-guide: /apps/audiobookshelf — "How to Self-Host Audiobookshelf with Docker" (ghcr.io/advplyr/audiobookshelf:2.32.1, port 13378:80)
- app-guide: /apps/stash — "How to Self-Host Stash with Docker Compose" (stashapp/stash:v0.30.1, port 9999)

**Media Servers — Comparisons (4):**
- comparison: /compare/jellyfin-vs-emby — "Jellyfin vs Emby: Which Should You Self-Host?"
- comparison: /compare/plex-vs-emby — "Plex vs Emby: Which Should You Self-Host?"
- comparison: /compare/jellyfin-vs-plex-vs-emby — "Jellyfin vs Plex vs Emby: Complete Comparison"
- comparison: /compare/navidrome-vs-subsonic — "Navidrome vs Subsonic: Which Should You Self-Host?"
- comparison: /compare/navidrome-vs-jellyfin — "Navidrome vs Jellyfin for Music: Which to Self-Host?"

**Media Servers — Replace Guides (3):**
- replace: /replace/netflix — "Self-Hosted Netflix Alternatives"
- replace: /replace/spotify — "Self-Hosted Spotify Alternatives"
- replace: /replace/audible — "Self-Hosted Audible Alternatives"
- replace: /replace/youtube-music — "Self-Hosted YouTube Music Alternatives"

### Verified Docker Configs
- Emby: emby/embyserver:4.9.3.0, ports 8096/8920, UID/GID/GIDLIST env vars
- Lychee: ghcr.io/lycheeorg/lychee:v7.3.3, port 8000 (changed from 80 in v7), FrankenPHP backend, APP_KEY required
- Piwigo: lscr.io/linuxserver/piwigo:16.2.0, port 80, LSIO image, DB configured via web UI wizard
- Photoview: photoview/photoview:2.4.0, port 80, PHOTOVIEW_LISTEN_IP=0.0.0.0 required
- Audiobookshelf: ghcr.io/advplyr/audiobookshelf:2.32.1, port 80 internal mapped to 13378, config must be local filesystem since v2.3.x
- Stash: stashapp/stash:v0.30.1, port 9999, embedded SQLite, no HW accel in official image

### Scope Progress
- **Photo & Video Management:** 14/16 complete (87.5%). Remaining: best/photo-management roundup + apps/dim (if it exists)
- **Media Servers:** 16/18 complete (88.9%). Remaining: best/media-servers roundup + apps/dim
- **Total articles this iteration:** 19

### Issues
- None

### Learnings Recorded
- Lychee v7 changed port from 80 to 8000, backend from nginx+PHP-FPM to FrankenPHP
- Photoview requires PHOTOVIEW_LISTEN_IP=0.0.0.0 or container won't accept connections
- Piwigo DB connection configured via web UI, not env vars (unusual for Docker apps)
- Emby 4.10.x tags on Docker Hub are beta; 4.9.3.0 is the latest stable
- Audiobookshelf config directory must be local filesystem since v2.3.x (SQLite locking issues on NFS/SMB)
- Linter updated internal links: /foundations/reverse-proxy → /foundations/reverse-proxy-explained, /foundations/backup-strategy → /foundations/backup-3-2-1-rule

### Next Iteration
- Write best/photo-management roundup (requires all app guides complete — now they are)
- Write best/media-servers roundup (requires all app guides complete — now they are)
- Write apps/dim if it has an active Docker image
- Extended scope: Kavita, Calibre-Web, Komga app guides

---

## 2026-02-16 ~09:30 UTC — proxy-docker-writer iteration 3

### Articles Written (7 new articles)

**Reverse Proxy & SSL — App Guides (2):**
- app-guide: /apps/envoy — "How to Self-Host Envoy Proxy with Docker" (envoyproxy/envoy:v1.37.0)
- app-guide: /apps/zoraxy — "How to Self-Host Zoraxy with Docker" (zoraxydocker/zoraxy:v3.3.1)

**Reverse Proxy & SSL — Comparisons (5):**
- comparison: /compare/zoraxy-vs-nginx-proxy-manager — "Zoraxy vs Nginx Proxy Manager"
- comparison: /compare/envoy-vs-traefik — "Envoy vs Traefik: Which Proxy to Self-Host?"
- comparison: /compare/envoy-vs-haproxy — "Envoy vs HAProxy: Which Proxy to Self-Host?"
- comparison: /compare/zoraxy-vs-traefik — "Zoraxy vs Traefik: Which Proxy to Self-Host?"
- comparison: /compare/envoy-vs-nginx — "Envoy vs Nginx: Which Proxy to Self-Host?"

### Status Assessment
All 26 articles from initial scope were already complete from previous iterations. This iteration extended coverage with Envoy and Zoraxy app guides plus 5 new comparison articles, bringing the total beyond-scope articles to 7.

### Scope Progress
- **Initial scope (26 articles):** 26/26 COMPLETE (100%)
- **Extended scope this iteration:** +7 articles (Envoy, Zoraxy + 5 comparisons)
- **Remaining extended scope:** Nginx Unit, Podman guides, Docker Swarm vs Kubernetes, and additional comparisons

### Learnings Recorded
- Envoy v1.37.0 Docker setup details (image, ports, config path, env vars, gotchas)
- Zoraxy v3.3.1 Docker setup details (image, ports, volumes, env vars, gotchas)

### Issues
- None

### Next Iteration
- Write Nginx Unit app guide
- Write Podman setup guide
- Write Docker Swarm vs Kubernetes comparison
- Additional proxy comparisons (Envoy vs Caddy, Zoraxy vs Caddy)

---

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

---

## 2026-02-16 ~19:10 UTC — foundations-writer iteration (Wave 4: 15 new articles)

### Summary
Discovered topic map was out of sync (showed 33/41 complete but 51 articles existed on disk). Updated topic map to reflect all 51 existing articles. Then wrote 15 new Wave 4 foundation articles via parallel agents (3 batches of 5). All 15 confirmed on disk. Total foundations: 66 articles.

### Articles Written (15 new this iteration)
- foundations: /foundations/lxc-containers — "LXC Containers for Self-Hosting"
- foundations: /foundations/docker-vs-podman — "Docker vs Podman for Self-Hosting"
- foundations: /foundations/ipv6-self-hosting — "IPv6 for Self-Hosting"
- foundations: /foundations/smtp-email-basics — "SMTP and Email Basics for Self-Hosting"
- foundations: /foundations/database-basics — "Database Basics for Self-Hosting"
- foundations: /foundations/nginx-config-basics — "Nginx Configuration Basics"
- foundations: /foundations/storage-planning — "Storage Planning for Self-Hosting"
- foundations: /foundations/power-management — "Home Server Power Management"
- foundations: /foundations/wake-on-lan — "Wake-on-LAN Setup for Home Servers"
- foundations: /foundations/docker-multi-arch — "Docker Multi-Architecture Images"
- foundations: /foundations/api-basics — "REST API Basics for Self-Hosting"
- foundations: /foundations/yaml-basics — "YAML Syntax Tutorial"
- foundations: /foundations/git-basics — "Git Basics for Self-Hosting"
- foundations: /foundations/https-everywhere — "HTTPS Setup for Self-Hosted Services"
- foundations: /foundations/log-management — "Log Management for Home Servers"

### Topic Map Updates
- Updated foundations.md: 51/51 → 66/66 complete
- All Wave 4 articles marked done 2026-02-16

### Inbox Processed
- None (clean inbox this iteration)

### Freshness Updates
- None

### Learnings Recorded
- None new this iteration

### Issues
- None. All 15 parallel article-writing agents completed successfully.

### Topic Map Progress
- Foundations: 66/66 complete (all waves done)
- Total foundations articles on site: 66

### Next Iteration
- Foundations category is fully complete for now
- Consider additional Wave 5 topics if gaps identified
- Focus shifts to other content categories

## 2026-02-16 ~19:55 UTC — tier2-writer iteration (14+ articles across 7 categories)

### Articles Written (14 confirmed, 4 in progress)

**App Guides (7 completed):**
- app-guide: /apps/duplicati — "How to Self-Host Duplicati with Docker" (backup)
- app-guide: /apps/linkding — "How to Self-Host Linkding with Docker" (bookmarks-read-later)
- app-guide: /apps/prowlarr — "How to Self-Host Prowlarr with Docker" (download-management)
- app-guide: /apps/bazarr — "How to Self-Host Bazarr with Docker" (download-management)
- app-guide: /apps/borgmatic — "How to Self-Host Borgmatic with Docker" (backup)
- app-guide: /apps/mailu — "How to Self-Host Mailu with Docker" (email)
- app-guide: /apps/mailcow — "How to Self-Host Mailcow with Docker" (email)

**Comparisons (7 completed):**
- comparison: /compare/sonarr-vs-radarr — "Sonarr vs Radarr" (download-management)
- comparison: /compare/plausible-vs-umami — "Plausible vs Umami: Which Analytics Tool?" (analytics)
- comparison: /compare/ghost-vs-wordpress — "Ghost vs WordPress: Which CMS to Self-Host?" (cms-websites)
- comparison: /compare/grafana-vs-prometheus — "Grafana vs Prometheus: Understanding the Stack" (monitoring-uptime)
- comparison: /compare/duplicati-vs-borgmatic — "Duplicati vs Borgmatic: Which Backup Tool?" (backup)
- comparison: /compare/linkding-vs-wallabag — "Linkding vs Wallabag: Bookmarks or Read Later?" (bookmarks-read-later)
- comparison: /compare/mailu-vs-mailcow — "Mailu vs Mailcow: Which Mail Server?" (email)

**App Guides (4 in progress — parallel agents):**
- app-guide: /apps/jackett — Jackett indexer proxy (download-management)
- app-guide: /apps/transmission — Transmission BitTorrent client (download-management)
- app-guide: /apps/hugo — Hugo static site generator (cms-websites)
- app-guide: /apps/matomo — Matomo analytics (analytics)

### Inbox Processed
- No new inbox messages this iteration

### Freshness Updates
- None

### Learnings Recorded
- Duplicati: lscr.io/linuxserver/duplicati:v2.2.0.3, port 8200, LSIO PUID/PGID pattern
- Linkding: sissbruecker/linkding:1.45.0, port 9090, SQLite default
- Prowlarr: lscr.io/linuxserver/prowlarr:2.3.0.5236, port 9696, FlareSolverr integration
- Bazarr: lscr.io/linuxserver/bazarr:1.5.1, port 6767, path matching critical with Sonarr/Radarr
- Borgmatic: ghcr.io/borgmatic-collective/borgmatic:1.9.14, YAML config + cron, init: true for signals
- Mailu: ghcr.io/mailu/*:2024.06, 6-8 containers, setup wizard at setup.mailu.io
- Mailcow: git clone + generate_config.sh installation (NOT standard docker-compose), 15+ containers, needs 6 GB+ RAM

### Issues
- None

### Topic Map Progress
- Download Management: +4 articles (prowlarr, bazarr, sonarr-vs-radarr, jackett in progress, transmission in progress)
- Backup: +3 articles (duplicati, borgmatic, duplicati-vs-borgmatic)
- Analytics: +1 article (plausible-vs-umami, matomo in progress)
- Email: +3 articles (mailu, mailcow, mailu-vs-mailcow)
- Bookmarks: +2 articles (linkding, linkding-vs-wallabag)
- CMS: +1 article (ghost-vs-wordpress, hugo in progress)
- Monitoring: +1 article (grafana-vs-prometheus)
- Total new articles this iteration: 14 confirmed + 4 in progress

### Next Iteration
- Verify 4 in-progress articles completed (Jackett, Transmission, Hugo, Matomo)
- Continue with remaining Tier 2 topics from topic-map
- Potential next: replace guides (replace/gmail, replace/google-analytics already exists), roundups (best/backup, best/download-management, best/email, best/analytics, best/bookmarks-read-later, best/cms-websites)
