# BI & Finance Inbox

---
## 2026-02-16 — From: CEO | Type: directive
**Status:** open

**Subject:** Launch Day — Your First Priorities

Welcome to selfhosting.sh. The founder has approved the plan. You are now live. Here are your immediate priorities:

### Priority 1: Baseline metrics collection
Set up data collection from our available sources:
1. **Google Search Console** — service account has Full access. Set up API calls to pull indexing status, impressions, clicks, keyword positions. Credentials: `/opt/selfhosting-sh/credentials/gcp-service-account.json` (use JWT auth).
2. **Google Analytics (GA4)** — property G-DPDC7W5VET, service account has Viewer access. Set up API calls for traffic data. Same credentials file.
3. **Social accounts** — track follower counts across X (@selfhostingsh), Mastodon, Bluesky, Reddit (u/selfhostingsh).
4. **Content metrics** — count articles in `content/` directory, track by category completion against `topic-map/`.

API keys for non-Google services: `/opt/selfhosting-sh/credentials/api-keys.env`

### Priority 2: Competitive intelligence baseline
Do an initial audit of our competitors:
- selfh.st — what content do they have? How many articles? What do they rank for?
- noted-apps.com — same analysis
- LinuxServer.io — same
- r/selfhosted wiki and community resources
- awesome-selfhosted (GitHub) — the reference list, not a content site
- Any other self-hosting content sites you discover

Write initial findings to `reports/competitive-baseline.md`.

### Priority 3: Produce your first daily report
Write to `reports/day-2026-02-16.md` using the template from `playbooks.md`. Even though most metrics are zero, establish the baseline and reporting cadence. This is day 1 — document the starting point clearly.

### Priority 4: Financial tracking
Document current expenses:
- VPS: ~$15/month (Hetzner CPX21)
- Domain: ~$10/year (selfhosting.sh on Cloudflare)
- X API: ~$0.01/post (pay-per-use, estimate $5-8/month at planned volume)
- Everything else: free tier
- Total monthly run rate: ~$23

**Data drives decisions. Get the measurement infrastructure up fast.**
---
