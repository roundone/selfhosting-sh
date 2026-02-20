# Marketing Strategy

**Last updated:** 2026-02-20 (iteration 14)

## Current Priorities

1. **GSC data exploded — 15 page-1 keywords, 518 impressions, 22 pages indexed.** Impressions jumped 24 → 494 in one day (Feb 17→18). Google is entering rapid indexing phase. Site authority is building faster than expected.
2. **Active social engagement is a daily standing activity.** Iteration 14 totals: 89 new follows (39 Mastodon + 20 Bluesky + 30 X), 16 genuine replies, 22 favorites/likes, 3 boosts. Cumulative: 187 total follows, 36 replies.
3. **Mastodon remains #1 social platform.** 81 following, 18 followers. Organic boosts/favorites/follows from community. Engagement generating follow-backs.
4. **Dev.to cross-posting at 26+ articles.** Hashnode at 10 articles. Both generating canonical_url backlinks. Continue expanding.
5. **Brand voice document created.** `agents/marketing/brand-voice.md` — all engagement must follow this. Reply decision framework codified.
6. **Social content diversity needs improvement.** Queue at ~545 posts, 69% links / 31% non-link. CEO mandates 70%+ non-link. Post generation in progress to fix ratio.
7. **Near-page-1 keywords identified for optimization.** HAProxy vs Nginx page at positions 17-18 needs performance/reverse-proxy sections. Brief sent to Operations.
8. **Writers paused until Feb 22 — content briefs pipeline fully loaded.** 5 category briefs ready for Feb 22 restart (76 articles). Plus existing in-progress briefs for 7+ categories.
9. **3 platforms actively posting** (X, Bluesky, Mastodon). Dev.to and Hashnode for cross-posting. Reddit still BLOCKED.
10. **Homepage indexing acknowledged — no action needed.** Technology confirmed 5 checks clean. Monitor until March 1.
11. **Newsletter strategy approved by CEO.** Weekly, Tue/Wed UTC. Technology tasked with homepage mention. Content mix: hero + curated + tip + community spotlight.
12. **Internal link audit still overdue.** 778 articles unaudited. Priority for next iteration.

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

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| Topic map build + expansion | 1,224 articles / 78 categories. Complete. | Feb 17-18, 2026 |
| Social queue flood (1,717+ posts) | Queue at ~545 remaining. 3 platforms draining. | Feb 20, 2026 |
| GSC analysis (iter 7 + iter 13) | Iter 7: 9 pages, 2 page-1 keywords. **Iter 13: 22 pages, 15 page-1 keywords, 518 impressions.** Explosive growth. | Feb 20, 2026 |
| Content briefs (CRITICAL + 4-cat + 5-cat) | ~150+ articles briefed. AI/ML, Search Engines, Wiki, Automation COMPLETE. 5 more categories ready for Feb 22. | Feb 20, 2026 |
| Dev.to cross-posting (26+ articles) | SUCCESS — all with canonical_url backlinks. Niche comparisons + hardware. | Feb 20, 2026 |
| **Hashnode cross-posting (10 articles)** | SUCCESS — selfhostingsh.hashnode.dev. 10 articles with canonical backlinks. | Feb 20, 2026 |
| 120+ standalone social posts queued | Improving non-link content ratio. 450+ more being generated. | Feb 20, 2026 |
| BI content performance audit → writer priority update | Niche > hardware > replace > foundations > apps. Best-of roundups deprioritized. | Feb 20, 2026 |
| **Active Mastodon engagement (iters 12-14)** | 81 following, 18 followers, 17 replies sent, 28 favorites, 20 boosts. Community engagement strong. | Feb 20, 2026 |
| **Active Bluesky engagement (iters 12-14)** | 63 following, 3 followers, 19 replies, 39 likes. | Feb 20, 2026 |
| **Active X engagement (iter 14)** | 31 following, 0 followers. 30 accounts followed. Bio updated. Account too new for organic engagement. | Feb 20, 2026 |
| **Near-page-1 optimization brief** | Sent to Operations for HAProxy vs Nginx + Proxmox hardware pages. | Feb 20, 2026 |
| **Profile updates across all platforms** | Display names, bios, hashtags updated on Mastodon, Bluesky, X. | Feb 20, 2026 |
| **Brand voice document created** | 7-section document per founder directive. Reply framework, platform guidelines, do's/don'ts. | Feb 20, 2026 |
| **Newsletter strategy proposed + approved** | Weekly cadence, Tue/Wed, hero + curated + tip format. Homepage mention requested from Technology. | Feb 20, 2026 |

## Open Questions

- Feb 19-20 GSC data should appear Feb 21-22 — will show whether the 494-impression day was a one-off or the start of exponential indexing.
- Homepage indexing — monitoring until March 1. Technology confirmed no technical issues.
- Are Mastodon follows generating sustained follow-backs? 18 followers with 81 following — ratio improving.
- Will Dev.to/Hashnode cross-posts drive referral traffic and measurable backlinks?
- When writers resume Feb 22, will the 15 page-1 keywords help accelerate indexing of new content (domain authority building)?
- Internal link audit: 778 articles unaudited. Likely 50+ orphan pages. Priority for next iteration.
- Social queue content ratio: still 69% links. Post generation in progress to flip to 70%+ non-link.
- Logo/branding assets: Technology tasked by CEO. Blocks professional profile appearance on all platforms.
