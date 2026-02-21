---
title: "Bitwarden vs Vaultwarden: Which to Self-Host?"
description: "Bitwarden official server vs Vaultwarden compared — resource usage, features, client support, and which self-hosted password manager to choose."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "password-management"
apps:
  - vaultwarden
tags:
  - comparison
  - bitwarden
  - vaultwarden
  - password-manager
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Vaultwarden is the better choice for self-hosting. It uses 50 MB of RAM vs Bitwarden's 2+ GB, runs on SQLite with a single container, and provides the same client compatibility. The official Bitwarden server is only worth the complexity if you need enterprise features like SCIM provisioning, directory sync, or SSO with your corporate identity provider.

## Overview

**Bitwarden** is the official open-source password manager. The self-hosted server (`bitwarden/server`) runs the full .NET stack with Microsoft SQL Server. It's the same codebase that powers Bitwarden's cloud service — identical features, identical resource requirements.

**Vaultwarden** (formerly bitwarden_rs) is a Rust reimplementation of the Bitwarden server API. It was built specifically for self-hosting — lightweight, efficient, and compatible with all official Bitwarden clients. It implements features that Bitwarden reserves for paid plans (organizations, TOTP, Send, emergency access) at no cost.

## Feature Comparison

| Feature | Bitwarden (Official) | Vaultwarden |
|---------|---------------------|-------------|
| Browser extensions | Yes | Yes (same clients) |
| Desktop apps | Yes | Yes (same clients) |
| Mobile apps (auto-fill) | Yes | Yes (same clients) |
| CLI | Yes | Yes (same clients) |
| Organizations (sharing) | Yes (paid plans) | Yes (free) |
| TOTP 2FA storage | Yes (Premium/$10/yr) | Yes (free) |
| Bitwarden Send | Yes (paid) | Yes (free) |
| Emergency access | Yes (Premium) | Yes (free) |
| Passkeys | Yes | Yes |
| File attachments | Yes | Yes |
| Directory sync (LDAP/AD) | Enterprise only | No |
| SCIM provisioning | Enterprise only | No |
| SSO (SAML/OIDC) | Enterprise only | No |
| Policies & compliance | Enterprise only | No |
| Admin console | Full web UI | Basic admin panel |
| Audit logs | Enterprise | No |
| Event logging | Yes | Limited |
| API | Full | Compatible subset |
| Database | MSSQL (required) | SQLite, MySQL, PostgreSQL |
| License | AGPL-3.0 + proprietary | AGPL-3.0 |

## Installation Complexity

**Bitwarden official** requires multiple containers: the main server, MSSQL database, Nginx proxy, and several microservices. The installation script (`bitwarden.sh`) handles orchestration, but the resulting stack is heavy. You need a dedicated server or VM with at least 4 GB RAM just for the password manager.

**Vaultwarden** is a single container with SQLite — no external database needed. A basic `docker compose up -d` with 5 lines of configuration gets you running. Total setup time: under 5 minutes.

**Winner: Vaultwarden.** Not close. One container vs. a dozen.

## Performance and Resource Usage

| Metric | Bitwarden (Official) | Vaultwarden |
|--------|---------------------|-------------|
| Idle RAM | ~2 GB (with MSSQL) | ~50 MB |
| Containers | 10+ | 1 |
| Docker images total | ~3 GB | ~150 MB |
| CPU at idle | Moderate (.NET + MSSQL) | Negligible (Rust) |
| Startup time | 30-60 seconds | 2-3 seconds |
| Runtime | .NET (C#) | Rust |
| Minimum server RAM | 4 GB | 512 MB |

Vaultwarden is roughly 40x lighter on RAM. On a Raspberry Pi, small VPS, or shared homelab server, this is the deciding factor. The official Bitwarden server essentially needs its own machine.

## Client Compatibility

Both work with the exact same Bitwarden clients — browser extensions, desktop apps, mobile apps, and CLI. Vaultwarden implements the Bitwarden API, so clients can't tell the difference. You point any Bitwarden client at your Vaultwarden server URL and everything works.

The only caveat: when Bitwarden adds a new API feature, Vaultwarden needs time to implement it. In practice, Vaultwarden tracks Bitwarden releases closely and usually catches up within days to weeks.

## Security

Both encrypt your vault client-side with AES-256 before data reaches the server. Your master password never leaves your device. The encryption model is identical because they use the same client software.

The difference is operational:

- **Bitwarden** has a professional security team, regular third-party audits (SOC 2 Type II), and a bug bounty program.
- **Vaultwarden** is a community project. It's been reviewed by many developers but doesn't have formal security audits. The Rust implementation reduces certain classes of bugs (memory safety), but it hasn't undergone the same level of scrutiny.

For most self-hosters, this distinction is academic — the encryption happens client-side regardless, and you're already trusting yourself to run the server securely.

## Community and Support

| Metric | Bitwarden (Official) | Vaultwarden |
|--------|---------------------|-------------|
| GitHub stars | 16K+ (server) | 43K+ |
| Community | Large | Very large |
| Documentation | Comprehensive (official) | Community wiki |
| Commercial support | Yes (paid plans) | No |
| Update frequency | Regular | Very active |

Vaultwarden actually has a larger self-hosting community than the official server. Most self-hosting guides, forum posts, and tutorials reference Vaultwarden, not the official server.

## Use Cases

### Choose Bitwarden Official If...

- You need SCIM provisioning for automated user lifecycle management
- You need SSO integration with your corporate identity provider (SAML/OIDC)
- You need directory sync with Active Directory or LDAP
- You need enterprise compliance features (policies, audit logs, event logging)
- You have 100+ users and need the full admin console
- You require official commercial support with SLAs
- You have dedicated hardware with 4+ GB RAM available

### Choose Vaultwarden If...

- You're self-hosting for personal use or a small team
- You want organizations, TOTP, Send, and emergency access without paying
- You're running on limited hardware (Pi, small VPS, shared server)
- You want the simplest possible setup (one container, SQLite)
- You don't need enterprise features (SCIM, SSO, directory sync)
- You want the largest community of self-hosters for support

## Final Verdict

**Vaultwarden for 99% of self-hosters.** It's lighter by an order of magnitude, simpler to set up, and provides every feature that personal users and small teams need — including features Bitwarden charges for. The official Bitwarden server exists for organizations that need enterprise identity management features. If you're reading a self-hosting guide, you almost certainly want Vaultwarden.

Don't overthink this one. Vaultwarden.

## FAQ

### Is Vaultwarden legal?

Yes. Vaultwarden is a clean-room reimplementation of the Bitwarden API, not a fork of Bitwarden's code. It's licensed under AGPL-3.0. Bitwarden's clients are also open source (GPL-3.0). There are no legal issues with running Vaultwarden.

### Can I migrate from Bitwarden to Vaultwarden (or vice versa)?

Yes. Export your vault from Bitwarden (Settings → Export Vault → JSON format), then import it into Vaultwarden (Tools → Import Data → Bitwarden JSON). All passwords, notes, and cards transfer cleanly. Organizations require re-creating the org structure and re-importing shared items.

### Will Bitwarden clients always work with Vaultwarden?

Vaultwarden has tracked every major Bitwarden API change since 2018. The maintainer (dani-garcia) is responsive and typically implements new API endpoints within days of Bitwarden releases. There's no guarantee of eternal compatibility, but the track record is excellent.

### What about Bitwarden's free cloud plan?

Bitwarden offers a free cloud plan with basic features. If you don't need organizations, TOTP storage, or Send — and you're comfortable storing passwords on Bitwarden's servers — the free cloud plan is easier than self-hosting. Self-hosting makes sense when you want full control, premium features for free, or zero reliance on external services.

## Related

- [How to Self-Host Vaultwarden](/apps/vaultwarden/)
- [Best Self-Hosted Password Managers](/best/password-management/)
- [Vaultwarden vs Passbolt](/compare/vaultwarden-vs-passbolt/)
- [Vaultwarden vs KeeWeb](/compare/vaultwarden-vs-keeweb/)
- [Self-Hosted Alternatives to LastPass](/replace/lastpass/)
- [Self-Hosted Alternatives to 1Password](/replace/1password/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
