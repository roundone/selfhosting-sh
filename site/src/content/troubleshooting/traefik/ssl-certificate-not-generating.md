---
title: "Traefik: SSL Certificate Not Generating — Fix"
description: "Resolve Traefik failing to generate Let's Encrypt SSL certificates due to DNS, port, or ACME configuration issues."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy"
apps:
  - traefik
tags:
  - troubleshooting
  - traefik
  - ssl
  - lets-encrypt
  - certificates
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## The Problem

Traefik is running and routing traffic, but HTTPS shows a self-signed or default Traefik certificate instead of a valid Let's Encrypt certificate. The browser shows a security warning. Traefik logs may show ACME errors like `acme: error: 403` or `unable to generate a certificate`.

## The Cause

SSL certificate generation fails for several reasons:

1. **Port 80 is not publicly accessible** — Let's Encrypt HTTP-01 challenge requires port 80 open from the internet
2. **DNS doesn't point to your server** — the domain must resolve to your server's public IP
3. **ACME configuration is missing or wrong** — the certificate resolver must be defined in static config AND referenced in route labels
4. **Certificate storage volume not mounted** — Traefik stores certs in `acme.json`, which must persist across restarts

## The Fix

### Method 1: Fix HTTP-01 Challenge Configuration

Ensure your static configuration includes a proper ACME resolver:

```yaml
services:
  traefik:
    image: traefik:v3.6.8
    command:
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=you@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--providers.docker=true"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - letsencrypt:/letsencrypt
      - /var/run/docker.sock:/var/run/docker.sock:ro

volumes:
  letsencrypt:
```

Then reference the resolver in your service labels:

```yaml
labels:
  - "traefik.http.routers.myapp.rule=Host(`app.example.com`)"
  - "traefik.http.routers.myapp.entrypoints=websecure"
  - "traefik.http.routers.myapp.tls.certresolver=letsencrypt"
```

### Method 2: Use DNS-01 Challenge (When Port 80 Is Blocked)

If your ISP blocks port 80, use DNS-01 challenge with a supported DNS provider:

```yaml
command:
  - "--certificatesresolvers.letsencrypt.acme.dnschallenge=true"
  - "--certificatesresolvers.letsencrypt.acme.dnschallenge.provider=cloudflare"
environment:
  CF_API_EMAIL: "you@example.com"
  CF_DNS_API_TOKEN: "your-cloudflare-api-token"
```

### Method 3: Fix File Permissions on acme.json

The `acme.json` file must have permissions `600`. If it was created with wrong permissions, Traefik silently fails:

```bash
# Find the file in the volume
docker exec traefik ls -la /letsencrypt/acme.json
# Fix permissions
docker exec traefik chmod 600 /letsencrypt/acme.json
# Restart Traefik
docker compose restart traefik
```

### Debugging

Check Traefik logs for ACME errors:

```bash
docker logs traefik 2>&1 | grep -i "acme\|certificate\|challenge"
```

Enable debug logging temporarily:

```yaml
command:
  - "--log.level=DEBUG"
```

## Prevention

- Always mount a persistent volume for `/letsencrypt/acme.json`
- Verify DNS records point to your server before enabling ACME
- Test with Let's Encrypt staging first: `--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory`
- Use DNS-01 challenge if you're behind a NAT or firewall that blocks port 80

## Related

- [How to Self-Host Traefik](/apps/traefik)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Best Self-Hosted Reverse Proxies](/best/reverse-proxy)
