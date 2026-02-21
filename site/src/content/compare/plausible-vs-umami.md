---
title: "Plausible vs Umami: Which Analytics Tool?"
description: "Plausible vs Umami compared for self-hosted privacy-focused web analytics — features, resource usage, and setup complexity."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "analytics"
apps:
  - plausible
  - umami
tags:
  - comparison
  - plausible
  - umami
  - analytics
  - privacy
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Plausible is the better choice for most self-hosters who want a polished, feature-rich analytics dashboard. It has built-in Google Search Console integration, email reports, and revenue tracking — features Umami lacks. Choose Umami if you need the lightest possible deployment (one container + PostgreSQL, ~200 MB RAM) or prefer the MIT license over Plausible's AGPL. Both are privacy-focused, cookie-free, and GDPR-compliant out of the box.

## Overview

**Plausible** ([plausible.io](https://plausible.io)) is a privacy-first web analytics platform built with Elixir. The Community Edition (CE) is self-hostable under AGPL-3.0. It uses ClickHouse as its analytics data store alongside PostgreSQL for configuration, which makes it heavier to run but fast at querying large datasets. Plausible also offers a paid hosted SaaS starting at $9/month.

**Umami** ([umami.is](https://umami.is)) is a minimal, open-source web analytics tool built with Next.js. It uses only PostgreSQL (MySQL support was dropped in v2), runs as a single application container, and is licensed under MIT. Umami Cloud is the paid hosted option. The project focuses on simplicity — clean dashboard, fast setup, minimal resource footprint.

Both tools share the same core philosophy: track what matters without invading visitor privacy. No cookies, no personal data collection, no consent banners required. The differences are in feature depth, resource requirements, and deployment complexity.

## Feature Comparison

| Feature | Plausible CE v3.2.0 | Umami v3.0.3 |
|---------|---------------------|---------------|
| Tracking script size | < 1 KB | < 1 KB |
| Cookie-free / GDPR compliant | Yes | Yes |
| Real-time dashboard | Yes | Yes |
| Custom events | Yes (with properties) | Yes (with properties) |
| Goal conversions | Yes (built-in) | Via custom events |
| Revenue tracking | Yes | No |
| Google Search Console integration | Yes (built-in) | No |
| Email reports | Yes (weekly/monthly) | No |
| UTM campaign tracking | Yes | Yes |
| Funnel analysis | Yes | No |
| API | Yes (Stats API) | Yes (REST API) |
| Multi-site support | Yes | Yes |
| Team/user management | Yes | Yes (role-based) |
| Data import from GA | Yes (Universal Analytics + GA4) | No |
| Ad blocker evasion (script rename) | Proxy option | Built-in (`TRACKER_SCRIPT_NAME`) |
| Built-in TLS (Let's Encrypt) | Yes | No |
| License | AGPL-3.0 | MIT |

**Key differentiators:** Plausible offers goal funnels, revenue tracking, Google Search Console integration, email reports, and GA data import — features Umami simply does not have. Umami counters with a more permissive license (MIT vs AGPL) and built-in ad-blocker evasion via configurable script/endpoint names.

## Installation Complexity

**Plausible CE** deploys via the official [community-edition repository](https://github.com/plausible/community-edition). You clone the repo, create a `.env` file, and run `docker compose up -d`. The stack includes three containers: Plausible (`ghcr.io/plausible/community-edition:v3.2.0`), PostgreSQL, and ClickHouse. ClickHouse is the complication — it requires SSE 4.2 (x86) or NEON (ARM) CPU instructions, and it consumes significantly more RAM than a simple PostgreSQL instance. You also need a domain name if you want Plausible's built-in Let's Encrypt TLS.

```
Plausible stack: 3 containers (app + PostgreSQL + ClickHouse)
Config files: .env + compose.override.yml
First-boot time: ~60 seconds (ClickHouse initialization)
```

**Umami** is a straightforward two-container deployment: the Umami app (`ghcr.io/umami-software/umami:v3.0.3`) and PostgreSQL. Create a `docker-compose.yml`, set two environment variables (`DATABASE_URL` and `APP_SECRET`), and start it. No special CPU requirements. No additional analytics database.

```
Umami stack: 2 containers (app + PostgreSQL)
Config files: docker-compose.yml
First-boot time: ~15 seconds
```

**Winner: Umami.** Fewer containers, fewer dependencies, fewer things that can go wrong. Plausible's ClickHouse requirement adds real complexity — if your CPU doesn't support SSE 4.2, you cannot run Plausible at all.

## Performance and Resource Usage

| Metric | Plausible CE v3.2.0 | Umami v3.0.3 |
|--------|---------------------|---------------|
| Idle RAM | ~1 GB (ClickHouse + PostgreSQL + app) | ~200 MB (PostgreSQL + app) |
| Minimum server RAM | 2 GB | 1 GB |
| Containers | 3 | 2 |
| Docker image sizes (total) | ~1.5 GB | ~700 MB |
| Runtime | Elixir (BEAM VM) | Node.js (Next.js) |
| Analytics database | ClickHouse (columnar) | PostgreSQL |
| Disk per million pageviews | ~1 GB | ~500 MB |
| CPU requirements | SSE 4.2 or NEON required (ClickHouse) | None |
| Query speed at scale | Excellent (ClickHouse optimized for analytics) | Good (PostgreSQL handles moderate traffic well) |

Plausible uses roughly 5x the RAM at idle. On a Raspberry Pi or 1 GB VPS, that is the difference between "runs fine" and "doesn't fit." On a 4 GB+ server, both run comfortably.

The tradeoff: ClickHouse is a columnar database designed for analytics queries. At high traffic volumes (millions of pageviews per month), Plausible's dashboard queries will stay fast because ClickHouse excels at aggregating large datasets. Umami on PostgreSQL handles moderate traffic well but may slow down on very high-volume sites without careful PostgreSQL tuning.

For most self-hosters tracking a handful of sites with under a million monthly pageviews, both perform identically in practice.

## Community and Support

| Metric | Plausible | Umami |
|--------|-----------|-------|
| GitHub stars | 22K+ | 24K+ |
| License | AGPL-3.0 | MIT |
| Primary language | Elixir | JavaScript (Next.js) |
| Commercial backing | Plausible HQ (company) | Umami Software (company) |
| Documentation | Comprehensive (official docs site) | Good (docs.umami.is) |
| Self-hosting guides | Many community tutorials | Many community tutorials |
| Update frequency | Regular (monthly CE releases) | Regular |
| Paid hosted option | Yes ($9+/month) | Yes (Umami Cloud) |

Both projects are well-maintained with active development and responsive maintainers. Plausible has a slight edge in documentation quality — their self-hosting docs are detailed and cover edge cases well. Umami's docs are solid but thinner on advanced configuration.

The license difference matters if you're building a product on top of the analytics tool. MIT (Umami) lets you do anything, including embedding in proprietary software. AGPL (Plausible) requires you to open-source any modifications to the server if you offer it as a service. For personal or internal analytics use, this distinction is irrelevant.

## Use Cases

### Choose Plausible If...

- You want built-in Google Search Console integration for search query data
- You need email reports sent to stakeholders automatically
- You want goal funnels and revenue tracking without additional tooling
- You need to import historical data from Google Analytics
- You run high-traffic sites (millions of pageviews) and need ClickHouse's query performance
- You want built-in Let's Encrypt TLS without a separate reverse proxy
- You are replacing Google Analytics for a business and need the richest feature set

### Choose Umami If...

- You want the lightest possible deployment (1 GB RAM, 2 containers)
- You prefer the MIT license over AGPL
- You run on limited hardware (Raspberry Pi, small VPS, shared homelab)
- You want the simplest setup — two containers, two env vars, done
- You need built-in ad-blocker evasion with configurable script and endpoint names
- Your CPU does not support SSE 4.2 (rules out ClickHouse entirely)
- You are tracking personal or small-team projects and do not need funnels or email reports

## Final Verdict

**Plausible for most self-hosters who want a Google Analytics replacement.** It does more out of the box — funnels, revenue tracking, Search Console integration, email reports, GA data import. These are features you will eventually want as your site grows, and having them built in beats bolting on workarounds. The heavier resource footprint (2 GB RAM vs 1 GB) is a fair price for a significantly more capable analytics platform.

**Umami if resources are tight or simplicity is paramount.** On a 1 GB VPS or a Pi, Umami fits where Plausible does not. The MIT license is also a concrete advantage if you plan to integrate analytics into a product. And for a personal blog or side project where you just want pageview counts and referrer data, Umami's minimalism is a feature — less to configure, less to maintain, less to break.

Both are excellent tools. You will not regret either choice. But if your server can handle it, Plausible gives you more room to grow.

## FAQ

### Can I migrate from Umami to Plausible (or vice versa)?

There is no built-in migration path between the two. Both store data in different database schemas with different data models. You would need to export data via each tool's API and write a custom import script. In practice, most people start fresh when switching — historical analytics data is useful but not critical for ongoing tracking.

### Do ad blockers block Plausible and Umami?

Some ad blockers (especially those using EasyList or EasyPrivacy) block requests to known analytics domains and script names. Umami has a built-in workaround: set `TRACKER_SCRIPT_NAME` and `COLLECT_API_ENDPOINT` to custom values. Plausible recommends proxying the script through your own domain. Both approaches work, but Umami's is simpler to configure.

### Which handles more traffic better?

Plausible with ClickHouse scales better for high-traffic analytics. ClickHouse is purpose-built for aggregating billions of rows. Umami on PostgreSQL handles moderate traffic (hundreds of thousands of monthly pageviews) without issue, but very high-volume sites may need PostgreSQL performance tuning or partitioning. For the vast majority of self-hosted use cases, both handle traffic fine.

### Can I use both on the same site?

Yes. Both use small, independent tracking scripts. You can run both simultaneously during an evaluation period — add both script tags to your site's `<head>` and compare dashboards side by side. Remove whichever you do not keep.

### What about Matomo as an alternative?

[Matomo](/apps/matomo/) is the heavyweight option — it replicates most of Google Analytics' feature set, including e-commerce tracking, heatmaps (paid plugin), and session recording (paid plugin). It uses significantly more resources than either Plausible or Umami. Choose Matomo if you need GA-level depth. Choose Plausible or Umami if you want simplicity and privacy first.

## Related

- [How to Self-Host Plausible](/apps/plausible/)
- [How to Self-Host Umami](/apps/umami/)
- [How to Self-Host Matomo](/apps/matomo/)
- [Self-Hosted Alternatives to Google Analytics](/replace/google-analytics/)
- [Best Self-Hosted Analytics](/best/analytics/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
