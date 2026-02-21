---
title: "Self-Hosted Email Server Guide"
description: "A practical self-hosted email server guide covering protocols, DNS records, deliverability, and which solution to pick if you decide to run your own mail."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "foundations"
apps: ["mailcow", "mailu", "stalwart", "mail-in-a-box"]
tags: ["email", "foundations", "smtp", "self-hosted", "dns"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Should You Self-Host Email?

Probably not. Running your own self-hosted email server is one of the most complex, high-stakes services you can operate. Unlike a media server or wiki where downtime is an inconvenience, a broken email server means missed invoices, lost password resets, and messages silently vanishing into spam folders. Big providers like Gmail and Outlook actively distrust small mail servers, and clawing your way onto their good side takes weeks of careful reputation building.

That said, there are legitimate reasons to do it: full control over your data, no provider scanning your messages, custom domains without per-user fees, and the satisfaction of owning your entire communication stack. If those reasons matter enough to you, this guide covers everything you need to understand before you start.

The honest assessment: self-hosted email is a 7/10 difficulty project that requires ongoing maintenance forever. A Jellyfin server you can set up and forget. An email server you cannot.

## Prerequisites

Before you even consider running a mail server, verify all of these:

### Static IP Address

Your mail server needs a static, public IPv4 address. Most residential ISPs assign dynamic IPs, which are almost universally blocklisted by major email providers. A VPS from Hetzner, OVH, or Linode is the typical approach. Check your prospective IP against blocklists before committing — some VPS IP ranges are pre-blocklisted due to previous abuse.

```bash
# Check if an IP is on major blocklists
# Use mxtoolbox.com/blacklists.aspx or run:
dig +short <your-ip>.zen.spamhaus.org
# If it returns 127.0.0.x, the IP is listed
```

### Reverse DNS (rDNS/PTR Record)

Your server's IP must have a PTR record that resolves back to your mail server's hostname. Most VPS providers let you set this in their control panel. Without rDNS, Gmail and others will reject your mail outright.

```
IP: 203.0.113.10
PTR record: mail.example.com
A record: mail.example.com → 203.0.113.10
```

Both directions must match. This is non-negotiable.

### Port 25 Not Blocked

Many cloud providers (AWS, Azure, GCP, Oracle Cloud) block outbound port 25 by default to prevent spam. Hetzner, OVH, and most traditional VPS providers leave it open. Verify before purchasing:

```bash
telnet smtp.gmail.com 25
# If you get "Connected", port 25 is open
# If it hangs or times out, your provider is blocking it
```

If port 25 is blocked and you cannot get it unblocked, you will need an outbound SMTP relay regardless, which is actually the recommended approach anyway.

### Domain Name with Full DNS Control

You need a domain where you can create MX, TXT, CNAME, and A records. Cloudflare, Route 53, or your registrar's DNS panel all work. See [DNS Explained](/foundations/dns-explained/) for a primer on DNS management.

### TLS Certificates

Your mail server needs valid TLS certificates for encrypting connections. Let's Encrypt works perfectly. Most self-hosted email solutions handle certificate provisioning automatically, but you should understand how [SSL certificates](/foundations/ssl-certificates/) work before troubleshooting issues.

## Email Protocol Stack

Email uses three core protocols. Understanding what each does saves hours of debugging.

### SMTP (Simple Mail Transfer Protocol) — Port 25, 465, 587

SMTP handles sending and relaying mail between servers. It is the only protocol used for server-to-server communication.

- **Port 25** — Server-to-server delivery (MTA to MTA). This is what other mail servers connect to when delivering mail to you.
- **Port 465** — SMTP over implicit TLS (SMTPS). Used by mail clients for submission.
- **Port 587** — SMTP with STARTTLS (submission port). The standard port for authenticated mail clients to send through your server.

Your server needs port 25 open inbound (to receive mail) and either 465 or 587 for your mail clients to send through it.

### IMAP (Internet Message Access Protocol) — Port 993

IMAP lets mail clients read messages stored on the server. Messages stay on the server and sync across devices. This is what you want for multi-device access — your phone, laptop, and webmail all see the same inbox state.

- **Port 993** — IMAP over TLS (the only port you should expose)
- **Port 143** — IMAP with STARTTLS (legacy, avoid if possible)

### POP3 (Post Office Protocol) — Port 995

POP3 downloads messages from the server to a single client, typically deleting them from the server afterward. It is a legacy protocol. Use IMAP instead unless you have a specific reason not to.

- **Port 995** — POP3 over TLS
- **Port 110** — POP3 with STARTTLS (legacy)

### How They Work Together

```
Sender's client → SMTP (587) → Sender's server → SMTP (25) → Your server
                                                                   ↓
                                                              IMAP (993) → Your client
```

For more on how SMTP fits together, see [SMTP and Email Basics](/foundations/smtp-email-basics/).

## DNS Records You Need

Email relies heavily on DNS. You need at minimum four types of records, and all of them must be correct or your mail will land in spam or get rejected.

### MX Record

The MX (Mail Exchange) record tells other servers where to deliver mail for your domain.

```
example.com.    IN  MX  10  mail.example.com.
mail.example.com.  IN  A  203.0.113.10
```

The `10` is the priority (lower = preferred). If you have a single server, the number does not matter. The MX record must point to a hostname with an A record — never directly to an IP.

### SPF (Sender Policy Framework)

SPF is a TXT record that declares which servers are authorized to send email for your domain. Receiving servers check this to detect spoofing.

```
example.com.  IN  TXT  "v=spf1 mx a:mail.example.com -all"
```

- `mx` — allow servers listed in your MX records
- `a:mail.example.com` — also allow this specific hostname
- `-all` — reject everything else (hard fail; use `~all` for soft fail during testing)

If you use an outbound relay like Amazon SES, include their SPF in yours:

```
"v=spf1 mx include:amazonses.com -all"
```

### DKIM (DomainKeys Identified Mail)

DKIM adds a cryptographic signature to every outgoing message. The receiving server verifies the signature against a public key published in your DNS. This proves the message was not modified in transit and actually came from your server.

Your mail server generates a keypair during setup. You publish the public key as a DNS TXT record:

```
default._domainkey.example.com.  IN  TXT  "v=DKIM1; k=rsa; p=MIIBIjANBgkq..."
```

The selector (`default` in this example) varies by mail server. Mailcow uses `dkim`, Mailu uses `dkim`, Stalwart is configurable. Your mail server's setup guide will tell you the exact record to create.

### DMARC (Domain-based Message Authentication, Reporting and Conformance)

DMARC ties SPF and DKIM together and tells receiving servers what to do when checks fail. It also enables reporting so you can see who is sending mail as your domain.

```
_dmarc.example.com.  IN  TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com; pct=100"
```

- `p=quarantine` — send failing messages to spam (use `p=none` during testing, work up to `p=reject`)
- `rua=mailto:...` — receive aggregate reports about authentication results
- `pct=100` — apply the policy to 100% of messages

Start with `p=none` to monitor, move to `p=quarantine` after a week of clean reports, then `p=reject` once confident.

### Complete DNS Example

```
; A record for mail server
mail.example.com.           IN  A      203.0.113.10

; MX record
example.com.                IN  MX     10 mail.example.com.

; SPF
example.com.                IN  TXT    "v=spf1 mx -all"

; DKIM (public key from your mail server)
dkim._domainkey.example.com. IN TXT    "v=DKIM1; k=rsa; p=MIIBIjANBgkq..."

; DMARC
_dmarc.example.com.         IN  TXT    "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"

; Reverse DNS (set via your VPS provider, not DNS panel)
; 10.113.0.203.in-addr.arpa.  IN PTR  mail.example.com.
```

## Deliverability Challenges

This is where self-hosted email gets genuinely hard. Sending mail that actually reaches inboxes — not spam folders — is an ongoing battle.

### IP Reputation

Every IP address has a reputation score with major email providers. A brand new IP has no reputation, which is almost as bad as a bad reputation. Gmail, Outlook, and Yahoo will be suspicious of mail from unknown IPs.

**IP warming** is the process of gradually increasing your sending volume over 2-4 weeks so providers learn to trust your IP. Send a few emails per day to start, increase slowly. If you blast 500 emails from a fresh IP on day one, you will get blocklisted.

### Blocklists

Dozens of organizations maintain blocklists (DNSBLs) of IPs known to send spam. If your IP appears on Spamhaus, Barracuda, or other major lists, most providers will reject your mail. Common causes:

- Your VPS IP was previously used by a spammer
- You sent too much mail too fast from a new IP
- A compromised account on your server sent spam
- Your server is an open relay (misconfigured to forward anyone's mail)

Check your IP regularly:

```bash
# Quick check against Spamhaus
dig +short <your-ip-reversed>.zen.spamhaus.org

# Or use web tools:
# https://mxtoolbox.com/blacklists.aspx
# https://www.spamhaus.org/lookup/
```

### Provider-Specific Quirks

- **Gmail** — Aggressively filters unknown senders. Requires SPF, DKIM, and DMARC to pass. Takes weeks to build trust even with perfect setup.
- **Outlook/Hotmail** — Uses its own reputation system (SNDS). Even with perfect DNS, you may need to apply to their Junk Mail Reporting Program to get consistent inbox delivery.
- **Yahoo** — Requires DMARC alignment. Less aggressive than Gmail but still strict.

### The Uncomfortable Truth

Large providers have a financial incentive to distrust small mail servers. They process billions of messages daily, and most independent mail servers they encounter are either compromised or spam sources. Your perfectly configured server is a rounding error in their abuse stats. This is not paranoia — it is the structural reality of email in 2026.

## Self-Hosted Email Solutions Compared

If you have read everything above and still want to proceed, here are the main options.

| Feature | Mailcow | Mailu | Stalwart | Mail-in-a-Box |
|---------|---------|-------|----------|---------------|
| Webmail | SOGo | Roundcube | Webmail built-in | Roundcube |
| Admin UI | Full-featured | Good | Basic web UI | Minimal |
| Antispam | Rspamd | Rspamd | Built-in | Spamassassin |
| Antivirus | ClamAV (optional) | ClamAV (optional) | No | ClamAV |
| DKIM setup | Automatic | Automatic | Automatic | Automatic |
| Docker-based | Yes | Yes | Yes (or native) | No (full VM) |
| RAM usage | ~2-3 GB | ~1-2 GB | ~200-500 MB | ~1-2 GB |
| Language | PHP/Python/Lua | Python | Rust | Python/Bash |
| Active development | Very active | Active | Very active | Moderate |
| Complexity | Medium-high | Medium | Low-medium | Low |

### Mailcow — Best Full-Featured Option

[Mailcow](https://mailcow.email/) is the most complete self-hosted email suite. It bundles Postfix, Dovecot, SOGo webmail, Rspamd, ClamAV, and a polished admin UI into a Docker Compose stack. If you want every feature and do not mind the resource usage, Mailcow is the pick.

**Use Mailcow if:** You want a full-featured mail server with good admin tools, multiple domains, and per-user settings. You have at least 4 GB RAM to spare.

### Stalwart — Best Modern/Lightweight Option

[Stalwart](https://stalw.art/) is written in Rust and combines SMTP, IMAP, and JMAP into a single binary. It is dramatically lighter on resources than traditional mail stacks and actively developed with modern protocol support (JMAP is a faster, JSON-based alternative to IMAP).

**Use Stalwart if:** You want a lightweight, modern mail server with low resource overhead. You are comfortable with a newer project that has a smaller community.

### Mailu — Good Middle Ground

[Mailu](https://mailu.io/) is a Docker-based mail suite that is simpler to configure than Mailcow but has fewer features. Good documentation, straightforward setup wizard.

**Use Mailu if:** You want something simpler than Mailcow and do not need SOGo's groupware features.

### Mail-in-a-Box — Easiest but Least Flexible

[Mail-in-a-Box](https://mailinabox.email/) takes over an entire Ubuntu server and configures everything automatically. You get a working mail server in 10 minutes. The tradeoff: it expects to own the entire machine, does not use Docker, and is harder to customize.

**Use Mail-in-a-Box if:** You want the fastest path to a working mail server and will dedicate a VPS to it.

## The Hybrid Approach (Recommended)

Here is the approach that actually works for most self-hosters: **self-host receiving, relay outbound through a dedicated SMTP provider.**

### Why Hybrid?

- **Inbound** is straightforward. Set your MX record, configure your server, done. Other servers deliver to you without caring about your IP reputation.
- **Outbound** is where deliverability nightmares live. SMTP relay providers (Amazon SES, Postmark, Mailgun, Brevo) have spent years building IP reputation, maintaining relationships with major providers, and handling blocklist issues. Their job is getting mail delivered.

### How It Works

```
Incoming: Internet → Your MX → Your mail server → Your IMAP → Your client
Outgoing: Your client → Your SMTP → Relay provider → Internet
```

Your mail server handles storage, user management, spam filtering, and IMAP access. Outbound mail routes through the relay's SMTP servers using their trusted IPs.

### Relay Provider Comparison

| Provider | Free Tier | Cost After | Notes |
|----------|-----------|------------|-------|
| Amazon SES | 3,000 msgs/month (with EC2) | $0.10/1,000 | Cheapest at scale. Setup is more involved. |
| Postmark | 100 msgs/month | $1.25/1,000 | Excellent deliverability. Simple API. |
| Brevo (Sendinblue) | 300 msgs/day | Plans from $9/month | Good free tier for personal use. |
| Mailgun | 1,000 msgs/month (trial) | $0.80/1,000 | Solid API. |

For personal email (under 100 messages/day), Brevo's free tier or Amazon SES on a low-cost VPS covers you indefinitely.

### Configuration

Every self-hosted mail solution supports outbound relay. The configuration looks roughly like this (varies by software):

```
# Generic relay configuration concept
# In your mail server's admin UI or config file:
Relay host: smtp.relay-provider.com
Relay port: 587
Relay username: your-api-key-or-username
Relay password: your-api-secret
Use TLS: yes
```

In Mailcow, this is under System → Configuration → Routing. In Mailu, set `RELAYHOST` in your `mailu.env`. In Stalwart, configure it in the SMTP outbound settings.

## Testing Your Setup

Before sending any real email, verify your configuration end-to-end.

### Mail-Tester

[mail-tester.com](https://www.mail-tester.com/) gives you a temporary address. Send an email to it, then check your score. Aim for 9/10 or higher. It checks SPF, DKIM, DMARC, content quality, and blocklist status. Three free tests per day.

### MXToolbox

[MXToolbox](https://mxtoolbox.com/) provides individual checks:

- **MX Lookup** — verify your MX record is correct
- **SMTP Test** — verify your server responds on port 25
- **SPF Check** — validate your SPF record syntax
- **DKIM Check** — verify your DKIM public key is published
- **DMARC Check** — validate your DMARC record
- **Blacklist Check** — scan your IP against 100+ blocklists

### Send Test Emails

After automated checks pass, send real test emails to:

1. A Gmail address — check if it lands in inbox or spam
2. An Outlook/Hotmail address — same check
3. A Yahoo address — same check

Open the received message, view the original/headers, and verify:

```
Authentication-Results:
  spf=pass
  dkim=pass
  dmarc=pass
```

All three must show `pass`. If any show `fail` or `none`, fix the issue before using the server for real mail.

## Common Mistakes

### Using a Residential IP

Residential IP ranges are on permanent blocklists at most providers. Even with perfect DNS configuration, your mail will land in spam or get rejected. Use a VPS with a clean IP.

### Skipping rDNS

No PTR record is an instant reject at Gmail and most corporate mail servers. Set it up before anything else.

### Starting with `p=reject` in DMARC

Start with `p=none` for at least a week to collect reports and verify nothing legitimate is failing authentication. Moving to `reject` too early will bounce legitimate mail from your domain if any configuration is wrong.

### Running an Open Relay

If your SMTP server accepts and forwards mail from unauthenticated senders, it is an open relay. Spammers will find it within hours and abuse it. Your IP will be blocklisted within a day. Every mail server solution listed above is secure by default, but double-check: only authenticated users should be able to send outbound mail through your server.

### Ignoring Monitoring

Email servers need ongoing attention. Set up monitoring for:

- Mail queue length (a growing queue means delivery problems)
- Disk space (mail storage fills up)
- Blocklist status (check weekly at minimum)
- TLS certificate expiration
- Authentication failure logs (brute-force attempts are constant)

### Not Having Backups

Email is often irreplaceable data. Back up your mail storage volumes and your configuration regularly. See [Backup Strategy](/foundations/backup-3-2-1-rule/) for the fundamentals.

## FAQ

### Is self-hosted email worth it?

For most people, no. The time investment in setup, maintenance, and deliverability management far exceeds the cost of a privacy-respecting paid provider like Fastmail ($5/month) or Migadu ($9/month for multiple domains). Self-hosted email is worth it if you have specific compliance requirements, need full data sovereignty, or enjoy the challenge and accept the ongoing maintenance burden.

### Can I self-host email at home?

Technically yes, but practically it is very difficult. Most residential ISPs block port 25, assign dynamic IPs, and their IP ranges are universally blocklisted. A $5/month VPS is the minimum viable approach. See [VPS vs Home Server](/foundations/vps-vs-home-server/) for a detailed comparison.

### How much RAM does a self-hosted email server need?

It depends on the solution. Stalwart runs comfortably in 512 MB. Mailu needs about 1-2 GB. Mailcow with ClamAV antivirus scanning wants 3-4 GB. Mail-in-a-Box recommends 1 GB minimum but works better with 2 GB. For personal use with a handful of accounts, a 2 GB VPS covers all options except Mailcow with antivirus.

### Will Gmail accept my self-hosted email?

Eventually, with correct configuration. You need valid SPF, DKIM, and DMARC records, a clean IP with rDNS, and patience for IP warming. Using an outbound relay provider like Amazon SES or Postmark bypasses the IP reputation problem entirely, which is why the hybrid approach is recommended.

### Can I migrate from Gmail to a self-hosted server?

Yes. Most mail clients support IMAP-to-IMAP migration. Tools like `imapsync` can copy your entire Gmail mailbox to your self-hosted server, preserving folder structure and read/unread status. Export your contacts separately using Google Takeout. The migration itself is the easy part — maintaining deliverability afterward is the real challenge.

## Related

- [DNS Explained](/foundations/dns-explained/)
- [SMTP and Email Basics](/foundations/smtp-email-basics/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [SSL Certificates Explained](/foundations/ssl-certificates/)
- [Security Hardening](/foundations/security-hardening/)
- [VPS vs Home Server](/foundations/vps-vs-home-server/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
