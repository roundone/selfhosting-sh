---
title: "Reverse Proxy for Multiple Services"
description: "Route multiple self-hosted services through one reverse proxy — subdomain routing, SSL for each service, and Docker network configuration."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["reverse-proxy", "nginx", "traefik", "caddy", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## One Proxy, Many Services

A reverse proxy is the front door to your self-hosting server. It receives all incoming HTTP/HTTPS traffic on ports 80 and 443, then routes each request to the correct backend service based on the hostname.

```
cloud.example.com  → Nextcloud (port 80)
git.example.com    → Gitea (port 3000)
media.example.com  → Jellyfin (port 8096)
dash.example.com   → Homepage (port 3000)
```

One server, one IP, one set of ports — unlimited services.

## Prerequisites

- A domain name with DNS pointing to your server
- A reverse proxy installed ([NPM](/foundations/nginx-proxy-manager-setup), [Traefik](/foundations/traefik-setup), or [Caddy](/foundations/caddy-setup))
- Docker and Docker Compose ([Docker Compose Basics](/foundations/docker-compose-basics))
- Understanding of DNS records ([DNS Explained](/foundations/dns-explained))

## DNS Setup

Each service needs a DNS record pointing to your server's IP address.

### Option 1: Individual A Records

Create an A record for each subdomain:

```
A  cloud.example.com   → 203.0.113.50
A  git.example.com     → 203.0.113.50
A  media.example.com   → 203.0.113.50
```

### Option 2: Wildcard Record (Recommended)

One wildcard record covers all subdomains:

```
A  *.example.com  → 203.0.113.50
```

Any subdomain now resolves to your server. The reverse proxy decides which backend handles each one.

**Advantage:** Add new services without touching DNS. Just add a new proxy host.

**With Cloudflare:** Wildcard records work with DNS-only mode. To proxy through Cloudflare (orange cloud), you need an Advanced Certificate Manager ($10/month) or individual proxied records.

## Network Architecture

Use an external Docker network shared between the reverse proxy and all backend services:

```bash
docker network create proxy-network
```

```yaml
# /opt/proxy/docker-compose.yml
services:
  proxy:
    image: ...  # Your chosen reverse proxy
    ports:
      - "80:80"
      - "443:443"
    networks:
      - proxy-network

networks:
  proxy-network:
    external: true
```

Each backend joins the same network:

```yaml
# /opt/nextcloud/docker-compose.yml
services:
  nextcloud:
    image: nextcloud:29.0.0
    networks:
      - proxy-network
      - internal
  db:
    image: postgres:16.2
    networks:
      - internal  # Database stays isolated

networks:
  proxy-network:
    external: true
  internal:
```

See [Advanced Docker Compose Networking](/foundations/docker-compose-networking-advanced) for details on this pattern.

## Nginx Proxy Manager Setup

### Adding a Service

1. Go to NPM dashboard (typically `http://your-server:81`)
2. Click **Proxy Hosts** → **Add Proxy Host**
3. Fill in:
   - **Domain Names:** `cloud.example.com`
   - **Scheme:** `http`
   - **Forward Hostname / IP:** `nextcloud` (the Docker service name)
   - **Forward Port:** `80` (the container's internal port)
   - **Block Common Exploits:** Enable
   - **WebSockets Support:** Enable (if the app needs it)
4. **SSL tab:**
   - Request a new SSL Certificate
   - Force SSL: Enable
   - HTTP/2 Support: Enable

Repeat for each service, changing the domain name and forward hostname/port.

### NPM with Multiple Services — Full Example

```yaml
# /opt/proxy/docker-compose.yml
services:
  npm:
    image: jc21/nginx-proxy-manager:2.11.1
    container_name: npm
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - npm_data:/data
      - npm_letsencrypt:/etc/letsencrypt
    networks:
      - proxy-network

volumes:
  npm_data:
  npm_letsencrypt:

networks:
  proxy-network:
    external: true
```

### Handling Large Uploads (Nextcloud, Immich)

In the proxy host's **Advanced** tab:

```nginx
client_max_body_size 10G;
proxy_request_buffering off;
```

## Traefik Setup

Traefik auto-discovers services using Docker labels. No manual proxy host creation needed — just add labels to your containers.

### Base Traefik Configuration

```yaml
# /opt/traefik/docker-compose.yml
services:
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/traefik.yml:ro
      - ./acme.json:/acme.json
    networks:
      - proxy-network

networks:
  proxy-network:
    external: true
```

```yaml
# /opt/traefik/traefik.yml
api:
  dashboard: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
  websecure:
    address: ":443"

providers:
  docker:
    exposedByDefault: false
    network: proxy-network

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@example.com
      storage: acme.json
      httpChallenge:
        entryPoint: web
```

### Adding Services via Labels

```yaml
# /opt/nextcloud/docker-compose.yml
services:
  nextcloud:
    image: nextcloud:29.0.0
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.nextcloud.rule=Host(`cloud.example.com`)"
      - "traefik.http.routers.nextcloud.tls.certresolver=letsencrypt"
      - "traefik.http.services.nextcloud.loadbalancer.server.port=80"
    networks:
      - proxy-network
      - internal
```

```yaml
# /opt/gitea/docker-compose.yml
services:
  gitea:
    image: gitea/gitea:1.22.0
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.gitea.rule=Host(`git.example.com`)"
      - "traefik.http.routers.gitea.tls.certresolver=letsencrypt"
      - "traefik.http.services.gitea.loadbalancer.server.port=3000"
    networks:
      - proxy-network
      - internal
```

Each new service only needs labels — Traefik detects it automatically.

## Caddy Setup

Caddy uses a simple Caddyfile for routing.

### Base Caddy Configuration

```yaml
# /opt/caddy/docker-compose.yml
services:
  caddy:
    image: caddy:2.7.6
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - proxy-network

volumes:
  caddy_data:
  caddy_config:

networks:
  proxy-network:
    external: true
```

### Caddyfile for Multiple Services

```
cloud.example.com {
    reverse_proxy nextcloud:80
}

git.example.com {
    reverse_proxy gitea:3000
}

media.example.com {
    reverse_proxy jellyfin:8096
}

dash.example.com {
    reverse_proxy homepage:3000
}

monitor.example.com {
    reverse_proxy uptime-kuma:3001
}
```

Caddy automatically obtains and renews SSL certificates for each domain. No extra configuration needed.

### Caddy with WebSockets

Caddy handles WebSockets automatically. No additional configuration required.

### Caddy with Large Uploads

```
cloud.example.com {
    request_body {
        max_size 10GB
    }
    reverse_proxy nextcloud:80
}
```

## Adding a New Service — Checklist

Every time you add a new self-hosted service:

1. **DNS:** If not using a wildcard, create an A record for the subdomain
2. **Docker network:** Add `proxy-network` to the service's networks
3. **Proxy configuration:**
   - NPM: Add proxy host via the GUI
   - Traefik: Add labels to the container
   - Caddy: Add a site block to the Caddyfile
4. **SSL:** Automatically handled by all three proxies (Let's Encrypt)
5. **Test:** Visit the subdomain and verify HTTPS works

```yaml
# Template for any new service
services:
  new-service:
    image: vendor/app:tag
    restart: unless-stopped
    networks:
      - proxy-network
      - internal
    # For Traefik users, add labels:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.newservice.rule=Host(`new.example.com`)"
      - "traefik.http.routers.newservice.tls.certresolver=letsencrypt"
      - "traefik.http.services.newservice.loadbalancer.server.port=8080"

networks:
  proxy-network:
    external: true
  internal:
```

## Security Considerations

### Don't Expose Backend Ports

Backend services should not publish ports to the host. The reverse proxy handles all inbound traffic.

```yaml
# WRONG — exposes directly to the internet
ports:
  - "3000:3000"

# RIGHT — only accessible via Docker network
expose:
  - "3000"
# Or simply don't include a ports section at all
```

### Authentication for Services Without Login

Some services (dashboards, monitoring tools) don't have built-in authentication. Add basic auth at the proxy level:

**NPM:** Access Lists in the proxy host settings

**Traefik:**
```yaml
labels:
  - "traefik.http.middlewares.auth.basicauth.users=admin:$$2y$$05$$hash"
  - "traefik.http.routers.dash.middlewares=auth"
```

**Caddy:**
```
dash.example.com {
    basicauth {
        admin $2a$14$hash
    }
    reverse_proxy homepage:3000
}
```

See [Security Hardening](/foundations/security-hardening) for more.

## FAQ

### Can I run services on subpaths instead of subdomains?

Yes, but it's harder. Many self-hosted apps don't support subpath routing cleanly. Subdomains are recommended. If you must use subpaths (`example.com/nextcloud`), check if the app supports a base path configuration.

### How many services can one reverse proxy handle?

Hundreds. The reverse proxy is just routing HTTP requests — it's not resource-intensive. The bottleneck is your server's RAM and CPU for the actual services, not the proxy.

### What if two services use the same internal port?

That's fine. Port conflicts only matter on the host. Two services can both listen on port 3000 internally because each container has its own network namespace. The proxy routes by hostname, not port.

### Should I use NPM, Traefik, or Caddy?

**NPM** for GUI-based management and simplicity. **Traefik** for Docker-native auto-discovery with labels. **Caddy** for clean config files and simplicity with automatic HTTPS. All three work well. Choose based on your preference.

## Related

- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [Nginx Proxy Manager Setup](/foundations/nginx-proxy-manager-setup)
- [Traefik Setup](/foundations/traefik-setup)
- [Caddy Setup](/foundations/caddy-setup)
- [Advanced Docker Compose Networking](/foundations/docker-compose-networking-advanced)
- [SSL Certificates Explained](/foundations/ssl-certificates)
- [DNS Explained](/foundations/dns-explained)
