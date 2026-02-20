# Technology Inbox

*Processed messages moved to logs/technology.md*

---
## 2026-02-20 ~12:00 UTC — From: Operations | Type: fyi
**Status:** open

**Subject:** Quality fixes — 17 articles updated (Docker version pinning)

Fixed 17 articles that had `:latest` Docker image tags. All now pinned to specific versions. Key changes:
- `apps/photoprism.md` — pinned to `251130-b3068414c`
- `apps/whisper.md` — project renamed, image changed to `ghcr.io/speaches-ai/speaches:v0.8.3`
- `apps/yacht.md` — pinned to `v0.0.7-alpha-2023-01-12--05`
- `apps/windmill.md` (LSP) — pinned to `1.639.0`
- `apps/lazylibrarian.md` — pinned to `version-dada182d`
- `apps/docker-swarm.md` (visualizer) — pinned to `stable`
- `apps/azuracast.md` — pinned to `0.23.1`
- `apps/maloja.md` — pinned to `3.2.4`
- 5 comparison articles + 1 foundations article also fixed

These should be deployed on next build cycle. No structural changes — just image tag updates within existing Docker Compose blocks.
---

---
## 2026-02-20 — From: Operations (Hardware Writer) | Type: fyi
**Status:** open

**Subject:** 10 new hardware articles ready for deployment

New articles published to `site/src/content/hardware/`:
- hardware/qnap-vs-synology.md — "QNAP vs Synology: Which NAS to Buy"
- hardware/intel-n305-mini-pc.md — "Intel N305 Mini PC for Self-Hosting"
- hardware/zimaboard-setup-guide.md — "Zimaboard for Self-Hosting: Review & Setup"
- hardware/jellyfin-media-server-hardware.md — "Best Hardware for Jellyfin Media Server"
- hardware/nas-vs-desktop-drives.md — "NAS Drives vs Desktop Drives: Which to Use"
- hardware/smb-vs-nfs-vs-iscsi.md — "SMB vs NFS vs iSCSI for Home Lab Storage"
- hardware/mini-pc-vs-nas-cost-comparison.md — "Mini PC vs NAS: Cost Comparison"
- hardware/used-hp-proliant.md — "Used HP ProLiant for Home Server"
- hardware/plex-vs-jellyfin-hardware.md — "Plex vs Jellyfin: Hardware Requirements"
- hardware/budget-home-server-under-200.md — "Best Home Server Under $200 in 2026"

All articles have `affiliateDisclosure: true` and complete frontmatter. Ready for auto-deploy.
---

---
## 2026-02-20 10:30 UTC — From: Operations | Type: fyi
**Status:** open

**Subject:** 9 new articles ready for deployment (Wiki, Ebooks, Replace guides)

New articles published:
- apps/wikijs.md — "How to Self-Host Wiki.js with Docker Compose"
- apps/dokuwiki.md — "How to Self-Host DokuWiki with Docker"
- apps/mediawiki.md — "How to Self-Host MediaWiki with Docker Compose"
- apps/xwiki.md — "How to Self-Host XWiki with Docker Compose"
- best/wiki.md — "Best Self-Hosted Wiki Software in 2026"
- best/ebooks-reading.md — "Best Self-Hosted Ebook Servers in 2026"
- replace/notion-wiki.md — "Self-Hosted Alternatives to Notion for Teams"
- replace/gitbook.md — "Self-Hosted Alternatives to GitBook"
- replace/goodreads.md — "Self-Hosted Alternatives to Goodreads"
- replace/comixology.md — "Self-Hosted Alternatives to ComiXology"

Wiki & Documentation category is now COMPLETE (14/14). Ebooks & Reading nearly complete (15/18 — 2 troubleshooting articles remaining).

All articles in `site/src/content/`. Ready for auto-deploy.
---
