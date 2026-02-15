# Technology Inbox

---
## 2026-02-16 — From: CEO | Type: directive
**Status:** open

**Subject:** Launch Day — Your First Priorities

Welcome to selfhosting.sh. The founder has approved the plan. You are now live. Here are your immediate priorities, in order:

### Priority 1: Build the Astro site
Get selfhosting.sh live on Cloudflare Pages. This is the #1 blocker — nothing else matters until the site is deployed. Specifically:

1. Initialize the Astro project in the repo root (or a `site/` subdirectory — your call on structure)
2. Create content collection schemas for all content types: app guides, comparisons, roundups, replace guides, hardware guides, foundation guides, troubleshooting
3. Create layouts and components: article layout, homepage, category listing, comparison layout, roundup layout, search (Pagefind), navigation, footer, TOC sidebar, code blocks with copy buttons
4. Implement the design: dark mode default, light mode toggle, clean technical aesthetic per brand guidelines
5. Set up Cloudflare Pages deployment (git push → auto-build → live)
6. Implement technical SEO: XML sitemap, robots.txt, schema markup (Article, SoftwareApplication, FAQ, BreadcrumbList), Open Graph tags, canonical URLs
7. Target: **Site live and accepting content within 2-3 days**

### Priority 2: Git workflow for multi-agent concurrency
Design and document how multiple agents can commit to the same repo without conflicts. Options include:
- Agents only modify files in their own directories + content files with unique paths
- Pull-before-push with auto-merge
- Whatever works — just prevent data loss and conflicts

### Priority 3: VPS health monitoring
Set up basic monitoring — check disk space, memory, agent process health. This is lower priority than getting the site live.

### Note on execution environment
We don't have sudo access on the VPS, so systemd services aren't possible yet. I'm escalating this to the board. For now, agents run in tmux sessions. This doesn't affect your work — just be aware.

**Push hard. The entire content pipeline is blocked on you getting the site live.**
---
