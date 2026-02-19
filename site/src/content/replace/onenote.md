---
title: "Self-Hosted Alternatives to OneNote"
description: "Best self-hosted OneNote alternatives — Joplin, Trilium, BookStack, and more for private note-taking without Microsoft's cloud."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "note-taking-knowledge"
apps:
  - joplin-server
  - trilium
  - bookstack
  - siyuan
tags:
  - alternative
  - onenote
  - self-hosted
  - replace
  - note-taking
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Replace OneNote?

**Microsoft ecosystem dependency.** OneNote stores data in OneDrive. Your notes are tied to your Microsoft account. If Microsoft changes OneDrive storage limits, pricing, or policies, your notes are affected.

**Privacy.** Notes stored in OneDrive are accessible to Microsoft per their terms of service. For personal journals, business notes, or sensitive information, this is a concern.

**Format lock-in.** OneNote uses a proprietary format that doesn't export cleanly. Converting OneNote sections to standard formats (Markdown, HTML) is painful and lossy. The longer you use it, the harder migration becomes.

**Feature stagnation.** OneNote's development has slowed significantly. Windows users lost the desktop app in favor of the UWP version, then got a "new OneNote" that merged the two. Features have been removed and re-added inconsistently.

**Cost.** OneNote is "free" but requires OneDrive for sync. The free OneDrive tier (5 GB) fills up quickly with embedded images and attachments. Microsoft 365 Personal ($70/year) or Family ($100/year) is needed for meaningful storage.

## Best Alternatives

### Joplin — Best Direct Replacement

Joplin's notebook-and-note structure is the closest match to OneNote's organizational model. Notes support rich formatting, attachments, and to-do lists. Native mobile apps for iOS and Android. End-to-end encryption for private notes. Joplin Server provides self-hosted sync.

**Best for:** OneNote users who want a similar organizational structure with self-hosted sync.

[Read our full guide: [How to Self-Host Joplin Server](/apps/joplin-server)]

### Trilium Notes — Best for Knowledge Bases

Trilium offers deep hierarchical organization that goes beyond OneNote's notebooks and sections. Note cloning, relation maps, and built-in scripting make it a personal knowledge management system. Best for users who want more organizational power than OneNote provides.

**Best for:** Power users building interconnected knowledge bases.

[Read our full guide: [How to Self-Host Trilium Notes](/apps/trilium)]

### BookStack — Best for Shared Notes

If you use OneNote for team notebooks, BookStack's structured hierarchy (Shelves → Books → Chapters → Pages) provides a better-organized alternative with proper access control, built-in authentication, and a clean reading experience.

**Best for:** Teams replacing shared OneNote notebooks.

[Read our full guide: [How to Self-Host BookStack](/apps/bookstack)]

### SiYuan — Best for Visual Organization

SiYuan's block-based editor with bidirectional links and graph view provides a more modern note-taking experience than OneNote. The WYSIWYG editor feels familiar to OneNote users who prefer visual editing over Markdown.

**Best for:** Visual thinkers who want a WYSIWYG editor with modern knowledge management features.

[Read our full guide: [How to Self-Host SiYuan](/apps/siyuan)]

## Migration Guide

### From OneNote to Joplin

1. Export from OneNote: On Windows, use the OneNote desktop app → File → Export → choose sections or notebooks → save as `.onepkg` or print to PDF
2. Alternative: Use Microsoft's OneNote export to `.mht` or copy-paste content section by section
3. In Joplin, create matching notebooks and import or paste content
4. Manually clean up formatting — OneNote's freeform canvas doesn't map perfectly to linear Markdown

**Note:** OneNote migration is inherently messy because its freeform canvas (place text anywhere on the page) doesn't have a direct equivalent in any self-hosted tool. Budget extra time for cleanup.

### From OneNote to BookStack

1. Export OneNote sections as PDF or copy content
2. Create matching Shelves/Books/Chapters in BookStack
3. Paste or recreate content in BookStack's WYSIWYG editor
4. Re-create internal links between pages

### Migration Tips

- **OneNote's freeform canvas doesn't migrate.** If you use OneNote's ability to place text boxes anywhere on a page, this layout is lost in every alternative. Content becomes linear.
- **Embedded files and images may need manual handling.** OneNote's embedded files sometimes don't export cleanly.
- **Handwritten notes don't transfer.** If you use OneNote for handwriting (tablet/stylus), no self-hosted alternative supports this natively.
- **Migrate incrementally.** Don't try to move everything at once. Start with your most-used notebooks and migrate gradually.

## Cost Comparison

| | OneNote (with Microsoft 365) | Self-Hosted (Joplin) |
|---|---------------------------|---------------------|
| Monthly cost | $7-10/month (M365) | $0 |
| Annual cost | $70-100/year | $0 |
| 3-year cost | $210-300 | $0 (or $60-150 for server hardware) |
| Storage | 1 TB (M365) / 5 GB (free) | Unlimited (your hardware) |
| Sync devices | Unlimited | Unlimited |
| Privacy | Microsoft has access | Fully private (E2EE available) |
| Data format | Proprietary | Markdown (open standard) |

## What You Give Up

- **Freeform canvas.** OneNote's ability to place content anywhere on a page is unique. No self-hosted alternative replicates this. Notes become linear documents.
- **Handwriting and ink support.** OneNote's stylus and handwriting recognition is a core feature for tablet users. Self-hosted alternatives don't support handwritten notes.
- **Microsoft ecosystem integration.** OneNote integrates with Outlook, Teams, and other Microsoft 365 apps. Self-hosted tools are standalone.
- **Automatic OCR.** OneNote searches text within images and handwritten notes. Self-hosted alternatives don't offer this.
- **Audio recording.** OneNote can record audio linked to notes. No self-hosted alternative has this built in.
- **Easy sharing.** OneNote's share-via-link is seamless for Microsoft 365 users. Self-hosted alternatives require more setup for sharing.

## Related

- [Best Self-Hosted Note Taking](/best/note-taking)
- [Trilium vs Joplin](/compare/trilium-vs-joplin)
- [How to Self-Host Joplin Server](/apps/joplin-server)
- [How to Self-Host Trilium Notes](/apps/trilium)
- [How to Self-Host BookStack](/apps/bookstack)
- [How to Self-Host SiYuan](/apps/siyuan)
- [Replace Evernote](/replace/evernote)
- [Replace Notion](/replace/notion)
- [Docker Compose Basics](/foundations/docker-compose-basics)
