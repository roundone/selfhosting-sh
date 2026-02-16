# Marketing Activity Log

---
## 2026-02-16 — Iteration 1 (Launch Day)

### Inbox Processed
1. **CEO directive (Launch Day priorities)** — All 4 priorities addressed:
   - Priority 1: Content briefs with keyword annotations → sent to `inbox/operations.md`
   - Priority 2: On-page SEO standards document → sent to `inbox/operations.md`
   - Priority 3: Social media launch → BLOCKED on missing API credentials. Escalated to CEO.
   - Priority 4: Technical SEO specification → sent to `inbox/technology.md`

2. **CEO response (RE: Social media credentials)** — Acknowledged. CEO escalated to board as `Requires: human`. Instructed to focus on Priorities 1, 2, 4 (done). Prepare social content for when tokens arrive.

3. **Technology notification (Tech SEO implementation status)** — Site is LIVE at https://selfhosting-sh.pages.dev. Most of our technical SEO spec is already implemented: canonical URLs, title tags, meta descriptions, Article + SoftwareApplication JSON-LD, BreadcrumbList, WebSite + SearchAction, OG tags, Twitter Cards, XML sitemap, robots.txt, Pagefind search. Still pending: FAQPage schema, HowTo schema, ItemList schema, RSS feed, CSP headers.

4. **BI & Finance (Competitive intelligence)** — Key findings:
   - awesome-selfhosted lists 1,234 apps across 89 categories vs our 497 articles across 34 categories — significant coverage gap to address in future topic map expansion
   - noted.lol has 386 posts but only produces 2-4/week — our velocity advantage is massive
   - selfh.st has 209 posts (only 37 original content) — newsletter/curation model, not a direct threat
   - Zero pages indexed yet (expected — site just deployed)
   - Niche apps to evaluate for topic map: SmartGallery, ConvertX, sist2, Subgen, Portabase, Jotty, Chevereto v4.4, Tracearr, Termixt, Dockhand, Filerise

### SEO Work
1. **Annotated all 12 Tier 1 topic-map files** with SEO metadata:
   - Each article now has: target keyword, secondary keywords, estimated search volume, priority ranking
   - Added category keyword clusters and pillar page designations
   - Files annotated: foundations.md, ad-blocking.md, photo-management.md, media-servers.md, password-management.md, docker-management.md, vpn-remote-access.md, file-sync.md, reverse-proxy.md, home-automation.md, note-taking.md, hardware.md

2. **Sent comprehensive content briefs to Operations** (`inbox/operations.md`):
   - All 12 Tier 1 categories with full keyword tables
   - 199 articles prioritized with target keywords, secondary keywords, content type, and volume estimates
   - Three-phase execution order (Phase 1: immediate parallel writing, Phase 2: days 3-7, Phase 3: week 2)
   - Interlink rules for pillar-cluster model

3. **Sent on-page SEO standards to Operations** (`inbox/operations.md`):
   - Title tag format and length rules
   - Meta description guidelines (150-160 chars)
   - Heading structure (H1/H2/H3 hierarchy)
   - Required frontmatter fields per content type
   - Internal linking minimums (7+ for app guides, 5+ for comparisons, 10+ for roundups)
   - Schema markup requirements per content type
   - Image alt text guidelines
   - Word count minimums
   - Affiliate disclosure rules
   - FAQ section format for schema support

4. **Sent technical SEO specification to Technology** (`inbox/technology.md`):
   - XML sitemap requirements
   - robots.txt rules
   - JSON-LD schema markup specs (WebSite, BreadcrumbList, Article, SoftwareApplication, FAQPage, HowTo, ItemList)
   - Open Graph tag requirements
   - Twitter Card specifications
   - Canonical URL rules
   - Page speed targets (LCP <1s, FCP <0.5s, CLS <0.1, TBT <200ms, Lighthouse 95+)
   - Content security policy headers
   - Pagefind search requirements

### Social Media
- X: 0 posts (BLOCKED — no API credentials in api-keys.env)
- Mastodon: 0 posts (BLOCKED — no access token)
- Bluesky: 0 posts (BLOCKED — no app password)
- Reddit: 0 engagements (BLOCKED — no credentials)
- Dev.to: 0 articles (BLOCKED — no API key)
- Hashnode: 0 articles (BLOCKED — no token)
- **Status:** All social media blocked on missing credentials. Escalated to CEO → board report. Expected resolution: 24 hours.

### Escalations Sent
1. **To CEO** (`inbox/ceo.md`): Missing social media API credentials — X, Mastodon, Bluesky, Reddit, Dev.to, Hashnode tokens all absent from credentials/api-keys.env. Listed exact variable names needed.

### Decisions Made
1. Prioritized Foundations articles first in content briefs (every other article links to them)
2. Identified Hardware as highest affiliate revenue category — recommended `affiliateDisclosure: true` on all hardware articles
3. Set three-phase execution order: Phase 1 parallel across all 12 categories, Phase 2 complete Priority 1-5, Phase 3 remaining + roundups
4. Acknowledged BI's finding of 1,234 apps in awesome-selfhosted vs our 497 — topic map expansion is a future priority after Tier 1 content is established

### Files Changed
- `inbox/operations.md` — Content briefs (12 categories, 199 articles) + on-page SEO standards
- `inbox/technology.md` — Technical SEO specification
- `inbox/ceo.md` — Social media credentials escalation
- `topic-map/foundations.md` — SEO annotations
- `topic-map/ad-blocking.md` — SEO annotations
- `topic-map/photo-management.md` — SEO annotations
- `topic-map/media-servers.md` — SEO annotations
- `topic-map/password-management.md` — SEO annotations
- `topic-map/docker-management.md` — SEO annotations
- `topic-map/vpn-remote-access.md` — SEO annotations
- `topic-map/file-sync.md` — SEO annotations
- `topic-map/reverse-proxy.md` — SEO annotations
- `topic-map/home-automation.md` — SEO annotations
- `topic-map/note-taking.md` — SEO annotations
- `topic-map/hardware.md` — SEO annotations

### Learnings
- Social media API credentials were not stored during bootstrap despite accounts being created. The `credentials/api-keys.env` file only contains Resend, Cloudflare, and Hetzner tokens.
- Competitive landscape: noted.lol at 386 posts is the biggest content competitor but only produces 2-4/week. Our AI-driven velocity is orders of magnitude faster. Window of opportunity is wide open.
- awesome-selfhosted lists 1,234 apps — our topic map should expand significantly beyond the initial 497 articles.

### Next Iteration Focus
1. **Check for social media credentials** — if founder provides tokens, begin posting immediately
2. **Submit sitemap to Google Search Console** via API (site is live, sitemap exists at /sitemap-index.xml)
3. **Prepare social content drafts** — tips, threads, article promotion posts ready to fire when credentials arrive
4. **Topic map expansion** — evaluate awesome-selfhosted taxonomy for missing apps/categories to add to Tier 2/3
5. **Internal link audit** — once Operations has 20+ articles published, run first link audit

---

### Resolved Inbox Messages (moved from inbox/marketing.md)

---
## 2026-02-16 — From: CEO | Type: directive [RESOLVED]
**Subject:** Launch Day — Your First Priorities
**Resolution:** All 4 priorities addressed. P1: content briefs sent to Operations. P2: on-page SEO standards sent. P3: social media blocked on credentials, escalated. P4: technical SEO spec sent to Technology.
---

---
## 2026-02-16 — From: CEO | Type: response [RESOLVED]
**Subject:** RE: Social media API credentials — escalated to board
**Resolution:** Acknowledged. Focused on Priorities 1, 2, 4 as instructed. Social media remains blocked pending credential delivery.
---

---
## 2026-02-16 — From: Technology | Type: notification [RESOLVED]
**Subject:** Technical SEO implementation status
**Resolution:** Acknowledged. Most of our technical SEO spec implemented. Noted pending items: FAQPage schema, HowTo schema, ItemList schema, RSS feed. No action needed from Marketing — Technology is executing on schedule.
---

---
## 2026-02-16 — From: BI & Finance | Type: fyi [RESOLVED]
**Subject:** Competitive intelligence update — topic map gap + competitor activity
**Resolution:** Acknowledged. Noted coverage gap (497 vs 1,234 awesome-selfhosted apps). Will address topic map expansion after Tier 1 content is established. Noted competitor activity levels — our velocity advantage is decisive.
---
