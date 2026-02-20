---
title: "Best Self-Hosted Email Servers in 2026"
description: "The best self-hosted email server solutions compared, including Mailu, Mailcow, Stalwart, and Mail-in-a-Box for replacing Gmail."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "email"
apps:
  - mailu
  - mailcow
tags:
  - best
  - self-hosted
  - email
  - mail-server
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Picks

| Use Case | Best Choice | Why |
|----------|-------------|-----|
| Best overall | [Mailcow](/apps/mailcow) | Most features, best admin UI, SOGo groupware (calendar, contacts), built-in backup scripts |
| Best lightweight | [Mailu](/apps/mailu) | Fewer containers, ARM64 support, simpler configuration, runs on 2 GB RAM |
| Best modern approach | Stalwart | Rust-based all-in-one binary, JMAP support, lowest resource usage, no container sprawl |
| Best for beginners | Mail-in-a-Box | Automated Ubuntu installer, batteries-included DNS management, zero Docker knowledge needed |

## A Warning Before You Start

Self-hosting email is the single hardest thing you can self-host. This is not like spinning up Nextcloud or Jellyfin. Email has unique challenges that no amount of good software can fully solve:

**IP reputation is everything.** Major providers (Gmail, Outlook, Yahoo) maintain blocklists and reputation scores for every sending IP. If your server's IP was previously used for spam -- or even if it's in a netblock associated with spam -- your emails will be silently dropped or sent to spam. You cannot fix this with DNS records alone. Some IP ranges from cloud providers are permanently distrusted by Gmail.

**Port 25 is often blocked.** AWS, GCP, Azure, and Oracle Cloud block outbound port 25 by default. Some providers (Hetzner, OVH, Vultr) allow it but may require a support ticket. Without port 25, you cannot send or receive email directly.

**DNS must be perfect.** You need MX, A/AAAA, SPF, DKIM, DMARC, and PTR records all configured correctly. One mistake and your mail lands in spam -- or never arrives at all. PTR (reverse DNS) records are set at your hosting provider, not your domain registrar, which confuses many people.

**Deliverability is an ongoing battle.** Even with perfect DNS and a clean IP, you need to warm up your server gradually. Sending 500 emails on day one will get you blocklisted. You need to monitor blacklists, respond to bounces, and maintain your sender reputation continuously.

**Downtime means lost email.** Most self-hosted services just show an error page when they're down. A mail server that's offline loses incoming messages (the sending server retries for a while, then gives up). There is no tolerance for extended downtime.

**Our honest recommendation:** For most people, a privacy-focused email provider like Proton Mail ($4/month) or Fastmail ($5/month) is the smarter choice. Self-host email if you have a specific need: full data sovereignty, custom domain with complete control, the educational value of running a mail stack, or organizational requirements. Do not self-host email purely to save money -- the operational overhead is not worth the savings.

If you've read all that and still want to proceed, the tools below will get you there.

## The Full Ranking

### 1. Mailcow -- Best Overall

[Mailcow](/apps/mailcow) is the most feature-complete self-hosted mail server. It bundles Postfix, Dovecot, Rspamd, ClamAV, SOGo groupware, MariaDB, and a polished web admin UI into a single Docker Compose deployment. You manage domains, mailboxes, DKIM signing, spam filtering, quotas, and two-factor authentication entirely through the web interface -- no config file editing after initial setup.

The killer feature is SOGo integration. SOGo provides webmail, calendar (CalDAV), and contacts (CardDAV) in one package. If you need groupware alongside email -- shared calendars, address books, meeting scheduling -- Mailcow is the only option on this list that includes it natively.

Installation uses a git-clone-and-configure approach rather than a hand-written Docker Compose file. You clone the Mailcow repository, run `generate_config.sh`, and `docker compose up -d`. The generated stack includes 15+ containers, a built-in backup/restore script, and a watchdog service that monitors container health.

**Pros:**
- Best admin UI of any self-hosted mail server -- genuinely pleasant to use
- SOGo groupware built in (webmail, calendar, contacts, shared resources)
- Built-in backup and restore scripts (`backup_and_restore.sh`)
- Two-factor authentication for admin and user accounts
- Full REST API for automation
- Rspamd + ClamAV for spam and virus filtering
- Autodiscover/Autoconfig for easy client setup
- Quarantine management with user self-service
- Active development with regular releases
- Extensive documentation

**Cons:**
- Heavy: 4-6 GB RAM minimum, 8 GB recommended for comfortable operation
- x86_64 only -- no ARM64/Raspberry Pi support
- 15+ containers make troubleshooting harder
- ClamAV alone uses ~1 GB RAM (can be disabled)
- Requires exclusive access to ports 25, 80, 443, and all mail ports
- Git-clone installation is non-standard (updates via `git pull`)

**Best for:** Anyone with a dedicated server (8+ GB RAM) who wants the most complete mail server with groupware, a professional admin UI, and built-in management tools.

[Read our full guide: How to Self-Host Mailcow](/apps/mailcow)

### 2. Mailu -- Best Lightweight Option

[Mailu](/apps/mailu) packages the same core components as Mailcow -- Postfix, Dovecot, Rspamd, and a webmail client (SnappyMail or Roundcube) -- but in a leaner stack with 6-8 containers instead of 15+. Configuration is driven by a single environment file (`mailu.env`) rather than a generated config, making it easier to understand and customize.

Mailu runs comfortably on 1.5-2 GB of RAM without ClamAV, making it viable on smaller VPS instances and even ARM64 hardware. The admin interface is functional but not as polished as Mailcow's. It handles domain management, user creation, DKIM key generation, and alias configuration. Mailu also includes a built-in DNS resolver (Unbound) and supports fetchmail for migrating from external accounts.

The trade-off compared to Mailcow is clear: no SOGo groupware (no calendar/contacts sync), a simpler admin UI, and fewer bells and whistles. If you need email and only email, Mailu is the better choice.

**Pros:**
- Lightweight: 1.5-2 GB RAM without ClamAV
- ARM64 support -- runs on Raspberry Pi 4 (4 GB) and ARM VPS instances
- Simpler architecture: 6-8 containers vs Mailcow's 15+
- Clean environment-file-based configuration
- Built-in Unbound DNS resolver
- Fetchmail integration for account migration
- RESTful API for programmatic management
- Let's Encrypt automatic certificate management
- Active development, regular releases

**Cons:**
- No groupware (no calendar, contacts, or shared resources)
- Admin UI is functional but basic compared to Mailcow
- No built-in backup script (manual volume backup required)
- No two-factor authentication for admin UI (users can use app passwords)
- No full-text search built in
- Smaller community than Mailcow

**Best for:** Personal mail servers, small teams, resource-constrained VPS instances, ARM64 deployments, or anyone who wants a straightforward Docker mail stack without the weight of groupware.

[Read our full guide: How to Self-Host Mailu](/apps/mailu)

### 3. Stalwart -- Best Modern Approach

[Stalwart](https://stalw.art/) takes a completely different approach from Mailu and Mailcow. Instead of bundling multiple established tools (Postfix, Dovecot, Rspamd) into containers, Stalwart is a single Rust binary that handles SMTP, IMAP, POP3, JMAP, and ManageSieve in one process. No container orchestration, no inter-service networking, no Postfix config files.

The standout feature is JMAP (JSON Meta Application Protocol) support. JMAP is the modern replacement for IMAP, designed for mobile-first and web-first email clients. It's more efficient than IMAP for sync operations and supports push notifications natively. While JMAP client support is still limited (Fastmail's web client, some mobile apps), it's the future of email protocols.

Stalwart is extremely resource-efficient. A single binary handling all protocols means no duplicate processes, no inter-process communication overhead, and no container networking. It can run on 256 MB of RAM for a personal server.

**Pros:**
- Single binary -- no container sprawl, no inter-service complexity
- JMAP support alongside IMAP, POP3, SMTP, and ManageSieve
- Extremely low resource usage (~256 MB RAM for personal use)
- Written in Rust -- memory-safe, fast, no garbage collection pauses
- Built-in spam filter (no separate Rspamd needed)
- Built-in DKIM signing, ARC, SPF, and DMARC verification
- Web-based admin console
- Supports multiple storage backends (SQLite, PostgreSQL, MySQL, S3)
- OAuth 2.0 and OpenID Connect support
- Runs on Linux, macOS, and FreeBSD

**Cons:**
- Newer project -- smaller community and less battle-tested than Postfix/Dovecot
- No bundled webmail client (use Roundcube, SnappyMail, or a JMAP client separately)
- Fewer tutorials and guides online compared to Mailcow/Mailu
- Spam filtering less mature than Rspamd
- No built-in antivirus scanning
- Configuration is powerful but has a learning curve (TOML-based)

**Best for:** Technically-minded users who value simplicity, efficiency, and modern protocols. Excellent for personal mail servers where resource efficiency matters more than a polished web UI.

### 4. Mail-in-a-Box -- Best for Beginners

[Mail-in-a-Box](https://mailinabox.email/) (MIAB) is the most opinionated option on this list. It's not a Docker stack -- it's a bash script that configures a fresh Ubuntu 22.04 server into a complete mail server with Postfix, Dovecot, Roundcube, Nextcloud (for contacts/calendar), and a DNS server. One command, 15 minutes, done.

MIAB manages your entire DNS automatically, including MX, SPF, DKIM, DMARC, and autodiscover records. It provides a status page that checks all DNS configuration and SSL certificates, telling you exactly what's wrong and how to fix it. For beginners, this guided experience is invaluable.

The trade-off is rigidity. MIAB expects to be the only thing running on the server. You cannot customize the mail stack components, run other web services alongside it, or use a different webmail client. It's batteries-included and opinionated to the point of inflexibility.

**Pros:**
- One-command installation on a fresh Ubuntu 22.04 server
- Manages DNS automatically (including DNSSEC)
- Built-in status page that diagnoses configuration problems
- Nextcloud for calendar and contacts (CalDAV/CardDAV)
- Roundcube webmail included
- Automatic SSL via Let's Encrypt
- Automatic daily backups (encrypted, configurable remote destination)
- User-friendly web admin panel
- Well-documented -- the guide walks through everything

**Cons:**
- Requires a dedicated server (cannot coexist with other services)
- Not Docker-based -- harder to migrate, harder to isolate
- Ubuntu 22.04 only (no Debian, no other distros)
- No ARM64 support
- Updates can break things (full-system reconfiguration on update)
- Cannot customize individual components (Postfix, Dovecot configs are managed)
- Nextcloud integration is minimal (contacts/calendar only, not full Nextcloud)
- Smaller scale -- designed for personal/small business, not hundreds of users

**Best for:** Beginners who want a working mail server with minimal configuration. People who value guided setup over flexibility. Anyone who has a spare VPS and wants to learn how email works without manually configuring every component.

## Full Comparison Table

| Feature | Mailcow | Mailu | Stalwart | Mail-in-a-Box |
|---------|---------|-------|----------|---------------|
| SMTP (Postfix) | Yes | Yes | Built-in | Yes |
| IMAP (Dovecot) | Yes | Yes | Built-in | Yes |
| POP3 | Yes | Yes | Yes | Yes |
| JMAP | No | No | **Yes** | No |
| ManageSieve | Yes | Yes | Yes | Yes |
| Webmail | SOGo | SnappyMail/Roundcube | None (external) | Roundcube |
| Groupware (calendar/contacts) | **SOGo (CalDAV/CardDAV)** | No | No | Nextcloud (basic) |
| Admin web UI | **Excellent** | Good | Good | Good |
| Spam filtering | Rspamd | Rspamd | Built-in | Spamassassin |
| Antivirus | ClamAV (optional) | ClamAV (optional) | No | Spamassassin rules |
| Two-factor authentication | **Yes (admin + users)** | No | OAuth/OIDC | No |
| ARM64 support | No | **Yes** | **Yes** | No |
| Minimum RAM | 4-6 GB | 1.5-2 GB | **256 MB** | 1 GB |
| Typical RAM usage | 4-5 GB | 1.5-2 GB | **300-500 MB** | 1-2 GB |
| Container/process count | 15+ containers | 6-8 containers | **1 binary** | N/A (system services) |
| Installation method | Git clone + script | Docker Compose | Binary/Docker | Bash script on Ubuntu |
| Auto-updates | Manual (git pull) | Manual (image pull) | Manual | Built-in updater |
| Built-in backup | **Yes (script included)** | No | No | **Yes (encrypted, remote)** |
| DNS management | No | No | No | **Yes (auto-manages DNS)** |
| REST API | **Yes** | **Yes** | **Yes** | **Yes** |
| Full-text search | Solr (optional, +1 GB RAM) | No | Built-in | No |
| Relay support | Yes | Yes | Yes | Limited |
| License | GPL-3.0 | MIT | AGPL-3.0 | CC0 (public domain) |
| Deployment flexibility | Docker only, x86_64 | Docker, x86_64 + ARM64 | Binary or Docker, multi-arch | Dedicated Ubuntu server only |

## When Self-Hosted Email Makes Sense

### Self-host email if:

- **Data sovereignty is non-negotiable.** You work in a regulated industry, handle sensitive communications, or live in a jurisdiction where you need full control over where your data is stored and who can access it.
- **You want to learn.** Running a mail server teaches you more about DNS, SMTP, TLS, authentication, and internet infrastructure than almost any other project. The educational value is enormous.
- **You need full custom domain control.** You want catch-all addresses, unlimited aliases, custom routing rules, or integration with your own applications -- and you don't want to depend on a third party's feature roadmap.
- **You already run infrastructure.** If you have a dedicated server with a clean IP, experience with DNS, and an understanding of deliverability -- the marginal effort of adding email is lower.
- **You're building a homelab.** Having your own mail server is a rewarding addition to a broader self-hosting setup, especially when paired with services like [Nextcloud](/apps/nextcloud) for a complete productivity stack.

### Do NOT self-host email if:

- **You just want to save money.** Proton Mail is $4/month. Fastmail is $5/month. The VPS, DNS management time, and ongoing maintenance cost more than that in effort alone.
- **You need reliable deliverability for business email.** Transactional email (invoices, receipts, notifications) from a self-hosted server will occasionally land in spam. Use a service like Mailgun or Amazon SES for transactional mail.
- **Your provider blocks port 25.** Without port 25 for both inbound and outbound, a mail server is crippled. Relaying outbound through a third party defeats much of the purpose.
- **You can't get a clean IP.** Check your server's IP at [multirbl.valli.org](https://multirbl.valli.org/) before committing. If it's on multiple blacklists, switch providers or get a different IP first.
- **You're not prepared for ongoing maintenance.** A mail server is not set-and-forget. Blacklist monitoring, DNS record updates, software updates, and certificate renewals are all your responsibility.

## How We Evaluated

We evaluated each solution on six criteria:

1. **Ease of setup** -- How long from zero to a working mail server with correct DNS, DKIM, and verified deliverability?
2. **Resource efficiency** -- RAM, CPU, and disk requirements for a personal mail server (1-5 users).
3. **Feature completeness** -- Webmail, spam filtering, admin UI, groupware, API, 2FA.
4. **Deployment flexibility** -- Docker support, ARM64 support, ability to coexist with other services.
5. **Community and documentation** -- Size of community, quality of docs, availability of troubleshooting resources.
6. **Ongoing maintenance burden** -- How much effort to keep the server running, updated, and delivering mail reliably.

Mailcow ranks #1 overall because it offers the most complete feature set with the best admin experience. If you're going to take on the challenge of self-hosted email, Mailcow gives you the most tools to manage it. Mailu earns #2 for providing 80% of the functionality at half the resource cost. Stalwart is the most technically interesting option and the future direction of self-hosted email, but its smaller ecosystem keeps it at #3 for now. Mail-in-a-Box is the gentlest on-ramp but sacrifices too much flexibility.

## Related

- [How to Self-Host Mailu](/apps/mailu)
- [How to Self-Host Mailcow](/apps/mailcow)
- [Mailu vs Mailcow](/compare/mailu-vs-mailcow)
- [Replace Gmail with Self-Hosted Email](/replace/gmail)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [SMTP and Email Basics](/foundations/smtp-email-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [DNS Explained](/foundations/dns-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [Security Basics for Self-Hosting](/foundations/security-hardening)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting)
- [Getting Started with Self-Hosting](/foundations/getting-started)
