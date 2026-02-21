---
title: "Passbolt vs Padloc: Which Password Manager?"
description: "Passbolt vs Padloc compared — team features, encryption, Docker setup, and which self-hosted password manager fits your needs best."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "password-management"
apps:
  - passbolt
  - padloc
tags:
  - comparison
  - passbolt
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

Passbolt is the better choice for teams that need auditable, enterprise-grade password sharing with OpenPGP encryption. Padloc is better if you want a clean, modern UI for personal or small-team use and don't need advanced permission controls. For most self-hosters, though, [Vaultwarden](/apps/vaultwarden/) beats both.

## Overview

**Passbolt** is a team-focused password manager built on OpenPGP end-to-end encryption. It emphasizes granular sharing permissions, audit logs, and compliance features. The Community Edition is free and open-source, with Pro and Cloud tiers adding LDAP, MFA policies, and tags. It requires MariaDB and SMTP to function.

**Padloc** is a modern, cross-platform password manager with a clean UI and end-to-end encryption. It runs as two containers (API server + PWA frontend) and stores encrypted vaults on the server. It supports tagging, vault sharing, and multi-device sync. Development has slowed significantly since 2023.

## Feature Comparison

| Feature | Passbolt | Padloc |
|---------|----------|--------|
| Encryption | OpenPGP (asymmetric, per-user keys) | AES-256 + SRP (symmetric) |
| Browser extension | Yes (required for use) | No (web app only) |
| Mobile apps | iOS, Android | iOS, Android, Desktop |
| Team sharing | Granular group/user permissions | Basic vault sharing |
| Audit logs | Yes (CE) | No |
| LDAP/AD integration | Pro only | No |
| TOTP storage | Pro only | Yes |
| Tags/folders | Pro only (tags) | Yes (tags) |
| API | REST API | REST API |
| License | AGPL-3.0 (CE) | AGPL-3.0 |
| Docker setup | 1 container + MariaDB + SMTP | 2 containers (server + PWA) + SMTP |
| GitHub stars | ~4,700 | ~1,300 |
| Last release | Jan 2026 (active) | March 2023 (dormant) |

## Installation Complexity

**Passbolt** is more complex. It requires MariaDB, SMTP (mandatory — users can't register without email), GPG key volumes, and JWT key volumes. First-user creation happens via CLI command. The browser extension is required to use it.

**Padloc** is simpler in concept but requires two containers: an API server and a separate PWA frontend. Each needs its own URL/subdomain. SMTP is also required for account creation. No CLI setup needed — everything happens through the web UI.

Both require SMTP, which adds a dependency most self-hosted password managers avoid. [Vaultwarden](/apps/vaultwarden/) works without SMTP for basic use.

## Performance and Resource Usage

| Metric | Passbolt | Padloc |
|--------|----------|--------|
| RAM (idle) | ~200 MB (app + MariaDB) | ~100 MB (server + PWA) |
| CPU | Low | Low |
| Disk | ~500 MB (app + DB) | ~200 MB |
| Containers | 2 (app + DB) | 2 (server + PWA) |

Both are lightweight. Passbolt uses slightly more memory due to MariaDB.

## Community and Support

**Passbolt** has an active community, regular releases (monthly), professional support options, and detailed documentation. The company behind it (Passbolt SA) is commercially viable with Pro/Cloud tiers funding development.

**Padloc** is effectively dormant. The last release (v4.3.0) was March 2023 — over 3 years ago. The Docker `latest` tag was last updated December 2023. There's no indication of active development. Using Padloc for new deployments is risky.

## Use Cases

### Choose Passbolt If...

- You're managing passwords for a team or organization
- You need audit trails and compliance features
- OpenPGP-based encryption is a requirement
- You want active development and security patches
- You're willing to invest in Pro for LDAP and advanced features

### Choose Padloc If...

- You want the cleanest UI among self-hosted password managers
- Personal or very small team use (2-3 people)
- You already have it running and it works for you
- You don't need browser auto-fill (Padloc has no extension)

### Choose Neither If...

- You want the best overall self-hosted password manager — [Vaultwarden](/apps/vaultwarden/) is the answer
- You need browser auto-fill on every platform
- You want a single-container, no-SMTP-required setup

## Final Verdict

Passbolt wins on features, security model, and active development. Padloc wins on UI design but loses everywhere else — and its dormant development makes it a risky choice for new deployments. For team password management, Passbolt is solid. For personal use, skip both and use [Vaultwarden](/apps/vaultwarden/).

## FAQ

### Can I migrate from Padloc to Passbolt?

There's no direct migration path. You'd need to export passwords from Padloc (CSV export), then import into Passbolt. Passbolt supports CSV and KeePass (kdbx) imports.

### Does either support passkeys?

Neither Passbolt CE nor Padloc support passkey storage. [Vaultwarden](/apps/vaultwarden/) supports passkeys via Bitwarden client compatibility.

### Is Padloc still safe to use?

The encryption is sound, but no security patches have been released since 2023. Any undiscovered vulnerabilities will remain unpatched. For a security-critical tool like a password manager, this is a significant risk.

## Related

- [How to Self-Host Passbolt](/apps/passbolt/)
- [How to Self-Host Padloc](/apps/padloc/)
- [How to Self-Host Vaultwarden](/apps/vaultwarden/)
- [Vaultwarden vs Passbolt](/compare/vaultwarden-vs-passbolt/)
- [Vaultwarden vs Padloc](/compare/vaultwarden-vs-padloc/)
- [Best Self-Hosted Password Managers](/best/password-management/)
