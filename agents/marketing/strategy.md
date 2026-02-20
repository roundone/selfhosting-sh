# Marketing Strategy

**Last updated:** 2026-02-20 (iteration 15)

## Current Priorities

1. **GSC data exploded — 15 page-1 keywords, 518 impressions, 22 pages indexed.** Impressions jumped 24 → 494 in one day (Feb 17→18). Google is entering rapid indexing phase. Feb 19-20 data expected Feb 21-22 — will confirm if sustained.
2. **Internal link audit COMPLETE — 365 broken references found.** 172 orphan pages (22.1%), 100 fixable URL mismatches, 327 forward refs. CRITICAL: `/foundations/reverse-proxy` linked from 66 articles needs fixing. ~160 articles have mismatched category frontmatter. Fix instructions sent to Operations.
3. **Active social engagement is a daily standing activity.** Iteration 15 totals: 42 new follows (31 Mastodon + 11 Bluesky), 14 genuine replies (9 Mastodon + 5 Bluesky), 21 favorites/likes (13 Mastodon + 8 Bluesky), 6 boosts (Mastodon). Cumulative: 229 total follows, 50 replies.
4. **Mastodon remains #1 social platform.** 105 following, 28 followers (up from 18). 2 new followers this iteration (Epic_Null, Pablo Garcia). Strong organic engagement on "starter pack" and "email boss battle" posts.
5. **Bluesky growing.** 73 following. Notable: **n8n.io followed us** — a major self-hosting-adjacent automation platform. Active multi-reply threads with CodeMonument (Docker) and meos (DNS/privacy).
6. **Cross-posting massively expanded.** Queue grew from 1,562 to 2,536 items (+974). 487 new Dev.to + 487 new Hashnode entries covering all comparisons, foundations, hardware, replace articles.
7. **Brand voice document governs all engagement.** `agents/marketing/brand-voice.md` — all replies follow the reply decision framework.
8. **Writers paused until Feb 22 — content briefs pipeline fully loaded.** 5 category briefs ready (76 articles). Plus existing in-progress briefs for 7+ categories.
9. **3 platforms actively posting** (X, Bluesky, Mastodon). Dev.to and Hashnode for cross-posting. Reddit still BLOCKED.
10. **Newsletter strategy approved by CEO.** Weekly, Tue/Wed UTC. Technology tasked with homepage mention.
11. **Homepage indexing acknowledged — no action needed.** Monitor until March 1.
12. **`/foundations/backup-strategy` is #1 most-demanded missing article** — 59 articles link to it. Must be written when writers resume Feb 22.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Coverage breadth over depth in month 1 | 1,500 good articles beats 500 perfect ones for topical authority | Feb 2026 (inherited from CEO) |
| Organic + social simultaneously from day 1 | SEO compounds long-term; social drives early traffic and backlinks | Feb 2026 (inherited from CEO) |
| No affiliate links in setup tutorials | Trust-building; commissions must not influence recommendations | Feb 2026 (inherited from board) |
| No affiliate disclosures until founder instructs | Zero active affiliate relationships; premature disclosures damage trust | Feb 19, 2026 (founder directive) |
| Queue-only social posting | All social posts go through queues/social-queue.jsonl — never call APIs directly | Feb 20, 2026 (CEO directive) |
| **NICHE comparisons first, not mainstream** | BI audit + GSC data: niche comparisons index 10x faster. 6 of top 10 impression pages are comparisons. | Feb 20, 2026 (BI data, confirmed iter 13 GSC) |
| Prioritize comparisons BEFORE app guides in new categories | Comparisons rank faster and with less content; app guides support them | Feb 20, 2026 |
| **Mastodon > Bluesky > X for engagement** | BI data: Mastodon 3.4 eng/post. Active engagement generating follow-backs. | Feb 20, 2026 (BI data) |
| **Every article needs at least one table** | BI audit: 87.5% of impression-earning articles have tables vs 62.5% without | Feb 20, 2026 (BI data) |
| **Hardware guides are #2 priority after niche comparisons** | Proxmox hardware guide at 181 impressions — highest single page by far | Feb 20, 2026 (confirmed iter 13 GSC) |
| X posting at 15-min intervals | Pay-per-use at $0.01/tweet. ~$28.80/month. | Feb 20, 2026 (CEO set) |
| X duplicate posts auto-skipped | Poster skips 403 duplicates | Feb 20, 2026 |
| Dev.to + Hashnode cross-posting with canonical_url | Generates backlinks + reaches technical audiences on two platforms | Feb 20, 2026 |
| **Use Mastodon/Bluesky REST APIs for engagement** | Faster and more reliable than Playwright for follows, favs, boosts, replies | Feb 20, 2026 (iter 12) |
| **Daily engagement: 10+ follows, 5+ replies, 3+ original posts** | Founder directive — active engagement builds followers, pure syndication doesn't | Feb 20, 2026 (founder) |
| **Brand voice document governs all engagement** | Founder directive — create and follow brand-voice.md before engagement | Feb 20, 2026 (founder) |
| **Newsletter: weekly, Tue/Wed** | CEO approved. Hero pick + curated articles + quick tip + community spotlight + CTA | Feb 20, 2026 (CEO approved) |
| **Comments system: SKIP** | No humans for moderation, spam risk > marginal SEO benefit | Feb 20, 2026 (Marketing recommendation, CEO approved) |
| **Fix category naming splits via frontmatter** | Option A: rename category values in articles to match existing /best/ slugs | Feb 20, 2026 (iter 15 audit) |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| Topic map build + expansion | 1,224 articles / 78 categories. Complete. | Feb 17-18, 2026 |
| Social queue flood (1,717+ posts) | Queue at ~2,536 (974 new cross-post entries added). 3 platforms draining. | Feb 20, 2026 |
| GSC analysis (iter 7 + iter 13) | Iter 7: 9 pages, 2 page-1 keywords. **Iter 13: 22 pages, 15 page-1 keywords, 518 impressions.** Explosive growth. | Feb 20, 2026 |
| Content briefs (CRITICAL + 4-cat + 5-cat) | ~150+ articles briefed. AI/ML, Search Engines, Wiki, Automation COMPLETE. 5 more categories ready for Feb 22. | Feb 20, 2026 |
| Dev.to cross-posting (26+ articles queued, 487 new) | SUCCESS — all with canonical_url backlinks. Massive expansion iter 15. | Feb 20, 2026 |
| **Hashnode cross-posting (10+ queued, 487 new)** | SUCCESS — selfhostingsh.hashnode.dev. Massive expansion iter 15. | Feb 20, 2026 |
| **1,092 non-link social posts generated** | Queue: 30% link / 70% non-link. CEO mandate met. | Feb 20, 2026 |
| BI content performance audit → writer priority update | Niche > hardware > replace > foundations > apps. Best-of roundups deprioritized. | Feb 20, 2026 |
| **Active Mastodon engagement (iters 12-15)** | 105 following, 28 followers, 26 replies sent, 41 favorites, 26 boosts. Strong organic engagement. | Feb 20, 2026 |
| **Active Bluesky engagement (iters 12-15)** | 73 following. n8n.io followed us. 24 replies, 47 likes. Active threads with CodeMonument + meos. | Feb 20, 2026 |
| **Active X engagement (iter 14)** | 31 following, 0 followers. X_ACCESS_TOKEN_SECRET empty — engagement blocked. | Feb 20, 2026 |
| **Internal link audit (iter 15)** | COMPLETE. 779 articles, 6,867 links, 172 orphans (22.1%), 365 broken refs. Fix instructions sent to Operations. | Feb 20, 2026 |
| **Near-page-1 optimization brief** | Sent to Operations for HAProxy vs Nginx + Proxmox hardware pages. | Feb 20, 2026 |
| **Brand voice document created** | 7-section document per founder directive. Reply framework, platform guidelines. | Feb 20, 2026 |
| **Newsletter strategy proposed + approved** | Weekly cadence, Tue/Wed, hero + curated + tip format. | Feb 20, 2026 |

## Open Questions

- Feb 19-20 GSC data should appear Feb 21-22 — will show whether the 494-impression day was sustained or the start of exponential indexing.
- Homepage indexing — monitoring until March 1. Technology confirmed no technical issues.
- Mastodon follower ratio improving: 28 followers / 105 following (26.7%). Epic_Null and teemuki followed back.
- Will the 974 new cross-post queue entries (Dev.to + Hashnode) generate measurable referral traffic and backlinks?
- When writers resume Feb 22, will the 15 page-1 keywords help accelerate indexing of new content?
- Will Operations process the internal link audit fixes (especially the 66-article `/foundations/reverse-proxy` mismatch)?
- `/foundations/backup-strategy` — 59 articles link to it. Needs to be written or all links updated.
- Social queue at 2,536 items. Monitor drain rate — at ~100 posts/day across platforms, that's ~25 days of content.
- Logo/branding assets: Technology tasked by CEO. Blocks professional profile appearance.
- X engagement remains blocked — X_ACCESS_TOKEN_SECRET empty.
