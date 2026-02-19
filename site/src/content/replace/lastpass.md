---
title: "Self-Hosted Alternatives to LastPass"
description: "The best self-hosted password managers to replace LastPass. Compare Vaultwarden, Passbolt, and more with migration steps."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "password-management"
apps:
  - vaultwarden
  - passbolt
  - keeweb
tags:
  - alternative
  - lastpass
  - password-manager
  - self-hosted
  - replace
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Replace LastPass?

LastPass has given users plenty of reasons to leave. The 2022 breach exposed encrypted password vaults and unencrypted metadata (URLs, email addresses) for every user. In 2023, attackers used stolen data to drain cryptocurrency wallets. The free tier now limits you to a single device type — desktop or mobile, not both.

The paid plan costs $36/year ($48/year for Families). Over five years, that's $180–$240 for a service that has already proven it cannot protect your data.

Self-hosting your password manager means:

- **Your vault never touches someone else's server.** No centralized breach target.
- **Zero recurring cost.** Run it on hardware you already own.
- **Full control over encryption, backups, and access.** You decide the security policy.
- **No artificial device limits.** Use it on every device you own.

## Best Alternatives

### Vaultwarden — Best Overall Replacement

[Vaultwarden](https://github.com/dani-garcia/vaultwarden) is the clear winner for replacing LastPass. It's a lightweight Rust reimplementation of the Bitwarden server API, meaning it works with all official Bitwarden clients — browser extensions, desktop apps, mobile apps, and CLI. If you've used Bitwarden or LastPass, the experience is nearly identical.

Vaultwarden runs on SQLite and idles at ~50 MB of RAM. It supports organizations, password sharing, TOTP 2FA, emergency access, file attachments, and Send — features that Bitwarden's official server locks behind paid tiers.

**Why it's the best LastPass replacement:**
- Bitwarden clients are polished and available on every platform
- Auto-fill works in browsers, Android, and iOS
- Supports importing directly from LastPass (CSV export)
- Organizations and sharing work out of the box
- Active development, large community

[Read our full guide: How to Self-Host Vaultwarden](/apps/vaultwarden)

### Passbolt — Best for Teams

[Passbolt](https://www.passbolt.com/) is designed for team credential sharing. If your main use of LastPass was sharing passwords across a team or organization, Passbolt's granular permission model and audit logs make it the better choice. The Community Edition is free and self-hostable.

Passbolt uses OpenPGP for end-to-end encryption and requires a browser extension for access. There's no desktop app or mobile auto-fill in the free tier — the Pro and Cloud editions add mobile apps.

**Best for:** Teams that need shared credential management with audit trails.

[Read our full guide: How to Self-Host Passbolt](/apps/passbolt)

### KeeWeb — Best Lightweight Option

[KeeWeb](https://keeweb.info/) is a web-based KeePass-compatible password manager. It reads and writes `.kdbx` files, so you can use it alongside KeePass, KeePassXC, or any other KeePass client. Self-host the web app and store your vault file on your server or sync it via Nextcloud/Syncthing.

**Best for:** Users already in the KeePass ecosystem who want a web UI, or anyone who wants a simple file-based vault with no server-side database.

[Read our full guide: How to Self-Host KeeWeb](/apps/keeweb)

### Padloc — Best UI/UX

[Padloc](https://padloc.app/) offers the most modern, polished interface of any self-hosted password manager. It supports multi-device sync, organizations, and has native apps for all platforms. The self-hosted Community Edition covers personal and small team use.

**Best for:** Users who prioritize a clean interface and are willing to trade community size for design quality.

[Read our full guide: How to Self-Host Padloc](/apps/padloc)

## Migration Guide

### Exporting from LastPass

1. Log in to LastPass at `vault.lastpass.com`
2. Go to **Advanced Options** → **Export** in the left sidebar
3. Enter your master password when prompted
4. LastPass exports a CSV file — save it securely

### Importing into Vaultwarden

1. Log in to your Vaultwarden web vault
2. Go to **Tools** → **Import Data**
3. Select **LastPass (csv)** as the format
4. Upload the CSV file
5. Review the import — Vaultwarden maps folders, usernames, passwords, URIs, and notes

### Importing into Passbolt

Passbolt supports CSV import through the browser extension:
1. Click the Passbolt browser extension icon
2. Go to import and select CSV format
3. Map the LastPass CSV columns to Passbolt fields
4. Passwords are re-encrypted with your OpenPGP key on import

### After Migration

- **Delete the CSV export** — it contains all your passwords in plain text
- **Verify critical entries** — spot-check your most important logins
- **Update your browser extension** — remove the LastPass extension, install Bitwarden (for Vaultwarden) or Passbolt's extension
- **Set up 2FA** on your new vault — TOTP, WebAuthn, or both

## Cost Comparison

| | LastPass Premium | LastPass Families | Vaultwarden (Self-Hosted) |
|---|---|---|---|
| Monthly cost | $3/month | $4/month | $0 (runs on existing hardware) |
| Annual cost | $36/year | $48/year | $0 |
| 3-year cost | $108 | $144 | $0 |
| 5-year cost | $180 | $240 | $0 |
| Device limit | Unlimited (paid) | Unlimited | Unlimited |
| Users | 1 | 6 | Unlimited |
| Storage | 1 GB | 1 GB each | Your disk (unlimited) |
| Password sharing | Limited | Family sharing | Full organizations |
| Data location | LastPass servers (US) | LastPass servers (US) | Your server |
| Breach risk | Centralized target | Centralized target | Only your server |

If you're running Vaultwarden on a server you already have (a Raspberry Pi, NAS, or VPS you use for other things), the marginal cost is zero.

## What You Give Up

Be honest about the trade-offs:

- **Zero-effort availability.** LastPass is always up because they manage the infrastructure. Your self-hosted server is your responsibility. If your server goes down, you can't access passwords remotely until it's back.
- **Emergency access complexity.** LastPass has a built-in emergency access flow. Vaultwarden supports this too, but you need to keep your server running for it to work.
- **Dark web monitoring.** LastPass Premium includes breach monitoring. Self-hosted alternatives don't. Use [Have I Been Pwned](https://haveibeenpwned.com/) separately.
- **Official support.** When something breaks, you're your own support team. Community forums and GitHub issues are your resources.

**Mitigation:** Export your vault to an encrypted `.kdbx` backup stored locally. If your server dies, you can open it with KeePassXC offline while you rebuild. Set up automated backups with a [3-2-1 backup strategy](/foundations/backup-3-2-1-rule).

## FAQ

### Can I use Bitwarden clients with Vaultwarden?

Yes. Vaultwarden implements the full Bitwarden API. All official Bitwarden browser extensions, desktop apps, mobile apps, and CLI tools work. You just point them to your self-hosted URL instead of `vault.bitwarden.com`.

### Is Vaultwarden as secure as LastPass?

Vaultwarden uses the same AES-256 encryption and PBKDF2/Argon2 key derivation as the official Bitwarden server. Your vault is encrypted client-side before it reaches the server. Unlike LastPass, your encrypted vault isn't stored alongside millions of other users — you're the only target, and you control the security posture.

### What if my server goes down?

Bitwarden clients cache your vault locally. You can still access passwords offline. For disaster recovery, keep an encrypted `.kdbx` export on a USB drive or in cloud storage.

### Can I share passwords with family members?

Yes. Vaultwarden supports organizations with collections, which work like shared folders. Create an organization, invite family members, and share credentials through collections with granular permissions.

### Do I need HTTPS?

Yes. Bitwarden clients refuse to connect over plain HTTP. You need a domain name and a reverse proxy with SSL. See our [reverse proxy setup guide](/foundations/reverse-proxy-explained) and [SSL certificate guide](/foundations/ssl-certificates).

## Related

- [How to Self-Host Vaultwarden](/apps/vaultwarden)
- [How to Self-Host Passbolt](/apps/passbolt)
- [How to Self-Host KeeWeb](/apps/keeweb)
- [How to Self-Host Padloc](/apps/padloc)
- [Vaultwarden vs Passbolt](/compare/vaultwarden-vs-passbolt)
- [Best Self-Hosted Password Managers](/best/password-management)
- [Self-Hosted Alternatives to 1Password](/replace/1password)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
