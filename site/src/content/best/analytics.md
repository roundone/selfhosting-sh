---
title: "Best Self-Hosted Analytics in 2026"
description: "The best self-hosted web analytics tools compared, including Plausible, Umami, Matomo, and GoAccess as Google Analytics alternatives."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "analytics"
apps:
  - plausible
  - umami
  - matomo
tags:
  - best
  - self-hosted
  - analytics
  - privacy
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Picks

| Use Case | Best Choice | Why |
|----------|-------------|-----|
| Best overall | [Plausible](/apps/plausible/) | Lightweight, privacy-first, beautiful single-page dashboard, under 1 KB tracking script |
| Best for beginners | [Umami](/apps/umami/) | Simplest setup — one container plus PostgreSQL. Clean UI, minimal configuration. |
| Best full GA replacement | [Matomo](/apps/matomo/) | Most features, closest Google Analytics parity, plugin ecosystem, GA data import |
| Best zero-overhead | GoAccess | Log-based analysis, no JavaScript tracking needed, runs from the terminal or as a static HTML report |

## The Full Ranking

### 1. Plausible CE — Best Overall

[Plausible](https://plausible.io) is the analytics tool most self-hosters should deploy first. The tracking script is under 1 KB — roughly 45x smaller than Google Analytics — so it has zero measurable impact on page load times. The dashboard is a single page that shows pageviews, unique visitors, referrers, top pages, countries, devices, and UTM campaigns at a glance. No clicking through dozens of report tabs.

Plausible Community Edition uses ClickHouse for analytics storage and PostgreSQL for configuration data. ClickHouse is the same column-oriented database that powers analytics at Cloudflare and Uber, which means Plausible handles millions of pageviews without breaking a sweat. The trade-off is that the stack requires more RAM than Umami — plan for at least 2 GB.

Plausible is cookie-free by design. It uses a hash of the visitor's IP address and User-Agent to count unique visitors within a single day, then discards the hash. No consent banners needed under GDPR, ePrivacy, or PECR.

**Pros:**
- Under 1 KB tracking script — no impact on page speed
- Single-page dashboard covers 90% of what most sites need
- Cookie-free, GDPR-compliant out of the box — no consent banners
- ClickHouse backend handles millions of events efficiently
- Goal and event tracking without JavaScript complexity
- Public dashboard option for transparency
- CSV and API export for data portability
- Active development with frequent releases

**Cons:**
- Requires three containers (Plausible, ClickHouse, PostgreSQL) — heavier stack than Umami
- ClickHouse needs a CPU with SSE 4.2 or NEON instruction support
- 2 GB RAM minimum — not suitable for very small VPS instances
- No plugin system — what you see is what you get
- No heatmaps, session recordings, or funnel visualization
- Community Edition lags behind the hosted version by a few features

**Best for:** Most self-hosters. If you want simple, accurate, privacy-respecting analytics and your server has at least 2 GB of RAM, Plausible is the right choice.

[Read our full guide: How to Self-Host Plausible](/apps/plausible/)

### 2. Umami — Best for Simple Analytics

[Umami](https://umami.is) strips web analytics down to the essentials. One container plus PostgreSQL. The dashboard shows pageviews, visitors, referrers, browsers, operating systems, device types, and countries. Custom events are supported. That is basically it — and for many sites, that is everything you need.

Umami's resource footprint is the lightest of any full-featured analytics tool here. It runs comfortably on 1 GB of RAM. The codebase is a Next.js application backed by PostgreSQL (or MySQL), so if you already run PostgreSQL for other services, Umami slots in without adding another database engine.

The tracking script is about 2 KB — larger than Plausible's but still negligible compared to Google Analytics. Like Plausible, Umami is cookie-free and GDPR-compliant without consent banners.

**Pros:**
- Simplest setup of any analytics tool — two containers total
- Runs on 1 GB of RAM comfortably
- Clean, modern UI with dark mode
- Cookie-free, GDPR-compliant
- MIT license — the most permissive license in this roundup
- Supports PostgreSQL or MySQL (use whatever you already run)
- Multi-site tracking from a single instance
- Team accounts with role-based access
- API for programmatic data access

**Cons:**
- Fewer reporting features than Plausible or Matomo — no funnels, no revenue tracking
- No built-in goal/conversion tracking beyond custom events
- No data import from Google Analytics
- Smaller plugin/integration ecosystem
- Real-time view is basic compared to Matomo
- No public dashboard option built-in (requires API)

**Best for:** Developers and small site owners who want minimal analytics with minimal overhead. If you run a personal blog, a docs site, or a small project and just want to know how many visitors you get and where they come from, Umami does exactly that.

[Read our full guide: How to Self-Host Umami](/apps/umami/)

### 3. Matomo — Best Full-Featured Analytics

[Matomo](https://matomo.org) (formerly Piwik) is the analytics platform you deploy when you genuinely need Google Analytics feature parity. Pageviews, sessions, goals, funnels, e-commerce tracking, custom dimensions, tag manager, roll-up reporting across multiple sites, scheduled email reports, and a plugin marketplace with hundreds of extensions. If Google Analytics does it, Matomo probably does too.

Matomo uses a traditional PHP + MariaDB/MySQL stack. The web installer walks you through setup. It supports both JavaScript tracking and server-side log analytics. The cookieless mode works without consent banners, though you lose some accuracy on unique visitor counting.

The cost is complexity and resources. Matomo needs at least 2 GB of RAM (4 GB recommended for sites with real traffic), and the MariaDB database grows faster than ClickHouse or PostgreSQL alternatives. Archiving and report processing can spike CPU usage on larger installs.

**Pros:**
- Most complete feature set of any self-hosted analytics platform
- Plugin marketplace (heatmaps, session recording, A/B testing — some paid)
- Google Analytics data import — migrate your historical data
- Tag manager included
- Funnels, goals, e-commerce tracking
- Scheduled PDF/email reports
- Roll-up reporting across multiple sites
- GDPR tools built-in (data anonymization, consent management, data subject requests)
- 20+ years of active development (started as Piwik in 2007)
- Large community and extensive documentation

**Cons:**
- Heaviest resource requirements — 2-4 GB RAM, disk grows fast
- PHP + MariaDB stack requires more maintenance than Go or Node.js alternatives
- Setup is more involved (web installer wizard, cron for report archiving)
- Dashboard is more complex — steeper learning curve
- Some useful features (heatmaps, session recording, A/B testing) require paid plugins
- UI feels dated compared to Plausible and Umami
- Report archiving cron job is required for performance on larger installs

**Best for:** Businesses that need full-featured analytics — funnels, e-commerce tracking, A/B testing, or Google Analytics migration. If you are replacing GA4 for a site with complex tracking requirements, Matomo is the only self-hosted option with comparable depth.

[Read our full guide: How to Self-Host Matomo](/apps/matomo/)

### 4. GoAccess — Best for Log Analysis

[GoAccess](https://goaccess.io) takes a completely different approach: it analyzes your web server access logs instead of using a JavaScript tracking snippet. No tracking script on your site, no cookies, no privacy implications at all — your web server already generates the data. GoAccess parses it into a real-time terminal dashboard or a static HTML report.

GoAccess runs as a single binary. No database. No containers required (though a Docker image exists). It reads Nginx, Apache, Caddy, or any CLF/Combined log format. Point it at a log file, and you get visitors, requests, referrers, 404s, geographic data, operating systems, and browsers within seconds.

The trade-off is accuracy. Log-based analytics cannot track JavaScript-driven single-page app navigation, and they miss nothing that the web server logs (bots, crawlers, asset requests) unless you filter carefully. GoAccess counts HTTP requests, not "page views" in the GA sense.

**Pros:**
- Zero JavaScript — no tracking script on your site
- No database — reads log files directly
- Terminal UI for real-time monitoring over SSH
- Static HTML report for sharing
- Minimal resource usage — processes millions of log lines quickly
- Supports Nginx, Apache, Caddy, and custom log formats
- WebSocket support for real-time HTML dashboard
- Available as a single binary or Docker container
- Captures data that JS trackers miss (RSS readers, API consumers, bots)

**Cons:**
- Log-based analysis is less accurate for page views than JS tracking
- Cannot track custom events, goals, or conversions
- No cookie-based session tracking — limited user journey data
- Counts bot traffic unless you configure filters
- Single-page apps with client-side routing are invisible
- No multi-site management from a single instance
- HTML reports are functional but not polished
- Requires access to raw web server logs

**Best for:** Sysadmins who want traffic visibility without adding JavaScript to their sites. Excellent as a complement to Plausible or Umami — GoAccess catches what JS trackers miss (RSS, API, bots), while JS trackers capture what logs miss (SPA navigation, events).

## Full Comparison Table

| Feature | Plausible CE | Umami | Matomo | GoAccess |
|---------|-------------|-------|--------|----------|
| Tracking method | JavaScript (<1 KB) | JavaScript (~2 KB) | JavaScript (~22 KB) | Server log parsing |
| Script size | <1 KB | ~2 KB | ~22 KB | None (no script) |
| Database | ClickHouse + PostgreSQL | PostgreSQL or MySQL | MariaDB/MySQL | None (reads logs) |
| Minimum RAM | 2 GB | 1 GB | 2 GB (4 GB recommended) | 256 MB |
| Containers required | 3 | 2 | 2 | 0-1 |
| Real-time dashboard | Yes | Yes (basic) | Yes | Yes (terminal + WebSocket) |
| Goals / Events | Yes | Custom events | Yes (advanced) | No |
| Funnels | No | No | Yes | No |
| E-commerce tracking | No | No | Yes | No |
| API | Yes (read) | Yes (read/write) | Yes (comprehensive) | No |
| Google Analytics import | No | No | Yes | No |
| Plugin system | No | No | Yes (marketplace) | No |
| GDPR compliant (no cookies) | Yes | Yes | Yes (cookieless mode) | Yes (no JS at all) |
| Mobile app | No | No | Yes (community) | No |
| License | AGPL-3.0 | MIT | GPL-3.0 | MIT |
| Multi-site support | Yes | Yes | Yes | Per-log-file |
| Pricing model | Free (self-hosted) | Free (self-hosted) | Free core + paid plugins | Free |

## How We Evaluated

We evaluated each tool on six criteria: **ease of setup** (how fast can you go from zero to tracking), **resource usage** (RAM, CPU, disk), **feature depth** (what data do you actually get), **privacy compliance** (cookie-free operation, GDPR readiness), **accuracy** (how well does it count real visitors), and **long-term maintenance** (database growth, upgrades, ongoing effort).

Plausible ranks first because it hits the best balance across all six. It is easy to set up, reasonably lightweight, accurate, privacy-compliant, and gives most site owners all the data they actually look at. Umami wins on simplicity and resource usage but offers fewer features. Matomo wins on depth but demands more from your server and your attention. GoAccess wins on zero-overhead privacy but cannot replace JS-based analytics for most use cases.

For most self-hosters running a blog, documentation site, or small web application, Plausible is the right first choice. Add Matomo only if you need funnels, e-commerce tracking, or GA migration. Add GoAccess as a complement if you want to see what your JS tracker misses.

## Related

- [How to Self-Host Plausible](/apps/plausible/)
- [How to Self-Host Umami](/apps/umami/)
- [How to Self-Host Matomo](/apps/matomo/)
- [Plausible vs Umami: Which Should You Self-Host?](/compare/plausible-vs-umami/)
- [Self-Hosted Alternatives to Google Analytics](/replace/google-analytics/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-strategy/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
- [Best Self-Hosted Monitoring Tools](/best/monitoring/)
- [How to Self-Host Grafana](/apps/grafana/)
