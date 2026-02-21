---
title: "KeeWeb vs Padloc: Which Password Manager?"
description: "KeeWeb vs Padloc compared — architecture, encryption, features, and which lightweight self-hosted password manager you should choose."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "password-management"
apps:
  - keeweb
  - padloc
tags:
  - comparison
  - keeweb
  - padloc
  - password-manager
  - self-hosted
  - security
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

KeeWeb is the better choice if you want a file-based password vault with KeePass compatibility and zero server-side processing. Padloc is better if you want a multi-device sync experience with a modern UI. But both projects are dormant — for a maintained password manager, use [Vaultwarden](/apps/vaultwarden/).

## Overview

**KeeWeb** is a web-based client for KeePass database files (.kdbx). The self-hosted version is a static web app served by nginx — all encryption and decryption happens in the browser. The server stores nothing; you bring your own vault file (local, WebDAV, Dropbox, Google Drive, or OneDrive). It's been in maintenance mode since 2022.

**Padloc** is a cross-platform password manager with its own encrypted vault format, server-side sync, and native apps. It runs as two containers (API server + PWA) with SMTP for account verification. Development stalled in 2023.

## Feature Comparison

| Feature | KeeWeb | Padloc |
|---------|--------|--------|
| Vault format | KeePass (.kdbx) | Proprietary (encrypted JSON) |
| Encryption | AES-256 / ChaCha20 (KeePass format) | AES-256 + SRP |
| Architecture | Static web app (client-side only) | Server + PWA (two containers) |
| Browser extension | No | No |
| Mobile apps | No (responsive web app) | iOS, Android |
| Desktop apps | Electron (unmaintained) | Electron |
| Multi-device sync | Via WebDAV/cloud storage | Built-in server sync |
| TOTP support | Yes (KeePass OTP fields) | Yes |
| Tags/groups | Yes (KeePass groups) | Yes (tags) |
| Attachments | Yes | Yes |
| SMTP required | No | Yes |
| Database required | No | No (file-based server storage) |
| Docker RAM | ~30 MB (just nginx) | ~100 MB (server + PWA) |
| License | MIT | AGPL-3.0 |
| Last release | July 2021 | March 2023 |

## Installation Complexity

**KeeWeb** is the simplest self-hosted password manager to deploy. It's a single nginx container serving static files. No database, no SMTP, no configuration. You access it in a browser, open a .kdbx file from any source, and manage passwords. The server never sees your unencrypted data.

**Padloc** requires two containers (API + PWA), each with its own URL, plus SMTP for account creation. More moving parts, but you get built-in sync and user accounts.

## Performance and Resource Usage

| Metric | KeeWeb | Padloc |
|--------|--------|--------|
| RAM (idle) | ~30 MB | ~100 MB |
| CPU | Negligible (static files) | Low |
| Disk | ~50 MB | ~200 MB |
| Containers | 1 | 2 |

KeeWeb is dramatically lighter because it's just a web server. All the cryptographic work happens in the user's browser.

## Community and Support

Both projects are dormant:

**KeeWeb** — Last release v1.18.7 in July 2021. No active development for over 4 years. The KeePass format it reads is a well-established standard, so the tool remains functional. Static web apps don't need frequent updates unless browser APIs change.

**Padloc** — Last release v4.3.0 in March 2023. Docker images last updated December 2023. No indication of resumed development. Using proprietary formats from a dormant project is riskier than using an open standard like KeePass.

## Use Cases

### Choose KeeWeb If...

- You already use KeePass (.kdbx) vaults and want a web interface
- You want zero server-side trust — all crypto happens in the browser
- You sync vaults via WebDAV (Nextcloud), Dropbox, or Google Drive
- You want the absolute lightest deployment (30 MB RAM)
- You're comfortable with file-based vault management

### Choose Padloc If...

- You want built-in multi-device sync without configuring WebDAV
- You prefer native mobile apps over a responsive web UI
- You want user account management (multiple users, each with their own vault)
- You like Padloc's modern, clean UI

### Choose Neither If...

- You need browser auto-fill — neither has extensions. Use [Vaultwarden](/apps/vaultwarden/)
- You need active security maintenance — both are dormant
- You need team password sharing — use [Passbolt](/apps/passbolt/) or [Vaultwarden](/apps/vaultwarden/)

## Final Verdict

KeeWeb is the safer bet despite being older. It uses the well-established KeePass format (your data is never locked into a dead project), requires no server-side infrastructure beyond nginx, and its static nature means fewer security concerns from lack of updates. Padloc has a nicer UX but ties your data to a proprietary format from a dormant project. For serious use, both lose to [Vaultwarden](/apps/vaultwarden/).

## FAQ

### Can I migrate between KeeWeb and Padloc?

Not directly. KeeWeb uses .kdbx files and Padloc uses its own format. You'd need to export from one as CSV and import into the other.

### Which is more secure?

KeeWeb's architecture is inherently more secure for self-hosting because the server never processes unencrypted data — it's just a file server. Padloc's server handles sync and has more attack surface. Both use strong encryption for data at rest.

### Can I use KeeWeb with Nextcloud?

Yes. This is the most common setup: store your .kdbx vault in Nextcloud, open it in KeeWeb via WebDAV. Changes sync back to Nextcloud automatically.

## Related

- [How to Self-Host KeeWeb](/apps/keeweb/)
- [How to Self-Host Padloc](/apps/padloc/)
- [Vaultwarden vs KeeWeb](/compare/vaultwarden-vs-keeweb/)
- [Vaultwarden vs Padloc](/compare/vaultwarden-vs-padloc/)
- [Best Self-Hosted Password Managers](/best/password-management/)
- [How to Self-Host Vaultwarden](/apps/vaultwarden/)
