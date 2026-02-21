---
title: "Caddy Reverse Proxy Setup for Self-Hosting"
description: "Set up Caddy as a reverse proxy with automatic HTTPS — the simplest config file approach to routing your self-hosted services."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "caddy", "reverse-proxy", "ssl", "docker"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Caddy?

Caddy is a web server and reverse proxy written in Go. Its defining feature is automatic HTTPS — every site you configure gets a valid SSL certificate from Let's Encrypt with zero additional configuration. No certificate commands, no renewal cron jobs, no certificate files to manage.

Caddy's configuration format (the Caddyfile) is dramatically simpler than Nginx config or Traefik labels. A complete reverse proxy rule for a service is two lines. This makes Caddy the fastest reverse proxy to get running for self-hosting.

For the conceptual overview of reverse proxies, see [Reverse Proxy Explained](/foundations/reverse-proxy-explained/).

## Prerequisites

- A Linux server with Docker and Docker Compose installed — see [Docker Compose Basics](/foundations/docker-compose-basics/)
- A domain name with A records pointed at your server's IP
- Ports 80 and 443 available (not used by another reverse proxy)
- Basic familiarity with Docker — see [Docker Networking](/foundations/docker-networking/)

## Docker Compose Configuration

Create a directory for Caddy:

```bash
mkdir -p /opt/caddy
cd /opt/caddy
```

Create `docker-compose.yml`:

```yaml
# /opt/caddy/docker-compose.yml
services:
  caddy:
    image: caddy:2.9.1-alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"  # HTTP/3 support
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data        # SSL certificates
      - caddy-config:/config    # Caddy configuration state
    networks:
      - caddy-public

volumes:
  caddy-data:
  caddy-config:

networks:
  caddy-public:
    name: caddy-public
    driver: bridge
```

The `443:443/udp` port mapping enables HTTP/3 (QUIC), which Caddy supports natively.

## The Caddyfile

Create a `Caddyfile` in the same directory:

```
# /opt/caddy/Caddyfile
# Global options
{
    email admin@yourdomain.com  # CHANGE THIS — used for Let's Encrypt
}

# Example: Reverse proxy to a service
jellyfin.yourdomain.com {
    reverse_proxy jellyfin:8096
}

immich.yourdomain.com {
    reverse_proxy immich-server:2283
}

# Example: Simple file server
files.yourdomain.com {
    root * /srv/files
    file_server browse
}
```

That's the entire config. Each site block is the domain name followed by directives in braces. `reverse_proxy` takes the upstream service name and port. Caddy handles SSL certificates, HTTP-to-HTTPS redirect, and HSTS headers automatically.

## Start Caddy

```bash
docker compose up -d
```

Check the logs to verify certificate provisioning:

```bash
docker compose logs -f caddy
```

You should see Caddy obtain SSL certificates for each configured domain. Access your services at their domains — HTTPS works immediately.

## Adding Services

### Method 1: Add to Caddyfile (Simple)

For each new service, add a block to the Caddyfile:

```
myapp.yourdomain.com {
    reverse_proxy myapp:3000
}
```

Reload Caddy without downtime:

```bash
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

The service must be on the `caddy-public` Docker network. In the service's `docker-compose.yml`:

```yaml
services:
  myapp:
    image: myapp:v1.0.0
    restart: unless-stopped
    networks:
      - caddy-public

networks:
  caddy-public:
    external: true
```

### Method 2: Use Caddy Docker Proxy Plugin

For Traefik-like automatic Docker label integration, use the `caddy-docker-proxy` image instead of stock Caddy:

```yaml
services:
  caddy:
    image: lucaslorentz/caddy-docker-proxy:2.9.1
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - caddy-data:/data
    networks:
      - caddy-public

volumes:
  caddy-data:

networks:
  caddy-public:
    name: caddy-public
    driver: bridge
```

Then add labels to your services instead of editing the Caddyfile:

```yaml
services:
  myapp:
    image: myapp:v1.0.0
    restart: unless-stopped
    networks:
      - caddy-public
    labels:
      caddy: myapp.yourdomain.com
      caddy.reverse_proxy: "{{upstreams 3000}}"

networks:
  caddy-public:
    external: true
```

## Common Caddyfile Patterns

### Basic Auth Protection

```
admin.yourdomain.com {
    basicauth {
        admin $2a$14$your_bcrypt_hash_here
    }
    reverse_proxy admin-panel:8080
}
```

Generate the password hash:

```bash
docker run --rm caddy:2.9.1-alpine caddy hash-password --plaintext 'your-password'
```

### Websocket Support

Caddy proxies websockets automatically — no extra configuration needed. This means apps like [Home Assistant](/apps/home-assistant/), chat services, and real-time dashboards work out of the box.

### Rate Limiting

```
api.yourdomain.com {
    rate_limit {
        zone api_limit {
            key {remote_host}
            events 100
            window 1m
        }
    }
    reverse_proxy api-service:8000
}
```

### IP Restriction (Internal Services Only)

```
internal.yourdomain.com {
    @blocked not remote_ip 192.168.0.0/16 10.0.0.0/8
    respond @blocked "Forbidden" 403
    reverse_proxy internal-app:3000
}
```

### Multiple Services on Subpaths

```
yourdomain.com {
    handle /jellyfin/* {
        reverse_proxy jellyfin:8096
    }
    handle /gitea/* {
        reverse_proxy gitea:3000
    }
    handle {
        reverse_proxy homepage:3000
    }
}
```

### Security Headers

```
yourdomain.com {
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    reverse_proxy myapp:8080
}
```

## Wildcard Certificates

For wildcard certificates (`*.yourdomain.com`), Caddy needs DNS challenge verification. Using Cloudflare:

Build a custom Caddy image with the Cloudflare DNS plugin:

```dockerfile
FROM caddy:2.9.1-builder AS builder
RUN xcaddy build \
    --with github.com/caddy-dns/cloudflare

FROM caddy:2.9.1-alpine
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
```

Build and use this image:

```bash
docker build -t caddy-cloudflare .
```

Update `docker-compose.yml` to use `caddy-cloudflare` and add your API token:

```yaml
services:
  caddy:
    build: .
    environment:
      - CLOUDFLARE_API_TOKEN=your_token_here
```

Update the Caddyfile:

```
*.yourdomain.com {
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }

    @jellyfin host jellyfin.yourdomain.com
    handle @jellyfin {
        reverse_proxy jellyfin:8096
    }

    @immich host immich.yourdomain.com
    handle @immich {
        reverse_proxy immich-server:2283
    }
}
```

## Caddy vs Nginx Proxy Manager vs Traefik

| Feature | Caddy | Nginx Proxy Manager | Traefik |
|---------|-------|-------------------|---------|
| Configuration | Caddyfile (text) | Web GUI | Docker labels / YAML |
| SSL certificates | Automatic | Automatic | Automatic |
| Learning curve | Low | Very Low | Medium |
| HTTP/3 | Yes (native) | No | Yes |
| Docker integration | Manual / plugin | Manual | Native |
| Config reload | Zero downtime | Restart required | Automatic |
| Best for | Simple setups, clean configs | Beginners | Docker-heavy infra |

Use Caddy if you want the simplest possible configuration with excellent defaults. Use [Nginx Proxy Manager](/foundations/nginx-proxy-manager-setup/) if you want a GUI. Use [Traefik](/foundations/traefik-setup/) if you need native Docker label integration.

## Common Mistakes

### Forgetting to Expose the Service Network

The most common issue: Caddy can't reach your service. Both Caddy and the service must be on the same Docker network. Verify with:

```bash
docker network inspect caddy-public
```

Look for both containers in the output.

### Using IP Addresses Instead of Container Names

Inside Docker networks, use container names (or service names) as hostnames, not IP addresses. Container IPs can change on restart.

```
# Wrong
reverse_proxy 172.18.0.5:8096

# Correct
reverse_proxy jellyfin:8096
```

### Running Caddy as Non-Root and Binding Port 80

If you run Caddy outside Docker as a non-root user, it can't bind to ports below 1024. Either use Docker (recommended), or grant the binary the `cap_net_bind_service` capability:

```bash
sudo setcap cap_net_bind_service=+ep $(which caddy)
```

### DNS Not Propagated

If Caddy fails to get a certificate, verify your DNS A record is pointing to the correct IP and has propagated:

```bash
dig +short myapp.yourdomain.com
```

Let's Encrypt needs to reach your server on port 80 for HTTP challenge verification.

## Next Steps

- Proxy your first app — try [Jellyfin](/apps/jellyfin/) or [Vaultwarden](/apps/vaultwarden/)
- Understand Docker networking — [Docker Networking](/foundations/docker-networking/)
- Set up a firewall — [Firewall Setup with UFW](/foundations/firewall-ufw/)
- Learn about SSL in depth — [SSL Certificates Explained](/foundations/ssl-certificates/)

## FAQ

### Is Caddy fast enough for production use?

Yes. Caddy handles thousands of concurrent connections efficiently. For a home server with under 100 concurrent users, performance is not a concern. Caddy also supports HTTP/3 natively, which can improve performance for mobile clients.

### Can I migrate from Nginx Proxy Manager to Caddy?

Yes. The process is straightforward — for each proxy host in NPM, create a corresponding site block in the Caddyfile. Caddy provisions new certificates automatically. Stop NPM, start Caddy, and your services route to the same backends.

### Does Caddy cache content?

Not by default. Caddy is a reverse proxy — it forwards requests to your backend services. For caching, your backend application should handle it, or you can add the `cache-handler` plugin to Caddy.

### How do I update Caddy?

Change the image tag in `docker-compose.yml` (e.g., `caddy:2.9.2-alpine`) and run `docker compose up -d`. Certificates and configuration persist in the mounted volumes. See [Updating Docker Containers](/foundations/docker-updating/).

## Related

- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)
- [Nginx Proxy Manager Setup](/foundations/nginx-proxy-manager-setup/)
- [Traefik Reverse Proxy Setup](/foundations/traefik-setup/)
- [SSL Certificates Explained](/foundations/ssl-certificates/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Networking](/foundations/docker-networking/)
- [Firewall Setup with UFW](/foundations/firewall-ufw/)
