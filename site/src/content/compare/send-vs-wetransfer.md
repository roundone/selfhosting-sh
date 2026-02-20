---
title: "Send vs WeTransfer: Self-Hosted File Sharing"
description: "Self-hosted Send vs WeTransfer compared — why hosting your own encrypted file sharing beats paying for cloud transfer services."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "file-sharing"
apps:
  - send
tags:
  - comparison
  - send
  - wetransfer
  - self-hosted
  - file-sharing
  - file-transfer
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Send gives you everything WeTransfer does — upload, get a link, share it — plus end-to-end encryption, configurable expiry, download limits, and no file size restrictions beyond your own server storage. All for the cost of a $5/month VPS instead of $12/month for WeTransfer Pro. If you self-host anything, self-host your file transfers.

## Overview

[WeTransfer](https://wetransfer.com/) is a popular cloud file transfer service. Free tier allows files up to 2 GB with 7-day expiry. Pro costs $12/month for 200 GB transfers and password protection. Your files sit on WeTransfer's servers, unencrypted on their end.

[Send](https://github.com/timvisee/send) is a self-hosted fork of Firefox Send (discontinued by Mozilla in 2020). Upload a file through the web UI, get an encrypted link with configurable download limits and expiry. Files are end-to-end encrypted in the browser before upload — the server only stores encrypted blobs.

## Feature Comparison

| Feature | Send (Self-Hosted) | WeTransfer Free | WeTransfer Pro ($12/mo) |
|---------|-------------------|----------------|------------------------|
| Max file size | Your server's disk | 2 GB | 200 GB |
| End-to-end encryption | Yes (AES-GCM, browser-side) | No | No |
| Password protection | Yes (built-in) | No | Yes |
| Download limit | Yes (configurable) | N/A | N/A |
| Expiry time | Configurable (5 min to 7 days) | 7 days fixed | 7 days (customizable) |
| Custom branding | Yes (env vars) | No | Yes |
| Data ownership | Full (your server) | WeTransfer's servers | WeTransfer's servers |
| Account required (sender) | No | No | Yes |
| Account required (recipient) | No | No | No |
| Transfer tracking | Download count only | Email notification | Email notification |
| API | No (web UI only) | No | API (paid) |
| Mobile app | Browser (responsive) | iOS/Android | iOS/Android |
| Ads | None | Yes (full-screen) | None |
| Cost | VPS cost (~$5/month) | Free | $12/month |
| Monthly cost at scale | Same $5/month | Same free | Scales with storage |

## Cost Comparison

| Usage Level | WeTransfer | Send (Self-Hosted) |
|------------|-----------|-------------------|
| Occasional (< 2 GB files) | Free (with ads) | $5/month VPS |
| Regular (password protection needed) | $12/month Pro | $5/month VPS |
| Heavy (large files, team use) | $12/month Pro (200 GB limit) | $5-10/month VPS (unlimited) |
| Annual cost (Pro equivalent) | $144/year | $60/year |

Self-hosting pays for itself if you need password protection or handle files larger than 2 GB. The VPS also runs your other self-hosted services.

## Security and Privacy

This is where Send wins decisively.

**WeTransfer:** Files are uploaded unencrypted (HTTPS protects transit, not storage). WeTransfer stores your files in the clear on their servers. Their privacy policy allows data processing for service improvement. Law enforcement can access your files with a valid request.

**Send:** Files are encrypted in your browser using AES-GCM before upload. The encryption key is part of the URL fragment (after the #), which browsers never send to the server. Your server stores only encrypted blobs it cannot decrypt. Even if your server is compromised, the files are unreadable without the URL.

| Security Aspect | Send | WeTransfer |
|----------------|------|------------|
| Encryption at rest | Yes (AES-GCM, client-side) | No |
| Encryption in transit | Yes (HTTPS) | Yes (HTTPS) |
| Server can read files | No | Yes |
| Zero-knowledge design | Yes | No |
| Operator access | Cannot decrypt | Full access |
| Compliance with subpoena | Encrypted blobs only | Full file access |

## Installation Complexity

WeTransfer: sign up and use. Zero setup.

Send: deploy two containers (app + Redis), configure `BASE_URL` and upload limits, point a domain at it. The Docker Compose is straightforward:

```yaml
services:
  send:
    image: registry.gitlab.com/timvisee/send:v3.4.27
    environment:
      - NODE_ENV=production
      - BASE_URL=https://send.example.com
      - REDIS_HOST=redis
      - MAX_FILE_SIZE=5368709120
    volumes:
      - ./uploads:/uploads
    ports:
      - "1443:1443"
    restart: unless-stopped
    depends_on:
      - redis
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

Budget 15-20 minutes for first-time setup including DNS and reverse proxy.

**Winner: WeTransfer** for zero setup. But Send's setup is trivial for anyone who self-hosts.

## Use Cases

### Choose Send If...

- End-to-end encryption matters (sensitive documents, business files)
- You want full control over your data and transfer infrastructure
- You transfer files larger than 2 GB regularly
- You're already running a VPS for other services
- You don't want ads on your file sharing page
- Custom branding and domain matter (send.yourdomain.com)

### Choose WeTransfer If...

- You need a mobile app with native experience
- You share files rarely and don't want to maintain infrastructure
- Transfer tracking with email notifications is important
- You're a non-technical user who needs file sharing to "just work"
- You don't handle sensitive or confidential files

## Final Verdict

**Self-host Send if you value privacy, save money, or handle sensitive files.** End-to-end encryption, no file size limits, no ads, custom domain, configurable expiry — all for less than the cost of WeTransfer Pro. The setup is trivial.

**WeTransfer still makes sense for non-technical users** who transfer files occasionally and don't care about encryption. The free tier works for small files, and the mobile apps are polished. But if you're reading this site, you can self-host Send in under 20 minutes and never look back.

## Frequently Asked Questions

### Can recipients download Send files on mobile?
Yes. Send's web UI is responsive and works on all mobile browsers. There's no native app, but the browser experience is clean.

### What happens if my Send server goes down?
Files are temporarily unavailable until the server comes back up. No data is lost — files persist on disk. This is the trade-off of self-hosting vs. WeTransfer's managed infrastructure.

### Can I use Send for team file sharing?
Yes, but Send is designed for one-off transfers, not permanent file storage. For team file sharing with persistent access, consider [Nextcloud](/apps/nextcloud) or [Seafile](/apps/seafile).

### How much disk space does Send need?
Depends on your upload limits and expiry settings. With a 5 GB max file size and 24-hour default expiry, you'll rarely need more than 20-50 GB. Set `MAX_FILE_SIZE` and `MAX_EXPIRE_SECONDS` to control this.

## Related

- [How to Self-Host Send](/apps/send)
- [PairDrop vs Send](/compare/pairdrop-vs-send)
- [Self-Hosted Alternatives to WeTransfer](/replace/wetransfer)
- [Self-Hosted Alternatives to AirDrop](/replace/airdrop)
- [Best Self-Hosted File Sharing Tools](/best/file-sharing)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
