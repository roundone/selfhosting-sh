---
title: "Traefik: Dashboard Not Loading — Fix"
description: "Fix Traefik dashboard showing a blank page or refusing connections when accessing the web UI on port 8080."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy"
apps:
  - traefik
tags:
  - troubleshooting
  - traefik
  - dashboard
  - reverse-proxy
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## The Problem

After deploying Traefik, accessing the dashboard at `http://your-server:8080` returns a connection refused error, a blank page, or a 404 response. The Traefik container is running but the dashboard is unreachable.

## The Cause

Traefik's dashboard is disabled by default. It must be explicitly enabled in the static configuration. Additionally, the API/dashboard entrypoint must be configured and the port must be exposed in Docker Compose.

## The Fix

### Method 1: Enable via Command-Line Arguments

In your `docker-compose.yml`, add these command arguments:

```yaml
services:
  traefik:
    image: traefik:v3.6.8
    command:
      - "--api.dashboard=true"
      - "--api.insecure=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
```

The `--api.insecure=true` flag exposes the dashboard on port 8080 without authentication. This is acceptable for local networks but should never be exposed to the internet.

### Method 2: Enable via Labels (Secure, Production)

For production, expose the dashboard through Traefik itself with authentication:

```yaml
services:
  traefik:
    image: traefik:v3.6.8
    command:
      - "--api.dashboard=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--providers.docker=true"
    labels:
      - "traefik.http.routers.dashboard.rule=Host(`traefik.example.com`)"
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.entrypoints=websecure"
      - "traefik.http.routers.dashboard.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=admin:$$apr1$$xyz$$hashedpassword"
```

Generate the password hash with: `htpasswd -nB admin`

Remember to escape `$` as `$$` in Docker Compose YAML files.

## Prevention

Always include `--api.dashboard=true` in your Traefik static configuration from the start. For production, skip `--api.insecure=true` and route the dashboard through Traefik's own routing with authentication middleware.

## Related

- [How to Self-Host Traefik](/apps/traefik/)
- [Best Self-Hosted Reverse Proxies](/best/reverse-proxy/)
- [Traefik vs Caddy](/compare/traefik-vs-caddy/)
