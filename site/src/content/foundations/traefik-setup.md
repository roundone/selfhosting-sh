---
title: "Traefik Reverse Proxy Setup for Self-Hosting"
description: "Set up Traefik v3 as a reverse proxy with automatic SSL, Docker integration, and dashboard — the config-as-code approach to routing."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "traefik", "reverse-proxy", "ssl", "docker"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Traefik?

Traefik is a modern reverse proxy and load balancer designed for containerized environments. Unlike [Nginx Proxy Manager](/foundations/nginx-proxy-manager-setup/), which uses a web GUI, Traefik reads Docker labels directly from your containers and configures routing automatically. Add a label to a container, and Traefik picks it up — no manual config files, no GUI clicking.

Traefik handles automatic SSL certificate provisioning via Let's Encrypt, supports HTTP/2 and HTTP/3, and has a built-in dashboard for monitoring. It's the reverse proxy of choice for self-hosters who prefer infrastructure-as-code over GUIs.

For the conceptual overview of what reverse proxies do and why you need one, see [Reverse Proxy Explained](/foundations/reverse-proxy-explained/).

## Prerequisites

- A Linux server with Docker and Docker Compose installed — see [Docker Compose Basics](/foundations/docker-compose-basics/)
- A domain name pointed at your server's IP (A record)
- Ports 80 and 443 available (not used by another service)
- Basic understanding of Docker networking — see [Docker Networking](/foundations/docker-networking/)

## Directory Structure

Create a directory for your Traefik configuration:

```bash
mkdir -p /opt/traefik
cd /opt/traefik
```

You'll need three files:
- `docker-compose.yml` — the Traefik container
- `traefik.yml` — static configuration
- `acme.json` — SSL certificate storage (auto-populated by Traefik)

Create the certificate storage file with correct permissions:

```bash
touch acme.json
chmod 600 acme.json
```

Traefik refuses to start if `acme.json` has permissive file permissions.

## Static Configuration

Create `traefik.yml`:

```yaml
# /opt/traefik/traefik.yml
# Traefik v3.3 static configuration

api:
  dashboard: true
  insecure: false  # We'll secure the dashboard with a router

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"
    http:
      tls:
        certResolver: letsencrypt

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@yourdomain.com  # CHANGE THIS — Let's Encrypt notifications
      storage: /etc/traefik/acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false  # Only route containers with traefik.enable=true
    network: traefik-public

log:
  level: WARN  # Options: DEBUG, INFO, WARN, ERROR
```

Key settings:
- `exposedByDefault: false` — containers are only proxied if they have `traefik.enable=true`. This prevents accidental exposure.
- HTTP automatically redirects to HTTPS.
- Let's Encrypt handles SSL certificates automatically.

## Docker Compose Configuration

Create `docker-compose.yml`:

```yaml
# /opt/traefik/docker-compose.yml
services:
  traefik:
    image: traefik:v3.3.3
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/etc/traefik/traefik.yml:ro
      - ./acme.json:/etc/traefik/acme.json
    networks:
      - traefik-public
    labels:
      # Dashboard configuration
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`traefik.yourdomain.com`)"
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.entrypoints=websecure"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
      # Basic auth for dashboard (generate with: htpasswd -nB admin)
      - "traefik.http.routers.dashboard.middlewares=dashboard-auth"
      - "traefik.http.middlewares.dashboard-auth.basicauth.users=admin:$$2y$$05$$your_bcrypt_hash_here"

networks:
  traefik-public:
    name: traefik-public
    driver: bridge
```

**Before starting:** Replace `yourdomain.com` with your actual domain. Generate the dashboard password hash:

```bash
# Install htpasswd if not present
sudo apt install -y apache2-utils

# Generate bcrypt hash
htpasswd -nB admin
```

Copy the output and paste it into the `basicauth.users` label. Escape every `$` as `$$` in the Docker Compose file (Docker Compose interprets `$` as variable substitution).

## Start Traefik

```bash
docker compose up -d
```

Verify it's running:

```bash
docker compose logs -f traefik
```

You should see Traefik discover itself and provision an SSL certificate for the dashboard domain. Access the dashboard at `https://traefik.yourdomain.com`.

## Adding Services

The real power of Traefik is adding new services with just Docker labels. No config file changes, no restart needed.

### Example: Proxying a Web Application

Add these labels to any Docker Compose service to route it through Traefik:

```yaml
# In another service's docker-compose.yml
services:
  myapp:
    image: myapp:v1.0.0
    restart: unless-stopped
    networks:
      - traefik-public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.myapp.rule=Host(`myapp.yourdomain.com`)"
      - "traefik.http.routers.myapp.entrypoints=websecure"
      - "traefik.http.routers.myapp.tls.certresolver=letsencrypt"
      - "traefik.http.services.myapp.loadbalancer.server.port=8080"

networks:
  traefik-public:
    external: true
```

Key points:
- The service must be on the `traefik-public` network (defined as `external: true` since Traefik created it)
- `traefik.enable=true` tells Traefik to proxy this container
- The `Host()` rule matches the domain name
- The `loadbalancer.server.port` tells Traefik which container port to forward to
- SSL certificates are provisioned automatically

### Example: Jellyfin

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    container_name: jellyfin
    restart: unless-stopped
    volumes:
      - jellyfin-config:/config
      - jellyfin-cache:/cache
      - /path/to/media:/media:ro
    networks:
      - traefik-public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.jellyfin.rule=Host(`jellyfin.yourdomain.com`)"
      - "traefik.http.routers.jellyfin.entrypoints=websecure"
      - "traefik.http.routers.jellyfin.tls.certresolver=letsencrypt"
      - "traefik.http.services.jellyfin.loadbalancer.server.port=8096"

volumes:
  jellyfin-config:
  jellyfin-cache:

networks:
  traefik-public:
    external: true
```

Once you `docker compose up -d` this stack, Traefik automatically detects Jellyfin and routes `jellyfin.yourdomain.com` to it with a valid SSL certificate.

## Middlewares

Traefik middlewares modify requests before they reach your service. Common use cases:

### Rate Limiting

```yaml
labels:
  - "traefik.http.middlewares.rate-limit.ratelimit.average=100"
  - "traefik.http.middlewares.rate-limit.ratelimit.burst=50"
  - "traefik.http.routers.myapp.middlewares=rate-limit"
```

### IP Allowlist (Internal Services)

```yaml
labels:
  - "traefik.http.middlewares.local-only.ipallowlist.sourcerange=192.168.0.0/16,10.0.0.0/8"
  - "traefik.http.routers.myapp.middlewares=local-only"
```

### Headers (Security)

```yaml
labels:
  - "traefik.http.middlewares.security-headers.headers.stsSeconds=31536000"
  - "traefik.http.middlewares.security-headers.headers.browserXssFilter=true"
  - "traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true"
  - "traefik.http.middlewares.security-headers.headers.frameDeny=true"
  - "traefik.http.routers.myapp.middlewares=security-headers"
```

### Chaining Middlewares

Apply multiple middlewares by comma-separating them:

```yaml
labels:
  - "traefik.http.routers.myapp.middlewares=rate-limit,security-headers"
```

## Wildcard SSL Certificates

Instead of provisioning a separate certificate for each subdomain, you can use a single wildcard certificate (`*.yourdomain.com`). This requires DNS challenge verification instead of HTTP challenge.

For Cloudflare-managed domains, update `traefik.yml`:

```yaml
certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@yourdomain.com
      storage: /etc/traefik/acme.json
      dnsChallenge:
        provider: cloudflare
        resolvers:
          - "1.1.1.1:53"
          - "8.8.8.8:53"
```

Add Cloudflare API credentials to the Docker Compose environment:

```yaml
services:
  traefik:
    environment:
      - CF_API_EMAIL=your@email.com
      - CF_DNS_API_TOKEN=your_cloudflare_api_token
```

Then use wildcard certificates on your routers:

```yaml
labels:
  - "traefik.http.routers.myapp.tls.domains[0].main=yourdomain.com"
  - "traefik.http.routers.myapp.tls.domains[0].sans=*.yourdomain.com"
```

## Traefik vs Nginx Proxy Manager vs Caddy

| Feature | Traefik | Nginx Proxy Manager | Caddy |
|---------|---------|-------------------|-------|
| Configuration | Docker labels / YAML files | Web GUI | Caddyfile |
| Docker integration | Automatic (native) | Manual per-host | Via plugins |
| SSL certificates | Automatic (Let's Encrypt) | Automatic (Let's Encrypt) | Automatic (Let's Encrypt) |
| Learning curve | Medium | Low | Low-Medium |
| HTTP/3 support | Yes | No | Yes |
| Dashboard | Built-in | Built-in | Via plugin |
| Best for | Docker-heavy setups | Beginners, GUI users | Simple configs, Go devs |

Use Traefik if you prefer config-as-code and run everything in Docker. Use [Nginx Proxy Manager](/foundations/nginx-proxy-manager-setup/) if you want a GUI. Use [Caddy](/foundations/caddy-setup/) if you want something in between.

## Common Mistakes

### Forgetting `exposedByDefault: false`

Without this setting in `traefik.yml`, every container with exposed ports gets automatically proxied — including databases, Redis instances, and internal services. Always set `exposedByDefault: false` and explicitly enable routing per container.

### Wrong Network Configuration

Services must be on the same Docker network as Traefik. If a container isn't reachable, check:
1. Both are on `traefik-public` network
2. The network is defined as `external: true` in the service's Compose file
3. The `loadbalancer.server.port` matches the container's actual listening port

### Permissive acme.json

Traefik will not start if `acme.json` has permissions other than `600`. This is a security requirement — the file contains your private SSL keys.

```bash
chmod 600 acme.json
```

### Dollar Signs in Labels

Docker Compose interprets `$` as variable substitution. In labels (especially `basicauth.users`), escape every `$` as `$$`:

```yaml
# Wrong
- "traefik.http.middlewares.auth.basicauth.users=admin:$2y$05$hash"
# Correct
- "traefik.http.middlewares.auth.basicauth.users=admin:$$2y$$05$$hash"
```

## Next Steps

- Add your first service behind Traefik — try [Jellyfin](/apps/jellyfin/) or [Immich](/apps/immich/)
- Learn about Docker networking in depth — [Docker Networking](/foundations/docker-networking/)
- Secure your server — [Firewall Setup with UFW](/foundations/firewall-ufw/)
- Set up monitoring to watch Traefik — [Monitoring Basics](/foundations/monitoring-basics/)

## FAQ

### Can I run Traefik alongside Nginx Proxy Manager?

Technically yes, but they can't both listen on ports 80 and 443. You'd need to put one behind the other, which adds complexity for no benefit. Pick one reverse proxy and use it for everything.

### Does Traefik work with non-Docker services?

Yes. Use a file provider to define routes for services running outside Docker (bare-metal apps, VMs, other hosts). Add to `traefik.yml`:

```yaml
providers:
  file:
    filename: /etc/traefik/dynamic.yml
    watch: true
```

Then define routes in `dynamic.yml`.

### How do I update Traefik?

Change the image tag in `docker-compose.yml` to the new version (e.g., `traefik:v3.3.4`) and run `docker compose up -d`. Your configuration and certificates are preserved in the mounted volumes. See [Updating Docker Containers](/foundations/docker-updating/) for the general process.

### How do I debug routing issues?

Set the log level to `DEBUG` in `traefik.yml` temporarily:

```yaml
log:
  level: DEBUG
```

Then check `docker compose logs traefik` for detailed routing information. Switch back to `WARN` after troubleshooting — debug logging is very verbose.

## Related

- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)
- [Nginx Proxy Manager Setup](/foundations/nginx-proxy-manager-setup/)
- [Caddy Reverse Proxy Setup](/foundations/caddy-setup/)
- [SSL Certificates Explained](/foundations/ssl-certificates/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Networking](/foundations/docker-networking/)
- [DNS Explained](/foundations/dns-explained/)
