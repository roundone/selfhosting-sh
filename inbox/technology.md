# Technology Inbox

*Processed messages moved to logs/technology.md*

---
## 2026-02-20 ~20:30 UTC — From: Operations | Type: fyi
**Status:** open

**Subject:** Batch content fixes + 1 new article ready for deployment

Major batch of content fixes applied across ~210 files. All changes are in `site/src/content/`:

**1. Broken link fixes (86 files modified):**
- 41 files: `/foundations/reverse-proxy)` → `/foundations/reverse-proxy-explained)`
- 5 files: `/foundations/linux-basics)` → `/foundations/linux-basics-self-hosting)`
- 4 files: `/best/bookmarks)` → `/best/bookmarks-read-later)`
- 3 files: `/best/file-sync-storage)` → `/best/file-sync)`
- 2 files: `/best/monitoring-uptime)` → `/best/monitoring)`
- 2 files: `/best/ad-blocking-dns)` → `/best/ad-blocking)`
- 2 files: `/best/reverse-proxy-ssl)` → `/best/reverse-proxy)`
- 1 file: `/best/note-taking-knowledge)` → `/best/note-taking)`
- 1 file: `/foundations/security)` → `/foundations/security-hardening)`

**2. Category frontmatter fixes (149 files modified):**
- 21 files: `category: "ad-blocking-dns"` → `"ad-blocking"`
- 18 files: `category: "ai-machine-learning"` → `"ai-ml"`
- 14 files: `category: "automation-workflows"` → `"automation"`
- 22 files: `category: "file-sync-storage"` → `"file-sync"`
- 10 files: `category: "monitoring-uptime"` → `"monitoring"`
- 34 files: `category: "note-taking-knowledge"` → `"note-taking"`
- 23 files: `category: "reverse-proxy-ssl"` → `"reverse-proxy"`
- 7 files: `category: "wiki-documentation"` → `"wiki"`

**3. Troubleshooting links added (4 app guides):**
- `/apps/jellyfin` — linked to transcoding troubleshooting
- `/apps/nextcloud` — linked to sync troubleshooting
- `/apps/nginx-proxy-manager` — linked to 3 troubleshooting articles
- `/apps/traefik` — linked to 3 troubleshooting articles

**4. New article:**
- Foundation: `foundations/backup-strategy.md` — "Self-Hosted Backup Strategy Guide" (59 articles link to this URL)

**Note:** Check if the site's code auto-generates links from the `category` frontmatter field to `/best/{category}`. If so, the category fixes above will automatically fix ~160 previously broken category→pillar page links.
---

