---
title: "How to Self-Host Caddy with Docker"
description: "Complete guide to deploying Caddy with Docker Compose as a reverse proxy with automatic HTTPS, Caddyfile configuration, and TLS certificate management."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy-ssl"
apps:
  - caddy
tags:
  - docker
  - reverse-proxy
  - caddy
  - ssl
  - automatic-https
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Caddy?

[Caddy](https://caddyserver.com) is a modern web server and reverse proxy with automatic HTTPS built in. Point it at a domain name and it obtains and renews TLS certificates from Let's Encrypt without any configuration. It replaces managed hosting, Nginx, and manual SSL workflows with a single binary and a readable config file called the Caddyfile.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 256 MB of free RAM
- Ports 80 and 443 available (not used by another web server)
- A domain name with DNS A record pointing to your server (required for automatic HTTPS)

## Docker Compose Configuration

Create a directory for Caddy:

```bash
mkdir -p ~/caddy && cd ~/caddy
```

Create a `Caddyfile` in that directory. This example proxies three services and serves a static site:

```caddyfile
# Global options
{
	email you@example.com
	# admin off  # Uncomment to disable the admin API in production
}

# Reverse proxy for Immich
photos.yourdomain.com {
	reverse_proxy immich-server:2283
}

# Reverse proxy for Vaultwarden
vault.yourdomain.com {
	reverse_proxy vaultwarden:80
}

# Reverse proxy for Jellyfin
media.yourdomain.com {
	reverse_proxy jellyfin:8096
}

# Static file server example
yourdomain.com {
	root * /srv/site
	file_server
	encode gzip zstd
}
```

Create a `docker-compose.yml`:

```yaml
services:
  caddy:
    image: caddy:2.10.2-alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"         # HTTP — required for HTTPS redirects and ACME challenges
      - "443:443"       # HTTPS
      - "443:443/udp"   # HTTP/3 (QUIC)
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro  # Your config file
      - caddy-data:/data       # TLS certificates, OCSP staples, private keys
      - caddy-config:/config   # Auto-saved JSON config
      - ./site:/srv/site:ro    # Static site files (optional — remove if not serving files)
    environment:
      TZ: "America/New_York"
    cap_add:
      - NET_BIND_SERVICE   # Allows binding to ports 80/443 as non-root
    networks:
      - proxy

networks:
  proxy:
    name: proxy
    external: true

volumes:
  caddy-data:
  caddy-config:
```

Create the shared Docker network that other services will join:

```bash
docker network create proxy
```

Start Caddy:

```bash
docker compose up -d
```

Caddy obtains TLS certificates automatically for every domain in the Caddyfile within seconds of starting. No additional steps required.

### Connecting Other Services

Services that Caddy proxies to must be on the same Docker network. Add the `proxy` network to each service's Docker Compose:

```yaml
services:
  your-app:
    image: your-app:latest
    # ... other config
    networks:
      - proxy

networks:
  proxy:
    external: true
```

Use the container name as the hostname in your Caddyfile (e.g., `reverse_proxy immich-server:2283`).

## Initial Setup

1. Edit the `Caddyfile` to replace `yourdomain.com` with your actual domain
2. Replace `you@example.com` with your email (used for Let's Encrypt account registration and certificate expiration notices)
3. Update `reverse_proxy` targets to match your running services
4. Run `docker compose up -d` and check logs:

```bash
docker compose logs -f caddy
```

You should see Caddy obtaining certificates for each configured domain. Once you see `certificate obtained successfully`, your sites are live with HTTPS.

## Configuration

### Caddyfile Syntax

The Caddyfile uses a simple, human-readable format. Each site block starts with an address and contains directives:

```caddyfile
address {
	directive arguments
}
```

### Reverse Proxy

The most common use case for self-hosting. Caddy forwards requests to your backend services:

```caddyfile
app.yourdomain.com {
	reverse_proxy backend:8080
}
```

Add health checks and load balancing across multiple backends:

```caddyfile
app.yourdomain.com {
	reverse_proxy backend-1:8080 backend-2:8080 {
		health_uri /health
		health_interval 30s
	}
}
```

Strip or add path prefixes:

```caddyfile
yourdomain.com {
	handle_path /api/* {
		reverse_proxy api-server:3000
	}
	handle {
		reverse_proxy frontend:80
	}
}
```

### WebSocket Proxying

Caddy proxies WebSocket connections automatically. No extra configuration needed. This works out of the box for Home Assistant, Vaultwarden, and other apps that use WebSockets.

### File Server

Serve static files with directory listings and compression:

```caddyfile
files.yourdomain.com {
	root * /srv/files
	file_server browse
	encode gzip zstd
}
```

### Headers

Add security headers across all proxied sites:

```caddyfile
(security-headers) {
	header {
		X-Content-Type-Options "nosniff"
		X-Frame-Options "DENY"
		Referrer-Policy "strict-origin-when-cross-origin"
		Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
		-Server
	}
}

app.yourdomain.com {
	import security-headers
	reverse_proxy backend:8080
}
```

### Snippets

Reuse config blocks with named snippets using parentheses:

```caddyfile
(common) {
	encode gzip zstd
	log {
		output file /data/logs/access.log
	}
}

app1.yourdomain.com {
	import common
	reverse_proxy app1:8080
}

app2.yourdomain.com {
	import common
	reverse_proxy app2:3000
}
```

### Reloading Configuration

Apply Caddyfile changes without downtime:

```bash
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Caddy validates the config before applying it. If there is a syntax error, the reload fails and the running config remains unchanged.

## Advanced Configuration

### On-Demand TLS

Issue certificates at request time instead of at startup. Useful when you do not know all domain names in advance (multi-tenant setups):

```caddyfile
{
	on_demand_tls {
		ask http://your-auth-service:8080/check
		interval 1m
		burst 5
	}
}

https:// {
	tls {
		on_demand
	}
	reverse_proxy backend:8080
}
```

The `ask` endpoint must return 200 for domains that should get certificates. This prevents abuse.

### DNS Challenge for Wildcard Certificates

For wildcard certificates or servers behind a firewall, use the DNS-01 ACME challenge. This requires a custom Caddy build with your DNS provider's plugin. Using the builder image:

```bash
docker run --rm -v $(pwd):/output caddy:2.10.2-builder caddy-builder \
  xcaddy build \
  --with github.com/caddy-dns/cloudflare \
  --output /output/caddy
```

Then use a custom Dockerfile:

```dockerfile
FROM caddy:2.10.2-alpine
COPY caddy /usr/bin/caddy
```

Caddyfile for wildcard:

```caddyfile
*.yourdomain.com {
	tls {
		dns cloudflare {env.CLOUDFLARE_API_TOKEN}
	}

	@photos host photos.yourdomain.com
	handle @photos {
		reverse_proxy immich-server:2283
	}

	@vault host vault.yourdomain.com
	handle @vault {
		reverse_proxy vaultwarden:80
	}
}
```

Add `CLOUDFLARE_API_TOKEN` to your Docker Compose environment.

### Load Balancing

Distribute traffic across multiple backends with configurable policies:

```caddyfile
app.yourdomain.com {
	reverse_proxy backend-1:8080 backend-2:8080 backend-3:8080 {
		lb_policy round_robin
		health_uri /health
		health_interval 10s
		fail_duration 30s
	}
}
```

Available policies: `round_robin`, `least_conn`, `random`, `first`, `ip_hash`, `uri_hash`, `header`, `cookie`.

### Rate Limiting with Custom Modules

Caddy supports modules for functionality like rate limiting, caching, and authentication. Modules require a custom build using `xcaddy`:

```bash
xcaddy build --with github.com/mholt/caddy-ratelimit
```

### Admin API

Caddy exposes a JSON API on port 2019 (localhost only by default) for dynamic configuration:

```bash
# View current config
curl http://localhost:2019/config/

# Add a new route dynamically
curl -X POST http://localhost:2019/config/apps/http/servers/srv0/routes \
  -H "Content-Type: application/json" \
  -d '{"handle":[{"handler":"reverse_proxy","upstreams":[{"dial":"backend:8080"}]}],"match":[{"host":["new.yourdomain.com"]}]}'
```

The admin API is disabled in the Docker container unless you expose port 2019. Keep it off in production unless you need it.

## Backup

Three things to back up:

1. **`caddy-data` volume** — Contains TLS certificates, private keys, and OCSP staples. Losing this forces re-issuance of all certificates (subject to Let's Encrypt rate limits).
2. **`caddy-config` volume** — Contains the auto-saved JSON representation of your config. Useful but not critical if you have your Caddyfile.
3. **Your `Caddyfile`** — The source of truth for your configuration. Keep this in version control.

```bash
# Back up the critical data volume
docker compose stop
docker run --rm -v caddy-data:/data -v $(pwd):/backup alpine tar czf /backup/caddy-data-backup.tar.gz /data
docker run --rm -v caddy-config:/config -v $(pwd):/backup alpine tar czf /backup/caddy-config-backup.tar.gz /config
docker compose start

# The Caddyfile is already on the host — include it in your regular file backups
cp ~/caddy/Caddyfile ~/backups/Caddyfile.bak
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Certificate not provisioning

**Symptom:** Caddy logs show `ACME challenge failed` or `obtaining certificate` errors.

**Fix:** Verify DNS and firewall configuration:
```bash
# Check DNS resolves to your server
dig +short yourdomain.com

# Ensure ports 80 and 443 are open
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

Let's Encrypt requires port 80 to be publicly reachable for HTTP-01 challenges. If your server is behind NAT, configure port forwarding. If behind Cloudflare proxy, temporarily set DNS to DNS-only (grey cloud) during initial certificate provisioning.

### 502 Bad Gateway or "dial tcp: connection refused"

**Symptom:** Browser shows a Caddy error page with "502" or logs show connection refused.

**Fix:** The upstream service is unreachable. Verify:
```bash
# Check if the target container is running
docker ps | grep your-service

# Check if it's on the same Docker network
docker network inspect proxy
```

The container name in your Caddyfile must exactly match the `container_name` or service name, and both containers must be on the same Docker network.

### ERR_TOO_MANY_REDIRECTS

**Symptom:** Browser shows a redirect loop when accessing a proxied service.

**Fix:** This happens when Caddy and the upstream service both try to redirect HTTP to HTTPS. Configure the upstream to not enforce HTTPS (it is behind Caddy, which already handles TLS). For Nextcloud, set `overwriteprotocol` to `https` in `config.php`. For other apps, disable their built-in TLS/HTTPS redirect.

### Changes to Caddyfile not taking effect

**Symptom:** You edited the Caddyfile but the old config is still active.

**Fix:** Caddy does not auto-reload the Caddyfile. You must explicitly reload:
```bash
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

If the reload fails with a syntax error, Caddy keeps the old config running. Check the error message, fix the Caddyfile, and reload again.

### Container fails to bind to port 80 or 443

**Symptom:** `Error starting userland proxy: listen tcp4 0.0.0.0:80: bind: address already in use`

**Fix:** Another process is using the port:
```bash
sudo lsof -i :80
sudo lsof -i :443
```

Stop the conflicting service (commonly Apache or Nginx):
```bash
sudo systemctl stop apache2 && sudo systemctl disable apache2
sudo systemctl stop nginx && sudo systemctl disable nginx
```

## Resource Requirements

- **RAM:** ~20 MB idle, ~50 MB under moderate load (significantly lighter than Nginx Proxy Manager)
- **CPU:** Minimal — Caddy is written in Go with efficient concurrency
- **Disk:** ~50 MB for the binary and config, plus TLS certificate storage (negligible)

## Verdict

Caddy is the best reverse proxy for most self-hosters. Its automatic HTTPS with zero configuration is unmatched — where Nginx Proxy Manager needs you to click through a UI and Traefik requires Docker labels on every service, Caddy just works when you give it a domain name. The Caddyfile syntax is cleaner and more readable than Nginx configs or Traefik's YAML/TOML files. It uses less RAM than Nginx Proxy Manager and has a simpler mental model than Traefik.

Choose [Nginx Proxy Manager](/apps/nginx-proxy-manager) if you want a web UI and never want to touch config files. Choose [Traefik](/apps/traefik) if you need deep Docker integration with automatic service discovery via labels. Choose Caddy for everything else — it is the right default for self-hosting in 2026.

## Frequently Asked Questions

### Does Caddy automatically handle HTTPS?

Yes. If your domain's DNS points to your server and ports 80/443 are accessible, Caddy obtains and renews Let's Encrypt certificates automatically. No configuration needed beyond specifying the domain name in your Caddyfile.

### Can Caddy replace Nginx?

Yes. Caddy handles reverse proxying, static file serving, load balancing, and TLS termination. For most self-hosting use cases, Caddy is a drop-in replacement for Nginx with far less configuration. Caddy lacks some of Nginx's niche modules for advanced caching and stream processing, but these are irrelevant for typical self-hosting setups.

### Is Caddy fast enough for production?

Yes. Caddy is written in Go, supports HTTP/3 out of the box, and handles thousands of concurrent connections efficiently. For self-hosting workloads (tens to hundreds of concurrent users), Caddy's performance is indistinguishable from Nginx or Traefik.

### How do I use Caddy with Cloudflare proxy?

Set Cloudflare SSL/TLS mode to "Full (Strict)." Caddy manages the origin certificate, and Cloudflare handles the edge. If you want to use Cloudflare proxy mode (orange cloud) and still get valid origin certificates, build Caddy with the Cloudflare DNS plugin and use the DNS-01 challenge as shown in the Advanced Configuration section.

### Can I run Caddy on a Raspberry Pi?

Yes. The `caddy:2.10.2-alpine` image supports arm64. Caddy's low resource usage (20 MB RAM idle) makes it an excellent choice for Raspberry Pi and other single-board computers.

## Related

- [How to Self-Host Nginx Proxy Manager](/apps/nginx-proxy-manager)
- [How to Self-Host Traefik](/apps/traefik)
- [Best Self-Hosted Reverse Proxy & SSL](/best/reverse-proxy-ssl)
- [NPM vs Caddy Comparison](/compare/nginx-proxy-manager-vs-caddy)
- [Traefik vs Caddy Comparison](/compare/traefik-vs-caddy)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Networking](/foundations/docker-networking)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
