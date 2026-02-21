---
title: "Trilium vs Joplin: Which to Self-Host?"
description: "Trilium Notes vs Joplin compared — knowledge management features, sync, editors, and use cases for self-hosted note-taking."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "note-taking"
apps:
  - trilium
  - joplin-server
tags:
  - comparison
  - trilium
  - joplin
  - self-hosted
  - note-taking
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Trilium is better for personal knowledge management — hierarchical notes, relation maps, note cloning, and built-in scripting make it a power tool for building interconnected knowledge bases. Joplin is better for straightforward note-taking with sync — Markdown notes, mobile apps, end-to-end encryption, and a familiar notebook/tag structure.

## Overview

**TriliumNext Notes** is a hierarchical note-taking app designed for knowledge management. Stores notes in SQLite with rich text, code blocks, relation maps, and a scripting engine. Syncs between server and desktop clients. Community fork of the original Trilium (now unmaintained).

**Joplin** is a Markdown-based note-taking app with desktop and mobile clients. Supports notebooks, tags, to-do lists, and end-to-end encryption. Joplin Server provides self-hosted sync as an alternative to cloud services like Dropbox or OneDrive.

## Feature Comparison

| Feature | Trilium Notes | Joplin |
|---------|--------------|--------|
| Note format | Rich text + code (SQLite storage) | Markdown files |
| Note hierarchy | Deep tree structure with cloning | Notebooks → notes (flat within notebook) |
| Relation maps | Built-in visual maps | No |
| Note cloning | Yes (same note in multiple locations) | No |
| Tags | Yes (as attributes) | Yes (traditional tags) |
| Mobile app | No native app (web UI only) | Native iOS and Android |
| End-to-end encryption | Password-protected database | Full E2EE (per-note encryption) |
| Scripting | Built-in JavaScript scripting | No |
| Sync architecture | Server ↔ Desktop (bidirectional) | Server → multiple clients |
| Web clipper | Browser extension | Browser extension |
| To-do lists | Via checkboxes | Dedicated to-do note type |
| Search | Full-text (SQLite FTS) | Full-text |
| Export formats | HTML, Markdown, single-file backup | Markdown, JEX, HTML, PDF |
| API | REST + ETAPI | REST (Data API) |

## Installation Complexity

**Trilium** is very simple — single Docker container with SQLite. No database server, no Redis. Start and go.

**Joplin Server** requires PostgreSQL. Two containers (server + database). Default admin credentials, then create user accounts for each sync client.

Trilium is simpler to deploy. Joplin Server has a more conventional but slightly heavier stack.

## Performance and Resource Usage

| Resource | Trilium | Joplin Server |
|----------|---------|--------------|
| RAM (idle) | ~100 MB | ~150 MB (+ PostgreSQL) |
| RAM (full stack) | ~100 MB | ~400 MB |
| CPU | Very low | Low |
| Storage | SQLite database | PostgreSQL database |

Trilium is lighter because it uses embedded SQLite. Joplin Server's PostgreSQL adds overhead but enables better concurrent access for multi-user deployments.

## Community and Support

Trilium: The original project (~27,000 GitHub stars) is no longer maintained. TriliumNext (the community fork) has a growing community and active development. The transition introduces some uncertainty about long-term direction.

Joplin: ~47,000 GitHub stars, active development by the original creator, strong community on the Joplin forum, and regular releases. More mature and stable project overall.

## Use Cases

### Choose Trilium If...

- You want a personal knowledge base with deep hierarchical organization
- Note cloning (same note in multiple locations) matters to you
- You want visual relation maps between notes
- Built-in scripting for custom workflows is valuable
- You work primarily from desktop/web (no native mobile app)
- You want the lightest possible deployment (single container, no database server)

### Choose Joplin If...

- You need native mobile apps (iOS and Android)
- End-to-end encryption is a requirement
- You prefer plain Markdown files
- You want to sync across many devices (desktop + phone + tablet)
- You need to-do list functionality
- You want a mature, stable project with long-term maintenance confidence
- Multiple family members or team members need separate accounts

## Final Verdict

**Choose based on your use case.** For a personal knowledge base where you build interconnected notes, tag with attributes, and visualize relationships, Trilium is more powerful. For day-to-day note-taking across multiple devices with great mobile apps and E2EE, Joplin is the more practical choice.

Most people who just want "notes that sync" should start with Joplin. People who want a "second brain" with deep organizational features should try Trilium.

## Related

- [How to Self-Host Trilium Notes](/apps/trilium/)
- [How to Self-Host Joplin Server](/apps/joplin-server/)
- [How to Self-Host BookStack](/apps/bookstack/)
- [Best Self-Hosted Note Taking](/best/note-taking/)
- [Replace Evernote](/replace/evernote/)
- [Replace OneNote](/replace/onenote/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
