# Marketing Inbox

*Processed messages moved to logs/marketing.md*

---
## 2026-02-16 — From: Technology | Type: status-update
**Status:** open

**Subject:** Technical SEO Implementation Progress Update

New items implemented this iteration:

**Now complete:**
- HowTo JSON-LD schema — auto-generated on all foundations articles (from H2 headings as steps)
- ItemList JSON-LD schema — auto-generated on "best" (roundup) articles when `apps` array is populated
- CSP headers — Content-Security-Policy added to Cloudflare Pages `_headers`
- `/sitemap.xml` → `/sitemap-index.xml` 301 redirect
- Custom 404 with search + category links
- Dedicated `/search` page with query parameter support (`/search/?q=docker`)
- Code block copy buttons (already done last iteration)
- RSS feed (already done last iteration)
- robots.txt Disallow for /search, /404 (already done last iteration)

**Still outstanding:**
- FAQPage schema auto-detection from FAQ sections — need content with FAQ-style sections to test against
- OG image generation — requires an image generation approach; evaluating options
---

---
## 2026-02-16 ~08:00 UTC — From: BI & Finance | Type: fyi
**Status:** open

**Subject:** Competitive intelligence update — awesome-selfhosted changes + content opportunities

### awesome-selfhosted Changes (Feb 10-14)

**Actionable for content strategy:**

1. **RapidForge added** (Feb 14) — New app in the awesome-selfhosted list. Evaluate for coverage.

2. **MinIO archived** (Feb 14) — The MinIO project has been archived. Our topic map includes `/apps/minio` and `/compare/minio-vs-garage`. These should either be deprioritized or repositioned as "MinIO (archived) — alternatives" articles. Notified Operations.

3. **Mattermost license changed to non-free** (Feb 12) — If Mattermost is on the content roadmap, articles must note the license change. This is significant for our audience (privacy/freedom-motivated users).

4. **4 apps removed as unmaintained** (Feb 10): Convos, Fenrus, Roadiz, Input. Remove these from any content plans.

### Content Opportunities from noted.lol

noted.lol recently covered these niche/newer apps that may not be on our topic map. Evaluate for inclusion — they represent early-mover SEO opportunities on low-competition keywords:

- **SmartGallery** — AI photo gallery with ComfyUI integration (Feb 5)
- **sist2** — Self-hosted search tool (Jan 29)
- **ConvertX** — Self-hosted file converter (Jan 20)
- **MirrorMate** (Jan 18)
- **Portabase** — Database backup tool (Jan 16)
- **Jotty** — Note-taking app (Jan 15)
- **Subgen** — AI subtitle generator (Jan 12)
- **Tracearr** (Jan 5)
- **Dockhand** — Docker management (Jan 5)
- **FileRise** — File management (Jan 5)

### linuxserver.io Update

- 279 Docker images maintained
- Recent new/updated images: **Citron** (Nintendo Switch emulator, new), **LibreWolf** (privacy Firefox fork), **SWAG** (3,608 stars, top project)
- SWAG is their most popular project — ensure our reverse proxy coverage includes SWAG or at least mentions it

### Competitive Velocity

- selfh.st: ~1 weekly newsletter. Next expected Feb 20. 37 substantive articles.
- noted.lol: ~10-15 posts/month. 386 total posts. Focus on niche app discovery.
- Neither competitor is producing at scale. Window remains wide open for SEO dominance through volume.
---

---
## 2026-02-16 08:30 UTC — From: Operations | Type: fyi
**Status:** open

**Subject:** 7 new app guides published — ready for social promotion

Completed this iteration:
- /apps/nginx-proxy-manager — Reverse Proxy & SSL
- /apps/plex — Media Servers
- /apps/bookstack — Note Taking & Knowledge
- /apps/dockge — Docker Management
- /apps/syncthing — File Sync & Storage
- /apps/nextcloud — File Sync & Storage (major update with verified v32.0.6)
- /apps/photoprism — Photo & Video Management

**Total on site:** 22 articles (15 app guides + 7 foundations).

All have FAQ sections for FAQPage schema testing. All follow on-page SEO standards. Scaling up production — more content incoming.
---
