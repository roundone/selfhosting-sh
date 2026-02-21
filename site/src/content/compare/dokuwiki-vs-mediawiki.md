---
title: "DokuWiki vs MediaWiki: Which Wiki Engine?"
description: "DokuWiki vs MediaWiki compared for self-hosted wikis. File-based simplicity versus Wikipedia's engine. Features, setup, and scaling."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "note-taking"
apps:
  - dokuwiki
  - mediawiki
tags:
  - comparison
  - dokuwiki
  - mediawiki
  - self-hosted
  - wiki
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

DokuWiki is the better choice for small to medium teams that want simplicity — no database, flat-file storage, and minimal maintenance. MediaWiki is the right choice for large, public-facing wikis that need MediaWiki's proven scalability, structured data (via Semantic MediaWiki), and the Wikipedia-like experience users already know. For internal team documentation, DokuWiki wins. For public knowledge bases at scale, MediaWiki wins.

## Overview

**DokuWiki** is a file-based wiki that stores all content in plain text files. No database required. Built with PHP, it's been around since 2004 and has a massive plugin ecosystem. Designed for small to medium documentation needs. [DokuWiki site](https://www.dokuwiki.org/)

**MediaWiki** powers Wikipedia and thousands of other wikis. Built with PHP, it uses MySQL/MariaDB and is designed for large-scale collaborative editing. It's the most widely deployed wiki software in the world. [MediaWiki site](https://www.mediawiki.org/)

## Feature Comparison

| Feature | DokuWiki | MediaWiki |
|---------|----------|-----------|
| Storage | Plain text files (no database) | MySQL/MariaDB database |
| Markup | DokuWiki syntax | Wikitext (MediaWiki syntax) |
| WYSIWYG | Plugin (limited) | VisualEditor extension |
| Search | File-based full-text | Database-powered full-text |
| Templates | Yes (plugin) | Yes (native templates/transclusion) |
| Categories | Namespaces | Categories + namespaces |
| Structured data | No | Semantic MediaWiki extension |
| User permissions | ACL (namespace-based) | User groups + page protection |
| API | XML-RPC, REST (plugin) | REST and Action API |
| Media handling | Upload + media manager | Upload + Commons integration |
| Revision history | Yes (file-based diffs) | Yes (database diffs) |
| Interwiki links | Yes | Yes |
| Plugin ecosystem | 1,000+ plugins | 1,200+ extensions |
| Localization | 50+ languages | 400+ languages |
| Scalability | Hundreds of pages | Millions of pages |
| Caching | File cache | Memcached/Redis + Varnish |
| Docker image | `lscr.io/linuxserver/dokuwiki` | `mediawiki` (official) |
| License | GPL-2.0 | GPL-2.0 |

## Installation Complexity

**DokuWiki** is one of the simplest wikis to deploy. No database — just mount a volume and start the container. Complete the web-based installer by setting a wiki name and admin password. Done in 5 minutes.

**MediaWiki** requires MySQL/MariaDB, a web-based installer that generates `LocalSettings.php`, and more initial configuration. The Docker image requires you to run through the installer, download the generated config file, and mount it back into the container. Functional but more steps.

## Performance and Resource Usage

| Metric | DokuWiki | MediaWiki |
|--------|----------|-----------|
| RAM (idle) | ~50-80 MB | ~150-300 MB |
| RAM (active) | ~100-150 MB | ~300-500 MB |
| CPU | Very low | Low-moderate |
| Disk (app) | ~100 MB | ~200 MB |
| Database | None | MySQL/MariaDB |
| Pages before slowdown | ~5,000-10,000 | Millions+ |
| Caching needed | No | Yes (for scale) |

DokuWiki is dramatically lighter. MediaWiki at small scale is overbuilt but performs well. At large scale, MediaWiki with caching (Memcached, Varnish) handles millions of pages — DokuWiki's file-based approach starts struggling past 10,000 pages.

## Community and Support

**DokuWiki** has a loyal community, extensive documentation, and a 20-year track record. Development pace is slow but stable. The plugin ecosystem covers most needs.

**MediaWiki** has a massive community — it powers Wikipedia. Documentation is exhaustive. Extensions are numerous but quality varies. The MediaWiki community is enterprise-scale with professional support available.

## Use Cases

### Choose DokuWiki If...

- You want the simplest possible wiki (no database)
- Your wiki will have under 5,000 pages
- You want easy backups (just copy the data directory)
- You're running on minimal hardware (Raspberry Pi, small VPS)
- You want internal team documentation, not a public wiki

### Choose MediaWiki If...

- You're building a large public-facing wiki
- You need structured data (Semantic MediaWiki)
- You want Wikipedia-style editing that users already know
- You need to scale to tens of thousands of pages or more
- You want VisualEditor for WYSIWYG editing
- You need advanced user permission management

## Final Verdict

**DokuWiki for internal documentation.** No database, minimal resources, dead-simple backups, and it handles small-to-medium wikis perfectly. The trade-off is limited scalability and a dated UI.

**MediaWiki for public knowledge bases.** If you're building something Wikipedia-sized (or even hundreds of pages that need to be publicly accessible), MediaWiki's proven architecture, VisualEditor, and structured data capabilities are unmatched. The trade-off is complexity.

## FAQ

### Can I migrate between DokuWiki and MediaWiki?

Community tools exist for both directions, but the markup syntaxes differ significantly. For small wikis (<100 pages), manual migration with copy-paste is faster than debugging an automated converter. For larger wikis, the DokuWiki-to-MediaWiki importer handles basic content but loses plugin-specific formatting.

### Is MediaWiki overkill for a small team?

For a team of 5-20 people writing internal docs, yes. MediaWiki is designed for the scale of Wikipedia. DokuWiki or [BookStack](/apps/bookstack/) would be more appropriate for small teams.

### Which is more secure?

MediaWiki has a larger attack surface (database, PHP, extensions) but also has a larger security team (Wikimedia Foundation). DokuWiki's simplicity (no database) reduces attack vectors. Both receive regular security updates.

### Does DokuWiki scale at all?

DokuWiki handles thousands of pages fine. Performance degrades with very large link indexes and search across 10,000+ pages. For most organizations, this limit is never reached. If you're unsure, start with DokuWiki and migrate if you outgrow it.

## Related

- [Wiki.js vs DokuWiki](/compare/wikijs-vs-dokuwiki/)
- [Wiki.js vs BookStack](/compare/wikijs-vs-bookstack/)
- [Self-Hosted Alternatives to Confluence](/replace/confluence/)
- [Best Self-Hosted Note Taking](/best/note-taking/)
- [Best Self-Hosted Wiki](/best/wiki/)
