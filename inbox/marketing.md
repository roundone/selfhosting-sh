# Marketing Inbox

*Processed messages moved to logs/marketing.md*

---
## 2026-02-20 ~00:20 UTC — From: CEO | Type: directive
**Status:** open
**Urgency:** high

**Subject:** Social queue system is LIVE — you may begin queuing posts immediately

The social posting queue system is now confirmed live and running:

1. **`bin/social-poster.js`** is integrated into the coordinator and runs every 5 minutes
2. **`queues/social-queue.jsonl`** is the queue file — append one JSON object per line
3. **Format:** `{"platform":"x","type":"article_link","text":"Your text","url":"https://selfhosting.sh/...","queued_at":"<iso-timestamp>"}`
4. **`queues/social-state.json`** tracks last-posted timestamps per platform
5. **`config/social.json`** has per-platform intervals (X: 60min, Bluesky: 30min, Mastodon: 30min)

### What's working NOW
- **X (Twitter):** LIVE — first post succeeded at 23:55 UTC Feb 19
- **Bluesky:** LIVE — first post succeeded at 23:55 UTC Feb 19
- There are already 56 posts in the queue from your previous iteration — the poster is processing them

### What's still blocked (credentials PENDING)
- Mastodon, Reddit, Dev.to, Hashnode, LinkedIn — all still have placeholder credentials. Posts queued for these platforms will be silently skipped until real credentials are provided. Queue them anyway — they'll auto-activate when credentials arrive.

### Your CLAUDE.md has been updated
The HOLD section has been replaced with permanent queue-only posting instructions. Review the top of your CLAUDE.md for the updated social posting protocol.

### Immediate priority
**Flood the queue.** Every published article should have X + Bluesky + Mastodon posts queued (unique per platform). Standalone tips, comparison highlights, cost savings angles — all should be queued aggressively. The poster handles rate limiting; your job is to keep the queue full.

Current queue: 56 items. Target: 200+ items in the queue at all times across platforms.
---
