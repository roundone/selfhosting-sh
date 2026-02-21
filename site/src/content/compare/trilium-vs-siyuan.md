---
title: "Trilium vs SiYuan: Which to Self-Host?"
description: "TriliumNext vs SiYuan compared for personal knowledge management — note cloning versus block references, SQLite versus JSON files."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "note-taking"
apps:
  - trilium
  - siyuan
tags:
  - comparison
  - trilium
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

TriliumNext is the better choice for users who think in hierarchies with note cloning and custom attributes. SiYuan is better for users who want block-level referencing, a Notion-like editing experience, and bidirectional links with graph views. Both are excellent personal knowledge bases — the choice comes down to organizational philosophy.

## Overview

TriliumNext (community fork of the original Trilium) is a hierarchical note-taking application where notes live in a tree structure and can be cloned (exist in multiple locations). It stores everything in an encrypted SQLite database and syncs between server and desktop clients.

SiYuan is a block-based note system from the B3log community. Notes are stored as custom `.sy` JSON files (not Markdown). It features bidirectional links, block-level references, graph views, and a Notion-like WYSIWYG editor. Both desktop and web interfaces are available.

## Feature Comparison

| Feature | TriliumNext | SiYuan |
|---------|-------------|--------|
| Data format | SQLite (encrypted) | Custom `.sy` JSON |
| Editor | WYSIWYG + code notes | Block-based WYSIWYG |
| Note cloning | Yes (note in multiple locations) | No |
| Block references | No | Yes |
| Bidirectional links | Relation maps | Yes (with backlink panels) |
| Graph view | Relation maps (limited) | Full graph view |
| Custom attributes | Yes (labels + relations) | Tags + attributes |
| Search | Full-text + attribute queries | Full-text + SQL queries |
| Desktop sync | Yes (built-in) | Via S3/WebDAV/SiYuan Cloud |
| Mobile app | No (web access) | Yes (iOS, Android) |
| Docker services | 1 | 1 |
| RAM usage | 150–300 MB | 200–400 MB |
| Encryption | Database-level (password-based) | No encryption at rest |
| Export | Markdown, HTML | Markdown, PDF, DOCX, HTML |
| Web clipper | Yes | Yes |

## Installation Complexity

Both are single-container deployments. TriliumNext sets a password on first launch — this password also encrypts the database. SiYuan uses `--accessAuthCode` for simple authentication and requires `user: "1000:1000"` in Docker to avoid root-owned files.

Equal complexity. Both deploy in under 2 minutes.

## Performance and Resource Usage

TriliumNext is slightly lighter at 150–300 MB. Its SQLite database is compact and efficient for single-user workloads.

SiYuan uses 200–400 MB. Its `.sy` file format means more disk I/O than SQLite for large note collections, but the difference is negligible in practice.

Both run comfortably on a Raspberry Pi 4 or any low-end VPS.

## Community and Support

TriliumNext is maintained by a community that forked the project after the original developer stepped back. Development is steady with regular releases. The community is English-speaking with good documentation.

SiYuan's community is primarily Chinese-speaking with growing English documentation. Development is very active — releases are frequent. The paid SiYuan Cloud service funds ongoing development.

## Use Cases

### Choose TriliumNext If...
- Note cloning (one note, multiple locations) is your key organizational tool
- You want database-level encryption
- You need custom attributes and metadata on notes
- You prefer desktop client sync without third-party services
- English-language community support matters

### Choose SiYuan If...
- Block-level references are essential
- You want a full graph view of note connections
- You need mobile apps (iOS, Android)
- You prefer Notion-like block editing
- SQL-based search queries appeal to you

## Final Verdict

TriliumNext's cloning model is unique — no other note app lets you place the same note in multiple tree locations without duplication. If your brain organizes information into overlapping categories (a note about Docker that belongs in both your "DevOps" and "Self-Hosting" trees), TriliumNext handles this natively.

SiYuan's block reference model is also unique in its implementation — referencing individual blocks (paragraphs, headings, lists) across your entire knowledge base. Combined with the graph view, it's the strongest "second brain" tool for connection-oriented thinking.

For hierarchical thinkers: TriliumNext. For graph thinkers: SiYuan. Both are strong choices for personal knowledge management.

## Related

- [How to Self-Host TriliumNext](/apps/trilium/)
- [How to Self-Host SiYuan](/apps/siyuan/)
- [Trilium vs Joplin](/compare/trilium-vs-joplin/)
- [SiYuan vs Obsidian](/compare/siyuan-vs-obsidian/)
- [Joplin vs SiYuan](/compare/joplin-vs-siyuan/)
- [Best Self-Hosted Note Taking](/best/note-taking/)
- [Replace Evernote](/replace/evernote/)
