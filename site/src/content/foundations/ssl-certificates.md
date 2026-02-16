---
title: "SSL Certificates for Self-Hosting"
description: "How SSL/TLS certificates work, how to get free certificates with Let's Encrypt, and how to set up HTTPS for your self-hosted services."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: ["nginx-proxy-manager", "traefik", "caddy"]
tags: ["foundations", "ssl", "tls", "https", "letsencrypt", "security"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are SSL Certificates?

SSL certificates (technically TLS certificates — SSL is the deprecated predecessor, but everyone still says "SSL") encrypt the connection between a browser and your server. When you see the padlock icon and `https://` in the address bar, a certificate is doing the work.

For self-hosting, SSL certificates matter for three reasons: browsers block or warn on HTTP connections to non-localhost addresses, encrypted connections prevent anyone on your network from sniffing passwords and data, and some self-hosted apps require HTTPS to function (Progressive Web Apps, WebAuthn, clipboard access).

## Prerequisites

- A Linux server with Docker installed ([Getting Started](/foundations/getting-started))
- A domain name pointing to your server ([DNS Explained](/foundations/dns-explained))
- A [reverse proxy](/foundations/reverse-proxy-explained) (Nginx Proxy Manager, Traefik, or Caddy)

## How TLS Works (Simplified)

1. **Browser connects** to `https://photos.example.com`
2. **Server presents its certificate** — proves it is `photos.example.com`
3. **Browser verifies** the certificate was signed by a trusted Certificate Authority (CA)
4. **Key exchange** — browser and server agree on an encryption key
5. **Encrypted communication** — all data between browser and server is encrypted

Certificates expire (typically 90 days for Let's Encrypt) and must be renewed. Most reverse proxies handle renewal automatically.

## Getting Free Certificates with Let's Encrypt

[Let's Encrypt](https://letsencrypt.org/) is a free, automated Certificate Authority. It issues certificates valid for 90 days and supports automatic renewal. Nearly every self-hosting reverse proxy integrates with it.

### Challenge Types

Let's Encrypt needs to verify you control the domain before issuing a certificate. Two methods:

**HTTP-01 Challenge (simplest)**
Let's Encrypt makes an HTTP request to `http://yourdomain.com/.well-known/acme-challenge/[token]`. Your server must respond with the correct token. This requires port 80 to be open and reachable from the internet.

```
Internet → Port 80 → Reverse Proxy → Serves challenge token → Certificate issued
```

**DNS-01 Challenge (most flexible)**
You create a TXT record `_acme-challenge.yourdomain.com` with a specific value. No port forwarding needed. Works for wildcard certificates (`*.example.com`). Requires API access to your DNS provider.

```
Let's Encrypt asks: "Add TXT record _acme-challenge.example.com = [token]"
Your DNS API adds the record → Let's Encrypt verifies → Certificate issued
```

**The recommendation:** Use DNS-01 if your domain is on Cloudflare (most self-hosters use Cloudflare). It supports wildcards, works behind CGNAT, and does not require opening port 80. Use HTTP-01 if your DNS provider does not have API support.

## Setting Up SSL with Common Reverse Proxies

### Nginx Proxy Manager

Nginx Proxy Manager handles Let's Encrypt certificates through its web UI with zero command-line work.

1. Add a proxy host for your service
2. In the **SSL** tab, select "Request a new SSL Certificate"
3. Check "Force SSL" and "HTTP/2 Support"
4. Enter your email for Let's Encrypt notifications
5. Click Save — the certificate is issued and auto-renews

For DNS-01 challenges (wildcards, no port 80):
1. In the SSL tab, select "Use a DNS Challenge"
2. Choose your DNS provider (Cloudflare, etc.)
3. Enter your API credentials

See the full [Nginx Proxy Manager guide](/apps/nginx-proxy-manager) for Docker setup.

### Traefik

Traefik automates certificate management through its configuration. Add to your `traefik.yml`:

```yaml
certificatesResolvers:
  letsencrypt:
    acme:
      email: your-email@example.com
      storage: /letsencrypt/acme.json
      dnsChallenge:
        provider: cloudflare
        resolvers:
          - "1.1.1.1:53"
          - "8.8.8.8:53"
```

Set the Cloudflare API token in your environment:

```yaml
environment:
  - CF_DNS_API_TOKEN=your-cloudflare-api-token
```

Then label your containers to request certificates:

```yaml
labels:
  - "traefik.http.routers.photos.tls=true"
  - "traefik.http.routers.photos.tls.certresolver=letsencrypt"
  - "traefik.http.routers.photos.rule=Host(`photos.example.com`)"
```

Traefik handles issuance and renewal automatically. See the full [Traefik guide](/apps/traefik) for complete setup.

### Caddy

Caddy obtains and renews certificates automatically with zero configuration. Just specify a domain:

```
photos.example.com {
    reverse_proxy immich:2283
}

files.example.com {
    reverse_proxy nextcloud:80
}
```

Caddy detects the domain names, obtains Let's Encrypt certificates via HTTP-01, and renews them automatically. For DNS-01 challenges, use the Cloudflare plugin:

```
photos.example.com {
    tls {
        dns cloudflare {env.CF_API_TOKEN}
    }
    reverse_proxy immich:2283
}
```

Caddy is the simplest option for automatic HTTPS. See the full [Caddy guide](/apps/caddy).

## Wildcard Certificates

A wildcard certificate covers `*.example.com` — one certificate for `photos.example.com`, `files.example.com`, `music.example.com`, and every other subdomain. This is cleaner than issuing individual certificates and avoids hitting Let's Encrypt rate limits.

**Requirements:**
- DNS-01 challenge (wildcards cannot use HTTP-01)
- API access to your DNS provider

**Let's Encrypt rate limits:**
- 50 certificates per registered domain per week
- 5 duplicate certificates per week
- 300 new orders per account per 3 hours

For most self-hosters, a single wildcard certificate is sufficient and avoids all rate limit concerns.

## Self-Signed Certificates (Local Only)

If you do not have a public domain or cannot use Let's Encrypt, you can generate self-signed certificates. Browsers will show a security warning, but the connection is still encrypted.

```bash
# Generate a self-signed certificate valid for 365 days
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/selfsigned.key \
  -out /etc/ssl/certs/selfsigned.crt \
  -subj "/CN=192.168.1.50"
```

To avoid browser warnings, add the generated CA certificate to your devices' trust stores. This is manual and annoying — a real domain with Let's Encrypt is almost always the better option.

**Alternative: mkcert** for local development:

```bash
# Install mkcert
sudo apt install libnss3-tools
curl -L https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64 -o mkcert
chmod +x mkcert
sudo mv mkcert /usr/local/bin/

# Install the local CA
mkcert -install

# Generate certificates for local domains
mkcert "photos.home" "files.home" "*.home"
```

mkcert creates a local Certificate Authority and adds it to your system trust store. Browsers on that machine trust the certificates with no warnings. You still need to install the CA on every device that accesses the services.

## Common Mistakes

### Not opening port 80 for HTTP-01 challenges
Let's Encrypt's HTTP-01 challenge requires port 80 to be reachable from the internet. If your router does not forward port 80 to your server, the challenge fails. Switch to DNS-01 if you cannot open port 80 (common with ISPs that block it).

### Forgetting to renew certificates
Let's Encrypt certificates expire after 90 days. If your reverse proxy is not auto-renewing, services break silently. Nginx Proxy Manager, Traefik, and Caddy all auto-renew by default — verify renewal is working by checking logs after 60 days.

### Using SSL termination incorrectly
Your reverse proxy should terminate SSL (handle the certificate), then forward traffic to containers over plain HTTP on the internal Docker network. Do not try to configure certificates inside individual containers — one certificate at the reverse proxy covers everything.

### Rate limiting during testing
If you issue too many test certificates, Let's Encrypt temporarily blocks your domain. Use the staging environment for testing:

```
# Let's Encrypt staging URL (for testing — certificates won't be trusted)
https://acme-staging-v02.api.letsencrypt.org/directory
```

### Running services on HTTP after setting up HTTPS
After enabling HTTPS, force all HTTP traffic to redirect to HTTPS. Most reverse proxies have a "Force SSL" option. Users typing `http://photos.example.com` should automatically redirect to `https://`.

## Next Steps

- Set up a [reverse proxy](/foundations/reverse-proxy-explained) if you have not already
- Configure [DNS](/foundations/dns-explained) for your domain
- Secure SSH access with [key-based authentication](/foundations/ssh-setup)
- Set up a [firewall](/foundations/firewall-ufw) to control network access
- Learn about [port forwarding](/foundations/ports-explained) for external access

## FAQ

### Do I need SSL for services only accessed on my local network?
Strictly speaking, no — your LAN traffic is not passing through the public internet. But HTTPS prevents snooping from other devices on your network, enables features that require secure contexts (PWAs, WebAuthn), and eliminates browser warnings. Use it if you can.

### Can I get a wildcard certificate from Let's Encrypt?
Yes. Wildcard certificates require the DNS-01 challenge. Your DNS provider must have an API that your ACME client (reverse proxy) supports. Cloudflare, DigitalOcean, Route53, and most major providers are supported.

### What happens when my certificate expires?
Browsers show a full-page security warning and refuse to connect (or require explicit override). Your services still work — only the HTTPS encryption breaks. Auto-renewal from your reverse proxy prevents this.

### Should I use Cloudflare's Origin Certificates instead of Let's Encrypt?
Cloudflare Origin Certificates only work when traffic passes through Cloudflare's proxy. They last 15 years, so no renewal needed. Use them if you always access services through Cloudflare's proxy. Use Let's Encrypt if you need certificates that work without Cloudflare.

## Related

- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [DNS Explained](/foundations/dns-explained)
- [SSH Setup Guide](/foundations/ssh-setup)
- [Getting Started with Self-Hosting](/foundations/getting-started)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Firewall Setup with UFW](/foundations/firewall-ufw)
