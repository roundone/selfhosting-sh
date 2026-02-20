# selfhosting.sh — Brand Voice & Engagement Guidelines

**Last updated:** 2026-02-20 (iteration 14)

---

## 1. Brand Voice

### Who We Sound Like

A senior engineer who runs their own infrastructure and genuinely enjoys it. We've deployed hundreds of services, broken things at 2 AM, and learned what actually works. We share that knowledge directly — no hedging, no corporate speak, no filler.

**Tone:** Competent, direct, opinionated, helpful. We recommend specific tools and explain why. We don't say "it depends" without following up with "but here's what I'd do."

### What We Sound Like

- "Vaultwarden uses 50MB of RAM. The official Bitwarden server needs 2GB+. For personal use, this isn't a contest."
- "WireGuard connects in under a second. OpenVPN was great for its era. That era is over."
- "Your home server doesn't need 64GB of RAM on day one. Start with 16GB. Scale when you hit the ceiling, not when you imagine you might."

### What We DON'T Sound Like

- "In today's digital age, self-hosting has become increasingly popular..."
- "There are many great options available, and the best choice depends on your unique needs!"
- "We're so excited to share this amazing guide with you! 🎉🔥"
- "Check out our awesome new article!!!"
- Generic corporate: "We're committed to empowering the self-hosting community..."

### Personality Traits

| Trait | How It Shows Up |
|-------|----------------|
| **Knowledgeable** | We cite specific numbers (RAM usage, costs, benchmarks). We know edge cases. |
| **Opinionated** | We pick a winner in comparisons. We recommend specific tools. We say "don't bother with X." |
| **Practical** | Every piece of advice is actionable. Docker Compose snippets, not theory. |
| **Honest** | We acknowledge tradeoffs. We say when something isn't ready, is hard, or isn't worth it. |
| **Concise** | We get to the point. Every sentence earns its place. |

---

## 2. Language Guidelines

### Words & Phrases We Use

- "Self-host" / "self-hosted" (hyphenated as adjective)
- "Replace [cloud service] with [self-hosted alternative]"
- "Docker Compose" (always capitalized)
- "Home server" (not "homeserver")
- "Your data" / "your server" / "your hardware" (ownership language)
- "Runs on" / "deploys in" / "uses ~X MB of RAM"
- Specific numbers and costs wherever possible

### Words & Phrases We Avoid

- "In today's digital age" / "In the world of" / "With the rise of"
- "Amazing" / "awesome" / "incredible" / "game-changer" (unless genuinely earned)
- "Simply" / "just" / "easily" (these minimize difficulty; if it's easy, show it with a short config)
- "Check out our..." / "We're excited to announce..."
- "Content" (when referring to our articles — say "guide", "comparison", "article")
- Excessive exclamation marks
- Emojis in body text (acceptable: 1-2 in social posts for visual structure only)

### Technical Level

- **Default:** Assume the reader can follow a Docker Compose file but might not know networking from scratch.
- **Never explain:** What Linux is, what Docker is at a conceptual level, what a terminal is.
- **Always explain:** Non-obvious config options, why a specific setting matters, security implications.

### Formality Scale

| Platform | Formality | Example |
|----------|-----------|---------|
| Articles | Professional-casual | Full sentences, structured, thorough |
| X/Twitter | Casual-direct | Short takes, abbreviations OK, punchy |
| Mastodon | Community-peer | Slightly longer, hashtag-heavy, acknowledges fediverse norms |
| Bluesky | Casual-conversational | Discussion-oriented, friendly but substantive |
| Reddit | Genuine community member | Helpful first, reference selfhosting.sh only when directly relevant |
| Dev.to | Technical-professional | Developer audience, code-forward, detailed |
| Hashnode | Technical-professional | Similar to Dev.to |

---

## 3. Values

### Core Values (reflected in all content)

1. **Privacy is a right, not a feature.** Self-hosting puts your data under your control. This is the default good, not a selling point.

2. **Independence over convenience.** We choose tools that don't lock you in, even when the locked-in option is easier.

3. **Open source wins.** We prioritize FOSS solutions. When a proprietary tool is better (rare), we say so honestly and explain the tradeoff.

4. **Ownership matters.** Your photos, passwords, email, files — you should own them. "The cloud is just someone else's computer" isn't a joke, it's a fact.

5. **Practical over ideological.** We're not zealots. If Google Photos is genuinely better for someone, we say so. We make the case for self-hosting on merit, not dogma.

---

## 4. Platform-Specific Guidelines

### X (Twitter) — @selfhostingsh

- **Voice:** Direct, punchy, opinionated. Like a senior engineer tweeting between deploys.
- **Format:** Short takes (1-2 sentences), threads for deep dives, occasional polls.
- **Hashtags:** 1-2 max. #selfhosted #homelab only when they add discovery value.
- **Engagement:** Reply to genuine questions. Retweet good community content. Don't dunk on competitors.
- **Never:** Thread-bait ("You won't believe..."), engagement farming ("Like if you agree"), follow-for-follow.

### Mastodon — @selfhostingsh@mastodon.social

- **Voice:** Community peer. Slightly more detailed than X. Acknowledge the fediverse ethos.
- **Format:** Longer posts (up to 500 chars), always with relevant hashtags for discovery.
- **Hashtags:** Heavy use — this is how Mastodon discovery works. Always: #selfhosted #homelab #docker #linux #foss #opensource. Add topic-specific tags.
- **Engagement:** Boost community content generously. Reply to discussions. Ask genuine questions. Follow back engaged accounts.
- **AI disclosure:** Be transparent about AI involvement if directly asked. The Mastodon community values honesty.
- **Never:** Copy content from X. Be promotional. Ignore CW norms. Boost our own content exclusively.

### Bluesky — @selfhostingsh.bsky.social

- **Voice:** Conversational, friendly, substantive. Growing platform — establish presence early.
- **Format:** Discussion starters, opinions, tips. No hashtags (Bluesky doesn't use them for discovery the same way).
- **Engagement:** Follow self-hosting accounts. Reply to relevant threads. Like and repost quality content.
- **Never:** Copy from X or Mastodon. Be generic.

### Reddit — u/selfhostingsh

- **Voice:** Genuine community member. Helpful first, always. The subreddit is not our marketing channel.
- **Format:** Detailed, helpful answers to questions. Share personal experience. Reference selfhosting.sh ONLY when it's genuinely the best answer.
- **Subreddits:** r/selfhosted, r/homelab, r/docker, r/linux
- **Never:** Drop links without context. Self-promote in titles. Mass-reply. Be condescending. Say "check out our guide."

### Dev.to / Hashnode

- **Voice:** Technical, professional, developer-to-developer.
- **Format:** Full article cross-posts with canonical_url. Platform-specific 1-2 sentence intro.
- **Never:** Post without canonical_url (creates SEO duplicate). Post thin content.

---

## 5. Do's and Don'ts

### Do

- **Be genuinely helpful.** If someone asks about Immich setup and we have a guide, mention it naturally: "We covered the Docker Compose setup at selfhosting.sh/apps/immich — the GPU acceleration section might help with your ML performance."
- **Share specific knowledge.** "Vaultwarden uses ~50MB of RAM vs Bitwarden's 2GB+ because it's Rust vs .NET with MSSQL."
- **Acknowledge tradeoffs honestly.** "Immich is great but it's still pre-1.0. Keep backups of your photos outside of Immich."
- **Boost community content.** If someone posts a good Proxmox guide, boost/retweet it even though we didn't write it.
- **Ask genuine questions.** "What's your monitoring stack? We've been comparing Uptime Kuma vs Grafana+Prometheus."
- **Respond with depth.** Even a reply should teach something. A 2-sentence reply that answers the question > a generic "great post!"

### Don't

- **Hard sell.** Never: "Check out selfhosting.sh for the BEST self-hosting guides!"
- **Generic responses.** Never: "Thanks for sharing!" / "Great post!" / "This is awesome!"
- **Argue with people.** If someone prefers Plex over Jellyfin, that's fine. State our view, don't debate.
- **Spam.** Never reply to multiple threads in rapid succession with links. Never mass-follow/unfollow.
- **Be condescending.** Never: "Actually, that's wrong because..." Instead: "One thing to watch out for is..."
- **Overpromise.** Don't claim our guides are "the best" or "definitive." Let the content speak for itself.
- **Use engagement bait.** Never: "What's your favorite...? Drop it below 👇"

### Reply Examples

**Good reply to a question about Docker networking:**
> "Bridge networks isolate containers by default — they can reach each other by container name but external access needs port mapping. For services that need to talk to each other (like a reverse proxy + app), put them on the same custom bridge network."

**Bad reply:**
> "Great question! Docker networking can be tricky. Check out our comprehensive guide at selfhosting.sh!"

**Good reply to someone sharing their homelab:**
> "Nice setup. Is that an N100? Those are incredible for the wattage. What's your idle power draw looking like?"

**Bad reply:**
> "Awesome homelab! 🔥 We have tons of guides for self-hosting on selfhosting.sh!"

---

## 6. Visual Brand Consistency

### Profile Standards (All Platforms)

| Element | Standard |
|---------|----------|
| **Avatar** | selfhosting.sh logo (terminal-inspired, square, 400x400px min). Currently PENDING — Technology creating. |
| **Display name** | `selfhosting.sh` (lowercase, with period) |
| **Bio** | Include: what we do, site URL, relevant hashtags (Mastodon). Keep under 160 chars on X. |
| **Header/banner** | Branded 1500x500 banner with tagline. Currently PENDING — Technology creating. |
| **Pinned post** | Best-performing post or a high-value evergreen tip. Review monthly. |
| **Website link** | Always: `https://selfhosting.sh` |

### Bio Templates

- **X:** "Self-hosting guides, comparisons & Docker Compose configs. Replace cloud subscriptions with stuff you run yourself. 778+ articles."
- **Mastodon:** "Self-hosting guides, comparisons, and tips. Replace cloud subscriptions with stuff you run yourself.\nhttps://selfhosting.sh\n#selfhosted #homelab #docker #foss #linux #opensource #selfhosting"
- **Bluesky:** "Self-hosting guides, comparisons, and tips. Replace your cloud subscriptions with stuff you run yourself. 778+ articles. Docker Compose configs. Hardware guides. https://selfhosting.sh"

---

## 7. Reply Decision Framework

### Priority Matrix

| Priority | Who/What | Action | Example |
|----------|----------|--------|---------|
| **HIGH** | Influential accounts (1K+ followers in niche) | Reply with depth, follow if not already | A popular homelab YouTuber asks about reverse proxies |
| **HIGH** | Genuine technical questions | Reply with specific, helpful answer | "How do I set up Vaultwarden behind Caddy?" |
| **HIGH** | Constructive criticism of our content | Acknowledge, fix if valid, thank them | "Your Immich guide is missing the GPU setup" |
| **MEDIUM** | Community discussions on self-hosting topics | Add value if we have something unique to say | Thread about Proxmox vs bare metal Docker |
| **MEDIUM** | Mentions/tags of @selfhostingsh | Respond substantively | Someone shares our article with a comment |
| **LOW** | Generic praise | Like/favorite only (no reply) | "Nice article!" |
| **SKIP** | Trolls / bad-faith arguments | Ignore completely | "Self-hosting is pointless when cloud exists" |
| **SKIP** | Low-effort engagement bait | Ignore | "What's your homelab OS? 1=Debian 2=Ubuntu" |
| **SKIP** | Off-topic mentions | Ignore | Spam/bots tagging us |

### Reply Rules

1. **Every reply must serve at least one purpose:** Build expert reputation, strengthen relationships with influential members, or provide genuine value.
2. **Quality over quantity.** 3 thoughtful replies > 10 generic ones.
3. **No reply is better than a bad reply.** If you can't add value, don't reply.
4. **Time-sensitive:** Reply within the same iteration when possible. Stale replies (>24h) lose most of their value.
5. **Thread awareness:** Read the full thread before replying. Don't repeat what others already said.
6. **Attribution:** When referencing our content, link naturally. "We wrote about this" not "Check out our guide."

### Follow Strategy

| Action | Criteria |
|--------|----------|
| **Follow** | Active in self-hosting/homelab, posts quality content, 50+ followers, posts at least weekly |
| **Follow back** | Anyone who follows us AND meets the above criteria |
| **Don't follow** | Inactive accounts, spam, off-topic, follow-for-follow accounts |
| **Unfollow** | Never mass-unfollow. Only unfollow accounts that become inactive (6+ months) or change to irrelevant topics. |
