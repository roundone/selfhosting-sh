---
title: "How to Self-Host Stalwart Mail Server"
description: "Deploy Stalwart Mail Server with Docker for a modern all-in-one email server with JMAP, IMAP, SMTP, and a built-in web admin."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "email"
apps:
  - stalwart
tags:
  - self-hosted
  - stalwart
  - docker
  - email
  - smtp
  - imap
  - jmap
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Stalwart?

Stalwart is a modern, all-in-one mail server written in Rust. It supports JMAP, IMAP, POP3, and SMTP in a single binary with a built-in web admin UI, spam filtering, full-text search, and encryption at rest. Unlike [Mailu](/apps/mailu/) or [Mailcow](/apps/mailcow/), Stalwart needs no external database, no Redis, and no separate components — everything runs in one container with embedded RocksDB storage. It also includes CalDAV and CardDAV support. [Official site](https://stalw.art/).

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 1 GB of RAM minimum (2 GB recommended)
- 10 GB of free disk space
- A domain name with DNS access
- Port 25 open and not blocked by your hosting provider
- A reverse DNS (PTR) record set to your mail hostname

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  stalwart:
    image: stalwartlabs/stalwart:v0.15.5
    container_name: stalwart
    ports:
      - "25:25"       # SMTP (inbound mail)
      - "465:465"     # SMTPS (implicit TLS submission)
      - "587:587"     # SMTP Submission (STARTTLS)
      - "143:143"     # IMAP
      - "993:993"     # IMAPS (implicit TLS)
      - "4190:4190"   # ManageSieve
      - "443:443"     # HTTPS (JMAP, web client, REST API)
      - "8080:8080"   # Web Admin UI (HTTP)
    volumes:
      - stalwart-data:/opt/stalwart
    restart: unless-stopped

volumes:
  stalwart-data:
```

That's the entire stack. No PostgreSQL, no Redis, no separate services. Start it:

```bash
docker compose up -d
```

## Initial Setup

### 1. Retrieve Admin Credentials

Stalwart generates admin credentials on first start. Get them from the logs:

```bash
docker logs stalwart
```

Look for a line showing the admin username and password.

### 2. Access the Web Admin

Open `http://your-server-ip:8080/login` in your browser. Log in with the admin credentials from step 1.

### 3. Configure Your Hostname

In the web admin, go to **Settings > Server > Network** and set your mail hostname (e.g., `mail.example.com`).

### 4. Add Your Domain

Go to **Management > Directory > Domains** and add your domain (e.g., `example.com`).

### 5. Configure TLS

Under **Settings > TLS**, either:
- Upload your TLS certificate and private key, or
- Enable ACME (Let's Encrypt) for automatic certificate provisioning

### 6. Create User Accounts

Go to **Management > Directory > Accounts** and create your email accounts.

### 7. Configure DNS Records

Set up these DNS records:

| Type | Name | Value |
|------|------|-------|
| MX | `example.com` | `mail.example.com` (priority 10) |
| A | `mail.example.com` | Your server's public IP |
| PTR | (reverse DNS) | `mail.example.com` |
| TXT (SPF) | `example.com` | `v=spf1 mx ~all` |
| TXT (DKIM) | Generated in admin UI | Copy from Stalwart's DKIM settings |
| TXT (DMARC) | `_dmarc.example.com` | `v=DMARC1; p=none; rua=mailto:postmaster@example.com` |

Stalwart can generate DKIM keys automatically through the web admin.

## Configuration

All configuration happens through the web admin UI or via TOML configuration files stored in the `/opt/stalwart` volume.

### Spam Filtering

Stalwart includes a built-in spam filter with:
- Statistical spam classifier (Bayesian)
- DNS blocklists (DNSBL)
- Phishing detection
- Greylisting
- Sender reputation tracking
- Spam traps

Configure spam settings under **Settings > Spam Filter** in the admin UI.

### Full-Text Search

Built-in full-text search supports 17 languages out of the box using an embedded search engine. No Elasticsearch or external search service needed.

### Authentication Providers

Stalwart supports multiple authentication backends:
- Internal directory (default — stored in RocksDB)
- LDAP
- SQL databases (PostgreSQL, MySQL, SQLite)
- OAuth2

Configure under **Settings > Authentication** in the admin UI.

## Advanced Configuration (Optional)

### External Database Backend

For large deployments, you can replace RocksDB with an external database:

```toml
# In the TOML config at /opt/stalwart/etc/config.toml
[store."postgresql"]
type = "postgresql"
host = "db.example.com"
port = 5432
database = "stalwart"
user = "stalwart"
password = "your-password"
```

Supported backends: PostgreSQL, MySQL, SQLite, FoundationDB, S3, Azure Blob Storage, Redis.

### Clustering

Stalwart supports clustering for high availability via peer-to-peer coordination or through Kafka, Redpanda, NATS, or Redis. Configure under **Settings > Cluster** in the admin UI.

### CalDAV and CardDAV

Stalwart includes built-in CalDAV (calendar) and CardDAV (contacts) support. No additional configuration needed — these are available on the HTTPS port (443) after TLS is configured.

## Reverse Proxy

If you're running Stalwart behind an existing reverse proxy, expose only the web admin and JMAP ports through the proxy. Email protocols (SMTP, IMAP) should connect directly to Stalwart:

```yaml
ports:
  - "25:25"       # Direct — SMTP
  - "465:465"     # Direct — SMTPS
  - "587:587"     # Direct — Submission
  - "993:993"     # Direct — IMAPS
  - "127.0.0.1:8080:8080"  # Through reverse proxy — Web Admin
```

Then proxy `https://mail.example.com` to `http://localhost:8080` in your reverse proxy ([Reverse Proxy Setup](/foundations/reverse-proxy-explained/)).

## Backup

All data lives in a single volume:

```bash
# Back up the entire Stalwart data directory
docker run --rm -v stalwart-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/stalwart-backup-$(date +%Y%m%d).tar.gz /data
```

This includes configuration, the RocksDB database, mail blobs, full-text search indexes, TLS certificates, and Sieve scripts. See [Backup Strategy](/foundations/backup-strategy/).

## Troubleshooting

### Admin Password Lost

**Symptom:** Can't log into the web admin.
**Fix:** Reset the admin password via the CLI:

```bash
docker exec -ti stalwart /opt/stalwart/bin/stalwart-cli -u https://localhost:443 server admin-password reset
```

### Emails Going to Spam

**Symptom:** Outbound emails land in spam folders.
**Fix:** Verify DNS records (SPF, DKIM, DMARC, PTR) are all correctly configured. Use [mail-tester.com](https://www.mail-tester.com/) to check your score. The PTR (reverse DNS) record is the most commonly forgotten.

### Port 25 Blocked

**Symptom:** Cannot receive email from external servers.
**Fix:** Contact your VPS provider to unblock port 25. Many cloud providers (AWS, GCP, Azure) block it by default. Hetzner and OVH typically allow it.

### JMAP Client Not Connecting

**Symptom:** JMAP email clients can't connect.
**Fix:** JMAP runs over HTTPS on port 443. Ensure TLS is properly configured in the admin UI. The JMAP endpoint is at `https://mail.example.com/jmap`.

### Upgrade from v0.14.x to v0.15.x

**Symptom:** Server fails to start after upgrading.
**Fix:** v0.15.x includes breaking changes. Check the [migration guide](https://stalw.art/docs/upgrade/v0.15) before upgrading. Back up your data volume first.

## Resource Requirements

- **RAM:** 512 MB idle, 1-2 GB under load
- **CPU:** Low — Rust is extremely efficient
- **Disk:** 2 GB for the application, plus mail storage

Stalwart is the lightest full-featured mail server available. It uses a fraction of the resources that Mailcow or Mailu require.

## Verdict

Stalwart is the most modern and resource-efficient self-hosted mail server available. The single-binary Rust architecture means no juggling PostgreSQL, Redis, and multiple containers — everything runs in one container with one volume. The built-in web admin, JMAP support, CalDAV/CardDAV, and spam filtering make it genuinely competitive with commercial solutions.

Choose Stalwart if you want a modern mail server that's easy to deploy and light on resources. Choose [Mailcow](/apps/mailcow/) if you want a more established solution with a larger community. Choose [docker-mailserver](/apps/docker-mailserver/) if you prefer CLI-only management without a web UI.

Fair warning: Stalwart is newer than Mailu and Mailcow, so the community is smaller and you'll find fewer guides online. But development is very active and the architecture is sound.

## Related

- [How to Self-Host Mailu](/apps/mailu/)
- [How to Self-Host Mailcow](/apps/mailcow/)
- [How to Self-Host docker-mailserver](/apps/docker-mailserver/)
- [Mailu vs Mailcow](/compare/mailu-vs-mailcow/)
- [Best Self-Hosted Email Servers](/best/email/)
- [Self-Hosted Alternatives to Gmail](/replace/gmail/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-strategy/)
