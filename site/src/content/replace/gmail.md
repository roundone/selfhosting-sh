---
title: "Self-Hosted Alternatives to Gmail"
description: "Best self-hosted email server alternatives to Gmail with full setup guides, cost comparison, and migration tips."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "email"
apps:
  - mailu
  - mailcow
tags:
  - alternative
  - gmail
  - email
  - self-hosted
  - replace
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Replace Gmail?

Gmail scans your emails to build an advertising profile. Google has access to every message, attachment, and contact. They've shut down products before (Google Reader, Inbox, Hangouts) — Gmail could change terms at any time. And if Google locks your account, you lose access to everything.

**The cost argument:** Gmail is "free" but you pay with your data. Google Workspace costs $6-18/user/month. A self-hosted email server costs $5-10/month for the VPS regardless of user count.

**The privacy argument:** Every email you send and receive through Gmail is processed by Google. Self-hosted email means your messages live on hardware you control.

**The control argument:** Google can disable your account for alleged ToS violations with minimal recourse. Self-hosted email can't be taken from you.

**The honest caveat:** Self-hosted email is the hardest self-hosting project. Deliverability requires proper DNS records, IP reputation management, and ongoing maintenance. It's worth it for privacy-conscious users, but don't underestimate the commitment.

## Best Alternatives

### Mailcow — Best Overall Replacement

Mailcow is a full-featured email server stack with a modern web UI, CalDAV/CardDAV via SOGo, two-factor authentication, and comprehensive admin tools. It's the closest thing to a self-hosted Gmail — email, calendar, contacts, and webmail all in one package.

**Strengths:**
- SOGo groupware (calendar, contacts, ActiveSync)
- Modern admin UI with per-domain and per-user management
- Built-in antispam (rspamd), antivirus (ClamAV optional), and DKIM
- Active development and strong community
- Built-in backup and update scripts

**Weaknesses:**
- Requires 6+ GB RAM (with ClamAV)
- x86_64 only — no ARM support
- Complex stack (15+ containers)

[Read our full guide: How to Self-Host Mailcow](/apps/mailcow)

### Mailu — Best Lightweight Alternative

Mailu is a simpler email server that's easier to set up and uses fewer resources. It lacks SOGo's groupware features but covers email, webmail, and antispam well. The setup wizard at setup.mailu.io generates your Docker Compose configuration automatically.

**Strengths:**
- Lower resource usage (~1.5-2 GB RAM without ClamAV)
- ARM64 support (runs on Raspberry Pi 4)
- Setup wizard generates your configuration
- Simpler architecture (6-8 containers vs 15+)

**Weaknesses:**
- No built-in CalDAV/CardDAV (use Radicale separately)
- Less feature-rich admin UI than Mailcow
- Smaller community

[Read our full guide: How to Self-Host Mailu](/apps/mailu)

### Stalwart — Best Modern Option

Stalwart Mail Server is a newer, Rust-based email server that aims to be a complete email solution in a single binary. It supports JMAP (modern email API), IMAP, SMTP, and includes built-in spam filtering.

**Strengths:**
- Single binary / single container
- Very low resource usage
- JMAP support (modern email protocol)
- Built-in spam filter and DKIM

**Weaknesses:**
- Newer project, smaller community
- Less documentation than Mailcow/Mailu
- No built-in webmail (use Roundcube or SnappyMail)

## Migration Guide

### Exporting from Gmail

1. Go to [Google Takeout](https://takeout.google.com)
2. Select **Mail** → choose MBOX format
3. Download the export (may take hours for large mailboxes)
4. The export includes all labels as folders

### Importing to Your Server

**Mailcow:**
```bash
# Use imapsync to migrate mailboxes
docker run --rm gilleslamiral/imapsync \
  --host1 imap.gmail.com --user1 you@gmail.com --password1 'app-password' --ssl1 \
  --host2 mail.yourdomain.com --user2 you@yourdomain.com --password2 'password' --ssl2
```

**Mailu:**
The same imapsync command works. Run it after creating your user account in Mailu's admin panel.

### DNS Records Required

| Record | Type | Purpose |
|--------|------|---------|
| `mail.yourdomain.com` | A | Points to your mail server |
| `yourdomain.com` | MX | Directs email to your server |
| `yourdomain.com` | TXT (SPF) | Authorizes your server to send email |
| `mail._domainkey.yourdomain.com` | TXT (DKIM) | Email signature verification |
| `_dmarc.yourdomain.com` | TXT (DMARC) | Email authentication policy |
| `mail.yourdomain.com` | PTR | Reverse DNS (set via hosting provider) |

### Transition Strategy

1. Set up your mail server and verify it works (send/receive test emails)
2. Configure SPF, DKIM, and DMARC DNS records
3. Wait 48 hours for DNS propagation
4. Test deliverability: send to Gmail, Outlook, Yahoo — check spam folders
5. Update your MX record to point to your server
6. Set up Gmail forwarding as a safety net during transition
7. After 2 weeks of stable operation, remove Gmail forwarding

## Cost Comparison

| | Gmail (Free) | Gmail (Workspace) | Self-Hosted |
|---|-------------|-------------------|-------------|
| Monthly cost | $0 | $6-18/user | $5-10/month (VPS) |
| Annual cost (1 user) | $0 | $72-216 | $60-120 |
| Annual cost (5 users) | $0 | $360-1,080 | $60-120 |
| Storage | 15 GB shared | 30 GB-5 TB | Unlimited (your disk) |
| Privacy | Google reads emails | Google reads emails | Full control |
| Deliverability | Excellent | Excellent | Requires maintenance |
| Uptime | 99.9%+ | 99.9%+ SLA | Depends on you |
| Calendar + Contacts | Yes | Yes | Mailcow: Yes, Mailu: separate |

## What You Give Up

**Deliverability headaches.** Gmail's IP reputation is perfect. Your VPS IP starts with zero reputation. You must build it over weeks/months. Some providers (Outlook, Yahoo) may initially filter your emails to spam.

**Google ecosystem integration.** Gmail ties into Google Calendar, Google Meet, Google Drive seamlessly. Self-hosted email requires separate solutions for each.

**Spam filtering quality.** Gmail's spam filter is industry-leading. rspamd and SpamAssassin are good but not as accurate without massive training data.

**Mobile push notifications.** Gmail apps push instantly. IMAP push (IDLE) works but is less reliable than Gmail's push.

**Zero maintenance.** Gmail just works. Self-hosted email requires monitoring, certificate renewals, disk management, and security updates.

**Honest recommendation:** Self-hosting email is rewarding but demanding. If you just want privacy, consider Proton Mail or Fastmail as a middle ground. Self-host email only if you're committed to the maintenance.

## FAQ

### Is self-hosted email reliable enough for business?

For a small business with 5-10 users, yes — if you're willing to maintain it. For a business with 50+ users or strict SLA requirements, use a privacy-respecting hosted service like Proton Mail or Fastmail.

### Will my emails go to spam?

Initially, possibly. New mail server IPs have no reputation. Follow the DNS setup precisely (SPF, DKIM, DMARC), send a moderate volume initially, and reputation builds over 2-4 weeks. Use mail-tester.com to check your score.

### Can I keep using the Gmail app?

Yes. The Gmail app supports IMAP accounts. Add your self-hosted email as an IMAP account in the Gmail app's settings.

## Related

- [How to Self-Host Mailcow](/apps/mailcow)
- [How to Self-Host Mailu](/apps/mailu)
- [Mailu vs Mailcow](/compare/mailu-vs-mailcow)
- [Best Self-Hosted Email Servers](/best/email)
- [SMTP and Email Basics](/foundations/smtp-email-basics)
