---
title: "How to Self-Host Nginx with Docker Compose"
description: "Deploy Nginx with Docker Compose as a reverse proxy or web server. Includes config examples, SSL setup, environment templates, and troubleshooting."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy-ssl"
apps:
  - nginx
tags:
  - docker
  - reverse-proxy
  - nginx
  - web-server
  - ssl
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Nginx?

[Nginx](https://nginx.org) is the most widely used web server and reverse proxy on the internet. It handles HTTP, HTTPS, TCP, and UDP traffic with high performance and low memory usage. For self-hosting, Nginx serves as a reverse proxy to route traffic to your Docker containers, terminate SSL, serve static files, and load balance across multiple backends. Unlike [Nginx Proxy Manager](/apps/nginx-proxy-manager), plain Nginx has no web UI — you configure everything through text files.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 64 MB of free RAM (Nginx is very lightweight)
- Ports 80 and 443 available
- A domain name (optional, required for SSL)

## Docker Compose Configuration

Create a directory for Nginx:

```bash
mkdir -p ~/nginx && cd ~/nginx
```

Create an `nginx.conf` file. This example configures Nginx as a reverse proxy for self-hosted services:

```nginx
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # Default server — returns 444 for unmatched requests
    server {
        listen 80 default_server;
        server_name _;
        return 444;
    }

    # Example: Reverse proxy for a self-hosted app
    server {
        listen 80;
        server_name app.example.com;

        location / {
            proxy_pass http://myapp:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }

    # Include additional site configs
    include /etc/nginx/conf.d/*.conf;
}
```

Create a `docker-compose.yml`:

```yaml
services:
  nginx:
    image: nginx:1.28.2
    container_name: nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro      # Main config
      - ./conf.d:/etc/nginx/conf.d:ro               # Additional site configs
      - ./certs:/etc/nginx/certs:ro                  # SSL certificates
      - ./html:/usr/share/nginx/html:ro              # Static files
      - nginx-logs:/var/log/nginx                    # Log files
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

volumes:
  nginx-logs:
```

Create the supporting directories:

```bash
mkdir -p conf.d certs html
```

Start Nginx:

```bash
docker compose up -d
```

## Initial Setup

After starting, verify Nginx is running:

```bash
docker compose logs nginx
```

You should see Nginx start without errors. Test with:

```bash
curl -I http://localhost
```

An unmatched request returns a 444 (connection closed) if you used the default server block above. Requests matching your configured `server_name` are proxied to the backend.

## Configuration

### Adding a New Proxied Service

Create a file in `conf.d/` for each service. For example, `conf.d/jellyfin.conf`:

```nginx
server {
    listen 80;
    server_name jellyfin.example.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://jellyfin:8096;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Reload Nginx without downtime:

```bash
docker exec nginx nginx -s reload
```

### SSL with Let's Encrypt

Nginx does not provision certificates automatically. Use [Certbot](https://certbot.eff.org/) or mount certificates from another source. Example with pre-existing certificates:

```nginx
server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/nginx/certs/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/app.example.com/privkey.pem;

    # Modern TLS settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://myapp:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name app.example.com;
    return 301 https://$server_name$request_uri;
}
```

### Environment Variable Substitution

Nginx's Docker image supports template-based configuration. Place `.template` files in `/etc/nginx/templates/` and use `${VARIABLE}` syntax:

Create `templates/default.conf.template`:

```nginx
server {
    listen ${NGINX_PORT};
    server_name ${NGINX_HOST};

    location / {
        proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT};
    }
}
```

Update your Compose file:

```yaml
services:
  nginx:
    image: nginx:1.28.2
    environment:
      NGINX_PORT: "80"
      NGINX_HOST: "app.example.com"
      BACKEND_HOST: "myapp"
      BACKEND_PORT: "8080"
    volumes:
      - ./templates:/etc/nginx/templates:ro
```

The entrypoint script processes templates and outputs to `/etc/nginx/conf.d/` automatically on startup.

## Advanced Configuration (Optional)

### Rate Limiting

```nginx
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend:8080;
        }
    }
}
```

### Caching

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=static:10m max_size=1g;

server {
    location /static/ {
        proxy_cache static;
        proxy_cache_valid 200 1d;
        proxy_pass http://backend:8080;
    }
}
```

### Running Read-Only

For security, run the container with a read-only filesystem:

```yaml
services:
  nginx:
    image: nginx:1.28.2
    read_only: true
    tmpfs:
      - /var/cache/nginx
      - /var/run
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

## Reverse Proxy

Nginx IS the reverse proxy. If you need to put Nginx behind another reverse proxy (e.g., in a layered setup), set the `X-Forwarded-*` headers and configure `set_real_ip_from` to trust the upstream proxy:

```nginx
set_real_ip_from 172.16.0.0/12;  # Docker network range
real_ip_header X-Forwarded-For;
```

For simpler reverse proxy management, consider [Nginx Proxy Manager](/apps/nginx-proxy-manager), [Caddy](/apps/caddy), or [Traefik](/apps/traefik).

## Backup

Back up these files:

- `nginx.conf` — main configuration
- `conf.d/` — site-specific configs
- `certs/` — SSL certificates and private keys
- `html/` — static content

Nginx configuration is entirely file-based, so standard file backup works. See [Backup Strategy](/foundations/backup-3-2-1-rule) for a general approach.

## Troubleshooting

### 502 Bad Gateway

**Symptom:** Nginx returns 502 when proxying to a backend.
**Fix:** The backend container is not reachable. Verify the container is running (`docker compose ps`), check the service name matches your `proxy_pass` directive, and ensure both containers are on the same Docker network. Check backend logs for startup errors.

### Config Test Fails on Reload

**Symptom:** `nginx -s reload` returns an error.
**Fix:** Always test before reloading: `docker exec nginx nginx -t`. This validates syntax and catches typos before applying changes.

### Permission Denied on Port 80/443

**Symptom:** Nginx cannot bind to ports 80 or 443.
**Fix:** Another service is using these ports. Check with `ss -tlnp | grep ':80\|:443'`. Stop the conflicting service or change Nginx's port mappings.

### SSL Certificate Not Found

**Symptom:** Nginx fails to start with "cannot load certificate" error.
**Fix:** Verify the certificate path in `ssl_certificate` matches the volume mount path. Ensure the certificate files are readable inside the container: `docker exec nginx ls -la /etc/nginx/certs/`.

### Logs Not Appearing

**Symptom:** No access or error logs visible.
**Fix:** By default, Nginx's Docker image sends logs to stdout/stderr (via symlinks). If you mount `/var/log/nginx/` as a volume, the symlinks are replaced and logs go to files instead. Either read the files in the volume or remove the volume mount to use Docker's log driver.

## Resource Requirements

- **RAM:** 10-30 MB idle, 50-100 MB under moderate load
- **CPU:** Very low — Nginx is one of the most efficient reverse proxies
- **Disk:** ~60 MB for the Docker image, plus your config and log files

## Verdict

Nginx is the most battle-tested reverse proxy available. It handles anything you throw at it with minimal resources. But for self-hosting, **it is not the best choice for most people.** Manual SSL setup, verbose config syntax, and no web UI make it harder to use than [Caddy](/apps/caddy) (simpler config, automatic HTTPS) or [Nginx Proxy Manager](/apps/nginx-proxy-manager) (web UI, automatic SSL).

Use plain Nginx if you need maximum control, custom caching rules, rate limiting, or complex routing logic that other proxies cannot handle. For typical homelab reverse proxying, Caddy or NPM will get you there faster with less maintenance.

## FAQ

### Should I use Nginx or Nginx Proxy Manager?

If you want a web UI and automatic SSL management, use [Nginx Proxy Manager](/apps/nginx-proxy-manager). If you need full control over Nginx configuration (custom caching, rate limiting, complex routing), use plain Nginx. NPM is built on Nginx internally, so you're using the same engine either way.

### How do I reload config without restarting?

Run `docker exec nginx nginx -s reload`. This performs a graceful reload — existing connections finish processing while new connections use the updated config.

### Should I use the Alpine or Debian variant?

Both work identically. The Alpine variant (`nginx:1.28.2-alpine`) is smaller (~10 MB vs ~60 MB) but uses musl libc. For most self-hosting use cases, either is fine. Use the Debian variant if you need to install additional packages.

## Related

- [How to Self-Host Nginx Proxy Manager](/apps/nginx-proxy-manager)
- [How to Self-Host Traefik with Docker](/apps/traefik)
- [How to Self-Host Caddy with Docker](/apps/caddy)
- [Caddy vs Nginx](/compare/caddy-vs-nginx)
- [Nginx Proxy Manager vs Traefik](/compare/nginx-proxy-manager-vs-traefik)
- [Best Self-Hosted Reverse Proxy](/best/reverse-proxy)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [SSL Certificates Explained](/foundations/ssl-certificates)
- [Docker Compose Basics](/foundations/docker-compose-basics)
