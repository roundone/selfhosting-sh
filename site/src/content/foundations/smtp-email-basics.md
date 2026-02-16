---
title: "SMTP Email Basics for Self-Hosting"
description: "Learn how SMTP email server delivery works for self-hosting, configure relay services like Resend and Mailgun, and set up Docker apps to send email."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "smtp", "email", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is SMTP?

SMTP (Simple Mail Transfer Protocol) is the protocol that sends email across the internet. Every self-hosted app that sends notifications, password resets, or alerts needs an SMTP email server or relay to deliver those messages. Without SMTP configured, your Nextcloud instance can't email you when someone shares a file, your Gitea server can't send merge request notifications, and your monitoring tools can't alert you when something breaks.

SMTP handles outbound delivery only. Receiving email uses different protocols (IMAP and POP3). Most self-hosters only need outbound email — notifications, alerts, and transactional messages — which is what this guide covers.

## Prerequisites

- A Linux server with Docker installed ([Docker Compose Basics](/foundations/docker-compose-basics))
- Basic terminal knowledge ([Linux Basics](/foundations/linux-basics-self-hosting))
- A domain name (required for proper email delivery)
- Access to your domain's DNS settings ([DNS Explained](/foundations/dns-explained))

## How Email Works: SMTP, IMAP, and POP3

Email uses three protocols, each with a different job:

| Protocol | Direction | Port(s) | Purpose |
|----------|-----------|---------|---------|
| **SMTP** | Outbound | 25, 465, 587 | Sends email from sender to recipient's mail server |
| **IMAP** | Inbound | 143, 993 | Retrieves email from server, keeps it synced across devices |
| **POP3** | Inbound | 110, 995 | Downloads email from server, typically deletes server copy |

### SMTP in Detail

When you send an email, this happens:

1. **Your app** connects to an SMTP server (either your own or a relay service) on port 587 (submission) or 465 (implicit TLS)
2. **The SMTP server** authenticates your credentials, accepts the message, and looks up the recipient domain's MX record via DNS
3. **The sending server** connects to the recipient's mail server on port 25 and delivers the message
4. **The recipient's server** runs spam checks (SPF, DKIM, DMARC), then either delivers to the inbox or rejects/flags the message

Port 25 is server-to-server delivery. Port 587 is client-to-server submission (what your apps use). Port 465 is the same as 587 but with implicit TLS instead of STARTTLS. Most residential ISPs and cloud providers block port 25 outbound, which is one of many reasons running your own mail server is painful.

### Why Most Self-Hosters Only Need SMTP

Unless you want to replace Gmail entirely, you only need outbound SMTP. Your self-hosted apps need to send:

- Password reset emails
- Notification emails (new comments, shared files, CI/CD results)
- Alert emails (monitoring, uptime, disk space warnings)
- Invitation emails

All of these are outbound-only. An SMTP relay service handles this without the complexity of running a full mail server.

## DNS Records for Email

Four DNS record types control email delivery and authentication. Even if you use a relay service, understanding these matters — misconfigured DNS is the #1 cause of email landing in spam.

### MX Records

MX (Mail Exchanger) records tell other servers where to deliver email for your domain. They point to the mail server that handles incoming email.

```
example.com.  IN  MX  10  mail.example.com.
```

The number (10) is priority — lower numbers are tried first. You only need MX records if you're receiving email at your domain. For outbound-only setups using a relay, MX records aren't required.

### SPF (Sender Policy Framework)

SPF tells receiving servers which IP addresses and services are authorized to send email on behalf of your domain. It's a TXT record on your domain:

```
example.com.  IN  TXT  "v=spf1 include:_spf.resend.com ~all"
```

This says: "Only servers listed in Resend's SPF record can send email from @example.com. Soft-fail everything else."

| SPF Qualifier | Meaning |
|---------------|---------|
| `+all` | Allow everyone (defeats the purpose — never use this) |
| `~all` | Soft fail — accept but mark as suspicious |
| `-all` | Hard fail — reject unauthorized senders |
| `?all` | Neutral — no opinion |

Use `~all` during setup and testing. Switch to `-all` once you've confirmed everything works.

**Common mistake:** Multiple SPF records. A domain can only have ONE SPF TXT record. If you need multiple providers, combine them:

```
"v=spf1 include:_spf.resend.com include:_spf.google.com ~all"
```

### DKIM (DomainKeys Identified Mail)

DKIM adds a cryptographic signature to every outbound email. The receiving server checks the signature against a public key published in your DNS. If it matches, the email hasn't been tampered with in transit.

DKIM records look like this:

```
resend._domainkey.example.com.  IN  TXT  "v=DKIM1; k=rsa; p=MIGfMA0GCSqGS..."
```

Your relay service generates the DKIM key pair. You publish the public key as a DNS record. The relay signs outbound email with the private key. This is handled automatically by services like Resend, Mailgun, and SMTP2GO — you just add the DNS record they give you.

### DMARC (Domain-based Message Authentication, Reporting & Conformance)

DMARC ties SPF and DKIM together and tells receiving servers what to do when authentication fails. It also provides reporting so you can see who's sending email from your domain.

```
_dmarc.example.com.  IN  TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"
```

| DMARC Policy | What Happens on Failure |
|--------------|------------------------|
| `p=none` | Do nothing — just report (use during setup) |
| `p=quarantine` | Move to spam folder |
| `p=reject` | Reject the email outright |

Start with `p=none` to collect reports. Move to `p=quarantine` after a week with no issues. Move to `p=reject` once you're confident.

### The Full DNS Setup

For a domain using Resend as an SMTP relay, your DNS records would be:

```
# SPF — authorize Resend to send on your behalf
example.com.          TXT   "v=spf1 include:_spf.resend.com ~all"

# DKIM — Resend provides this record
resend._domainkey.example.com.  TXT   "v=DKIM1; k=rsa; p=<key-from-resend>"

# DMARC — start with monitoring
_dmarc.example.com.   TXT   "v=DMARC1; p=none; rua=mailto:dmarc@example.com"
```

Each relay service provides their specific DNS records during setup. Add them exactly as provided.

## Self-Hosting Email vs Using a Relay

This is where you need an honest assessment. **For outbound notifications and alerts, use an SMTP relay service. Do not run your own mail server unless you have a specific reason to.**

Running a full mail server (Mailcow, Mailu, Mail-in-a-Box) is one of the hardest self-hosting projects. Here's why:

### Why Running Your Own Mail Server Is Hard

1. **IP reputation.** Residential and VPS IP addresses are often pre-blacklisted. Major providers (Gmail, Outlook) treat unknown IPs as suspicious. Building reputation takes weeks to months of consistent, low-volume sending. One mistake (open relay, spam complaint) and you're blacklisted again.

2. **Deliverability.** Even with perfect SPF, DKIM, and DMARC, Gmail may still drop your email into spam. Large providers use opaque reputation systems that favor established sending infrastructure.

3. **Port 25 blocking.** Most ISPs and cloud providers (AWS, GCP, Azure, and many VPS providers) block outbound port 25. Without it, your server can't deliver email to other servers directly.

4. **Maintenance burden.** Mail servers require constant attention: security updates, certificate renewals, monitoring bounce rates, managing queues, handling spam filtering for inbound mail, managing storage.

5. **Compliance.** Storing other people's email creates legal obligations (GDPR, data retention). Backups become critical — losing someone's email inbox is far worse than losing your Jellyfin watch history.

### When to Use an SMTP Relay (Most People)

| Factor | SMTP Relay | Self-Hosted Mail Server |
|--------|-----------|------------------------|
| Setup time | 15 minutes | Days to weeks |
| Deliverability | Excellent (provider manages reputation) | Poor initially, uncertain long-term |
| Maintenance | None | Ongoing |
| Cost | Free tier covers most self-hosters | Free (but your time isn't) |
| Port 25 required | No (uses 587/465) | Yes |
| Good for | Notifications, alerts, transactional email | Full email independence |

**Use a relay when:** You want your self-hosted apps to send notifications reliably. This is 95% of self-hosters.

**Self-host a mail server when:** You specifically want to own your entire email stack for privacy/independence reasons, and you understand the ongoing maintenance commitment. Even then, consider running Stalwart or Mailcow for receiving while using a relay for outbound delivery.

## Setting Up an SMTP Relay

Three solid relay services with free tiers that cover most self-hosting needs:

### Resend

Free tier: 100 emails/day, 3,000/month. Clean API, easy setup.

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain (they provide DNS records)
3. Generate an API key
4. SMTP credentials:

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASSWORD=re_YourApiKeyHere
SMTP_FROM=notifications@example.com
SMTP_SECURE=true
```

Resend uses your API key as the SMTP password. Port 465 with implicit TLS.

### Mailgun

Free tier: 100 emails/day for the first 3 months, then pay-as-you-go. Well-established, excellent deliverability.

1. Sign up at [mailgun.com](https://www.mailgun.com)
2. Add your domain and configure DNS records
3. Find SMTP credentials in Domain Settings

```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.example.com
SMTP_PASSWORD=your-mailgun-smtp-password
SMTP_FROM=notifications@example.com
SMTP_SECURE=starttls
```

Mailgun uses a subdomain by default (`mg.example.com`). You can use your root domain, but a subdomain keeps your primary domain's reputation separate.

### SMTP2GO

Free tier: 1,000 emails/month. Good support, detailed analytics.

1. Sign up at [smtp2go.com](https://www.smtp2go.com)
2. Verify your sender domain
3. Create SMTP credentials in Settings > SMTP Users

```
SMTP_HOST=mail.smtp2go.com
SMTP_PORT=587
SMTP_USER=your-smtp2go-username
SMTP_PASSWORD=your-smtp2go-password
SMTP_FROM=notifications@example.com
SMTP_SECURE=starttls
```

### Which Relay to Choose

**Resend** for simplicity and modern developer experience. **Mailgun** for battle-tested reliability and the best deliverability. **SMTP2GO** if you want the most generous free tier for a smaller setup. All three work fine — pick one and move on.

## Configuring Docker Apps to Send Email

Every Docker app handles SMTP configuration slightly differently, but the concept is the same: set environment variables or config values for host, port, username, password, and sender address.

### Nextcloud

In `docker-compose.yml`:

```yaml
services:
  nextcloud:
    image: nextcloud:29.0
    environment:
      - SMTP_HOST=smtp.resend.com
      - SMTP_SECURE=ssl
      - SMTP_PORT=465
      - SMTP_AUTHTYPE=LOGIN
      - SMTP_NAME=resend
      - SMTP_PASSWORD=re_YourApiKeyHere
      - MAIL_FROM_ADDRESS=nextcloud
      - MAIL_DOMAIN=example.com
    restart: unless-stopped
```

Nextcloud splits the sender address: `MAIL_FROM_ADDRESS` is the local part, `MAIL_DOMAIN` is the domain. Together they form `nextcloud@example.com`.

### Gitea / Forgejo

In `docker-compose.yml`:

```yaml
services:
  gitea:
    image: gitea/gitea:1.22
    environment:
      - GITEA__mailer__ENABLED=true
      - GITEA__mailer__PROTOCOL=smtps
      - GITEA__mailer__SMTP_ADDR=smtp.resend.com
      - GITEA__mailer__SMTP_PORT=465
      - GITEA__mailer__USER=resend
      - GITEA__mailer__PASSWD=re_YourApiKeyHere
      - GITEA__mailer__FROM=gitea@example.com
    restart: unless-stopped
```

Gitea uses `smtps` for port 465 (implicit TLS) and `smtp+starttls` for port 587. The double-underscore syntax (`GITEA__section__key`) maps to Gitea's `app.ini` configuration file ([Docker Environment Variables](/foundations/docker-environment-variables)).

### Uptime Kuma

Uptime Kuma configures SMTP through its web UI, not environment variables. After deployment:

1. Go to **Settings > Notifications**
2. Add a notification with type **Email (SMTP)**
3. Fill in:
   - **SMTP Host:** `smtp.resend.com`
   - **SMTP Port:** `465`
   - **SMTP Security:** TLS (465)
   - **SMTP Username:** `resend`
   - **SMTP Password:** your API key
   - **From Email:** `alerts@example.com`
   - **To Email:** your personal email

### Vaultwarden

```yaml
services:
  vaultwarden:
    image: vaultwarden/server:1.32.5
    environment:
      - SMTP_HOST=smtp.resend.com
      - SMTP_PORT=465
      - SMTP_SECURITY=force_tls
      - SMTP_USERNAME=resend
      - SMTP_PASSWORD=re_YourApiKeyHere
      - SMTP_FROM=vaultwarden@example.com
      - SMTP_FROM_NAME=Vaultwarden
    restart: unless-stopped
```

Vaultwarden uses `SMTP_SECURITY=force_tls` for port 465, `SMTP_SECURITY=starttls` for port 587, and `SMTP_SECURITY=off` for unencrypted (never use this in production).

### Authelia

```yaml
services:
  authelia:
    image: authelia/authelia:4.38
    # SMTP is configured in Authelia's configuration.yml, not env vars:
    # notifier:
    #   smtp:
    #     address: 'submissions://smtp.resend.com:465'
    #     username: 'resend'
    #     password: 're_YourApiKeyHere'
    #     sender: 'Authelia <auth@example.com>'
    restart: unless-stopped
```

Authelia configures SMTP in its `configuration.yml` file rather than environment variables. The `submissions://` scheme means SMTP with implicit TLS on port 465. Use `submission://` for STARTTLS on port 587.

### Generic Pattern

When configuring any Docker app for SMTP, look for these environment variables (naming varies):

```bash
# Common environment variable names across apps
SMTP_HOST / SMTP_SERVER / MAIL_HOST / EMAIL_HOST
SMTP_PORT / MAIL_PORT / EMAIL_PORT
SMTP_USER / SMTP_USERNAME / MAIL_USER / EMAIL_HOST_USER
SMTP_PASS / SMTP_PASSWORD / MAIL_PASSWORD / EMAIL_HOST_PASSWORD
SMTP_FROM / MAIL_FROM / EMAIL_FROM / DEFAULT_FROM_EMAIL
SMTP_SECURE / SMTP_ENCRYPTION / SMTP_TLS / EMAIL_USE_TLS
```

Check each app's documentation for the exact variable names. Getting a variable name wrong silently fails — the app starts fine but email never sends.

## Setting Up a Local Postfix Relay

If you prefer a single SMTP endpoint for all your containers instead of configuring each app individually, run Postfix as a relay container. All apps point to the Postfix container, and Postfix forwards to your external relay.

```yaml
services:
  postfix-relay:
    image: boky/postfix:v4.3.0
    environment:
      - RELAYHOST=smtp.resend.com:465
      - RELAYHOST_USERNAME=resend
      - RELAYHOST_PASSWORD=re_YourApiKeyHere
      - ALLOWED_SENDER_DOMAINS=example.com
      - TLS_SECURITY=encrypt
    networks:
      - mail
    restart: unless-stopped

networks:
  mail:
    name: mail
```

Then configure your apps to use the relay container:

```bash
SMTP_HOST=postfix-relay
SMTP_PORT=587
SMTP_USER=          # no auth needed for container-to-container
SMTP_PASSWORD=      # no auth needed for container-to-container
SMTP_SECURE=false   # TLS is handled by Postfix to the external relay
```

**Advantages of a local relay:**
- Configure external SMTP credentials in one place
- Apps don't need direct internet access for email
- Centralized email queue — if the relay is down temporarily, Postfix queues and retries
- Easier to switch relay providers (change one config, not every app)

**Disadvantage:** One more container to maintain. For 1-3 apps, configuring SMTP directly in each app is simpler. For 5+ apps, a local relay pays for itself.

## Testing Your Email Setup

After configuring SMTP, test it before assuming it works.

### From the Command Line

Install `swaks` (Swiss Army Knife for SMTP) on your server:

```bash
sudo apt install swaks
```

Test your relay:

```bash
swaks --to you@gmail.com \
      --from notifications@example.com \
      --server smtp.resend.com \
      --port 465 \
      --tls \
      --auth-user resend \
      --auth-password re_YourApiKeyHere \
      --header "Subject: SMTP Test" \
      --body "If you see this, SMTP is working."
```

### Check Email Headers

When the test email arrives, view its full headers (in Gmail: three dots > "Show original"). Look for:

- **SPF:** `PASS` — your relay's IP is authorized
- **DKIM:** `PASS` — signature verified
- **DMARC:** `PASS` — both SPF and DKIM align with your domain

If any show `FAIL`, check your DNS records. Use [MXToolbox](https://mxtoolbox.com/SuperTool.aspx) to verify your SPF, DKIM, and DMARC records are published correctly.

### From Inside Docker

Test that containers can reach your relay:

```bash
docker exec -it <container-name> sh -c \
  'echo "test" | nc -w 3 smtp.resend.com 465 && echo "Connection OK" || echo "Connection FAILED"'
```

For a local Postfix relay, test container-to-container connectivity:

```bash
docker exec -it <app-container> sh -c \
  'echo "test" | nc -w 3 postfix-relay 587 && echo "Connection OK" || echo "Connection FAILED"'
```

### App-Specific Test Functions

Most apps have a built-in "send test email" button in their admin settings. Always use it after configuring SMTP:

- **Nextcloud:** Settings > Basic settings > Email server > Send email
- **Gitea:** Site Administration > Configuration > check mailer settings
- **Vaultwarden:** Admin panel > SMTP Email Settings > Send Test Email
- **Uptime Kuma:** Notification settings > Test button

## Common Mistakes

### Using Port 25 Instead of 587/465

Port 25 is for server-to-server delivery, not for app-to-relay submission. Most ISPs and hosting providers block outbound port 25. Use port 587 (STARTTLS) or port 465 (implicit TLS) for your app-to-relay connection. Port 465 is the modern recommendation — fewer negotiation steps, encrypted from the start.

### Mismatched From Address and Domain

If your relay is configured for `example.com` but your app sends from `admin@otherdomain.com`, emails will fail SPF checks and likely land in spam — or get rejected outright. The "from" address domain must match a domain verified in your relay service.

### Multiple SPF Records

DNS allows only one SPF TXT record per domain. Adding a second one (e.g., when adding a new relay) causes both to fail. Combine all authorized senders into a single record:

```
# Wrong — two SPF records
"v=spf1 include:_spf.google.com ~all"
"v=spf1 include:_spf.resend.com ~all"

# Right — one combined record
"v=spf1 include:_spf.google.com include:_spf.resend.com ~all"
```

### Forgetting to Set TLS/Encryption

Leaving SMTP encryption off means credentials are sent in plain text. Always enable TLS. Use `ssl`/`tls`/`force_tls` for port 465, and `starttls` for port 587. The exact variable value depends on the app — some use `true`/`false`, others use `ssl`/`starttls`/`none`.

### Not Checking Spam Folders

Test emails often arrive in spam the first time, especially before DKIM and DMARC are set up. Always check spam during testing. If emails consistently land in spam after DNS records are verified, your sending domain may need warm-up time — send low volumes initially and gradually increase.

### Wrong Container Network

If using a local Postfix relay, apps must be on the same Docker network as the relay container. If an app can't connect to `postfix-relay:587`, check that both containers share a network ([Docker Networking](/foundations/docker-networking)).

## Next Steps

- Set up a specific app with email: [Nextcloud](/apps/nextcloud), [Gitea](/apps/gitea), [Vaultwarden](/apps/vaultwarden)
- Understand Docker networking for container-to-container communication: [Docker Networking](/foundations/docker-networking)
- Learn about managing secrets and credentials: [Docker Environment Variables](/foundations/docker-environment-variables)
- Secure your server and services: [Self-Hosting Security Checklist](/foundations/selfhosting-security-checklist)
- Understand SSL certificates for encrypted connections: [SSL Certificates Explained](/foundations/ssl-certificates)

## Related

- [DNS Explained for Self-Hosting](/foundations/dns-explained) — understanding MX, TXT, and other DNS records
- [Docker Environment Variables](/foundations/docker-environment-variables) — managing SMTP credentials in Docker
- [SSL Certificates Explained](/foundations/ssl-certificates) — TLS encryption for SMTP and beyond
- [Ports Explained](/foundations/ports-explained) — understanding ports 25, 465, and 587
- [Self-Hosting Security Checklist](/foundations/selfhosting-security-checklist) — securing your server and services
- [Docker Networking](/foundations/docker-networking) — container-to-container communication for local relays
- [Docker Compose Basics](/foundations/docker-compose-basics) — foundational Docker knowledge

## FAQ

### Do I need to run my own mail server to send email from self-hosted apps?

No. An SMTP relay service (Resend, Mailgun, SMTP2GO) handles outbound delivery with better reliability than a self-hosted mail server. You only need your own mail server if you want to receive email at your domain without using a third-party provider. For notifications and alerts, a relay is the right choice.

### Is port 465 or 587 better for SMTP?

Port 465 (implicit TLS) is the modern recommendation. It establishes an encrypted connection immediately, whereas port 587 starts unencrypted and upgrades via STARTTLS — adding a negotiation step that can fail or be intercepted. Both work, but prefer 465 when your app and relay support it.

### Will my self-hosted app emails land in spam?

Not if you configure DNS correctly. Set up SPF, DKIM, and DMARC records as provided by your relay service. Use a verified domain (not a free email address). Start with low volume. If you use an established relay service with good IP reputation, deliverability is excellent out of the box.

### Can I use Gmail's SMTP server as a relay?

Technically yes — Gmail allows SMTP access with app passwords. But Google limits you to 500 emails/day, throttles aggressively, and may lock your account for automated sending. A dedicated relay service is free for the volumes most self-hosters need and doesn't risk your personal email account.

### How many emails can I send on relay free tiers?

Resend: 100/day, 3,000/month. Mailgun: 100/day for 3 months. SMTP2GO: 1,000/month. For a typical self-hosting setup with a few apps sending notifications, these free tiers are more than enough. A busy Gitea instance with 5-10 active users might send 20-50 emails per day.
