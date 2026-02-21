---
title: "Linkding vs Wallabag: Bookmarks or Read Later?"
description: "Linkding vs Wallabag compared — lightweight bookmark manager versus full read-it-later app for self-hosted article saving."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "bookmarks-read-later"
apps:
  - linkding
  - wallabag
tags:
  - comparison
  - linkding
  - wallabag
  - bookmarks
  - read-later
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Linkding and Wallabag solve different problems. Linkding is a bookmark manager — it saves URLs with tags and metadata so you can find them later. Wallabag is a read-it-later app — it saves the full article content for offline, distraction-free reading. If you want to organize links like a filing cabinet, use Linkding. If you want to save articles and actually read them later like Pocket, use Wallabag. Many people run both.

## Overview

**[Linkding](/apps/linkding/)** is a lightweight, self-hosted bookmark manager built with Python and Django. You save a URL, linkding fetches the title and description, and you tag it for later retrieval. It runs as a single Docker container with SQLite, uses about 50 MB of RAM, and gives you fast full-text search across all your bookmarks. The interface is intentionally minimal — a search bar, a tag sidebar, and a list of links.

**[Wallabag](/apps/wallabag/)** is a self-hosted read-it-later application built with PHP and Symfony. When you save a URL, Wallabag downloads the entire article, strips out ads and navigation chrome, and stores the clean content locally. You can read saved articles offline, annotate them, send them to a Kindle, and export them in multiple formats. It requires PostgreSQL (or MySQL) plus Redis, and runs as a multi-container stack consuming around 150 MB of RAM.

The core distinction: Linkding saves *links*. Wallabag saves *content*.

## Feature Comparison

| Feature | Linkding | Wallabag |
|---------|----------|----------|
| **Core function** | Bookmark management (URLs + metadata) | Full article archival and reading |
| **Content storage** | URL, title, description, notes | Complete article text, images, metadata |
| **Offline reading** | No — links require internet access | Yes — full content stored locally |
| **Tagging** | Yes — autocomplete, bulk edit | Yes — plus automatic tagging rules |
| **Full-text search** | Across titles, descriptions, tags, and notes | Across entire article content |
| **Annotations** | No | Yes — highlight and annotate passages |
| **Browser extensions** | Chrome, Firefox | Chrome, Firefox (via Wallabagger) |
| **Mobile apps** | No native apps (responsive web UI) | Official Android and iOS apps |
| **REST API** | Yes — full CRUD with token auth | Yes — OAuth2-based |
| **Import/Export** | Netscape HTML bookmark format | Pocket, Instapaper, Pinboard, browser HTML |
| **RSS feed output** | No | Yes — feed of saved articles |
| **E-reader integration** | No | Yes — send to Kindle/Kobo via email |

## Installation Complexity

**Linkding** is one of the simplest self-hosted apps to deploy. A single container, one volume, and three environment variables:

```yaml
services:
  linkding:
    image: sissbruecker/linkding:1.45.0
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - linkding-data:/etc/linkding/data
    environment:
      LD_SUPERUSER_NAME: "admin"
      LD_SUPERUSER_PASSWORD: "changeme"
```

That is a working deployment. SQLite is the default — no database container needed. Total setup time: under 2 minutes.

**Wallabag** requires three containers — the app, PostgreSQL, and Redis:

```yaml
services:
  wallabag:
    image: wallabag/wallabag:2.6.14
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      SYMFONY__ENV__DATABASE_DRIVER: "pdo_pgsql"
      SYMFONY__ENV__DATABASE_HOST: "wallabag_db"
      SYMFONY__ENV__DATABASE_PORT: "5432"
      SYMFONY__ENV__DATABASE_NAME: "wallabag"
      SYMFONY__ENV__DATABASE_USER: "wallabag"
      SYMFONY__ENV__DATABASE_PASSWORD: "changeme"
      SYMFONY__ENV__DOMAIN_NAME: "http://localhost:8080"
      SYMFONY__ENV__SECRET: "generate-a-random-string"
    depends_on:
      - wallabag_db
      - wallabag_redis

  wallabag_db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: wallabag
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: wallabag

  wallabag_redis:
    image: redis:7-alpine
    restart: unless-stopped
```

Setup takes 5-10 minutes. The first startup runs database migrations that need 30-60 seconds. More environment variables to configure, more services to maintain, more things that can break.

**Winner: Linkding**, by a wide margin. Single container versus three. SQLite versus PostgreSQL + Redis. Three env vars versus a dozen.

## Performance and Resource Usage

| Metric | Linkding | Wallabag |
|--------|----------|----------|
| **RAM (idle)** | ~50 MB | ~150 MB |
| **RAM (active)** | ~120 MB during large imports | ~300 MB during article processing |
| **CPU** | Minimal | Low — spikes during content parsing |
| **Disk (app)** | ~30 MB | ~200 MB |
| **Disk (data)** | ~1 KB per bookmark | ~50-500 KB per article (full text + images) |
| **Containers** | 1 (optionally 2 with PostgreSQL) | 3 (app + PostgreSQL + Redis) |
| **Startup time** | ~2 seconds | ~30-60 seconds (migrations on first run) |

Linkding is roughly 3x lighter on RAM and uses a fraction of the disk space because it stores only metadata, not article content. At 10,000 saved items, a Linkding database is about 10 MB. A Wallabag database with 10,000 full articles could be 1-5 GB depending on how image-heavy the content is.

Linkding runs comfortably on a Raspberry Pi. Wallabag can run on a Pi but the multi-container stack and article processing will feel sluggish on low-end hardware.

**Winner: Linkding.** It uses fewer resources by an order of magnitude — but that is because it stores less data. Wallabag's higher resource usage is the cost of storing full article content.

## Community and Support

| Metric | Linkding | Wallabag |
|--------|----------|----------|
| **GitHub stars** | ~7,000+ | ~10,000+ |
| **First release** | 2020 | 2013 (as poche, renamed 2014) |
| **License** | MIT | MIT |
| **Language** | Python (Django) | PHP (Symfony) |
| **Active development** | Yes — regular releases | Yes — maintained, slower release cadence |
| **Documentation** | Good — GitHub README + wiki | Good — dedicated docs site |
| **Third-party integrations** | REST API, browser extensions | Mobile apps, browser extensions, e-reader support, RSS |

Wallabag has been around longer (since 2013) and has a larger community. It has official mobile apps, which Linkding lacks. Linkding is newer but has grown quickly because of its simplicity — it hits the "just works" sweet spot that attracts self-hosters tired of complex setups.

Both projects are actively maintained and MIT-licensed. Neither is at risk of abandonment.

## Use Cases

### Choose Linkding If...

- You want a fast, searchable index of URLs you have visited or want to revisit
- You primarily save links for reference, not for reading later
- You value minimal resource usage and single-container simplicity
- You run a low-powered server (Raspberry Pi, cheap VPS)
- You want to replace browser bookmarks with something searchable and tagged
- You already use Raindrop.io or Pinboard and want a self-hosted equivalent
- You do not need offline reading or article archival

### Choose Wallabag If...

- You save articles to read later and want the full content available offline
- You want to read on mobile without ads, popups, or cookie banners
- You highlight and annotate articles as you read
- You send articles to a Kindle or Kobo for distraction-free reading
- You want automatic tagging rules to organize incoming content
- You are replacing Pocket or Instapaper specifically
- You want RSS feeds of your saved articles to pipe into other tools like [FreshRSS](/apps/freshrss/)

### Run Both If...

You want a lightweight bookmark index *and* full article archival for selected content. Linkding handles the bookmarks (quick saves, reference links, resources). Wallabag handles the reading list (long articles you actually plan to read). Both have APIs, so you could automate sending certain Linkding bookmarks to Wallabag for full archival.

## Final Verdict

These are complementary tools, not competitors. Linkding is a bookmark manager. Wallabag is a read-it-later app. Comparing them is like comparing a file cabinet to a reading nook — both store information, but the intent and workflow are different.

**For most self-hosters who just want to save and organize links:** Use [Linkding](/apps/linkding/). It is fast, lightweight, and does bookmark management better than anything else in the self-hosted space. Deploy it in under two minutes and forget about it.

**For anyone who saves articles to actually read later:** Use [Wallabag](/apps/wallabag/). The full content archival, clean reading view, mobile apps, and Kindle integration make it the definitive self-hosted Pocket replacement.

**If you want both bookmarking and read-later in a single app:** Look at [Linkwarden](/apps/linkwarden/), which combines bookmark management with full-page archival and collaborative collections — though it is heavier than either Linkding or Wallabag individually.

## Related

- [How to Self-Host Linkding](/apps/linkding/)
- [How to Self-Host Wallabag](/apps/wallabag/)
- [How to Self-Host Linkwarden](/apps/linkwarden/)
- [Self-Hosted Alternatives to Pocket](/replace/pocket/)
- [How to Self-Host FreshRSS](/apps/freshrss/)
- [Best Self-Hosted Bookmark & Read Later Apps](/best/bookmarks-read-later/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
