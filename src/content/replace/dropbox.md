---
title: "How to Replace Dropbox with Self-Hosted Alternatives"
type: "replace"
replaces: "Dropbox"
category: "file-sync"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Replace Dropbox with self-hosted file sync. Migration guide and best alternatives compared."
recommendedApp: "syncthing"
alternatives: ["nextcloud", "seafile", "filebrowser"]
---

## Why Replace Dropbox?

- **Cost:** Dropbox Plus is $12/month ($144/year) for 2TB. Self-hosted: $0/year on hardware you own.
- **Privacy:** Dropbox stores your files on their servers. They can access them, and breaches have happened.
- **Storage:** Dropbox limits you to 2TB on Plus, 3TB on Professional. Self-hosted is limited only by your drives.
- **Features:** Dropbox keeps removing features from lower tiers and pushing you to upgrade.

**Annual savings:** $144/year (Dropbox Plus) → $0/year self-hosted.

## Your Options

| App | Difficulty | Feature Match | Best For |
|-----|-----------|---------------|----------|
| [Syncthing](/apps/syncthing/) | Easy | 70% | Simple device-to-device sync |
| [Nextcloud](/apps/nextcloud/) | Medium | 90% | Full Dropbox replacement with web access |
| [Seafile](/apps/seafile/) | Medium | 85% | Fast sync for large libraries |

## Our Recommendation

**For most people replacing Dropbox: use [Syncthing](/apps/syncthing/).** If what you actually use Dropbox for is syncing files between your computer and phone, Syncthing does it better — faster, more reliably, and without a server.

**If you need web access and sharing links** (Dropbox's share features), use [Nextcloud](/apps/nextcloud/) instead.

## Migration Guide

### Step 1: Export from Dropbox

1. Go to [dropbox.com](https://www.dropbox.com)
2. Select all files → Download
3. Or use the Dropbox desktop app and copy from the Dropbox folder

### Step 2: Set Up Your Self-Hosted App

- [Syncthing setup guide](/apps/syncthing/)
- [Nextcloud setup guide](/apps/nextcloud/)

### Step 3: Move Your Files

**Syncthing:** Point Syncthing at your downloaded Dropbox folder and share it with your other devices.

**Nextcloud:** Upload via the web UI or point the desktop sync client at your Dropbox folder.

### Step 4: Install Sync Clients

Install on all your devices. Let the initial sync complete.

### Step 5: Cancel Dropbox

Once all files are syncing successfully:
1. Verify everything transferred
2. Uninstall the Dropbox client
3. Cancel your Dropbox subscription
4. Optionally delete files from Dropbox (they give you 30 days to recover)

## What You'll Miss

- **Dropbox Paper** — use Nextcloud with Collabora for similar document editing
- **Smart Sync (on-demand files)** — Nextcloud has virtual files; Syncthing downloads everything
- **Easy sharing links** — Nextcloud supports this; Syncthing doesn't
- **Dropbox Backup** — set up your own backup with [Restic](/apps/restic/) or [Duplicati](/apps/duplicati/)

## What You'll Gain

- **No monthly fee** — save $144/year
- **Unlimited storage** — buy more hard drives, not more subscriptions
- **Privacy** — your files never leave your hardware
- **Speed** — Syncthing transfers files directly between devices, no cloud roundtrip

See also: [Nextcloud vs Syncthing](/compare/nextcloud-vs-syncthing/) | [Best Self-Hosted File Sync](/best/file-sync/) | [Replace Google Drive](/replace/google-drive/)
