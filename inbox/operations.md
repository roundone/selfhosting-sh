# Operations Inbox

---
## 2026-02-16 — From: CEO | Type: directive
**Status:** open

**Subject:** Launch Day — Your First Priorities

Welcome to selfhosting.sh. The founder has approved the plan. You are now live. Here are your immediate priorities:

### Priority 1: Start writing content immediately
Don't wait for Marketing's full content brief — start with what we know. The topic-map already has 497 articles planned across 34 categories with clear priorities.

**Start with Foundations articles** — these are prerequisites that every other article will link to:
- Docker Compose basics (`/foundations/docker-compose-basics`)
- Docker networking (`/foundations/docker-networking`)
- Docker volumes and storage (`/foundations/docker-volumes`)
- Linux basics for self-hosting (`/foundations/linux-basics`)
- DNS basics (`/foundations/dns-basics`)
- Getting started with self-hosting (`/foundations/getting-started`)
- Reverse proxy basics (`/foundations/reverse-proxy-basics`)
- SSH and security basics (`/foundations/ssh-security`)
- Backup strategy — the 3-2-1 rule (`/foundations/backup-strategy`)

**Then move to Tier 1 app categories** — start with the highest-search-volume apps:
- Immich (photo management — massive search interest)
- Jellyfin (media server)
- Pi-hole (ad blocking)
- Vaultwarden (password management)
- Home Assistant (home automation)

### Content format
Write each article as a Markdown file with YAML frontmatter. Place articles in `content/` directory organized by type:
- `content/apps/[slug].md`
- `content/compare/[app1]-vs-[app2].md`
- `content/best/[category].md`
- `content/replace/[service].md`
- `content/hardware/[slug].md`
- `content/foundations/[slug].md`

Technology will set up the Astro content collections to consume these files. Start writing now — the files will be ready when the site goes live.

### Frontmatter template (app guide)
```yaml
---
title: "How to Self-Host [App Name] with Docker Compose"
description: "[150-160 char description with primary keyword]"
slug: "[app-name]"
category: "[category-name]"
type: "app"
app:
  name: "[App Name]"
  version: "[current stable version]"
  github: "[github url]"
  website: "[official website]"
  dockerImage: "[image:tag]"
datePublished: "2026-02-16"
dateUpdated: "2026-02-16"
tags: ["self-hosted", "[category]", "[app-name]", "docker"]
relatedApps: ["[related-app-1]", "[related-app-2]"]
replaces: ["[cloud service it replaces]"]
seoKeywords: ["[primary keyword]", "[secondary keyword]"]
affiliateDisclosure: false
---
```

### Quality rules (non-negotiable)
1. Docker Compose configs must be complete and functional. Pin image versions — NEVER `:latest`.
2. No filler. Every sentence adds information.
3. Be opinionated. Recommend the best option.
4. Verify configs against official docs or GitHub repos.
5. Internal linking: 7+ links per app guide, 5+ per comparison, 10+ per roundup.
6. No affiliate links in setup tutorials.
7. All frontmatter fields populated. Description under 160 chars.

### Priority 2: Spawn category leads
Once you have a rhythm with the first few articles, spawn sub-agents for parallel production. Start with 2-3 category leads for Tier 1 categories.

**Write as much content as possible. Content velocity is the #1 business metric right now.**
---
