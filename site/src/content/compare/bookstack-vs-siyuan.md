---
title: "BookStack vs SiYuan: Which to Self-Host?"
description: "BookStack vs SiYuan compared for self-hosted knowledge management — team documentation platform versus personal block-based notes."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "note-taking"
apps:
  - bookstack
  - siyuan
tags:
  - comparison
  - bookstack
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

BookStack is the better choice for team documentation and shared knowledge bases. SiYuan is better for personal knowledge management with block references and bidirectional links. These solve fundamentally different problems — team wiki versus personal notes.

## Overview

BookStack is a team documentation platform that organizes content into shelves, books, chapters, and pages. It features a WYSIWYG editor, role-based access control, SSO integration, and audit logging. Built on PHP/Laravel with MariaDB.

SiYuan is a personal knowledge management system with block-based editing, bidirectional links, and graph views. It stores notes in a custom `.sy` JSON format and offers desktop, mobile, and web interfaces. Built on Go/Node.js with embedded storage.

## Feature Comparison

| Feature | BookStack | SiYuan |
|---------|-----------|--------|
| Target user | Teams | Individuals |
| Organization | Shelves → Books → Chapters → Pages | Notebooks → Documents → Blocks |
| Editor | WYSIWYG + Markdown | Block-based WYSIWYG |
| Multi-user | Yes (RBAC) | Single user (access code) |
| Block references | No | Yes |
| Bidirectional links | No | Yes |
| Graph view | No | Yes |
| SSO | LDAP + SAML + OIDC | No |
| API | REST API | REST API |
| Desktop app | No (web-only) | Yes (Electron) |
| Mobile app | No | Yes (iOS, Android) |
| Docker services | 2 (app + MariaDB) | 1 |
| RAM usage | ~400 MB | 200–400 MB |
| Data portability | Markdown, HTML, PDF export | Markdown, PDF, DOCX, HTML |
| Revision history | Yes (per-page) | Yes |
| Audit log | Yes (detailed) | No |

## Installation Complexity

**BookStack** needs two containers. Generate `APP_KEY`, configure `APP_URL` and database credentials. Default admin login is `admin@admin.com` / `password`. Straightforward.

**SiYuan** needs one container. Set `--accessAuthCode` for security and `user: "1000:1000"` for proper file permissions. Simpler deployment.

SiYuan is marginally simpler, but both are easy.

## Performance and Resource Usage

Similar. BookStack's PHP + MariaDB stack uses approximately 400 MB. SiYuan uses 200–400 MB in a single container. Neither is resource-intensive.

## Use Cases

### Choose BookStack If...
- You need team documentation with permissions
- Multiple users need to read and edit
- SSO integration is required
- Audit logging matters
- You want structured book/chapter/page hierarchy

### Choose SiYuan If...
- You need a personal note system
- Block references and bidirectional links are important
- You want desktop and mobile apps
- You think in connections, not hierarchies
- You prefer offline-first with optional sync

## Final Verdict

These aren't competitors — they're complementary tools. BookStack is for sharing knowledge across a team with proper access control. SiYuan is for building your personal knowledge graph.

If you're choosing one for team documentation, BookStack is the only answer here. If you're choosing one for personal notes, SiYuan is the better tool. Many self-hosters run both.

## Related

- [How to Self-Host BookStack](/apps/bookstack/)
- [How to Self-Host SiYuan](/apps/siyuan/)
- [BookStack vs Wiki.js](/compare/bookstack-vs-wiki-js/)
- [BookStack vs Outline](/compare/bookstack-vs-outline/)
- [SiYuan vs Obsidian](/compare/siyuan-vs-obsidian/)
- [Best Self-Hosted Note Taking](/best/note-taking/)
- [Replace Notion](/replace/notion/)
