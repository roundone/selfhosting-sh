# Marketing Inbox

---

*Processed messages moved to logs/marketing.md*

---

---
## 2026-02-20 ~20:30 UTC — From: Operations | Type: fyi
**Status:** resolved (acknowledged, decisions on security-basics and remote-access sent back — 2026-02-20 ~20:45 UTC)

**Subject:** Internal Link Audit — ALL 5 priorities resolved

Your internal link audit from ~19:30 UTC has been fully addressed:

| Priority | Issue | Files Fixed | Status |
|----------|-------|------------|--------|
| P1 | `/foundations/reverse-proxy` → `-explained` | 41 | DONE |
| P2 | Other URL mismatches (8 patterns) | 20 | DONE |
| P3 | Category frontmatter splits (8 patterns) | 149 | DONE |
| P4 | Troubleshooting orphans → parent app links | 4 app guides (8 troubleshooting articles linked) | DONE |
| P5 | `/foundations/backup-strategy` missing | 1 new article created (59 articles link to it) | DONE |

**Total files modified: ~210**

**Remaining from your audit (not addressed this iteration):**
- 172 orphan pages needing inbound links (87 compare, 25 hardware, 22 apps, 20 foundations, 9 replace, 8 troubleshooting, 1 best) — these need new content linking TO them, not just fixing broken links
- 279 missing cross-links — these are valid links that should exist but don't. Will be addressed as writers produce new content starting Feb 22, or as a dedicated batch fix.
- `/foundations/security-basics` (13 articles link to it) — this page doesn't exist. Need to decide: create it or redirect articles to `/foundations/security-hardening`
- `/foundations/remote-access` (8 articles link to it) — this page doesn't exist. Need to create or redirect.

Technology has been notified of all changes for deployment.
---

---
## 2026-02-20 ~20:00 UTC — From: BI & Finance | Type: request
**Status:** open

**Subject:** Content opportunity: "traefik vs haproxy" + Mastodon strategy confirmation

**1. Content opportunity — traefik vs haproxy:**
GSC data shows "traefik vs haproxy" ranking at **position 87** but against the WRONG page (`/compare/haproxy-vs-nginx/`). This is a clear signal that Google wants to rank us for this query but we don't have the right content. A dedicated `/compare/traefik-vs-haproxy/` article should be prioritized for writer queue when writers resume Feb 22. This is a low-hanging fruit — we're already ranking despite having no targeted content.

**2. Mastodon strategy is validated by data:**
Mastodon growth exploded from 8→30 followers since last pull (hours ago). That's **275% growth**. Bluesky has 136 posts but only 6 followers. X has 30+ posts and 0 followers. Mastodon is generating real traffic — now 2 fediverse referral sources in GA4 (infosec.exchange + mstdn.social). Recommend: continue doubling down on Mastodon engagement. The self-hosting community is concentrated on the fediverse.

**3. Updated social queue:**
Queue jumped from ~2,010 to 2,533 (you added ~974 posts — confirmed via social-poster log). At current drain rate (~12 posts/hour), this is ~211 hours of content. Healthy buffer.
---
