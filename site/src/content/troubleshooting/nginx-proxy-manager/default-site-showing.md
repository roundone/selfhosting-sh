---
title: "NPM: Default Site Showing Instead of App — Fix"
description: "Fix Nginx Proxy Manager showing its default page instead of routing to your app due to host or DNS configuration."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy"
apps:
  - nginx-proxy-manager
tags:
  - troubleshooting
  - nginx-proxy-manager
  - default-site
  - routing
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## The Problem

Visiting your domain shows the Nginx Proxy Manager default "Congratulations" page or a generic Nginx 404 page, instead of your actual application. The proxy host appears correctly configured in the NPM admin panel.

## The Cause

NPM routes based on the `Host` header in the HTTP request. The default page appears when:

1. **DNS points to the server but doesn't match any proxy host** — the domain in the browser must exactly match the "Domain Names" field in the proxy host
2. **Cloudflare proxy is stripping the Host header** — the orange cloud can interfere
3. **Wildcard vs exact domain mismatch** — `app.example.com` doesn't match `*.example.com` unless configured
4. **Port conflict** — another service is binding port 80/443 before NPM

## The Fix

### Method 1: Verify Domain Name Match

In NPM admin → Proxy Hosts → Edit the host:

- The "Domain Names" field must **exactly** match what you type in the browser
- `app.example.com` and `www.app.example.com` are different — add both if needed
- Check for trailing spaces or invisible characters

### Method 2: Verify DNS Resolution

```bash
# Check what IP the domain resolves to
dig +short app.example.com

# Should return YOUR server's public IP
```

If it returns a Cloudflare IP (104.x.x.x or 172.x.x.x), DNS is going through Cloudflare's proxy. Either:
- Set the DNS record to "DNS only" (gray cloud) in Cloudflare
- Or keep the orange cloud but ensure the proxy host in NPM handles it correctly

### Method 3: Check for Port Conflicts

```bash
# Check what's using ports 80 and 443
sudo ss -tlnp | grep ':80\|:443'
```

If Apache, another Nginx, or any other service is binding these ports, NPM can't receive traffic. Stop the conflicting service:

```bash
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### Method 4: Check NPM Logs

```bash
docker logs nginx-proxy-manager 2>&1 | tail -50
```

Look for errors related to the specific proxy host or SSL certificate issues that might prevent routing.

## Prevention

- Test with `curl -H "Host: app.example.com" http://your-server-ip` to verify NPM routes correctly before configuring DNS
- Keep domain names consistent — use exactly the domain your DNS points to
- Don't run other web servers on port 80/443 alongside NPM

## Related

- [How to Self-Host Nginx Proxy Manager](/apps/nginx-proxy-manager/)
- [Nginx Proxy Manager vs Caddy](/compare/nginx-proxy-manager-vs-caddy/)
- [Docker Networking](/foundations/docker-networking/)
