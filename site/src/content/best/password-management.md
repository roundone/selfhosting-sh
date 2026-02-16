---
title: "Best Self-Hosted Password Managers in 2026"
description: "The best self-hosted password managers compared — Vaultwarden, Passbolt, KeeWeb, Padloc, and Authelia ranked with pros, cons, and setup links."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "password-management"
apps:
  - vaultwarden
  - passbolt
  - keeweb
  - padloc
  - authelia
tags:
  - best
  - self-hosted
  - password-manager
  - security
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Picks

| Use Case | Best Choice | Why |
|----------|-------------|-----|
| Best overall | Vaultwarden | Full Bitwarden client support, auto-fill everywhere, 50 MB RAM |
| Best for teams | Passbolt | OpenPGP E2E encryption, granular permissions, audit logs |
| Best lightweight | KeeWeb | File-based vault, 30 MB RAM, no database |
| Best UI design | Padloc | Modern interface, native apps, clean UX |
| Best for app protection | Authelia | SSO + 2FA for all your self-hosted services |

## The Full Ranking

### 1. Vaultwarden — Best Overall

[Vaultwarden](https://github.com/dani-garcia/vaultwarden) is the clear winner for most self-hosters. It's a Rust reimplementation of the Bitwarden server API, meaning all official Bitwarden clients work — browser extensions, desktop apps, mobile apps with auto-fill, and the CLI. It idles at ~50 MB of RAM on SQLite, supports organizations for password sharing, TOTP 2FA storage, file attachments, passkeys, emergency access, and Bitwarden Send.

**Pros:**
- All Bitwarden clients work (browser, desktop, mobile, CLI)
- Excellent auto-fill on every platform
- Organizations for family/team sharing
- TOTP, passkeys, emergency access, Send
- Tiny footprint (~50 MB RAM)
- Single container, no external database needed
- 43,000+ GitHub stars, massive community

**Cons:**
- Requires HTTPS (Bitwarden clients refuse HTTP)
- No built-in audit logs for team use
- No LDAP integration in free tier

**Best for:** Everyone. Personal use, family sharing, small teams.

[Read our full guide: How to Self-Host Vaultwarden](/apps/vaultwarden)

### 2. Passbolt — Best for Teams

[Passbolt](https://www.passbolt.com/) is purpose-built for team credential sharing. It uses OpenPGP for end-to-end encryption, provides granular group-based permissions, and includes audit logs showing who accessed which credentials. The Community Edition covers core password management; Pro adds mobile apps, LDAP, tags, and folders.

**Pros:**
- OpenPGP end-to-end encryption
- Granular permission model (per-user, per-group)
- Audit logs
- CSV import from other managers
- REST API for automation

**Cons:**
- No desktop app (browser extension only in CE)
- No mobile apps in free CE edition
- Requires MariaDB and SMTP (more dependencies)
- Smaller community than Vaultwarden
- Higher resource usage (~400 MB with MariaDB)

**Best for:** Teams and organizations that need shared credential management with audit trails.

[Read our full guide: How to Self-Host Passbolt](/apps/passbolt)

### 3. KeeWeb — Best Lightweight Option

[KeeWeb](https://keeweb.info/) is a web UI for KeePass databases (`.kdbx` files). Your vault is a single encrypted file — no database, no server-side state. All encryption happens client-side. Works alongside KeePassXC (desktop) and KeePassDX/Strongbox (mobile).

**Pros:**
- Extremely lightweight (~30 MB RAM)
- File-based — just one encrypted `.kdbx` file
- KeePass ecosystem compatibility
- All encryption client-side
- Simple backup (copy one file)
- Works offline

**Cons:**
- No browser auto-fill from web UI
- Multi-device sync is manual (Nextcloud/Syncthing)
- Development has slowed (maintenance mode)
- No built-in sharing

**Best for:** KeePass users who want web access, minimalists who prefer file-based vaults.

[Read our full guide: How to Self-Host KeeWeb](/apps/keeweb)

### 4. Padloc — Best UI Design

[Padloc](https://padloc.app/) has the most polished interface in the self-hosted password manager space. Clean, modern design across web, desktop, and mobile apps. Supports organizations and shared vaults with end-to-end encryption.

**Pros:**
- Beautiful, modern UI
- Cross-platform native apps
- Organizations for team sharing
- End-to-end encryption

**Cons:**
- Smaller community (3,000 GitHub stars)
- Browser auto-fill is less mature than Bitwarden's
- Requires two containers (API + PWA)
- Requires SMTP for account creation
- Fewer import/export formats than Vaultwarden

**Best for:** Users who prioritize design quality and don't rely heavily on browser auto-fill.

[Read our full guide: How to Self-Host Padloc](/apps/padloc)

### 5. Authelia — Best for App Protection

[Authelia](https://www.authelia.com/) isn't a password manager — it's an authentication server. But it belongs in this roundup because it's the best way to add SSO and 2FA to your self-hosted apps. It sits behind your reverse proxy and protects any web application with a login portal, even apps without built-in authentication.

**Pros:**
- Protects any web application
- TOTP and WebAuthn 2FA
- OpenID Connect provider
- Lightweight (Go-based)
- Works with Traefik, Nginx, Caddy

**Cons:**
- Not a password manager (doesn't store passwords)
- Requires a reverse proxy
- Configuration via YAML (no web UI for management)
- Needs Redis + PostgreSQL for production

**Best for:** Adding authentication to unprotected self-hosted apps. Pair with Vaultwarden for complete password + auth coverage.

[Read our full guide: How to Self-Host Authelia](/apps/authelia)

## Full Comparison Table

| Feature | Vaultwarden | Passbolt CE | KeeWeb | Padloc | Authelia |
|---------|-------------|-------------|--------|--------|---------|
| Primary purpose | Password manager | Team password manager | KeePass web UI | Password manager | Authentication server |
| Browser auto-fill | Excellent | Good | None (web UI) | Basic | N/A |
| Mobile app | Yes (Bitwarden) | No (CE) | Via KeePassDX | Yes | N/A |
| Desktop app | Yes (Bitwarden) | No | Yes | Yes (Electron) | N/A |
| Password sharing | Organizations | Groups + permissions | Share file | Organizations | N/A |
| Audit logs | No | Yes | No | No | Yes (access logs) |
| 2FA storage | TOTP, passkeys | No | TOTP (KeePass) | No | N/A |
| Database | SQLite | MariaDB | File (`.kdbx`) | File-based | PostgreSQL |
| RAM (idle) | ~50 MB | ~400 MB | ~30 MB | ~150 MB | ~300 MB |
| Containers | 1 | 2 | 1 | 2 | 3 |
| GitHub stars | 43K+ | 4.5K+ | 12K+ | 3K+ | 23K+ |
| Active development | Very active | Active | Maintenance | Active | Very active |

## How We Evaluated

We assessed each password manager on:

1. **Daily usability** — How seamless is the experience across browser, desktop, and mobile?
2. **Security model** — Encryption approach, client-side vs server-side processing, audit capabilities.
3. **Setup complexity** — How many containers, dependencies, and configuration steps?
4. **Resource usage** — RAM, CPU, and disk requirements for resource-constrained servers.
5. **Community and longevity** — GitHub activity, community size, documentation quality.
6. **Feature completeness** — Auto-fill, sharing, 2FA, import/export, emergency access.

## FAQ

### Which self-hosted password manager is most secure?

All options listed use strong encryption (AES-256 or equivalent) with client-side encryption. Passbolt's OpenPGP model provides per-user key isolation, which is arguably strongest for team sharing. For personal use, Vaultwarden's Bitwarden encryption is battle-tested by millions of users. KeeWeb's `.kdbx` format has been audited extensively. Security differences between these options are minimal compared to the security gain of self-hosting vs. cloud services.

### Can I self-host AND keep a cloud backup?

Yes. Most password managers support export to standard formats. Keep an encrypted `.kdbx` backup (via KeePassXC export) on an encrypted USB drive or in cloud storage. This gives you offline access if your server goes down.

### Do I need HTTPS for all of these?

Vaultwarden requires HTTPS (Bitwarden clients enforce it). Passbolt requires HTTPS (browser extension needs it). KeeWeb works over HTTP but HTTPS is strongly recommended. Padloc requires HTTPS. Authelia requires HTTPS for the reverse proxy.

### What about Bitwarden's official server?

The official Bitwarden server (bitwarden/server) requires MSSQL and significantly more RAM (~2 GB). Vaultwarden provides the same client compatibility with 50 MB of RAM on SQLite. For self-hosting, Vaultwarden is the better choice unless you need Bitwarden's enterprise features (SSO, directory sync, policies).

## Related

- [How to Self-Host Vaultwarden](/apps/vaultwarden)
- [How to Self-Host Passbolt](/apps/passbolt)
- [How to Self-Host KeeWeb](/apps/keeweb)
- [How to Self-Host Padloc](/apps/padloc)
- [How to Self-Host Authelia](/apps/authelia)
- [Vaultwarden vs Passbolt](/compare/vaultwarden-vs-passbolt)
- [Vaultwarden vs KeeWeb](/compare/vaultwarden-vs-keeweb)
- [Vaultwarden vs Padloc](/compare/vaultwarden-vs-padloc)
- [Authelia vs Authentik](/compare/authelia-vs-authentik)
- [Self-Hosted Alternatives to LastPass](/replace/lastpass)
- [Self-Hosted Alternatives to 1Password](/replace/1password)
- [Self-Hosted Alternatives to Dashlane](/replace/dashlane)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
