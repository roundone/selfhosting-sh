---
title: "HedgeDoc vs Etherpad: Collaborative Editors Compared"
description: "HedgeDoc vs Etherpad comparison — Markdown-focused collaboration vs lightweight real-time text editing for your self-hosted setup."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "note-taking"
apps:
  - hedgedoc
  - etherpad
tags:
  - comparison
  - hedgedoc
  - etherpad
  - collaboration
  - self-hosted
  - notes
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

HedgeDoc is the better choice if your team writes in Markdown and wants structured documents with formatting previews, diagrams, and slide presentations. Etherpad is better if you need the simplest possible real-time editor — no accounts, no Markdown knowledge required, just open a link and start typing. Both are excellent at real-time collaboration, but they target different workflows.

## Overview

[HedgeDoc](https://hedgedoc.org/) is a real-time collaborative Markdown editor. It's the open-source successor to CodiMD (originally HackMD). Documents are written in Markdown with a split-pane editor showing source and preview side-by-side. It supports embedded diagrams (MermaidJS, PlantUML), math (KaTeX), and even slide presentations from Markdown.

[Etherpad](https://etherpad.org/) is one of the oldest real-time collaborative editors on the web — originally built by Google in 2008, then open-sourced. It's a rich-text editor where users type directly and see each other's changes instantly, with each user assigned a color. No Markdown, no special syntax — just plain collaborative writing.

## Feature Comparison

| Feature | HedgeDoc | Etherpad |
|---------|----------|----------|
| Editor type | Markdown (split-pane: source + preview) | Rich text (WYSIWYG) |
| Real-time collaboration | Yes | Yes |
| Account required | Optional (can allow anonymous) | No — open a pad and type |
| Authentication | Local, LDAP, OAuth2, SAML | Plugin-based (optional) |
| Document format | Markdown | Rich text / HTML |
| Export formats | Markdown, HTML, PDF (via print) | HTML, plain text, PDF, Word, ODF |
| Diagrams | MermaidJS, PlantUML, Vega-Lite | Via plugins only |
| Math support | KaTeX | Via plugins only |
| Slide presentations | Yes (Markdown to slides) | No |
| Version history | Yes — revision timeline | Yes — time slider playback |
| Plugin system | Limited | Extensive (200+ plugins) |
| API | Yes | Yes (comprehensive HTTP API) |
| Database | PostgreSQL | PostgreSQL, MySQL, SQLite (DirtyDB) |
| Docker support | Yes | Yes |
| Resource usage | ~300-500 MB RAM | ~200-300 MB RAM |

## Installation Complexity

Etherpad is simpler to deploy. A single container with DirtyDB (SQLite) works for testing, and adding PostgreSQL for production is straightforward. No authentication is needed by default — pads are accessible by URL. Configuration is via a `settings.json` file or environment variables.

HedgeDoc requires PostgreSQL from the start (no SQLite option). You need to configure authentication (even if just enabling anonymous access), set the domain URL correctly, and manage session secrets. It's not complex, but there are more knobs to turn compared to Etherpad.

## Performance and Resource Usage

Both are lightweight. Etherpad uses less RAM (~200-300 MB) because it's a simpler application. HedgeDoc uses ~300-500 MB because of Markdown rendering, diagram processing, and the preview pane.

For concurrent users, Etherpad scales better out of the box — it was designed from the ground up for many simultaneous editors on a single pad. HedgeDoc handles multiple editors well but is optimized more for document creation than mass-collaboration events.

## Community and Support

Etherpad has the longer history and a mature plugin ecosystem (200+ plugins for authentication, formatting, export, etc.). Development is steady if not rapid.

HedgeDoc has a smaller but active community. The project is actively maintained with regular releases. Documentation is solid and covers Docker deployment well. The upcoming HedgeDoc 2.0 rewrite (React frontend) is in development but not yet stable.

## Use Cases

### Choose HedgeDoc If...

- Your team writes in Markdown and wants a collaborative editor for it
- You need diagrams (MermaidJS), math (KaTeX), or slide presentations
- You want document organization with tags, pinning, and history
- You need authentication and user management
- You're writing technical documentation, meeting notes, or specs

### Choose Etherpad If...

- You want the simplest possible collaboration tool — no accounts, no learning curve
- Non-technical users need to collaborate (no Markdown knowledge required)
- You need a "shared scratchpad" for brainstorming or live events
- You want an extensive plugin system to customize behavior
- You need to export to Word, ODF, or other office formats
- You're running collaborative workshops, hackathons, or meetings with external participants

## Final Verdict

HedgeDoc is the better tool for technical teams that think in Markdown. The split-pane editor, diagram support, and structured document features make it a proper collaborative documentation tool. Etherpad is better for quick, frictionless collaboration where anyone can jump in — no syntax, no accounts, just typing. If your use case is "we need a shared document right now," Etherpad wins on simplicity. If your use case is "we need a collaborative platform for technical docs," HedgeDoc wins on capability.

## FAQ

### Can I migrate documents between HedgeDoc and Etherpad?

Not directly. HedgeDoc stores Markdown; Etherpad stores rich text. You can export from Etherpad to plain text and paste into HedgeDoc, but formatting translation isn't automated.

### Which is better for a wiki-like knowledge base?

Neither is ideal as a wiki. HedgeDoc is closer — it has document organization and linking. But for a proper knowledge base, look at [BookStack](/apps/bookstack), [Wiki.js](/apps/wiki-js), or [Outline](/apps/outline).

### Can Etherpad handle Markdown?

With the `ep_markdown` plugin, Etherpad can render Markdown, but it's not a first-class experience. If Markdown is your primary format, HedgeDoc is the right tool.

## Related

- [How to Self-Host HedgeDoc](/apps/hedgedoc)
- [How to Self-Host Etherpad](/apps/etherpad)
- [BookStack vs Wiki.js](/compare/bookstack-vs-wiki-js)
- [Best Self-Hosted Note Taking Apps](/best/note-taking)
- [Self-Hosted Notion Alternatives](/replace/notion)
- [Docker Compose Basics](/foundations/docker-compose-basics)
