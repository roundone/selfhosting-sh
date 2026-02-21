---
title: "Nginx Proxy Manager: 502 Bad Gateway — Fix"
description: "Fix the 502 Bad Gateway error in Nginx Proxy Manager caused by wrong hostnames, ports, or Docker network issues."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy"
apps:
  - nginx-proxy-manager
tags:
  - troubleshooting
  - nginx-proxy-manager
  - "502"
  - bad-gateway
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## The Problem

When accessing a site proxied through Nginx Proxy Manager (NPM), the browser shows `502 Bad Gateway`. The NPM admin UI at port 81 works fine, but proxied services return 502 errors.

## The Cause

A 502 means NPM received an invalid or no response from the upstream (backend) server. Common causes:

1. **Wrong forward hostname** — using `localhost` instead of the Docker container name or host IP
2. **Wrong forward port** — using the host-mapped port instead of the container's internal port
3. **Container not on the same Docker network** as NPM
4. **Backend service not yet started** or has crashed
5. **SSL scheme mismatch** — forwarding to HTTPS when the backend only speaks HTTP (or vice versa)

## The Fix

### Method 1: Use Container Name as Hostname

If NPM and the backend service are in Docker, use the **container name** (not `localhost` or the host IP):

- Forward Hostname: `my-app` (the container name)
- Forward Port: `8080` (the **internal** container port, not the host-mapped port)

Example: If your app is `ports: "3000:8080"`, use port `8080` in NPM, not `3000`.

### Method 2: Fix Docker Network

Both NPM and the backend must share a Docker network:

```yaml
# In NPM's docker-compose.yml
services:
  npm:
    image: jc21/nginx-proxy-manager:2.13.7
    networks:
      - proxy

# In your app's docker-compose.yml
services:
  myapp:
    image: myapp:latest
    networks:
      - proxy

networks:
  proxy:
    external: true
```

Create the shared network: `docker network create proxy`

### Method 3: Use Host IP for Non-Docker Services

If the backend runs directly on the host (not in Docker), use the host's IP address:

- On Linux: use `172.17.0.1` (Docker bridge gateway) or your server's LAN IP
- Or add `extra_hosts: ["host.docker.internal:host-gateway"]` to NPM's compose file and use `host.docker.internal` as the hostname

### Method 4: Fix the Scheme

In the NPM Proxy Host edit screen, check "Scheme":

- Use **http** if the backend serves plain HTTP (most containers)
- Use **https** only if the backend itself serves HTTPS (uncommon)

## Prevention

- Always use container names as forward hostnames for Docker services
- Use internal ports (not host-mapped ports) in NPM proxy host config
- Put all proxied services on a shared Docker network with NPM
- Verify the backend is running: `docker logs <container-name>`

## Related

- [How to Self-Host Nginx Proxy Manager](/apps/nginx-proxy-manager/)
- [Best Self-Hosted Reverse Proxies](/best/reverse-proxy/)
- [Docker Networking](/foundations/docker-networking/)
