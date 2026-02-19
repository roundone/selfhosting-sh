---
title: "Self-Hosted Alternatives to Bitwarden Cloud"
description: "Best self-hosted alternatives to Bitwarden's cloud service — Vaultwarden, Passbolt, and more compared with migration guides and cost savings."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "password-management"
apps:
  - vaultwarden
  - passbolt
tags:
  - alternative
  - bitwarden
  - self-hosted
  - replace
  - password-manager
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Replace Bitwarden Cloud?

Bitwarden is already one of the best password managers. So why self-host?

**Cost.** Bitwarden Premium is $10/year (cheap), but Family is $40/year and Teams is $4/user/month. A self-hosted instance covers unlimited users for the cost of electricity.

**Control.** Bitwarden Cloud stores your encrypted vault on their servers. Even though it's end-to-end encrypted, some users and organizations want vault data on their own infrastructure — for compliance, policy, or principle.

**Features without paying.** Bitwarden Premium features like TOTP, emergency access, and vault health reports are free on Vaultwarden. Bitwarden's official self-hosted server requires an enterprise license for some features.

**No dependency on Bitwarden Inc.** Bitwarden changed their license from GPL to a proprietary license (AGPL → BSL for the server) in 2023. Self-hosting an alternative removes dependency on their licensing decisions.

Note: if you're happy with Bitwarden Cloud, it's a great service. Self-hosting only makes sense if you value control, want to avoid recurring costs for teams, or have compliance requirements.

## Best Alternatives

### Vaultwarden — Best Overall Replacement

[Vaultwarden](https://github.com/dani-garcia/vaultwarden) is a Rust reimplementation of the Bitwarden server API. All official Bitwarden clients — browser extensions, desktop apps, mobile apps, CLI — work seamlessly with Vaultwarden. You get every Premium feature for free: TOTP, file attachments, emergency access, Send, passkeys, organizations, and vault health reports.

It uses ~50 MB of RAM, runs as a single container with SQLite, and takes 5 minutes to set up. This is the default answer for "how do I self-host Bitwarden."

[Read our full guide: How to Self-Host Vaultwarden](/apps/vaultwarden)

### Passbolt — Best for Teams

[Passbolt](https://www.passbolt.com/) is purpose-built for team credential management. It uses OpenPGP encryption (not the Bitwarden protocol), has granular sharing permissions, audit logs, and group-based access control. The Community Edition is free. Choose Passbolt over Vaultwarden if you need compliance-grade audit trails or your team already uses OpenPGP workflows.

[Read our full guide: How to Self-Host Passbolt](/apps/passbolt)

### KeeWeb — Lightest Alternative

[KeeWeb](https://keeweb.info/) is a web client for KeePass (.kdbx) files. It's a completely different architecture: a static web app where all encryption happens in your browser. The server stores nothing. Use it if you want to access KeePass vaults from a browser without installing software.

[Read our full guide: How to Self-Host KeeWeb](/apps/keeweb)

## Migration Guide

### From Bitwarden Cloud to Vaultwarden

Migration is straightforward because Vaultwarden uses the same API:

1. **Export from Bitwarden Cloud:** Settings → Export vault → Choose `.json` format (encrypted or unencrypted)
2. **Deploy Vaultwarden** following our [setup guide](/apps/vaultwarden)
3. **Import into Vaultwarden:** Log into your Vaultwarden web vault → Tools → Import Data → Select "Bitwarden (json)" → Upload the export file
4. **Update clients:** In each Bitwarden client, go to Settings → Self-hosted → enter your Vaultwarden URL
5. **Verify:** Log in on all devices, confirm all passwords transferred

Organization vaults migrate separately — export and import each organization individually.

### From Bitwarden Cloud to Passbolt

1. **Export from Bitwarden:** Settings → Export vault → Choose `.csv` format
2. **Deploy Passbolt** following our [setup guide](/apps/passbolt)
3. **Import into Passbolt:** Administration → Import → Select CSV format → Map columns

Note: Passbolt uses different clients (browser extension only, no desktop/mobile apps), so this is a bigger workflow change than switching to Vaultwarden.

## Cost Comparison

| | Bitwarden Cloud (Premium) | Bitwarden Cloud (Family) | Bitwarden Cloud (Teams) | Self-Hosted (Vaultwarden) |
|---|---|---|---|---|
| Monthly cost | $0.83/mo | $3.33/mo | $4/user/mo | ~$2/mo (electricity) |
| Annual cost | $10/year | $40/year | $48/user/year | ~$24/year |
| 5-year cost (5 users) | $250 | $200 | $1,200 | ~$120 |
| Users | 1 | 6 | Unlimited | Unlimited |
| Storage | 1 GB | 1 GB shared | 1 GB/user | Unlimited (your disk) |
| Premium features | Yes | Yes | Yes | Yes (all free) |
| Your infrastructure | No | No | No | Yes (you manage it) |

## What You Give Up

- **Zero-maintenance hosting.** Bitwarden Cloud just works. Self-hosting means you own backups, updates, and uptime.
- **Bitwarden Send for external sharing** works on Vaultwarden but requires your server to be publicly accessible with HTTPS.
- **Emergency access** works on Vaultwarden, but if your server goes down, emergency contacts can't access the vault.
- **Bitwarden's security audits** apply to their codebase. Vaultwarden is a separate codebase that hasn't had formal third-party audits (though the code is open source and widely reviewed).
- **Mobile push notifications** for passwordless login don't work on Vaultwarden.

## FAQ

### Is Vaultwarden as secure as Bitwarden Cloud?

Vaultwarden uses the same encryption scheme (AES-256-CBC with HMAC-SHA256, PBKDF2 or Argon2 key derivation). Your vault is encrypted client-side before it reaches the server. The main difference is operational security: Bitwarden Cloud has a dedicated security team; your self-hosted instance has you.

### Can I use the official Bitwarden apps with Vaultwarden?

Yes. All official Bitwarden clients (browser extensions, desktop, mobile, CLI) work with Vaultwarden. Set the server URL to your Vaultwarden instance in the client settings.

### What about Bitwarden's official self-hosted option?

Bitwarden offers an official self-hosted server, but it requires more resources (multiple containers, MSSQL database), and some features require an enterprise license. Vaultwarden is lighter, simpler, and has all features unlocked.

### Should I expose Vaultwarden to the internet?

For mobile sync and browser extension access outside your home, yes — but only behind HTTPS with a strong master password and 2FA enabled. Alternatively, use [Tailscale](/apps/tailscale) or [WireGuard](/apps/wireguard) to access it without public exposure.

## Related

- [How to Self-Host Vaultwarden](/apps/vaultwarden)
- [How to Self-Host Passbolt](/apps/passbolt)
- [How to Self-Host KeeWeb](/apps/keeweb)
- [Vaultwarden vs Passbolt](/compare/vaultwarden-vs-passbolt)
- [Bitwarden vs Vaultwarden](/compare/bitwarden-vs-vaultwarden)
- [Best Self-Hosted Password Managers](/best/password-management)
- [Self-Hosted Alternatives to LastPass](/replace/lastpass)
- [Self-Hosted Alternatives to 1Password](/replace/1password)
