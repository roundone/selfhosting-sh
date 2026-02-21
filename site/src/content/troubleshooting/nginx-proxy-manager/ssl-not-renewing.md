---
title: "Nginx Proxy Manager: SSL Not Renewing — Fix"
description: "Resolve Let's Encrypt SSL certificates failing to renew in Nginx Proxy Manager due to port or DNS issues."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy"
apps:
  - nginx-proxy-manager
tags:
  - troubleshooting
  - nginx-proxy-manager
  - ssl
  - lets-encrypt
  - renewal
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## The Problem

SSL certificates in Nginx Proxy Manager show as expired or expiring soon. The automatic renewal process has failed. Accessing your site shows browser security warnings about an invalid certificate.

## The Cause

Let's Encrypt certificates are valid for 90 days and NPM auto-renews them at ~60 days. Renewal fails when:

1. **Port 80 is blocked** — HTTP-01 challenge requires port 80 open from the internet
2. **DNS has changed** — the domain no longer points to your server's IP
3. **Certificate storage is corrupted** — the `/etc/letsencrypt` volume has permission issues
4. **NPM can't reach Let's Encrypt** — outbound HTTPS to `acme-v02.api.letsencrypt.org` is blocked
5. **Rate limits hit** — too many failed attempts (5 failures per hour per account)

## The Fix

### Method 1: Force Manual Renewal

In the NPM admin UI:

1. Go to **SSL Certificates**
2. Click the three-dot menu on the failing certificate
3. Click **Renew Now**
4. Check the output for specific error messages

### Method 2: Verify Port 80 Is Open

From an external machine (not your server), test:

```bash
curl -I http://your-domain.com
```

If this times out, port 80 is blocked. Check your firewall, router port forwarding, and cloud provider security groups. Port 80 must reach NPM's container.

### Method 3: Switch to DNS Challenge

If port 80 cannot be opened, use DNS challenge instead:

1. In NPM, edit the SSL certificate
2. Change from "HTTP Challenge" to "DNS Challenge"
3. Select your DNS provider (Cloudflare, etc.)
4. Enter the API credentials
5. Save and wait for validation

### Method 4: Reset Certificate Storage

If the `/etc/letsencrypt` volume is corrupted:

```bash
# Stop NPM
docker compose down

# Back up existing certs
cp -r /path/to/letsencrypt /path/to/letsencrypt.bak

# Remove the problem cert
# Find the cert folder name in /etc/letsencrypt/live/
ls /path/to/letsencrypt/live/

# Restart NPM
docker compose up -d

# Request a new certificate through the UI
```

## Prevention

- Monitor certificate expiry dates in the NPM dashboard
- Ensure port 80 stays open permanently — even if you redirect HTTP to HTTPS, the challenge needs port 80
- Use DNS challenge if you're behind a NAT or Cloudflare proxy (orange cloud)
- Keep the `/etc/letsencrypt` volume backed up

## Related

- [How to Self-Host Nginx Proxy Manager](/apps/nginx-proxy-manager/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Nginx Proxy Manager vs Traefik](/compare/nginx-proxy-manager-vs-traefik/)
