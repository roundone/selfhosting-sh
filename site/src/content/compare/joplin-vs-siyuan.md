---
title: "Joplin vs SiYuan: Which to Self-Host?"
description: "Joplin Server vs SiYuan compared for self-hosted note taking — encrypted Markdown sync versus block-based knowledge management."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "note-taking"
apps:
  - joplin-server
  - siyuan
tags:
  - comparison
  - joplin-server
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

Joplin is the better choice if you prioritize end-to-end encryption, Markdown compatibility, and a battle-tested sync system. SiYuan is better if you want block-based editing with bidirectional links and graph views. Both are personal note systems — the choice comes down to Markdown versus blocks.

## Overview

Joplin Server is the sync backend for the Joplin note-taking application. Joplin clients (desktop, mobile, terminal) sync notes through the server. All editing happens in client apps. The server stores encrypted blobs when E2EE is enabled.

SiYuan is a block-based note application that uses a custom `.sy` JSON format. It offers a web UI served from Docker, plus desktop and mobile clients. Notes are organized in a notebook hierarchy with bidirectional links, block references, and a graph view.

## Feature Comparison

| Feature | Joplin (Server + Clients) | SiYuan |
|---------|--------------------------|--------|
| Data format | Markdown (.md) | Custom `.sy` JSON |
| Editor | Desktop app (Markdown) | Block-based WYSIWYG |
| E2E encryption | Yes (client-side) | No (server-side encryption only) |
| Bidirectional links | Via plugin | Native |
| Block references | No | Yes |
| Graph view | No | Yes |
| Web clipper | Yes (browser extension) | Yes |
| Desktop app | Yes (Electron, cross-platform) | Yes (Electron) |
| Mobile app | Yes (iOS, Android) | Yes (iOS, Android) |
| Terminal client | Yes | No |
| Plugins | 300+ community plugins | Limited extension system |
| Docker services | 2 (server + PostgreSQL) | 1 (single container) |
| RAM usage | 150–300 MB | 200–400 MB |
| Sync options | Joplin Server, S3, WebDAV, Dropbox | S3, WebDAV, SiYuan Cloud |
| Export | Markdown, JEX, HTML, PDF | Markdown, PDF, HTML, DOCX |
| Search | Full-text (client-side) | Full-text + SQL queries |

## Installation Complexity

**Joplin Server** needs two containers (server + PostgreSQL). Configure `APP_BASE_URL` and database URL. Default admin credentials are `admin@localhost` / `admin` — change immediately. Then configure each Joplin client to sync with the server URL.

**SiYuan** needs one container with one volume. Set `--accessAuthCode` for authentication. Access the web UI directly. Desktop clients connect for sync via S3 or WebDAV — SiYuan doesn't have its own sync protocol (beyond the paid SiYuan Cloud).

Joplin Server is slightly more complex to deploy but offers seamless multi-device sync. SiYuan deploys faster but requires separate sync configuration (S3 or WebDAV) for multi-device use.

## Performance and Resource Usage

Both are lightweight. Joplin Server + PostgreSQL uses 150–300 MB. SiYuan uses 200–400 MB in a single container. Neither is demanding.

Storage differs: Joplin stores notes as individual Markdown files (via sync blobs). SiYuan stores everything in `.sy` JSON files. Large vaults with many attachments consume similar amounts of storage on both platforms.

## Community and Support

Joplin has a massive community — 50k+ GitHub stars, 300+ plugins, active forum, and consistent development. Documentation is excellent. The project is one of the most popular open-source note apps.

SiYuan has a growing community, primarily Chinese-speaking. English documentation exists but is thinner. Development pace is fast with frequent releases. The paid SiYuan Cloud service funds ongoing development.

## Use Cases

### Choose Joplin If...
- End-to-end encryption is a requirement
- You want Markdown as the native format (portability)
- You value a rich plugin ecosystem
- You need a terminal client
- You want the largest community and best documentation

### Choose SiYuan If...
- You want block-based editing with block references
- Bidirectional links and graph views are important
- You prefer WYSIWYG over Markdown source editing
- You want a single-container deployment
- You value fast, modern UI design

## Final Verdict

Joplin is the mature, battle-tested choice with the best encryption story and a massive plugin ecosystem. If you value Markdown portability and don't want vendor lock-in, Joplin is the safe bet.

SiYuan is the more modern, visually polished option with features (block references, graph views) that Joplin doesn't match. The trade-off is a proprietary data format and a smaller community.

For most users, Joplin's encryption, Markdown compatibility, and plugin ecosystem make it the better long-term choice. If block-based editing is your must-have, SiYuan delivers.

## Related

- [How to Self-Host Joplin Server](/apps/joplin-server)
- [How to Self-Host SiYuan](/apps/siyuan)
- [Trilium vs Joplin](/compare/trilium-vs-joplin)
- [SiYuan vs Obsidian](/compare/siyuan-vs-obsidian)
- [AppFlowy vs AFFiNE](/compare/appflowy-vs-affine)
- [Best Self-Hosted Note Taking](/best/note-taking)
- [Replace Evernote](/replace/evernote)
