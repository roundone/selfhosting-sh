---
title: "Let's Encrypt Explained for Self-Hosting"
description: "Understand how Let's Encrypt works — free SSL certificates, HTTP vs DNS challenges, automation, and renewal for self-hosted services."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "ssl", "lets-encrypt", "https", "security"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Let's Encrypt?

Let's Encrypt is a free, automated certificate authority (CA) that issues SSL/TLS certificates. Before Let's Encrypt, getting HTTPS on a website meant paying $50-200/year per certificate and going through a manual verification process. Let's Encrypt eliminated both barriers — certificates are free and can be obtained programmatically.

For self-hosting, Let's Encrypt is how you get HTTPS on your services. Whether you're running [Nextcloud](/apps/nextcloud/), [Jellyfin](/apps/jellyfin/), or any other web app, Let's Encrypt provides the certificate that encrypts traffic between your browser and your server.

For the broader context on what SSL certificates are and why they matter, see [SSL Certificates Explained](/foundations/ssl-certificates/).

## How It Works

Let's Encrypt uses the ACME (Automatic Certificate Management Environment) protocol. The process:

1. **You run an ACME client** on your server (built into most reverse proxies, or standalone tools like Certbot)
2. **The client requests a certificate** for your domain (e.g., `immich.yourdomain.com`)
3. **Let's Encrypt verifies you control the domain** via a "challenge" (see below)
4. **If verification passes**, Let's Encrypt issues a certificate valid for 90 days
5. **Your ACME client automatically renews** the certificate before it expires

The entire process is automated. Once set up, you never think about certificates again.

## Challenge Types

Let's Encrypt needs to verify you own the domain before issuing a certificate. There are two main ways to do this.

### HTTP-01 Challenge (Most Common)

Let's Encrypt sends an HTTP request to `http://yourdomain.com/.well-known/acme-challenge/[token]`. Your ACME client places a file at that path. If Let's Encrypt can read it, the challenge passes.

**Requirements:**
- Port 80 must be open and reachable from the internet
- Your domain's A record must point to your server's public IP
- Your reverse proxy or ACME client must serve the challenge file

**Works for:** Any domain with port 80 accessible. Most common for home servers with port forwarding.

**Doesn't work for:** Wildcard certificates, servers behind CGNAT, servers without port 80 access.

### DNS-01 Challenge

Let's Encrypt asks you to create a TXT DNS record at `_acme-challenge.yourdomain.com` with a specific value. Your ACME client creates this record via your DNS provider's API, Let's Encrypt reads it, and the challenge passes.

**Requirements:**
- API access to your DNS provider (Cloudflare, Route53, DigitalOcean, etc.)
- API credentials configured in your ACME client

**Works for:** Everything — including wildcard certificates (`*.yourdomain.com`) and servers without port 80 access.

**Doesn't work for:** DNS providers without an API (some cheap registrars).

### Which Challenge Should You Use?

| Situation | Use |
|-----------|-----|
| Port 80 is open, single domain per service | HTTP-01 |
| Behind CGNAT, no port 80 access | DNS-01 |
| Want wildcard certificates (`*.domain.com`) | DNS-01 (required) |
| Using Cloudflare for DNS | DNS-01 (easy API setup) |
| Simple setup, don't want to configure DNS API | HTTP-01 |

## ACME Clients for Self-Hosting

You rarely interact with Let's Encrypt directly. Most reverse proxies have ACME built in.

### Built Into Your Reverse Proxy (Recommended)

| Reverse Proxy | ACME Support | Configuration |
|---------------|-------------|---------------|
| [Nginx Proxy Manager](/foundations/nginx-proxy-manager-setup/) | Built-in, GUI toggle | Check "Force SSL" per host |
| [Traefik](/foundations/traefik-setup/) | Built-in, config file | Set `certResolver` in `traefik.yml` |
| [Caddy](/foundations/caddy-setup/) | Built-in, automatic | Zero config — HTTPS by default |

If you're using any of these, you already have Let's Encrypt. No additional setup needed.

### Certbot (Standalone)

If you're not using a reverse proxy with built-in ACME, Certbot is the official Let's Encrypt client.

```bash
# Install Certbot
sudo apt install -y certbot

# Get a certificate using HTTP-01 challenge (port 80 must be free)
sudo certbot certonly --standalone -d myapp.yourdomain.com

# Get a certificate using DNS-01 challenge with Cloudflare
sudo apt install -y python3-certbot-dns-cloudflare
sudo certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d myapp.yourdomain.com
```

Certbot automatically sets up a systemd timer for renewal:

```bash
# Verify the renewal timer is active
sudo systemctl status certbot.timer
```

Certificates are stored in `/etc/letsencrypt/live/yourdomain.com/`.

### acme.sh

A shell-script alternative to Certbot. Lighter, doesn't need root, and supports more DNS providers out of the box.

```bash
# Install
curl https://get.acme.sh | sh

# Get a certificate with Cloudflare DNS
export CF_Token="your_cloudflare_api_token"
acme.sh --issue --dns dns_cf -d myapp.yourdomain.com
```

## Certificate Renewal

Let's Encrypt certificates expire after 90 days. This is intentional — it encourages automation and limits the damage from compromised certificates.

All ACME clients handle renewal automatically. The standard approach is to attempt renewal when the certificate is within 30 days of expiration.

**Verify renewal is working:**

For Certbot:
```bash
sudo certbot renew --dry-run
```

For reverse proxies (Traefik, Caddy, NPM): Check the logs. They log certificate issuance and renewal events.

### What If Renewal Fails?

Common causes:
1. **Port 80 blocked** — firewall change or ISP blocking. Check with `curl -v http://yourdomain.com`
2. **DNS changed** — A record no longer points to your server
3. **DNS API credentials expired** — for DNS-01 challenges
4. **Rate limits** — Let's Encrypt allows 50 certificates per registered domain per week (see Rate Limits below)

The certificate keeps working until it expires. You have 30 days to fix the issue before users see warnings.

## Rate Limits

Let's Encrypt has rate limits to prevent abuse:

| Limit | Value | Notes |
|-------|-------|-------|
| Certificates per registered domain | 50/week | `yourdomain.com` and all subdomains combined |
| Duplicate certificates | 5/week | Same exact set of domain names |
| Failed validations | 5/hour | Per domain per account |
| New registrations | 500/hour | Rarely hit for self-hosting |

For self-hosting, you'll almost never hit these limits. The main scenario: repeatedly failing to get a certificate (misconfigured challenge) and hitting the 5 failed validations/hour limit. Fix the issue, wait an hour, try again.

**Staging environment:** For testing, use Let's Encrypt's staging server. It issues certificates that browsers don't trust, but it has much higher rate limits.

Certbot: `certbot --staging ...`
Traefik: Set `caServer: https://acme-staging-v02.api.letsencrypt.org/directory`

## Wildcard Certificates

A wildcard certificate covers all subdomains of a domain (`*.yourdomain.com`). Instead of separate certificates for `jellyfin.yourdomain.com`, `immich.yourdomain.com`, and `nextcloud.yourdomain.com`, one wildcard covers them all.

**Benefits:**
- Fewer certificates to manage
- New subdomains work immediately (no certificate provisioning delay)
- Fewer API calls to Let's Encrypt

**Requirements:**
- DNS-01 challenge only (HTTP-01 cannot verify wildcard domains)
- DNS provider with API access

**When to use wildcards:** If you have 5+ subdomains on the same domain, a wildcard simplifies management. For 1-3 subdomains, individual certificates are fine.

## Common Mistakes

### Requesting Too Many Certificates During Setup

When configuring your reverse proxy, repeated failed attempts can exhaust rate limits. Use the staging environment first, get everything working, then switch to production.

### Not Opening Port 80

HTTP-01 challenge requires port 80 to be open, even if you redirect all HTTP traffic to HTTPS. The challenge uses port 80 specifically. Your reverse proxy should handle this — keep port 80 open, redirect normal traffic to 443, but serve ACME challenges on 80.

### Certificates for Internal-Only Services

If a service is only accessible on your local network, you don't need a Let's Encrypt certificate (Let's Encrypt can't verify internal domains). Options for internal HTTPS:
- Use a self-signed certificate and accept the browser warning
- Use a private CA (e.g., `mkcert` or `step-ca`)
- Use Tailscale's built-in HTTPS certificates (`tailscale cert`)

### Forgetting to Restart Services After Renewal

If you're using Certbot with a web server (not a reverse proxy with built-in ACME), the web server needs to reload after certificate renewal. Add a deploy hook:

```bash
sudo certbot renew --deploy-hook "systemctl reload nginx"
```

## Next Steps

- Set up a reverse proxy with automatic SSL — [Caddy](/foundations/caddy-setup/), [Traefik](/foundations/traefik-setup/), or [Nginx Proxy Manager](/foundations/nginx-proxy-manager-setup/)
- Understand SSL certificates in depth — [SSL Certificates Explained](/foundations/ssl-certificates/)
- Configure DNS for your domain — [DNS Explained](/foundations/dns-explained/)
- Set up a firewall — [Firewall Setup with UFW](/foundations/firewall-ufw/)

## FAQ

### Is Let's Encrypt safe to use?

Yes. Let's Encrypt is backed by the Internet Security Research Group (ISRG), a nonprofit. It's trusted by all major browsers and operating systems. Over 300 million websites use Let's Encrypt certificates.

### Why do certificates expire in 90 days?

To encourage automation and limit risk. A compromised certificate is only valid for 90 days maximum. Since renewal is automated, the short lifetime is invisible to users.

### Can I use Let's Encrypt for email servers?

Yes. Let's Encrypt certificates work for SMTP, IMAP, and POP3 servers. Self-hosted email solutions like [Mailcow](/apps/mailcow/) and [Mailu](/apps/mailu/) typically handle this automatically.

### What happens if Let's Encrypt goes down?

Your existing certificates continue to work until they expire. Let's Encrypt has had very few outages in its history. In a worst case, you have at least 30 days (the remaining certificate lifetime) to find an alternative or wait for recovery.

## Related

- [SSL Certificates Explained](/foundations/ssl-certificates/)
- [Caddy Reverse Proxy Setup](/foundations/caddy-setup/)
- [Traefik Reverse Proxy Setup](/foundations/traefik-setup/)
- [Nginx Proxy Manager Setup](/foundations/nginx-proxy-manager-setup/)
- [DNS Explained](/foundations/dns-explained/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
