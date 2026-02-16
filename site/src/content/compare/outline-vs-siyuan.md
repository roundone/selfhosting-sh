---
title: "Outline vs SiYuan: Which to Self-Host?"
description: "Outline vs SiYuan compared for self-hosted knowledge management — team wiki versus personal block-based note system."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "note-taking-knowledge"
apps:
  - outline
  - siyuan
tags:
  - comparison
  - outline
  - siyuan
  - self-hosted
  - note-taking
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Outline is the better choice for teams needing a collaborative wiki. SiYuan is better for individual users who want a block-based, bidirectional-linking note system with offline desktop support. They target different users entirely — team knowledge sharing versus personal knowledge management.

## Overview

Outline is a team knowledge base with a Notion-like editor, real-time collaboration, and deep permissions. It requires PostgreSQL, Redis, and an external OIDC provider.

SiYuan is a block-based personal knowledge management system from the B3log community. It uses a custom `.sy` JSON format (not Markdown), supports bidirectional links, and offers a Notion-like block editor. The Docker image serves the web UI, but SiYuan also has desktop and mobile clients.

## Feature Comparison

| Feature | Outline | SiYuan |
|---------|---------|--------|
| Target user | Teams | Individuals |
| Editor | Slash-command Markdown | Block-based WYSIWYG |
| Data format | Markdown (internal) | Custom `.sy` JSON |
| Real-time collab | Yes | No |
| Bidirectional links | No | Yes |
| Block references | No | Yes (block-level linking) |
| Graph view | No | Yes |
| Permissions | Per-collection/document | Access code only |
| Authentication | OIDC required | Simple access code |
| Desktop app | No (web-only) | Yes (Electron) |
| Mobile app | No | Yes (iOS, Android) |
| Docker services | 3 (app + PostgreSQL + Redis) | 1 (single container) |
| RAM usage | 400–800 MB | 200–400 MB |
| S3 sync | App storage option | Yes (S3, WebDAV) |
| Export formats | Markdown, HTML, PDF | Markdown, PDF, HTML, DOCX |

## Installation Complexity

**Outline** is complex to deploy: three services, OIDC configuration, secret generation, URL matching. A working setup takes 20–30 minutes.

**SiYuan** is simple: single container, one volume, optional `--accessAuthCode` flag. Running in under 2 minutes. Note: `user: "1000:1000"` should be set in Docker to avoid root-owned files.

## Performance and Resource Usage

SiYuan is lighter — 200–400 MB for the single container. Everything runs in one process with no external database.

Outline needs 400–800 MB across three services. The PostgreSQL and Redis overhead exists even for small installations.

## Community and Support

Outline has a professional team behind it with good documentation, though self-hosting docs lag behind the hosted product. English-first community.

SiYuan's community is primarily Chinese-speaking (the project is from China). English documentation exists but is sometimes machine-translated. The development pace is fast with frequent releases. The project has a paid cloud sync service that funds development.

## Use Cases

### Choose Outline If...
- You need a team knowledge base with collaboration
- Real-time multi-user editing is required
- You want per-document permissions
- You already have OIDC infrastructure
- Markdown compatibility matters

### Choose SiYuan If...
- You want a personal block-based knowledge system
- Bidirectional links and graph views are important
- You need offline desktop and mobile access
- You want a single-container deployment
- You prefer visual block editing over Markdown

## Final Verdict

Outline is for teams. SiYuan is for individuals. The feature sets barely overlap.

If you need collaborative documentation, Outline gives you a Notion-like experience. If you need a personal Notion-like note system with bidirectional linking and offline access, SiYuan delivers that.

Be aware of SiYuan's non-standard data format (`.sy` JSON) — migrating away is more work than from Markdown-based tools. If data portability matters, consider [Joplin](/apps/joplin-server) or [TriliumNext](/apps/trilium) instead.

## Related

- [How to Self-Host Outline](/apps/outline)
- [How to Self-Host SiYuan](/apps/siyuan)
- [SiYuan vs Obsidian](/compare/siyuan-vs-obsidian)
- [Outline vs Notion Alternatives](/compare/outline-vs-notion-alternatives)
- [Wiki.js vs Outline](/compare/wiki-js-vs-outline)
- [Best Self-Hosted Note Taking](/best/note-taking)
- [Replace Notion](/replace/notion)
