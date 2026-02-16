---
title: "Traefik: Docker Containers Not Detected — Fix"
description: "Fix Traefik not discovering Docker containers due to socket permissions, network, or label configuration problems."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy"
apps:
  - traefik
tags:
  - troubleshooting
  - traefik
  - docker
  - provider
  - labels
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## The Problem

Traefik is running but doesn't route traffic to your containers. The dashboard shows no routers or services, or routes show as "not found." Docker containers with Traefik labels are ignored.

## The Cause

Traefik discovers containers through the Docker socket. Common reasons for failure:

1. Docker socket not mounted in the Traefik container
2. `--providers.docker=true` not set in Traefik's static configuration
3. Containers are on a different Docker network than Traefik
4. Labels have typos or use wrong syntax
5. `traefik.enable=false` is set (or `exposedByDefault=false` and `traefik.enable=true` is missing)

## The Fix

### Method 1: Mount the Docker Socket

Verify the Docker socket is mounted in your `docker-compose.yml`:

```yaml
services:
  traefik:
    image: traefik:v3.6.8
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
```

### Method 2: Fix Network Configuration

Traefik must share a Docker network with the containers it routes to:

```yaml
services:
  traefik:
    image: traefik:v3.6.8
    networks:
      - proxy

  myapp:
    image: myapp:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.myapp.rule=Host(`app.example.com`)"
      - "traefik.docker.network=proxy"
    networks:
      - proxy

networks:
  proxy:
    external: true
```

Create the network first: `docker network create proxy`

If a container is on multiple networks, you must specify which network Traefik should use with the `traefik.docker.network` label.

### Method 3: Enable Container Exposure

If you set `--providers.docker.exposedbydefault=false` (recommended), each container must explicitly opt in:

```yaml
labels:
  - "traefik.enable=true"
```

Without this label, Traefik ignores the container entirely.

### Method 4: Verify Label Syntax

Common label mistakes:

```yaml
# WRONG — missing router name
- "traefik.http.routers.rule=Host(`app.example.com`)"

# CORRECT — includes router name
- "traefik.http.routers.myapp.rule=Host(`app.example.com`)"

# WRONG — backticks missing
- "traefik.http.routers.myapp.rule=Host(app.example.com)"

# CORRECT — backticks around hostname
- "traefik.http.routers.myapp.rule=Host(`app.example.com`)"
```

## Prevention

- Always use `--providers.docker.exposedbydefault=false` and explicitly enable containers with `traefik.enable=true`
- Create a dedicated `proxy` network and add both Traefik and proxied containers to it
- Test label syntax with `docker inspect <container>` to verify labels are applied correctly
- Check Traefik dashboard (port 8080) to see which routers and services are detected

## Related

- [How to Self-Host Traefik](/apps/traefik)
- [Docker Networking](/foundations/docker-networking)
- [Traefik vs Nginx Proxy Manager](/compare/nginx-proxy-manager-vs-traefik)
