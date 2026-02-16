---
title: "Mailu vs Mailcow: Which Mail Server?"
description: "Mailu vs Mailcow compared for self-hosted email — setup complexity, resource usage, features, and which mail server to choose."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "email"
apps:
  - mailu
  - mailcow
tags:
  - comparison
  - mailu
  - mailcow
  - email
  - mail-server
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Mailu is the better choice if you want a lightweight, easy-to-deploy mail server that runs on minimal hardware, including ARM. Mailcow is the better choice if you need groupware features (shared calendars, contacts, ActiveSync) and have at least 6 GB of RAM to spare. Both use Postfix + Dovecot under the hood and produce identical email delivery results — the difference is in the management layer on top.

## Overview

**Mailu** (2016) is a Python-based, Docker-native mail server suite. It uses a setup wizard at setup.mailu.io to generate your `docker-compose.yml` and `.env` files, making initial deployment straightforward. The admin UI is clean but minimal. Mailu bundles SnappyMail as its webmail client and ships multi-architecture images (amd64 and ARM64), making it a solid choice for Raspberry Pi or ARM-based VPS deployments.

**Mailcow** (2017) is a PHP-based mail server suite that installs via `git clone` and a setup script. It offers a richer admin UI, SOGo groupware (calendar, contacts, webmail with ActiveSync), and more granular controls for domain management, rate limiting, and quota enforcement. Mailcow requires x86_64 hardware and significantly more RAM, but delivers a more feature-complete package out of the box.

Both are built on the same proven stack: Postfix for SMTP, Dovecot for IMAP, rspamd or equivalent for antispam, and automatic Let's Encrypt certificate management. Both require a dedicated IP address, properly configured DNS records (MX, SPF, DKIM, DMARC), and port 25 open from your hosting provider.

## Feature Comparison

| Feature | Mailu | Mailcow |
|---------|-------|---------|
| Core stack | Postfix + Dovecot | Postfix + Dovecot |
| Admin UI | Python (Flask), functional but minimal | PHP, feature-rich with granular controls |
| Webmail | SnappyMail | SOGo (webmail + groupware) |
| Groupware (calendar/contacts) | No | Yes (SOGo — CalDAV, CardDAV, ActiveSync) |
| Antispam | rspamd (or built-in filter) | rspamd |
| Antivirus | ClamAV (optional, adds ~1 GB RAM) | ClamAV (optional, adds ~1.5 GB RAM) |
| Auto TLS (Let's Encrypt) | Yes | Yes |
| Two-factor authentication | No native support | Yes (TOTP, U2F/WebAuthn) |
| API | RESTful API | JSON API |
| Architecture support | amd64, ARM64 | x86_64 only |
| Installation method | Setup wizard generates Compose + env | `git clone` + `generate_config.sh` |
| Container registry | `ghcr.io/mailu/*` | `docker.io/mailcow/*` |

## Installation Complexity

### Mailu

Mailu's setup wizard at [setup.mailu.io](https://setup.mailu.io) asks you a series of questions — domain, hostname, features to enable, TLS mode — and generates a complete `docker-compose.yml` and `mailu.env` file. Download both, place them on your server, and run `docker compose up -d`.

```bash
# After downloading generated files from setup.mailu.io
mkdir -p /opt/mailu && cd /opt/mailu
# Place docker-compose.yml and mailu.env here
docker compose up -d
```

The wizard handles the complexity of wiring together 6-8 containers with correct environment variables. You still need to configure DNS records manually (MX, SPF, DKIM, DMARC), but Mailu's admin UI shows you exactly what records to create once the stack is running.

**Time to first email sent:** 15-30 minutes if DNS is already configured.

### Mailcow

Mailcow installs via git clone and an interactive config generator:

```bash
cd /opt
git clone https://github.com/mailcow/mailcow-dockerized.git
cd mailcow-dockerized
./generate_config.sh
docker compose pull
docker compose up -d
```

The `generate_config.sh` script asks for your hostname and timezone, then generates `mailcow.conf`. The stack is larger — 15+ containers including SOGo, memcached, the PHP admin UI, and supporting services. First startup takes longer as it initializes databases and generates keys.

**Time to first email sent:** 20-45 minutes. The initial container pull is larger (~4 GB vs ~1.5 GB for Mailu), and SOGo initialization adds time.

### Verdict on Setup

Mailu is simpler. The web wizard eliminates manual Compose file editing. Mailcow's `generate_config.sh` is also straightforward, but the larger stack means more things to troubleshoot if something goes wrong. Both are dramatically easier than building a mail stack from scratch.

## Performance and Resource Usage

This is where the two diverge significantly.

### Mailu

| Resource | Usage |
|----------|-------|
| RAM (idle, no ClamAV) | ~1.5-2 GB |
| RAM (idle, with ClamAV) | ~2.5-3 GB |
| RAM (recommended) | 2 GB minimum, 4 GB comfortable |
| Disk (application) | ~2 GB |
| CPU | Low — 1-2 vCPU is sufficient for small deployments |
| Containers | 6-8 depending on options |

### Mailcow

| Resource | Usage |
|----------|-------|
| RAM (idle, no ClamAV) | ~4-5 GB |
| RAM (idle, with ClamAV) | ~5.5-6.5 GB |
| RAM (recommended) | 6 GB minimum, 8 GB comfortable |
| Disk (application) | ~5 GB |
| CPU | Medium — 2+ vCPU recommended due to SOGo and rspamd |
| Containers | 15+ including SOGo, memcached, PHP-FPM, watchdog |

### Verdict on Resources

Mailu uses roughly one-third the RAM of Mailcow. On a 4 GB VPS, Mailu runs comfortably alongside other services. Mailcow needs the machine mostly to itself unless you have 8+ GB. If you're running a Raspberry Pi 4 with 4 GB RAM, Mailu is your only realistic option — Mailcow won't even start on ARM.

## DNS and Deliverability

Both produce identical deliverability results because they use the same underlying mail transport (Postfix + Dovecot). Deliverability depends on your DNS setup, IP reputation, and volume — not on which admin UI sits on top.

Both require:
- **MX record** pointing to your mail server hostname
- **SPF record** (`v=spf1 mx ~all` or similar)
- **DKIM** — both generate DKIM keys automatically and show you the DNS record to create
- **DMARC** — you configure this yourself (`v=DMARC1; p=quarantine; ...`)
- **rDNS (PTR record)** — set through your hosting provider, must match your mail hostname
- **Port 25 open** — some cloud providers (AWS, Azure, GCP, Oracle) block port 25 by default. Hetzner, OVH, and most traditional VPS providers allow it.

Both provide admin UI pages that display the exact DNS records you need. Mailcow's DNS check is slightly more detailed, showing pass/fail status for each record type.

## Admin UI and Management

### Mailu

Mailu's admin panel is functional but bare-bones. You can:
- Add/remove domains and mailboxes
- Set per-mailbox quotas
- Configure aliases and auto-forwarding
- View mail queue and logs
- Manage DKIM keys
- Access the RESTful API for automation

It covers the essentials without clutter. If you're managing email for 1-5 domains with a handful of users, this is all you need.

### Mailcow

Mailcow's admin UI is significantly more capable:
- Everything Mailu offers, plus:
- Per-domain and per-mailbox rate limiting
- Detailed rspamd statistics and ham/spam training UI
- SOGo administration (calendar sharing, address books)
- Two-factor authentication management
- Quarantine management with release/delete controls
- Detailed logging with search and filter
- Built-in backup and restore via `helper-scripts/backup_and_restore.sh`
- Watchdog health monitoring for all services
- App passwords for IMAP clients

If you're managing email for a team or organization — multiple domains, many users, compliance requirements — Mailcow's admin panel saves significant time.

## Backup and Maintenance

### Mailu

Backup is manual. You back up the Docker volumes (`/mailu` data directory) and your `mailu.env` file. There are no built-in backup scripts. Most users pair Mailu with [Borgmatic](/apps/borgmatic) or [Restic](/apps/restic) for automated backups.

Updates: pull new images and recreate containers.

```bash
docker compose pull
docker compose up -d
```

### Mailcow

Mailcow includes `helper-scripts/backup_and_restore.sh` that creates a consistent snapshot of all mailbox data, SOGo data, and configuration. Restore is the reverse script.

```bash
# Backup
cd /opt/mailcow-dockerized
./helper-scripts/backup_and_restore.sh backup all /backup/path

# Restore
./helper-scripts/backup_and_restore.sh restore /backup/path
```

Updates use the built-in update script:

```bash
cd /opt/mailcow-dockerized
./update.sh
```

This handles pulling new images, running database migrations, and restarting services in the correct order. It's more robust than a raw `docker compose pull` because Mailcow's container dependencies are complex.

## Community and Support

| Metric | Mailu | Mailcow |
|--------|-------|---------|
| GitHub stars | ~6,000 | ~9,500 |
| First release | 2016 | 2017 |
| Primary support channel | GitHub issues, Matrix chat | GitHub issues, community forum |
| Documentation | Good (docs.mailu.io) | Excellent (docs.mailcow.email) |
| Release cadence | Date-based (e.g., 2024.06) | Date-based (e.g., 2026-01) |
| License | MIT | GPL-3.0 |

Mailcow has a larger community and more comprehensive documentation. The Mailcow docs cover edge cases, integration with external services, and advanced configuration in more depth. Mailu's docs are solid but sometimes lag behind releases.

Both projects are actively maintained with regular releases.

## Use Cases

### Choose Mailu If...

- You have limited RAM (2-4 GB VPS or Raspberry Pi)
- You want the simplest possible setup (wizard-generated config)
- You run ARM hardware (Raspberry Pi 4/5, ARM VPS)
- You need email for a few personal domains without groupware
- You want a lightweight stack that leaves room for other services on the same server
- You prefer a RESTful API for automation

### Choose Mailcow If...

- You need shared calendars, contacts, and ActiveSync (SOGo groupware)
- You manage email for a team or organization with multiple domains
- You have 6+ GB of RAM available
- You want built-in two-factor authentication
- You want built-in backup/restore scripts
- You want a detailed admin UI with rspamd training, quarantine management, and rate limiting
- You need per-user app passwords for IMAP client management

## Final Verdict

**Mailu** is the right choice for personal email hosting. It does exactly what most self-hosters need — reliable SMTP/IMAP with webmail and admin — without the overhead of groupware features you may never use. It runs on hardware as small as a Raspberry Pi 4 with 4 GB RAM, and the setup wizard eliminates the pain of composing a mail stack by hand.

**Mailcow** is the right choice if you need more than just email. SOGo groupware turns it into a full collaboration suite — shared calendars, contact directories, and ActiveSync for mobile devices. The admin UI is genuinely good, with granular controls that matter when you're managing email for multiple people. The cost is RAM: plan for 6-8 GB dedicated to Mailcow.

If you're hosting email just for yourself and a family member, Mailu is the pragmatic choice. If you're replacing Google Workspace or Microsoft 365 for a small team, Mailcow's groupware features justify the extra resources.

**Important for both:** Self-hosting email is the hardest self-hosting category. Deliverability depends on IP reputation, correct DNS, and ongoing monitoring. Neither Mailu nor Mailcow can fix a blacklisted IP or a hosting provider that blocks port 25. Before committing, verify that your provider allows outbound SMTP and that your IP isn't on any blocklists.

## Related

- [How to Self-Host Mailu](/apps/mailu)
- [How to Self-Host Mailcow](/apps/mailcow)
- [Best Self-Hosted Email Servers](/best/email)
- [Replace Gmail](/replace/gmail)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
- [Security Basics for Self-Hosting](/foundations/security)
