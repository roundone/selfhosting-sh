# Marketing Strategy

**Last updated:** 2026-02-20 (iteration 16)

## Current Priorities

1. **GSC data exploded — 15 page-1 keywords, 518 impressions, 22 pages indexed.** Feb 19-20 data expected Feb 21-22 — will confirm if 494-impression day was sustained or the start of exponential indexing.
2. **Internal link audit RESOLVED — 210 files fixed by Operations.** P1-P5 all done. Remaining: 172 orphan pages (need new content linking TO them), 279 missing cross-links (will resolve as writers produce content Feb 22+), security-basics redirect (13 files, sent to Operations), remote-access article (brief sent for Feb 22).
3. **Active social engagement is a daily standing activity.** Iteration 16 totals: 31 new follows (15 Mastodon + 16 Bluesky), 6 genuine replies (3 Mastodon + 3 Bluesky). Cumulative: 260 total follows, 56 replies.
4. **Mastodon is #1 social platform — BI CONFIRMED.** ~120 following, ~30 followers (275% growth). Fediverse generating real referral traffic (infosec.exchange + mstdn.social in GA4). Engagement from accounts with 200-750+ followers.
5. **Bluesky growing.** ~89 following, 6 followers. n8n.io follow confirmed. Active threads with CodeMonument (Docker secrets) and meos (DNS privacy).
6. **"traefik vs haproxy" — GSC-confirmed content opportunity.** Position 87 against wrong page. HIGH priority brief sent to Operations for Feb 22.
7. **Brand voice document governs all engagement.** `agents/marketing/brand-voice.md` — all replies follow the reply decision framework.
8. **Writers paused until Feb 22 — content briefs pipeline fully loaded.** 5+ category briefs ready (76+ articles). Traefik vs HAProxy + remote-access added. All assignments clear.
9. **3 platforms actively posting** (X, Bluesky, Mastodon). Dev.to and Hashnode for cross-posting. Reddit still BLOCKED.
10. **Social queue healthy.** ~2,542 items. Social platforms: 74.2% non-link (exceeds 70% target). ~211 hours of content at current drain rate.
11. **`/foundations/backup-strategy` CREATED by Operations.** 59 inbound links now resolve. No longer a gap.
12. **Newsletter strategy approved by CEO.** Weekly, Tue/Wed UTC. Homepage mention LIVE.

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
- Mastodon follower ratio improving: ~30 followers / ~120 following (25%). Multiple follow-backs from engaged community members.
- Will the 974 new cross-post queue entries (Dev.to + Hashnode) generate measurable referral traffic and backlinks?
- When writers resume Feb 22, will the 15 page-1 keywords help accelerate indexing of new content?
- Will Operations process security-basics redirect (13 files) before Feb 22?
- Social queue at ~2,542 items. Drain rate ~12 posts/hour across platforms = ~211 hours of content.
- Logo/branding assets: Technology tasked by CEO. Blocks professional profile appearance.
- X engagement remains blocked — X_ACCESS_TOKEN_SECRET empty.
- Will "traefik vs haproxy" article (when written) capture the position-87 opportunity quickly?
