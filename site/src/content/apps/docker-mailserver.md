---
title: "How to Self-Host docker-mailserver"
description: "Complete guide to running docker-mailserver with Docker Compose for a full email server with SMTP, IMAP, DKIM, and spam filtering."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "email"
apps:
  - docker-mailserver
tags:
  - self-hosted
  - docker-mailserver
  - docker
  - email
  - smtp
  - imap
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is docker-mailserver?

docker-mailserver is a production-ready, full-featured mail server that runs entirely in a single Docker container. It bundles Postfix (SMTP), Dovecot (IMAP/POP3), OpenDKIM, SpamAssassin or Rspamd, ClamAV, and Fail2ban. Unlike [Mailu](/apps/mailu) or [Mailcow](/apps/mailcow), it has no web UI — all management happens through CLI commands. This makes it lightweight and ideal for sysadmins who prefer configuration files over dashboards. [Official repository](https://github.com/docker-mailserver/docker-mailserver).

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended) with a **static public IP**
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB of RAM minimum (4 GB if enabling ClamAV)
- A domain name with DNS access
- Port 25 open and not blocked by your hosting provider (check with them first — many VPS providers block port 25 by default)
- A reverse DNS (PTR) record set to your mail hostname

**Critical:** Self-hosting email requires proper DNS configuration. Without correct MX, SPF, DKIM, and DMARC records, your emails will land in spam or be rejected entirely.

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  mailserver:
    image: ghcr.io/docker-mailserver/docker-mailserver:15.1.0
    container_name: mailserver
    hostname: mail.example.com
    env_file: mailserver.env
    ports:
      - "25:25"      # SMTP (inbound mail from other servers)
      - "465:465"    # ESMTP with implicit TLS (submission)
      - "587:587"    # ESMTP with STARTTLS (submission)
      - "993:993"    # IMAPS (mail client retrieval)
    volumes:
      - ./docker-data/dms/mail-data/:/var/mail/
      - ./docker-data/dms/mail-state/:/var/mail-state/
      - ./docker-data/dms/mail-logs/:/var/log/mail/
      - ./docker-data/dms/config/:/tmp/docker-mailserver/
      - /etc/localtime:/etc/localtime:ro
    restart: unless-stopped
    stop_grace_period: 1m
    cap_add:
      - NET_ADMIN  # Required for Fail2ban
    healthcheck:
      test: "ss --listening --tcp | grep -P 'LISTEN.+:smtp' || exit 1"
      timeout: 3s
      retries: 0
```

Create a `mailserver.env` file alongside it:

```bash
# Hostname — must match your MX record
OVERRIDE_HOSTNAME=mail.example.com

# Timezone
TZ=America/New_York

# TLS configuration
# Options: letsencrypt, manual, self-signed
SSL_TYPE=letsencrypt

# Admin email for bounces and system notifications
POSTMASTER_ADDRESS=postmaster@example.com

# Protocols
ENABLE_IMAP=1
ENABLE_POP3=0

# Security — enable these for production
ENABLE_RSPAMD=1           # Recommended spam filter (replaces SpamAssassin)
ENABLE_CLAMAV=0            # Antivirus — needs 2+ GB extra RAM
ENABLE_FAIL2BAN=1          # Ban IPs after failed auth attempts
ENABLE_OPENDKIM=1          # DKIM email signing
ENABLE_OPENDMARC=1         # DMARC validation
ENABLE_POLICYD_SPF=1       # SPF policy enforcement
SPOOF_PROTECTION=1         # Prevent sending from forged addresses

# Message limits
POSTFIX_MESSAGE_SIZE_LIMIT=26214400  # 25 MB max message size

# Account management
ACCOUNT_PROVISIONER=FILE   # File-based accounts (default)
```

Start the server:

```bash
docker compose up -d
```

## Initial Setup

### 1. Create Your First Email Account

You must create an account within two minutes of first start, or the container may stop:

```bash
docker exec -ti mailserver setup email add user@example.com
```

You'll be prompted for a password. Alternatively, pass it inline:

```bash
docker exec -ti mailserver setup email add user@example.com 'YourStrongPassword123!'
```

### 2. Add a Postmaster Alias

```bash
docker exec -ti mailserver setup alias add postmaster@example.com user@example.com
```

### 3. Generate DKIM Keys

```bash
docker exec -ti mailserver setup config dkim
```

This creates keys in `./docker-data/dms/config/opendkim/keys/example.com/`. You'll need the content of `mail.txt` for your DNS records.

### 4. Restart to Activate DKIM

```bash
docker compose restart
```

### 5. Configure DNS Records

Set up these DNS records for `example.com`:

| Type | Name | Value |
|------|------|-------|
| MX | `example.com` | `mail.example.com` (priority 10) |
| A | `mail.example.com` | Your server's public IP |
| PTR | (reverse DNS) | `mail.example.com` (set via your hosting provider) |
| TXT (SPF) | `example.com` | `v=spf1 mx ~all` |
| TXT (DKIM) | `mail._domainkey.example.com` | Contents of `mail.txt` from step 3 |
| TXT (DMARC) | `_dmarc.example.com` | `v=DMARC1; p=none; sp=none; fo=0; adkim=r; aspf=r; pct=100; rua=mailto:postmaster@example.com` |

**Test your setup:** Use [mail-tester.com](https://www.mail-tester.com/) to verify your DNS and email configuration score.

## Configuration

### Account Management Commands

```bash
# List all accounts
docker exec -ti mailserver setup email list

# Delete an account
docker exec -ti mailserver setup email del user@example.com

# Update a password
docker exec -ti mailserver setup email update user@example.com 'NewPassword123!'

# Add an alias
docker exec -ti mailserver setup alias add alias@example.com target@example.com

# List aliases
docker exec -ti mailserver setup alias list
```

### Multiple Domains

docker-mailserver supports multiple domains out of the box. Just create accounts with different domains:

```bash
docker exec -ti mailserver setup email add user@domain1.com
docker exec -ti mailserver setup email add user@domain2.com
```

Set up MX, SPF, DKIM, and DMARC records for each domain.

### TLS Certificate with Let's Encrypt

If you're using a reverse proxy like [Nginx Proxy Manager](/apps/nginx-proxy-manager) or [Traefik](/apps/traefik) that manages Let's Encrypt certificates, mount the certificate directory:

```yaml
volumes:
  - ./docker-data/certbot/certs/:/etc/letsencrypt/:ro
```

Set `SSL_TYPE=letsencrypt` in `mailserver.env`. The container will look for certificates at `/etc/letsencrypt/live/<hostname>/`.

For manual certificates, set `SSL_TYPE=manual` and configure:

```bash
SSL_CERT_PATH=/tmp/dms/custom-certs/fullchain.pem
SSL_KEY_PATH=/tmp/dms/custom-certs/privkey.pem
```

## Advanced Configuration (Optional)

### Enable ClamAV Antivirus

ClamAV scans incoming email for malware. It requires ~2 GB of additional RAM for its signature database:

```bash
# In mailserver.env
ENABLE_CLAMAV=1
```

### Rspamd Configuration

Rspamd provides better spam filtering than SpamAssassin. Customize it by placing configuration files in `./docker-data/dms/config/rspamd/override.d/`:

```bash
mkdir -p ./docker-data/dms/config/rspamd/override.d
```

### Relay Through External SMTP

If your VPS provider blocks port 25, relay outbound mail through an external SMTP service:

```bash
# In mailserver.env
DEFAULT_RELAY_HOST=[smtp.sendgrid.net]:587
RELAY_USER=apikey
RELAY_PASSWORD=your-sendgrid-api-key
```

## Reverse Proxy

docker-mailserver handles its own TLS for SMTP/IMAP connections. You don't need a reverse proxy for email protocols. However, if you want a webmail interface, pair it with [Roundcube](https://roundcube.net/) or [Snappymail](https://snappymail.eu/) behind your reverse proxy ([Reverse Proxy Setup](/foundations/reverse-proxy)).

## Backup

Back up these directories:

```bash
# Mail data (all user mailboxes)
./docker-data/dms/mail-data/

# Service state (ClamAV DB, Rspamd data, Fail2ban state)
./docker-data/dms/mail-state/

# Configuration (accounts, aliases, DKIM keys)
./docker-data/dms/config/
```

The config directory is the most critical — it contains your DKIM private keys and account credentials. See [Backup Strategy](/foundations/backup-strategy).

## Troubleshooting

### Emails Going to Spam

**Symptom:** Outbound emails land in recipients' spam folders.
**Fix:** Verify all DNS records are correct:
- PTR (reverse DNS) must match your mail hostname
- SPF, DKIM, and DMARC must all pass
- Test with [mail-tester.com](https://www.mail-tester.com/) — aim for 9/10 or higher

### Port 25 Blocked

**Symptom:** Cannot receive email. Connection timeouts on port 25.
**Fix:** Many VPS providers block port 25 by default. Contact your provider to request port 25 be unblocked, or use a relay service for outbound mail. For inbound, port 25 must be open — there's no workaround.

### Container Stops After Startup

**Symptom:** The container starts then immediately stops.
**Fix:** Create an email account within two minutes of first start. Check logs:

```bash
docker logs mailserver
```

### DKIM Signing Not Working

**Symptom:** Outbound emails fail DKIM verification.
**Fix:** Verify the DKIM DNS record matches the generated key. Restart the container after generating keys:

```bash
docker exec -ti mailserver setup config dkim
docker compose restart
```

### Dovecot Authentication Failures

**Symptom:** Email client cannot connect. Logs show authentication errors.
**Fix:** Verify you're using the full email address (user@example.com) as the username, not just the local part. Check the port — use 993 for IMAPS with implicit TLS, not 143.

## Resource Requirements

- **RAM:** 1 GB minimum (without ClamAV), 3-4 GB with ClamAV enabled
- **CPU:** Low — email is not compute-intensive
- **Disk:** 1 GB for the application, plus storage for mailboxes (varies by usage)

## Verdict

docker-mailserver is the best choice for sysadmins who want a lightweight, no-frills email server managed entirely through the command line. It's more resource-efficient than [Mailcow](/apps/mailcow) and simpler than [Mailu](/apps/mailu) because it skips the web UI entirely. If you're comfortable managing email accounts via CLI and editing configuration files, this is the most reliable self-hosted email solution.

If you want a web admin panel and webmail built in, look at [Mailcow](/apps/mailcow) instead. If you want something even simpler and more modern, [Stalwart](/apps/stalwart) is worth considering.

Self-hosting email is hard. DNS, deliverability, IP reputation, and spam filtering all require ongoing attention. If you're not prepared for that, use a privacy-focused provider like Proton Mail or Fastmail.

## Related

- [How to Self-Host Mailu](/apps/mailu)
- [How to Self-Host Mailcow](/apps/mailcow)
- [How to Self-Host Stalwart](/apps/stalwart)
- [Mailu vs Mailcow](/compare/mailu-vs-mailcow)
- [Best Self-Hosted Email Servers](/best/email)
- [Self-Hosted Alternatives to Gmail](/replace/gmail)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
- [Backup Strategy](/foundations/backup-strategy)
