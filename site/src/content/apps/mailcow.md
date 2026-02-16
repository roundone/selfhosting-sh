---
title: "How to Self-Host Mailcow with Docker"
description: "Step-by-step guide to deploying Mailcow dockerized — a full self-hosted mail server with webmail, antispam, antivirus, and admin UI using Docker."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "email"
apps:
  - mailcow
tags:
  - docker
  - email
  - mail-server
  - groupware
  - sogo
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Mailcow?

[Mailcow](https://mailcow.email/) is a fully integrated, open-source mail server suite that bundles Postfix, Dovecot, Rspamd, ClamAV, SOGo, and a web-based admin interface into a single Docker Compose deployment. It replaces Gmail, Outlook, or any hosted email provider with a mail server you control completely. Mailcow handles sending, receiving, spam filtering, antivirus scanning, webmail, calendar, contacts, and domain management out of the box.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended) with a **dedicated public IP address** -- shared hosting will not work
- **6 GB of RAM minimum** (8 GB recommended -- ClamAV, SOGo, and MariaDB are memory-hungry)
- 20 GB of free disk space for the base installation, plus storage for mailboxes
- Docker and Docker Compose v2 installed ([Docker Compose Basics](/foundations/docker-compose-basics))
- A registered domain name with full DNS control
- A clean IP address not on any email blacklists (check at [mxtoolbox.com](https://mxtoolbox.com/blacklists.aspx))
- **No other services running on ports 25, 80, 443, 110, 143, 465, 587, 993, 995, or 4190** -- Mailcow needs exclusive access to these ports
- Reverse DNS (PTR record) set on your server IP to match your mail hostname (e.g., `mail.example.com`)

**Port 25 must be open.** Many cloud providers (AWS, GCP, Azure, Oracle Cloud) block outbound port 25 by default. Hetzner, OVH, and most dedicated server providers allow it. Check with your provider before proceeding.

## DNS Configuration

DNS is the single most critical part of a mail server setup. Incorrect DNS means your emails get rejected or land in spam. Configure all of the following records **before** installing Mailcow.

Replace `example.com` with your domain and `203.0.113.10` with your server's IP address.

### MX Record

The MX record tells other mail servers where to deliver email for your domain.

| Type | Name | Value | Priority | TTL |
|------|------|-------|----------|-----|
| MX | `example.com` | `mail.example.com` | 10 | 3600 |

### A and AAAA Records

Point your mail hostname to the server IP.

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `mail.example.com` | `203.0.113.10` | 3600 |
| AAAA | `mail.example.com` | `2001:db8::1` (if applicable) | 3600 |

### SPF Record

SPF tells receiving servers which IPs are allowed to send email for your domain.

| Type | Name | Value | TTL |
|------|------|-------|-----|
| TXT | `example.com` | `v=spf1 mx a -all` | 3600 |

### DKIM Record

DKIM is configured after installation -- Mailcow generates the DKIM key automatically. You will add the DNS record in the Initial Setup section below.

### DMARC Record

DMARC tells receiving servers what to do when SPF or DKIM checks fail.

| Type | Name | Value | TTL |
|------|------|-------|-----|
| TXT | `_dmarc.example.com` | `v=DMARC1; p=quarantine; rua=mailto:postmaster@example.com` | 3600 |

Start with `p=quarantine` (sends failures to spam). Once you confirm everything works, change to `p=reject` for stricter enforcement.

### Autodiscover and Autoconfig

These let email clients like Thunderbird and Outlook auto-detect your server settings.

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `autodiscover.example.com` | `mail.example.com` | 3600 |
| CNAME | `autoconfig.example.com` | `mail.example.com` | 3600 |

### SRV Records (Optional)

For full autodiscovery support in all email clients:

| Type | Name | Value | Priority | Weight | Port |
|------|------|-------|----------|--------|------|
| SRV | `_submissions._tcp.example.com` | `mail.example.com` | 0 | 1 | 465 |
| SRV | `_imaps._tcp.example.com` | `mail.example.com` | 0 | 1 | 993 |
| SRV | `_pop3s._tcp.example.com` | `mail.example.com` | 0 | 1 | 995 |
| SRV | `_autodiscover._tcp.example.com` | `mail.example.com` | 0 | 1 | 443 |

### PTR Record (Reverse DNS)

Set the reverse DNS record for your server IP to `mail.example.com`. This is configured through your hosting provider's control panel, not your DNS registrar. Without a matching PTR record, many mail servers will reject your emails outright.

## Installation

Mailcow uses a non-standard Docker deployment approach. You do **not** write a `docker-compose.yml` by hand. Instead, you clone the Mailcow repository and run a configuration generator.

### Step 1: Clone the Repository

```bash
cd /opt
git clone https://github.com/mailcow/mailcow-dockerized.git
cd mailcow-dockerized
```

### Step 2: Generate the Configuration

Run the interactive configuration script:

```bash
./generate_config.sh
```

The script asks for:
- **Mail server hostname (FQDN):** Enter `mail.example.com` (must match your DNS A record)
- **Timezone:** Enter your timezone (e.g., `America/New_York`, `Europe/Berlin`)
- **Branch:** Choose `master` for stable releases

This generates `mailcow.conf` with all required settings. Review it:

```bash
cat mailcow.conf
```

Key settings in `mailcow.conf`:

```ini
# Your mail server hostname -- must match DNS
MAILCOW_HOSTNAME=mail.example.com

# Timezone
TZ=America/New_York

# HTTP/HTTPS ports -- change if running behind a reverse proxy
HTTP_PORT=80
HTTPS_PORT=443

# API access
API_KEY=                        # Set this to enable the API
API_KEY_READ_ONLY=              # Read-only API key
API_ALLOW_FROM=127.0.0.1,::1   # Restrict API access by IP

# Skip components to save resources (set to y to disable)
SKIP_CLAMD=n                    # ClamAV antivirus -- uses ~1 GB RAM
SKIP_SOLR=y                     # Full-text search -- uses ~1 GB extra RAM
SKIP_SOGO=n                     # SOGo webmail/groupware
```

### Step 3: Pull and Start

```bash
docker compose pull
docker compose up -d
```

The first startup takes several minutes. ClamAV needs to download virus definitions, and MariaDB initializes the database. Monitor progress:

```bash
docker compose logs -f
```

Wait until you see all services report as healthy:

```bash
docker compose ps
```

All containers should show `Up (healthy)` status. The full stack includes: Postfix (SMTP), Dovecot (IMAP/POP3), Rspamd (spam filtering), ClamAV (antivirus), SOGo (webmail), Unbound (DNS resolver), Redis (caching), MariaDB (database), PHP-FPM, Nginx (web server), ACME (SSL certificates), Watchdog (health monitoring), and several helper containers.

### Step 4: Verify HTTPS

Mailcow handles SSL certificates automatically via Let's Encrypt. Open `https://mail.example.com` in your browser. You should see the Mailcow login page with a valid SSL certificate.

If HTTPS is not working, check the ACME container logs:

```bash
docker compose logs acme-mailcow
```

## Initial Setup

### Admin Login

Open `https://mail.example.com` and log in with the default credentials:

- **Username:** `admin`
- **Password:** `moohoo`

**Change this password immediately.** Go to **Edit** in the top-right corner to update the admin credentials.

### Add a Domain

1. Go to **E-Mail** > **Configuration** > **Domains**
2. Click **Add domain**
3. Enter your domain (e.g., `example.com`)
4. Set maximum mailboxes, aliases, and quota limits
5. Click **Add domain and restart SOGo**

### Add a Mailbox

1. Go to **E-Mail** > **Configuration** > **Mailboxes**
2. Click **Add mailbox**
3. Fill in the username, full name, password, and quota
4. Click **Add**

### Configure DKIM

1. Go to **E-Mail** > **Configuration** > **Domains**
2. Click the DKIM key icon next to your domain
3. Select a key length (2048-bit recommended)
4. Click **Generate** to create the DKIM key
5. Copy the displayed DKIM public key
6. Add it as a TXT record in your DNS:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| TXT | `dkim._domainkey.example.com` | (paste the generated key) | 3600 |

### Verify Email Deliverability

Send a test email to [mail-tester.com](https://www.mail-tester.com/) and check your score. Aim for 9/10 or higher. Common issues that lower the score:
- Missing PTR record
- DKIM not yet propagated (wait 15-30 minutes after adding the DNS record)
- SPF record misconfigured
- Server IP on a blacklist

### Access SOGo Webmail

SOGo is available at `https://mail.example.com/SOGo`. Log in with any mailbox email address and password. SOGo provides:
- Full webmail interface
- Calendar with CalDAV sync
- Contacts with CardDAV sync
- Shared calendars and address books

## Configuration

### Domain Management

Under **E-Mail** > **Configuration** > **Domains**, you can:
- Set default quotas per domain
- Limit the number of mailboxes and aliases
- Enable or disable sender rate limiting
- Configure relay hosts for outbound mail
- Set catchall addresses

### Rate Limiting

Mailcow includes built-in rate limiting to prevent abuse. Configure under **E-Mail** > **Configuration** > **Domains** > **Rate limit**:

- **Per-mailbox limits:** Restrict how many messages a single mailbox can send per hour
- **Per-domain limits:** Restrict total outbound volume for a domain

Default: no rate limit. Set reasonable limits (e.g., 50 messages/hour per mailbox) to protect your IP reputation if a mailbox is compromised.

### Rspamd Spam Filtering

Access the Rspamd web UI at `https://mail.example.com/rspamd`. The default password is set in `mailcow.conf` under `RSPAMD_UI_PASSWORD` (or auto-generated during setup).

From the Rspamd UI, you can:
- View spam statistics and filtering history
- Adjust spam score thresholds
- Whitelist or blacklist senders and domains
- Train the Bayesian filter by marking messages as spam or ham

### Quarantine

Mailcow quarantines messages that score above the spam threshold. Configure under **E-Mail** > **Configuration** > **Quarantine**:
- Set the maximum quarantine age
- Configure notification frequency for quarantined messages
- Users can review their own quarantine from SOGo

### Aliases and Forwarding

Create aliases under **E-Mail** > **Configuration** > **Aliases**:
- **Regular aliases:** Map `info@example.com` to a mailbox
- **Catch-all:** Forward all unmatched addresses to a specific mailbox
- **Temporary aliases:** Create time-limited aliases for signups
- **Recipient maps:** Forward to external addresses

## Advanced Configuration

### Disabling ClamAV to Save RAM

ClamAV uses approximately 1 GB of RAM. On memory-constrained servers, disable it:

1. Edit `mailcow.conf`:
   ```ini
   SKIP_CLAMD=y
   ```
2. Apply the change:
   ```bash
   docker compose up -d
   ```

Rspamd still provides effective spam filtering without ClamAV. You lose virus scanning, but email-borne malware is less of a concern for small personal mail servers.

### Enabling Full-Text Search (Solr)

Solr enables full-text search across all mailboxes. It uses approximately 1 GB of additional RAM.

1. Edit `mailcow.conf`:
   ```ini
   SKIP_SOLR=n
   SOLR_HEAP=512         # Heap size in MB
   ```
2. Apply:
   ```bash
   docker compose up -d
   ```

Trigger initial indexing from the admin UI under **E-Mail** > **Configuration** > **Domains** > **Solr**.

### Two-Factor Authentication

Enable 2FA for the admin account and individual mailboxes:

1. Log into the admin UI
2. Go to **Edit** (top-right)
3. Under **Two-Factor Authentication**, scan the QR code with an authenticator app
4. Enter the verification code to confirm

Users can enable 2FA for their own mailbox login at `https://mail.example.com` > **User Settings**.

### API Access

Mailcow provides a full REST API for automation. Enable it in `mailcow.conf`:

```ini
API_KEY=your-secure-api-key-here
API_ALLOW_FROM=127.0.0.1,::1,192.168.1.0/24
```

Restart after changing:

```bash
docker compose up -d
```

API documentation is available at `https://mail.example.com/api/`.

Example -- create a mailbox via API:

```bash
curl -X POST "https://mail.example.com/api/v1/add/mailbox" \
  -H "X-API-Key: your-secure-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "local_part": "user",
    "domain": "example.com",
    "name": "New User",
    "password": "SecurePassword123!",
    "quota": "3072",
    "active": "1"
  }'
```

### Running Behind a Reverse Proxy

If you need Mailcow behind an existing reverse proxy (e.g., [Nginx Proxy Manager](/apps/nginx-proxy-manager) or [Traefik](/apps/traefik)), change the HTTP/HTTPS ports in `mailcow.conf`:

```ini
HTTP_PORT=8080
HTTPS_PORT=8443
HTTP_BIND=127.0.0.1
HTTPS_BIND=127.0.0.1
```

Configure your reverse proxy to forward traffic to `127.0.0.1:8080` (HTTP) and `127.0.0.1:8443` (HTTPS). You must pass the `X-Forwarded-For` and `X-Forwarded-Proto` headers. Disable Mailcow's built-in ACME and handle SSL certificates in your reverse proxy.

See Mailcow's [reverse proxy documentation](https://docs.mailcow.email/post_installation/firststeps-rp/) for proxy-specific configurations. Also see our [Reverse Proxy Setup guide](/foundations/reverse-proxy-explained) for general reverse proxy concepts.

## Backup

Mailcow includes a built-in backup and restore script. This is the recommended backup method.

### Creating a Backup

```bash
cd /opt/mailcow-dockerized

# Full backup (all data)
./helper-scripts/backup_and_restore.sh backup all

# Backup specific components
./helper-scripts/backup_and_restore.sh backup crypt    # Encrypted mail
./helper-scripts/backup_and_restore.sh backup vmail    # Mailbox data
./helper-scripts/backup_and_restore.sh backup redis    # Redis database
./helper-scripts/backup_and_restore.sh backup rspamd   # Rspamd data
./helper-scripts/backup_and_restore.sh backup postfix  # Postfix maps
./helper-scripts/backup_and_restore.sh backup mysql    # MariaDB database
```

By default, backups are stored in `/opt/mailcow-dockerized/backup/`. Change the backup location by setting `BACKUP_LOCATION` in `mailcow.conf` or by exporting it before running the script:

```bash
export BACKUP_LOCATION=/mnt/backup/mailcow
./helper-scripts/backup_and_restore.sh backup all
```

### Automating Backups

Add a cron job for daily backups:

```bash
# Edit crontab
crontab -e

# Add this line for daily backups at 3 AM
0 3 * * * cd /opt/mailcow-dockerized && BACKUP_LOCATION=/mnt/backup/mailcow ./helper-scripts/backup_and_restore.sh backup all >> /var/log/mailcow-backup.log 2>&1
```

### Restoring from Backup

```bash
cd /opt/mailcow-dockerized

# Restore everything
./helper-scripts/backup_and_restore.sh restore
```

The restore script shows available backup snapshots and lets you choose which one to restore. For the [3-2-1 backup strategy](/foundations/backup-3-2-1-rule), copy backup files to an offsite location after each run.

## Troubleshooting

### High RAM Usage

**Symptom:** Server becomes unresponsive, OOM killer terminates containers, or `docker compose ps` shows containers restarting.

**Fix:** Mailcow with all components needs 6+ GB of RAM. Reduce memory usage by disabling optional components:

```ini
# In mailcow.conf
SKIP_CLAMD=y    # Saves ~1 GB
SKIP_SOLR=y     # Saves ~1 GB
```

Check current memory usage per container:

```bash
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"
```

If you cannot add more RAM, Mailcow may not be the right choice for your server -- consider [Mailu](/apps/mailu) as a lighter alternative.

### Port Conflicts

**Symptom:** Containers fail to start with `Error starting userland proxy: listen tcp 0.0.0.0:25: bind: address already in use`.

**Fix:** Another service is using one of Mailcow's required ports. Identify and stop it:

```bash
# Find what's using port 25
sudo ss -tlnp | grep :25

# Common culprits
sudo systemctl stop postfix    # System Postfix
sudo systemctl disable postfix
sudo systemctl stop exim4      # Exim (Debian default MTA)
sudo systemctl disable exim4
sudo systemctl stop apache2    # Apache on port 80
sudo systemctl disable apache2
```

For ports 80 and 443, if you need a web server for other sites, run Mailcow behind a reverse proxy (see the Advanced Configuration section above).

### Emails Rejected by Recipients

**Symptom:** You send emails but recipients never receive them, or they bounce with errors like `550 5.7.1 Sender rejected`.

**Fix:** Check DNS configuration, PTR record, and IP reputation in this order:

1. Verify your DNS records are correct:
   ```bash
   # Check MX record
   dig MX example.com +short

   # Check SPF record
   dig TXT example.com +short

   # Check DKIM
   dig TXT dkim._domainkey.example.com +short

   # Check DMARC
   dig TXT _dmarc.example.com +short
   ```

2. Verify the PTR record matches your mail hostname:
   ```bash
   dig -x 203.0.113.10 +short
   # Should return: mail.example.com.
   ```

3. Check if your IP is blacklisted at [mxtoolbox.com/blacklists.aspx](https://mxtoolbox.com/blacklists.aspx). If listed, request delisting from each blacklist provider.

4. Check Postfix logs for specific rejection reasons:
   ```bash
   docker compose logs postfix-mailcow | tail -100
   ```

### DNS Resolution Failures Inside Containers

**Symptom:** Emails fail to send with errors like `Host or domain name not found` in Postfix logs, or Rspamd cannot resolve sender domains.

**Fix:** Mailcow runs its own Unbound DNS resolver. Check if it is working:

```bash
# Check Unbound container health
docker compose logs unbound-mailcow | tail -20

# Test DNS resolution from inside the container
docker compose exec unbound-mailcow dig example.com +short
```

If Unbound cannot reach upstream DNS, check your server's firewall rules -- outbound UDP/TCP port 53 must be open. On some VPS providers, you may need to configure upstream forwarders in `data/conf/unbound/unbound.conf`:

```yaml
forward-zone:
  name: "."
  forward-addr: 1.1.1.1
  forward-addr: 8.8.8.8
```

Then restart Unbound:

```bash
docker compose restart unbound-mailcow
```

### SOGo Slow or Unresponsive

**Symptom:** SOGo webmail loads slowly, calendar sync times out, or CardDAV/CalDAV clients fail to connect.

**Fix:** SOGo performance degrades under memory pressure. Check its resource usage:

```bash
docker stats --no-stream sogo-mailcow
```

If SOGo is using most of its allocated memory, increase the worker count and memory limit. Edit `data/conf/sogo/sogo.conf` and adjust:

```
WOWorkersCount = 3;          /* Default is 3, increase for more users */
SOGoMaximumPingInterval = 354;
SOGoMaximumSyncInterval = 354;
SOGoInternalSyncInterval = 30;
```

Restart SOGo after changes:

```bash
docker compose restart sogo-mailcow
```

For persistent slowness with many users, ensure you have enough RAM (1 GB for SOGo alone is a reasonable baseline for 10-20 active users).

## Resource Requirements

Mailcow is one of the heaviest self-hosted applications. Plan your hardware accordingly.

- **RAM:** 4 GB absolute minimum (will struggle). **6 GB recommended.** 8+ GB comfortable with all features enabled.
  - ClamAV: ~1 GB
  - SOGo: ~500 MB - 1 GB
  - MariaDB: ~500 MB
  - Rspamd: ~200-500 MB
  - Solr (optional): ~1 GB
  - Remaining services: ~500 MB combined
- **CPU:** 2+ cores minimum. Mail processing and spam filtering benefit from additional cores.
- **Disk:** 20 GB for the base installation. Mailbox storage depends on your usage -- plan 1-5 GB per user for a personal server, more for business use.
- **Network:** A dedicated public IP with clean reputation. Port 25 must be open for inbound and outbound.

## Verdict

Mailcow is the most feature-complete self-hosted mail server solution available. The admin UI is genuinely excellent -- managing domains, mailboxes, DKIM, spam settings, and user quotas is straightforward and does not require editing config files after initial setup. SOGo provides a capable webmail and groupware suite that handles calendar and contact sync well.

The trade-off is resource consumption. At 6+ GB of RAM for comfortable operation, Mailcow demands more than most self-hosted apps combined. It also requires a server with clean IP reputation and correct DNS -- getting email deliverability right is an ongoing responsibility, not a one-time setup.

If you have a dedicated server with 8+ GB of RAM and want a polished, all-in-one mail server with a web UI for everything, Mailcow is the best option. If you are running a smaller VPS with limited resources, look at [Mailu](/apps/mailu) instead -- it provides similar functionality with a smaller footprint. If you just need to send transactional emails from your self-hosted apps, skip the full mail server entirely and use an [SMTP relay service](/foundations/smtp-email-basics).

Self-hosting email is the hardest category of self-hosting. IP reputation, DNS configuration, spam filtering, and deliverability monitoring are ongoing tasks. Mailcow handles the technical stack well, but you still own the operational responsibility. Go in with that understanding.

## Related

- [SMTP Email Basics](/foundations/smtp-email-basics)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Nginx Proxy Manager](/apps/nginx-proxy-manager)
- [Traefik](/apps/traefik)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [DNS Explained](/foundations/dns-explained)
- [Security Basics](/foundations/selfhosting-security-checklist)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting)
