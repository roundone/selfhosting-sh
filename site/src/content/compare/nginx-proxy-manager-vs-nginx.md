---
title: "Nginx Proxy Manager vs Nginx: Which to Self-Host?"
description: "Nginx Proxy Manager vs raw Nginx compared for self-hosting. GUI management, SSL automation, and configuration complexity differences."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy"
apps:
  - nginx-proxy-manager
  - nginx
tags:
  - comparison
  - nginx-proxy-manager
  - nginx
  - reverse-proxy
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Nginx Proxy Manager is the right choice for most self-hosters. It wraps Nginx in a web UI that handles proxy host creation, SSL certificate management, and access control without touching config files. Use raw Nginx only if you need features NPM doesn't expose or want full control over every directive.

## Overview

**Nginx Proxy Manager (NPM)** is a web-based management interface built on top of Nginx. It provides a GUI for creating proxy hosts, redirects, streams, and managing Let's Encrypt SSL certificates. Under the hood, it generates and manages Nginx config files automatically. Current version: v2.13.7.

**Nginx** is the web server and reverse proxy that NPM is built on. Using it directly means writing config files by hand, managing SSL certificates yourself (typically via Certbot), and reloading the server after every change. Current version: 1.28.2.

NPM is Nginx with training wheels — and for self-hosting, training wheels are a feature, not a limitation.

## Feature Comparison

| Feature | Nginx Proxy Manager v2.13 | Nginx 1.28 |
|---------|---------------------------|------------|
| Configuration method | Web UI | Config files |
| SSL certificate management | Built-in (Let's Encrypt, custom) | Manual (Certbot + cron) |
| Proxy host creation | Click-through wizard | Write server block |
| Access lists | GUI-managed | Manual (allow/deny, basic_auth) |
| Custom Nginx config | Advanced tab per host | Full control |
| Redirect management | GUI-managed | Write rewrite rules |
| Stream (TCP/UDP) proxying | GUI-managed | Manual (stream block) |
| 404/error pages | Default or custom | Fully customizable |
| Multi-user access | Yes (user accounts) | No (file-level access) |
| API | REST API available | No native API |
| Audit logging | Yes (access log per host) | Manual (per-server logging) |
| Docker integration | Single container deploy | Single container deploy |

## Installation Complexity

### Nginx Proxy Manager

```yaml
services:
  npm:
    image: jc21/nginx-proxy-manager:2.13.7
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - npm-data:/data
      - npm-letsencrypt:/etc/letsencrypt
    restart: unless-stopped

volumes:
  npm-data:
  npm-letsencrypt:
```

Deploy, open port 81, log in with `admin@example.com` / `changeme`, and start adding proxy hosts through the UI.

### Nginx

```yaml
services:
  nginx:
    image: nginx:1.28.2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./conf.d:/etc/nginx/conf.d:ro
      - ./certs:/etc/nginx/certs:ro
    restart: unless-stopped
```

Then write config files, set up Certbot for SSL, configure a renewal cron, and reload Nginx after each change.

**Winner: NPM by a wide margin** for ease of setup.

## Performance and Resource Usage

| Metric | NPM | Nginx (raw) |
|--------|-----|-------------|
| Idle RAM | ~80-120 MB | ~5-10 MB |
| CPU (idle) | Minimal | Minimal |
| Disk usage | ~200 MB | ~10 MB (Alpine) |
| Request overhead | Negligible (it IS Nginx) | Baseline |
| Max connections | Same as Nginx | ~10,000+ per worker |

NPM uses more RAM because it runs Node.js for the management UI alongside Nginx. The proxy performance itself is identical — NPM generates standard Nginx config files that Nginx executes. You're not losing proxy performance by using NPM.

## Community and Support

| Metric | NPM | Nginx |
|--------|-----|-------|
| GitHub stars | 23K+ | N/A |
| Active development | Yes | Yes (F5/Nginx Inc.) |
| Documentation | Good (wiki) | Excellent (decades) |
| Community size | Large (self-hosting) | Massive (industry-wide) |
| Troubleshooting resources | Moderate | Extensive |

Nginx has significantly more documentation and community resources, but most of it covers web server use cases rather than reverse proxy setup. NPM's community is focused specifically on reverse proxy management for self-hosting.

## Use Cases

### Choose Nginx Proxy Manager If...

- You want a GUI for managing proxy hosts
- You don't want to learn Nginx config file syntax
- You need easy Let's Encrypt certificate management
- You manage 5-50 self-hosted services
- You want multiple users to manage proxy hosts
- You want to get a reverse proxy running in under 5 minutes

### Choose Raw Nginx If...

- You need full control over every Nginx directive
- You're using Nginx modules (Lua, njs, GeoIP2, RTMP)
- You're serving static files alongside proxying
- You need config-as-code (version controlled config files)
- You manage hundreds of virtual hosts programmatically
- You're running in production with strict performance requirements
- You need features NPM doesn't expose (custom error pages, complex rewrite rules)

## Final Verdict

**NPM for self-hosting, raw Nginx for everything else.** Nginx Proxy Manager eliminates the most tedious part of self-hosting — manually writing and maintaining reverse proxy configs. Since NPM runs real Nginx underneath, you get the same proxy performance with a dramatically better management experience.

The Advanced tab in NPM lets you inject custom Nginx config per host, which covers 90% of edge cases. If you hit the remaining 10%, you probably need raw Nginx — but most self-hosters never will.

## Frequently Asked Questions

### Is NPM slower than raw Nginx?

No. The proxy path is identical — NPM generates Nginx config files that Nginx executes. The management UI adds ~100 MB of RAM overhead but doesn't affect request handling.

### Can I migrate from NPM to raw Nginx?

Yes. NPM stores its generated configs in `/data/nginx/`. You can extract these, clean them up, and use them as a starting point for a raw Nginx setup.

### Does NPM support wildcard SSL certificates?

Yes. NPM supports DNS challenge-based wildcard certificates through its UI. You'll need API credentials for your DNS provider (Cloudflare, Route53, etc.).

### Can I use NPM's Advanced tab for custom config?

Yes. Each proxy host has an Advanced tab where you can add raw Nginx directives. This is useful for custom headers, caching rules, or WebSocket configurations that the GUI doesn't expose.

### Should I firewall port 81?

Yes. Port 81 is the admin UI and should never be publicly accessible. Access it only through your local network, a VPN, or a separate authenticated proxy.

## Related

- [How to Self-Host Nginx Proxy Manager](/apps/nginx-proxy-manager)
- [How to Self-Host Nginx with Docker](/apps/nginx)
- [NPM vs Traefik](/compare/nginx-proxy-manager-vs-traefik)
- [NPM vs Caddy](/compare/nginx-proxy-manager-vs-caddy)
- [Best Self-Hosted Reverse Proxies](/best/reverse-proxy)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [Docker Compose Basics](/foundations/docker-compose-basics)
