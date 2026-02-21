---
title: "SSL Certificate Troubleshooting"
description: "Fix SSL certificate errors — expired certs, renewal failures, Let's Encrypt rate limits, mixed content, and reverse proxy SSL configuration."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["ssl", "tls", "certificates", "troubleshooting", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## SSL Issues in Self-Hosting

SSL certificate problems range from "your connection is not private" browser warnings to silent renewal failures that break your services weeks later. This guide covers every common SSL issue you'll encounter when self-hosting.

## Prerequisites

- Understanding of SSL/TLS concepts ([SSL Certificates Explained](/foundations/ssl-certificates/))
- A reverse proxy configured ([Reverse Proxy Explained](/foundations/reverse-proxy-explained/))
- Terminal access to your server ([SSH Setup](/foundations/ssh-setup/))

## Diagnosing SSL Problems

### Check the Current Certificate

```bash
# Check certificate from the command line
openssl s_client -connect myapp.example.com:443 -servername myapp.example.com </dev/null 2>/dev/null | openssl x509 -noout -dates -subject -issuer

# Quick expiration check
echo | openssl s_client -connect myapp.example.com:443 -servername myapp.example.com 2>/dev/null | openssl x509 -noout -enddate

# Full certificate chain
openssl s_client -connect myapp.example.com:443 -servername myapp.example.com -showcerts </dev/null
```

### Check from Inside the Network

If you're behind a reverse proxy, check the internal connection too:

```bash
# Direct to the reverse proxy
curl -vI https://myapp.example.com 2>&1 | grep -E "subject|expire|issuer"

# Direct to the backend (if using self-signed internally)
curl -kvI https://localhost:8443 2>&1 | grep -E "subject|expire|issuer"
```

## Certificate Expired

### Symptoms

Browser shows "NET::ERR_CERT_DATE_INVALID" or "Your connection is not private."

### Diagnosis

```bash
# Check expiration date
echo | openssl s_client -connect myapp.example.com:443 -servername myapp.example.com 2>/dev/null | openssl x509 -noout -enddate
# notAfter=Mar 15 00:00:00 2026 GMT
```

### Fix: Nginx Proxy Manager

```bash
# Force renewal through the NPM UI:
# SSL Certificates → click the certificate → Renew Now

# If the UI doesn't work, check NPM logs
docker compose logs --tail=50 npm
```

### Fix: Traefik

Traefik auto-renews certificates. If renewal failed:

```bash
# Check Traefik logs for ACME errors
docker compose logs --tail=100 traefik | grep -i "acme\|certificate\|error"

# Delete the certificate store and restart (forces re-issuance)
# WARNING: brief downtime while new certs are issued
rm acme.json
docker compose restart traefik
```

### Fix: Caddy

Caddy auto-manages certificates. If expired:

```bash
# Check Caddy logs
docker compose logs --tail=100 caddy | grep -i "certificate\|tls\|error"

# Restart Caddy to trigger renewal
docker compose restart caddy
```

### Fix: Certbot (Manual)

```bash
# Check all managed certificates
sudo certbot certificates

# Renew all eligible certificates
sudo certbot renew

# Renew a specific certificate
sudo certbot certonly --force-renewal -d myapp.example.com

# Test renewal without actually renewing
sudo certbot renew --dry-run
```

## Let's Encrypt Rate Limits

### "too many certificates already issued"

Let's Encrypt enforces rate limits:

| Limit | Value | Per |
|-------|-------|-----|
| Certificates per domain | 50 | Week |
| Duplicate certificates | 5 | Week |
| Failed validations | 5 | Hour, per account, per hostname |
| New orders | 300 | 3 hours |

```bash
# Check your current certificate count
# Visit: https://crt.sh/?q=example.com
```

**Fixes:**
- Wait for the rate limit to reset (usually 1 week)
- Use Let's Encrypt staging for testing: `--server https://acme-staging-v02.api.letsencrypt.org/directory`
- Use a wildcard certificate (`*.example.com`) to cover all subdomains with one cert

### "too many failed authorizations"

You've failed validation too many times. This usually means:
- Port 80 isn't reachable from the internet (HTTP-01 challenge)
- DNS TXT record isn't set correctly (DNS-01 challenge)
- Cloudflare proxy is interfering

```bash
# Test port 80 reachability
curl -I http://myapp.example.com/.well-known/acme-challenge/test

# If using Cloudflare proxy, temporarily set DNS to "DNS only" (gray cloud)
# for the HTTP-01 challenge to work
```

## Challenge Validation Failures

### HTTP-01 Challenge Fails

The HTTP-01 challenge requires Let's Encrypt servers to reach port 80 on your server.

```bash
# Verify port 80 is open and reachable
curl -I http://myapp.example.com

# Check if your firewall blocks port 80
sudo ufw status | grep 80

# Check if port 80 is forwarded (home server)
# Test from outside your network or use a port checker tool

# Verify your reverse proxy handles /.well-known/acme-challenge/
curl http://myapp.example.com/.well-known/acme-challenge/test
```

Common causes:
- Firewall blocks port 80
- Port 80 not forwarded on router (home server setups)
- Another service occupies port 80
- Cloudflare proxy in "Full (Strict)" mode blocking challenges

### DNS-01 Challenge Fails

The DNS-01 challenge requires a TXT record at `_acme-challenge.yourdomain.com`.

```bash
# Check if the TXT record exists
dig +short -t TXT _acme-challenge.example.com

# Check from a public resolver
dig @1.1.1.1 +short -t TXT _acme-challenge.example.com
```

If using automated DNS-01 (Traefik/Caddy with Cloudflare):
- Verify API token has Zone:DNS:Edit permissions
- Check the token covers the correct zone
- Check Traefik/Caddy logs for API errors

```bash
# Test Cloudflare API token permissions
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## Certificate Chain Issues

### "unable to verify the first certificate"

The server is sending the leaf certificate but not the intermediate certificate(s).

```bash
# Check the chain
openssl s_client -connect myapp.example.com:443 -servername myapp.example.com </dev/null 2>&1 | grep -E "depth|verify"
```

Fix: ensure your reverse proxy is configured with the full chain, not just the leaf certificate.

For Nginx:
```nginx
ssl_certificate /path/to/fullchain.pem;  # NOT cert.pem
ssl_certificate_key /path/to/privkey.pem;
```

For Nginx Proxy Manager and Traefik, the full chain is handled automatically — if you see chain issues, the certificate store may be corrupted. Delete and re-issue.

### Self-Signed Certificate Warnings

If you're using self-signed certificates for internal services:

```bash
# Generate a proper self-signed cert
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -sha256 -days 365 -nodes \
  -subj "/CN=myapp.local" \
  -addext "subjectAltName=DNS:myapp.local,IP:192.168.1.100"
```

For internal-only services, consider using a local CA with `mkcert`:

```bash
# Install mkcert (creates a local CA)
# Then generate trusted certs for local domains
mkcert myapp.local "*.myapp.local" 192.168.1.100
```

## Mixed Content Warnings

### Browser Shows Lock Icon with Warning

Your page loads over HTTPS but includes resources (images, scripts, styles) loaded over HTTP.

Check for:
- Hardcoded `http://` URLs in your application configuration
- Application base URL set to `http://` instead of `https://`
- Upstream services returning HTTP URLs

Common fixes by application:

```yaml
# Nextcloud — set overwrite protocol
environment:
  OVERWRITEPROTOCOL: https

# Many apps — set the base URL / external URL
environment:
  BASE_URL: https://myapp.example.com
  # or
  EXTERNAL_URL: https://myapp.example.com
```

## Reverse Proxy SSL Configuration

### SSL Termination Not Working

Your reverse proxy should terminate SSL and forward plain HTTP to backend containers:

```
Client --[HTTPS]--> Reverse Proxy --[HTTP]--> Container
```

If the backend expects HTTPS, you'll get connection errors. Most self-hosted apps serve HTTP internally.

```yaml
# In your reverse proxy config, forward to HTTP port
# NPM: scheme = http, forward port = 8080
# Traefik: loadbalancer server port = 8080
# Caddy: reverse_proxy container:8080
```

### HSTS Prevents HTTP Access

If you enabled HTTP Strict Transport Security (HSTS) and then removed SSL, browsers will refuse to connect over HTTP until the HSTS max-age expires.

```bash
# Check if HSTS is set
curl -sI https://myapp.example.com | grep -i strict-transport-security
```

To recover: re-enable SSL. HSTS is practically irreversible (which is the point). If you set a long max-age, browsers will enforce HTTPS for that duration.

## Wildcard Certificate Setup

Wildcard certificates (`*.example.com`) cover all subdomains with one certificate. They require DNS-01 validation.

### With Traefik and Cloudflare

```yaml
# traefik.yml
certificatesResolvers:
  cloudflare:
    acme:
      email: admin@example.com
      storage: acme.json
      dnsChallenge:
        provider: cloudflare
        resolvers:
          - "1.1.1.1:53"
```

```yaml
# docker-compose.yml
environment:
  CF_DNS_API_TOKEN: your-cloudflare-api-token
```

### With Caddy and Cloudflare

```
*.example.com {
  tls {
    dns cloudflare {env.CF_API_TOKEN}
  }
  @app1 host app1.example.com
  handle @app1 {
    reverse_proxy app1:8080
  }
}
```

## Monitoring Certificate Expiration

Don't wait for certificates to expire. Monitor them.

```bash
# Quick check script — add to cron
#!/bin/bash
DOMAINS="app1.example.com app2.example.com app3.example.com"
WARN_DAYS=14

for domain in $DOMAINS; do
  expiry=$(echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
  expiry_epoch=$(date -d "$expiry" +%s)
  now_epoch=$(date +%s)
  days_left=$(( (expiry_epoch - now_epoch) / 86400 ))
  if [ "$days_left" -lt "$WARN_DAYS" ]; then
    echo "WARNING: $domain expires in $days_left days ($expiry)"
  fi
done
```

Better option: use [Uptime Kuma](/apps/uptime-kuma/) with certificate expiry monitoring.

## FAQ

### My certificate auto-renews but my reverse proxy doesn't pick up the new cert. Why?

Most reverse proxies need a reload or restart to read new certificate files. Certbot has a `--deploy-hook` option for this: `certbot renew --deploy-hook "docker compose restart nginx"`. Traefik and Caddy reload automatically.

### Can I use Let's Encrypt on a local network without a public domain?

No. Let's Encrypt requires domain validation — either HTTP reachability or DNS records. For local-only services, use self-signed certificates or a local CA like `mkcert`.

### Why does Let's Encrypt issue certificates for only 90 days?

Short lifetimes encourage automation and limit damage from compromised keys. With proper auto-renewal, you never notice the short lifetime. If your renewal keeps failing, fix the automation rather than looking for longer-lived certificates.

### I'm using Cloudflare proxy. Do I need Let's Encrypt at all?

Cloudflare provides a certificate between the client and Cloudflare's edge. But the connection from Cloudflare to your server also needs encryption. Use Cloudflare Origin Certificates (15-year certs) or Let's Encrypt for the origin. Set Cloudflare SSL mode to "Full (Strict)."

## Related

- [SSL Certificates Explained](/foundations/ssl-certificates/)
- [Let's Encrypt Explained](/foundations/lets-encrypt-explained/)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)
- [Nginx Proxy Manager Setup](/foundations/nginx-proxy-manager-setup/)
- [Traefik Setup](/foundations/traefik-setup/)
- [Caddy Setup](/foundations/caddy-setup/)
- [DNS Debugging](/foundations/dns-debugging/)
